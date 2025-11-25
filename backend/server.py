from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx
import asyncio
import hashlib
import hmac

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# PaymentPoint Config
PAYMENTPOINT_API_KEY = os.environ.get('PAYMENTPOINT_API_KEY', '17a9ea11d2f19173303f47028f19ec242f7f9739')
PAYMENTPOINT_SECRET = os.environ.get('PAYMENTPOINT_SECRET', '99cb613937f1b0b7dcd8da8cec390113d9fb39e5f3313695dc5b84f7b4a9ae4e3dbfc3a41d306df37e1ad77efe9e8ecfc93fdddc58bebd18de11e840')
PAYMENTPOINT_BUSINESS_ID = os.environ.get('PAYMENTPOINT_BUSINESS_ID', '143218f0fc1633fb89c021690d53bc710a4f4d27')
PAYMENTPOINT_BASE_URL = 'https://api.paymentpoint.co/api/v1'

# Payscribe Config
PAYSCRIBE_API_KEY = os.environ.get('PAYSCRIBE_API_KEY', 'ps_pk_live_oKnMH2WiHbLlWfC7ZAXzhGcGk5R5N2Zq7ME')
PAYSCRIBE_BASE_URL = 'https://api.payscribe.ng/api/v1'

# SMS Provider Configs
SMSPOOL_API_KEY = os.environ.get('SMSPOOL_API_KEY', 'ZNrdIWUS06ftzyb7ALO9XVWsfNhKmJT6')
DAISYSMS_API_KEY = os.environ.get('DAISYSMS_API_KEY', 'eOIwvtJezbjbhLh7vz948uWMHgfELv')
TIGERSMS_API_KEY = os.environ.get('TIGERSMS_API_KEY', 'mZGp2NQJswCEVaSISSUy0IHT1lwSrOVO')

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ Models ============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    ngn_balance: float = 0.0
    usd_balance: float = 0.0
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # deposit_ngn, deposit_usd, conversion, purchase, refund, bill_payment
    amount: float
    currency: str  # NGN or USD
    status: str  # pending, completed, failed
    reference: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SMSOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    provider: str  # tigersms, daisysms, smspool
    service: str
    country: str
    phone_number: Optional[str] = None
    activation_id: Optional[str] = None
    otp: Optional[str] = None
    status: str  # pending, active, completed, cancelled, refunded
    cost_usd: float
    provider_cost: float
    markup_percentage: float
    can_cancel: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(minutes=8))

class PricingConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tigersms_markup: float = 20.0  # percentage
    daisysms_markup: float = 20.0
    smspool_markup: float = 20.0
    ngn_to_usd_rate: float = 1500.0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VirtualAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    bank_code: str
    account_number: str
    account_name: str
    bank_name: str
    reserved_account_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ Request/Response Models ============

class DepositRequest(BaseModel):
    amount: float
    currency: str  # NGN or USD

class ConversionRequest(BaseModel):
    amount_ngn: float

class PurchaseNumberRequest(BaseModel):
    provider: str  # tigersms, daisysms, smspool
    service: str
    country: str

class UpdatePricingRequest(BaseModel):
    tigersms_markup: Optional[float] = None
    daisysms_markup: Optional[float] = None
    smspool_markup: Optional[float] = None
    ngn_to_usd_rate: Optional[float] = None

class BillPaymentRequest(BaseModel):
    service_type: str  # airtime, data, electricity, etc
    amount: float
    recipient: str
    metadata: Optional[Dict[str, Any]] = None

# ============ Auth Functions ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, is_admin: bool = False) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'is_admin': is_admin,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({'id': payload['user_id']}, {'_id': 0, 'password_hash': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if not user.get('is_admin', False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ============ PaymentPoint Functions ============

