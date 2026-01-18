"""
Test Suite for Iteration 4 Features:
1. API Documentation page persistence (showResellerDocs state at parent level)
2. Admin Resellers section - API Base URL setting
3. Promo code validation (/promo/validate endpoint)
4. 5sim purchase phone number parsing
5. Admin OTP Sales page with stats and orders
6. Admin OTP Sales status filter functionality
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        return data["token"]
    
    def test_admin_login(self, admin_token):
        """Verify admin can login"""
        assert admin_token is not None
        assert len(admin_token) > 0
        print(f"✓ Admin login successful, token length: {len(admin_token)}")


class TestResellerApiBaseUrl:
    """Test Admin-configurable API Base URL for reseller documentation"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_public_branding_returns_reseller_api_url(self):
        """Test that public branding endpoint returns reseller_api_base_url"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200, f"Public branding failed: {response.text}"
        data = response.json()
        assert "reseller_api_base_url" in data, "reseller_api_base_url not in public branding"
        print(f"✓ Public branding returns reseller_api_base_url: {data['reseller_api_base_url']}")
    
    def test_admin_can_update_reseller_api_url(self, admin_token):
        """Test that admin can update the reseller API base URL"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get current value
        response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert response.status_code == 200, f"Get pricing failed: {response.text}"
        original_url = response.json().get("reseller_api_base_url", "")
        
        # Update to test value
        test_url = "https://test-api.example.com"
        response = requests.put(f"{BASE_URL}/api/admin/pricing", 
                               json={"reseller_api_base_url": test_url},
                               headers=headers)
        assert response.status_code == 200, f"Update pricing failed: {response.text}"
        
        # Verify update
        response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert response.status_code == 200
        assert response.json().get("reseller_api_base_url") == test_url
        print(f"✓ Admin can update reseller_api_base_url to: {test_url}")
        
        # Restore original
        requests.put(f"{BASE_URL}/api/admin/pricing", 
                    json={"reseller_api_base_url": original_url or "https://smsrelay-hub.preview.emergentagent.com"},
                    headers=headers)
        print(f"✓ Restored original URL: {original_url}")


class TestPromoCodeValidation:
    """Test promo code validation endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def user_token(self, admin_token):
        """Create a test user or use admin token"""
        return admin_token  # Use admin for simplicity
    
    def test_promo_validate_endpoint_exists(self, user_token):
        """Test that /promo/validate endpoint exists and requires code"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Test with empty code
        response = requests.post(f"{BASE_URL}/api/promo/validate", 
                                json={"code": ""},
                                headers=headers)
        # Should return 400 for empty code
        assert response.status_code == 400, f"Expected 400 for empty code, got {response.status_code}"
        print("✓ /promo/validate endpoint exists and validates empty code")
    
    def test_promo_validate_invalid_code(self, user_token):
        """Test validation with invalid promo code"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        response = requests.post(f"{BASE_URL}/api/promo/validate", 
                                json={"code": "INVALID_TEST_CODE_12345"},
                                headers=headers)
        assert response.status_code == 400, f"Expected 400 for invalid code, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid promo code returns error: {data.get('detail')}")
    
    def test_calculate_price_with_invalid_promo_code(self, user_token):
        """Test calculate-price endpoint validates promo_code and returns error for invalid codes"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Test calculate-price with invalid promo_code - should return 400
        response = requests.post(f"{BASE_URL}/api/orders/calculate-price", 
                                json={
                                    "server": "us_server",
                                    "service": "wa",
                                    "promo_code": "INVALID_TEST_PROMO"
                                },
                                headers=headers)
        # Should return 400 for invalid promo code (validation is working)
        assert response.status_code == 400, f"Expected 400 for invalid promo, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "Invalid promo code" in data.get("detail", "")
        print(f"✓ Calculate-price validates promo_code and rejects invalid codes")


