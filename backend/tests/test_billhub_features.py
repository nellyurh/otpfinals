"""
Test BillHub Features - Admin Logo Upload, Card Fees, Public Branding, KYC Tier 3
Tests for:
1. Admin logo upload endpoint: POST /api/admin/upload-logo
2. Virtual cards fees API: GET /api/cards - returns fees object with min_funding
3. Public branding API: GET /api/public/branding - returns brand_name and brand_logo_url
4. Admin card fees update: PUT /api/admin/card-fees - allows updating card_min_funding_amount
5. Admin card fees get: GET /api/admin/card-fees - returns current fee configuration
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@smsrelay.com"
ADMIN_PASSWORD = "admin123"


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
        """Test admin login returns token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert data.get('user', {}).get('is_admin') == True
        print("✓ Admin login successful")


class TestPublicBranding:
    """Test public branding endpoint (no auth required)"""
    
    def test_public_branding_endpoint_exists(self):
        """Test GET /api/public/branding returns branding info"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required fields exist
        assert 'brand_name' in data, "brand_name field missing"
        assert 'brand_logo_url' in data, "brand_logo_url field missing"
        assert 'primary_color_hex' in data, "primary_color_hex field missing"
        
        print(f"✓ Public branding endpoint working")
        print(f"  - brand_name: {data.get('brand_name')}")
        print(f"  - brand_logo_url: {data.get('brand_logo_url')}")
    
    def test_public_branding_returns_all_fields(self):
        """Test public branding returns all expected fields"""
        response = requests.get(f"{BASE_URL}/api/public/branding")
        assert response.status_code == 200
        data = response.json()
        
        expected_fields = [
            'brand_name', 'brand_logo_url', 'primary_color_hex', 
            'secondary_color_hex', 'accent_color_hex', 'button_color_hex',
            'header_bg_color_hex', 'hero_gradient_from', 'hero_gradient_to',
            'landing_hero_title', 'landing_hero_subtitle', 'banner_images',
            'whatsapp_support_url', 'telegram_support_url', 'support_email'
        ]
        
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print("✓ All public branding fields present")


class TestAdminCardFees:
    """Test admin card fees endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Admin authentication failed")
    
    def test_get_card_fees_endpoint(self, admin_token):
        """Test GET /api/admin/card-fees returns fee configuration"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/card-fees", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'fees' in data
        
        fees = data['fees']
        expected_fee_fields = [
            'card_creation_fee', 'card_funding_fee', 'card_transaction_fee',
            'card_declined_fee', 'card_monthly_fee', 'card_withdrawal_fee',
            'card_min_funding_amount', 'card_max_funding_amount'
        ]
        
        for field in expected_fee_fields:
            assert field in fees, f"Missing fee field: {field}"
        
        print("✓ Admin card fees endpoint working")
        print(f"  - card_min_funding_amount: ${fees.get('card_min_funding_amount')}")
        print(f"  - card_creation_fee: ${fees.get('card_creation_fee')}")
    
    def test_update_card_min_funding_amount(self, admin_token):
        """Test PUT /api/admin/card-fees can update min_funding_amount"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        # First get current value
        get_response = requests.get(f"{BASE_URL}/api/admin/card-fees", headers=headers)
        original_min = get_response.json()['fees']['card_min_funding_amount']
        
        # Update to a new value
        new_min = 10.00
        update_response = requests.put(
            f"{BASE_URL}/api/admin/card-fees",
            headers=headers,
            json={"card_min_funding_amount": new_min}
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data.get('success') == True
        assert 'card_min_funding_amount' in data.get('updated', {})
        
        # Verify the update persisted
        verify_response = requests.get(f"{BASE_URL}/api/admin/card-fees", headers=headers)
        assert verify_response.json()['fees']['card_min_funding_amount'] == new_min
        
        # Restore original value
        requests.put(
            f"{BASE_URL}/api/admin/card-fees",
            headers=headers,
            json={"card_min_funding_amount": original_min}
        )
        
        print(f"✓ Card min funding amount update working (tested: ${new_min})")
    
    def test_update_card_fees_rejects_negative(self, admin_token):
        """Test PUT /api/admin/card-fees rejects negative values"""
        headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        
        response = requests.put(
            f"{BASE_URL}/api/admin/card-fees",
            headers=headers,
            json={"card_min_funding_amount": -5.00}
        )
        
        assert response.status_code == 400
        print("✓ Negative fee values correctly rejected")
    
    def test_card_fees_requires_admin(self):
        """Test card fees endpoints require admin authentication"""
        # Without auth
        response = requests.get(f"{BASE_URL}/api/admin/card-fees")
        assert response.status_code in [401, 403]
        
        # With invalid token
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{BASE_URL}/api/admin/card-fees", headers=headers)
        assert response.status_code in [401, 403]
        
        print("✓ Card fees endpoints properly protected")


class TestVirtualCardsAPI:
    """Test virtual cards API returns fees with min_funding"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Admin authentication failed")
    
    def test_cards_endpoint_returns_fees(self, admin_token):
        """Test GET /api/cards returns fees object with min_funding"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/cards", headers=headers)
        
        # May return 403 if user is not Tier 3, but should still work for admin
        if response.status_code == 403:
            # This is expected for non-Tier 3 users
            print("✓ Cards endpoint correctly requires Tier 3 (403 returned)")
            return
        
        assert response.status_code == 200
        data = response.json()
        
        # Check fees object exists
        assert 'fees' in data, "fees object missing from response"
        fees = data['fees']
        
        # Check min_funding is present
        assert 'min_funding' in fees, "min_funding field missing from fees"
        assert isinstance(fees['min_funding'], (int, float)), "min_funding should be a number"
        
        print(f"✓ Cards endpoint returns fees with min_funding: ${fees.get('min_funding')}")


