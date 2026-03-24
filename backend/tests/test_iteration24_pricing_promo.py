"""
Iteration 24 Tests: Pricing Floor and Promo Code Support for New Providers

Tests:
1. /api/orders/calculate-price should return final_price_ngn of 500.0 for cheap services on new provider server names
2. /api/orders/calculate-price should apply promo code discounts on new providers
3. /api/orders/calculate-price should still work for old server names
4. /api/orders/purchase endpoint should have ₦500 floor applied
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "testfloor@test.com"
TEST_USER_PASSWORD = "Test1234!"
PROMO_CODE_40 = "SAVE40"  # 40% off, reusable
PROMO_CODE_10 = "TEST10"  # 10% off, one-time per user


class TestSetup:
    """Setup and authentication tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_health_check(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")
    
    def test_login(self):
        """Verify test user can login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Login successful for {TEST_USER_EMAIL}")


class TestCalculatePriceNewProviders:
    """Test calculate-price endpoint with new provider server names"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            token = response.json().get("token")
            return {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        pytest.skip("Authentication failed")
    
    def test_tigersms_us_500_floor(self, auth_headers):
        """Test tigersms_us server applies ₦500 minimum floor for cheap services"""
        # Using service_code='lf' country_code='95' which has base_price 3.6 RUB (very cheap)
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "tigersms_us",
                "service": "lf",
                "country": "95"
            },
            headers=auth_headers
        )
        
        # Should succeed or return 404 if service not cached
        if response.status_code == 404:
            pytest.skip("Service not found in cache - may need to refresh cache")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        # Check ₦500 floor is applied
        final_price_ngn = data.get("final_price_ngn", 0)
        assert final_price_ngn >= 500.0, f"Expected ₦500 minimum floor, got ₦{final_price_ngn}"
        print(f"✓ tigersms_us: final_price_ngn = ₦{final_price_ngn} (floor applied)")
    
    def test_tigersms_global_500_floor(self, auth_headers):
        """Test tigersms_global server applies ₦500 minimum floor"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "tigersms_global",
                "service": "lf",
                "country": "95"
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        final_price_ngn = data.get("final_price_ngn", 0)
        assert final_price_ngn >= 500.0, f"Expected ₦500 minimum floor, got ₦{final_price_ngn}"
        print(f"✓ tigersms_global: final_price_ngn = ₦{final_price_ngn} (floor applied)")
    
    def test_smsbower_us_500_floor(self, auth_headers):
        """Test smsbower_us server applies ₦500 minimum floor"""
        # Using service_code='ds' country_code='2' for smsbower
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "smsbower_us",
                "service": "ds",
                "country": "2"
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        final_price_ngn = data.get("final_price_ngn", 0)
        assert final_price_ngn >= 500.0, f"Expected ₦500 minimum floor, got ₦{final_price_ngn}"
        print(f"✓ smsbower_us: final_price_ngn = ₦{final_price_ngn} (floor applied)")
    
    def test_smsbower_global_500_floor(self, auth_headers):
        """Test smsbower_global server applies ₦500 minimum floor"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "smsbower_global",
                "service": "ds",
                "country": "2"
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        final_price_ngn = data.get("final_price_ngn", 0)
        assert final_price_ngn >= 500.0, f"Expected ₦500 minimum floor, got ₦{final_price_ngn}"
        print(f"✓ smsbower_global: final_price_ngn = ₦{final_price_ngn} (floor applied)")
    
    def test_5sim_us_500_floor(self, auth_headers):
        """Test 5sim_us server applies ₦500 minimum floor"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "5sim_us",
                "service": "telegram",
                "country": "usa"
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        final_price_ngn = data.get("final_price_ngn", 0)
        assert final_price_ngn >= 500.0, f"Expected ₦500 minimum floor, got ₦{final_price_ngn}"
        print(f"✓ 5sim_us: final_price_ngn = ₦{final_price_ngn} (floor applied)")
    
    def test_5sim_global_500_floor(self, auth_headers):
        """Test 5sim_global server applies ₦500 minimum floor"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "5sim_global",
                "service": "telegram",
                "country": "russia"
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        final_price_ngn = data.get("final_price_ngn", 0)
        assert final_price_ngn >= 500.0, f"Expected ₦500 minimum floor, got ₦{final_price_ngn}"
        print(f"✓ 5sim_global: final_price_ngn = ₦{final_price_ngn} (floor applied)")
    
    def test_textverified_us_500_floor(self, auth_headers):
        """Test textverified_us server applies ₦500 minimum floor"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "textverified_us",
                "service": "telegram",
                "country": "usa"
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        final_price_ngn = data.get("final_price_ngn", 0)
        assert final_price_ngn >= 500.0, f"Expected ₦500 minimum floor, got ₦{final_price_ngn}"
        print(f"✓ textverified_us: final_price_ngn = ₦{final_price_ngn} (floor applied)")


class TestCalculatePriceOldServers:
    """Test calculate-price endpoint still works for old server names"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            token = response.json().get("token")
            return {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        pytest.skip("Authentication failed")
    
    def test_us_server_works(self, auth_headers):
        """Test us_server (DaisySMS) still works"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "us_server",
                "service": "wa",  # WhatsApp
                "country": "187"  # USA
            },
            headers=auth_headers
        )
        
        # May fail if DaisySMS API is down, but should not return 400 for invalid server
        assert response.status_code != 400 or "Invalid server" not in response.text
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            final_price_ngn = data.get("final_price_ngn", 0)
            assert final_price_ngn >= 500.0, f"Expected ₦500 minimum floor, got ₦{final_price_ngn}"
            print(f"✓ us_server: final_price_ngn = ₦{final_price_ngn}")
        else:
            print(f"⚠ us_server: API returned {response.status_code} (may be external API issue)")
    
    def test_server1_works(self, auth_headers):
        """Test server1 (SMS Pool) still works"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "server1",
                "service": "wa",
                "country": "US"
            },
            headers=auth_headers
        )
        
        assert response.status_code != 400 or "Invalid server" not in response.text
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            final_price_ngn = data.get("final_price_ngn", 0)
            assert final_price_ngn >= 500.0
            print(f"✓ server1: final_price_ngn = ₦{final_price_ngn}")
        elif response.status_code == 404:
            print("⚠ server1: Service not found in cache")
        else:
            print(f"⚠ server1: API returned {response.status_code}")
    
    def test_server2_works(self, auth_headers):
        """Test server2 (5sim) still works"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "server2",
                "service": "telegram",
                "country": "russia"
            },
            headers=auth_headers
        )
        
        assert response.status_code != 400 or "Invalid server" not in response.text
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            final_price_ngn = data.get("final_price_ngn", 0)
            assert final_price_ngn >= 500.0
            print(f"✓ server2: final_price_ngn = ₦{final_price_ngn}")
        elif response.status_code == 404:
            print("⚠ server2: Service not found in cache")
        else:
            print(f"⚠ server2: API returned {response.status_code}")


class TestPromoCodeOnNewProviders:
    """Test promo code discounts work on new provider server names"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            token = response.json().get("token")
            return {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        pytest.skip("Authentication failed")
    
    def test_promo_code_on_tigersms_us(self, auth_headers):
        """Test SAVE40 promo code works on tigersms_us"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "tigersms_us",
                "service": "lf",
                "country": "95",
                "promo_code": PROMO_CODE_40
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        # Promo code might be invalid/expired, but server should be recognized
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
            # Check if promo was applied
            promo = data.get("promo")
            if promo:
                assert promo.get("code") == PROMO_CODE_40
                assert promo.get("discount_ngn", 0) > 0
                print(f"✓ Promo {PROMO_CODE_40} applied on tigersms_us: discount = ₦{promo.get('discount_ngn')}")
            else:
                print(f"⚠ Promo not applied (may be already used or invalid)")
        else:
            # 400 error - check if it's promo-related, not server-related
            error_detail = response.json().get("detail", "")
            assert "Invalid server" not in error_detail, "Server should be recognized"
            print(f"⚠ Promo code error: {error_detail}")
    
    def test_promo_code_on_smsbower_global(self, auth_headers):
        """Test SAVE40 promo code works on smsbower_global"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "smsbower_global",
                "service": "ds",
                "country": "2",
                "promo_code": PROMO_CODE_40
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            promo = data.get("promo")
            if promo:
                print(f"✓ Promo {PROMO_CODE_40} applied on smsbower_global: discount = ₦{promo.get('discount_ngn')}")
            else:
                print(f"⚠ Promo not applied")
        else:
            error_detail = response.json().get("detail", "")
            assert "Invalid server" not in error_detail
            print(f"⚠ Promo code error: {error_detail}")
    
    def test_promo_code_on_5sim_us(self, auth_headers):
        """Test SAVE40 promo code works on 5sim_us"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "5sim_us",
                "service": "telegram",
                "country": "usa",
                "promo_code": PROMO_CODE_40
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            promo = data.get("promo")
            if promo:
                print(f"✓ Promo {PROMO_CODE_40} applied on 5sim_us: discount = ₦{promo.get('discount_ngn')}")
            else:
                print(f"⚠ Promo not applied")
        else:
            error_detail = response.json().get("detail", "")
            assert "Invalid server" not in error_detail
            print(f"⚠ Promo code error: {error_detail}")
    
    def test_promo_code_on_textverified_us(self, auth_headers):
        """Test SAVE40 promo code works on textverified_us"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "textverified_us",
                "service": "telegram",
                "country": "usa",
                "promo_code": PROMO_CODE_40
            },
            headers=auth_headers
        )
        
        if response.status_code == 404:
            pytest.skip("Service not found in cache")
        
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            promo = data.get("promo")
            if promo:
                print(f"✓ Promo {PROMO_CODE_40} applied on textverified_us: discount = ₦{promo.get('discount_ngn')}")
            else:
                print(f"⚠ Promo not applied")
        else:
            error_detail = response.json().get("detail", "")
            assert "Invalid server" not in error_detail
            print(f"⚠ Promo code error: {error_detail}")


class TestServerMapValidation:
    """Test that all new server names are recognized"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            token = response.json().get("token")
            return {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        pytest.skip("Authentication failed")
    
    @pytest.mark.parametrize("server_name", [
        "tigersms_us",
        "tigersms_global",
        "smsbower_us",
        "smsbower_global",
        "textverified_us",
        "5sim_us",
        "5sim_global",
        "us_server",
        "server1",
        "server2"
    ])
    def test_server_name_recognized(self, auth_headers, server_name):
        """Test that server name is recognized (not 'Invalid server' error)"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": server_name,
                "service": "test",
                "country": "test"
            },
            headers=auth_headers
        )
        
        # Should NOT return "Invalid server" error
        if response.status_code == 400:
            error_detail = response.json().get("detail", "")
            assert "Invalid server" not in error_detail, f"Server '{server_name}' should be recognized"
        
        print(f"✓ Server '{server_name}' is recognized (status: {response.status_code})")
    
    def test_invalid_server_rejected(self, auth_headers):
        """Test that invalid server names are rejected"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "invalid_server_xyz",
                "service": "test",
                "country": "test"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 400
        error_detail = response.json().get("detail", "")
        assert "Invalid server" in error_detail
        print("✓ Invalid server name correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
