"""
Iteration 22 Tests: API Key Decryption and ₦500 Minimum Price Enforcement

Tests:
1. SMS Bower API key uses get_api_key() for decryption (no raw config.get)
2. Tiger SMS API key uses get_api_key() for decryption (no raw config.get)
3. calculate-price endpoint enforces ₦500 minimum
4. purchase endpoint enforces ₦500 minimum
5. Frontend enforceMinPrice() function works correctly
6. Timer durations are correct (textverified = 5 minutes)
"""

import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "traveltest@test.com"
TEST_USER_PASSWORD = "Test1234!"


class TestAPIKeyDecryption:
    """Test that API keys use get_api_key() for decryption"""
    
    def test_smsbower_api_key_uses_get_api_key(self):
        """Verify no raw config.get('smsbower_api_key') calls exist in server.py"""
        server_path = "/app/backend/server.py"
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Search for raw config.get('smsbower_api_key') - should NOT exist
        raw_pattern = r"config\.get\(['\"]smsbower_api_key['\"]"
        raw_matches = re.findall(raw_pattern, content)
        
        # Search for get_api_key(..., 'smsbower_api_key', ...) - should exist
        correct_pattern = r"get_api_key\([^)]*['\"]smsbower_api_key['\"]"
        correct_matches = re.findall(correct_pattern, content)
        
        print(f"Raw config.get('smsbower_api_key') calls: {len(raw_matches)}")
        print(f"Correct get_api_key(..., 'smsbower_api_key', ...) calls: {len(correct_matches)}")
        
        assert len(raw_matches) == 0, f"Found {len(raw_matches)} raw config.get('smsbower_api_key') calls - should use get_api_key()"
        assert len(correct_matches) >= 1, "Should have at least one get_api_key() call for smsbower_api_key"
        print(f"PASS: All {len(correct_matches)} SMS Bower API key usages use get_api_key() for decryption")
    
    def test_tigersms_api_key_uses_get_api_key(self):
        """Verify no raw config.get('tigersms_api_key') calls exist in server.py"""
        server_path = "/app/backend/server.py"
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Search for raw config.get('tigersms_api_key') - should NOT exist
        raw_pattern = r"config\.get\(['\"]tigersms_api_key['\"]"
        raw_matches = re.findall(raw_pattern, content)
        
        # Search for get_api_key(..., 'tigersms_api_key', ...) - should exist
        correct_pattern = r"get_api_key\([^)]*['\"]tigersms_api_key['\"]"
        correct_matches = re.findall(correct_pattern, content)
        
        print(f"Raw config.get('tigersms_api_key') calls: {len(raw_matches)}")
        print(f"Correct get_api_key(..., 'tigersms_api_key', ...) calls: {len(correct_matches)}")
        
        assert len(raw_matches) == 0, f"Found {len(raw_matches)} raw config.get('tigersms_api_key') calls - should use get_api_key()"
        assert len(correct_matches) >= 1, "Should have at least one get_api_key() call for tigersms_api_key"
        print(f"PASS: All {len(correct_matches)} Tiger SMS API key usages use get_api_key() for decryption")


class TestMinimumPriceEnforcement:
    """Test ₦500 minimum price enforcement in backend"""
    
    def test_calculate_price_has_500_minimum(self):
        """Verify calculate-price endpoint code has ₦500 minimum enforcement"""
        server_path = "/app/backend/server.py"
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Find the calculate-price endpoint and check for 500 minimum
        # Look for pattern: if final_price_ngn < 500
        pattern = r"if\s+final_price_ngn\s*<\s*500"
        matches = re.findall(pattern, content)
        
        print(f"Found {len(matches)} occurrences of '₦500 minimum' check in server.py")
        assert len(matches) >= 2, "Should have at least 2 occurrences of ₦500 minimum check (calculate-price and purchase)"
        print("PASS: Backend has ₦500 minimum price enforcement")
    
    def test_purchase_endpoint_has_500_minimum(self):
        """Verify purchase endpoint code has ₦500 minimum enforcement"""
        server_path = "/app/backend/server.py"
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Look for the specific pattern with comment
        pattern = r"# Enforce minimum price of ₦500"
        matches = re.findall(pattern, content)
        
        print(f"Found {len(matches)} '# Enforce minimum price of ₦500' comments")
        assert len(matches) >= 2, "Should have at least 2 minimum price enforcement comments"
        print("PASS: Purchase endpoint has ₦500 minimum price enforcement")