class TestAdminOtpSales:
    """Test Admin OTP Sales page endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_otp_orders_endpoint(self, admin_token):
        """Test /admin/otp-orders endpoint returns orders list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/otp-orders", headers=headers)
        assert response.status_code == 200, f"OTP orders failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "orders" in data
        assert "total" in data
        print(f"✓ /admin/otp-orders returns {data.get('total')} orders")
    
    def test_otp_orders_with_status_filter(self, admin_token):
        """Test OTP orders endpoint with status filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        for status in ['completed', 'active', 'cancelled', 'expired', 'refunded']:
            response = requests.get(f"{BASE_URL}/api/admin/otp-orders", 
                                   params={"status": status},
                                   headers=headers)
            assert response.status_code == 200, f"OTP orders filter failed for {status}: {response.text}"
            data = response.json()
            assert data.get("success") == True
            # All returned orders should have the filtered status
            for order in data.get("orders", []):
                assert order.get("status") == status, f"Order status mismatch: expected {status}, got {order.get('status')}"
        print("✓ OTP orders status filter works for all statuses")
    
    def test_otp_stats_endpoint(self, admin_token):
        """Test /admin/otp-stats endpoint returns statistics"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/otp-stats", headers=headers)
        assert response.status_code == 200, f"OTP stats failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "stats" in data
        
        stats = data.get("stats", {})
        assert "total_orders" in stats
        assert "status_breakdown" in stats
        assert "total_revenue_ngn" in stats
        assert "today_orders" in stats
        assert "today_revenue_ngn" in stats
        
        print(f"✓ /admin/otp-stats returns: total_orders={stats.get('total_orders')}, "
              f"total_revenue=₦{stats.get('total_revenue_ngn')}, "
              f"today_orders={stats.get('today_orders')}")
    
    def test_otp_stats_status_breakdown(self, admin_token):
        """Test that OTP stats includes status breakdown"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/otp-stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        status_breakdown = data.get("stats", {}).get("status_breakdown", {})
        expected_statuses = ['active', 'completed', 'cancelled', 'expired', 'refunded']
        
        for status in expected_statuses:
            assert status in status_breakdown, f"Missing status '{status}' in breakdown"
        
        print(f"✓ Status breakdown: {status_breakdown}")
    
    def test_otp_orders_requires_admin(self):
        """Test that OTP orders endpoint requires admin authentication"""
        # Test without auth
        response = requests.get(f"{BASE_URL}/api/admin/otp-orders")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ /admin/otp-orders requires authentication")
    
    def test_otp_stats_requires_admin(self):
        """Test that OTP stats endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/otp-stats")
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print("✓ /admin/otp-stats requires authentication")


class TestCalculatePriceEndpoint:
    """Test calculate-price endpoint with optional country field"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_calculate_price_without_country(self, user_token):
        """Test calculate-price works without country for DaisySMS (us_server)"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # DaisySMS (us_server) doesn't require country
        response = requests.post(f"{BASE_URL}/api/orders/calculate-price", 
                                json={
                                    "server": "us_server",
                                    "service": "wa"
                                },
                                headers=headers)
        assert response.status_code == 200, f"Calculate price failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "final_price_ngn" in data
        assert "final_price_usd" in data
        print(f"✓ Calculate price without country works: ₦{data.get('final_price_ngn')}")
    
    def test_calculate_price_with_country(self, user_token):
        """Test calculate-price works with country parameter"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        response = requests.post(f"{BASE_URL}/api/orders/calculate-price", 
                                json={
                                    "server": "us_server",
                                    "service": "wa",
                                    "country": "us"
                                },
                                headers=headers)
        assert response.status_code == 200, f"Calculate price with country failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Calculate price with country works: ₦{data.get('final_price_ngn')}")


class TestResellerEndpoints:
    """Test reseller-related endpoints"""
    
    @pytest.fixture(scope="class")
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json().get("token")
    
    def test_reseller_profile_endpoint(self, user_token):
        """Test reseller profile endpoint"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        response = requests.get(f"{BASE_URL}/api/reseller/profile", headers=headers)
        # May return 404 if not registered as reseller, or 200 if registered
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"✓ Reseller profile endpoint works (status: {response.status_code})")
    
    def test_reseller_plans_endpoint(self, user_token):
        """Test reseller plans endpoint"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        response = requests.get(f"{BASE_URL}/api/reseller/plans", headers=headers)
        assert response.status_code == 200, f"Reseller plans failed: {response.text}"
        data = response.json()
        assert "plans" in data
        print(f"✓ Reseller plans endpoint returns {len(data.get('plans', []))} plans")


class TestPublicBranding:
    """Test public branding endpoint includes all required fields"""
    
    def test_public_branding_fields(self):
        """Test public branding returns all expected fields"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200, f"Public branding failed: {response.text}"
        data = response.json()
        
        # Check for reseller_api_base_url (new field)
        assert "reseller_api_base_url" in data, "Missing reseller_api_base_url"
        
        # Check for other branding fields
        expected_fields = [
            "brand_name", "brand_logo_url", "primary_color_hex", 
            "secondary_color_hex", "button_color_hex"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Public branding includes all required fields including reseller_api_base_url")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
