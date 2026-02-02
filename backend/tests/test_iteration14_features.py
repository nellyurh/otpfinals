"""
Test iteration 14 features:
1. Logo size in dashboard header (h-14 sm:h-16 lg:h-20)
2. Bill payment cards navigate to bills-payment section
3. Currency conversion section - bidirectional toggle (USD↔NGN)
4. Admin panel - 'Disable ALL Bill Payments' master toggle
5. When disable_all_bills is true, bill-related items hidden from dashboard
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print("✓ Health endpoint working")
    
    def test_admin_login(self):
        """Test admin login works correctly"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert data.get('user', {}).get('is_admin') == True
        print("✓ Admin login successful")
        return data['token']


class TestExchangeRateEndpoint:
    """Test exchange rate endpoint returns both USD→NGN and NGN→USD rates"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json()['token']
    
    def test_exchange_rate_returns_both_rates(self, admin_token):
        """Test /api/wallet/exchange-rate returns both usd_to_ngn_rate and ngn_to_usd_rate"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/wallet/exchange-rate", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check both rates are present
        assert 'usd_to_ngn_rate' in data, "Missing usd_to_ngn_rate"
        assert 'ngn_to_usd_rate' in data, "Missing ngn_to_usd_rate"
        
        # Verify rates are numeric and reasonable
        assert isinstance(data['usd_to_ngn_rate'], (int, float))
        assert isinstance(data['ngn_to_usd_rate'], (int, float))
        assert data['usd_to_ngn_rate'] > 0
        assert data['ngn_to_usd_rate'] > 0
        
        print(f"✓ Exchange rates returned: USD→NGN={data['usd_to_ngn_rate']}, NGN→USD={data['ngn_to_usd_rate']}")


class TestNgnToUsdConversion:
    """Test NGN to USD conversion endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json()['token']
    
    def test_convert_ngn_to_usd_endpoint_exists(self, admin_token):
        """Test /api/wallet/convert-ngn-to-usd endpoint exists"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test with a small amount (should work if user has balance)
        response = requests.post(
            f"{BASE_URL}/api/wallet/convert-ngn-to-usd",
            json={"amount_ngn": 100},
            headers=headers
        )
        
        # Should return 200 (success) or 400 (insufficient balance) - not 404
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert 'usd_received' in data
            assert 'exchange_rate' in data
            print(f"✓ NGN to USD conversion successful: {data}")
        else:
            print(f"✓ NGN to USD endpoint exists (insufficient balance for test)")


class TestDisableAllBillsToggle:
    """Test admin disable_all_bills toggle functionality"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json()['token']
    
    def test_page_toggles_includes_disable_all_bills(self, admin_token):
        """Test that page toggles endpoint returns disable_all_bills field"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/user/page-toggles", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check disable_all_bills field exists
        assert 'disable_all_bills' in data, "Missing disable_all_bills in page toggles"
        print(f"✓ disable_all_bills toggle present: {data.get('disable_all_bills')}")
    
    def test_admin_can_update_disable_all_bills(self, admin_token):
        """Test admin can update disable_all_bills toggle"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get current state
        response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert response.status_code == 200
        current_state = response.json().get('disable_all_bills', False)
        
        # Toggle to opposite state
        new_state = not current_state
        update_response = requests.put(
            f"{BASE_URL}/api/admin/pricing",
            json={"disable_all_bills": new_state},
            headers=headers
        )
        assert update_response.status_code == 200
        
        # Verify change
        verify_response = requests.get(f"{BASE_URL}/api/admin/pricing", headers=headers)
        assert verify_response.status_code == 200
        updated_state = verify_response.json().get('disable_all_bills')
        assert updated_state == new_state, f"Expected {new_state}, got {updated_state}"
        
        # Restore original state
        requests.put(
            f"{BASE_URL}/api/admin/pricing",
            json={"disable_all_bills": current_state},
            headers=headers
        )
        
        print(f"✓ Admin can toggle disable_all_bills: {current_state} → {new_state} → {current_state}")


class TestPublicBranding:
    """Test public branding endpoint"""
    
    def test_public_branding_returns_logo_url(self):
        """Test /api/public/branding returns brand_logo_url"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'brand_logo_url' in data, "Missing brand_logo_url"
        assert 'brand_name' in data, "Missing brand_name"
        
        print(f"✓ Public branding returns logo: {data.get('brand_logo_url')[:50]}...")


class TestUserProfile:
    """Test user profile endpoint returns balance info"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        return response.json()['token']
    
    def test_profile_returns_balances(self, admin_token):
        """Test user profile returns both NGN and USD balances"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/user/profile", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert 'ngn_balance' in data, "Missing ngn_balance"
        assert 'usd_balance' in data, "Missing usd_balance"
        
        print(f"✓ Profile returns balances: NGN={data.get('ngn_balance')}, USD={data.get('usd_balance')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
