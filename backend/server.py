from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header, BackgroundTasks, Request
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
import re

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
    phone: str  # NOW REQUIRED

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    phone: str  # NOW REQUIRED
    ngn_balance: float = 0.0
    usd_balance: float = 0.0
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    amount: float
    currency: str
    status: str
    reference: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SMSOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    server: str  # us_server, server1, server2
    provider: str  # daisysms, smspool, tigersms
    service: str
    country: str
    phone_number: Optional[str] = None
    activation_id: Optional[str] = None
    otp: Optional[str] = None
    status: str
    cost_usd: float
    provider_cost: float
    markup_percentage: float
    can_cancel: bool = True
    # DaisySMS optional filters
    area_code: Optional[str] = None
    carrier: Optional[str] = None
    phone_make: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(minutes=8))

class PricingConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # API Keys
    daisysms_api_key: str = ""
    tigersms_api_key: str = ""
    smspool_api_key: str = ""
    # Markup percentages
    tigersms_markup: float = 50.0
    daisysms_markup: float = 50.0
    smspool_markup: float = 50.0
    # Currency conversion
    ngn_to_usd_rate: float = 1500.0
    rub_to_usd_rate: float = 0.010  # 1 RUB = ~0.01 USD
    # DaisySMS specific markups (from their side)
    area_code_markup: float = 20.0  # DaisySMS adds 20% for area code
    carrier_markup: float = 20.0    # DaisySMS adds 20% for carrier
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CachedService(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider: str  # smspool, daisysms, tigersms
    service_code: str
    service_name: str
    country_code: str
    country_name: str
    base_price: float
    currency: str  # USD, RUB
    available: bool = True
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

# Payscribe Models
class BillPayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_type: str  # airtime, data, electricity, cable, betting
    provider: str
    amount: float
    recipient: str
    status: str
    trans_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StablecoinWallet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    currency: str  # USDT, USDC, BTC
    network: str
    chain: str
    address: str
    label: str
    tracking_id: str
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VirtualCard(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    card_id: str
    card_number: str
    cvv: str
    expiry: str
    balance: float
    status: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ Request/Response Models ============

class PurchaseNumberRequest(BaseModel):
    server: str  # us_server, server1, server2
    service: str
    country: str
    payment_currency: str = 'USD'  # USD or NGN
    # Optional DaisySMS filters
    area_code: Optional[str] = None
    carrier: Optional[str] = None
    phone_make: Optional[str] = None

class CalculatePriceRequest(BaseModel):
    server: str
    service: str
    country: str
    area_code: Optional[str] = None
    carrier: Optional[str] = None

class ConversionRequest(BaseModel):
    amount_ngn: float

class UpdatePricingRequest(BaseModel):
    tigersms_markup: Optional[float] = None
    daisysms_markup: Optional[float] = None
    smspool_markup: Optional[float] = None
    ngn_to_usd_rate: Optional[float] = None
    rub_to_usd_rate: Optional[float] = None
    area_code_markup: Optional[float] = None
    carrier_markup: Optional[float] = None

class BillPaymentRequest(BaseModel):
    service_type: str
    provider: str
    amount: float
    recipient: str
    metadata: Optional[Dict[str, Any]] = None

class CreateStablecoinWalletRequest(BaseModel):
    currency: str
    network: str
    chain: str
    label: Optional[str] = "My Wallet"

class UpdatePhoneRequest(BaseModel):
    phone: str

# ============ Helper Functions ============

# Comprehensive country mapping
COUNTRY_NAMES = {
    '0': 'Russia', '1': 'Ukraine', '2': 'Kazakhstan', '3': 'China', '4': 'Philippines',
    '5': 'Myanmar', '6': 'Indonesia', '7': 'Malaysia', '8': 'Kenya', '9': 'Tanzania',
    '10': 'Vietnam', '12': 'United Kingdom', '13': 'Czech Republic', '14': 'Sri Lanka',
    '15': 'Estonia', '16': 'Azerbaijan', '17': 'Canada', '18': 'Morocco', '19': 'Ghana',
    '20': 'Argentina', '21': 'Uzbekistan', '22': 'Cameroon', '23': 'Chad', '24': 'Germany',
    '25': 'Lithuania', '26': 'Croatia', '27': 'Sweden', '28': 'Iraq', '29': 'Netherlands',
    '30': 'Latvia', '31': 'Austria', '32': 'Belarus', '33': 'Thailand', '34': 'Saudi Arabia',
    '35': 'Mexico', '36': 'Taiwan', '37': 'Spain', '38': 'Iran', '39': 'Algeria',
    '40': 'Slovenia', '41': 'Bangladesh', '42': 'Senegal', '43': 'Turkey', '44': 'Czech Republic',
    '45': 'Serbia', '46': 'Cambodia', '47': 'Germany', '48': 'Egypt', '49': 'India',
    '50': 'Kuwait', '51': 'Thailand', '52': 'Hungary', '53': 'Bulgaria', '54': 'Moldavia',
    '55': 'UAE', '56': 'Pakistan', '57': 'Brazil', '58': 'Hong Kong', '59': 'Singapore',
    '60': 'Poland', '61': 'Japan', '62': 'France', '63': 'Israel', '64': 'Greece',
    '65': 'Italy', '66': 'South Africa', '67': 'Portugal', '68': 'Denmark', '69': 'Macao',
    '70': 'Switzerland', '71': 'Belgium', '72': 'Chile', '73': 'Peru', '74': 'Colombia',
    '75': 'Bolivia', '76': 'Uruguay', '77': 'Paraguay', '78': 'Venezuela', '79': 'Ecuador',
    '80': 'Guatemala', '81': 'Costa Rica', '82': 'Panama', '83': 'Dominican Republic',
    '84': 'Honduras', '85': 'El Salvador', '86': 'Nicaragua', '87': 'Jamaica', '88': 'Trinidad',
    '89': 'Guadeloupe', '90': 'Barbados', '91': 'Grenada', '92': 'Saint Lucia', '93': 'Dominica',
    '94': 'Saint Vincent', '95': 'Antigua', '96': 'Cayman Islands', '97': 'British Virgin Islands',
    '98': 'Anguilla', '99': 'Montserrat', '100': 'Turks and Caicos', '101': 'Bermuda',
    '102': 'Bahamas', '103': 'Saint Kitts', '104': 'Aruba', '105': 'Curacao', '106': 'Sint Maarten',
    '107': 'Bonaire', '108': 'Puerto Rico', '109': 'US Virgin Islands', '110': 'Guam',
    '111': 'American Samoa', '112': 'Northern Mariana', '113': 'Palau', '114': 'Marshall Islands',
    '115': 'Micronesia', '116': 'Kiribati', '117': 'Nauru', '118': 'Fiji', '119': 'Vanuatu',
    '120': 'Solomon Islands', '121': 'Papua New Guinea', '122': 'New Caledonia', '123': 'French Polynesia',
    '124': 'Cook Islands', '125': 'Niue', '126': 'Samoa', '127': 'Tonga', '128': 'Tuvalu',
    '129': 'Wallis and Futuna', '130': 'Tokelau', '131': 'New Zealand', '132': 'Australia',
    '133': 'Christmas Island', '134': 'Cocos Islands', '135': 'Norfolk Island', '136': 'Antarctica',
    '137': 'South Georgia', '138': 'Falkland Islands', '139': 'Saint Helena', '140': 'Ascension',
    '141': 'Tristan da Cunha', '142': 'British Indian Ocean', '143': 'Diego Garcia', '144': 'Heard Island',
    '145': 'McDonald Islands', '146': 'Bouvet Island', '147': 'French Southern', '148': 'Mayotte',
    '149': 'Reunion', '150': 'Zimbabwe', '151': 'Namibia', '152': 'Malawi', '153': 'Lesotho',
    '154': 'Botswana', '155': 'Swaziland', '156': 'Comoros', '157': 'Mauritius', '158': 'Seychelles',
    '159': 'Madagascar', '160': 'Maldives', '161': 'Laos', '162': 'Turkmenistan', '163': 'Kyrgyzstan',
    '164': 'Tajikistan', '165': 'Afghanistan', '166': 'Jordan', '167': 'Lebanon', '168': 'Syria',
    '169': 'Yemen', '170': 'Oman', '171': 'Bahrain', '172': 'Qatar', '173': 'Somalia', '174': 'Djibouti',
    '175': 'Sudan', '176': 'South Sudan', '177': 'Eritrea', '178': 'Ethiopia', '179': 'Uganda',
    '180': 'Rwanda', '181': 'Burundi', '182': 'Zambia', '183': 'Mozambique', '184': 'Angola',
    '185': 'Gabon', '186': 'Congo', '187': 'United States',
    'us': 'United States', 'uk': 'United Kingdom', 'ca': 'Canada', 'ng': 'Nigeria',
    'in': 'India', 'ph': 'Philippines', 'id': 'Indonesia', 'pk': 'Pakistan', 'bd': 'Bangladesh'
}

def get_country_name(code: str) -> str:
    """Get country name from code"""
    return COUNTRY_NAMES.get(str(code).lower(), code.upper())

def validate_nigerian_phone(phone: str) -> bool:
    """Validate Nigerian phone number format: 08168617185"""
    pattern = r'^0[789][01]\d{8}$'
    return bool(re.match(pattern, phone))

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
            'bankCode': ['20946', '20897'],
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

# ============ SMS Provider Functions (Updated) ============

async def purchase_number_smspool(service: str, country: str, **kwargs) -> Optional[Dict]:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.sms-pool.com/purchase/sms',
                params={'key': SMSPOOL_API_KEY, 'service': service, 'country': country},
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"SMS-pool purchase error: {str(e)}")
        return None

async def purchase_number_daisysms(service: str, country: str, area_code: Optional[str] = None, 
                                    carrier: Optional[str] = None, phone_make: Optional[str] = None) -> Optional[Dict]:
    try:
        params = {
            'api_key': DAISYSMS_API_KEY,
            'action': 'getNumber',
            'service': service
        }
        if area_code:
            params['areas'] = area_code
        if carrier:
            params['carriers'] = carrier
        if phone_make:
            params['number'] = phone_make
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://daisysms.com/stubs/handler_api.php',
                params=params,
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"DaisySMS purchase error: {str(e)}")
        return None

