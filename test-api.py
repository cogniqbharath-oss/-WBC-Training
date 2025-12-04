"""Quick test to verify the /api/chat endpoint works."""
import requests
import json

BASE_URL = "http://localhost:8000"

try:
    # Test the API endpoint
    response = requests.post(
        f"{BASE_URL}/api/chat",
        json={"message": "Hello! What training programs do you offer?"},
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nParsed JSON: {json.dumps(data, indent=2)}")
        if 'response' in data:
            print(f"\n✓ API Working! Bot says:\n{data['response']}")
        else:
            print(f"\n✗ Response missing 'response' field")
    else:
        print(f"\n✗ API returned error status {response.status_code}")
        
except Exception as e:
    print(f"✗ Error: {e}")