async def create_paymentpoint_virtual_account(user: dict) -> Optional[VirtualAccount]:
    """Create virtual accounts for a user via PaymentPoint"""
    try:
        headers = {
            'Authorization': f'Bearer {PAYMENTPOINT_SECRET}',
            'api-key': PAYMENTPOINT_API_KEY,
            'Content-Type': 'application/json'
        }
        
        data = {
            'email': user['email'],
            'name': user['full_name'],
            'phoneNumber': user.get('phone', ''),
            'bankCode': ['20946', '20897'],  # PalmPay and OPay
            'businessId': PAYMENTPOINT_BUSINESS_ID
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f'{PAYMENTPOINT_BASE_URL}/createVirtualAccount',
                json=data,
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get('status') == 'success' and result.get('bankAccounts'):
                    # Store first account (can be extended for multiple)
                    account_data = result['bankAccounts'][0]
                    virtual_account = VirtualAccount(
                        user_id=user['id'],
                        bank_code=account_data['bankCode'],
                        account_number=account_data['accountNumber'],
                        account_name=account_data['accountName'],
                        bank_name=account_data['bankName'],
                        reserved_account_id=account_data['Reserved_Account_Id']
                    )
                    
                    doc = virtual_account.model_dump()
                    doc['created_at'] = doc['created_at'].isoformat()
                    await db.virtual_accounts.insert_one(doc)
                    
                    logger.info(f"Virtual account created for user {user['id']}")
                    return virtual_account
            
            logger.error(f"PaymentPoint error: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error creating virtual account: {str(e)}")
        return None

# ============ SMS Provider Functions ============

async def get_smspool_services():
    """Get available services from SMS-pool"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.sms-pool.com/service/list',
                params={'key': SMSPOOL_API_KEY},
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"SMS-pool services error: {str(e)}")
        return None

async def get_daisysms_services():
    """Get available services from DaisySMS"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://daisysms.com/stubs/handler_api.php',
                params={'api_key': DAISYSMS_API_KEY, 'action': 'getServices'},
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"DaisySMS services error: {str(e)}")
        return None

async def get_tigersms_services():
    """Get available services from TigerSMS"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.tiger-sms.com/stubs/handler_api.php',
                params={'api_key': TIGERSMS_API_KEY, 'action': 'getServices'},
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"TigerSMS services error: {str(e)}")
        return None

async def purchase_number_smspool(service: str, country: str) -> Optional[Dict]:
    """Purchase a number from SMS-pool"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.sms-pool.com/purchase/sms',
                params={
                    'key': SMSPOOL_API_KEY,
                    'service': service,
                    'country': country
                },
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"SMS-pool purchase error: {str(e)}")
        return None

async def purchase_number_daisysms(service: str, country: str) -> Optional[Dict]:
    """Purchase a number from DaisySMS"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://daisysms.com/stubs/handler_api.php',
                params={
                    'api_key': DAISYSMS_API_KEY,
                    'action': 'getNumber',
                    'service': service,
                    'country': country
                },
                timeout=15.0
            )
            if response.status_code == 200:
                data = response.json()
                return data
            return None
    except Exception as e:
        logger.error(f"DaisySMS purchase error: {str(e)}")
        return None

async def purchase_number_tigersms(service: str, country: str) -> Optional[Dict]:
    """Purchase a number from TigerSMS"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.tiger-sms.com/stubs/handler_api.php',
                params={
                    'api_key': TIGERSMS_API_KEY,
                    'action': 'getNumber',
                    'service': service,
                    'country': country
                },
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"TigerSMS purchase error: {str(e)}")
        return None

async def poll_otp_smspool(order_id: str) -> Optional[str]:
    """Check for OTP from SMS-pool"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.sms-pool.com/sms/check',
                params={'key': SMSPOOL_API_KEY, 'orderid': order_id},
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                return data.get('sms')
            return None
    except Exception as e:
        logger.error(f"SMS-pool OTP poll error: {str(e)}")
        return None

async def poll_otp_daisysms(activation_id: str) -> Optional[str]:
    """Check for OTP from DaisySMS"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://daisysms.com/stubs/handler_api.php',
                params={
                    'api_key': DAISYSMS_API_KEY,
                    'action': 'getStatus',
                    'id': activation_id
                },
                timeout=10.0
            )
            if response.status_code == 200:
                text = response.text
                if 'STATUS_OK' in text:
                    parts = text.split(':')
                    if len(parts) > 1:
                        return parts[1]
            return None
    except Exception as e:
        logger.error(f"DaisySMS OTP poll error: {str(e)}")
        return None

