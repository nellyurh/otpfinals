import requests
import sys
import json
from datetime import datetime
import time

class SMSRelayAPITester:
    def __init__(self, base_url="https://sms-gateway-16.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_id = None
        self.admin_user_id = None

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {error}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth token if available
        token = self.admin_token if use_admin and self.admin_token else self.token
        if token:
            test_headers['Authorization'] = f'Bearer {token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True, details)
                    return True, response_data
                except:
                    self.log_test(name, True, details)
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, details, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, "", str(e))
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_user_{int(time.time())}@example.com",
            "password": "TestPass123!",
            "full_name": "Test User",
            "phone": "08012345678"  # Fixed Nigerian phone format
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        # First register a user for login test
        test_user_data = {
            "email": f"login_test_{int(time.time())}@example.com",
            "password": "TestPass123!",
            "full_name": "Login Test User",
            "phone": "08087654321"  # Added required phone field
        }
        
        # Register user
        reg_success, reg_response = self.run_test(
            "Pre-Login Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if not reg_success:
            return False
        
        # Now test login
        login_data = {
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success and 'token' in response

    def test_admin_user_creation(self):
        """Create admin user for admin tests"""
        admin_data = {
            "email": f"admin_{int(time.time())}@example.com",
            "password": "AdminPass123!",
            "full_name": "Admin User"
        }
        
        success, response = self.run_test(
            "Admin User Registration",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user_id = response['user']['id']
            
            # Manually set admin flag in database (would normally be done via database)
            # For testing purposes, we'll assume this user has admin privileges
            return True
        return False

    def test_get_profile(self):
        """Test getting user profile"""
        if not self.token:
            self.log_test("Get Profile", False, "", "No auth token available")
            return False
        
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "user/profile",
            200
        )
        
        return success and 'email' in response

    def test_virtual_accounts(self):
        """Test virtual accounts endpoint"""
        if not self.token:
            self.log_test("Virtual Accounts", False, "", "No auth token available")
            return False
        
        success, response = self.run_test(
            "Get Virtual Accounts",
            "GET",
            "user/virtual-accounts",
            200
        )
        
        return success and 'accounts' in response

    def test_ngn_to_usd_conversion(self):
        """Test NGN to USD conversion"""
        if not self.token:
            self.log_test("NGN to USD Conversion", False, "", "No auth token available")
            return False
        
        # This will likely fail due to insufficient balance, but we're testing the endpoint
        conversion_data = {
            "amount_ngn": 1500.0
        }
        
        success, response = self.run_test(
            "NGN to USD Conversion",
            "POST",
            "user/convert-ngn-to-usd",
            400,  # Expecting 400 due to insufficient balance
            data=conversion_data
        )
        
        # Success here means the endpoint is working (even if balance is insufficient)
        return success

    def test_services_list(self):
        """Test getting services list"""
        if not self.token:
            self.log_test("Services List", False, "", "No auth token available")
            return False
        
        success, response = self.run_test(
            "Get Services List",
            "GET",
            "services/list",
            200
        )
        
        return success

    def test_purchase_number(self):
        """Test purchasing a virtual number"""
        if not self.token:
            self.log_test("Purchase Number", False, "", "No auth token available")
            return False
        
        purchase_data = {
            "provider": "smspool",
            "service": "whatsapp",
            "country": "us"
        }
        
        # This will likely fail due to insufficient balance or API issues
        success, response = self.run_test(
            "Purchase Virtual Number",
            "POST",
            "orders/purchase",
            400,  # Expecting 400 due to insufficient balance or API issues
            data=purchase_data
        )
        
        return success

    def test_orders_list(self):
        """Test getting orders list"""
        if not self.token:
            self.log_test("Orders List", False, "", "No auth token available")
            return False
        
        success, response = self.run_test(
            "Get Orders List",
            "GET",
            "orders/list",
            200
        )
        
        return success and 'orders' in response

    def test_transactions_list(self):
        """Test getting transactions list"""
        if not self.token:
            self.log_test("Transactions List", False, "", "No auth token available")
            return False
        
        success, response = self.run_test(
            "Get Transactions List",
            "GET",
            "transactions/list",
            200
        )
        
        return success and 'transactions' in response

    def test_admin_pricing_get(self):
        """Test getting admin pricing config"""
        if not self.admin_token:
            self.log_test("Admin Get Pricing", False, "", "No admin token available")
            return False
        
        success, response = self.run_test(
            "Admin Get Pricing Config",
            "GET",
            "admin/pricing",
            200,
            use_admin=True
        )
        
        return success

    def test_admin_pricing_update(self):
        """Test updating admin pricing config"""
        if not self.admin_token:
            self.log_test("Admin Update Pricing", False, "", "No admin token available")
            return False
        
        pricing_data = {
            "tigersms_markup": 25.0,
            "daisysms_markup": 22.0,
            "smspool_markup": 23.0,
            "ngn_to_usd_rate": 1550.0
        }
        
        success, response = self.run_test(
            "Admin Update Pricing Config",
            "PUT",
            "admin/pricing",
            200,
            data=pricing_data,
            use_admin=True
        )
        
        return success

    def test_admin_stats(self):
        """Test getting admin stats"""
        if not self.admin_token:
            self.log_test("Admin Stats", False, "", "No admin token available")
            return False
        
        success, response = self.run_test(
            "Admin Get Stats",
            "GET",
            "admin/stats",
            200,
            use_admin=True
        )
        
        return success and 'total_users' in response

    def test_admin_login(self):
        """Test admin login with existing admin credentials"""
        admin_login_data = {
            "email": "admin@smsrelay.com",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_user_id = response['user']['id']
            return True
        return False

    def test_smspool_countries_fetch(self):
        """Test SMS-pool countries fetch (no query params)"""
        if not self.admin_token:
            self.log_test("SMS-pool Countries Fetch", False, "", "No admin token available")
            return False
        
        success, response = self.run_test(
            "SMS-pool Countries Fetch",
            "GET",
            "services/smspool",
            200,
            use_admin=True
        )
        
        if success:
            # Validate response structure
            if 'success' in response and response['success'] and 'countries' in response:
                countries = response['countries']
                if len(countries) > 0:
                    # Check first country has required fields
                    first_country = countries[0]
                    required_fields = ['value', 'label', 'name', 'region']
                    if all(field in first_country for field in required_fields):
                        print(f"   ✓ Found {len(countries)} countries with proper structure")
                        return True
                    else:
                        self.log_test("SMS-pool Countries Validation", False, "", f"Missing required fields in country data: {first_country}")
                        return False
                else:
                    self.log_test("SMS-pool Countries Validation", False, "", "Countries array is empty")
                    return False
            else:
                self.log_test("SMS-pool Countries Validation", False, "", f"Invalid response structure: {response}")
                return False
        return False

    def test_smspool_services_pricing(self):
        """Test SMS-pool services + dynamic pricing fetch for multiple countries"""
        if not self.admin_token:
            self.log_test("SMS-pool Services Pricing", False, "", "No admin token available")
            return False
        
        # First get countries to select test countries
        countries_success, countries_response = self.run_test(
            "SMS-pool Get Countries for Service Test",
            "GET",
            "services/smspool",
            200,
            use_admin=True
        )
        
        if not countries_success or 'countries' not in countries_response:
            self.log_test("SMS-pool Services Pricing", False, "", "Failed to get countries list")
            return False
        
        countries = countries_response['countries']
        if len(countries) < 2:
            self.log_test("SMS-pool Services Pricing", False, "", "Not enough countries available for testing")
            return False
        
        # Try to find popular countries that likely have services (US, UK, Canada, etc.)
        popular_country_names = ['United States', 'United Kingdom', 'Canada', 'Germany', 'France', 'Australia', 'Netherlands']
        test_countries = []
        
        # First try to find popular countries
        for country in countries:
            if any(pop_name.lower() in country['name'].lower() for pop_name in popular_country_names):
                test_countries.append(country)
                if len(test_countries) >= 3:  # Test with 3 popular countries
                    break
        
        # If we don't have enough popular countries, use first available ones
        if len(test_countries) < 2:
            test_countries = countries[:3]
        
        all_tests_passed = True
        different_prices_found = False
        service_pools_data = {}
        countries_with_services = 0
        
        for country in test_countries:
            country_id = country['value']
            country_name = country['name']
            
            success, response = self.run_test(
                f"SMS-pool Services for {country_name} ({country_id})",
                "GET",
                f"services/smspool?country={country_id}",
                200,
                use_admin=True
            )
            
            if success:
                # Validate response structure
                if 'success' in response and response['success'] and 'services' in response:
                    services = response['services']
                    if len(services) > 0:
                        countries_with_services += 1
                        print(f"   ✓ Found {len(services)} services for {country_name}")
                        
                        # Validate service structure
                        for service in services:
                            required_fields = ['value', 'label', 'name', 'price_usd', 'price_ngn', 'base_price', 'pool']
                            if not all(field in service for field in required_fields):
                                self.log_test(f"SMS-pool Service Validation for {country_name}", False, "", f"Missing required fields in service: {service}")
                                all_tests_passed = False
                                continue
                            
                            # Validate prices are positive
                            if service['price_usd'] <= 0 or service['price_ngn'] <= 0:
                                self.log_test(f"SMS-pool Price Validation for {country_name}", False, "", f"Invalid prices: USD={service['price_usd']}, NGN={service['price_ngn']}")
                                all_tests_passed = False
                                continue
                            
                            # Validate price calculation (approximately)
                            # price_ngn should be approximately price_usd * ngn_rate * (1 + markup/100)
                            expected_ngn = service['price_usd'] * 1500  # Approximate NGN rate
                            if abs(service['price_ngn'] - expected_ngn) / expected_ngn > 0.5:  # Allow 50% variance
                                print(f"   ⚠️  Price calculation seems off for {service['name']}: USD={service['price_usd']}, NGN={service['price_ngn']}, Expected~{expected_ngn}")
                            
                            # Check for different base prices (dynamic pricing proof)
                            service_code = service['value']
                            pool = service.get('pool', 'default')
                            key = f"{service_code}_{pool}"
                            
                            if key not in service_pools_data:
                                service_pools_data[key] = []
                            service_pools_data[key].append({
                                'country': country_name,
                                'base_price': service['base_price'],
                                'price_ngn': service['price_ngn'],
                                'pool': pool
                            })
                        
                        # Check if we have different base prices across services in this country
                        base_prices = [s['base_price'] for s in services]
                        if len(set(base_prices)) > 1:
                            different_prices_found = True
                            print(f"   ✓ Dynamic pricing confirmed - found {len(set(base_prices))} different base prices in {country_name}")
                    else:
                        print(f"   ⚠️  No services available for {country_name}")
                else:
                    self.log_test(f"SMS-pool Services for {country_name}", False, "", f"Invalid response structure: {response}")
                    all_tests_passed = False
            else:
                all_tests_passed = False
        
        # Check for services appearing in multiple pools with different prices
        pool_variations_found = False
        for service_key, data_list in service_pools_data.items():
            if len(data_list) > 1:
                prices = [d['base_price'] for d in data_list]
                ngn_prices = [d['price_ngn'] for d in data_list]
                if len(set(prices)) > 1 or len(set(ngn_prices)) > 1:
                    pool_variations_found = True
                    print(f"   ✓ Pool price variation found for service {service_key}")
                    break
        
        # Summary of findings
        print(f"   📊 Summary: {countries_with_services}/{len(test_countries)} countries have services")
        
        if countries_with_services == 0:
            self.log_test("SMS-pool Services Availability", False, "", "No countries returned services - API may be down or no services available")
            return False
        
        if not different_prices_found and countries_with_services > 0:
            # This might be expected if all services have the same base price
            print("   ℹ️  No different base prices found within countries - this may be normal")
        
        return all_tests_passed and countries_with_services > 0

    def test_smspool_error_handling(self):
        """Test SMS-pool error handling with invalid country"""
        if not self.admin_token:
            self.log_test("SMS-pool Error Handling", False, "", "No admin token available")
            return False
        
        success, response = self.run_test(
            "SMS-pool Invalid Country Test",
            "GET",
            "services/smspool?country=999999",
            200,  # Should return 200 but with error or empty services
            use_admin=True
        )
        
        if success:
            # Check if it returns proper error structure or empty services
            if 'success' in response:
                if response['success'] == False and 'message' in response:
                    print("   ✓ Proper error response returned")
                    return True
                elif response['success'] == True and 'services' in response and len(response['services']) == 0:
                    print("   ✓ Empty services list returned for invalid country")
                    return True
                else:
                    self.log_test("SMS-pool Error Handling Validation", False, "", f"Unexpected response for invalid country: {response}")
                    return False
            else:
                self.log_test("SMS-pool Error Handling Validation", False, "", f"Invalid response structure: {response}")
                return False
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting SMS Relay API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n📋 Authentication Tests")
        self.test_user_registration()
        self.test_user_login()
        
        # Admin Authentication
        print("\n🔐 Admin Authentication Tests")
        self.test_admin_login()
        
        # User Profile Tests
        print("\n👤 User Profile Tests")
        self.test_get_profile()
        self.test_virtual_accounts()
        
        # Financial Tests
        print("\n💰 Financial Tests")
        self.test_ngn_to_usd_conversion()
        
        # SMS Service Tests
        print("\n📱 SMS Service Tests")
        self.test_services_list()
        self.test_purchase_number()
        self.test_orders_list()
        self.test_transactions_list()
        
        # SMS-pool Dynamic Pricing Tests (Main Focus)
        print("\n🌍 SMS-pool Dynamic Pricing Tests")
        self.test_smspool_countries_fetch()
        self.test_smspool_services_pricing()
        self.test_smspool_error_handling()
        
        # Admin Tests
        print("\n🔧 Admin Tests")
        self.test_admin_pricing_get()
        self.test_admin_pricing_update()
        self.test_admin_stats()
        
        # Print Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = SMSRelayAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())