from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Header, BackgroundTasks, Request, UploadFile, File
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
import shutil

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
FIVESIM_BASE_URL = 'https://5sim.net/v1'

FIVESIM_API_KEY = os.environ.get('FIVESIM_API_KEY')
FIVESIM_API_KEY = os.environ.get('FIVESIM_API_KEY')

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
    
    # PaymentPoint Virtual Account Details
    paymentpoint_customer_id: Optional[str] = None
    virtual_account_number: Optional[str] = None
    virtual_account_name: Optional[str] = None
    virtual_bank_name: Optional[str] = None
    virtual_bank_code: Optional[str] = None
    reserved_account_id: Optional[str] = None
    
    # Payscribe Customer & KYC Details
    payscribe_customer_id: Optional[str] = None
    tier: int = 1  # 1 = Basic, 2 = Standard, 3 = Premium
    kyc_status: str = 'pending'  # pending, approved, rejected
    kyc_submitted_at: Optional[datetime] = None
    
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
    # Charged amount tracking
    charged_amount: Optional[float] = None
    charged_currency: Optional[str] = None
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
    # Page toggles
    enable_virtual_numbers: bool = True
    enable_buy_data: bool = True
    enable_airtime: bool = True
    enable_betting: bool = True
    enable_virtual_cards: bool = True
    enable_fund_wallet: bool = True
    enable_referral: bool = True
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
    payment_currency: str = 'NGN'  # Default to NGN
    # Optional DaisySMS filters
    area_code: Optional[str] = None
    area_codes: Optional[str] = None  # Comma-separated for frontend
    carrier: Optional[str] = None
    phone_make: Optional[str] = None
    preferred_number: Optional[str] = None
    # Optional SMS-pool pool selector
    pool: Optional[str] = None

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

class DataPurchaseRequest(BaseModel):
    plan_code: str
    recipient: str
    ref: Optional[str] = None

class BettingFundRequest(BaseModel):
    bet_id: str
    customer_id: str
    amount: float
    ref: Optional[str] = None

class UpdatePhoneRequest(BaseModel):
    phone: str

# ============ DaisySMS Static Pricing ============

DAISYSMS_PRICES = {
    'other': 1.00,  # Service not listed
    'wa': 1.10,  # WhatsApp
    'vi': 0.10,  # Viber
    'oa': 0.10,  # OpenAI / ChatGPT
    'tg': 1.30,  # Telegram
    'ma': 0.15,  # Yahoo
    'go': 0.50,  # Google / Gmail / Youtube
    'fb': 1.10,  # Facebook
    'ig': 0.20,  # Instagram
    'tw': 0.12,  # Twitter
    'li': 0.10,  # LinkedIn
    'ds': 0.10,  # Discord
    'tt': 0.30,  # TikTok
    'ub': 0.10,  # Uber
    'pp': 0.80,  # PayPal
    'vm': 0.50,  # Venmo
    'tn': 0.30,  # Tinder
    'bu': 0.18,  # Bumble
    'ap': 0.10,  # Apple
    'am': 0.50,  # Amazon / AWS
    'cb': 0.25,  # Coinbase
    'sn': 0.10,  # Snapchat
    'ca': 1.00,  # Cash App
    'gv': 0.20,  # Google Voice
    'vk': 0.20,  # VKontakte
    'do': 0.10,  # DoorDash
    'fi': 0.10,  # Fiverr
    'nk': 0.20,  # Nike
    'cr': 0.10,  # Craigslist
    'eb': 0.10,  # eBay
    'hg': 0.30,  # Hinge
    'gr': 0.10,  # Grindr
    'tk': 0.10,  # Ticketmaster
    'tm': 0.10,  # Temu
    'ln': 0.05,  # LINE messenger
    'rd': 0.40,  # Reddit
    'st': 0.50,  # Steam
    'bl': 0.20,  # Blizzard / Battle.net
    'nt': 0.10,  # Netflix
    'ab': 0.10,  # Airbnb
    'tc': 0.20,  # Twitch
    'ch': 2.40,  # Chime
    'rb': 0.40,  # Robinhood
    'wm': 0.10,  # Walmart
    'ci': 0.80,  # Citi
    'wf': 0.80,  # Wells Fargo
    'ba': 0.80,  # Bank of America
    'pn': 0.80,  # PNC
    'ch2': 0.30,  # Chase
    'us': 0.80,  # USAA
    'kb': 0.80,  # Keybank
    'tr': 0.80,  # Truist
    'sc': 0.80,  # Schwab
    'sa': 0.80,  # Santander
    'rg': 0.80,  # Regions
    'db': 0.80,  # Discover Bank
    'nf': 1.00,  # NFCU
    'ub2': 0.80,  # U.S. Bank
    'fd': 0.80,  # Fidelity
    'ct': 0.80,  # Citizens
    'bm': 0.80,  # BMO Harris
    'sf': 0.80,  # SoFi Bank
    'ht': 0.80,  # Huntington
    'as': 0.80,  # Aspiration
    'al': 0.80,  # Ally
    'dv': 0.80,  # Dave.com
    'no': 0.80,  # North One
    'ax': 0.80,  # Axos Bank
    'uf': 0.80,  # UFBdirect.com
    'sp': 0.80,  # Stripe
    'af': 0.80,  # af247.com
    'nv': 0.80,  # Navy Federal
    'sx': 0.80,  # Sezzle
    'af2': 0.80,  # Affirm
    'cl': 0.80,  # CashLoans Express
    'om': 0.80,  # OneMain Financial
    'ls': 0.80,  # LightStream.com
    'tu': 0.80,  # TransUnion
    'fn': 0.80,  # First National Bank
    'sb': 0.80,  # Sunbit
    'np': 0.80,  # Net Pay Advance
    'ba2': 0.80,  # BankMobile
    'gb': 0.80,  # GBank
    'pf': 0.80,  # PenFed
    'ew': 0.80,  # East West Bank
    'td': 0.80,  # TD.com
    'bm2': 0.80,  # BMO Alto
    'va': 0.80,  # Varo
    'g1': 0.80,  # Golden1
    'ns': 1.00,  # Netspend
    'fr': 1.00,  # Frost Bank
    'ey': 0.80   # EverBank
}

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
    """Create virtual accounts for a user via PaymentPoint (PalmPay only)"""
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
            'bankCode': ['20946'],  # PalmPay only
            'businessId': PAYMENTPOINT_BUSINESS_ID
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f'{PAYMENTPOINT_BASE_URL}/createVirtualAccount',
                json=data,
                headers=headers,
                timeout=30.0
            )
            
            # PaymentPoint returns 201 for successful creation
            if response.status_code in [200, 201]:
                result = response.json()
                if result.get('status') == 'success' and result.get('bankAccounts'):
                    account_data = result['bankAccounts'][0]
                    customer_data = result.get('customer', {})
                    
                    # Update user with virtual account details
                    await db.users.update_one(
                        {'id': user['id']},
                        {'$set': {
                            'paymentpoint_customer_id': customer_data.get('customer_id'),
                            'virtual_account_number': account_data['accountNumber'],
                            'virtual_account_name': account_data['accountName'],
                            'virtual_bank_name': account_data['bankName'],
                            'virtual_bank_code': account_data['bankCode'],
                            'reserved_account_id': account_data['Reserved_Account_Id']
                        }}
                    )
                    
                    logger.info(f"Virtual account created for user {user['id']}: {account_data['accountNumber']}")
                    return {
                        'account_number': account_data['accountNumber'],
                        'account_name': account_data['accountName'],
                        'bank_name': account_data['bankName']
                    }
            
            logger.error(f"PaymentPoint error (status {response.status_code}): {response.text}")
            return None
    except Exception as e:
        logger.error(f"Error creating virtual account: {str(e)}")
        return None

