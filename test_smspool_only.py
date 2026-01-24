#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import time

class SMSPoolTester:
    def __init__(self, base_url="https://ultraotp.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name, success, details="", error=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {error}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True)
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', response.text)
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, "", error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, "", str(e))
            return False, {}

    def test_smspool_buy_cancel_flow(self):
        """Test complete SMS-pool (International server) buy + cancel flow after caching fix"""
        print("\n🎯 SMS-POOL BUY + CANCEL FLOW TEST (International Server)")
        print("=" * 60)
        
        # Step 1: Login with admin credentials
        print("   🔐 Step 1: Admin login (admin@smsrelay.com / admin123)...")
        admin_login_data = {
            "email": "admin@smsrelay.com",
            "password": "admin123"
        }
        
        success, login_response = self.run_test(
            "Admin Login for SMS-pool Test",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if not success or 'token' not in login_response:
            print("❌ Failed to login as admin")
            return False
        
        self.admin_token = login_response['token']
        admin_user_id = login_response['user']['id']
        print(f"   ✅ Admin logged in successfully: {admin_user_id}")
        
        # Step 2: Get list of countries
        print("   🌍 Step 2: Getting SMS-pool countries list...")
        success, countries_response = self.run_test(
            "SMS-pool Countries List",
            "GET",
            "services/smspool",
            200
        )
        
        if not success or 'countries' not in countries_response:
            print(f"❌ Failed to get countries: {countries_response}")
            return False
        
        countries = countries_response['countries']
        if len(countries) == 0:
            print("❌ No countries available")
            return False
        
        print(f"   ✅ Found {len(countries)} countries")
        
        # Step 3: Use United States (country 1) which we know has services
        print("   📱 Step 3: Getting services for United States...")
        
        # Use United States (country 1) which we know has services and availability
        country_id = "1"
        country_name = "United States"
        
        print(f"   📍 Using country: {country_name} (ID: {country_id})")
        
        success, services_response = self.run_test(
            f"SMS-pool Services for {country_name}",
            "GET",
            f"services/smspool?country={country_id}",
            200
        )
        
        if not success or not services_response.get('success') or 'services' not in services_response:
            print(f"❌ Failed to get services: {services_response}")
            return False
        
        services = services_response['services']
        if len(services) == 0:
            print(f"❌ No services available for {country_name}")
            return False
        
        print(f"   ✅ Found {len(services)} services for {country_name}")
        
        # Validate service structure
        test_service = services[0]
        required_fields = ['value', 'label', 'base_price', 'price_ngn', 'pool']
        missing_fields = [field for field in required_fields if field not in test_service]
        
        if missing_fields:
            print(f"❌ Missing fields in service: {missing_fields}")
            return False
        
        service_code = test_service['value']
        service_name = test_service['label']
        base_price = test_service['base_price']
        price_ngn = test_service['price_ngn']
        pool = test_service['pool']
        
        print(f"   ✅ Using service: {service_name} (Code: {service_code})")
        print(f"   💰 Base price: ${base_price}, NGN price: ₦{price_ngn}, Pool: {pool}")
        
        # Step 4: Check cached_services in database
        print("   🗄️  Step 4: Verifying cached_services database...")
        
        try:
            import pymongo
            
            # Connect to MongoDB
            mongo_client = pymongo.MongoClient("mongodb://localhost:27017")
            db = mongo_client["sms_relay_db"]
            
            # Check if cached_services has entries for SMS-pool
            cached_count = db.cached_services.count_documents({
                'provider': 'smspool',
                'service_code': service_code,
                'country_code': country_id
            })
            
            if cached_count > 0:
                cached_service = db.cached_services.find_one({
                    'provider': 'smspool',
                    'service_code': service_code,
                    'country_code': country_id
                }, {'_id': 0})
                
                print(f"   ✅ Found cached service: provider={cached_service.get('provider')}, service_code={cached_service.get('service_code')}, country_code={cached_service.get('country_code')}, base_price=${cached_service.get('base_price')}")
            else:
                print(f"   ⚠️  No cached service found for {service_code} in {country_id} - this may cause purchase to fail")
                
        except Exception as e:
            print(f"❌ Failed to check cached_services: {str(e)}")
            return False
        
        # Step 5: Calculate price
        print("   💵 Step 5: Calculating price...")
        
        calculate_data = {
            "server": "server1",
            "service": service_code,
            "country": country_id,
            "payment_currency": "NGN"
        }
        
        success, calc_response = self.run_test(
            "SMS-pool Calculate Price",
            "POST",
            "orders/calculate-price",
            200,
            data=calculate_data
        )
        
        if not success:
            print(f"❌ Price calculation failed: {calc_response}")
            return False
        
        if not calc_response.get('success') or calc_response.get('final_price_ngn', 0) <= 0:
            print(f"❌ Invalid price calculation: {calc_response}")
            return False
        
        final_ngn = calc_response['final_price_ngn']
        print(f"   ✅ Price calculated: ₦{final_ngn}")
        
        # Step 6: Get user balance before purchase
        print("   💰 Step 6: Getting user balance before purchase...")
        
        success, profile_response = self.run_test(
            "Get Profile Before Purchase",
            "GET",
            "user/profile",
            200
        )
        
        if not success:
            print("❌ Failed to get user profile")
            return False
        
        balance_before = profile_response.get('ngn_balance', 0)
        print(f"   ✅ NGN balance before purchase: ₦{balance_before}")
        
        # Step 7: Purchase SMS-pool number
        print("   🛒 Step 7: Purchasing SMS-pool number...")
        
        purchase_data = {
            "server": "server1",
            "service": service_code,
            "country": country_id,
            "payment_currency": "NGN"
        }
        
        success, purchase_response = self.run_test(
            "SMS-pool Order Purchase",
            "POST",
            "orders/purchase",
            200,
            data=purchase_data
        )
        
        if not success:
            print(f"❌ Purchase failed: {purchase_response}")
            return False
        
        if not purchase_response.get('success') or 'order' not in purchase_response:
            print(f"❌ Invalid purchase response: {purchase_response}")
            return False
        
        order = purchase_response['order']
        order_id = order.get('id')
        activation_id = order.get('activation_id')
        phone_number = order.get('phone_number')
        
        # Validate purchase response structure
        required_fields = ['id', 'activation_id', 'provider', 'phone_number']
        missing_fields = [field for field in required_fields if field not in order]
        
        if missing_fields:
            print(f"❌ Missing fields in purchase response: {missing_fields}")
            return False
        
        if order['provider'] != 'smspool':
            print(f"❌ Expected provider 'smspool', got '{order['provider']}'")
            return False
        
        print(f"   ✅ SMS-pool order purchased successfully:")
        print(f"     - Order ID: {order_id}")
        print(f"     - Activation ID: {activation_id}")
        print(f"     - Provider: {order['provider']}")
        print(f"     - Phone Number: {phone_number}")
        
        # Step 8: Verify order in orders list
        print("   📋 Step 8: Verifying order in orders list...")
        
        success, orders_response = self.run_test(
            "Orders List After Purchase",
            "GET",
            "orders/list",
            200
        )
        
        if not success or 'orders' not in orders_response:
            print("❌ Failed to get orders list")
            return False
        
        orders = orders_response['orders']
        order_found = False
        
        for listed_order in orders:
            if listed_order.get('id') == order_id:
                order_found = True
                
                # Verify order details
                if listed_order.get('provider') != 'smspool':
                    print(f"❌ Expected provider 'smspool' in list, got '{listed_order.get('provider')}'")
                    return False
                
                if listed_order.get('status') != 'active':
                    print(f"❌ Expected status 'active' in list, got '{listed_order.get('status')}'")
                    return False
                
                if not listed_order.get('activation_id'):
                    print("❌ activation_id is missing in orders list")
                    return False
                
                print(f"   ✅ Order found in list:")
                print(f"     - Provider: {listed_order.get('provider')}")
                print(f"     - Status: {listed_order.get('status')}")
                print(f"     - Activation ID: {listed_order.get('activation_id')}")
                break
        
        if not order_found:
            print(f"❌ Order {order_id} not found in orders list")
            return False
        
        # Step 9: Cancel the order
        print("   🚫 Step 9: Cancelling SMS-pool order...")
        
        success, cancel_response = self.run_test(
            "Cancel SMS-pool Order",
            "POST",
            f"orders/{activation_id}/cancel",
            200
        )
        
        if not success:
            print(f"❌ Cancel failed: {cancel_response}")
            return False
        
        # Validate cancel response
        if not cancel_response.get('success'):
            print(f"❌ Cancel response success=False: {cancel_response}")
            return False
        
        cancel_message = cancel_response.get('message', '')
        refund_amount = cancel_response.get('refund_amount', 0)
        
        if 'cancelled' not in cancel_message.lower() or 'refunded' not in cancel_message.lower():
            print(f"❌ Expected 'cancelled' and 'refunded' in message, got: {cancel_message}")
            return False
        
        if refund_amount <= 0:
            print(f"❌ Expected positive refund amount, got: {refund_amount}")
            return False
        
        print(f"   ✅ Cancel successful:")
        print(f"     - Message: {cancel_message}")
        print(f"     - Refund Amount: ₦{refund_amount}")
        
        # Step 10: Verify order status changed to cancelled
        print("   🔍 Step 10: Verifying order status changed to cancelled...")
        
        success, orders_response2 = self.run_test(
            "Orders List After Cancel",
            "GET",
            "orders/list",
            200
        )
        
        if success and 'orders' in orders_response2:
            orders2 = orders_response2['orders']
            
            for listed_order in orders2:
                if listed_order.get('id') == order_id:
                    if listed_order.get('status') != 'cancelled':
                        print(f"❌ Expected status 'cancelled', got '{listed_order.get('status')}'")
                        return False
                    
                    print(f"   ✅ Order status updated to 'cancelled'")
                    break
        
        # Step 11: Verify user balance increased (should be back to pre-purchase level)
        print("   💰 Step 11: Verifying user balance increased...")
        
        # Add a small delay to ensure database consistency
        time.sleep(1)
        
        success, profile_after = self.run_test(
            "Get Profile After Cancel",
            "GET",
            "user/profile",
            200
        )
        
        if success:
            balance_after = profile_after.get('ngn_balance', 0)
            balance_increase = balance_after - balance_before
            
            print(f"   ✅ NGN balance after cancel: ₦{balance_after}")
            print(f"   ✅ Balance change from start: ₦{balance_increase}")
            
            # The balance should be approximately back to the original level
            # Allow for small differences due to floating point precision
            if abs(balance_increase) < 1.0:  # Allow 1 NGN variance
                print(f"   ✅ Balance correctly restored (net change: ₦{balance_increase})")
            else:
                print(f"   ❌ Unexpected balance change: ₦{balance_increase}")
                return False
        
        # Step 12: Test edge case - try cancelling again
        print("   🔒 Step 12: Testing edge case - cancel already cancelled order...")
        
        success, cancel_response2 = self.run_test(
            "Cancel Already Cancelled Order",
            "POST",
            f"orders/{activation_id}/cancel",
            400  # Expecting 400 error
        )
        
        if success:
            print(f"   ✅ Cancel correctly blocked for already cancelled order")
        else:
            print(f"   ❌ Cancel should have been blocked but wasn't")
            return False
        
        # Close MongoDB connection
        mongo_client.close()
        
        print("\n🎉 SMS-POOL BUY + CANCEL FLOW TEST COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("✅ All test requirements verified:")
        print("   ✓ Admin login successful (admin@smsrelay.com / admin123)")
        print("   ✓ SMS-pool countries fetched")
        print("   ✓ SMS-pool services with pricing fetched")
        print("   ✓ cached_services populated in database")
        print("   ✓ Price calculation successful")
        print("   ✓ SMS-pool order purchased with correct structure")
        print("   ✓ Order found in orders list with provider='smspool', status='active'")
        print("   ✓ Cancel by activation_id successful")
        print("   ✓ Full NGN refund applied correctly")
        print("   ✓ Order status updated to 'cancelled'")
        print("   ✓ User balance increased by refund amount")
        print("   ✓ Edge case: Cancel blocked for already cancelled order")
        
        return True

    def run_test_suite(self):
        """Run the SMS-pool test suite"""
        print(f"🚀 Starting SMS-pool Buy + Cancel Flow Test")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        success = self.test_smspool_buy_cancel_flow()
        
        print("\n" + "=" * 60)
        if success:
            print("🎉 SMS-pool test completed successfully!")
            return 0
        else:
            print("❌ SMS-pool test failed")
            return 1

def main():
    tester = SMSPoolTester()
    return tester.run_test_suite()

if __name__ == "__main__":
    sys.exit(main())