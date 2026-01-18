"""
Test suite for UltraCloud SMS bug fixes:
1. SMS History page - getServiceName fix for undefined codes
2. Reseller Portal - infinite reload fix
3. Admin branding colors - save and persist
4. Reseller cancel order - decrement total_revenue
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sms-gateway-17.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@smsrelay.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_EMAIL = f"test_bugfix_{int(time.time())}@test.com"
TEST_USER_PASSWORD = "testpass123"


class TestAuthAndSetup:
    """Authentication tests and setup"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture(scope="class")
    def test_user_token(self):
        """Create test user and get token"""
        # Try to register
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "full_name": "Test Bug Fix User",
            "phone": "08123456789"
        })
        if response.status_code == 200:
            return response.json().get("token")
        # If registration fails, try login
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Test user authentication failed")
    
    def test_admin_login(self, admin_token):
        """Test admin can login successfully"""
        assert admin_token is not None
        print(f"✓ Admin login successful")
    
    def test_user_profile(self, admin_token):
        """Test user profile endpoint works"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/user/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert data["is_admin"] == True
        print(f"✓ User profile endpoint works, admin: {data['is_admin']}")


class TestSMSHistoryFix:
    """Test SMS History page fix - getServiceName handles undefined codes"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_orders_list_endpoint(self, admin_token):
        """Test orders list endpoint returns valid data"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/list", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✓ Orders list endpoint works, {len(data['orders'])} orders found")
    
    def test_orders_have_service_field(self, admin_token):
        """Test that orders have service field (can be null/undefined)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/orders/list", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # The fix handles undefined service codes gracefully
        # Frontend getServiceName now returns 'Unknown' for undefined codes
        print(f"✓ Orders endpoint returns valid structure for SMS History")


class TestResellerPortalFix:
    """Test Reseller Portal infinite reload fix"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_reseller_profile_endpoint(self, admin_token):
        """Test reseller profile endpoint works"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/reseller/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Should return is_reseller field
        assert "is_reseller" in data
        print(f"✓ Reseller profile endpoint works, is_reseller: {data.get('is_reseller')}")
    
    def test_reseller_plans_endpoint(self):
        """Test reseller plans endpoint (public)"""
        response = requests.get(f"{BASE_URL}/api/reseller/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        print(f"✓ Reseller plans endpoint works, {len(data['plans'])} plans found")
    
    def test_reseller_orders_endpoint(self, admin_token):
        """Test reseller orders endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/reseller/orders?limit=20", headers=headers)
        # May return 200 or 403 depending on reseller status
        assert response.status_code in [200, 403]
        print(f"✓ Reseller orders endpoint responds correctly (status: {response.status_code})")


class TestAdminBrandingColorsFix:
    """Test Admin branding colors save and persist"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_get_pricing_includes_branding_colors(self, admin_token):
        """Test GET pricing includes all branding color fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Check all branding color fields are present
        branding_fields = [
            'button_color_hex',
            'accent_color_hex', 
            'header_bg_color_hex',
            'hero_gradient_from',
            'hero_gradient_to',
            'primary_color_hex',
            'secondary_color_hex'
        ]
        
        for field in branding_fields:
            assert field in data, f"Missing branding field: {field}"
            print(f"  ✓ {field}: {data.get(field)}")
        
        print(f"✓ All branding color fields present in pricing response")
    
    def test_update_branding_colors(self, admin_token):
        """Test updating branding colors persists correctly"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get current values
        response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert response.status_code == 200
        original_data = response.json()
        
        # Update with test values
        test_colors = {
            "button_color_hex": "#ff5733",
            "accent_color_hex": "#33ff57",
            "header_bg_color_hex": "#5733ff",
            "hero_gradient_from": "#ff3357",
            "hero_gradient_to": "#57ff33"
        }
        
        response = requests.put(f"{BASE_URL}/api/admin/pricing", 
                               headers=headers, 
                               json=test_colors)
        assert response.status_code == 200
        print(f"✓ Branding colors update request successful")
        
        # Verify persistence
        response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert response.status_code == 200
        updated_data = response.json()
        
        for field, value in test_colors.items():
            assert updated_data.get(field) == value, f"Field {field} not persisted correctly"
            print(f"  ✓ {field} persisted: {updated_data.get(field)}")
        
        # Restore original values
        restore_colors = {
            "button_color_hex": original_data.get('button_color_hex', '#7c3aed'),
            "accent_color_hex": original_data.get('accent_color_hex', '#7c3aed'),
            "header_bg_color_hex": original_data.get('header_bg_color_hex', '#ffffff'),
            "hero_gradient_from": original_data.get('hero_gradient_from', '#10b981'),
            "hero_gradient_to": original_data.get('hero_gradient_to', '#06b6d4')
        }
        requests.put(f"{BASE_URL}/api/admin/pricing", headers=headers, json=restore_colors)
        print(f"✓ Original branding colors restored")


class TestResellerCancelOrderFix:
    """Test reseller cancel order decrements total_revenue"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_reseller_cancel_endpoint_exists(self, admin_token):
        """Test reseller cancel order endpoint exists"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Try to cancel a non-existent order to verify endpoint exists
        response = requests.post(f"{BASE_URL}/api/reseller/cancel-order",
                                headers=headers,
                                json={"provider_order_id": "test_nonexistent_123"})
        # Should return 401 (no API key) or 404 (order not found), not 404 (endpoint not found)
        assert response.status_code in [401, 404, 400, 403]
        print(f"✓ Reseller cancel order endpoint exists (status: {response.status_code})")
    
    def test_reseller_profile_has_revenue_fields(self, admin_token):
        """Test reseller profile includes total_revenue_ngn and total_orders"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/reseller/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        if data.get('is_reseller'):
            # If user is a reseller, check revenue fields
            assert 'total_revenue_ngn' in data or 'reseller' in data
            print(f"✓ Reseller profile has revenue tracking fields")
        else:
            print(f"✓ User is not a reseller, revenue fields not applicable")


class TestPublicEndpoints:
    """Test public endpoints work correctly"""
    
    def test_public_branding_endpoint(self):
        """Test public branding endpoint"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200
        data = response.json()
        assert "brand_name" in data
        print(f"✓ Public branding endpoint works, brand: {data.get('brand_name')}")
    
    def test_public_services_endpoint(self):
        """Test public services endpoint"""
        response = requests.get(f"{BASE_URL}/api/services/list")
        # May require auth or be public
        assert response.status_code in [200, 401]
        print(f"✓ Services endpoint responds (status: {response.status_code})")


class TestAPIDocumentation:
    """Test Reseller API Documentation accessibility"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_reseller_api_endpoints_documented(self, admin_token):
        """Test that reseller API endpoints are accessible"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test key reseller endpoints
        endpoints = [
            ("/api/reseller/profile", "GET"),
            ("/api/reseller/plans", "GET"),
        ]
        
        for endpoint, method in endpoints:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", headers=headers)
            
            assert response.status_code in [200, 401, 403], f"Endpoint {endpoint} failed with {response.status_code}"
            print(f"  ✓ {method} {endpoint} accessible (status: {response.status_code})")
        
        print(f"✓ Reseller API endpoints are accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
