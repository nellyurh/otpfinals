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
import phpserialize
import json


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

# Logging


# Plisio (Crypto) Config
PLISIO_SECRET_KEY = os.environ.get('PLISIO_SECRET_KEY')
PLISIO_WEBHOOK_SECRET = os.environ.get('PLISIO_WEBHOOK_SECRET')
PLISIO_BASE_URL = 'https://api.plisio.net/api/v1'

FRONTEND_URL = os.environ.get('FRONTEND_URL', '')

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
    is_suspended: bool = False
    is_blocked: bool = False

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

class PromoCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    description: Optional[str] = None
    discount_type: str  # 'percent' | 'fixed_ngn' | 'fixed_usd'
    discount_value: float
    currency: Optional[str] = None  # for fixed discounts
    active: bool = True
    max_total_uses: Optional[int] = None
    one_time_per_user: bool = True
    expires_at: Optional[str] = None  # ISO string
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PromoRedemption(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    promo_id: str
    code: str
    user_id: str
    order_id: Optional[str] = None
    amount_discounted: float = 0.0
    currency: str = 'NGN'
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
    service_name: Optional[str] = None
    country: str
    phone_number: Optional[str] = None
    activation_id: Optional[str] = None
    otp: Optional[str] = None
    otp_code: Optional[str] = None
    sms_text: Optional[str] = None
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
    expires_at: Optional[datetime] = None


class ProviderBalanceResponse(BaseModel):
    success: bool
    balances: Dict[str, Any]


class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    type: str = 'announcement'  # 'announcement' | 'transaction' | 'update'
    active: bool = True
    show_on_login: bool = False
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class NotificationReceipt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    notification_id: str
    user_id: str
    read_at: Optional[str] = None
    dismissed_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PricingConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    # API Keys
    daisysms_api_key: str = ""
    tigersmsms_api_key: str = ""
    smspool_api_key: str = ""
    fivesim_api_key: str = ""
    # Markup percentages
    tigersms_markup: float = 50.0
    daisysms_markup: float = 50.0
    smspool_markup: float = 50.0
    # Currency conversion
    ngn_to_usd_rate: float = 1500.0
    rub_to_usd_rate: float = 0.010  # 1 RUB = ~0.01 USD
    fivesim_coin_per_usd: float = 77.44  # 1 USD = 77.44 5sim coins (editable in admin)
    # DaisySMS specific markups (from their side)
    area_code_markup: float = 20.0  # DaisySMS adds 20% for area code
    carrier_markup: float = 20.0    # DaisySMS adds 20% for carrier
    # Branding (admin editable)
    brand_name: str = "UltraCloud Sms"
    landing_hero_title: str = "Cheapest and Fastest\nOnline SMS Verification"
    landing_hero_subtitle: str = (
        "Buy Premium Quality OTP in Cheapest Price and stay safe from unwanted promotional sms "
        "and calls and also prevent your identity from fraudsters"
    )
    primary_color_hex: str = "#059669"  # emerald-600

    # Manual coin->USD rates (admin editable) for volatile coins
    btc_usd_rate: float = 1420.0
    eth_usd_rate: float = 1420.0
    ltc_usd_rate: float = 1420.0
    doge_usd_rate: float = 1420.0
    bnb_usd_rate: float = 1420.0

    # Page toggles (admin controlled)
    enable_dashboard: bool = True
    enable_transactions: bool = True
    enable_fund_wallet: bool = True
    enable_virtual_numbers: bool = True
    enable_buy_data: bool = True
    enable_airtime: bool = True
    enable_betting: bool = True
    enable_virtual_cards: bool = True
    enable_sms_history: bool = True
    enable_account_upgrade: bool = True
    enable_referral: bool = True
    enable_profile: bool = True
    enable_support: bool = True

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
    service_name: Optional[str] = None
    country: str
    payment_currency: str = 'NGN'  # Default to NGN
    promo_code: Optional[str] = None
    # Optional DaisySMS filters
    area_code: Optional[str] = None
    area_codes: Optional[str] = None  # Comma-separated for frontend
    carrier: Optional[str] = None
    phone_make: Optional[str] = None
    preferred_number: Optional[str] = None
    # Optional SMS-pool pool selector
    pool: Optional[str] = None
    # Optional 5sim operator selector
    operator: Optional[str] = None

class CalculatePriceRequest(BaseModel):
    server: str
    service: str
    country: str
    promo_code: Optional[str] = None
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
    fivesim_coin_per_usd: Optional[float] = None
    daisysms_api_key: Optional[str] = None
    smspool_api_key: Optional[str] = None
    fivesim_api_key: Optional[str] = None
    area_code_markup: Optional[float] = None
    carrier_markup: Optional[float] = None

    # Branding
    brand_name: Optional[str] = None
    landing_hero_title: Optional[str] = None
    landing_hero_subtitle: Optional[str] = None

    # Manual coin->USD rates
    btc_usd_rate: Optional[float] = None
    eth_usd_rate: Optional[float] = None
    ltc_usd_rate: Optional[float] = None
    doge_usd_rate: Optional[float] = None
    bnb_usd_rate: Optional[float] = None

    # Page toggles
    enable_dashboard: Optional[bool] = None
    enable_transactions: Optional[bool] = None
    enable_fund_wallet: Optional[bool] = None
    enable_virtual_numbers: Optional[bool] = None
    enable_buy_data: Optional[bool] = None
    enable_airtime: Optional[bool] = None
    enable_betting: Optional[bool] = None
    enable_virtual_cards: Optional[bool] = None
    enable_sms_history: Optional[bool] = None
    enable_account_upgrade: Optional[bool] = None
    enable_referral: Optional[bool] = None
    enable_profile: Optional[bool] = None
    enable_support: Optional[bool] = None

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

async def _plisio_request(method: str, endpoint: str, params: dict):
    if not PLISIO_SECRET_KEY:
        raise HTTPException(status_code=500, detail='Plisio not configured')
    url = f"{PLISIO_BASE_URL}{endpoint}"
    q = dict(params or {})
    q['api_key'] = PLISIO_SECRET_KEY

    async with httpx.AsyncClient(timeout=30.0) as client_http:
        if method.upper() == 'GET':
            r = await client_http.get(url, params=q)
        else:
            r = await client_http.post(url, data=q)

    try:
        return r.json()
    except Exception:
        return {'status': 'error', 'data': None, 'raw': r.text, 'http_status': r.status_code}


def _plisio_verify_hash(payload: dict) -> bool:
    """Verify Plisio callback using JSON-based HMAC (per Node.js example).

    Expects the callback to be sent with `?json=true` so that the body is JSON.
    Algorithm:
      - Copy payload and remove `verify_hash`
      - Serialize to JSON string
      - Compute HMAC-SHA1 over that string using PLISIO_SECRET_KEY
    """
    try:
        verify_hash = payload.get('verify_hash')
        if not verify_hash or not PLISIO_SECRET_KEY:
            return False

        ordered = dict(payload)
        ordered.pop('verify_hash', None)

        # Normalize known numeric fields to strings (as in official examples)
        if 'expire_utc' in ordered:
            ordered['expire_utc'] = str(ordered['expire_utc'])

        data_str = json.dumps(ordered, separators=(',', ':'), ensure_ascii=False)
        digest = hmac.new(PLISIO_SECRET_KEY.encode('utf-8'), data_str.encode('utf-8'), hashlib.sha1).hexdigest()
        return digest == verify_hash
    except Exception:
        return False

# ============ Helper Functions ============

async def _create_transaction_notification(user_id: str, title: str, message: str, metadata: Optional[dict] = None):
    notif = Notification(
        title=title,
        message=message,
        type='transaction',
        active=True,
        show_on_login=False,
        created_by='system',
    )
    doc = notif.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['user_id'] = user_id  # scoped to user
    if metadata:
        doc['metadata'] = metadata
    await db.notifications.insert_one(doc)


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
        if user.get('is_blocked'):
            raise HTTPException(status_code=403, detail="Account blocked")
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
        api_key = config.get('daisysms_api_key') if config and config.get('daisysms_api_key') not in [None, '********'] else DAISYSMS_API_KEY
        
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
        api_key = config.get('daisysms_api_key') if config and config.get('daisysms_api_key') not in [None, '********'] else DAISYSMS_API_KEY
        
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
        logger.error(f"TigerSMS purchase error: {str(e)}")
        return None

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

async def poll_otp_daisysms_simple(activation_id: str) -> Optional[str]:
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

        elif provider == 'tigersms':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    'https://api.tiger-sms.com/stubs/handler_api.php',
                    params={'api_key': TIGERSMS_API_KEY, 'action': 'setStatus', 'id': activation_id, 'status': 8},
                    timeout=10.0
                )
                return 'ACCESS_CANCEL' in response.text
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
                otp = await poll_otp_daisysms_simple(order['activation_id'])
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

                await _create_transaction_notification(
                    order['user_id'],
                    'Refund processed',
                    f"₦{refund_ngn:,.2f} was refunded to your wallet (Order auto-cancelled).",
                    metadata={'reference': order_id, 'type': 'refund'},
                )

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
        phone=data.phone,
        is_suspended=False,
        is_blocked=False,
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
        # Block suspended users from generating new funding accounts
        if user.get('is_suspended'):
            raise HTTPException(status_code=403, detail="Account suspended")
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
        if api_key == '********':
            api_key = SMSPOOL_API_KEY
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
    except Exception as e:
        logger.error(f"SMS-pool service fetch error: {str(e)}")
        return {'success': False, 'message': str(e)}



