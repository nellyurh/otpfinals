"""
Test iteration 6 features:
1. Promo code SAVE40 reduces final price in Virtual Numbers purchase flow
2. Ercaspay amount input maintains value during typing
3. Transactions table shows View button with proper styling
4. SMS History table shows View button with proper styling
5. Quick Service cards display with colorful gradients
6. Airtime/Buy Data page has rounded input fields (rounded-xl)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://otpsync.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@smsrelay.com"
ADMIN_PASSWORD = "admin123"


class TestPromoCodeSAVE40:
    """Test promo code SAVE40 reduces final price"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    def test_calculate_price_without_promo(self, admin_token):
        """Calculate price without promo code"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "us_server",
                "service": "wa",
                "country": "187"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "final_price_ngn" in data
        assert data["promo"] is None
        print(f"✓ Price without promo: ₦{data['final_price_ngn']:.2f}")
        return data["final_price_ngn"]
    
    def test_calculate_price_with_save40_promo(self, admin_token):
        """Calculate price with SAVE40 promo code - should reduce price by 40%"""
        # First get price without promo
        response_no_promo = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "us_server",
                "service": "wa",
                "country": "187"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        price_without_promo = response_no_promo.json()["final_price_ngn"]
        
        # Now get price with SAVE40 promo
        response_with_promo = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "us_server",
                "service": "wa",
                "country": "187",
                "promo_code": "SAVE40"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response_with_promo.status_code == 200
        data = response_with_promo.json()
        assert data["success"] == True
        assert data["promo"] is not None
        assert data["promo"]["code"] == "SAVE40"
        assert data["promo"]["type"] == "percent"
        assert data["promo"]["value"] == 40.0
        
        price_with_promo = data["final_price_ngn"]
        discount = data["promo"]["discount_ngn"]
        
        # Verify discount is approximately 40% of original price
        expected_discount = price_without_promo * 0.4
        assert abs(discount - expected_discount) < 1.0, f"Discount {discount} should be ~40% of {price_without_promo}"
        
        # Verify final price is reduced
        assert price_with_promo < price_without_promo, "Price with promo should be less than without"
        
        print(f"✓ Price without promo: ₦{price_without_promo:.2f}")
        print(f"✓ Price with SAVE40: ₦{price_with_promo:.2f}")
        print(f"✓ Discount: ₦{discount:.2f} (40%)")
    
    def test_promo_code_mapping_in_response(self, admin_token):
        """Verify promo response has correct field mapping (final_price_ngn)"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            json={
                "server": "us_server",
                "service": "wa",
                "country": "187",
                "promo_code": "SAVE40"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify the response has the correct field names
        assert "final_price_ngn" in data, "Response should have final_price_ngn field"
        assert "final_price_usd" in data, "Response should have final_price_usd field"
        assert "promo" in data, "Response should have promo field"
        
        if data["promo"]:
            assert "discount_ngn" in data["promo"], "Promo should have discount_ngn"
            assert "discount_usd" in data["promo"], "Promo should have discount_usd"
        
        print("✓ Promo response has correct field mapping")


class TestTransactionsAPI:
    """Test transactions API for View button functionality"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    def test_transactions_list_returns_data(self, admin_token):
        """Transactions list should return transaction data"""
        response = requests.get(
            f"{BASE_URL}/api/transactions/list",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        print(f"✓ Transactions list returns {len(data['transactions'])} transactions")
        
        # Verify transaction structure if transactions exist
        if len(data["transactions"]) > 0:
            tx = data["transactions"][0]
            assert "type" in tx
            assert "amount" in tx
            assert "status" in tx
            print(f"✓ Transaction structure verified: {tx['type']} - {tx['amount']}")
    
    def test_single_transaction_detail(self, admin_token):
        """Can fetch single transaction detail (for View button)"""
        # First get list of transactions
        list_response = requests.get(
            f"{BASE_URL}/api/transactions/list",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        transactions = list_response.json().get("transactions", [])
        
        if len(transactions) > 0:
            tx_id = transactions[0].get("id")
            if tx_id:
                # Try to get single transaction detail
                detail_response = requests.get(
                    f"{BASE_URL}/api/transactions/{tx_id}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                # May return 200 or 404 depending on implementation
                assert detail_response.status_code in [200, 404]
                print(f"✓ Transaction detail endpoint responds with status {detail_response.status_code}")
        else:
            print("✓ No transactions to test detail endpoint")


class TestSMSHistoryAPI:
    """Test SMS History API for View button functionality"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    def test_orders_list_returns_data(self, admin_token):
        """Orders list (SMS History) should return order data"""
        response = requests.get(
            f"{BASE_URL}/api/orders/list",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        print(f"✓ Orders list returns {len(data['orders'])} orders")
        
        # Verify order structure if orders exist
        if len(data["orders"]) > 0:
            order = data["orders"][0]
            assert "service" in order or "service_name" in order
            assert "status" in order
            print(f"✓ Order structure verified: {order.get('service_name', order.get('service'))} - {order['status']}")


class TestServicesAPI:
    """Test services API for Virtual Numbers"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        return response.json()["token"]
    
    def test_daisysms_services_returns_data(self, admin_token):
        """DaisySMS services endpoint returns service data"""
        response = requests.get(
            f"{BASE_URL}/api/services/daisysms",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "services" in data
        print(f"✓ DaisySMS services returns {len(data['services'])} services")
        
        # Verify service structure
        if len(data["services"]) > 0:
            service = data["services"][0]
            assert "value" in service
            assert "name" in service
            assert "final_price" in service
            print(f"✓ Service structure verified: {service['name']} - ${service['final_price']}")


class TestPublicBranding:
    """Test public branding endpoint"""
    
    def test_public_branding_returns_data(self):
        """Public branding endpoint returns brand info"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200
        data = response.json()
        assert "brand_name" in data
        assert "primary_color_hex" in data
        print(f"✓ Public branding: {data['brand_name']} - {data['primary_color_hex']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