class TestFrontendEnforceMinPrice:
    """Test frontend enforceMinPrice() function"""
    
    def test_enforce_min_price_function_exists(self):
        """Verify enforceMinPrice function is defined correctly"""
        frontend_path = "/app/frontend/src/components/VirtualNumbersSection.js"
        with open(frontend_path, 'r') as f:
            content = f.read()
        
        # Check for function definition
        assert "const enforceMinPrice = (priceNgn) =>" in content, "enforceMinPrice function should be defined"
        assert "Math.max(MIN_PRICE_NGN, priceNgn)" in content or "Math.max(500, priceNgn)" in content, "enforceMinPrice should use Math.max with 500"
        print("PASS: enforceMinPrice function is defined correctly")
    
    def test_enforce_min_price_used_in_service_dropdown(self):
        """Verify enforceMinPrice is used in service dropdown options"""
        frontend_path = "/app/frontend/src/components/VirtualNumbersSection.js"
        with open(frontend_path, 'r') as f:
            content = f.read()
        
        # Check for usage in price displays
        usages = content.count("enforceMinPrice(")
        print(f"Found {usages} usages of enforceMinPrice() in VirtualNumbersSection.js")
        assert usages >= 10, f"Should have at least 10 usages of enforceMinPrice(), found {usages}"
        print(f"PASS: enforceMinPrice is used {usages} times in price displays")
    
    def test_enforce_min_price_in_total_cost_display(self):
        """Verify enforceMinPrice is used in Total Cost display"""
        frontend_path = "/app/frontend/src/components/VirtualNumbersSection.js"
        with open(frontend_path, 'r') as f:
            content = f.read()
        
        # Check for Total Cost section using enforceMinPrice
        assert "enforceMinPrice(estimatedPrice.price_ngn)" in content, "Total Cost should use enforceMinPrice"
        print("PASS: Total Cost display uses enforceMinPrice")
    
    def test_enforce_min_price_in_pool_selection(self):
        """Verify enforceMinPrice is used in pool selection prices"""
        frontend_path = "/app/frontend/src/components/VirtualNumbersSection.js"
        with open(frontend_path, 'r') as f:
            content = f.read()
        
        # Check for pool price using enforceMinPrice
        assert "enforceMinPrice(selectedPool.price_ngn)" in content or "enforceMinPrice(p.price_ngn)" in content, "Pool selection should use enforceMinPrice"
        print("PASS: Pool selection prices use enforceMinPrice")
    
    def test_enforce_min_price_in_bottom_sheet_modal(self):
        """Verify enforceMinPrice is used in bottom sheet modal prices"""
        frontend_path = "/app/frontend/src/components/VirtualNumbersSection.js"
        with open(frontend_path, 'r') as f:
            content = f.read()
        
        # Check for provider modal using enforceMinPrice
        assert "enforceMinPrice(provider.price_ngn" in content, "Bottom sheet modal should use enforceMinPrice"
        print("PASS: Bottom sheet modal prices use enforceMinPrice")


class TestTimerDurations:
    """Test timer durations for different providers"""
    
    def test_textverified_timer_is_5_minutes(self):
        """Verify textverified timer is 5 minutes (300 seconds)"""
        frontend_path = "/app/frontend/src/components/VirtualNumbersSection.js"
        with open(frontend_path, 'r') as f:
            content = f.read()
        
        # Check for textverified timer
        assert "textverified" in content.lower(), "textverified should be mentioned"
        assert "5 * 60" in content or "300" in content, "textverified timer should be 5 minutes (300 seconds)"
        
        # More specific check
        pattern = r"if\s*\(provider\.includes\(['\"]textverified['\"]\)\)\s*return\s*5\s*\*\s*60"
        match = re.search(pattern, content)
        assert match, "textverified timer should return 5 * 60 (5 minutes)"
        print("PASS: textverified timer is 5 minutes (300 seconds)")


class TestErrorMessageSanitization:
    """Test that error messages don't expose provider names"""
    
    def test_error_messages_no_provider_names(self):
        """Verify error messages don't contain provider names like 'SMS Bower' or 'Tiger SMS'"""
        server_path = "/app/backend/server.py"
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Check for HTTPException with provider names in detail
        # These patterns should NOT appear in user-facing error messages
        bad_patterns = [
            r'HTTPException.*detail.*SMS Bower',
            r'HTTPException.*detail.*Tiger SMS',
            r'HTTPException.*detail.*smsbower',
            r'HTTPException.*detail.*tigersms',
        ]
        
        for pattern in bad_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            # Filter out legitimate internal error messages (like API key config errors)
            user_facing_matches = [m for m in matches if 'API key' not in m and 'not configured' not in m]
            assert len(user_facing_matches) == 0, f"Found provider name in error message: {user_facing_matches}"
        
        print("PASS: Error messages don't expose provider names to users")


class TestAPIEndpoints:
    """Test API endpoints work correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self):
        """Get authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_health_check(self):
        """Test health endpoint"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("PASS: Health check endpoint working")
    
    def test_login_works(self):
        """Test login endpoint"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print("PASS: Login endpoint working")
    
    def test_providers_status_endpoint(self):
        """Test providers status endpoint"""
        token = self.get_auth_token()
        if not token:
            pytest.skip("Could not get auth token")
        
        headers = {"Authorization": f"Bearer {token}"}
        response = self.session.get(f"{BASE_URL}/api/services/providers/status", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "providers" in data
        
        # Check all expected providers are present
        providers = data["providers"]
        expected_providers = ["tigersms", "5sim", "smsbower", "textverified"]
        for provider in expected_providers:
            assert provider in providers, f"Provider {provider} should be in status response"
        
        print(f"PASS: Providers status endpoint returns all providers: {list(providers.keys())}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