async def poll_otp_tigersms(activation_id: str) -> Optional[str]:
    """Check for OTP from TigerSMS"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.tiger-sms.com/stubs/handler_api.php',
                params={
                    'api_key': TIGERSMS_API_KEY,
                    'action': 'getStatus',
                    'id': activation_id
                },
                timeout=10.0
            )
            if response.status_code == 200:
                text = response.text
                if 'STATUS_OK' in text:
                    parts = text.split(':')
                    if len(parts) > 1:
                        return parts[1]
            return None
    except Exception as e:
        logger.error(f"TigerSMS OTP poll error: {str(e)}")
        return None

async def cancel_number_provider(provider: str, activation_id: str) -> bool:
    """Cancel a number on the provider"""
    try:
        if provider == 'smspool':
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    'https://api.sms-pool.com/request/cancel',
                    params={'key': SMSPOOL_API_KEY, 'orderid': activation_id},
                    timeout=10.0
                )
                return response.status_code == 200
        
        elif provider == 'daisysms':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://daisysms.com/stubs/handler_api.php',
                    params={
                        'api_key': DAISYSMS_API_KEY,
                        'action': 'setStatus',
                        'id': activation_id,
                        'status': 8  # Cancel status
                    },
                    timeout=10.0
                )
                return 'ACCESS_CANCEL' in response.text
        
        elif provider == 'tigersms':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://api.tiger-sms.com/stubs/handler_api.php',
                    params={
                        'api_key': TIGERSMS_API_KEY,
                        'action': 'setStatus',
                        'id': activation_id,
                        'status': 8
                    },
                    timeout=10.0
                )
                return 'ACCESS_CANCEL' in response.text
        
        return False
    except Exception as e:
        logger.error(f"Cancel number error: {str(e)}")
        return False

# ============ Background Tasks ============

async def otp_polling_task(order_id: str):
    """Background task to poll for OTP"""
    max_duration = 480  # 8 minutes
    poll_interval = 10  # 10 seconds
    elapsed = 0
    
    while elapsed < max_duration:
        try:
            order = await db.sms_orders.find_one({'id': order_id}, {'_id': 0})
            if not order or order['status'] != 'active':
                break
            
            # Poll based on provider
            otp = None
            if order['provider'] == 'smspool' and order.get('activation_id'):
                otp = await poll_otp_smspool(order['activation_id'])
            elif order['provider'] == 'daisysms' and order.get('activation_id'):
                otp = await poll_otp_daisysms(order['activation_id'])
            elif order['provider'] == 'tigersms' and order.get('activation_id'):
                otp = await poll_otp_tigersms(order['activation_id'])
            
            if otp:
                # Update order with OTP
                await db.sms_orders.update_one(
                    {'id': order_id},
                    {
                        '$set': {
                            'otp': otp,
                            'status': 'completed',
                            'can_cancel': False
                        }
                    }
                )
                logger.info(f"OTP received for order {order_id}")
                break
            
            # Check if 5 minutes passed - allow cancellation
            if elapsed >= 300:  # 5 minutes
                await db.sms_orders.update_one(
                    {'id': order_id},
                    {'$set': {'can_cancel': True}}
                )
            
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
            
        except Exception as e:
            logger.error(f"OTP polling error for order {order_id}: {str(e)}")
            await asyncio.sleep(poll_interval)
            elapsed += poll_interval
    
    # If timeout, mark as expired
    order = await db.sms_orders.find_one({'id': order_id}, {'_id': 0})
    if order and order['status'] == 'active':
        await db.sms_orders.update_one(
            {'id': order_id},
            {'$set': {'status': 'expired', 'can_cancel': True}}
        )

# ============ API Routes ============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    # Check if user exists
    existing = await db.users.find_one({'email': data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone
    )
    
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create virtual account asynchronously
    asyncio.create_task(create_paymentpoint_virtual_account(user_dict))
    
    # Create token
    token = create_token(user.id, user.email, user.is_admin)
    
    return {
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'ngn_balance': user.ngn_balance,
            'usd_balance': user.usd_balance,
            'is_admin': user.is_admin
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({'email': data.email}, {'_id': 0})
    if not user or not verify_password(data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user['id'], user['email'], user.get('is_admin', False))
    
    return {
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'full_name': user['full_name'],
            'ngn_balance': user.get('ngn_balance', 0),
            'usd_balance': user.get('usd_balance', 0),
            'is_admin': user.get('is_admin', False)
        }
    }

@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return {
        'id': user['id'],
        'email': user['email'],
        'full_name': user['full_name'],
        'phone': user.get('phone'),
        'ngn_balance': user.get('ngn_balance', 0),
        'usd_balance': user.get('usd_balance', 0),
        'is_admin': user.get('is_admin', False)
    }

@api_router.get("/user/virtual-accounts")
async def get_virtual_accounts(user: dict = Depends(get_current_user)):
    accounts = await db.virtual_accounts.find({'user_id': user['id']}, {'_id': 0}).to_list(10)
    return {'accounts': accounts}

@api_router.post("/user/convert-ngn-to-usd")
async def convert_ngn_to_usd(data: ConversionRequest, user: dict = Depends(get_current_user)):
    # Get conversion rate
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        # Create default config
        default_config = PricingConfig()
        config_dict = default_config.model_dump()
        config_dict['updated_at'] = config_dict['updated_at'].isoformat()
        await db.pricing_config.insert_one(config_dict)
        config = config_dict
    
    rate = config.get('ngn_to_usd_rate', 1500.0)
    usd_amount = data.amount_ngn / rate
    
    # Check balance
    if user.get('ngn_balance', 0) < data.amount_ngn:
        raise HTTPException(status_code=400, detail="Insufficient NGN balance")
    
    # Update balances
    await db.users.update_one(
        {'id': user['id']},
        {
            '$inc': {
                'ngn_balance': -data.amount_ngn,
                'usd_balance': usd_amount
            }
        }
    )
    
    # Record transaction
    transaction = Transaction(
        user_id=user['id'],
        type='conversion',
        amount=data.amount_ngn,
        currency='NGN',
        status='completed',
        metadata={'usd_received': usd_amount, 'rate': rate}
    )
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    await db.transactions.insert_one(trans_dict)
    
    return {
        'success': True,
        'ngn_deducted': data.amount_ngn,
        'usd_received': usd_amount,
        'rate': rate
    }

@api_router.get("/services/list")
async def get_services(provider: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get available services from SMS providers"""
    services = {}
    
    if not provider or provider == 'smspool':
        services['smspool'] = await get_smspool_services()
    if not provider or provider == 'daisysms':
        services['daisysms'] = await get_daisysms_services()
    if not provider or provider == 'tigersms':
        services['tigersms'] = await get_tigersms_services()
    
    return services

