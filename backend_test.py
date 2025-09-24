#!/usr/bin/env python3
"""
Backend API Testing for ProjectHub PMO Application
Testing authentication and basic API endpoints
"""

import requests
import sys
from datetime import datetime
import json

class ProjectHubAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
            
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"📍 URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                if 'multipart/form-data' in test_headers.get('Content-Type', ''):
                    response = self.session.post(url, data=data, headers={k:v for k,v in test_headers.items() if k != 'Content-Type'})
                else:
                    response = self.session.post(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"📄 Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"📄 Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"📄 Response: {response.text[:200]}...")

            return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health endpoint"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_demo_users(self):
        """Test demo users endpoint"""
        success, response = self.run_test(
            "Demo Users Endpoint",
            "GET", 
            "api/auth/demo-users",
            200
        )
        return success, response

    def test_login(self, email, password):
        """Test login with form data"""
        print(f"🔑 Attempting login with: {email}")
        
        # Prepare form data as the frontend does
        form_data = {
            'username': email,
            'password': password
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data=form_data,
            headers={'Content-Type': 'multipart/form-data'}
        )
        
        if success and isinstance(response, dict) and 'access_token' in response:
            self.token = response['access_token']
            print(f"✅ Login successful, token received")
            return True, response.get('user', {})
        return False, {}

    def test_auth_me(self):
        """Test authenticated user info endpoint"""
        if not self.token:
            print("❌ No token available for auth test")
            return False
            
        success, response = self.run_test(
            "Get Current User Info",
            "GET",
            "api/auth/me", 
            200
        )
        return success

def main():
    print("🚀 Starting ProjectHub PMO Backend API Tests")
    print("=" * 50)
    
    # Setup
    tester = ProjectHubAPITester()
    
    # Test 1: Health Check
    if not tester.test_health_check():
        print("❌ Health check failed, stopping tests")
        return 1

    # Test 2: Demo Users
    demo_success, demo_users = tester.test_demo_users()
    if not demo_success:
        print("❌ Demo users endpoint failed")
        return 1
    
    # Find project manager demo user
    pm_user = None
    if isinstance(demo_users, dict) and 'demo_users' in demo_users:
        for user in demo_users['demo_users']:
            if user.get('role') == 'Project Manager':
                pm_user = user
                break
    
    if not pm_user:
        print("❌ Project Manager demo user not found")
        return 1
    
    print(f"✅ Found Project Manager demo user: {pm_user['email']}")

    # Test 3: Login
    login_success, user_data = tester.test_login(pm_user['email'], pm_user['password'])
    if not login_success:
        print("❌ Login failed, stopping tests")
        return 1

    # Test 4: Authenticated endpoint
    if not tester.test_auth_me():
        print("❌ Auth me endpoint failed")
        return 1

    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Backend API Tests Summary:")
    print(f"✅ Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All backend tests passed!")
        return 0
    else:
        print("⚠️ Some backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())