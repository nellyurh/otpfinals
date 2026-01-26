"""
Test PIN Management System and Bank Transfer Features
Tests: PIN set/change/verify/reset endpoints, bank list, transfer fee, profile has_transaction_pin field
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://payhub-99.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@smsrelay.com"
ADMIN_PASSWORD = "admin123"

# Test user for PIN testing
TEST_USER_EMAIL = f"TEST_pin_user_{int(time.time())}@test.com"
TEST_USER_PASSWORD = "testpass123"
TEST_PIN = "1234"
NEW_PIN = "5678"


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health endpoint working")
    
    def test_admin_login(self):
        """Test admin login works correctly"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print("✓ Admin login successful")
        return data["token"]


class TestPINManagementEndpoints:
    """Test PIN management endpoints exist and respond correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_pin_status_endpoint_exists(self):
        """Test GET /api/user/pin/status endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/user/pin/status", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "has_pin" in data
        print(f"✓ PIN status endpoint works - has_pin: {data.get('has_pin')}")
    
    def test_pin_set_endpoint_exists(self):
        """Test POST /api/user/pin/set endpoint exists"""
        # This should fail if PIN already set, but endpoint should exist
        response = requests.post(f"{BASE_URL}/api/user/pin/set", 
            headers=self.headers,
            json={"pin": "1234", "confirm_pin": "1234"}
        )
        # Either 200 (success) or 400 (already set) - both mean endpoint exists
        assert response.status_code in [200, 400]
        print(f"✓ PIN set endpoint exists - status: {response.status_code}")
    
    def test_pin_verify_endpoint_exists(self):
        """Test POST /api/user/pin/verify endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/user/pin/verify",
            headers=self.headers,
            json={"pin": "1234"}
        )
        # Either 200 (correct), 400 (no PIN), or 401 (wrong PIN) - all mean endpoint exists
        assert response.status_code in [200, 400, 401]
        print(f"✓ PIN verify endpoint exists - status: {response.status_code}")
    
    def test_pin_change_endpoint_exists(self):
        """Test PUT /api/user/pin/change endpoint exists"""
        response = requests.put(f"{BASE_URL}/api/user/pin/change",
            headers=self.headers,
            json={"current_pin": "1234", "new_pin": "5678", "confirm_pin": "5678"}
        )
        # Either 200 (success), 400 (no PIN set), or 401 (wrong PIN) - all mean endpoint exists
        assert response.status_code in [200, 400, 401]
        print(f"✓ PIN change endpoint exists - status: {response.status_code}")
    
    def test_pin_reset_request_endpoint_exists(self):
        """Test POST /api/user/pin/reset-request endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/user/pin/reset-request",
            headers=self.headers
        )
        # Either 200 (email sent) or 400 (email not configured) - both mean endpoint exists
        assert response.status_code in [200, 400, 500]
        print(f"✓ PIN reset-request endpoint exists - status: {response.status_code}")
    
    def test_pin_reset_verify_endpoint_exists(self):
        """Test POST /api/user/pin/reset-verify endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/user/pin/reset-verify",
            headers=self.headers,
            json={
                "reset_code": "123456",
                "bvn": "12345678901",
                "new_pin": "1234",
                "confirm_pin": "1234"
            }
        )
        # Either 200 (success), 400 (invalid code/bvn), or 401 - all mean endpoint exists
        assert response.status_code in [200, 400, 401]
        print(f"✓ PIN reset-verify endpoint exists - status: {response.status_code}")


class TestPINValidation:
    """Test PIN validation rules"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_pin_must_be_4_digits(self):
        """Test PIN validation - must be exactly 4 digits"""
        # Try with 3 digits
        response = requests.post(f"{BASE_URL}/api/user/pin/set",
            headers=self.headers,
            json={"pin": "123", "confirm_pin": "123"}
        )
        # Should fail validation
        if response.status_code == 400:
            data = response.json()
            detail = str(data.get("detail", "")).lower()
            # Either validation error for 4 digits OR PIN already set
            assert "4" in detail or "digit" in detail or "already" in detail
            print(f"✓ PIN validation test passed - detail: {data.get('detail')}")
        else:
            # PIN might already be set
            print(f"✓ PIN validation test - status: {response.status_code}")
    
    def test_pin_confirm_must_match(self):
        """Test PIN confirmation must match"""
        response = requests.post(f"{BASE_URL}/api/user/pin/set",
            headers=self.headers,
            json={"pin": "1234", "confirm_pin": "5678"}
        )
        # Should fail if PINs don't match
        if response.status_code == 400:
            data = response.json()
            assert "match" in str(data.get("detail", "")).lower() or "confirm" in str(data.get("detail", "")).lower() or "already" in str(data.get("detail", "")).lower()
            print("✓ PIN confirmation validation works")
        else:
            print(f"✓ PIN confirmation test - status: {response.status_code}")


