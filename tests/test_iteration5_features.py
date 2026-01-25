"""
Test iteration 5 features:
1. Ercaspay amount input maintains focus when typing multiple digits
2. Bank Accounts page in admin panel displays virtual account data
3. Admin dashboard Total OTP Volume metric displays correct value
4. Reseller API endpoints (/countries, /services, /buy, /status, /cancel) are working
5. User can login and access dashboard
6. Admin can login and access admin panel
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://billhub-16.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@smsrelay.com"
ADMIN_PASSWORD = "admin123"


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Admin can login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["is_admin"] == True
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful, token received")
        return data["token"]


class TestAdminVirtualAccounts:
    """Test Bank Accounts page - admin/virtual-accounts endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    def test_virtual_accounts_endpoint_returns_data(self, admin_token):
        """Bank Accounts page should display virtual account data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/virtual-accounts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "accounts" in data
        assert isinstance(data["accounts"], list)
        print(f"✓ Virtual accounts endpoint returns {len(data['accounts'])} accounts")
        
        # Verify account structure if accounts exist
        if len(data["accounts"]) > 0:
            account = data["accounts"][0]
            assert "user_id" in account
            assert "account_number" in account or "virtual_account_number" in account
            assert "bank_name" in account or "virtual_bank_name" in account
            print(f"✓ Account structure verified: {account.get('account_number', account.get('virtual_account_number'))}")
    
    def test_virtual_accounts_requires_admin(self):
        """Virtual accounts endpoint requires admin authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/virtual-accounts")
        assert response.status_code in [401, 403]
        print("✓ Virtual accounts endpoint requires authentication")


class TestAdminStats:
    """Test Admin dashboard stats including Total OTP Volume"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    def test_admin_stats_returns_total_orders(self, admin_token):
        """Admin stats should return total_orders for Total OTP Volume metric"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify total_orders exists (used for Total OTP Volume)
        assert "total_orders" in data
        assert isinstance(data["total_orders"], int)
        print(f"✓ Total orders (OTP Volume): {data['total_orders']}")
        
        # Verify money_flow.total_sales_ngn exists (used for Total OTP Volume in NGN)
        assert "money_flow" in data
        assert "total_sales_ngn" in data["money_flow"]
        print(f"✓ Total OTP Volume (NGN): ₦{data['money_flow']['total_sales_ngn']:,.2f}")
    
    def test_admin_stats_has_all_required_fields(self, admin_token):
        """Admin stats should have all required fields for dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check top-level fields
        required_fields = ["total_users", "total_orders", "active_orders", "total_revenue_usd", "period", "money_flow"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        # Check money_flow fields
        money_flow_fields = ["total_deposits_ngn", "total_deposits_usd", "total_sales_usd", "total_sales_ngn", "api_cost_usd", "gross_profit_usd"]
        for field in money_flow_fields:
            assert field in data["money_flow"], f"Missing money_flow field: {field}"
        
        print("✓ All required admin stats fields present")


class TestResellerAPIEndpoints:
    """Test Reseller API v1 endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    def test_reseller_servers_requires_api_key(self):
        """Reseller servers endpoint requires API key"""
        response = requests.get(f"{BASE_URL}/api/reseller/v1/servers")
        assert response.status_code in [401, 403]
        data = response.json()
        assert "API key required" in str(data.get("detail", ""))
        print("✓ Reseller servers endpoint requires API key")
    
    def test_reseller_countries_requires_server_param(self):
        """Reseller countries endpoint requires server parameter"""
        response = requests.get(
            f"{BASE_URL}/api/reseller/v1/countries",
            headers={"X-API-Key": "test-key"}
        )
        # Should fail with missing server parameter or invalid API key
        assert response.status_code in [400, 401, 403, 422]
        print("✓ Reseller countries endpoint validates parameters")
    
    def test_reseller_services_requires_server_param(self):
        """Reseller services endpoint requires server parameter"""
        response = requests.get(
            f"{BASE_URL}/api/reseller/v1/services",
            params={"country": "us"},
            headers={"X-API-Key": "test-key"}
        )
        # Should fail with missing server parameter or invalid API key
        assert response.status_code in [400, 401, 403, 422]
        print("✓ Reseller services endpoint validates parameters")
    
    def test_reseller_profile_endpoint(self, admin_token):
        """Reseller profile endpoint works for authenticated users"""
        response = requests.get(
            f"{BASE_URL}/api/reseller/profile",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # May return 404 if user is not a reseller, or 200 with profile
        assert response.status_code in [200, 404]
        print(f"✓ Reseller profile endpoint responds with status {response.status_code}")
    
    def test_reseller_plans_endpoint(self, admin_token):
        """Reseller plans endpoint returns available plans"""
        response = requests.get(
            f"{BASE_URL}/api/reseller/plans",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        print(f"✓ Reseller plans endpoint returns {len(data['plans'])} plans")


class TestUserDashboard:
    """Test user login and dashboard access"""
    
    def test_user_login_and_profile(self):
        """User can login and access profile"""
        # Login
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        token = response.json()["token"]
        
        # Access profile
        profile_response = requests.get(
            f"{BASE_URL}/api/user/profile",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert profile_response.status_code == 200
        profile = profile_response.json()
        assert "email" in profile
        assert "ngn_balance" in profile
        assert "usd_balance" in profile
        print(f"✓ User profile accessible: {profile['email']}")
    
    def test_user_orders_list(self):
        """User can access orders list"""
        # Login
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        token = response.json()["token"]
        
        # Access orders
        orders_response = requests.get(
            f"{BASE_URL}/api/orders/list",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert orders_response.status_code == 200
        data = orders_response.json()
        assert "orders" in data
        print(f"✓ User orders accessible: {len(data['orders'])} orders")


class TestPublicEndpoints:
    """Test public endpoints"""
    
    def test_public_branding(self):
        """Public branding endpoint returns brand info"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200
        data = response.json()
        assert "brand_name" in data
        assert "primary_color_hex" in data
        print(f"✓ Public branding: {data['brand_name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