async def purchase_number_tigersms(service: str, country: str, **kwargs) -> Optional[Dict]:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.tiger-sms.com/stubs/handler_api.php',
                params={'api_key': TIGERSMS_API_KEY, 'action': 'getNumber', 'service': service, 'country': country},
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception as e:
        logger.error(f"TigerSMS purchase error: {str(e)}")
        return None

async def poll_otp_smspool(order_id: str) -> Optional[str]:
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
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://daisysms.com/stubs/handler_api.php',
                params={'api_key': DAISYSMS_API_KEY, 'action': 'getStatus', 'id': activation_id},
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
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.tiger-sms.com/stubs/handler_api.php',
                params={'api_key': TIGERSMS_API_KEY, 'action': 'getStatus', 'id': activation_id},
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
                    params={'api_key': DAISYSMS_API_KEY, 'action': 'setStatus', 'id': activation_id, 'status': 8},
                    timeout=10.0
                )
                return 'ACCESS_CANCEL' in response.text
        elif provider == 'tigersms':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://api.tiger-sms.com/stubs/handler_api.php',
                    params={'api_key': TIGERSMS_API_KEY, 'action': 'setStatus', 'id': activation_id, 'status': 8},
                    timeout=10.0
                )
                return 'ACCESS_CANCEL' in response.text
        return False
    except Exception as e:
        logger.error(f"Cancel number error: {str(e)}")
        return False