@api_router.get("/services/5sim")
async def get_5sim_services(country: Optional[str] = None, user: dict = Depends(get_current_user)):
    """Get 5sim countries or services/operators for Global Server.

    - If no country is provided: return list of available countries.
    - If country is provided: return services with operators (similar to pools).
    """
    try:
        config = await db.pricing_config.find_one({}, {"_id": 0})
        if not config:
            default_config = PricingConfig()
            cfg = default_config.model_dump()
            cfg["updated_at"] = cfg["updated_at"].isoformat()
            await db.pricing_config.insert_one(cfg)
            config = cfg

        coin_rate = float(config.get("fivesim_coin_per_usd", 77.44) or 77.44)
        markup = float(config.get("tigersms_markup", 50.0) or 50.0)  # reuse markup

        async with httpx.AsyncClient() as client:
            if country:
                # Fetch prices for specific country
                resp = await client.get(
                    f"{FIVESIM_BASE_URL}/guest/prices",
                    params={"country": country},
                    timeout=20.0,
                )
                if resp.status_code != 200:
                    logger.error(f"5sim prices error {resp.status_code}: {resp.text}")
                    return {"success": False, "message": "Failed to fetch 5sim services"}

                data = resp.json() or {}
                country_block = data.get(country) or {}
                services: Dict[str, Dict[str, Any]] = {}

                # Structure: country -> product -> operator -> {cost, count, rate}
                for product, operators in country_block.items():
                    for operator_name, info in operators.items():
                        try:
                            base_cost_coins = float(info.get("cost", 0) or 0)
                        except Exception:
                            base_cost_coins = 0.0
                        if base_cost_coins <= 0:
                            continue

                        base_price_usd = base_cost_coins / coin_rate
                        final_price_usd = base_price_usd * (1 + markup / 100)

                        key = product
                        if key not in services:
                            service_label = product.upper()
                            services[key] = {
                                "value": key,
                                "label": service_label,
                                "name": service_label,
                                "price_usd": final_price_usd,
                                "price_ngn": final_price_usd * config.get("ngn_to_usd_rate", 1500.0),
                                "base_price_usd": base_price_usd,
                                "operators": [],
                            }
                        svc = services[key]
                        # track cheapest price
                        if final_price_usd < svc["price_usd"]:
                            svc["price_usd"] = final_price_usd
                            svc["price_ngn"] = final_price_usd * config.get("ngn_to_usd_rate", 1500.0)
                            svc["base_price_usd"] = base_price_usd

                        svc["operators"].append(
                            {
                                "name": operator_name,
                                "base_cost_coins": base_cost_coins,
                                "base_price_usd": base_price_usd,
                                "price_usd": final_price_usd,
                                "price_ngn": final_price_usd * config.get("ngn_to_usd_rate", 1500.0),
                            }
                        )

                result_list = list(services.values())
                result_list.sort(key=lambda x: x["name"])

                # Cache cheapest base USD price per service/country for purchase endpoint
                for svc in result_list:
                    await db.cached_services.update_one(
                        {
                            'provider': '5sim',
                            'service_code': svc['value'],
                            'country_code': country,
                        },
                        {
                            '$setOnInsert': {'currency': 'USD'},
                            '$min': {'base_price': svc['base_price_usd']},
                        },
                        upsert=True,
                    )

                return {"success": True, "country": country, "services": result_list}

            # No country: return list of countries
            resp = await client.get(f"{FIVESIM_BASE_URL}/guest/prices", timeout=20.0)
            if resp.status_code != 200:
                logger.error(f"5sim prices error {resp.status_code}: {resp.text}")
                return {"success": False, "message": "Failed to fetch 5sim countries"}

            data = resp.json() or {}
            countries = [
                {"value": code, "label": code.upper(), "name": code.upper()} for code in data.keys()
            ]
            countries.sort(key=lambda x: x["name"])
            return {"success": True, "countries": countries}
    except Exception as e:
        logger.error(f"5sim services fetch error: {str(e)}")
        return {"success": False, "message": str(e)}

@api_router.get("/services/daisysms")
async def get_daisysms_services(user: dict = Depends(get_current_user)):
    """Get DaisySMS services with LIVE pricing from API"""
    try:
        # Get API key and markup from config
        config = await db.pricing_config.find_one({}, {'_id': 0})
        api_key = config.get('daisysms_api_key') if config and config.get('daisysms_api_key') not in [None, '********'] else DAISYSMS_API_KEY
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


