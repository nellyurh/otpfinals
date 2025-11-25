# SMS Relay - Virtual Number OTP Service Platform

A comprehensive platform for purchasing temporary phone numbers and receiving OTPs from multiple SMS service providers worldwide.

## 🌟 Features

### User Features
- **Dual Balance System**: Support for both Nigerian Naira (NGN) and US Dollar (USD) balances
- **Multiple SMS Providers**: Integration with TigerSMS, DaisySMS, and SMS-pool
- **Virtual Numbers**: Purchase temporary numbers from 150+ countries
- **Real-time OTP Polling**: Automatic OTP retrieval with 10-second polling interval
- **Flexible Deposits**: 
  - NGN deposits via PaymentPoint virtual accounts
  - USD deposits via Payscribe stablecoin (coming soon)
- **Currency Conversion**: Convert NGN to USD at configurable rates
- **Order Management**: Track active orders, view history, and cancel within refund window
- **Transaction History**: Complete audit trail of all financial activities

### Admin Features
- **Pricing Configuration**: Set markup percentages for each SMS provider
- **Conversion Rate Management**: Update NGN to USD exchange rates
- **Platform Statistics**: View total users, orders, revenue, and active orders
- **Provider Management**: Monitor status of all integrated services

## 🏗️ Architecture

### Backend Stack
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT with bcrypt password hashing
- **Payment Processing**: PaymentPoint & Payscribe integrations
- **SMS Providers**: TigerSMS, DaisySMS, SMS-pool

### Frontend Stack
- **Framework**: React 19
- **UI Components**: Shadcn/UI with Radix primitives
- **Styling**: Tailwind CSS with custom theming
- **Routing**: React Router v7
- **State Management**: React Hooks
- **Notifications**: Sonner toast notifications

## 🚀 Quick Start

### Test Admin Account
```
Email: admin@smsrelay.com
Password: admin123
NGN Balance: ₦10,000
USD Balance: $100
```

### API Endpoints
- **Backend**: https://smsrelay-3.preview.emergentagent.com/api
- **Frontend**: https://smsrelay-3.preview.emergentagent.com

## 📋 Key Business Logic

### OTP Polling System
- **Polling Interval**: Every 10 seconds
- **Maximum Wait Time**: 8 minutes
- **Cancellation Window**: After 5 minutes if no OTP received
- **Auto-expiry**: Orders expire after 8 minutes

### Refund Policy
- Refunds processed only if OTP not received
- Cancellation allowed after 5-minute grace period
- Full refund of purchase amount to USD balance

### Pricing Model
```
Final Price = Provider Cost × (1 + Markup Percentage / 100)
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth with 7-day expiry
- **Password Hashing**: Bcrypt with salt
- **Webhook Verification**: HMAC signature validation
- **Admin Protection**: Role-based access control

## 📊 Database Collections

- **users**: Authentication, balances, profiles
- **virtual_accounts**: PaymentPoint accounts
- **sms_orders**: Number purchases and OTPs
- **transactions**: Financial activity log
- **pricing_config**: Admin-configurable rates

## 🎨 UI Highlights

- Modern dark theme with glass-morphism effects
- Responsive design for all devices
- Real-time updates and notifications
- Intuitive tab-based navigation
- Color-coded status indicators

---

**Built with ❤️ for seamless OTP service delivery**