# ============ SMS Provider Functions (Updated) ============

async def purchase_number_smspool(service: str, country: str, **kwargs) -> Optional[Dict]:
    """Purchase a number from SMS-pool.

    Supports optional `pool` selection so that the frontend can choose
    a specific pool for the given service/country.
    """
    try:
        params = {'key': SMSPOOL_API_KEY, 'service': service, 'country': country}
        pool = kwargs.get('pool')
        if pool:
            params['pool'] = pool
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.smspool.net/purchase/sms',
                params=params,
                timeout=15.0
            )
            if response.status_code == 200:
                return response.json()
            else:
                # Log the actual error response
                try:
                    error_data = response.json()
                    logger.error(f"SMS-pool purchase failed (status {response.status_code}): {error_data}")
                except:
                    logger.error(f"SMS-pool purchase failed (status {response.status_code}): {response.text}")
                return None
    except Exception as e:
        logger.error(f"SMS-pool purchase error: {str(e)}")
        return None

async def poll_otp_daisysms(order_id: str, activation_id: str):
    """Background task to poll for OTP from DaisySMS"""
    try:
        config = await db.pricing_config.find_one({}, {'_id': 0})
        api_key = config.get('daisysms_api_key', DAISYSMS_API_KEY) if config else DAISYSMS_API_KEY
        
        # Poll for up to 5 minutes (100 attempts, 3 seconds each)
        for attempt in range(100):
            await asyncio.sleep(3)  # Wait 3 seconds between polls
            
            # Check if order still exists and is active
            order = await db.sms_orders.find_one({'id': order_id}, {'_id': 0})
            if not order or order['status'] != 'active':
                logger.info(f"Order {order_id} no longer active, stopping poll")
                break
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://daisysms.com/stubs/handler_api.php',
                    params={'api_key': api_key, 'action': 'getStatus', 'id': activation_id, 'text': 1},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.text
                    
                    if 'STATUS_OK' in result:
                        # Got the code! Format: STATUS_OK:12345
                        parts = result.split(':')
                        if len(parts) >= 2:
                            otp_code = parts[1].strip()
                            full_text = response.headers.get('X-Text', '')
                            
                            # Update order with OTP
                            await db.sms_orders.update_one(
                                {'id': order_id},
                                {'$set': {
                                    'otp': otp_code,
                                    'sms_text': full_text,
                                    'status': 'completed',
                                    'can_cancel': False,
                                    'received_at': datetime.now(timezone.utc).isoformat()
                                }}
                            )
                            
                            # Mark as done on DaisySMS
                            await client.get(
                                'https://daisysms.com/stubs/handler_api.php',
                                params={'api_key': api_key, 'action': 'setStatus', 'id': activation_id, 'status': 6},
                                timeout=10.0
                            )
                            
                            logger.info(f"✓ OTP received for order {order_id}: {otp_code}")
                            break
                    
                    elif 'STATUS_CANCEL' in result:
                        # Rental was cancelled
                        await db.sms_orders.update_one(
                            {'id': order_id},
                            {'$set': {'status': 'cancelled'}}
                        )
                        logger.info(f"Order {order_id} was cancelled")
                        break
                    
                    elif 'NO_ACTIVATION' in result:
                        logger.error(f"Invalid activation ID for order {order_id}")
                        break
                    
                    # else: STATUS_WAIT_CODE - continue polling
        
        # If we exit loop without getting code, mark as expired
        order = await db.sms_orders.find_one({'id': order_id}, {'_id': 0})
        if order and order['status'] == 'active':
            await db.sms_orders.update_one(
                {'id': order_id},
                {'$set': {'status': 'expired', 'can_cancel': False}}
            )
            logger.info(f"Order {order_id} expired without receiving OTP")
            
    except Exception as e:
        logger.error(f"OTP polling error for order {order_id}: {str(e)}")