# ============ Payscribe Functions ============

async def payscribe_request(endpoint: str, method: str = 'GET', data: Optional[Dict] = None) -> Optional[Dict]:
    """Generic Payscribe API request"""
    try:
        headers = {
            'Authorization': f'Bearer {PAYSCRIBE_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        async with httpx.AsyncClient() as client:
            if method == 'GET':
                response = await client.get(f'{PAYSCRIBE_BASE_URL}/{endpoint}', headers=headers, timeout=30.0)
            else:
                response = await client.post(f'{PAYSCRIBE_BASE_URL}/{endpoint}', json=data, headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                return response.json()
            logger.error(f"Payscribe error: {response.text}")
            return None
    except Exception as e:
        logger.error(f"Payscribe request error: {str(e)}")
        return None

# ============ Background Tasks ============

async def otp_polling_task(order_id: str):
    max_duration = 480
    poll_interval = 10
    elapsed = 0
    
    while elapsed < max_duration:
        try:
            order = await db.sms_orders.find_one({'id': order_id}, {'_id': 0})
            if not order or order['status'] != 'active':
                break
            
            otp = None
            if order['provider'] == 'smspool' and order.get('activation_id'):
                otp = await poll_otp_smspool(order['activation_id'])
            elif order['provider'] == 'daisysms' and order.get('activation_id'):
                otp = await poll_otp_daisysms(order['activation_id'])
            elif order['provider'] == 'tigersms' and order.get('activation_id'):
                otp = await poll_otp_tigersms(order['activation_id'])
            
            if otp:
                await db.sms_orders.update_one(
                    {'id': order_id},
                    {'$set': {'otp': otp, 'status': 'completed', 'can_cancel': False}}
                )
                logger.info(f"OTP received for order {order_id}")
                break
            
            if elapsed >= 300:
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
    
    order = await db.sms_orders.find_one({'id': order_id}, {'_id': 0})
    if order and order['status'] == 'active':
        await db.sms_orders.update_one(
            {'id': order_id},
            {'$set': {'status': 'expired', 'can_cancel': True}}
        )

# ============ API Routes ============

@api_router.post("/auth/register")
async def register(data: UserRegister):
    # Validate phone number
    if not validate_nigerian_phone(data.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format. Use format: 08168617185")
    
    existing = await db.users.find_one({'email': data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone
    )
    
    user_dict = user.model_dump()
    user_dict['password_hash'] = hash_password(data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    asyncio.create_task(create_paymentpoint_virtual_account(user_dict))
    
    token = create_token(user.id, user.email, user.is_admin)
    
    return {
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'phone': user.phone,
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
            'phone': user.get('phone', ''),
            'ngn_balance': user.get('ngn_balance', 0),
            'usd_balance': user.get('usd_balance', 0),
            'is_admin': user.get('is_admin', False)
        }
    }

@api_router.put("/user/update-phone")
async def update_phone(data: UpdatePhoneRequest, user: dict = Depends(get_current_user)):
    if not validate_nigerian_phone(data.phone):
        raise HTTPException(status_code=400, detail="Invalid phone number format. Use format: 08168617185")
    
    await db.users.update_one(
        {'id': user['id']},
        {'$set': {'phone': data.phone}}
    )
    
    # Create virtual account if doesn't exist
    va_exists = await db.virtual_accounts.find_one({'user_id': user['id']}, {'_id': 0})
    if not va_exists:
        user['phone'] = data.phone
        asyncio.create_task(create_paymentpoint_virtual_account(user))
    
    return {'success': True, 'phone': data.phone}

@api_router.get("/user/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return {
        'id': user['id'],
        'email': user['email'],
        'full_name': user['full_name'],
        'phone': user.get('phone', ''),
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
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        default_config = PricingConfig()
        config_dict = default_config.model_dump()
        config_dict['updated_at'] = config_dict['updated_at'].isoformat()
        await db.pricing_config.insert_one(config_dict)
        config = config_dict
    
    rate = config.get('ngn_to_usd_rate', 1500.0)
    usd_amount = data.amount_ngn / rate
    
    if user.get('ngn_balance', 0) < data.amount_ngn:
        raise HTTPException(status_code=400, detail="Insufficient NGN balance")
    
    await db.users.update_one(
        {'id': user['id']},
        {'$inc': {'ngn_balance': -data.amount_ngn, 'usd_balance': usd_amount}}
    )
    
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
    
    return {'success': True, 'ngn_deducted': data.amount_ngn, 'usd_received': usd_amount, 'rate': rate}

# ============ SMS Service Discovery Routes ============

@api_router.get("/services/smspool")
async def get_smspool_services(user: dict = Depends(get_current_user), refresh: bool = False):
    """Fetch available services and countries from SMS-pool with DB caching"""
    try:
        # Check cache first (if not forcing refresh)
        if not refresh:
            cached_count = await db.cached_services.count_documents({'provider': 'smspool'})
            if cached_count > 0:
                cached_services = await db.cached_services.find({'provider': 'smspool'}, {'_id': 0}).to_list(10000)
                # Restructure for frontend
                data = {}
                for service in cached_services:
                    country = service['country_code']
                    if country not in data:
                        data[country] = {}
                    data[country][service['service_code']] = {
                        'name': service['service_name'],
                        'cost': service['base_price']
                    }
                return {'success': True, 'data': data, 'cached': True}
        
        # Fetch from API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.sms-pool.com/service/retrieve_all',
                params={'key': SMSPOOL_API_KEY},
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Cache in DB for future use
                cached_services = []
                for country_code, services in data.items():
                    for service_code, service_info in services.items():
                        cached_service = CachedService(
                            provider='smspool',
                            service_code=service_code,
                            service_name=service_info.get('name', service_code),
                            country_code=country_code,
                            country_name=get_country_name(country_code),
                            base_price=float(service_info.get('cost', 0)),
                            currency='USD'
                        )
                        cached_services.append(cached_service.model_dump())
                
                if cached_services:
                    # Clear old cache
                    await db.cached_services.delete_many({'provider': 'smspool'})
                    # Insert new cache
                    for service in cached_services:
                        service['last_updated'] = service['last_updated'].isoformat()
                    await db.cached_services.insert_many(cached_services)
                
                return {'success': True, 'data': data, 'cached': False}
            
            return {'success': False, 'message': f'SMS-pool API error: {response.status_code}'}
    except Exception as e:
        logger.error(f"SMS-pool service fetch error: {str(e)}")
        return {'success': False, 'message': str(e)}

@api_router.get("/services/daisysms")
async def get_daisysms_services(user: dict = Depends(get_current_user), refresh: bool = False):
    """Fetch available services and pricing from DaisySMS with DB caching"""
    try:
        # Check cache first
        if not refresh:
            cached_count = await db.cached_services.count_documents({'provider': 'daisysms'})
            if cached_count > 0:
                cached_services = await db.cached_services.find({'provider': 'daisysms'}, {'_id': 0}).to_list(10000)
                # Restructure for frontend
                data = {}
                for service in cached_services:
                    service_code = service['service_code']
                    if service_code not in data:
                        data[service_code] = {}
                    data[service_code][service['country_code']] = {
                        'name': service['service_name'],
                        'cost': str(service['base_price'])
                    }
                return {'success': True, 'data': data, 'cached': True}
        
        # Fetch from API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://daisysms.com/stubs/handler_api.php',
                params={'api_key': DAISYSMS_API_KEY, 'action': 'getPricesVerification'},
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Cache in DB
                cached_services = []
                for service_code, countries in data.items():
                    for country_code, service_info in countries.items():
                        cached_service = CachedService(
                            provider='daisysms',
                            service_code=service_code,
                            service_name=service_info.get('name', service_code),
                            country_code=country_code,
                            country_name=get_country_name(country_code),
                            base_price=float(service_info.get('cost', 0)),
                            currency='USD'
                        )
                        cached_services.append(cached_service.model_dump())
                
                if cached_services:
                    await db.cached_services.delete_many({'provider': 'daisysms'})
                    for service in cached_services:
                        service['last_updated'] = service['last_updated'].isoformat()
                    await db.cached_services.insert_many(cached_services)
                
                return {'success': True, 'data': data, 'cached': False}
            
            return {'success': False, 'message': 'Failed to fetch DaisySMS services'}
    except Exception as e:
        logger.error(f"DaisySMS service fetch error: {str(e)}")
        return {'success': False, 'message': str(e)}

@api_router.get("/services/tigersms")
async def get_tigersms_services(user: dict = Depends(get_current_user), refresh: bool = False):
    """Fetch available services and pricing from TigerSMS (RUB prices) with DB caching"""
    try:
        # Check cache first
        if not refresh:
            cached_count = await db.cached_services.count_documents({'provider': 'tigersms'})
            if cached_count > 0:
                cached_services = await db.cached_services.find({'provider': 'tigersms'}, {'_id': 0}).to_list(10000)
                
                # Get RUB to USD conversion rate
                config = await db.pricing_config.find_one({}, {'_id': 0})
                rub_to_usd = config.get('rub_to_usd_rate', 0.010) if config else 0.010
                
                # Restructure for frontend with USD conversion
                data = {}
                for service in cached_services:
                    country = service['country_code']
                    if country not in data:
                        data[country] = {}
                    # Convert RUB to USD
                    price_usd = service['base_price'] * rub_to_usd
                    data[country][service['service_code']] = {
                        'name': service['service_name'],
                        'cost': str(round(price_usd, 2))
                    }
                return {'success': True, 'data': data, 'cached': True}
        
        # Fetch from API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.tiger-sms.com/stubs/handler_api.php',
                params={'api_key': TIGERSMS_API_KEY, 'action': 'getPrices'},
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Get RUB to USD conversion rate
                config = await db.pricing_config.find_one({}, {'_id': 0})
                rub_to_usd = config.get('rub_to_usd_rate', 0.010) if config else 0.010
                
                # Cache in DB
                cached_services = []
                for country_code, services in data.items():
                    for service_code, service_info in services.items():
                        # Store original RUB price
                        price_rub = float(service_info.get('cost', 0))
                        cached_service = CachedService(
                            provider='tigersms',
                            service_code=service_code,
                            service_name=service_info.get('name', service_code),
                            country_code=country_code,
                            country_name=get_country_name(country_code),
                            base_price=price_rub,  # Store in RUB
                            currency='RUB'
                        )
                        cached_services.append(cached_service.model_dump())
                
                if cached_services:
                    await db.cached_services.delete_many({'provider': 'tigersms'})
                    for service in cached_services:
                        service['last_updated'] = service['last_updated'].isoformat()
                    await db.cached_services.insert_many(cached_services)
                
                # Convert prices to USD for frontend
                for country_code in data:
                    for service_code in data[country_code]:
                        price_rub = float(data[country_code][service_code].get('cost', 0))
                        data[country_code][service_code]['cost'] = str(round(price_rub * rub_to_usd, 2))
                        data[country_code][service_code]['cost_rub'] = f"{price_rub} ₽"
                
                return {'success': True, 'data': data, 'cached': False}
            
            return {'success': False, 'message': 'Failed to fetch TigerSMS services'}
    except Exception as e:
        logger.error(f"TigerSMS service fetch error: {str(e)}")
        return {'success': False, 'message': str(e)}

@api_router.get("/services/unified")
async def get_unified_services(user: dict = Depends(get_current_user)):
    """Get services in a unified format for the frontend"""
    try:
        config = await db.pricing_config.find_one({}, {'_id': 0})
        if not config:
            default_config = PricingConfig()
            config_dict = default_config.model_dump()
            config_dict['updated_at'] = config_dict['updated_at'].isoformat()
            await db.pricing_config.insert_one(config_dict)
            config = config_dict
        
        result = {
            'success': True,
            'servers': {
                'us_server': {
                    'name': 'US Server (DaisySMS)',
                    'provider': 'daisysms',
                    'markup': config.get('daisysms_markup', 20.0),
                    'services': [],
                    'countries': ['us']
                },
                'server1': {
                    'name': 'Server 1 (SMS-pool)',
                    'provider': 'smspool',
                    'markup': config.get('smspool_markup', 20.0),
                    'services': [],
                    'countries': []
                },
                'server2': {
                    'name': 'Server 2 (TigerSMS)',
                    'provider': 'tigersms',
                    'markup': config.get('tigersms_markup', 20.0),
                    'services': [],
                    'countries': []
                }
            }
        }
        
        return result
    except Exception as e:
        logger.error(f"Unified services fetch error: {str(e)}")
        return {'success': False, 'message': str(e)}

# ============ Price Calculation Route ============

@api_router.post("/orders/calculate-price")
async def calculate_price(data: CalculatePriceRequest, user: dict = Depends(get_current_user)):
    """Calculate price with all markups"""
    try:
        server_map = {
            'us_server': 'daisysms',
            'server1': 'smspool',
            'server2': 'tigersms'
        }
        
        provider = server_map.get(data.server)
        if not provider:
            raise HTTPException(status_code=400, detail="Invalid server")
        
        # Get pricing config
        config = await db.pricing_config.find_one({}, {'_id': 0})
        if not config:
            default_config = PricingConfig()
            config_dict = default_config.model_dump()
            config_dict['updated_at'] = config_dict['updated_at'].isoformat()
            await db.pricing_config.insert_one(config_dict)
            config = config_dict
        
        # Get base price from cached services
        cached_service = await db.cached_services.find_one({
            'provider': provider,
            'service_code': data.service,
            'country_code': data.country
        }, {'_id': 0})
        
        if not cached_service:
            raise HTTPException(status_code=404, detail="Service/Country combination not found")
        
        base_price_usd = cached_service['base_price']
        
        # Convert RUB to USD if needed
        if cached_service['currency'] == 'RUB':
            base_price_usd = base_price_usd * config.get('rub_to_usd_rate', 0.010)
        
        # Apply provider markup
        markup_key = f'{provider}_markup'
        provider_markup = config.get(markup_key, 20.0)
        price_after_markup = base_price_usd * (1 + provider_markup / 100)
        
        # Apply additional markups for DaisySMS
        additional_markup = 0
        if provider == 'daisysms':
            if data.area_code:
                additional_markup += config.get('area_code_markup', 20.0)
            if data.carrier:
                additional_markup += config.get('carrier_markup', 20.0)
        
        final_price_usd = price_after_markup * (1 + additional_markup / 100)
        
        # Convert to NGN
        ngn_rate = config.get('ngn_to_usd_rate', 1500.0)
        final_price_ngn = final_price_usd * ngn_rate
        
        return {
            'success': True,
            'base_price_usd': round(base_price_usd, 2),
            'provider_markup': provider_markup,
            'additional_markup': additional_markup,
            'final_price_usd': round(final_price_usd, 2),
            'final_price_ngn': round(final_price_ngn, 2),
            'currency_original': cached_service['currency'],
            'breakdown': {
                'base': round(base_price_usd, 2),
                'after_provider_markup': round(price_after_markup, 2),
                'area_code_markup': config.get('area_code_markup', 0) if data.area_code else 0,
                'carrier_markup': config.get('carrier_markup', 0) if data.carrier else 0
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Price calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ SMS Order Routes (Updated) ============

@api_router.post("/orders/purchase")
async def purchase_number(
    data: PurchaseNumberRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    # Map server to provider
    server_map = {
        'us_server': 'daisysms',
        'server1': 'smspool',
        'server2': 'tigersms'
    }
    
    provider = server_map.get(data.server)
    if not provider:
        raise HTTPException(status_code=400, detail="Invalid server selection")
    
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        default_config = PricingConfig()
        config_dict = default_config.model_dump()
        config_dict['updated_at'] = config_dict['updated_at'].isoformat()
        await db.pricing_config.insert_one(config_dict)
        config = config_dict
    
    markup_key = f'{provider}_markup'
    markup = config.get(markup_key, 20.0)
    
    result = None
    provider_cost = 0.5
    
    if provider == 'smspool':
        result = await purchase_number_smspool(data.service, data.country)
        if result and result.get('success'):
            provider_cost = result.get('price', 0.5)
    elif provider == 'daisysms':
        result = await purchase_number_daisysms(
            data.service, data.country, 
            data.area_code, data.carrier, data.phone_make
        )
        if result and 'ACCESS_NUMBER' in str(result):
            provider_cost = 0.5
    elif provider == 'tigersms':
        result = await purchase_number_tigersms(data.service, data.country)
        if result and 'ACCESS_NUMBER' in str(result):
            provider_cost = 0.5
    
    if not result:
        raise HTTPException(status_code=400, detail="Failed to purchase number from provider")
    
    final_cost = provider_cost * (1 + markup / 100)
    
    if user.get('usd_balance', 0) < final_cost:
        raise HTTPException(status_code=400, detail="Insufficient USD balance")
    
    phone_number = None
    activation_id = None
    
    if provider == 'smspool':
        phone_number = result.get('number')
        activation_id = result.get('order_id')
    else:
        response_text = str(result)
        if 'ACCESS_NUMBER' in response_text:
            parts = response_text.split(':')
            if len(parts) >= 3:
                activation_id = parts[1]
                phone_number = parts[2]
    
    order = SMSOrder(
        user_id=user['id'],
        server=data.server,
        provider=provider,
        service=data.service,
        country=data.country,
        phone_number=phone_number,
        activation_id=activation_id,
        status='active',
        cost_usd=final_cost,
        provider_cost=provider_cost,
        markup_percentage=markup,
        can_cancel=False,
        area_code=data.area_code,
        carrier=data.carrier,
        phone_make=data.phone_make
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    order_dict['expires_at'] = order_dict['expires_at'].isoformat()
    await db.sms_orders.insert_one(order_dict)
    
    await db.users.update_one({'id': user['id']}, {'$inc': {'usd_balance': -final_cost}})
    
    transaction = Transaction(
        user_id=user['id'],
        type='purchase',
        amount=final_cost,
        currency='USD',
        status='completed',
        reference=order.id,
        metadata={'service': data.service, 'country': data.country, 'provider': provider}
    )
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    await db.transactions.insert_one(trans_dict)
    
    background_tasks.add_task(otp_polling_task, order.id)
    
    return {'success': True, 'order': order_dict}

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
    
    if order['status'] != 'active' and order['status'] != 'expired':
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    
    if order.get('otp'):
        raise HTTPException(status_code=400, detail="Cannot cancel - OTP already received")
    
    if not order.get('can_cancel', False):
        created_at = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00'))
        elapsed = (datetime.now(timezone.utc) - created_at).total_seconds()
        if elapsed < 300:
            raise HTTPException(status_code=400, detail="Can only cancel after 5 minutes")
    
    if order.get('activation_id'):
        await cancel_number_provider(order['provider'], order['activation_id'])
    
    await db.users.update_one({'id': user['id']}, {'$inc': {'usd_balance': order['cost_usd']}})
    await db.sms_orders.update_one({'id': order_id}, {'$set': {'status': 'cancelled'}})
    
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
    transactions = await db.transactions.find({'user_id': user['id']}, {'_id': 0}).sort('created_at', -1).to_list(100)
    return {'transactions': transactions}

# ============ Payscribe Routes ============

@api_router.get("/payscribe/services")
async def get_payscribe_services(user: dict = Depends(get_current_user)):
    """Get available Payscribe services"""
    services = {
        'airtime': ['MTN', 'Airtel', 'Glo', '9Mobile'],
        'data': ['MTN', 'Airtel', 'Glo', '9Mobile'],
        'electricity': ['EKEDC', 'IKEDC', 'AEDC', 'PHED'],
        'cable': ['DSTV', 'GOTV', 'Startimes'],
        'betting': ['Bet9ja', '1xBet', 'Sportybet']
    }
    return services

@api_router.get("/payscribe/data-plans")
async def get_data_plans(network: str, user: dict = Depends(get_current_user)):
    """Get data plans for a network"""
    result = await payscribe_request(f'data/lookup?network={network.lower()}')
    return result or {'status': False, 'message': 'Failed to fetch plans'}

@api_router.post("/payscribe/buy-airtime")
async def buy_airtime(request: BillPaymentRequest, user: dict = Depends(get_current_user)):
    """Purchase airtime"""
    if user.get('ngn_balance', 0) < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient NGN balance")
    
    data = {
        'network': request.provider.lower(),
        'phone': request.recipient,
        'amount': request.amount,
        'ref': str(uuid.uuid4())
    }
    
    result = await payscribe_request('airtime/vend', 'POST', data)
    
    if result and result.get('status'):
        await db.users.update_one({'id': user['id']}, {'$inc': {'ngn_balance': -request.amount}})
        
        bill_payment = BillPayment(
            user_id=user['id'],
            service_type='airtime',
            provider=request.provider,
            amount=request.amount,
            recipient=request.recipient,
            status='completed',
            trans_id=result.get('message', {}).get('details', {}).get('trans_id'),
            metadata=result
        )
        bp_dict = bill_payment.model_dump()
        bp_dict['created_at'] = bp_dict['created_at'].isoformat()
        await db.bill_payments.insert_one(bp_dict)
        
        transaction = Transaction(
            user_id=user['id'],
            type='bill_payment',
            amount=request.amount,
            currency='NGN',
            status='completed',
            reference=bill_payment.id,
            metadata={'service': 'airtime', 'provider': request.provider}
        )
        trans_dict = transaction.model_dump()
        trans_dict['created_at'] = trans_dict['created_at'].isoformat()
        await db.transactions.insert_one(trans_dict)
        
        return {'success': True, 'message': 'Airtime purchase successful', 'details': result}
    
    raise HTTPException(status_code=400, detail="Airtime purchase failed")

@api_router.get("/payscribe/stablecoin-currencies")
async def get_stablecoin_currencies(user: dict = Depends(get_current_user)):
    """Get available stablecoin currencies and networks"""
    result = await payscribe_request('stable/addresses/currencies')
    return result or {'status': False, 'message': 'Failed to fetch currencies'}

@api_router.post("/payscribe/create-stablecoin-wallet")
async def create_stablecoin_wallet(request: CreateStablecoinWalletRequest, user: dict = Depends(get_current_user)):
    """Create stablecoin deposit wallet"""
    data = {
        'currency': request.currency,
        'network': request.network,
        'chain': request.chain,
        'label': request.label,
        'customer_id': user['id']
    }
    
    result = await payscribe_request('stable/address/create', 'POST', data)
    
    if result and result.get('status'):
        details = result.get('message', {}).get('details', {})
        wallet = StablecoinWallet(
            user_id=user['id'],
            currency=request.currency,
            network=request.network,
            chain=request.chain,
            address=details.get('address', ''),
            label=request.label,
            tracking_id=details.get('tracking_id', ''),
            status='active'
        )
        wallet_dict = wallet.model_dump()
        wallet_dict['created_at'] = wallet_dict['created_at'].isoformat()
        await db.stablecoin_wallets.insert_one(wallet_dict)
        
        return {'success': True, 'wallet': wallet_dict}
    
    raise HTTPException(status_code=400, detail="Failed to create wallet")

@api_router.get("/payscribe/stablecoin-wallets")
async def get_stablecoin_wallets(user: dict = Depends(get_current_user)):
    """Get user's stablecoin wallets"""
    wallets = await db.stablecoin_wallets.find({'user_id': user['id']}, {'_id': 0}).to_list(50)
    return {'wallets': wallets}

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
    if data.rub_to_usd_rate is not None:
        update_fields['rub_to_usd_rate'] = data.rub_to_usd_rate
    if data.area_code_markup is not None:
        update_fields['area_code_markup'] = data.area_code_markup
    if data.carrier_markup is not None:
        update_fields['carrier_markup'] = data.carrier_markup
    
    update_fields['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.pricing_config.update_one({}, {'$set': update_fields}, upsert=True)
    
    return {'success': True, 'updated': update_fields}

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_orders = await db.sms_orders.count_documents({})
    active_orders = await db.sms_orders.count_documents({'status': 'active'})
    
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
async def paymentpoint_webhook(request: Request, paymentpoint_signature: Optional[str] = Header(None)):
    try:
        body = await request.body()
        calculated_signature = hmac.new(
            PAYMENTPOINT_SECRET.encode('utf-8'),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if paymentpoint_signature and calculated_signature != paymentpoint_signature:
            logger.warning("Invalid PaymentPoint webhook signature")
            return {'status': 'error', 'message': 'Invalid signature'}
        
        import json
        data = json.loads(body)
        
        if data.get('notification_status') == 'payment_successful':
            amount = data.get('settlement_amount', 0)
            customer_email = data.get('customer', {}).get('email')
            
            if customer_email and amount > 0:
                user = await db.users.find_one({'email': customer_email}, {'_id': 0})
                if user:
                    await db.users.update_one(
                        {'id': user['id']},
                        {'$inc': {'ngn_balance': amount}}
                    )
                    
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