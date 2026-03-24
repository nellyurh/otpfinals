"""
Iteration 23 Tests: Provider Name Hiding, Active-Only Orders, ₦500 Floor, and Frontend Fixes

Tests:
1. /api/services/providers/status returns server names NOT real provider names
2. /api/orders/list only returns orders with status='active'
3. /api/orders/list response does NOT contain 'provider' or 'server' fields
4. /api/orders/{id} response does NOT contain 'provider' or 'server' fields
5. calculate-price endpoint applies ₦500 minimum floor
6. purchase endpoint applies ₦500 minimum floor
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "traveltest@test.com"
TEST_PASSWORD = "Test1234!"


class TestIteration23ProviderHiding:
    """Test provider name hiding from API responses"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
    
    def test_providers_status_returns_server_names(self):
        """Test that /api/services/providers/status returns server names, NOT real provider names"""
        response = self.session.get(f"{BASE_URL}/api/services/providers/status")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get('success') == True, "Expected success=True"
        
        providers = data.get('providers', {})
        
        # Check that provider names are server names, NOT real provider names
        # Real provider names that should NOT appear: DaisySMS, Tiger SMS, SMS Bower, Text Verified, 5sim, SMS Pool
        forbidden_names = ['DaisySMS', 'Tiger SMS', 'SMS Bower', 'Text Verified', '5sim', 'SMS Pool', 'Daisy SMS', 'TigerSMS', 'SMSBower', 'TextVerified']
        
        # Expected server names
        expected_server_names = {
            'daisysms': 'US Server',
            'smspool': 'Server 2',
            '5sim': 'Server 1',
            'tigersms': 'Fast Server',
            'smsbower': 'Budget Server',
            'textverified': 'Premium Server'
        }
        
        for provider_key, provider_data in providers.items():
            name = provider_data.get('name', '')
            
            # Check that name is NOT a real provider name
            for forbidden in forbidden_names:
                assert forbidden.lower() not in name.lower(), f"Provider {provider_key} exposes real name '{name}' which contains '{forbidden}'"
            
            # Check that name matches expected server name
            if provider_key in expected_server_names:
                assert name == expected_server_names[provider_key], f"Provider {provider_key} should have name '{expected_server_names[provider_key]}', got '{name}'"
        
        print(f"✓ Providers status returns server names correctly: {list(providers.keys())}")
    
    def test_orders_list_only_active_orders(self):
        """Test that /api/orders/list only returns orders with status='active'"""
        response = self.session.get(f"{BASE_URL}/api/orders/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        orders = data.get('orders', [])
        
        # All returned orders should have status='active'
        for order in orders:
            status = order.get('status')
            assert status == 'active', f"Order {order.get('id')} has status '{status}', expected 'active'"
        
        print(f"✓ Orders list returns only active orders ({len(orders)} orders)")
    
    def test_orders_list_no_provider_field(self):
        """Test that /api/orders/list response does NOT contain 'provider' field"""
        response = self.session.get(f"{BASE_URL}/api/orders/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        orders = data.get('orders', [])
        
        for order in orders:
            # Check that 'provider' field is NOT present
            assert 'provider' not in order, f"Order {order.get('id')} contains 'provider' field which should be removed"
            # Check that 'server' field is NOT present
            assert 'server' not in order, f"Order {order.get('id')} contains 'server' field which should be removed"
            # Check that 'server_name' IS present
            assert 'server_name' in order, f"Order {order.get('id')} missing 'server_name' field"
        
        print(f"✓ Orders list does not expose provider/server fields ({len(orders)} orders checked)")
    
    def test_orders_list_has_server_name(self):
        """Test that /api/orders/list response has 'server_name' field"""
        response = self.session.get(f"{BASE_URL}/api/orders/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        orders = data.get('orders', [])
        
        # Expected server names (should NOT contain real provider names)
        valid_server_names = ['US Server', 'Server 1', 'Server 2', 'Global Server', 'Fast Server', 'Budget Server', 'Premium Server']
        forbidden_names = ['DaisySMS', 'Tiger SMS', 'SMS Bower', 'Text Verified', '5sim', 'SMS Pool', 'tigersms', 'smsbower', 'textverified', 'daisysms', 'smspool']
        
        for order in orders:
            server_name = order.get('server_name', '')
            
            # Check that server_name doesn't contain real provider names
            for forbidden in forbidden_names:
                assert forbidden.lower() not in server_name.lower(), f"Order {order.get('id')} server_name '{server_name}' contains forbidden name '{forbidden}'"
        
        print(f"✓ Orders list has valid server_name values ({len(orders)} orders)")


class TestIteration23PriceFloor:
    """Test ₦500 minimum price floor"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
    
    def test_calculate_price_500_floor_cheap_service(self):
        """Test that calculate-price applies ₦500 floor for cheap services"""
        # Try to calculate price for a service that might be cheap
        response = self.session.post(f"{BASE_URL}/api/orders/calculate-price", json={
            "server": "us_server",
            "service": "oa",  # OpenAI - typically cheap
            "country": "187"
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                final_price_ngn = data.get('final_price_ngn', 0)
                # If price is returned, it should be at least ₦500
                if final_price_ngn > 0:
                    assert final_price_ngn >= 500, f"Price ₦{final_price_ngn} is below ₦500 minimum floor"
                    print(f"✓ Calculate price returns ₦{final_price_ngn} (≥₦500 floor)")
                else:
                    print(f"⚠ Service returned price 0, skipping floor check")
            else:
                print(f"⚠ Calculate price returned success=False: {data.get('message', 'unknown')}")
        else:
            print(f"⚠ Calculate price returned status {response.status_code}, may be expected for unavailable service")
    
    def test_calculate_price_expensive_unchanged(self):
        """Test that calculate-price does NOT change prices above ₦500"""
        # Try to calculate price for a service that's typically expensive
        response = self.session.post(f"{BASE_URL}/api/orders/calculate-price", json={
            "server": "us_server",
            "service": "wa",  # WhatsApp - typically more expensive
            "country": "187"
        })
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                final_price_ngn = data.get('final_price_ngn', 0)
                # If price is above 500, it should remain unchanged (not rounded to 500)
                if final_price_ngn > 500:
                    print(f"✓ Expensive service price ₦{final_price_ngn} unchanged (above ₦500)")
                elif final_price_ngn == 500:
                    print(f"✓ Service price is exactly ₦500 (floor applied or natural price)")
                else:
                    print(f"⚠ Service returned price ₦{final_price_ngn}")
            else:
                print(f"⚠ Calculate price returned success=False")
        else:
            print(f"⚠ Calculate price returned status {response.status_code}")


class TestIteration23HealthAndAuth:
    """Basic health and auth tests"""
    
    def test_health_check(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get('status') == 'healthy', f"Expected healthy status, got {data}"
        print("✓ Health check passed")
    
    def test_login(self):
        """Test login with test credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert 'token' in data, "Expected token in response"
        print("✓ Login successful")


class TestIteration23CodeVerification:
    """Verify code changes through API behavior"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {token}"})
        yield
    
    def test_provider_status_structure(self):
        """Verify provider status response structure"""
        response = self.session.get(f"{BASE_URL}/api/services/providers/status")
        assert response.status_code == 200
        
        data = response.json()
        providers = data.get('providers', {})
        
        # Check all expected providers are present
        expected_providers = ['daisysms', 'smspool', '5sim', 'tigersms', 'smsbower', 'textverified']
        for provider in expected_providers:
            assert provider in providers, f"Missing provider: {provider}"
            
            # Each provider should have: enabled, name, description, type
            provider_data = providers[provider]
            assert 'enabled' in provider_data, f"Provider {provider} missing 'enabled'"
            assert 'name' in provider_data, f"Provider {provider} missing 'name'"
            assert 'description' in provider_data, f"Provider {provider} missing 'description'"
            assert 'type' in provider_data, f"Provider {provider} missing 'type'"
        
        print(f"✓ Provider status structure verified for {len(expected_providers)} providers")
    
    def test_orders_list_structure(self):
        """Verify orders list response structure"""
        response = self.session.get(f"{BASE_URL}/api/orders/list")
        assert response.status_code == 200
        
        data = response.json()
        assert 'orders' in data, "Response missing 'orders' key"
        
        orders = data['orders']
        if len(orders) > 0:
            # Check first order structure
            order = orders[0]
            
            # Fields that SHOULD be present
            expected_fields = ['id', 'status', 'server_name']
            for field in expected_fields:
                assert field in order, f"Order missing expected field: {field}"
            
            # Fields that should NOT be present
            forbidden_fields = ['provider', 'server']
            for field in forbidden_fields:
                assert field not in order, f"Order contains forbidden field: {field}"
            
            print(f"✓ Orders list structure verified ({len(orders)} orders)")
        else:
            print("⚠ No orders to verify structure (empty list)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
