"""Quick test to verify the /api/gemini-chat endpoint works."""
import requests
import json

BASE_URL = "http://localhost:8000"

try:
    # List models
    import google.generativeai as genai
    import os
    
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        genai.configure(api_key=key)
        print("Available models:")
        try:
            for m in genai.list_models():
                if 'generateContent' in m.supported_generation_methods:
                    print(f" - {m.name}")
        except Exception as e:
            print(f"Could not list models: {e}")

    # Test the API endpoint
    response = requests.post(
        f"{BASE_URL}/api/gemini-chat",
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
            print(f"\n[OK] API Working! Bot says:\n{data['response']}")
        else:
            print(f"\n[ERROR] Response missing 'response' field")
    else:
        print(f"\n[ERROR] API returned error status {response.status_code}")
        
except Exception as e:
    print(f"[ERROR] Error: {e}")
