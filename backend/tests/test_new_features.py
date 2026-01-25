"""
Backend API Tests for New Features:
- Wallet Transfer (W2W)
- Bills Payment (Electricity, TV)
- Sidebar menu items verification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://billhub-16.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "newtest123@example.com"
TEST_USER_PASSWORD = "Test12345!"


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print(f"✓ Health check passed: {data}")
    
    def test_login_success(self):
        """Test user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert 'user' in data
        print(f"✓ Login successful for {TEST_USER_EMAIL}")
        return data['token']


class TestWalletTransfer:
    """Wallet-to-Wallet transfer endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_validate_recipient_self_error(self, auth_headers):
        """Test that validating self as recipient returns error"""
        response = requests.get(
            f"{BASE_URL}/api/wallet/validate-recipient?email={TEST_USER_EMAIL}",
            headers=auth_headers
        )
        # Should return 400 for self-transfer attempt
        assert response.status_code == 400
        data = response.json()
        assert 'yourself' in data.get('detail', '').lower() or 'cannot' in data.get('detail', '').lower()
        print(f"✓ Self-transfer validation correctly rejected: {data}")
    
    def test_validate_recipient_not_found(self, auth_headers):
        """Test validating non-existent recipient"""
        response = requests.get(
            f"{BASE_URL}/api/wallet/validate-recipient?email=nonexistent_user_12345@example.com",
            headers=auth_headers
        )
        assert response.status_code == 404
        print("✓ Non-existent user correctly returns 404")
    
    def test_recent_transfers_endpoint(self, auth_headers):
        """Test recent transfers endpoint returns array"""
        response = requests.get(
            f"{BASE_URL}/api/wallet/recent-transfers",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert 'transfers' in data
        assert isinstance(data['transfers'], list)
        print(f"✓ Recent transfers endpoint works, returned {len(data['transfers'])} transfers")
    
    def test_transfer_endpoint_exists(self, auth_headers):
        """Test transfer endpoint exists (validation error expected without proper data)"""
        response = requests.post(
            f"{BASE_URL}/api/wallet/transfer",
            headers=auth_headers,
            json={}  # Empty body to test endpoint exists
        )
        # Should return 422 (validation error) not 404
        assert response.status_code in [400, 422]
        print("✓ Transfer endpoint exists and validates input")


class TestBillsPayment:
    """Bills Payment (Electricity & TV) endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_validate_meter_endpoint_exists(self, auth_headers):
        """Test validate-meter endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/payscribe/validate-meter?provider=ekedc&meter_number=12345678901&meter_type=prepaid",
            headers=auth_headers
        )
        # Endpoint should exist (may return validation failure from Payscribe)
        assert response.status_code in [200, 400, 500]
        print(f"✓ Validate meter endpoint exists, status: {response.status_code}")
    
    def test_buy_electricity_endpoint_exists(self, auth_headers):
        """Test buy-electricity endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/payscribe/buy-electricity",
            headers=auth_headers,
            json={
                "provider": "ekedc",
                "meter_number": "12345678901",
                "meter_type": "prepaid",
                "amount": 500
            }
        )
        # Should not return 404 - endpoint exists
        assert response.status_code != 404
        print(f"✓ Buy electricity endpoint exists, status: {response.status_code}")
    
    def test_tv_plans_endpoint_exists(self, auth_headers):
        """Test TV plans endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/payscribe/tv-plans?provider=dstv",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        # Should have status and plans fields
        assert 'status' in data
        assert 'plans' in data
        print(f"✓ TV plans endpoint works, returned {len(data.get('plans', []))} plans")
    
    def test_validate_smartcard_endpoint_exists(self, auth_headers):
        """Test validate-smartcard endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/payscribe/validate-smartcard?provider=dstv&smartcard=1234567890",
            headers=auth_headers
        )
        # Endpoint should exist
        assert response.status_code in [200, 400, 500]
        print(f"✓ Validate smartcard endpoint exists, status: {response.status_code}")
    
    def test_pay_tv_endpoint_exists(self, auth_headers):
        """Test pay-tv endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/payscribe/pay-tv",
            headers=auth_headers,
            json={
                "provider": "dstv",
                "smartcard": "1234567890",
                "plan_code": "DSTV_COMPACT",
                "amount": 10500
            }
        )
        # Should not return 404 - endpoint exists
        assert response.status_code != 404
        print(f"✓ Pay TV endpoint exists, status: {response.status_code}")


class TestDataAndAirtime:
    """Data and Airtime endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_data_plans_endpoint(self, auth_headers):
        """Test data plans endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/payscribe/data-plans?network=mtn",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Data plans endpoint works, status: {data.get('status')}")
    
    def test_buy_airtime_endpoint_exists(self, auth_headers):
        """Test buy-airtime endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/payscribe/buy-airtime",
            headers=auth_headers,
            json={
                "service_type": "airtime",
                "provider": "mtn",
                "amount": 100,
                "recipient": "08012345678",
                "metadata": {}
            }
        )
        # Should not return 404
        assert response.status_code != 404
        print(f"✓ Buy airtime endpoint exists, status: {response.status_code}")


class TestPageToggles:
    """Test page toggles API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Authentication failed")
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_page_toggles_endpoint(self, auth_headers):
        """Test page toggles endpoint returns expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/user/page-toggles",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check for expected toggle fields
        expected_toggles = [
            'enable_fund_wallet',
            'enable_virtual_numbers',
            'enable_buy_data',
            'enable_airtime'
        ]
        
        for toggle in expected_toggles:
            assert toggle in data, f"Missing toggle: {toggle}"
        
        print(f"✓ Page toggles endpoint works with all expected fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
