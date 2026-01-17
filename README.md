# UltraCloud SMS - OTP Service Platform

A comprehensive platform for purchasing temporary phone numbers and receiving OTPs from multiple SMS service providers worldwide.

## Project Structure

```
/
├── backend/          # FastAPI backend
│   ├── server.py     # Main application
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # React frontend
│   ├── src/
│   ├── package.json
│   └── Dockerfile
└── .do/
    └── app.yaml      # Digital Ocean App Platform config
```

## Deployment

### Digital Ocean App Platform

1. Connect your GitHub repository to Digital Ocean
2. The `.do/app.yaml` file will auto-configure your deployment
3. Set the following environment variables in Digital Ocean:
   - `MONGO_URL` - MongoDB Atlas connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `SMSPOOL_API_KEY`, `FIVESIM_API_KEY`, `DAISYSMS_API_KEY` - SMS provider keys
   - `PAYMENTPOINT_API_KEY`, `ERCASPAY_SECRET_KEY` - Payment provider keys

### Railway

1. Create two services: `backend` and `frontend`
2. Set root directory for each service
3. Both services use Dockerfile for deployment
4. Set `REACT_APP_BACKEND_URL` build arg for frontend

### Manual Deployment

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

**Frontend:**
```bash
cd frontend
yarn install
yarn build
npx serve -s build -l 3000
```

## Environment Variables

### Backend (.env)
- `MONGO_URL` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `SMSPOOL_API_KEY` - SMS-pool API key
- `FIVESIM_API_KEY` - 5sim API key
- `DAISYSMS_API_KEY` - DaisySMS API key
- `PAYMENTPOINT_API_KEY` - PaymentPoint API key
- `ERCASPAY_SECRET_KEY` - Ercaspay secret key

### Frontend (.env)
- `REACT_APP_BACKEND_URL` - Full URL to backend API

## Tech Stack

- **Backend**: FastAPI, Python 3.11, Motor (MongoDB)
- **Frontend**: React 19, Tailwind CSS, Shadcn/UI
- **Database**: MongoDB Atlas
- **Payments**: PaymentPoint, Ercaspay, Plisio
- **SMS Providers**: DaisySMS, SMS-pool, 5sim

## Test Credentials

```
Admin: admin@smsrelay.com / admin123
```

## First-Time Setup

After deployment, visit `/api/seed-database` to create the admin user and default configuration.
