"""
Test Travel Section Features - Iteration 17
Tests for:
1. Travel status endpoint returns dollar_rate
2. Travel locations endpoint returns 60+ airports
3. Travel locations endpoint returns cities for Attractions
4. PIN verification (11550099876)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTravelStatus:
    """Test /api/travel/status endpoint"""
    
    def test_travel_status_returns_dollar_rate(self):
        """Verify travel status returns dollar_rate for currency conversion"""
        response = requests.get(f"{BASE_URL}/api/travel/status")
        assert response.status_code == 200
        
        data = response.json()
        assert 'dollar_rate' in data, "dollar_rate field missing from response"
        assert isinstance(data['dollar_rate'], (int, float)), "dollar_rate should be numeric"
        assert data['dollar_rate'] > 0, "dollar_rate should be positive"
        print(f"✓ Travel status returns dollar_rate: {data['dollar_rate']}")
    
    def test_travel_status_returns_enabled_status(self):
        """Verify travel status returns enabled and configured flags"""
        response = requests.get(f"{BASE_URL}/api/travel/status")
        assert response.status_code == 200
        
        data = response.json()
        assert 'enabled' in data, "enabled field missing"
        assert 'configured' in data, "configured field missing"
        assert 'visible' in data, "visible field missing"
        print(f"✓ Travel status: enabled={data['enabled']}, configured={data['configured']}, visible={data['visible']}")


class TestTravelLocations:
    """Test /api/travel/locations endpoint"""
    
    def test_locations_returns_airports(self):
        """Verify locations endpoint returns airports list"""
        response = requests.get(f"{BASE_URL}/api/travel/locations")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True, "Response should have success=True"
        assert 'airports' in data, "airports field missing"
        assert isinstance(data['airports'], list), "airports should be a list"
        print(f"✓ Locations endpoint returns {len(data['airports'])} airports")
    
    def test_locations_has_60_plus_airports(self):
        """Verify at least 60 airports are returned"""
        response = requests.get(f"{BASE_URL}/api/travel/locations")
        assert response.status_code == 200
        
        data = response.json()
        airports = data.get('airports', [])
        assert len(airports) >= 60, f"Expected 60+ airports, got {len(airports)}"
        print(f"✓ {len(airports)} airports returned (requirement: 60+)")
    
    def test_airport_structure(self):
        """Verify airport objects have required fields"""
        response = requests.get(f"{BASE_URL}/api/travel/locations")
        assert response.status_code == 200
        
        data = response.json()
        airports = data.get('airports', [])
        assert len(airports) > 0, "No airports returned"
        
        # Check first airport has required fields
        airport = airports[0]
        required_fields = ['code', 'name', 'fullName', 'country', 'type']
        for field in required_fields:
            assert field in airport, f"Airport missing required field: {field}"
        
        print(f"✓ Airport structure valid: {airport['code']} - {airport['name']}, {airport['country']}")
    
    def test_locations_returns_cities(self):
        """Verify locations endpoint returns cities for Attractions tab"""
        response = requests.get(f"{BASE_URL}/api/travel/locations")
        assert response.status_code == 200
        
        data = response.json()
        assert 'cities' in data, "cities field missing"
        assert isinstance(data['cities'], list), "cities should be a list"
        assert len(data['cities']) > 0, "cities list should not be empty"
        print(f"✓ Locations endpoint returns {len(data['cities'])} cities")
    
    def test_city_structure(self):
        """Verify city objects have required fields for Attractions"""
        response = requests.get(f"{BASE_URL}/api/travel/locations")
        assert response.status_code == 200
        
        data = response.json()
        cities = data.get('cities', [])
        assert len(cities) > 0, "No cities returned"
        
        # Check first city has required fields
        city = cities[0]
        required_fields = ['lat', 'lng', 'name', 'country']
        for field in required_fields:
            assert field in city, f"City missing required field: {field}"
        
        print(f"✓ City structure valid: {city['name']}, {city['country']} ({city['lat']}, {city['lng']})")
    
    def test_nigerian_airports_included(self):
        """Verify Nigerian airports are included"""
        response = requests.get(f"{BASE_URL}/api/travel/locations")
        assert response.status_code == 200
        
        data = response.json()
        airports = data.get('airports', [])
        nigerian_airports = [a for a in airports if a.get('country') == 'Nigeria']
        
        assert len(nigerian_airports) >= 5, f"Expected at least 5 Nigerian airports, got {len(nigerian_airports)}"
        
        # Check for major Nigerian airports
        nigerian_codes = [a['code'] for a in nigerian_airports]
        expected_codes = ['LOS', 'ABV', 'PHC']  # Lagos, Abuja, Port Harcourt
        for code in expected_codes:
            assert code in nigerian_codes, f"Expected Nigerian airport {code} not found"
        
        print(f"✓ {len(nigerian_airports)} Nigerian airports found including LOS, ABV, PHC")


class TestFeatureUnlockPIN:
    """Test Feature Unlock PIN configuration"""
    
    def test_pin_in_env(self):
        """Verify FEATURE_UNLOCK_PIN is set to 11550099876"""
        # Read from backend .env file
        env_path = '/app/backend/.env'
        with open(env_path, 'r') as f:
            env_content = f.read()
        
        assert 'FEATURE_UNLOCK_PIN="11550099876"' in env_content, \
            "FEATURE_UNLOCK_PIN should be set to 11550099876"
        print("✓ FEATURE_UNLOCK_PIN is correctly set to 11550099876")


class TestAuthenticatedTravelEndpoints:
    """Test authenticated travel endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@smsrelay.com",
            "password": "admin123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_travel_status_authenticated(self, auth_token):
        """Test travel status with authentication"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/travel/status", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('enabled') == True, "Travel should be enabled"
        assert data.get('configured') == True, "Travel should be configured"
        assert 'dollar_rate' in data, "dollar_rate should be present"
        print(f"✓ Authenticated travel status: enabled={data['enabled']}, dollar_rate={data['dollar_rate']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
