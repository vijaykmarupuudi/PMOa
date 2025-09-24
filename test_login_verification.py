#!/usr/bin/env python3
"""
ProjectHub Login Verification Script
Tests all demo accounts to verify login functionality
"""

import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

# Demo user credentials
DEMO_USERS = [
    {"email": "pm@projecthub.com", "password": "demo123", "role": "Project Manager"},
    {"email": "exec@projecthub.com", "password": "demo123", "role": "Executive"},
    {"email": "dev@projecthub.com", "password": "demo123", "role": "Team Member"},
    {"email": "stakeholder@projecthub.com", "password": "demo123", "role": "Stakeholder"},
]

def test_demo_users():
    """Test login for all demo users"""
    print("🧪 ProjectHub Demo Login Verification")
    print("=" * 50)
    
    success_count = 0
    
    for user in DEMO_USERS:
        print(f"\n🔍 Testing: {user['role']} ({user['email']})")
        
        # Prepare form data
        form_data = {
            'username': user['email'],
            'password': user['password']
        }
        
        try:
            # Make login request
            response = requests.post(
                f"{BACKEND_URL}/api/auth/login",
                data=form_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                user_info = data.get('user', {})
                
                print(f"  ✅ LOGIN SUCCESS")
                print(f"  👤 User: {user_info.get('full_name')}")
                print(f"  🏷️  Role: {user_info.get('role')}")
                print(f"  🏢 Dept: {user_info.get('department')}")
                print(f"  🔑 Token: {data.get('access_token', '')[:50]}...")
                
                success_count += 1
            else:
                print(f"  ❌ LOGIN FAILED: {response.status_code}")
                print(f"  📋 Response: {response.text}")
                
        except Exception as e:
            print(f"  💥 ERROR: {str(e)}")
    
    print(f"\n📊 RESULTS:")
    print(f"  ✅ Successful logins: {success_count}/{len(DEMO_USERS)}")
    print(f"  📈 Success rate: {(success_count/len(DEMO_USERS)*100):.1f}%")
    
    if success_count == len(DEMO_USERS):
        print("\n🎉 ALL DEMO ACCOUNTS WORKING PERFECTLY!")
    else:
        print("\n⚠️  Some demo accounts have issues")

def test_backend_health():
    """Test backend health endpoint"""
    print("\n🏥 Backend Health Check")
    print("-" * 30)
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend Status: {data.get('status')}")
            print(f"🕐 Timestamp: {data.get('timestamp')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"💥 Health check error: {str(e)}")

if __name__ == "__main__":
    test_backend_health()
    test_demo_users()
    
    print(f"\n🌐 Frontend URL: http://localhost:3000")
    print(f"🔗 Backend URL: {BACKEND_URL}")
    print("\n📋 To test in browser:")
    print("1. Go to http://localhost:3000")
    print("2. Click any demo account button")
    print("3. Should automatically login and redirect to dashboard")