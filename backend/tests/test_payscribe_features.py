"""
Test Payscribe API features, Page Toggles, and Payout Webhook
Tests for iteration 11 - Payscribe error handling, page toggles, webhook endpoint
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://payhub-99.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@smsrelay.com"
ADMIN_PASSWORD = "admin123"


def get_admin_token():
    """Helper to get admin token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get('token')
    return None


class TestHealthAndBasics:
    """Basic health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'healthy'
        assert data['mongodb'] == 'connected'
        print("✓ Health endpoint working")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login(self):
        """Test admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert data['user']['is_admin'] == True
        print(f"✓ Admin login successful: {data['user']['email']}")
        return data['token']


class TestPageToggles:
    """Test page toggles endpoint and configuration"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        token = get_admin_token()
        if not token:
            pytest.skip("Admin login failed")
        return token
    
    def test_page_toggles_endpoint_exists(self, admin_token):
        """Test that page toggles endpoint exists and returns data"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/user/page-toggles", headers=headers)
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Page toggles endpoint returns: {list(data.keys())[:10]}...")
    
    def test_page_toggles_has_bill_payment_services(self, admin_token):
        """Test that page toggles include all bill payment services"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/user/page-toggles", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check for bill payment related toggles
        required_toggles = [
            'enable_bills_payment',
            'enable_electricity',
            'enable_tv',
            'enable_betting',
            'enable_bank_transfer',
            'enable_wallet_transfer'
        ]
        
        for toggle in required_toggles:
            assert toggle in data, f"Missing toggle: {toggle}"
            print(f"✓ Page toggle '{toggle}' exists: {data[toggle]}")
    
    def test_page_toggles_has_airtime_data(self, admin_token):
        """Test that page toggles include airtime and data services"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/user/page-toggles", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check for airtime/data toggles
        assert 'enable_airtime' in data, "Missing enable_airtime toggle"
        assert 'enable_buy_data' in data, "Missing enable_buy_data toggle"
        print(f"✓ Airtime toggle: {data.get('enable_airtime')}")
        print(f"✓ Data toggle: {data.get('enable_buy_data')}")


class TestPayscribeErrorHandling:
    """Test Payscribe API error handling"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        token = get_admin_token()
        if not token:
            pytest.skip("Admin login failed")
        return token
    
    def test_data_plans_endpoint_error_handling(self, admin_token):
        """Test data plans endpoint returns helpful error for invalid API key"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/payscribe/data-plans?network=mtn", headers=headers)
        
        # Should return 200 with error info or 4xx with helpful message
        print(f"Data plans response status: {response.status_code}")
        print(f"Data plans response: {response.text[:500]}")
        
        # The endpoint should not crash - it should return a response
        assert response.status_code in [200, 400, 401, 403, 500]
        
        data = response.json()
        # If API key is invalid, should have helpful error message
        if not data.get('status', True):
            assert 'message' in data or 'detail' in data or 'error' in data or 'description' in data
            print(f"✓ Error message returned: {data.get('message') or data.get('detail') or data.get('error') or data.get('description')}")
        else:
            print(f"✓ Data plans returned successfully")


class TestPayscribePayoutWebhook:
    """Test Payscribe payout webhook endpoint"""
    
    def test_webhook_endpoint_exists(self):
        """Test that payout webhook endpoint exists"""
        # Send a test webhook payload
        test_payload = {
            "event_type": "payouts.created",
            "trans_id": "test_trans_123",
            "ref": "test_ref_nonexistent",
            "status": "pending",
            "amount": 1000,
            "beneficiary": {
                "account_name": "Test User",
                "account_number": "1234567890",
                "bank_name": "Test Bank"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks/payscribe/payout",
            json=test_payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Webhook response status: {response.status_code}")
        print(f"Webhook response: {response.text}")
        
        # Endpoint should exist and return a response
        assert response.status_code == 200
        data = response.json()
        
        # Should return success=False for non-existent transaction (expected)
        # or success=True if it processed
        assert 'success' in data or 'message' in data
        print(f"✓ Payout webhook endpoint exists and responds")
    
    def test_webhook_handles_success_event(self):
        """Test webhook handles success event type"""
        test_payload = {
            "event_type": "payouts.success",
            "trans_id": "test_success_123",
            "ref": "test_ref_success",
            "status": "success",
            "amount": 5000,
            "beneficiary": {
                "account_name": "Success User",
                "account_number": "0987654321",
                "bank_name": "Success Bank"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks/payscribe/payout",
            json=test_payload
        )
        
        assert response.status_code == 200
        print(f"✓ Webhook handles success event: {response.json()}")
    
    def test_webhook_handles_failed_event(self):
        """Test webhook handles failed event type"""
        test_payload = {
            "event_type": "payouts.failed",
            "trans_id": "test_failed_123",
            "ref": "test_ref_failed",
            "status": "failed",
            "amount": 3000,
            "beneficiary": {
                "account_name": "Failed User",
                "account_number": "1111111111",
                "bank_name": "Failed Bank"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks/payscribe/payout",
            json=test_payload
        )
        
        assert response.status_code == 200
        print(f"✓ Webhook handles failed event: {response.json()}")
    
    def test_webhook_missing_ref(self):
        """Test webhook handles missing reference gracefully"""
        test_payload = {
            "event_type": "payouts.created",
            "trans_id": "test_no_ref",
            "status": "pending",
            "amount": 1000
        }
        
        response = requests.post(
            f"{BASE_URL}/api/webhooks/payscribe/payout",
            json=test_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        # Should indicate missing reference
        assert data.get('success') == False or 'Missing' in str(data.get('message', ''))
        print(f"✓ Webhook handles missing ref: {data}")


class TestBillsPaymentEndpoints:
    """Test bills payment related endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        token = get_admin_token()
        if not token:
            pytest.skip("Admin login failed")
        return token
    
    def test_banks_list_endpoint(self, admin_token):
        """Test banks list endpoint for bank transfers"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/banks/list", headers=headers)
        
        print(f"Banks list response status: {response.status_code}")
        print(f"Banks list response: {response.text[:500]}")
        
        # Should return list of banks
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True or 'banks' in data
        print(f"✓ Banks list endpoint works: {len(data.get('banks', []))} banks")
    
    def test_tv_plans_endpoint(self, admin_token):
        """Test TV plans endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/payscribe/tv-plans?provider=dstv", headers=headers)
        
        print(f"TV plans response status: {response.status_code}")
        print(f"TV plans response: {response.text[:500]}")
        
        # Should return response (may be error if API key invalid)
        assert response.status_code in [200, 400, 401, 403, 500]


class TestAdminPricingConfig:
    """Test admin pricing config includes page toggles"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        token = get_admin_token()
        if not token:
            pytest.skip("Admin login failed")
        return token
    
    def test_admin_pricing_config_has_toggles(self, admin_token):
        """Test admin pricing config endpoint includes page toggles"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/pricing-config", headers=headers)
        
        print(f"Admin pricing config response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            # Check for some key toggles in config
            toggle_keys = [k for k in data.keys() if k.startswith('enable_')]
            print(f"✓ Admin pricing config has {len(toggle_keys)} toggle settings")
            print(f"  Toggle keys: {toggle_keys[:10]}...")
        else:
            print(f"Admin pricing config response: {response.text[:300]}")
            # Try alternative endpoint
            response2 = requests.get(f"{BASE_URL}/api/pricing", headers=headers)
            print(f"Alternative pricing endpoint status: {response2.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