async def _apply_promo_discount(
    *,
    promo_code: Optional[str],
    user_id: str,
    final_price_ngn: float,
    final_price_usd: float,
    ngn_to_usd_rate: float,
):
    """Returns (discount_ngn, discount_usd, promo_doc_or_none)."""
    if not promo_code:
        return 0.0, 0.0, None

    code_norm = promo_code.strip().upper()
    promo = await db.promo_codes.find_one({"code": code_norm, "active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=400, detail="Invalid promo code")

    expires_at = promo.get('expires_at')
    if expires_at:
        try:
            exp = datetime.fromisoformat(expires_at)
            if not exp.tzinfo:
                exp = exp.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > exp:
                raise HTTPException(status_code=400, detail="Promo code expired")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=400, detail="Promo code expired")

    max_total = promo.get('max_total_uses')
    if max_total is not None:
        used = await db.promo_redemptions.count_documents({"promo_id": promo['id']})
        if used >= int(max_total):
            raise HTTPException(status_code=400, detail="Promo code usage limit reached")

    if promo.get('one_time_per_user', True):
        prior = await db.promo_redemptions.find_one({"promo_id": promo['id'], "user_id": user_id}, {"_id": 0})
        if prior:
            raise HTTPException(status_code=400, detail="Promo code already used")

    dtype = promo.get('discount_type')
    dval = float(promo.get('discount_value') or 0)

    discount_ngn = 0.0
    discount_usd = 0.0

    if dtype == 'percent':
        pct = max(0.0, min(100.0, dval))
        discount_ngn = final_price_ngn * (pct / 100.0)
        discount_usd = final_price_usd * (pct / 100.0)
    elif dtype == 'fixed_ngn':
        discount_ngn = max(0.0, dval)
        discount_usd = discount_ngn / (ngn_to_usd_rate or 1500.0)
    elif dtype == 'fixed_usd':
        discount_usd = max(0.0, dval)
        discount_ngn = discount_usd * (ngn_to_usd_rate or 1500.0)
    else:
        raise HTTPException(status_code=400, detail="Invalid promo configuration")

    discount_ngn = min(discount_ngn, final_price_ngn)
    discount_usd = min(discount_usd, final_price_usd)

    return float(discount_ngn), float(discount_usd), promo


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
                    'name': 'Global Server (5sim)',
                    'provider': '5sim',
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
        
        discount_ngn, discount_usd, promo = await _apply_promo_discount(
            promo_code=data.promo_code,
            user_id=user['id'],
            final_price_ngn=final_price_ngn,
            final_price_usd=final_price_usd,
            ngn_to_usd_rate=ngn_rate,
        )

        return {
            'success': True,
            'base_price_usd': round(base_price_usd, 2),
            'our_markup_percent': provider_markup,
            'final_price_usd': round(final_price_usd - discount_usd, 2),
            'final_price_ngn': round(final_price_ngn - discount_ngn, 2),
            'promo': {
                'code': promo.get('code'),
                'discount_ngn': round(discount_ngn, 2),
                'discount_usd': round(discount_usd, 2),
                'type': promo.get('discount_type'),
                'value': promo.get('discount_value'),
            } if promo else None,
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
    # Block suspended users from creating new orders
    if user.get('is_suspended'):
        raise HTTPException(status_code=403, detail="Account suspended")
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
                params={'api_key': (config.get('daisysms_api_key') if config and config.get('daisysms_api_key') not in [None, '********'] else DAISYSMS_API_KEY), 'action': 'getPricesVerification'},
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
    elif provider == '5sim':
        # For 5sim, use cached base USD price from services endpoint
        cached_service = await db.cached_services.find_one({
            'provider': '5sim',
            'service_code': data.service,
            'country_code': data.country
        }, {'_id': 0})
        if not cached_service:
            raise HTTPException(status_code=404, detail="5sim service not found for country")
        base_price_usd = float(cached_service.get('base_price', 0) or 0)
        if base_price_usd <= 0:
            raise HTTPException(status_code=400, detail="Invalid 5sim base price")
    else:
        # Get from cached services (non-5sim providers)
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
    markup = config.get(f'{provider}_markup', 50.0) if provider != '5sim' else config.get('tigersms_markup', 50.0)
    final_price_usd = base_price_usd * (1 + markup / 100)
    
    # Convert to NGN if needed
    ngn_rate = config.get('ngn_to_usd_rate', 1500.0)
    final_price_ngn = final_price_usd * ngn_rate

    # Apply promo code discount (case-insensitive)
    discount_ngn, discount_usd, promo = await _apply_promo_discount(
        promo_code=data.promo_code,
        user_id=user['id'],
        final_price_ngn=final_price_ngn,
        final_price_usd=final_price_usd,
        ngn_to_usd_rate=ngn_rate,
    )
    final_price_ngn = float(final_price_ngn - discount_ngn)
    final_price_usd = float(final_price_usd - discount_usd)

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
    elif provider == '5sim':
        # Use 5sim buy activation API
        if not FIVESIM_API_KEY:
            logger.error("FIVESIM_API_KEY not configured")
            raise HTTPException(status_code=500, detail="5sim API key not configured")
        headers = {
            'Authorization': f'Bearer {FIVESIM_API_KEY}',
            'Accept': 'application/json'
        }
        operator = data.operator or 'any'
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{FIVESIM_BASE_URL}/user/buy/activation/{data.country}/{operator}/{data.service}",
                headers=headers,
                timeout=15.0
            )
        if resp.status_code != 200:
            text = resp.text
            logger.error(f"5sim purchase error {resp.status_code}: {text}")
            if 'no free phones' in text.lower():
                raise HTTPException(status_code=400, detail="5sim: no free phones for this service/country")
            if 'not enough user balance' in text.lower():
                raise HTTPException(status_code=400, detail="5sim account balance is insufficient")
            raise HTTPException(status_code=400, detail="Failed to purchase number from 5sim")
        try:
            result = resp.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Unexpected 5sim response")
        activation_id = str(result.get('id'))
        phone_number = str(result.get('phone'))
        # 5sim price is in coins
        price_coins = float(result.get('price') or 0)
        coin_rate = float(config.get('fivesim_coin_per_usd', 77.44) or 77.44)
        actual_price = price_coins / coin_rate

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
        service_name=data.service_name,
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
    # created_at may not always be present depending on Pydantic model state; ensure it exists
    created_at_val = order_dict.get('created_at')
    if isinstance(created_at_val, datetime):
        order_dict['created_at'] = created_at_val.isoformat()
    else:
        order_dict['created_at'] = datetime.now(timezone.utc).isoformat()
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
    

    # Record promo redemption AFTER order is created and user is charged
    if promo:
        redemption = PromoRedemption(
            promo_id=promo['id'],
            code=promo['code'],
            user_id=user['id'],
            order_id=order.id,
            amount_discounted=discount_ngn if charged_currency == 'NGN' else discount_usd,
            currency=charged_currency,
        )
        red_dict = redemption.model_dump()
        red_dict['created_at'] = red_dict['created_at'].isoformat()
        await db.promo_redemptions.insert_one(red_dict)

    # Start background OTP polling (generic for all providers)
    background_tasks.add_task(otp_polling_task, order.id)

    await _create_transaction_notification(
        user['id'],
        'OTP purchase',
        f"You purchased a number for {data.service.upper()} ({provider}).",
        metadata={'reference': order.id, 'type': 'purchase', 'provider': provider},
    )
    
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
        'user_id': 1,
        'activation_id': 1,
        'server': 1,
        'provider': 1,
        'service': 1,
        'country': 1,
        'phone_number': 1,
        'otp': 1,
        'otp_code': 1,
        'sms_text': 1,
        'status': 1,
        'cost_usd': 1,
        'charged_amount': 1,
        'charged_currency': 1,
        'created_at': 1,
        'expires_at': 1,
        'can_cancel': 1,
        'service_name': 1,
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

# ============ Notifications ============

@api_router.post('/admin/notifications')
async def admin_create_notification(payload: dict, admin: dict = Depends(require_admin)):
    notif = Notification(
        title=payload.get('title') or 'Update',
        message=payload.get('message') or '',
        type=payload.get('type') or 'announcement',
        active=bool(payload.get('active', True)),
        show_on_login=bool(payload.get('show_on_login', False)),
        created_by=admin.get('id'),
    )
    doc = notif.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    # Ensure no Mongo ObjectId leaks into response
    doc.pop('_id', None)
    return {'success': True, 'notification': doc}


@api_router.get('/admin/notifications')
async def admin_list_notifications(admin: dict = Depends(require_admin)):
    notifs = await db.notifications.find({}, {'_id': 0}).to_list(200)
    notifs.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {'success': True, 'notifications': notifs}

@api_router.post('/admin/notifications/broadcast')
async def admin_broadcast_notification(payload: dict, admin: dict = Depends(require_admin)):
    """Create an update/announcement for all users."""
    notif = Notification(
        title=payload.get('title') or 'Update',
        message=payload.get('message') or '',
        type=payload.get('type') or 'update',
        active=bool(payload.get('active', True)),
        show_on_login=bool(payload.get('show_on_login', False)),
        created_by=admin.get('id'),
    )
    doc = notif.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.notifications.insert_one(doc)
    doc.pop('_id', None)
    return {'success': True, 'notification': doc}



@api_router.put('/admin/notifications/{notification_id}')
async def admin_update_notification(notification_id: str, payload: dict, admin: dict = Depends(require_admin)):
    update_fields = {}
    for key in ['title', 'message', 'type', 'active', 'show_on_login']:
        if key in payload:
            update_fields[key] = payload[key]
    update_fields['updated_at'] = datetime.now(timezone.utc).isoformat()

    res = await db.notifications.update_one({'id': notification_id}, {'$set': update_fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail='Notification not found')
    notif = await db.notifications.find_one({'id': notification_id}, {'_id': 0})
    return {'success': True, 'notification': notif}


@api_router.get('/notifications')
async def get_notifications(user: dict = Depends(get_current_user)):
    # return latest notifications with read/dismiss status
    notifs = await db.notifications.find({'active': True, '$or': [{'user_id': {'$exists': False}}, {'user_id': user['id']}]}, {'_id': 0}).to_list(200)
    notifs.sort(key=lambda x: x.get('created_at', ''), reverse=True)

    receipts = await db.notification_receipts.find({'user_id': user['id']}, {'_id': 0}).to_list(500)
    receipt_map = {r['notification_id']: r for r in receipts}

    items = []
    unread_count = 0
    for n in notifs[:50]:
        r = receipt_map.get(n['id'])
        dismissed = bool(r and r.get('dismissed_at'))
        read = bool(r and r.get('read_at'))
        if not dismissed and not read:
            unread_count += 1
        items.append({
            **n,
            'read_at': r.get('read_at') if r else None,
            'dismissed_at': r.get('dismissed_at') if r else None,
        })

    return {'success': True, 'unread_count': unread_count, 'notifications': items}


@api_router.post('/notifications/{notification_id}/read')
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.notification_receipts.find_one({'notification_id': notification_id, 'user_id': user['id']}, {'_id': 0})
    if existing:
        await db.notification_receipts.update_one({'id': existing['id']}, {'$set': {'read_at': now}})
    else:
        rec = NotificationReceipt(notification_id=notification_id, user_id=user['id'], read_at=now)
        doc = rec.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.notification_receipts.insert_one(doc)
    return {'success': True}


@api_router.post('/notifications/{notification_id}/dismiss')
async def dismiss_notification(notification_id: str, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    existing = await db.notification_receipts.find_one({'notification_id': notification_id, 'user_id': user['id']}, {'_id': 0})
    if existing:
        await db.notification_receipts.update_one({'id': existing['id']}, {'$set': {'dismissed_at': now}})
    else:
        rec = NotificationReceipt(notification_id=notification_id, user_id=user['id'], dismissed_at=now)
        doc = rec.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.notification_receipts.insert_one(doc)
    return {'success': True}


@api_router.get('/notifications/login-popups')
async def get_login_popups(user: dict = Depends(get_current_user)):
    # Only those marked show_on_login, not dismissed
    popups = await db.notifications.find({'active': True, 'show_on_login': True, '$or': [{'user_id': {'$exists': False}}, {'user_id': user['id']}]}, {'_id': 0}).to_list(50)
    popups.sort(key=lambda x: x.get('created_at', ''), reverse=True)

    receipts = await db.notification_receipts.find({'user_id': user['id']}, {'_id': 0}).to_list(500)
    dismissed_ids = {r['notification_id'] for r in receipts if r.get('dismissed_at')}

    items = [p for p in popups if p.get('id') not in dismissed_ids]
    return {'success': True, 'popups': items[:3]}

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

# ============ Promo Codes (Admin) ============

@api_router.post("/admin/promo-codes")
async def create_promo_code(payload: dict, admin: dict = Depends(require_admin)):
    code = (payload.get('code') or '').strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")

    exists = await db.promo_codes.find_one({"code": code}, {"_id": 0})
    if exists:
        raise HTTPException(status_code=400, detail="Promo code already exists")

    promo = PromoCode(
        code=code,
        description=payload.get('description'),
        discount_type=payload.get('discount_type'),
        discount_value=float(payload.get('discount_value') or 0),
        currency=payload.get('currency'),
        active=bool(payload.get('active', True)),
        max_total_uses=payload.get('max_total_uses'),
        one_time_per_user=bool(payload.get('one_time_per_user', True)),
        expires_at=payload.get('expires_at'),
    )

    doc = promo.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.promo_codes.insert_one(doc)
    return {"success": True, "promo": doc}


@api_router.get("/admin/promo-codes")
async def list_promo_codes(admin: dict = Depends(require_admin)):
    promos = await db.promo_codes.find({}, {"_id": 0}).to_list(200)
    promos.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return {"success": True, "promos": promos}


@api_router.put("/admin/promo-codes/{promo_id}")
async def update_promo_code(promo_id: str, payload: dict, admin: dict = Depends(require_admin)):
    update_fields = {}
    for key in [
        'description',
        'discount_type',
        'discount_value',
        'currency',
        'active',
        'max_total_uses',
        'one_time_per_user',
        'expires_at',
    ]:
        if key in payload:
            update_fields[key] = payload[key]

    if 'discount_value' in update_fields:
        update_fields['discount_value'] = float(update_fields.get('discount_value') or 0)

    update_fields['updated_at'] = datetime.now(timezone.utc).isoformat()

    res = await db.promo_codes.update_one({"id": promo_id}, {"$set": update_fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")

    promo = await db.promo_codes.find_one({"id": promo_id}, {"_id": 0})
    return {"success": True, "promo": promo}


@api_router.post("/promo/validate")
async def validate_promo_code(payload: dict, user: dict = Depends(get_current_user)):
    """Validate promo and return discount preview (OTP purchase only)."""
    code = (payload.get('code') or '').strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")

    # We validate eligibility without requiring price context here.
    promo = await db.promo_codes.find_one({"code": code, "active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=400, detail="Invalid promo code")

    expires_at = promo.get('expires_at')
    if expires_at:
        exp = datetime.fromisoformat(expires_at)
        if not exp.tzinfo:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(status_code=400, detail="Promo code expired")



@api_router.get('/admin/provider-balances')
async def admin_provider_balances(admin: dict = Depends(require_admin)):
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        default_config = PricingConfig()
        cfg = default_config.model_dump()
        cfg['updated_at'] = cfg['updated_at'].isoformat()
        await db.pricing_config.insert_one(cfg)
        config = cfg

    daisysms_key = config.get('daisysms_api_key') or DAISYSMS_API_KEY
    smspool_key = config.get('smspool_api_key') or SMSPOOL_API_KEY
    fivesim_key = config.get('fivesim_api_key') or FIVESIM_API_KEY

    balances = {
        'daisysms': None,
        'smspool': None,
        '5sim': None,
    }

    # DaisySMS balance
    if daisysms_key and daisysms_key != '********':
        try:
            url = f"https://daisysms.com/stubs/handler_api.php?api_key={daisysms_key}&action=getBalance"
            async with httpx.AsyncClient(timeout=15.0) as client_http:
                r = await client_http.get(url)
            if r.status_code == 200:
                # example: ACCESS_BALANCE:10.00
                txt = r.text.strip()
                parts = txt.split(':')
                balances['daisysms'] = {'raw': txt, 'balance': float(parts[1]) if len(parts) > 1 else None}
        except Exception:
            balances['daisysms'] = {'error': 'failed'}

    # SMS-pool balance
    if smspool_key and smspool_key != '********':
        try:
            url = f"https://api.smspool.net/request/balance?key={smspool_key}"
            async with httpx.AsyncClient(timeout=15.0) as client_http:
                r = await client_http.get(url)
            if r.status_code == 200:
                j = r.json()
                balances['smspool'] = j
        except Exception:
            balances['smspool'] = {'error': 'failed'}

    # 5sim balance
    if fivesim_key and fivesim_key != '********':
        try:
            async with httpx.AsyncClient(timeout=15.0) as client_http:
                r = await client_http.get('https://5sim.net/v1/user/profile', headers={'Authorization': f'Bearer {fivesim_key}'})
            if r.status_code == 200:
                balances['5sim'] = r.json()
            else:
                balances['5sim'] = {'status_code': r.status_code}
        except Exception:
            balances['5sim'] = {'error': 'failed'}

    return {'success': True, 'balances': balances}

# ============ Crypto Deposits (Plisio) ============

@api_router.post('/crypto/plisio/create-invoice')
async def plisio_create_invoice(payload: dict, user: dict = Depends(get_current_user)):
    """Create a Plisio invoice and return address/QR fields for UI."""
    # Block suspended users from funding wallet via crypto
    if user.get('is_suspended'):
        raise HTTPException(status_code=403, detail="Account suspended")
    amount_usd = float(payload.get('amount_usd') or 0)
    currency = (payload.get('currency') or 'USDT').upper()

    if amount_usd <= 0:
        raise HTTPException(status_code=400, detail='Amount is required')

    order_id = str(uuid.uuid4())
    callback_url = f"{FRONTEND_URL.rstrip('/')}/api/crypto/plisio/webhook?json=true" if FRONTEND_URL else None

    resp = await _plisio_request('GET', '/invoices/new', {
        'currency': currency,
        'order_name': f"UltraCloud Sms Wallet Deposit ({user['email']})",
        'order_number': order_id,
        'source_currency': 'USD',
        'source_amount': amount_usd,
        'allowed_psys_cids': currency,
        'callback_url': callback_url,
        'email': user.get('email'),
        'expire_min': 10,
        'description': f"Wallet top-up for {user['email']}",
    })

    if not resp or resp.get('status') != 'success':
        # Plisio error payload structure: {"status":"error","data":{...}}
        msg = 'Failed to create invoice'
        try:
            data_err = resp.get('data') or {}
            if isinstance(data_err, dict) and data_err.get('message'):
                msg = f"Plisio error: {data_err['message']}"
        except Exception:
            pass
        raise HTTPException(status_code=400, detail=msg)

    data = resp.get('data') or {}

    # Determine expiry time from Plisio (expire_utc) or fallback to 10 minutes
    expires_at_iso = None
    exp_utc = data.get('expire_utc')
    if exp_utc is not None:
        try:
            exp_dt = datetime.fromtimestamp(int(exp_utc), tz=timezone.utc)
            expires_at_iso = exp_dt.isoformat()
        except Exception:
            expires_at_iso = None
    if not expires_at_iso:
        expires_at_iso = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    invoice_doc = {
        'id': order_id,
        'user_id': user['id'],
        'provider': 'plisio',
        'invoice_id': data.get('txn_id') or data.get('id') or data.get('invoice'),
        'currency': currency,
        'amount_usd': amount_usd,
        'status': 'pending',
        'plisio_status': (data.get('status') or 'new').lower(),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'expires_at': expires_at_iso,
        # Flatten a few commonly used fields for easy frontend display
        'address': data.get('wallet_hash') or data.get('address'),
        'amount_crypto': data.get('amount') or data.get('amount_to_pay'),
        'qr': data.get('qr_code') or data.get('qr'),
        'invoice_url': data.get('invoice_url'),
        'raw': data,
    }
    await db.crypto_invoices.insert_one(invoice_doc)

    return {
        'success': True,
        'deposit': {
            'id': order_id,
            'currency': currency,
            'amount_usd': amount_usd,
            'address': data.get('wallet_hash') or data.get('address'),
            'amount_crypto': data.get('amount') or data.get('amount_to_pay'),
            'qr': data.get('qr_code') or data.get('qr'),
            'invoice_url': data.get('invoice_url'),
            'status': 'pending',
            'expires_at': expires_at_iso,
        }
    }


@api_router.post('/crypto/plisio/webhook')
async def plisio_webhook(request: Request):
    payload = {}
    try:
        payload = await request.json()
    except Exception:
        # fallback to form
        form = await request.form()
        payload = dict(form)

    # best-effort verification (some Plisio configs rely on api_key only)
    if payload.get('verify_hash') and not _plisio_verify_hash(payload):
        raise HTTPException(status_code=400, detail='Invalid signature')

    order_number = payload.get('order_number') or payload.get('order') or payload.get('order_id')
    if not order_number:
        return {'success': True}

    invoice = await db.crypto_invoices.find_one({'id': order_number}, {'_id': 0})
    if not invoice:
        return {'success': True}

    status_val = (payload.get('status') or payload.get('invoice_status') or '').lower()
    paid = status_val in ['completed', 'paid', 'success', 'finished']

    update_fields = {
        'plisio_status': status_val,
        'webhook': payload,
        'last_webhook_at': datetime.now(timezone.utc).isoformat(),
    }

    if paid and invoice.get('status') != 'paid':
        # Credit USD
        amount_usd = float(invoice.get('amount_usd') or 0)
        await db.users.update_one({'id': invoice['user_id']}, {'$inc': {'usd_balance': amount_usd}})

        # Transaction
        transaction = Transaction(
            user_id=invoice['user_id'],
            type='deposit_usd',
            amount=amount_usd,
            currency='USD',
            status='completed',
            reference=str(invoice.get('invoice_id') or invoice.get('id')),
            metadata={'provider': 'plisio', 'currency': invoice.get('currency')}
        )
        trans_dict = transaction.model_dump()
        trans_dict['created_at'] = trans_dict['created_at'].isoformat()
        await db.transactions.insert_one(trans_dict)

        await _create_transaction_notification(
            invoice['user_id'],
            'Crypto deposit confirmed',
            f"Your wallet was credited ${amount_usd:,.2f}.",
            metadata={'reference': trans_dict.get('id'), 'type': 'deposit_usd', 'provider': 'plisio'},
        )

        update_fields['status'] = 'paid'
        update_fields['paid_at'] = datetime.now(timezone.utc).isoformat()

    await db.crypto_invoices.update_one({'id': order_number}, {'$set': update_fields})

    return {'success': True}


@api_router.post('/crypto/plisio/cancel/{deposit_id}')
async def plisio_cancel(deposit_id: str, user: dict = Depends(get_current_user)):
    """Allow a user to cancel/clear an unpaid crypto deposit locally."""
    inv = await db.crypto_invoices.find_one({'id': deposit_id, 'user_id': user['id']}, {'_id': 0})
    if not inv:
        raise HTTPException(status_code=404, detail='Not found')

    if inv.get('status') == 'paid':
        raise HTTPException(status_code=400, detail='Cannot cancel a paid deposit')

    now_iso = datetime.now(timezone.utc).isoformat()
    await db.crypto_invoices.update_one(
        {'id': deposit_id},
        {'$set': {'status': 'cancelled', 'cancelled_at': now_iso}},
    )

    return {'success': True}


@api_router.get('/crypto/plisio/current')
async def plisio_current(user: dict = Depends(get_current_user)):
    """Return the most recent active Plisio deposit for the current user."""
    cursor = db.crypto_invoices.find(
        {'user_id': user['id'], 'status': {'$in': ['pending', 'new']}},
        {'_id': 0},
    ).sort('created_at', -1).limit(1)
    items = await cursor.to_list(1)
    if not items:
        return {'success': True, 'deposit': None}

    inv = items[0]

    # Auto-expire if past expires_at and not yet paid/expired
    expires_at = inv.get('expires_at')
    if expires_at:
        try:
            exp = datetime.fromisoformat(expires_at)
            if not exp.tzinfo:
                exp = exp.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            if now > exp and inv.get('status') not in ['paid', 'expired']:
                inv['status'] = 'expired'
                await db.crypto_invoices.update_one(
                    {'id': inv['id']},
                    {'$set': {'status': 'expired', 'expired_at': now.isoformat()}},
                )
        except Exception:
            pass

    return {'success': True, 'deposit': inv}


@api_router.get('/crypto/plisio/status/{deposit_id}')
async def plisio_status(deposit_id: str, user: dict = Depends(get_current_user)):
    inv = await db.crypto_invoices.find_one({'id': deposit_id, 'user_id': user['id']}, {'_id': 0})
    if not inv:
        raise HTTPException(status_code=404, detail='Not found')
    return {'success': True, 'deposit': inv}


@api_router.post('/admin/purge')
async def admin_purge(payload: dict, admin: dict = Depends(require_admin)):
    """Dangerous: purge user data (users/orders/transactions) as requested."""
    confirm = payload.get('confirm')
    if confirm != 'CONFIRM PURGE':
        raise HTTPException(status_code=400, detail='Missing confirmation')

    # Delete all non-admin users
    await db.users.delete_many({'is_admin': {'$ne': True}})

    # Delete all orders and all transactions (including admin history)
    await db.sms_orders.delete_many({})
    await db.transactions.delete_many({})

    # Delete notification receipts and user-scoped notifications; keep global announcements/updates
    await db.notification_receipts.delete_many({})
    await db.notifications.delete_many({'user_id': {'$exists': True}})

    # Delete promo redemptions (promo codes remain)
    await db.promo_redemptions.delete_many({})

    return {'success': True}

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

            await _create_transaction_notification(
                user['id'],
                'Airtime purchase',
                f"Airtime purchase of ₦{request.amount:,.2f} completed.",
                metadata={'reference': trans_dict.get('id'), 'type': 'bill_payment', 'service': 'airtime'},
            )
            
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

            await _create_transaction_notification(
                user['id'],
                'Data purchase',
                f"Data purchase of ₦{amount:,.2f} completed.",
                metadata={'reference': trans_dict.get('id'), 'type': 'bill_payment', 'service': 'data'},
            )
            
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

            await _create_transaction_notification(
                user['id'],
                'Betting funded',
                f"₦{request.amount:,.2f} was used to fund betting wallet.",
                metadata={'reference': trans_dict.get('id'), 'type': 'bill_payment'},
            )

            return {'success': True, 'message': 'Betting wallet funded successfully', 'details': result}

        raise HTTPException(status_code=400, detail="Betting wallet funding failed")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Betting fund error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/users")
async def admin_list_users(admin: dict = Depends(require_admin)):
    """List users for admin view (basic snapshot)."""
    users_cursor = db.users.find({}, {
        "_id": 0,
        "id": 1,
        "email": 1,
        "full_name": 1,
        "ngn_balance": 1,
        "usd_balance": 1,
        "is_admin": 1,
        "is_suspended": 1,
        "is_blocked": 1,
        "created_at": 1,
    }).sort("created_at", -1).limit(100)
    users = await users_cursor.to_list(100)
    return {"success": True, "users": users}

@api_router.get("/admin/top-services")
async def admin_top_services(
    admin: dict = Depends(require_admin),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Return top OTP services by sales volume for the selected period."""
    now = datetime.now(timezone.utc)
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            if not end.tzinfo:
                end = end.replace(tzinfo=timezone.utc)
        except Exception:
            end = now
    else:
        end = now

    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            if not start.tzinfo:
                start = start.replace(tzinfo=timezone.utc)
        except Exception:
            start = end - timedelta(days=1)
    else:
        start = end - timedelta(days=1)

    match_stage = {
        "created_at": {"$gte": start.isoformat(), "$lte": end.isoformat()},
    }

    # Aggregate transactions by service using metadata.service when available
    pipeline = [
        {"$match": {**match_stage, "type": "purchase", "status": "completed"}},
        {
            "$group": {
                "_id": {"service": "$metadata.service"},
                "total_amount": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"total_amount": -1}},
        {"$limit": 20},
    ]

    cursor = db.transactions.aggregate(pipeline)
    rows = await cursor.to_list(20)

    services = []
    for row in rows:
        sid = row.get("_id", {}) or {}
        service_code = sid.get("service") or "unknown"
        services.append(
            {
                "service": service_code,
                "total_amount": float(row.get("total_amount", 0) or 0),
                "count": row.get("count", 0),
            }
        )

    return {
        "success": True,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "services": services,
    }


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

    # Never expose raw provider API keys in admin GET (security)
    config_sanitized = dict(config)
    for key in ['daisysms_api_key', 'tigersms_api_key', 'smspool_api_key', 'fivesim_api_key']:
        if key in config_sanitized:
            config_sanitized[key] = '********'  # masked in GET; editable via PUT
    return config_sanitized


@api_router.get("/public/branding")
async def get_public_branding():
    """Public branding used by landing page (no auth)."""
    config = await db.pricing_config.find_one({}, {"_id": 0})
    if not config:
        default_config = PricingConfig()
        cfg = default_config.model_dump()
        cfg["updated_at"] = cfg["updated_at"].isoformat()
        await db.pricing_config.insert_one(cfg)
        config = cfg

    return {
        "brand_name": config.get("brand_name", "UltraCloud Sms"),
        "primary_color_hex": config.get("primary_color_hex", "#059669"),
        "landing_hero_title": config.get("landing_hero_title", "Cheapest and Fastest\nOnline SMS Verification"),
        "landing_hero_subtitle": config.get(
            "landing_hero_subtitle",
            "Buy Premium Quality OTP in Cheapest Price and stay safe from unwanted promotional sms and calls and also prevent your identity from fraudsters",
        ),
    }

@api_router.get("/user/page-toggles")
async def get_page_toggles(user: dict = Depends(get_current_user)):
    """Get which pages are enabled/disabled (controls user dashboard availability)."""
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        return {
            'enable_dashboard': True,
            'enable_transactions': True,
            'enable_fund_wallet': True,
            'enable_virtual_numbers': True,
            'enable_buy_data': True,
            'enable_airtime': True,
            'enable_betting': True,
            'enable_virtual_cards': True,
            'enable_sms_history': True,
            'enable_account_upgrade': True,
            'enable_referral': True,
            'enable_profile': True,
            'enable_support': True,
        }
    return {
        'enable_dashboard': config.get('enable_dashboard', True),
        'enable_transactions': config.get('enable_transactions', True),
        'enable_fund_wallet': config.get('enable_fund_wallet', True),
        'enable_virtual_numbers': config.get('enable_virtual_numbers', True),
        'enable_buy_data': config.get('enable_buy_data', True),
        'enable_airtime': config.get('enable_airtime', True),
        'enable_betting': config.get('enable_betting', True),
        'enable_virtual_cards': config.get('enable_virtual_cards', True),
        'enable_sms_history': config.get('enable_sms_history', True),
        'enable_account_upgrade': config.get('enable_account_upgrade', True),
        'enable_referral': config.get('enable_referral', True),
        'enable_profile': config.get('enable_profile', True),
        'enable_support': config.get('enable_support', True),
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
    if data.fivesim_coin_per_usd is not None:
        update_fields['fivesim_coin_per_usd'] = data.fivesim_coin_per_usd
    if data.daisysms_api_key is not None:
        update_fields['daisysms_api_key'] = data.daisysms_api_key
    if data.smspool_api_key is not None:
        update_fields['smspool_api_key'] = data.smspool_api_key
    if data.fivesim_api_key is not None:
        update_fields['fivesim_api_key'] = data.fivesim_api_key
    if data.area_code_markup is not None:
        update_fields['area_code_markup'] = data.area_code_markup
    if data.carrier_markup is not None:
        update_fields['carrier_markup'] = data.carrier_markup

    # Branding
    if data.brand_name is not None:
        update_fields['brand_name'] = data.brand_name
    if data.landing_hero_title is not None:
        update_fields['landing_hero_title'] = data.landing_hero_title
    if data.landing_hero_subtitle is not None:
        update_fields['landing_hero_subtitle'] = data.landing_hero_subtitle

    # Manual coin->USD rates
    for key in ['btc_usd_rate', 'eth_usd_rate', 'ltc_usd_rate', 'doge_usd_rate', 'bnb_usd_rate']:
        val = getattr(data, key, None)
        if val is not None:
            update_fields[key] = val

    # Page toggles
    for key in [
        'enable_dashboard',
        'enable_transactions',
        'enable_fund_wallet',
        'enable_virtual_numbers',
        'enable_buy_data',
        'enable_airtime',
        'enable_betting',
        'enable_virtual_cards',
        'enable_sms_history',
        'enable_account_upgrade',
        'enable_referral',
        'enable_profile',
        'enable_support',
    ]:
        val = getattr(data, key, None)
        if val is not None:
            update_fields[key] = val
    
    update_fields['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.pricing_config.update_one({}, {'$set': update_fields}, upsert=True)
    
    return {'success': True, 'updated': update_fields}

@api_router.get("/admin/stats")
async def get_admin_stats(
    admin: dict = Depends(require_admin),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Admin metrics dashboard stats for a selected period (default last 7 days)."""
    # Base user + order counts (all-time)
    total_users = await db.users.count_documents({})
    total_orders = await db.sms_orders.count_documents({})
    active_orders = await db.sms_orders.count_documents({'status': 'active'})

    # Resolve date range
    now = datetime.now(timezone.utc)
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            if not end.tzinfo:
                end = end.replace(tzinfo=timezone.utc)
        except Exception:
            end = now
    else:
        end = now

    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            if not start.tzinfo:
                start = start.replace(tzinfo=timezone.utc)
        except Exception:
            start = end - timedelta(days=7)
    else:
        start = end - timedelta(days=7)

    # Transactions in period
    period_match = {
        'created_at': {
            '$gte': start.isoformat(),
            '$lte': end.isoformat(),
        }
    }

    # Total deposits (NGN + USD) in period
    deposits_cursor = db.transactions.aggregate([
        {
            '$match': {
                **period_match,
                'type': {'$in': ['deposit_ngn', 'deposit_usd']},
                'status': 'completed',
            }
        },
        {
            '$group': {
                '_id': '$currency',
                'total': {'$sum': '$amount'},
            }
        },
    ])
    deposit_totals = await deposits_cursor.to_list(10)
    total_deposits_ngn = 0.0
    total_deposits_usd_native = 0.0
    for row in deposit_totals:
        cur = row.get('_id')
        amt = float(row.get('total', 0) or 0)
        if cur == 'NGN':
            total_deposits_ngn += amt
        elif cur == 'USD':
            total_deposits_usd_native += amt

    # Load pricing config for FX
    config = await db.pricing_config.find_one({}, {'_id': 0})
    if not config:
        default_config = PricingConfig()
        cfg = default_config.model_dump()
        cfg['updated_at'] = cfg['updated_at'].isoformat()
        await db.pricing_config.insert_one(cfg)
        config = cfg

    ngn_rate = float(config.get('ngn_to_usd_rate', 1500.0) or 1500.0)

    total_deposits_usd = (total_deposits_ngn / ngn_rate) + total_deposits_usd_native

    # Total sales (OTP spend) in period - purchase transactions
    sales_cursor = db.transactions.aggregate([
        {
            '$match': {
                **period_match,
                'type': 'purchase',
                'status': 'completed',
            }
        },
        {
            '$group': {
                '_id': '$currency',
                'total': {'$sum': '$amount'},
            }
        },
    ])
    sales_totals = await sales_cursor.to_list(5)
    total_sales_usd = 0.0
    total_sales_ngn = 0.0
    for row in sales_totals:
        cur = row.get('_id')
        amt = float(row.get('total', 0) or 0)
        if cur == 'USD':
            total_sales_usd += amt
            total_sales_ngn += amt * ngn_rate
        elif cur == 'NGN':
            total_sales_usd += amt / ngn_rate
            total_sales_ngn += amt

    # API cost from sms_orders (cost_usd) in period
    api_cost_cursor = db.sms_orders.aggregate([
        {
            '$match': {
                'created_at': {
                    '$gte': start.isoformat(),
                    '$lte': end.isoformat(),
                }
            }
        },
        {
            '$group': {
                '_id': None,
                'total_cost_usd': {'$sum': {'$ifNull': ['$cost_usd', 0]}},
            }
        },
    ])
    api_cost_rows = await api_cost_cursor.to_list(1)
    api_cost_usd = float(api_cost_rows[0].get('total_cost_usd', 0) or 0) if api_cost_rows else 0.0

    # ================= Additional metrics for ads, users & risk =================

    # Fetch new and old users for the period
    new_users_cursor = db.users.find(
        {
            'created_at': {
                '$gte': start.isoformat(),
                '$lte': end.isoformat(),
            }
        },
        {'_id': 0, 'id': 1},
    )
    new_users = await new_users_cursor.to_list(5000)
    new_user_ids = {u['id'] for u in new_users if u.get('id')}
    new_users_count = len(new_user_ids)

    old_users_cursor = db.users.find(
        {
            'created_at': {'$lt': start.isoformat()}
        },
        {'_id': 0, 'id': 1},
    )
    old_users = await old_users_cursor.to_list(5000)
    old_user_ids = {u['id'] for u in old_users if u.get('id')}

    # All deposit transactions in period
    deposit_txs_cursor = db.transactions.find(
        {
            **period_match,
            'type': {'$in': ['deposit_ngn', 'deposit_usd']},
            'status': 'completed',
        },
        {'_id': 0, 'user_id': 1, 'currency': 1, 'amount': 1},
    )
    deposit_txs = await deposit_txs_cursor.to_list(20000)

    depositors_all: set[str] = set()
    new_depositors: set[str] = set()
    old_depositors: set[str] = set()
    new_deposits_ngn = 0.0
    old_deposits_ngn = 0.0

    for tx in deposit_txs:
        uid = tx.get('user_id')
        if not uid:
            continue
        depositors_all.add(uid)
        amt = float(tx.get('amount', 0) or 0)
        cur = tx.get('currency')
        amt_ngn = amt * ngn_rate if cur == 'USD' else amt
        if uid in new_user_ids:
            new_depositors.add(uid)
            new_deposits_ngn += amt_ngn
        elif uid in old_user_ids:
            old_depositors.add(uid)
            old_deposits_ngn += amt_ngn

    new_depositors_count = len(new_depositors)
    old_depositors_count = len(old_depositors)

    # All purchase transactions in period
    purchase_txs_cursor = db.transactions.find(
        {
            **period_match,
            'type': 'purchase',
            'status': 'completed',
        },
        {'_id': 0, 'user_id': 1, 'currency': 1, 'amount': 1, 'metadata': 1},
    )
    purchase_txs = await purchase_txs_cursor.to_list(20000)

    buyers_all: set[str] = set()
    whatsapp_sales_ngn = 0.0
    signal_sales_ngn = 0.0
    total_sales_ngn_from_txs = 0.0

    WHATSAPP_CODES = {'wa', 'whatsapp'}
    SIGNAL_CODES = {'signal', 'sg', 'si'}

    for tx in purchase_txs:
        uid = tx.get('user_id')
        if not uid:
            continue
        buyers_all.add(uid)
        amt = float(tx.get('amount', 0) or 0)
        cur = tx.get('currency')
        amt_ngn = amt * ngn_rate if cur == 'USD' else amt
        total_sales_ngn_from_txs += amt_ngn
        meta = tx.get('metadata') or {}
        service_code = str(meta.get('service', '')).lower()
        if service_code in WHATSAPP_CODES:
            whatsapp_sales_ngn += amt_ngn
        if service_code in SIGNAL_CODES:
            signal_sales_ngn += amt_ngn

    period_depositors_count = len(depositors_all)
    period_buyers_count = len(buyers_all)

    # Deposit-to-buy conversion
    depositors_who_bought = depositors_all & buyers_all
    depositors_who_bought_count = len(depositors_who_bought)

    deposit_conversion_rate = (
        (new_depositors_count / new_users_count) * 100.0 if new_users_count > 0 else 0.0
    )
    deposit_to_buy_conversion = (
        (depositors_who_bought_count / period_depositors_count) * 100.0
        if period_depositors_count > 0
        else 0.0
    )

    # New vs old buyers in this period
    new_buyers_ids = buyers_all & new_user_ids
    old_buyers_ids = buyers_all & old_user_ids
    new_buyers_count = len(new_buyers_ids)
    old_buyers_count = len(old_buyers_ids)
    repeat_buyer_rate = (
        (old_buyers_count / period_buyers_count) * 100.0 if period_buyers_count > 0 else 0.0
    )

    # Old users buying without depositing in this period
    old_buyers_without_deposit = old_buyers_ids - depositors_all
    old_buyers_without_deposit_count = len(old_buyers_without_deposit)
    old_buyers_without_deposit_sales_ngn = 0.0
    if old_buyers_without_deposit_count:
        old_set = set(old_buyers_without_deposit)
        for tx in purchase_txs:
            uid = tx.get('user_id')
            if uid not in old_set:
                continue
            amt = float(tx.get('amount', 0) or 0)
            cur = tx.get('currency')
            amt_ngn = amt * ngn_rate if cur == 'USD' else amt
            old_buyers_without_deposit_sales_ngn += amt_ngn

    # Service risk metrics
    total_sales_ngn_effective = total_sales_ngn_from_txs or total_sales_ngn
    whatsapp_share = (
        (whatsapp_sales_ngn / total_sales_ngn_effective) * 100.0 if total_sales_ngn_effective > 0 else 0.0
    )
    signal_share = (
        (signal_sales_ngn / total_sales_ngn_effective) * 100.0 if total_sales_ngn_effective > 0 else 0.0
    )

    # Average selling price per OTP
    otp_count_period = await db.sms_orders.count_documents(
        {
            'created_at': {
                '$gte': start.isoformat(),
                '$lte': end.isoformat(),
            }
        }
    )
    avg_selling_price_ngn = (
        total_sales_ngn_effective / otp_count_period if otp_count_period > 0 else 0.0
    )

    # Price spike exposure: orders where provider cost > sell price
    price_spike_exposure_count = await db.sms_orders.count_documents(
        {
            'created_at': {
                '$gte': start.isoformat(),
                '$lte': end.isoformat(),
            },
            'provider_cost': {'$gt': 0},
            '$expr': {'$gt': ['$provider_cost', '$cost_usd']},
        }
    )

    # Active unfulfilled numbers value
    active_unfulfilled_cursor = db.sms_orders.aggregate([
        {
            '$match': {
                'status': 'active',
                'otp': None,
            }
        },
        {
            '$group': {
                '_id': None,
                'total_cost_usd': {'$sum': {'$ifNull': ['$cost_usd', 0]}},
            }
        },
    ])
    active_unfulfilled_rows = await active_unfulfilled_cursor.to_list(1)
    active_unfulfilled_value_ngn = 0.0
    if active_unfulfilled_rows:
        total_cost_unfulfilled_usd = float(
            active_unfulfilled_rows[0].get('total_cost_usd', 0) or 0
        )
        active_unfulfilled_value_ngn = total_cost_unfulfilled_usd * ngn_rate

    # Available liquidity: total NGN wallet balance - unfulfilled exposure
    wallet_cursor = db.users.aggregate([
        {
            '$group': {
                '_id': None,
                'total_ngn_balance': {'$sum': {'$ifNull': ['$ngn_balance', 0]}},
            }
        }
    ])
    wallet_rows = await wallet_cursor.to_list(1)
    total_wallet_ngn = float(wallet_rows[0].get('total_ngn_balance', 0) or 0) if wallet_rows else 0.0
    available_liquidity_ngn = max(0.0, total_wallet_ngn - active_unfulfilled_value_ngn)

    gross_profit_usd = total_sales_usd - api_cost_usd
    float_added_usd = total_deposits_usd - total_sales_usd

    # ================= Additional metrics for ads, users & risk =================

    # (see block above for calculations)

    # All-time revenue (for backward compatibility)
    revenue_result = await db.transactions.aggregate([
        {'$match': {'type': 'purchase', 'status': 'completed'}},
        {'$group': {'_id': None, 'total': {'$sum': '$amount'}}},
    ]).to_list(1)
    total_revenue = revenue_result[0]['total'] if revenue_result else 0

    return {
        'total_users': total_users,
        'total_orders': total_orders,
        'active_orders': active_orders,
        'total_revenue_usd': total_revenue,
        'period': {
            'start': start.isoformat(),
            'end': end.isoformat(),
        },
        'money_flow': {
            'total_deposits_ngn': total_deposits_ngn,
            'total_deposits_usd': total_deposits_usd,
            'total_sales_usd': total_sales_usd,
            'total_sales_ngn': total_sales_ngn,
            'api_cost_usd': api_cost_usd,
            'gross_profit_usd': gross_profit_usd,
            'float_added_usd': float_added_usd,
        },
        'ads_and_conversion': {
            'new_users_count': new_users_count,
            'new_depositors_count': new_depositors_count,
            'old_depositors_count': old_depositors_count,
            'deposit_conversion_rate': deposit_conversion_rate,
            'deposit_to_buy_conversion': deposit_to_buy_conversion,
        },
        'user_behavior': {
            'new_user_depositors_count': new_depositors_count,
            'new_user_deposits_ngn': new_deposits_ngn,
            'old_user_depositors_count': old_depositors_count,
            'old_user_deposits_ngn': old_deposits_ngn,
            'period_buyers_count': period_buyers_count,
            'repeat_buyer_rate': repeat_buyer_rate,
            'old_buyers_without_deposit_count': old_buyers_without_deposit_count,
            'old_buyers_without_deposit_sales_ngn': old_buyers_without_deposit_sales_ngn,
        },
        'pricing_risk': {
            'whatsapp_share_pct': whatsapp_share,
            'signal_share_pct': signal_share,
            'avg_selling_price_ngn': avg_selling_price_ngn,
            'price_spike_exposure_count': price_spike_exposure_count,
        },
        'system_health': {
            'active_unfulfilled_value_ngn': active_unfulfilled_value_ngn,
            'available_liquidity_ngn': available_liquidity_ngn,
        },
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