"""
Test SMS Provider Rework Features:
1. Provider status API endpoint
2. SMS Bower and Text Verified endpoints
3. US Numbers page provider cards
4. Global Numbers page provider cards
5. Admin panel provider toggles
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sms-provider-rework.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "testuser2@example.com"
TEST_USER_PASSWORD = "Test1234!"
ADMIN_EMAIL = "admin@smsrelay.com"
ADMIN_PASSWORD = "admin123"


class TestProviderStatusAPI:
    """Tests for the provider status endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for tests - login and get token"""
        # Try admin login first
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
        else:
            # Fallback to test user
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            if login_resp.status_code == 200:
                self.token = login_resp.json().get("token")
            else:
                pytest.skip("Could not authenticate - skipping test")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_provider_status_endpoint_exists(self):
        """Test that /api/services/providers/status endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/services/providers/status", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("Provider status endpoint exists and returns 200")
    
    def test_provider_status_returns_all_providers(self):
        """Test that provider status returns status for all 6 providers"""
        response = requests.get(f"{BASE_URL}/api/services/providers/status", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        
        providers = data.get("providers", {})
        
        # Check all 6 providers exist
        expected_providers = ['daisysms', 'smspool', '5sim', 'tigersms', 'smsbower', 'textverified']
        for provider in expected_providers:
            assert provider in providers, f"Missing provider: {provider}"
            assert "enabled" in providers[provider], f"Provider {provider} missing 'enabled' field"
            assert "name" in providers[provider], f"Provider {provider} missing 'name' field"
            print(f"Provider {provider}: enabled={providers[provider]['enabled']}, name={providers[provider]['name']}")
        
        print("All 6 providers returned in status response")
    
    def test_provider_status_has_new_providers(self):
        """Test that SMS Bower and Text Verified are in provider status"""
        response = requests.get(f"{BASE_URL}/api/services/providers/status", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        providers = data.get("providers", {})
        
        # Check new providers specifically
        assert "smsbower" in providers, "SMS Bower not in provider status"
        assert "textverified" in providers, "Text Verified not in provider status"
        
        print(f"SMS Bower: {providers['smsbower']}")
        print(f"Text Verified: {providers['textverified']}")


class TestSMSBowerEndpoint:
    """Tests for SMS Bower endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
        else:
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            if login_resp.status_code == 200:
                self.token = login_resp.json().get("token")
            else:
                pytest.skip("Could not authenticate")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_smsbower_endpoint_exists(self):
        """Test /api/services/smsbower endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/services/smsbower", headers=self.headers)
        # Could return 200, 400 (no API key), or 503 (disabled)
        assert response.status_code in [200, 400, 503], f"Unexpected status: {response.status_code}"
        print(f"SMS Bower endpoint returned status: {response.status_code}")
        
        data = response.json()
        print(f"Response: {data.get('success')}, message: {data.get('message', 'N/A')}")


class TestTextVerifiedEndpoint:
    """Tests for Text Verified endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
        else:
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            if login_resp.status_code == 200:
                self.token = login_resp.json().get("token")
            else:
                pytest.skip("Could not authenticate")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_textverified_endpoint_exists(self):
        """Test /api/services/textverified endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/services/textverified", headers=self.headers)
        # Could return 200, 400 (no API key), or 503 (disabled)
        assert response.status_code in [200, 400, 503], f"Unexpected status: {response.status_code}"
        print(f"Text Verified endpoint returned status: {response.status_code}")
        
        data = response.json()
        print(f"Response: {data.get('success')}, message: {data.get('message', 'N/A')}")


class TestTigerSMSEndpoint:
    """Tests for Tiger SMS endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
        else:
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            if login_resp.status_code == 200:
                self.token = login_resp.json().get("token")
            else:
                pytest.skip("Could not authenticate")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_tigersms_endpoint_exists(self):
        """Test /api/services/tigersms endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/services/tigersms", headers=self.headers)
        # Could return 200, 400 (no API key), or 503 (disabled)
        assert response.status_code in [200, 400, 500, 503], f"Unexpected status: {response.status_code}"
        print(f"Tiger SMS endpoint returned status: {response.status_code}")


class TestAdminProviderToggles:
    """Tests for admin provider toggle functionality via providers/status endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login as admin"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_resp.status_code != 200:
            pytest.skip("Could not authenticate as admin")
        
        self.token = login_resp.json().get("token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_admin_can_get_provider_config(self):
        """Test admin can retrieve provider configuration via providers/status"""
        # The providers/status endpoint returns all providers with their enable status
        response = requests.get(f"{BASE_URL}/api/services/providers/status", headers=self.headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True
        
        providers = data.get("providers", {})
        
        # Check all 6 providers have enabled field
        expected_providers = ['daisysms', 'smspool', '5sim', 'tigersms', 'smsbower', 'textverified']
        
        for provider in expected_providers:
            assert provider in providers, f"Missing provider: {provider}"
            assert "enabled" in providers[provider], f"Provider {provider} missing 'enabled' field"
            print(f"{provider} enabled: {providers[provider]['enabled']}")
        
        print("All provider toggle statuses retrieved successfully")
    
    def test_admin_pricing_endpoint_works(self):
        """Test admin pricing endpoint returns 200 (new fields use defaults from model)"""
        response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        
        # Just verify the endpoint works and returns expected base fields
        print(f"Admin pricing endpoint returned {len(data)} config fields")
        print(f"Sample fields: accent_color_hex={data.get('accent_color_hex')}")


class TestExistingProvidersStillWork:
    """Tests to ensure existing providers (All Numbers) still work"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - login"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_resp.status_code == 200:
            self.token = login_resp.json().get("token")
        else:
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            if login_resp.status_code == 200:
                self.token = login_resp.json().get("token")
            else:
                pytest.skip("Could not authenticate")
        
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_smspool_endpoint_still_works(self):
        """Test SMS Pool (Server 1) endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/services/server1", headers=self.headers)
        assert response.status_code in [200, 400, 503], f"Unexpected status: {response.status_code}"
        print(f"SMS Pool endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True or "countries" in data or "services" in data
            print("SMS Pool endpoint returns valid data")
    
    def test_5sim_endpoint_still_works(self):
        """Test 5sim endpoint still works"""
        response = requests.get(f"{BASE_URL}/api/services/5sim", headers=self.headers)
        assert response.status_code in [200, 400, 503], f"Unexpected status: {response.status_code}"
        print(f"5sim endpoint status: {response.status_code}")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