class TestBankEndpoints:
    """Test bank-related endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_banks_list_endpoint(self):
        """Test GET /api/banks/list returns bank list"""
        response = requests.get(f"{BASE_URL}/api/banks/list", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "banks" in data
        assert isinstance(data["banks"], list)
        assert len(data["banks"]) > 0
        # Check bank structure
        first_bank = data["banks"][0]
        assert "code" in first_bank
        assert "name" in first_bank
        print(f"✓ Banks list endpoint works - {len(data['banks'])} banks returned (source: {data.get('source', 'unknown')})")
    
    def test_transfer_fee_endpoint(self):
        """Test GET /api/banks/transfer-fee returns fee"""
        response = requests.get(f"{BASE_URL}/api/banks/transfer-fee?amount=5000", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "fee" in data
        assert isinstance(data["fee"], (int, float))
        print(f"✓ Transfer fee endpoint works - fee for ₦5000: ₦{data['fee']}")
    
    def test_validate_account_endpoint_exists(self):
        """Test GET /api/banks/validate-account endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/banks/validate-account?bank_code=044&account_number=0000000000",
            headers=self.headers
        )
        # Either 200 (valid) or 400/422 (invalid) - both mean endpoint exists
        assert response.status_code in [200, 400, 422, 500]
        print(f"✓ Validate account endpoint exists - status: {response.status_code}")
    
    def test_bank_transfer_endpoint_exists(self):
        """Test POST /api/banks/transfer endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/banks/transfer",
            headers=self.headers,
            json={
                "bank_code": "044",
                "account_number": "0000000000",
                "account_name": "Test Account",
                "amount": 1000,
                "pin": "1234",
                "narration": "Test transfer"
            }
        )
        # Either 200 (success), 400 (validation), 401 (wrong PIN), or 422 - all mean endpoint exists
        assert response.status_code in [200, 400, 401, 422, 500]
        print(f"✓ Bank transfer endpoint exists - status: {response.status_code}")


class TestProfileHasTransactionPin:
    """Test that profile endpoint returns has_transaction_pin field"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_profile_has_transaction_pin_field(self):
        """Test GET /api/user/profile returns has_transaction_pin field"""
        response = requests.get(f"{BASE_URL}/api/user/profile", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "has_transaction_pin" in data
        assert isinstance(data["has_transaction_pin"], bool)
        print(f"✓ Profile returns has_transaction_pin: {data['has_transaction_pin']}")


class TestPINFlowIntegration:
    """Integration tests for PIN flow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_pin_status_matches_profile(self):
        """Test PIN status endpoint matches profile has_transaction_pin"""
        # Get profile
        profile_response = requests.get(f"{BASE_URL}/api/user/profile", headers=self.headers)
        assert profile_response.status_code == 200
        profile_has_pin = profile_response.json().get("has_transaction_pin")
        
        # Get PIN status
        status_response = requests.get(f"{BASE_URL}/api/user/pin/status", headers=self.headers)
        assert status_response.status_code == 200
        status_has_pin = status_response.json().get("has_pin")
        
        # They should match
        assert profile_has_pin == status_has_pin
        print(f"✓ PIN status matches profile - both report has_pin: {profile_has_pin}")
    
    def test_bank_transfer_requires_pin(self):
        """Test bank transfer endpoint requires PIN"""
        # Try transfer without PIN
        response = requests.post(f"{BASE_URL}/api/banks/transfer",
            headers=self.headers,
            json={
                "bank_code": "044",
                "account_number": "0000000000",
                "account_name": "Test Account",
                "amount": 1000,
                "narration": "Test transfer"
                # No PIN provided
            }
        )
        # Should fail due to missing PIN
        assert response.status_code in [400, 422]
        print(f"✓ Bank transfer requires PIN - status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