async def purchase_number_daisysms(service: str, max_price: float, area_code: Optional[str] = None, 
                                    carrier: Optional[str] = None, phone_make: Optional[str] = None) -> Optional[Dict]:
    """Purchase number from DaisySMS with max_price protection"""
    try:
        # Get API key from config
        config = await db.pricing_config.find_one({}, {'_id': 0})
        api_key = config.get('daisysms_api_key', DAISYSMS_API_KEY) if config else DAISYSMS_API_KEY
        
        params = {
            'api_key': api_key,
            'action': 'getNumber',
            'service': service,
            'max_price': max_price  # Prevent unexpected price increases
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
                result_text = response.text
                # Get actual price from X-Price header
                actual_price = response.headers.get('X-Price')
                
                return {
                    'text': result_text,
                    'actual_price': float(actual_price) if actual_price else None,
                    'status_code': 200
                }
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

async def poll_otp_5sim(order_id: str) -> Optional[str]:
    """Poll 5sim for OTP using order ID."""
    if not FIVESIM_API_KEY:
        logger.error("FIVESIM_API_KEY not configured")
        return None
    try:
        headers = {
            'Authorization': f'Bearer {FIVESIM_API_KEY}',
            'Accept': 'application/json'
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{FIVESIM_BASE_URL}/user/orders",
                headers=headers,
                params={"category": "activation", "limit": 50},
                timeout=10.0
            )
            if resp.status_code != 200:
                logger.error(f"5sim status error {resp.status_code}: {resp.text}")
                return None
            data = resp.json()
            orders = data.get('Data') or data
            for o in orders:
                if str(o.get('id')) == str(order_id):
                    sms_list = o.get('sms') or []
                    if sms_list:
                        sms = sms_list[0]
                        code = sms.get('code')
                        if not code:
                            import re
                            text = sms.get('text') or ''
                            m = re.search(r"\b(\d{4,8})\b", text)
                            if m:
                                code = m.group(1)
                        return code
            return None
    except Exception as e:
        logger.error(f"5sim OTP poll error: {str(e)}")
        return None

        logger.error(f"TigerSMS purchase error: {str(e)}")
        return None

async def poll_otp_smspool(order_id: str) -> Optional[str]:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.smspool.net/sms/check',
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
        elif provider == '5sim':
            if not FIVESIM_API_KEY:
                logger.error("FIVESIM_API_KEY not configured for cancel")
                return False
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{FIVESIM_BASE_URL}/user/cancel/{activation_id}",
                    headers={
                        'Authorization': f'Bearer {FIVESIM_API_KEY}',
                        'Accept': 'application/json'
                    },
                    timeout=10.0
                )
                return resp.status_code == 200

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
                    'https://api.smspool.net/request/cancel',
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

# ============ Payscribe Services ============

async def create_stablecoin_address(user_id: str, currency: str, network: str, chain: str) -> Optional[Dict]:
    """Create a stablecoin deposit address for a user"""
    try:
        data = {
            'currency': currency,
            'network': network,
            'chain': chain,
            'label': f"{user_id}_{currency}",
            'customer_id': user_id
        }
        
        result = await payscribe_request('stable/address/create', 'POST', data)
        if result and result.get('status'):
            return result.get('message', {}).get('details')
        return None
    except Exception as e:
        logger.error(f"Error creating stablecoin address: {str(e)}")
        return None

async def vend_airtime(network: str, amount: float, recipient: str, ref: str = None) -> Optional[Dict]:
    """Purchase airtime via Payscribe"""
    try:
        data = {
            'network': network.lower(),
            'amount': amount,
            'recipient': recipient,
            'ported': False,
            'ref': ref or str(uuid.uuid4())
        }
        
        result = await payscribe_request('airtime', 'POST', data)
        return result
    except Exception as e:
        logger.error(f"Error vending airtime: {str(e)}")
        return None

async def get_data_plans_service(network: str, category: str = None) -> Optional[Dict]:
    """Get data plans for a network"""
    try:
        endpoint = f'data/lookup?network={network}'
        if category:
            endpoint += f'&category={category}'
        
        result = await payscribe_request(endpoint, 'GET')
        return result
    except Exception as e:
        logger.error(f"Error fetching data plans: {str(e)}")
        return None

async def purchase_data(plan_code: str, recipient: str, ref: str = None) -> Optional[Dict]:
    """Purchase data bundle via Payscribe"""
    try:
        data = {
            'plan_code': plan_code,
            'recipient': recipient,
            'ref': ref or str(uuid.uuid4())
        }
        
        result = await payscribe_request('data/vend', 'POST', data)
        return result
    except Exception as e:
        logger.error(f"Error purchasing data: {str(e)}")
        return None

async def get_betting_providers() -> Optional[Dict]:
    """Get list of betting service providers"""
    try:
        result = await payscribe_request('betting/list', 'GET')
        return result
    except Exception as e:
        logger.error(f"Error fetching betting providers: {str(e)}")
        return None

async def validate_bet_account(bet_id: str, customer_id: str) -> Optional[Dict]:
    """Validate betting account before funding"""
    try:
        result = await payscribe_request(f'betting/lookup?bet_id={bet_id}&customer_id={customer_id}', 'GET')
        return result
    except Exception as e:
        logger.error(f"Error validating bet account: {str(e)}")
        return None

async def fund_bet_wallet(bet_id: str, customer_id: str, amount: float, ref: str = None) -> Optional[Dict]:
    """Fund betting wallet via Payscribe"""
    try:
        data = {
            'bet_id': bet_id,
            'customer_id': customer_id,
            'amount': amount,
            'ref': ref or str(uuid.uuid4())
        }
        
        result = await payscribe_request('betting/fund', 'POST', data)
        return result
    except Exception as e:
        logger.error(f"Error funding bet wallet: {str(e)}")
        return None

# ============ Background Tasks ============

async def otp_polling_task(order_id: str):
    """Generic OTP polling for all providers with 10-minute lifetime.

    Behaviour:
    - Poll provider for up to 10 minutes (600s).
    - After 5 minutes, allow user cancellation (can_cancel = True).
    - If OTP arrives: mark order completed and disable cancel.
    - If no OTP by 10 minutes: auto-cancel with refund and mark order cancelled.
    """
    max_duration = 600  # 10 minutes total lifetime
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
            elif order['provider'] == '5sim' and order.get('activation_id'):
                otp = await poll_otp_5sim(order['activation_id'])

            if otp:
                await db.sms_orders.update_one(
                    {'id': order_id},
                    {'$set': {'otp': otp, 'status': 'completed', 'can_cancel': False}}
                )
                logger.info(f"OTP received for order {order_id}")
                break

            # After 5 minutes, allow manual cancellation from UI
            if elapsed >= 300 and not order.get('can_cancel'):
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

    # After max_duration, if still active and no OTP, auto-cancel and refund
    order = await db.sms_orders.find_one({'id': order_id}, {'_id': 0})
    if order and order['status'] == 'active' and not (order.get('otp') or order.get('otp_code')):
        try:
            # Best-effort cancel with provider
            if order.get('activation_id'):
                try:
                    success = await cancel_number_provider(order['provider'], order['activation_id'])
                    if not success:
                        logger.warning(f"Provider auto-cancel failed for order {order_id}")
                except Exception as e:
                    logger.error(f"Provider auto-cancel error for order {order_id}: {str(e)}")

            # Refund NGN based on stored cost_usd and current FX rate
            config = await db.pricing_config.find_one({}, {'_id': 0})
            ngn_rate = config.get('ngn_to_usd_rate', 1500.0) if config else 1500.0
            refund_ngn = float(order.get('cost_usd', 0) or 0) * ngn_rate

            if refund_ngn > 0:
                await db.users.update_one({'id': order['user_id']}, {'$inc': {'ngn_balance': refund_ngn}})

                # Record refund transaction
                transaction = Transaction(
                    user_id=order['user_id'],
                    type='refund',
                    amount=refund_ngn,
                    currency='NGN',
                    status='completed',
                    reference=order_id,
                    metadata={
                        'reason': 'auto_timeout_cancel',
                        'service': order.get('service'),
                        'provider': order.get('provider')
                    }
                )
                trans_dict = transaction.model_dump()
                trans_dict['created_at'] = trans_dict['created_at'].isoformat()
                await db.transactions.insert_one(trans_dict)

            await db.sms_orders.update_one(
                {'id': order_id},
                {'$set': {'status': 'cancelled', 'can_cancel': False}}
            )
            logger.info(f"Order {order_id} auto-cancelled after timeout")
        except Exception as e:
            logger.error(f"Auto-cancel refund error for order {order_id}: {str(e)}")

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
        'is_admin': user.get('is_admin', False),
        'virtual_account_number': user.get('virtual_account_number'),
        'virtual_account_name': user.get('virtual_account_name'),
        'virtual_bank_name': user.get('virtual_bank_name'),
        'tier': user.get('tier', 1),
        'kyc_status': user.get('kyc_status', 'pending'),
        'payscribe_customer_id': user.get('payscribe_customer_id')
    }