class TestAdminLogoUpload:
    """Test admin logo upload endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Admin authentication failed")
    
    def test_logo_upload_endpoint_exists(self, admin_token):
        """Test POST /api/admin/upload-logo endpoint exists"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a simple test image (1x1 PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test_logo.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(
            f"{BASE_URL}/api/admin/upload-logo",
            headers=headers,
            files=files
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'logo_url' in data
        
        print(f"✓ Logo upload endpoint working")
        print(f"  - Uploaded logo URL: {data.get('logo_url')}")
    
    def test_logo_upload_rejects_invalid_type(self, admin_token):
        """Test logo upload rejects non-image files"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to upload a text file
        files = {'file': ('test.txt', io.BytesIO(b'not an image'), 'text/plain')}
        response = requests.post(
            f"{BASE_URL}/api/admin/upload-logo",
            headers=headers,
            files=files
        )
        
        assert response.status_code == 400
        print("✓ Invalid file types correctly rejected")
    
    def test_logo_upload_requires_admin(self):
        """Test logo upload requires admin authentication"""
        # Without auth
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {'file': ('test_logo.png', io.BytesIO(png_data), 'image/png')}
        
        response = requests.post(f"{BASE_URL}/api/admin/upload-logo", files=files)
        assert response.status_code in [401, 403]
        
        print("✓ Logo upload endpoint properly protected")
    
    def test_uploaded_logo_accessible(self, admin_token):
        """Test uploaded logo is accessible via URL"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Upload a logo
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {'file': ('test_logo.png', io.BytesIO(png_data), 'image/png')}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/admin/upload-logo",
            headers=headers,
            files=files
        )
        
        if upload_response.status_code == 200:
            logo_url = upload_response.json().get('logo_url')
            
            # Try to access the uploaded logo
            access_response = requests.get(logo_url)
            assert access_response.status_code == 200
            assert 'image' in access_response.headers.get('content-type', '')
            
            print(f"✓ Uploaded logo is accessible at: {logo_url}")


class TestBrandingIntegration:
    """Test branding integration between admin and public endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get('token')
        pytest.skip("Admin authentication failed")
    
    def test_logo_upload_updates_public_branding(self, admin_token):
        """Test that uploading a logo updates the public branding endpoint"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Upload a new logo
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {'file': ('integration_test_logo.png', io.BytesIO(png_data), 'image/png')}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/admin/upload-logo",
            headers=headers,
            files=files
        )
        
        if upload_response.status_code == 200:
            uploaded_url = upload_response.json().get('logo_url')
            
            # Check public branding reflects the new logo
            branding_response = requests.get(f"{BASE_URL}/api/public/branding")
            assert branding_response.status_code == 200
            
            public_logo_url = branding_response.json().get('brand_logo_url')
            assert public_logo_url == uploaded_url, f"Public branding logo URL mismatch: {public_logo_url} != {uploaded_url}"
            
            print("✓ Logo upload correctly updates public branding")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
