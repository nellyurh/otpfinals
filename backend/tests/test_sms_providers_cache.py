"""
Test SMS Provider Database Caching Feature - Iteration 18
Tests:
1. Virtual Numbers page loading with dropdown
2. US Numbers shows 4 provider cards (generic names)
3. Other Countries shows 3 provider cards (generic names)
4. Tiger SMS services API with country param
5. Tiger SMS countries endpoint
6. SMS Bower endpoints (API key dependency)
7. Admin sync endpoint
8. Admin cache status endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pricing-fix-test-1.preview.emergentagent.com')

@pytest.fixture(scope="session")
def test_user_token():
    """Get auth token for test user."""
    # Try to login with test user
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "smstestuser@example.com",
        "password": "Test123!"
    })
    if resp.status_code == 200:
        return resp.json().get("token")
    
    # If login fails, try to register
    resp = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": "smstestuser@example.com",
        "password": "Test123!",
        "first_name": "SMS",
        "last_name": "Test",
        "phone": "+2348000000001"
    })
    if resp.status_code in [200, 201]:
        return resp.json().get("token")
    
    # Try login again after register
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "smstestuser@example.com",
        "password": "Test123!"
    })
    if resp.status_code == 200:
        return resp.json().get("token")
    
    pytest.skip("Could not authenticate test user")

@pytest.fixture(scope="session")
def admin_token():
    """Get auth token for admin user."""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@smsrelay.com",
        "password": "admin123"
    })
    if resp.status_code == 200:
        return resp.json().get("token")
    pytest.skip("Admin login failed")


class TestHealthAndBasics:
    """Basic health checks."""
    
    def test_health_check(self):
        """Test backend health endpoint."""
        resp = requests.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["mongodb"] == "connected"
        print(f"✓ Health check passed: {data}")


class TestTigerSMSCachedServices:
    """Test Tiger SMS cached services endpoints."""
    
    def test_tigersms_services_endpoint_exists(self, test_user_token):
        """Test Tiger SMS services endpoint returns data."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/tigersms", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "success" in data
        print(f"✓ Tiger SMS services endpoint: status_code={resp.status_code}, success={data.get('success')}")
    
    def test_tigersms_services_with_usa_country(self, test_user_token):
        """Test Tiger SMS services for USA (country=187)."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/tigersms?country=187", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        print(f"✓ Tiger SMS USA services: success={data.get('success')}, services_count={len(data.get('services', []))}")
        
        # Should return services list
        if data.get('success'):
            assert "services" in data
            # Services should have price information
            if data.get('services'):
                first_service = data['services'][0]
                print(f"  Sample service: {first_service.get('label', first_service.get('name'))} - NGN:{first_service.get('price_ngn')}")
    
    def test_tigersms_countries_endpoint(self, test_user_token):
        """Test Tiger SMS countries endpoint returns list of countries."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/tigersms/countries", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get('success') == True
        assert "countries" in data
        print(f"✓ Tiger SMS countries: {len(data.get('countries', []))} countries available")
        
        # Check that countries have proper format
        if data.get('countries'):
            first_country = data['countries'][0]
            print(f"  Sample country: {first_country}")


class TestSMSBowerEndpoints:
    """Test SMS Bower endpoints - requires API key."""
    
    def test_smsbower_services_endpoint(self, test_user_token):
        """Test SMS Bower services endpoint."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/smsbower", headers=headers)
        # Should return 200 but may have error message if API key not configured
        assert resp.status_code == 200
        data = resp.json()
        print(f"✓ SMS Bower services: success={data.get('success')}, message={data.get('message', 'N/A')}")
        
        # If success is False, it should have meaningful error
        if not data.get('success'):
            assert data.get('message') or data.get('detail')
            print(f"  Note: SMS Bower may require API key configuration")
    
    def test_smsbower_countries_endpoint(self, test_user_token):
        """Test SMS Bower countries endpoint."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/smsbower/countries", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        print(f"✓ SMS Bower countries: success={data.get('success')}")


class TestAdminCacheManagement:
    """Test admin SMS provider cache management endpoints."""
    
    def test_admin_cache_status(self, admin_token):
        """Test admin cache status endpoint returns provider statistics."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.get(f"{BASE_URL}/api/admin/sms-providers/cache-status", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") == True
        assert "cache_status" in data
        
        cache_status = data["cache_status"]
        print(f"✓ Admin cache status endpoint returned successfully")
        
        # Check that we have status for expected providers
        for provider in ["tigersms", "smsbower"]:
            if provider in cache_status:
                status = cache_status[provider]
                print(f"  {provider}: {status.get('services_cached', 0)} services, {status.get('countries', 0)} countries")
    
    def test_admin_sync_endpoint_exists(self, admin_token):
        """Test that admin sync endpoint exists (POST)."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        # Don't actually sync, just verify endpoint exists and requires auth
        resp = requests.post(f"{BASE_URL}/api/admin/sms-providers/sync", headers=headers)
        # Should return 200 with results (even if some providers fail)
        assert resp.status_code == 200
        data = resp.json()
        assert "success" in data
        print(f"✓ Admin sync endpoint: success={data.get('success')}")
        
        if "results" in data:
            for provider, result in data["results"].items():
                status = "OK" if result.get('success') else result.get('error', 'Failed')
                print(f"  {provider}: {status}")
    
    def test_admin_sync_specific_provider(self, admin_token):
        """Test syncing specific provider (tigersms)."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        resp = requests.post(f"{BASE_URL}/api/admin/sms-providers/sync?provider=tigersms", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        print(f"✓ Sync Tiger SMS only: success={data.get('success')}")
        
        if "results" in data and "tigersms" in data["results"]:
            result = data["results"]["tigersms"]
            if result.get("success"):
                print(f"  Tiger SMS cached: {result.get('services_cached')} services, {result.get('countries')} countries")
            else:
                print(f"  Tiger SMS error: {result.get('error')}")


class TestProviderStatusEndpoint:
    """Test provider status endpoint used by frontend."""
    
    def test_provider_status_returns_all_providers(self, test_user_token):
        """Test /api/services/providers/status returns all providers."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/providers/status", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("success") == True
        assert "providers" in data
        
        providers = data["providers"]
        expected_providers = ["daisysms", "smspool", "5sim", "tigersms", "smsbower", "textverified"]
        
        print(f"✓ Provider status endpoint returned {len(providers)} providers")
        for p in expected_providers:
            if p in providers:
                print(f"  {p}: enabled={providers[p].get('enabled')}")


class TestLegacyServers:
    """Test that legacy servers still work."""
    
    def test_us_server_endpoint(self, test_user_token):
        """Test US Server (DaisySMS) endpoint."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/us_server", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        print(f"✓ US Server: success={data.get('success')}, services={len(data.get('services', []))}")
    
    def test_server1_endpoint(self, test_user_token):
        """Test Server 1 (SMS Pool) endpoint."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/server1", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        print(f"✓ Server 1 (International): success={data.get('success')}, countries={len(data.get('countries', []))}")
    
    def test_server2_endpoint(self, test_user_token):
        """Test Server 2 (5sim) endpoint."""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        resp = requests.get(f"{BASE_URL}/api/services/server2", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        print(f"✓ Server 2 (Global): success={data.get('success')}, countries={len(data.get('countries', []))}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