@api_router.get("/user/virtual-accounts")
async def get_virtual_accounts(user: dict = Depends(get_current_user)):
    accounts = await db.virtual_accounts.find({'user_id': user['id']}, {'_id': 0}).to_list(10)
    return {'accounts': accounts}

@api_router.post("/user/generate-virtual-account")
async def generate_virtual_account(user: dict = Depends(get_current_user)):
    """Manually generate PaymentPoint virtual account for user"""
    try:
        # Check if user already has virtual account
        if user.get('virtual_account_number'):
            return {
                'success': True,
                'message': 'Virtual account already exists',
                'account': {
                    'account_number': user.get('virtual_account_number'),
                    'account_name': user.get('virtual_account_name'),
                    'bank_name': user.get('virtual_bank_name')
                }
            }
        
        # Create virtual account
        result = await create_paymentpoint_virtual_account(user)
        
        if result:
            # Fetch updated user
            updated_user = await db.users.find_one({'id': user['id']}, {'_id': 0})
            return {
                'success': True,
                'message': 'Virtual account created successfully',
                'account': {
                    'account_number': updated_user.get('virtual_account_number'),
                    'account_name': updated_user.get('virtual_account_name'),
                    'bank_name': updated_user.get('virtual_bank_name')
                }
            }
        
        raise HTTPException(status_code=500, detail="Failed to create virtual account")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating virtual account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/user/upload-kyc-documents")
