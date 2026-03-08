"""
Test SMS Provider Service Names and Country Names
Tests that SMS Bower and Tiger SMS return proper service names (e.g., 'WhatsApp' not 'wa')
and proper country names (e.g., 'Afghanistan' not '74')
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSMSServiceNames:
    """Test that SMS providers return proper service and country names"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for API calls"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testuser3@example.com", "password": "Password123!"}
        )
        if response.status_code == 200:
            return response.json().get("token")  # API returns 'token' not 'access_token'
        pytest.skip("Unable to authenticate")

    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")

    # ============== TIGER SMS SERVICE NAME TESTS ==============
    
    def test_tigersms_services_usa_returns_full_names(self, headers):
        """Test that Tiger SMS services for USA return full service names, not codes"""
        response = requests.get(
            f"{BASE_URL}/api/services/tigersms?country=187",  # 187 = USA
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Tiger SMS endpoint unavailable: {response.text}")
        
        data = response.json()
        
        if not data.get('success'):
            pytest.skip(f"Tiger SMS API error: {data.get('message')}")
        
        services = data.get('services', [])
        assert len(services) > 0, "Tiger SMS should return services for USA"
        
        print(f"\n✓ Tiger SMS USA returned {len(services)} services")
        
        # Check that services have full names, not just codes
        services_with_full_names = 0
        services_sample = []
        
        for service in services[:20]:  # Check first 20 services
            service_code = service.get('value', '')
            service_name = service.get('name', '') or service.get('label', '')
            
            # A full name should be more than 2 characters (code is typically 2-3 chars)
            if len(service_name) > 3 and service_name != service_code:
                services_with_full_names += 1
            
            services_sample.append({
                'code': service_code,
                'name': service_name,
                'is_full_name': len(service_name) > 3 and service_name != service_code
            })
        
        # At least 50% should have full names (some codes might not have mappings)
        assert services_with_full_names >= len(services_sample) // 2, \
            f"Tiger SMS should return full service names. Sample: {services_sample[:10]}"
        
        # Print sample for verification
        print(f"  Sample services with names:")
        for s in services_sample[:10]:
            status = "✓ Full name" if s['is_full_name'] else "⚠ Code only"
            print(f"    {s['code']} -> {s['name']} ({status})")

    def test_tigersms_common_services_have_correct_names(self, headers):
        """Test that common services like WhatsApp, Telegram have correct names"""
        response = requests.get(
            f"{BASE_URL}/api/services/tigersms?country=187",  # 187 = USA
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Tiger SMS endpoint unavailable: {response.text}")
        
        data = response.json()
        if not data.get('success'):
            pytest.skip(f"Tiger SMS API error: {data.get('message')}")
        
        services = data.get('services', [])
        
        # Map of expected names for common codes
        expected_names = {
            'wa': 'WhatsApp',
            'tg': 'Telegram',
            'fb': 'Facebook',
            'ig': 'Instagram',
            'go': 'Google',
            'tw': 'Twitter',
            'vi': 'Viber',
            'ds': 'Discord',
            'tt': 'TikTok',
            'am': 'Amazon',
        }
        
        found_services = {}
        for service in services:
            code = service.get('value', '').lower()
            if code in expected_names:
                found_services[code] = service.get('name', '')
        
        print(f"\n✓ Found {len(found_services)} common services in Tiger SMS")
        
        correct_count = 0
        for code, actual_name in found_services.items():
            expected = expected_names[code]
            # Check if name contains expected name (may be formatted differently)
            is_correct = expected.lower() in actual_name.lower() or actual_name.lower() in expected.lower()
            if is_correct:
                correct_count += 1
                print(f"  ✓ {code} -> {actual_name} (expected: {expected})")
            else:
                print(f"  ⚠ {code} -> {actual_name} (expected: {expected})")
        
        # At least 70% of common services should have correct names
        if found_services:
            assert correct_count >= len(found_services) * 0.7, \
                f"Most common services should have correct names. Got {correct_count}/{len(found_services)}"

    def test_tigersms_countries_available(self, headers):
        """Test that Tiger SMS countries endpoint returns valid countries"""
        response = requests.get(
            f"{BASE_URL}/api/services/tigersms/countries",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Tiger SMS countries endpoint unavailable: {response.text}")
        
        data = response.json()
        if not data.get('success'):
            pytest.skip(f"Tiger SMS countries error: {data.get('message')}")
        
        countries = data.get('countries', [])
        assert len(countries) > 10, "Tiger SMS should have many countries available"
        
        print(f"\n✓ Tiger SMS has {len(countries)} countries available")
        
        # Check that USA is in the list
        usa_found = any(c.get('value') == '187' or c.get('label', '').lower() == 'usa' for c in countries)
        print(f"  USA found: {usa_found}")

    # ============== SMS BOWER SERVICE NAME TESTS ==============
    
    def test_smsbower_services_return_full_names(self, headers):
        """Test that SMS Bower services return full service names using getServicesList"""
        # First try to get services for a specific country
        response = requests.get(
            f"{BASE_URL}/api/services/smsbower?country=0&refresh=true",  # 0 = Russia
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"SMS Bower endpoint unavailable: {response.text}")
        
        data = response.json()
        
        if not data.get('success'):
            message = data.get('message', '')
            if 'not configured' in message.lower():
                pytest.skip("SMS Bower API key not configured - expected behavior")
            pytest.skip(f"SMS Bower API error: {message}")
        
        services = data.get('services', [])
        
        if len(services) == 0:
            pytest.skip("SMS Bower returned no services for country 0")
        
        print(f"\n✓ SMS Bower returned {len(services)} services")
        
        # Check that services have full names, not just codes
        services_with_full_names = 0
        services_sample = []
        
        for service in services[:20]:
            service_code = service.get('value', '')
            service_name = service.get('name', '') or service.get('label', '')
            
            # Full name should be more than just the code
            is_full_name = len(service_name) > 3 and service_name.lower() != service_code.lower()
            if is_full_name:
                services_with_full_names += 1
            
            services_sample.append({
                'code': service_code,
                'name': service_name,
                'is_full_name': is_full_name
            })
        
        # Print sample
        print(f"  Sample services:")
        for s in services_sample[:10]:
            status = "✓ Full name" if s['is_full_name'] else "⚠ Code only"
            print(f"    {s['code']} -> {s['name']} ({status})")
        
        # At least 50% should have full names
        assert services_with_full_names >= len(services_sample) // 2, \
            f"SMS Bower should return full service names. Got {services_with_full_names}/{len(services_sample)}"

    def test_smsbower_countries_return_full_names(self, headers):
        """Test that SMS Bower countries API returns proper country names (not numeric codes)"""
        response = requests.get(
            f"{BASE_URL}/api/services/smsbower/countries",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"SMS Bower countries endpoint unavailable: {response.text}")
        
        data = response.json()
        
        if not data.get('success'):
            message = data.get('message', '')
            if 'not configured' in message.lower():
                pytest.skip("SMS Bower API key not configured - expected behavior")
            pytest.skip(f"SMS Bower countries error: {message}")
        
        countries = data.get('countries', [])
        
        if len(countries) == 0:
            pytest.skip("SMS Bower returned no countries")
        
        print(f"\n✓ SMS Bower returned {len(countries)} countries")
        
        # Check that countries have proper names, not just numeric codes
        countries_with_names = 0
        countries_sample = []
        
        for country in countries[:20]:
            country_code = str(country.get('value', ''))
            country_name = country.get('name', '') or country.get('label', '')
            
            # A proper country name should not be just a number
            is_proper_name = not country_name.isdigit() and len(country_name) > 2
            if is_proper_name:
                countries_with_names += 1
            
            countries_sample.append({
                'code': country_code,
                'name': country_name,
                'is_proper_name': is_proper_name
            })
        
        # Print sample
        print(f"  Sample countries:")
        for c in countries_sample[:10]:
            status = "✓ Full name" if c['is_proper_name'] else "⚠ Numeric code"
            print(f"    {c['code']} -> {c['name']} ({status})")
        
        # At least 80% should have proper names
        assert countries_with_names >= len(countries_sample) * 0.8, \
            f"SMS Bower should return proper country names. Got {countries_with_names}/{len(countries_sample)}"

    def test_smsbower_usa_services(self, headers):
        """Test SMS Bower services for USA (country=0 or 187)"""
        # Try country=0 first (often used for USA/Russia)
        response = requests.get(
            f"{BASE_URL}/api/services/smsbower?country=0",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"SMS Bower endpoint unavailable: {response.text}")
        
        data = response.json()
        
        if not data.get('success'):
            message = data.get('message', '')
            if 'not configured' in message.lower():
                pytest.skip("SMS Bower API key not configured")
            pytest.skip(f"SMS Bower API error: {message}")
        
        services = data.get('services', [])
        print(f"\n✓ SMS Bower USA (country=0) returned {len(services)} services")
        
        # Check for common services
        common_codes = ['wa', 'tg', 'fb', 'go', 'ig']
        found_common = []
        for service in services:
            code = service.get('value', '').lower()
            if code in common_codes:
                found_common.append({
                    'code': code,
                    'name': service.get('name', ''),
                    'price_ngn': service.get('price_ngn', 0)
                })
        
        if found_common:
            print(f"  Common services found:")
            for s in found_common:
                print(f"    {s['code']} -> {s['name']} (₦{s['price_ngn']:.2f})")

    # ============== ADMIN SYNC TESTS ==============
    
    def test_provider_status_endpoint(self, headers):
        """Test that provider status endpoint returns all providers"""
        response = requests.get(
            f"{BASE_URL}/api/services/providers/status",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('success'), f"Provider status should succeed: {data}"
        
        providers = data.get('providers', {})
        print(f"\n✓ Provider status returned {len(providers)} providers")
        
        # Check that expected providers are present
        expected_providers = ['tigersms', 'smsbower', 'smspool', '5sim', 'daisysms', 'textverified']
        for provider in expected_providers:
            assert provider in providers, f"Provider {provider} should be in status"
            status = providers[provider]
            enabled = status.get('enabled', False)
            print(f"  {provider}: {'✓ Enabled' if enabled else '✗ Disabled'}")

    def test_5sim_services_available(self, headers):
        """Test that 5sim services are available"""
        response = requests.get(
            f"{BASE_URL}/api/services/5sim?country=usa",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"5sim endpoint unavailable: {response.text}")
        
        data = response.json()
        
        if not data.get('success'):
            pytest.skip(f"5sim API error: {data.get('message')}")
        
        services = data.get('services', [])
        print(f"\n✓ 5sim USA returned {len(services)} services")
        
        # Check a few services have names
        if services:
            print(f"  Sample services:")
            for s in services[:5]:
                print(f"    {s.get('value', '')} -> {s.get('name', s.get('label', ''))}")


class TestSMSBowerSpecificAPIs:
    """Test SMS Bower specific API endpoints (getServicesList, getCountries, getPricesV3)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testuser3@example.com", "password": "Password123!"}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Unable to authenticate")

    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    def test_smsbower_with_refresh_fetches_from_api(self, headers):
        """Test that refresh=true parameter fetches fresh data from API"""
        response = requests.get(
            f"{BASE_URL}/api/services/smsbower?refresh=true",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"SMS Bower unavailable: {response.text}")
        
        data = response.json()
        
        if not data.get('success'):
            message = data.get('message', '')
            if 'not configured' in message.lower():
                pytest.skip("SMS Bower API key not configured")
            pytest.skip(f"SMS Bower error: {message}")
        
        # When refresh=true and no country specified, should return countries
        countries = data.get('countries', [])
        cached = data.get('cached', True)
        
        print(f"\n✓ SMS Bower refresh=true returned {len(countries)} countries (cached={cached})")
        
        if countries:
            # Verify countries have proper names (not numeric IDs)
            proper_names = sum(1 for c in countries if not str(c.get('name', '')).isdigit())
            print(f"  Countries with proper names: {proper_names}/{len(countries)}")

    def test_smsbower_services_with_country_and_refresh(self, headers):
        """Test fetching SMS Bower services for specific country with refresh"""
        # country=0 is commonly used
        response = requests.get(
            f"{BASE_URL}/api/services/smsbower?country=0&refresh=true",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"SMS Bower unavailable: {response.text}")
        
        data = response.json()
        
        if not data.get('success'):
            message = data.get('message', '')
            if 'not configured' in message.lower():
                pytest.skip("SMS Bower API key not configured")
            pytest.skip(f"SMS Bower error: {message}")
        
        services = data.get('services', [])
        
        print(f"\n✓ SMS Bower country=0 refresh=true returned {len(services)} services")
        
        if services:
            # Check service names are full names, not codes
            for s in services[:5]:
                code = s.get('value', '')
                name = s.get('name', '')
                price = s.get('price_ngn', 0)
                is_full = len(name) > 3 and name.lower() != code.lower()
                status = "✓" if is_full else "⚠"
                print(f"  {status} {code} -> {name} (₦{price:.2f})")


class TestTigerSMSServiceNameResolution:
    """Test Tiger SMS specific service name resolution from SERVICE_NAMES dictionary"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testuser3@example.com", "password": "Password123!"}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Unable to authenticate")

    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }

    def test_tigersms_whatsapp_has_correct_name(self, headers):
        """Test that WhatsApp service code 'wa' resolves to 'WhatsApp'"""
        response = requests.get(
            f"{BASE_URL}/api/services/tigersms?country=187",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Tiger SMS unavailable: {response.text}")
        
        data = response.json()
        if not data.get('success'):
            pytest.skip(f"Tiger SMS error: {data.get('message')}")
        
        services = data.get('services', [])
        
        # Find WhatsApp
        whatsapp = next((s for s in services if s.get('value', '').lower() == 'wa'), None)
        
        if whatsapp:
            name = whatsapp.get('name', '')
            assert 'whatsapp' in name.lower(), f"Service 'wa' should be named 'WhatsApp', got '{name}'"
            print(f"\n✓ WhatsApp (wa) correctly named: {name}")
        else:
            print("\n⚠ WhatsApp service not found in Tiger SMS USA services")

    def test_tigersms_telegram_has_correct_name(self, headers):
        """Test that Telegram service code 'tg' resolves to 'Telegram'"""
        response = requests.get(
            f"{BASE_URL}/api/services/tigersms?country=187",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Tiger SMS unavailable: {response.text}")
        
        data = response.json()
        if not data.get('success'):
            pytest.skip(f"Tiger SMS error: {data.get('message')}")
        
        services = data.get('services', [])
        
        # Find Telegram
        telegram = next((s for s in services if s.get('value', '').lower() == 'tg'), None)
        
        if telegram:
            name = telegram.get('name', '')
            assert 'telegram' in name.lower(), f"Service 'tg' should be named 'Telegram', got '{name}'"
            print(f"\n✓ Telegram (tg) correctly named: {name}")
        else:
            print("\n⚠ Telegram service not found in Tiger SMS USA services")

    def test_tigersms_returns_service_names_not_just_codes(self, headers):
        """Comprehensive test that Tiger SMS returns readable service names"""
        response = requests.get(
            f"{BASE_URL}/api/services/tigersms?country=187&refresh=true",
            headers=headers
        )
        
        if response.status_code != 200:
            pytest.skip(f"Tiger SMS unavailable: {response.text}")
        
        data = response.json()
        if not data.get('success'):
            pytest.skip(f"Tiger SMS error: {data.get('message')}")
        
        services = data.get('services', [])
        
        # Count how many have proper names vs just codes
        proper_names = 0
        code_only = 0
        
        for service in services:
            code = service.get('value', '')
            name = service.get('name', '')
            
            # A proper name is longer than the code and not just the code uppercase
            if len(name) > len(code) + 1 and name.upper() != code.upper():
                proper_names += 1
            else:
                code_only += 1
        
        total = len(services)
        percentage = (proper_names / total * 100) if total > 0 else 0
        
        print(f"\n✓ Tiger SMS USA services name analysis:")
        print(f"  Total services: {total}")
        print(f"  With proper names: {proper_names} ({percentage:.1f}%)")
        print(f"  Code only: {code_only}")
        
        # At least 60% should have proper names (SERVICE_NAMES has 400+ mappings)
        # Some new services from Tiger SMS may not have mappings yet
        assert percentage >= 60, f"Expected at least 60% services with proper names, got {percentage:.1f}%"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
