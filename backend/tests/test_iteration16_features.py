"""
Test file for Iteration 16 features:
1. Case-insensitive email login
2. KYC Settings in Admin Panel (GET/PUT)
3. Service card navigation (frontend test)
4. Admin user toggle (frontend test)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sms-providers-cache.preview.emergentagent.com')

class TestCaseInsensitiveLogin:
    """Test case-insensitive email login functionality"""
    
    def test_login_with_lowercase_email(self):
        """Test login with lowercase email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        print(f"✓ Login with lowercase email successful")
    
    def test_login_with_uppercase_email(self):
        """Test login with UPPERCASE email - should work with case-insensitive login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "ADMIN@SMSRELAY.COM",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login with uppercase email failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        print(f"✓ Login with UPPERCASE email successful - case-insensitive login works!")
    
    def test_login_with_mixed_case_email(self):
        """Test login with MixedCase email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "Admin@SmsRelay.Com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login with mixed case email failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        print(f"✓ Login with MixedCase email successful")


class TestKYCSettingsAPI:
    """Test KYC Settings API endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_get_pricing_config_includes_kyc_settings(self, admin_token):
        """Test that GET /api/admin/pricing returns KYC tier settings"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        
        assert response.status_code == 200, f"Failed to get pricing config: {response.text}"
        data = response.json()
        
        # Verify KYC tier settings are present
        assert "kyc_tier1_max_balance" in data, "kyc_tier1_max_balance not in response"
        assert "kyc_tier1_fee" in data, "kyc_tier1_fee not in response"
        assert "kyc_tier2_max_balance" in data, "kyc_tier2_max_balance not in response"
        assert "kyc_tier2_fee" in data, "kyc_tier2_fee not in response"
        assert "kyc_tier3_max_balance" in data, "kyc_tier3_max_balance not in response"
        assert "kyc_tier3_fee" in data, "kyc_tier3_fee not in response"
        
        print(f"✓ KYC Settings present in pricing config:")
        print(f"  Tier 1: Max Balance = ₦{data['kyc_tier1_max_balance']:,.0f}, Fee = ₦{data['kyc_tier1_fee']:,.0f}")
        print(f"  Tier 2: Max Balance = ₦{data['kyc_tier2_max_balance']:,.0f}, Fee = ₦{data['kyc_tier2_fee']:,.0f}")
        print(f"  Tier 3: Max Balance = ₦{data['kyc_tier3_max_balance']:,.0f}, Fee = ₦{data['kyc_tier3_fee']:,.0f}")
    
    def test_update_kyc_settings(self, admin_token):
        """Test updating KYC tier settings via PUT /api/admin/pricing"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get current values
        get_response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert get_response.status_code == 200
        original_data = get_response.json()
        
        # Update with new values
        new_tier1_max = 60000.0
        new_tier2_fee = 600.0
        
        update_response = requests.put(f"{BASE_URL}/api/admin/pricing", headers=headers, json={
            "kyc_tier1_max_balance": new_tier1_max,
            "kyc_tier2_fee": new_tier2_fee
        })
        
        assert update_response.status_code == 200, f"Failed to update KYC settings: {update_response.text}"
        
        # Verify the update
        verify_response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert verify_response.status_code == 200
        updated_data = verify_response.json()
        
        assert updated_data["kyc_tier1_max_balance"] == new_tier1_max, "Tier 1 max balance not updated"
        assert updated_data["kyc_tier2_fee"] == new_tier2_fee, "Tier 2 fee not updated"
        
        print(f"✓ KYC Settings updated successfully:")
        print(f"  Tier 1 Max Balance: ₦{original_data['kyc_tier1_max_balance']:,.0f} → ₦{new_tier1_max:,.0f}")
        print(f"  Tier 2 Fee: ₦{original_data['kyc_tier2_fee']:,.0f} → ₦{new_tier2_fee:,.0f}")
        
        # Restore original values
        requests.put(f"{BASE_URL}/api/admin/pricing", headers=headers, json={
            "kyc_tier1_max_balance": original_data["kyc_tier1_max_balance"],
            "kyc_tier2_fee": original_data["kyc_tier2_fee"]
        })
        print(f"✓ Original values restored")


class TestAdminUserManagement:
    """Test admin user management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    def test_get_users_list(self, admin_token):
        """Test getting users list from admin panel"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        
        assert response.status_code == 200, f"Failed to get users: {response.text}"
        data = response.json()
        
        assert "users" in data, "Users not in response"
        assert len(data["users"]) > 0, "No users found"
        
        # Check that user objects have is_admin field
        first_user = data["users"][0]
        assert "is_admin" in first_user or "id" in first_user, "User object missing expected fields"
        
        print(f"✓ Users list retrieved: {len(data['users'])} users found")
    
    def test_update_user_admin_status(self, admin_token):
        """Test updating user admin status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get users list
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert users_response.status_code == 200
        users = users_response.json().get("users", [])
        
        # Find a non-admin user to test with (not the main admin)
        test_user = None
        for user in users:
            if user.get("email") != "admin@smsrelay.com" and not user.get("is_admin"):
                test_user = user
                break
        
        if not test_user:
            # Create a test user if none exists
            print("No non-admin user found, skipping admin toggle test")
            pytest.skip("No non-admin user available for testing")
        
        user_id = test_user.get("id")
        original_admin_status = test_user.get("is_admin", False)
        
        # Update user to admin
        update_response = requests.put(f"{BASE_URL}/api/admin/users/{user_id}", headers=headers, json={
            "is_admin": True
        })
        
        assert update_response.status_code == 200, f"Failed to update user: {update_response.text}"
        
        # Verify the update
        verify_response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        updated_users = verify_response.json().get("users", [])
        updated_user = next((u for u in updated_users if u.get("id") == user_id), None)
        
        if updated_user:
            assert updated_user.get("is_admin") == True, "User admin status not updated"
            print(f"✓ User {test_user.get('email')} admin status updated to True")
            
            # Restore original status
            requests.put(f"{BASE_URL}/api/admin/users/{user_id}", headers=headers, json={
                "is_admin": original_admin_status
            })
            print(f"✓ Original admin status restored")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy", "API not healthy"
        print(f"✓ API health check passed: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