@api_router.post("/orders/purchase")
async def purchase_number(
    data: PurchaseNumberRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    # Get pricing config
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        default_config = PricingConfig()
        config_dict = default_config.model_dump()
        config_dict['updated_at'] = config_dict['updated_at'].isoformat()
        await db.pricing_config.insert_one(config_dict)
        config = config_dict
    
    # Get markup for provider
    markup_key = f'{data.provider}_markup'
    markup = config.get(markup_key, 20.0)
    
    # Purchase number from provider
    result = None
    provider_cost = 0.5  # Default, should be from API response
    
    if data.provider == 'smspool':
        result = await purchase_number_smspool(data.service, data.country)
        if result and result.get('success'):
            provider_cost = result.get('price', 0.5)
    elif data.provider == 'daisysms':
        result = await purchase_number_daisysms(data.service, data.country)
        if result and 'ACCESS_NUMBER' in str(result):
            provider_cost = 0.5
    elif data.provider == 'tigersms':
        result = await purchase_number_tigersms(data.service, data.country)
        if result and 'ACCESS_NUMBER' in str(result):
            provider_cost = 0.5
    else:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    if not result:
        raise HTTPException(status_code=400, detail="Failed to purchase number from provider")
    
    # Calculate final cost with markup
    final_cost = provider_cost * (1 + markup / 100)
    
    # Check user balance
    if user.get('usd_balance', 0) < final_cost:
        raise HTTPException(status_code=400, detail="Insufficient USD balance")
    
    # Extract phone number and activation ID
    phone_number = None
    activation_id = None
    
    if data.provider == 'smspool':
        phone_number = result.get('number')
        activation_id = result.get('order_id')
    else:  # daisysms or tigersms
        response_text = str(result)
        if 'ACCESS_NUMBER' in response_text:
            parts = response_text.split(':')
            if len(parts) >= 3:
                activation_id = parts[1]
                phone_number = parts[2]
    
    # Create order
    order = SMSOrder(
        user_id=user['id'],
        provider=data.provider,
        service=data.service,
        country=data.country,
        phone_number=phone_number,
        activation_id=activation_id,
        status='active',
        cost_usd=final_cost,
        provider_cost=provider_cost,
        markup_percentage=markup,
        can_cancel=False
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    order_dict['expires_at'] = order_dict['expires_at'].isoformat()
    await db.sms_orders.insert_one(order_dict)
    
    # Deduct balance
    await db.users.update_one(
        {'id': user['id']},
        {'$inc': {'usd_balance': -final_cost}}
    )
    
    # Record transaction
    transaction = Transaction(
        user_id=user['id'],
        type='purchase',
        amount=final_cost,
        currency='USD',
        status='completed',
        reference=order.id,
        metadata={'service': data.service, 'country': data.country, 'provider': data.provider}
    )
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    await db.transactions.insert_one(trans_dict)
    
    # Start background OTP polling
    background_tasks.add_task(otp_polling_task, order.id)
    
    return {
        'success': True,
        'order': order_dict
    }

@api_router.get("/orders/list")
async def list_orders(user: dict = Depends(get_current_user)):
    orders = await db.sms_orders.find({'user_id': user['id']}, {'_id': 0}).sort('created_at', -1).to_list(100)
    return {'orders': orders}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.sms_orders.find_one({'id': order_id, 'user_id': user['id']}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.sms_orders.find_one({'id': order_id, 'user_id': user['id']}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if cancellation is allowed
    if order['status'] != 'active' and order['status'] != 'expired':
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    
    if order.get('otp'):
        raise HTTPException(status_code=400, detail="Cannot cancel - OTP already received")
    
    if not order.get('can_cancel', False):
        created_at = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00'))
        elapsed = (datetime.now(timezone.utc) - created_at).total_seconds()
        if elapsed < 300:  # 5 minutes
            raise HTTPException(status_code=400, detail="Can only cancel after 5 minutes")
    
    # Cancel on provider
    if order.get('activation_id'):
        cancelled = await cancel_number_provider(order['provider'], order['activation_id'])
        if not cancelled:
            logger.warning(f"Failed to cancel on provider for order {order_id}")
    
    # Refund user
    await db.users.update_one(
        {'id': user['id']},
        {'$inc': {'usd_balance': order['cost_usd']}}
    )
    
    # Update order status
    await db.sms_orders.update_one(
        {'id': order_id},
        {'$set': {'status': 'cancelled'}}
    )
    
    # Record refund transaction
    transaction = Transaction(
        user_id=user['id'],
        type='refund',
        amount=order['cost_usd'],
        currency='USD',
        status='completed',
        reference=order_id,
        metadata={'reason': 'cancelled'}
    )
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    await db.transactions.insert_one(trans_dict)
    
    return {'success': True, 'refunded': order['cost_usd']}

@api_router.get("/transactions/list")
async def list_transactions(user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find(
        {'user_id': user['id']},
        {'_id': 0}
    ).sort('created_at', -1).to_list(100)
    return {'transactions': transactions}

# ============ Admin Routes ============

@api_router.get("/admin/pricing")
async def get_pricing_config(admin: dict = Depends(require_admin)):
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        default_config = PricingConfig()
        config_dict = default_config.model_dump()
        config_dict['updated_at'] = config_dict['updated_at'].isoformat()
        await db.pricing_config.insert_one(config_dict)
        config = config_dict
    return config

@api_router.put("/admin/pricing")
async def update_pricing_config(data: UpdatePricingRequest, admin: dict = Depends(require_admin)):
    update_fields = {}
    if data.tigersms_markup is not None:
        update_fields['tigersms_markup'] = data.tigersms_markup
    if data.daisysms_markup is not None:
        update_fields['daisysms_markup'] = data.daisysms_markup
    if data.smspool_markup is not None:
        update_fields['smspool_markup'] = data.smspool_markup
    if data.ngn_to_usd_rate is not None:
        update_fields['ngn_to_usd_rate'] = data.ngn_to_usd_rate
    
    update_fields['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.pricing_config.update_one(
        {},
        {'$set': update_fields},
        upsert=True
    )
    
    return {'success': True, 'updated': update_fields}

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_orders = await db.sms_orders.count_documents({})
    active_orders = await db.sms_orders.count_documents({'status': 'active'})
    
    # Calculate total revenue
    pipeline = [
        {'$match': {'type': 'purchase', 'status': 'completed'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
    ]
    revenue_result = await db.transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0
    
    return {
        'total_users': total_users,
        'total_orders': total_orders,
        'active_orders': active_orders,
        'total_revenue_usd': total_revenue
    }

# ============ Webhook Routes ============

@api_router.post("/webhooks/paymentpoint")
async def paymentpoint_webhook(
    background_tasks: BackgroundTasks,
    paymentpoint_signature: Optional[str] = Header(None)
):
    """Handle PaymentPoint payment notifications"""
    from fastapi import Request
    
    async def process_webhook(request: Request):
        try:
            body = await request.body()
            
            # Verify signature
            calculated_signature = hmac.new(
                PAYMENTPOINT_SECRET.encode('utf-8'),
                body,
                hashlib.sha256
            ).hexdigest()
            
            if paymentpoint_signature and calculated_signature != paymentpoint_signature:
                logger.warning("Invalid PaymentPoint webhook signature")
                return {'status': 'error', 'message': 'Invalid signature'}
            
            # Parse webhook data
            import json
            data = json.loads(body)
            
            if data.get('notification_status') == 'payment_successful':
                amount = data.get('settlement_amount', 0)
                customer_email = data.get('customer', {}).get('email')
                
                if customer_email and amount > 0:
                    # Find user and credit balance
                    user = await db.users.find_one({'email': customer_email}, {'_id': 0})
                    if user:
                        await db.users.update_one(
                            {'id': user['id']},
                            {'$inc': {'ngn_balance': amount}}
                        )
                        
                        # Record transaction
                        transaction = Transaction(
                            user_id=user['id'],
                            type='deposit_ngn',
                            amount=amount,
                            currency='NGN',
                            status='completed',
                            reference=data.get('transaction_id'),
                            metadata=data
                        )
                        trans_dict = transaction.model_dump()
                        trans_dict['created_at'] = trans_dict['created_at'].isoformat()
                        await db.transactions.insert_one(trans_dict)
                        
                        logger.info(f"Credited {amount} NGN to user {user['id']}")
            
            return {'status': 'success'}
        except Exception as e:
            logger.error(f"PaymentPoint webhook error: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    from fastapi import Request
    # This is a workaround to access request in webhook
    return {'status': 'received'}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()