async def upload_kyc_documents(
    idDocument: UploadFile = File(...),
    selfie: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload KYC documents"""
    try:
        # Create uploads directory
        upload_dir = Path("/app/backend/uploads/kyc")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Save ID document
        id_filename = f"{user['id']}_id_{uuid.uuid4()}.{idDocument.filename.split('.')[-1]}"
        id_path = upload_dir / id_filename
        with open(id_path, "wb") as buffer:
            shutil.copyfileobj(idDocument.file, buffer)
        
        # Save selfie
        selfie_filename = f"{user['id']}_selfie_{uuid.uuid4()}.{selfie.filename.split('.')[-1]}"
        selfie_path = upload_dir / selfie_filename
        with open(selfie_path, "wb") as buffer:
            shutil.copyfileobj(selfie.file, buffer)
        
        # Return public URLs (you'd serve these via static files or upload to cloud storage)
        base_url = os.environ.get('BACKEND_URL', 'http://localhost:8001')
        
        return {
            'success': True,
            'id_document_url': f"{base_url}/uploads/kyc/{id_filename}",
            'selfie_url': f"{base_url}/uploads/kyc/{selfie_filename}"
        }
    except Exception as e:
        logger.error(f"Error uploading KYC documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/payscribe/create-customer")
async def create_payscribe_customer(request: Dict[str, Any], user: dict = Depends(get_current_user)):
    """Create Payscribe customer for USDT/USDC and Virtual Cards"""
    try:
        # Call Payscribe customer creation
        result = await payscribe_request('customers/create/full', 'POST', request)
        
        if result and result.get('status'):
            customer_id = result.get('message', {}).get('details', {}).get('customer_id')
            
            # Update user with Payscribe customer ID and tier
            await db.users.update_one(
                {'id': user['id']},
                {'$set': {
                    'payscribe_customer_id': customer_id,
                    'tier': 3,
                    'kyc_status': 'approved',
                    'kyc_submitted_at': datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"Payscribe customer created for user {user['id']}: {customer_id}")
            return {'success': True, 'customer_id': customer_id, 'details': result}
        
        raise HTTPException(status_code=400, detail="Customer creation failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Payscribe customer: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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
async def get_smspool_services(user: dict = Depends(get_current_user), country: str = None):
    """Fetch SMS-pool services with pricing in NGN (International Server)"""
    try:
        # Get API key and markup from config
        config = await db.pricing_config.find_one({}, {'_id': 0})
        api_key = config.get('smspool_api_key', SMSPOOL_API_KEY) if config else SMSPOOL_API_KEY
        markup_percent = config.get('smspool_markup', 50.0) if config else 50.0
        ngn_rate = config.get('ngn_to_usd_rate', 1500.0) if config else 1500.0
        
        # If specific country requested, fetch services with REAL pricing
        if country:
            async with httpx.AsyncClient() as client:
                # 1) Fetch raw pricing entries (service + pool + price)
                pricing_resp = await client.post(
                    'https://api.smspool.net/request/pricing',
                    data={'country': country},
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=20.0
                )

                # 2) Fetch full service list so we can map IDs -> names (per country)
                services_resp = await client.post(
                    'https://api.smspool.net/service/retrieve_all',
                    data={'country': country},
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=20.0
                )

                # 3) Fetch pool list so we can expose pools per service (metadata only)
                pools_resp = await client.post(
                    'https://api.smspool.net/pool/retrieve_all',
                    headers={'Authorization': f'Bearer {api_key}'},
                    timeout=20.0
                )

                if pricing_resp.status_code == 200:
                    pricing_list = pricing_resp.json() or []
                else:
                    pricing_list = []

                # Build service ID -> name map (from service/retrieve_all)
                services_map: Dict[str, str] = {}
                if services_resp.status_code == 200:
                    try:
                        raw_services = services_resp.json() or []
                        for s in raw_services:
                            if isinstance(s, dict):
                                sid = str(s.get('ID') or s.get('id') or '')
                                name = s.get('name') or f'Service {sid}'
                                if sid:
                                    services_map[sid] = name
                    except Exception as e:
                        logger.error(f"Failed to parse SMS-pool service list: {str(e)}")

                # Build pool metadata map (ID -> name/label)
                pools_map: Dict[str, str] = {}
                if pools_resp.status_code == 200:
                    try:
                        raw_pools = pools_resp.json() or []
                        for p in raw_pools:
                            if isinstance(p, dict):
                                pid = str(p.get('id') or p.get('ID') or p.get('pool') or '')
                                if pid:
                                    pools_map[pid] = p.get('name') or p.get('label') or f'Pool {pid}'
                    except Exception as e:
                        logger.error(f"Failed to parse SMS-pool pool list: {str(e)}")

                # Aggregate pricing per service, with all pools and a visible price
                aggregated: Dict[str, Dict[str, Any]] = {}

                # pricing_list format: [{service: 846, service_name: "Snapchat", country: 20, price: "0.02", pool: 7}, ...]
                for item in pricing_list:
                    if isinstance(item, dict):
                        service_id_raw = item.get('service')
                        if service_id_raw is None:
                            continue
                        service_id = str(service_id_raw)
                        base_price_usd = float(item.get('price', 0) or 0)
                        if base_price_usd <= 0:
                            continue

                        pool_id_raw = item.get('pool')
                        pool_id = str(pool_id_raw) if pool_id_raw is not None else None

                        # Apply our markup and convert to NGN
                        final_price_usd = base_price_usd * (1 + markup_percent / 100)
                        final_price_ngn = final_price_usd * ngn_rate

                        # Initialize container for this service
                        if service_id not in aggregated:
                            service_name = services_map.get(service_id) or item.get(
                                'service_name', f'Service {service_id}'
                            )
                            aggregated[service_id] = {
                                'value': service_id,
                                'label': service_name,
                                'name': service_name,
                                'price_usd': final_price_usd,
                                'price_ngn': final_price_ngn,
                                'base_price': base_price_usd,
                                'pools': []  # will be filled below
                            }
                        # Track cheapest overall price for display
                        svc = aggregated[service_id]
                        if final_price_ngn < svc['price_ngn']:
                            svc['price_ngn'] = final_price_ngn
                            svc['price_usd'] = final_price_usd
                            svc['base_price'] = base_price_usd

                        # Attach this pool entry
                        if pool_id:
                            svc['pools'].append({
                                'id': pool_id,
                                'name': pools_map.get(pool_id, f'Pool {pool_id}'),
                                'base_price': base_price_usd,
                                'price_usd': final_price_usd,
                                'price_ngn': final_price_ngn
                            })

                        # Cache the **cheapest** base price per service/country in USD
                        await db.cached_services.update_one(
                            {
                                'provider': 'smspool',
                                'service_code': service_id,
                                'country_code': str(country)
                            },
                            {
                                '$setOnInsert': {
                                    'currency': 'USD'
                                },
                                '$min': {
                                    'base_price': base_price_usd
                                }
                            },
                            upsert=True
                        )

                services = list(aggregated.values())
                services.sort(key=lambda x: x['name'])
                logger.info(f"Loaded {len(services)} SMS-pool services for country {country}")
                return {'success': True, 'services': services, 'country': country}
        
        # Return all available countries
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://api.smspool.net/country/retrieve_all',
                headers={'Authorization': f'Bearer {api_key}'},
                timeout=15.0
            )
            
            if response.status_code == 200:
                countries = response.json()
                # Format for dropdown
                country_options = [
                    {
                        'value': str(c['ID']),
                        'label': f"{c['name']} ({c['short_name']})",
                        'name': c['name'],
                        'region': c.get('region', 'Other')
                    }
                    for c in countries
                ]
                country_options.sort(key=lambda x: x['name'])
                
                return {'success': True, 'countries': country_options}
        
        return {'success': False, 'message': 'Failed to fetch countries'}
    except Exception as e:
        logger.error(f"SMS-pool service fetch error: {str(e)}")
        return {'success': False, 'message': str(e)}

@api_router.get("/services/daisysms")
async def get_daisysms_services(user: dict = Depends(get_current_user)):
    """Get DaisySMS services with LIVE pricing from API"""
    try:
        # Get API key and markup from config
        config = await db.pricing_config.find_one({}, {'_id': 0})
        api_key = config.get('daisysms_api_key', DAISYSMS_API_KEY) if config else DAISYSMS_API_KEY
        markup_percent = config.get('daisysms_markup', 50.0) if config else 50.0
        
        # Fetch live prices from DaisySMS
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://daisysms.com/stubs/handler_api.php',
                params={'api_key': api_key, 'action': 'getPricesVerification'},
                timeout=15.0
            )
            
            if response.status_code == 200:
                prices_data = response.json()
                
                # Transform into services with pricing
                services = []
                for service_code, countries in prices_data.items():
                    if '187' in countries:  # USA country code
                        usa_data = countries['187']
                        base_price = float(usa_data.get('retail_price', usa_data.get('cost', 1.0)))
                        
                        # Apply markup
                        final_price = base_price * (1 + markup_percent / 100)
                        
                        services.append({
                            'value': service_code,
                            'label': f"{usa_data.get('name', service_code)} - ${final_price:.2f}",
                            'name': usa_data.get('name', service_code),
                            'base_price': base_price,
                            'final_price': final_price,
                            'count': usa_data.get('count', 0)
                        })
                
                # Sort by name
                services.sort(key=lambda x: x['name'])
                
                return {'success': True, 'services': services, 'markup_percent': markup_percent}
        
        return {'success': False, 'message': 'Failed to fetch services'}
    except Exception as e:
        logger.error(f"Error fetching DaisySMS services: {str(e)}")
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
            'server2': '5sim'
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
        
        # Get base price
        if provider == 'daisysms':
            # Use static pricing for DaisySMS
            base_price_usd = DAISYSMS_PRICES.get(data.service, 1.00)
            
            # DaisySMS adds 20% for area codes and carriers (from their side)
            if data.area_code:
                base_price_usd = base_price_usd * 1.20
            if data.carrier:
                base_price_usd = base_price_usd * 1.20
        else:
            # Get from cached services for other providers
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
        
        # Apply OUR markup (default 50%)
        markup_key = f'{provider}_markup'
        provider_markup = config.get(markup_key, 50.0)
        final_price_usd = base_price_usd * (1 + provider_markup / 100)
        
        # Convert to NGN
        ngn_rate = config.get('ngn_to_usd_rate', 1500.0)
        final_price_ngn = final_price_usd * ngn_rate
        
        return {
            'success': True,
            'base_price_usd': round(base_price_usd, 2),
            'our_markup_percent': provider_markup,
            'final_price_usd': round(final_price_usd, 2),
            'final_price_ngn': round(final_price_ngn, 2),
            'breakdown': {
                'provider_base': round(base_price_usd, 2),
                'our_markup_amount': round(final_price_usd - base_price_usd, 2),
                'includes_area_code': data.area_code is not None,
                'includes_carrier': data.carrier is not None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Price calculation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============ Order Management Routes ============

# (Consolidated cancel route is defined later around line 1830)

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
        'server2': '5sim'
    }
    
    provider = server_map.get(data.server)
    if not provider:
        raise HTTPException(status_code=400, detail="Invalid server selection")
    
    # Get pricing config
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        default_config = PricingConfig()
        config_dict = default_config.model_dump()
        config_dict['updated_at'] = config_dict['updated_at'].isoformat()
        await db.pricing_config.insert_one(config_dict)
        config = config_dict
    
    # Calculate price
    if provider == 'daisysms':
        # Get live pricing
        async with httpx.AsyncClient() as client:
            price_response = await client.get(
                'https://daisysms.com/stubs/handler_api.php',
                params={'api_key': config.get('daisysms_api_key', DAISYSMS_API_KEY), 'action': 'getPricesVerification'},
                timeout=10.0
            )
            if price_response.status_code == 200:
                prices = price_response.json()
                if data.service in prices and '187' in prices[data.service]:
                    base_price_usd = float(prices[data.service]['187'].get('retail_price', 1.0))
                else:
                    base_price_usd = 1.00  # Fallback
            else:
                base_price_usd = 1.00
        
        # Add 35% for each advanced option (our markup)
        if data.area_code or (hasattr(data, 'area_codes') and data.area_codes):
            base_price_usd = base_price_usd * 1.35
        if data.carrier:
            base_price_usd = base_price_usd * 1.35
        if data.phone_make or (hasattr(data, 'preferred_number') and data.preferred_number):
            base_price_usd = base_price_usd * 1.35
    else:
        # Get from cached services
        cached_service = await db.cached_services.find_one({
            'provider': provider,
            'service_code': data.service,
            'country_code': data.country
        }, {'_id': 0})
        
        if not cached_service:
            raise HTTPException(status_code=404, detail="Service not found")
        
        base_price_usd = cached_service['base_price']
        if cached_service['currency'] == 'RUB':
            base_price_usd = base_price_usd * config.get('rub_to_usd_rate', 0.010)
    
    # Apply our markup (default 50%)
    markup = config.get(f'{provider}_markup', 50.0)
    final_price_usd = base_price_usd * (1 + markup / 100)
    
    # Convert to NGN if needed
    ngn_rate = config.get('ngn_to_usd_rate', 1500.0)
    final_price_ngn = final_price_usd * ngn_rate
    
    # Check balance based on payment currency
    if data.payment_currency == 'NGN':
        if user.get('ngn_balance', 0) < final_price_ngn:
            raise HTTPException(status_code=400, detail=f"Insufficient NGN balance. Need ₦{final_price_ngn:.2f}")
    else:  # USD
        if user.get('usd_balance', 0) < final_price_usd:
            raise HTTPException(status_code=400, detail=f"Insufficient USD balance. Need ${final_price_usd:.2f}")
    
    # Purchase from provider
    result = None
    actual_price = base_price_usd
    
    if provider == 'smspool':
        # For SMS-pool we can optionally pass a specific pool chosen by the user
        result = await purchase_number_smspool(
            data.service,
            data.country,
            pool=data.pool
        )
        if result and result.get('success'):
            actual_price = result.get('price', base_price_usd)
    elif provider == 'daisysms':
        # Set max_price to prevent unexpected charges
        max_price = base_price_usd * 2.0  # Allow price variance
        area_codes = data.area_codes or data.area_code
        preferred_num = data.preferred_number or data.phone_make
        
        result = await purchase_number_daisysms(
            data.service, max_price,
            area_codes, data.carrier, preferred_num
        )
        if result and result.get('status_code') == 200:
            actual_price = result.get('actual_price', base_price_usd)
    elif provider == 'tigersms':
        result = await purchase_number_tigersms(data.service, data.country)
        if result and 'ACCESS_NUMBER' in str(result):
            actual_price = base_price_usd
    
    if not result:
        raise HTTPException(status_code=400, detail="Failed to purchase number from provider")
    
    # Parse response
    phone_number = None
    activation_id = None
    
    if provider == 'smspool':
        phone_number = str(result.get('number', ''))
        activation_id = result.get('order_id')
    elif provider == 'daisysms':
        response_text = result.get('text', '')
        if 'ACCESS_NUMBER' in response_text:
            # Format: ACCESS_NUMBER:activation_id:phone_number
            parts = response_text.split(':')
            if len(parts) >= 3:
                activation_id = parts[1].strip()
                phone_number = parts[2].strip()
        else:
            # Handle error responses
            if 'MAX_PRICE_EXCEEDED' in response_text:
                raise HTTPException(status_code=400, detail="Price exceeded maximum. Please try again.")
            elif 'NO_NUMBERS' in response_text:
                raise HTTPException(status_code=400, detail="No numbers available for this service.")
            elif 'TOO_MANY_ACTIVE_RENTALS' in response_text:
                raise HTTPException(status_code=400, detail="Too many active rentals. Please cancel some first.")
            elif 'NO_MONEY' in response_text:
                raise HTTPException(status_code=400, detail="Insufficient provider balance.")
            else:
                raise HTTPException(status_code=400, detail=f"Provider error: {response_text}")
    else:  # tigersms
        response_text = str(result)
        if 'ACCESS_NUMBER' in response_text:
            parts = response_text.split(':')
            if len(parts) >= 3:
                activation_id = parts[1].strip()
                phone_number = parts[2].strip()
    
    if not activation_id or not phone_number:
        raise HTTPException(status_code=400, detail="Failed to get phone number from provider")
    
    # Deduct from appropriate balance ONCE
    if data.payment_currency == 'NGN':
        await db.users.update_one({'id': user['id']}, {'$inc': {'ngn_balance': -final_price_ngn}})
        charged_amount = final_price_ngn
        charged_currency = 'NGN'
    else:
        await db.users.update_one({'id': user['id']}, {'$inc': {'usd_balance': -final_price_usd}})
        charged_amount = final_price_usd
        charged_currency = 'USD'
    
    # Calculate expiry (10 minutes total lifetime for all providers)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    order = SMSOrder(
        user_id=user['id'],
        server=data.server,
        provider=provider,
        service=data.service,
        country=data.country,
        phone_number=phone_number,
        activation_id=activation_id,
        status='active',
        cost_usd=final_price_usd,
        provider_cost=actual_price,
        markup_percentage=markup,
        can_cancel=True,  # Can cancel within 5 minutes
        charged_amount=charged_amount,
        charged_currency=charged_currency,
        area_code=data.area_code,
        carrier=data.carrier,
        phone_make=data.phone_make
    )
    
    order_dict = order.model_dump()
    order_dict['created_at'] = order_dict['created_at'].isoformat()
    order_dict['expires_at'] = expires_at.isoformat()
    await db.sms_orders.insert_one(order_dict)
    
    # Create transaction record
    transaction = Transaction(
        user_id=user['id'],
        type='purchase',
        amount=charged_amount,
        currency=charged_currency,
        status='completed',
        reference=order.id,
        metadata={'service': data.service, 'country': data.country, 'provider': provider, 'phone': phone_number}
    )
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    await db.transactions.insert_one(trans_dict)
    
    # Start background OTP polling (generic for all providers)
    background_tasks.add_task(otp_polling_task, order.id)
    
    # Return order data without MongoDB _id
    return {
        'success': True, 
        'order': {
            'id': order.id,
            'phone_number': phone_number,
            'activation_id': activation_id,
            'provider': provider,
            'service': data.service,
            'country': data.country,
            'status': 'active',
            'cost_usd': final_price_usd,
            'charged_amount': charged_amount,
            'charged_currency': charged_currency,
            'created_at': order_dict['created_at'],
            'expires_at': order_dict['expires_at'],
            'can_cancel': True
        },
        'message': f'Number {phone_number} purchased successfully. Waiting for OTP...'
    }

@api_router.get("/orders/list")
async def list_orders(user: dict = Depends(get_current_user)):
    """Return only the fields needed for the UI to render orders.

    This avoids exposing internal pricing/markup/provider_cost data in
    client-side responses while still allowing the dashboard to work.
    """
    projection = {
        '_id': 0,
        'id': 1,
        'activation_id': 1,
        'server': 1,
        'provider': 1,
        'service': 1,
        'country': 1,
        'phone_number': 1,
        'otp': 1,
        'otp_code': 1,
        'status': 1,
        'created_at': 1,
        'expires_at': 1,
        'can_cancel': 1,
    }
    orders = (
        await db.sms_orders
        .find({'user_id': user['id']}, projection)
        .sort('created_at', -1)
        .to_list(100)
    )
    return {'orders': orders}

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.sms_orders.find_one({'id': order_id, 'user_id': user['id']}, {'_id': 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, user: dict = Depends(get_current_user)):
    # order_id here is actually the activation_id from the provider
    # Find order by activation_id
    order = await db.sms_orders.find_one({'activation_id': order_id, 'user_id': user['id']}, {'_id': 0})
    
    # If not found, try with our internal ID as fallback
    if not order:
        order = await db.sms_orders.find_one({'id': order_id, 'user_id': user['id']}, {'_id': 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order['status'] != 'active':
        raise HTTPException(status_code=400, detail="Order cannot be cancelled")
    
    if order.get('otp') or order.get('otp_code'):
        raise HTTPException(status_code=400, detail="Cannot cancel - OTP already received")
    
    # Calculate elapsed time (for logging/analytics)
    created_at = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00'))
    elapsed = (datetime.now(timezone.utc) - created_at).total_seconds()
    
    # Cancel on provider side using activation_id
    if order.get('activation_id'):
        try:
            success = await cancel_number_provider(order['provider'], order['activation_id'])
            if not success:
                logger.warning(f"Provider cancel failed for order {order['id']}")
        except Exception as e:
            logger.error(f"Provider cancel error: {str(e)}")
    
    # Refund to NGN balance - use the actual amount charged
    # Get current NGN rate from config
    config = await db.pricing_config.find_one({}, {'_id': 0})
    ngn_rate = config.get('ngn_to_usd_rate', 1500.0) if config else 1500.0
    
    # Calculate refund based on the actual charged amount
    # If the order was charged in NGN, refund the full NGN amount
    # If charged in USD, convert back to NGN at current rate
    charged_currency = order.get('charged_currency')
    charged_amount = order.get('charged_amount')
    
    # Fallback for orders created before charged_amount/charged_currency were added
    if charged_amount is None or charged_currency is None:
        # Use cost_usd and convert to NGN with markup
        cost_usd = order.get('cost_usd', 0)
        markup_percent = order.get('markup_percentage', 50.0)
        final_price_usd = cost_usd * (1 + markup_percent / 100)
        refund_ngn = final_price_usd * ngn_rate
        logger.info(f"Fallback refund calculation: cost_usd={cost_usd}, markup={markup_percent}%, final_usd={final_price_usd}, refund_ngn={refund_ngn}")
    else:
        if charged_currency == 'NGN':
            refund_ngn = charged_amount
        else:
            refund_ngn = charged_amount * ngn_rate
        logger.info(f"Direct refund calculation: charged_amount={charged_amount}, charged_currency={charged_currency}, refund_ngn={refund_ngn}")
    
    logger.info(f"Updating user {user['id']} balance by +{refund_ngn} NGN")
    logger.info(f"Order user_id: {order.get('user_id')}, Current user_id: {user['id']}")
    
    # Check balance before update
    user_before = await db.users.find_one({'id': user['id']}, {'_id': 0})
    balance_before = user_before.get('ngn_balance', 0) if user_before else 0
    logger.info(f"Balance before update: {balance_before}")
    
    result = await db.users.update_one({'id': user['id']}, {'$inc': {'ngn_balance': refund_ngn}})
    logger.info(f"Balance update result: matched_count={result.matched_count}, modified_count={result.modified_count}")
    
    # Check balance after update
    user_after = await db.users.find_one({'id': user['id']}, {'_id': 0})
    balance_after = user_after.get('ngn_balance', 0) if user_after else 0
    logger.info(f"Balance after update: {balance_after}, Expected: {balance_before + refund_ngn}")
    
    # Update order status
    await db.sms_orders.update_one({'id': order['id']}, {'$set': {'status': 'cancelled'}})
    
    # Create refund transaction
    transaction = Transaction(
        user_id=user['id'],
        type='refund',
        amount=refund_ngn,
        currency='NGN',
        status='completed',
        reference=order['id'],
        metadata={'reason': 'user_cancelled', 'elapsed_seconds': int(elapsed)}
    )
    trans_dict = transaction.model_dump()
    trans_dict['created_at'] = trans_dict['created_at'].isoformat()
    await db.transactions.insert_one(trans_dict)
    
    return {'success': True, 'message': 'Order cancelled and refunded', 'refund_amount': refund_ngn, 'currency': 'NGN'}

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
async def get_data_plans_endpoint(network: str, category: str = None, user: dict = Depends(get_current_user)):
    """Get data plans for a network"""
    result = await get_data_plans_service(network.lower(), category)
    return result or {'status': False, 'message': 'Failed to fetch plans'}

@api_router.post("/payscribe/buy-airtime")
async def buy_airtime(request: BillPaymentRequest, user: dict = Depends(get_current_user)):
    """Purchase airtime via Payscribe"""
    try:
        # Check balance
        if user.get('ngn_balance', 0) < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient NGN balance")
        
        # Call Payscribe airtime vending
        result = await vend_airtime(request.provider, request.amount, request.recipient, request.metadata.get('ref') if request.metadata else None)
        
        if result and result.get('status'):
            # Deduct from user balance
            await db.users.update_one({'id': user['id']}, {'$inc': {'ngn_balance': -request.amount}})
            
            # Create transaction record
            transaction = Transaction(
                user_id=user['id'],
                type='bill_payment',
                amount=request.amount,
                currency='NGN',
                status='completed',
                reference=result.get('message', {}).get('details', {}).get('trans_id'),
                metadata={'service': 'airtime', 'provider': request.provider, 'recipient': request.recipient}
            )
            trans_dict = transaction.model_dump()
            trans_dict['created_at'] = trans_dict['created_at'].isoformat()
            await db.transactions.insert_one(trans_dict)
            
            return {'success': True, 'message': 'Airtime purchase successful', 'details': result}
        
        raise HTTPException(status_code=400, detail=result.get('description') if result else "Airtime purchase failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Airtime purchase error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

@api_router.post("/payscribe/buy-data")
async def buy_data(request: DataPurchaseRequest, user: dict = Depends(get_current_user)):
    """Purchase data bundle via Payscribe"""
    try:
        # Validate user has sufficient balance (we'll get amount from plan lookup)
        result = await purchase_data(request.plan_code, request.recipient, request.ref)
        
        if result and result.get('status'):
            # Deduct from user balance
            amount = result.get('message', {}).get('details', {}).get('amount', 0)
            await db.users.update_one({'id': user['id']}, {'$inc': {'ngn_balance': -amount}})
            
            # Create transaction record
            transaction = Transaction(
                user_id=user['id'],
                type='bill_payment',
                amount=amount,
                currency='NGN',
                status='completed',
                reference=result.get('message', {}).get('details', {}).get('trans_id'),
                metadata={'service': 'data', 'plan_code': request.plan_code}
            )
            trans_dict = transaction.model_dump()
            trans_dict['created_at'] = trans_dict['created_at'].isoformat()
            await db.transactions.insert_one(trans_dict)
            
            return {'success': True, 'message': 'Data purchase successful', 'details': result}
        
        raise HTTPException(status_code=400, detail="Data purchase failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data purchase error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payscribe/betting-providers")
async def get_betting_providers_list(user: dict = Depends(get_current_user)):
    """Get list of betting service providers"""
    result = await get_betting_providers()
    return result or {'status': False, 'message': 'Failed to fetch providers'}

@api_router.get("/payscribe/validate-bet-account")
async def validate_betting_account(bet_id: str, customer_id: str, user: dict = Depends(get_current_user)):
    """Validate betting account"""
    result = await validate_bet_account(bet_id, customer_id)
    return result or {'status': False, 'message': 'Validation failed'}

@api_router.post("/payscribe/fund-betting")
async def fund_betting_wallet(request: BettingFundRequest, user: dict = Depends(get_current_user)):
    """Fund betting wallet via Payscribe"""
    try:
        # Check balance
        if user.get('ngn_balance', 0) < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient NGN balance")
        
        # Validate account first
        validation = await validate_bet_account(request.bet_id, request.customer_id)
        if not validation or not validation.get('status'):
            raise HTTPException(status_code=400, detail="Invalid betting account")
        
        # Fund wallet
        result = await fund_bet_wallet(request.bet_id, request.customer_id, request.amount, request.ref)
        
        if result and result.get('status'):
            # Deduct from user balance
            await db.users.update_one({'id': user['id']}, {'$inc': {'ngn_balance': -request.amount}})
            
            # Create transaction record
            transaction = Transaction(
                user_id=user['id'],
                type='bill_payment',
                amount=request.amount,
                currency='NGN',
                status='completed',
                reference=result.get('message', {}).get('details', {}).get('trans_id'),
                metadata={'service': 'betting', 'bet_id': request.bet_id, 'customer_id': request.customer_id}
            )
            trans_dict = transaction.model_dump()
            trans_dict['created_at'] = trans_dict['created_at'].isoformat()
            await db.transactions.insert_one(trans_dict)
            
            return {'success': True, 'message': 'Betting wallet funded successfully', 'details': result}
        
        raise HTTPException(status_code=400, detail="Betting wallet funding failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Betting fund error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

@api_router.get("/user/page-toggles")
async def get_page_toggles(user: dict = Depends(get_current_user)):
    """Get which pages are enabled/disabled"""
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        return {
            'enable_virtual_numbers': True,
            'enable_buy_data': True,
            'enable_airtime': True,
            'enable_betting': True,
            'enable_virtual_cards': True,
            'enable_fund_wallet': True,
            'enable_referral': True
        }
    return {
        'enable_virtual_numbers': config.get('enable_virtual_numbers', True),
        'enable_buy_data': config.get('enable_buy_data', True),
        'enable_airtime': config.get('enable_airtime', True),
        'enable_betting': config.get('enable_betting', True),
        'enable_virtual_cards': config.get('enable_virtual_cards', True),
        'enable_fund_wallet': config.get('enable_fund_wallet', True),
        'enable_referral': config.get('enable_referral', True)
    }

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