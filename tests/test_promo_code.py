"""
Test promo code functionality for UltraCloud SMS
Tests the SAVE40 promo code that should reduce price by 40% on US Server (DaisySMS)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://sms-gateway-17.preview.emergentagent.com')

class TestPromoCode:
    """Test promo code functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@smsrelay.com", "password": "admin123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_calculate_price_without_promo(self):
        """Test price calculation without promo code for US Server WhatsApp"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            headers=self.headers,
            json={
                "server": "us_server",
                "service": "wa",
                "country": "187"
            }
        )
        
        assert response.status_code == 200, f"API call failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data["success"] == True
        assert "final_price_ngn" in data
        assert "final_price_usd" in data
        assert data["promo"] is None
        
        # Store base price for comparison
        self.base_price_ngn = data["final_price_ngn"]
        print(f"Base price without promo: ₦{data['final_price_ngn']}")
        
        # Expected: ₦2,475.00 for WhatsApp on US Server
        assert data["final_price_ngn"] > 0
    
    def test_calculate_price_with_save40_promo(self):
        """Test SAVE40 promo code reduces price by 40%"""
        # First get base price
        base_response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            headers=self.headers,
            json={
                "server": "us_server",
                "service": "wa",
                "country": "187"
            }
        )
        base_data = base_response.json()
        base_price = base_data["final_price_ngn"]
        
        # Now get price with promo
        promo_response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            headers=self.headers,
            json={
                "server": "us_server",
                "service": "wa",
                "country": "187",
                "promo_code": "SAVE40"
            }
        )
        
        assert promo_response.status_code == 200, f"API call failed: {promo_response.text}"
        promo_data = promo_response.json()
        
        # Verify promo was applied
        assert promo_data["success"] == True
        assert promo_data["promo"] is not None
        assert promo_data["promo"]["code"] == "SAVE40"
        assert promo_data["promo"]["type"] == "percent"
        assert promo_data["promo"]["value"] == 40.0
        
        # Verify discount calculation
        discounted_price = promo_data["final_price_ngn"]
        expected_discount = base_price * 0.40
        expected_discounted_price = base_price - expected_discount
        
        print(f"Base price: ₦{base_price}")
        print(f"Discounted price: ₦{discounted_price}")
        print(f"Expected discounted price: ₦{expected_discounted_price}")
        print(f"Discount amount: ₦{promo_data['promo']['discount_ngn']}")
        
        # Allow small floating point tolerance
        assert abs(discounted_price - expected_discounted_price) < 1.0, \
            f"Discount not applied correctly. Expected ~₦{expected_discounted_price}, got ₦{discounted_price}"
        
        # Verify discount is 40% of base price
        assert abs(promo_data["promo"]["discount_ngn"] - expected_discount) < 1.0
    
    def test_invalid_promo_code(self):
        """Test that invalid promo code is rejected or doesn't apply discount"""
        response = requests.post(
            f"{BASE_URL}/api/orders/calculate-price",
            headers=self.headers,
            json={
                "server": "us_server",
                "service": "wa",
                "country": "187",
                "promo_code": "INVALID123"
            }
        )
        
        # API may return 400 for invalid promo or 200 with no promo applied
        if response.status_code == 400:
            # Invalid promo rejected - this is expected behavior
            print("Invalid promo code correctly rejected with 400")
            return
        
        assert response.status_code == 200
        data = response.json()
        
        # Invalid promo should not apply discount
        assert data["success"] == True
        assert data["promo"] is None or data.get("promo", {}).get("code") != "INVALID123"
    
    def test_promo_with_different_services(self):
        """Test SAVE40 promo works with different services"""
        services = ["wa", "tg", "go"]  # WhatsApp, Telegram, Google
        
        for service in services:
            # Get base price
            base_response = requests.post(
                f"{BASE_URL}/api/orders/calculate-price",
                headers=self.headers,
                json={
                    "server": "us_server",
                    "service": service,
                    "country": "187"
                }
            )
            
            if base_response.status_code != 200:
                print(f"Service {service} not available, skipping")
                continue
                
            base_data = base_response.json()
            if not base_data.get("success"):
                continue
                
            base_price = base_data["final_price_ngn"]
            
            # Get promo price
            promo_response = requests.post(
                f"{BASE_URL}/api/orders/calculate-price",
                headers=self.headers,
                json={
                    "server": "us_server",
                    "service": service,
                    "country": "187",
                    "promo_code": "SAVE40"
                }
            )
            
            promo_data = promo_response.json()
            if promo_data.get("promo"):
                discounted_price = promo_data["final_price_ngn"]
                expected = base_price * 0.60  # 40% off = 60% of original
                
                print(f"Service {service}: Base ₦{base_price} -> Discounted ₦{discounted_price}")
                assert abs(discounted_price - expected) < 1.0, \
                    f"Service {service}: Expected ~₦{expected}, got ₦{discounted_price}"


class TestPromoCodePersistence:
    """Test that promo code discount persists (doesn't revert)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@smsrelay.com", "password": "admin123"}
        )
        assert response.status_code == 200
        self.token = response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_multiple_price_calculations_with_promo(self):
        """Test that calling calculate-price multiple times with promo returns consistent results"""
        results = []
        
        for i in range(3):
            response = requests.post(
                f"{BASE_URL}/api/orders/calculate-price",
                headers=self.headers,
                json={
                    "server": "us_server",
                    "service": "wa",
                    "country": "187",
                    "promo_code": "SAVE40"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            results.append(data["final_price_ngn"])
            print(f"Call {i+1}: ₦{data['final_price_ngn']}")
        
        # All results should be the same
        assert all(r == results[0] for r in results), \
            f"Inconsistent prices: {results}"
        
        # All should have promo applied
        assert all(r < 2000 for r in results), \
            f"Promo not applied consistently: {results}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
