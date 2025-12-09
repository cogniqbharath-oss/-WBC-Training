"""
Test script to verify Gemini API key and model compatibility
This will help diagnose chatbot connection issues
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "models/gemini-flash-lite-latest")

print("=" * 60)
print("GEMINI API KEY TEST")
print("=" * 60)

# Check if API key exists
if not API_KEY:
    print("[X] ERROR: GEMINI_API_KEY not found in .env file")
    exit(1)

print(f"[OK] API Key found: {API_KEY[:20]}...{API_KEY[-4:]}")
print(f"[OK] Model: {MODEL}")
print()

# Test 1: List available models
print("-" * 60)
print("TEST 1: Listing available models")
print("-" * 60)

try:
    list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    response = requests.get(list_url, timeout=10)
    
    if response.status_code == 200:
        data = response.json()
        models = data.get("models", [])
        print(f"[OK] Found {len(models)} models")
        print("\nModels that support generateContent:")
        for model in models:
            if "generateContent" in model.get("supportedGenerationMethods", []):
                print(f"  - {model['name']}")
    else:
        print(f"[X] Failed to list models: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"[X] Error listing models: {e}")

print()

# Test 2: Test generateContent with the configured model
print("-" * 60)
print(f"TEST 2: Testing generateContent with {MODEL}")
print("-" * 60)

try:
    # Extract model name without 'models/' prefix if needed
    model_path = MODEL if MODEL.startswith("models/") else f"models/{MODEL}"
    
    generate_url = f"https://generativelanguage.googleapis.com/v1beta/{model_path}:generateContent?key={API_KEY}"
    
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": "Hello! What training programs do you offer?"}]
            }
        ]
    }
    
    print(f"Making request to: {generate_url.replace(API_KEY, 'API_KEY_HIDDEN')}")
    
    response = requests.post(
        generate_url,
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        candidates = data.get("candidates", [])
        if candidates:
            first = candidates[0]
            parts = first.get("content", {}).get("parts", [])
            reply = " ".join([p.get("text", "") for p in parts]).strip()
            
            print("[OK] SUCCESS! Model is working correctly")
            print(f"\nBot response:\n{reply}\n")
        else:
            print("[X] No candidates in response")
            print(f"Response: {json.dumps(data, indent=2)}")
    else:
        print(f"[X] API request failed")
        print(f"Response: {response.text}")
        
        # Try to parse error
        try:
            error_data = response.json()
            error_msg = error_data.get("error", {}).get("message", "Unknown error")
            print(f"\nError message: {error_msg}")
        except:
            pass
            
except Exception as e:
    print(f"[X] Error testing API: {e}")

print()
print("=" * 60)
print("TEST COMPLETE")
print("=" * 60)
print("\nNext steps:")
print("1. If tests passed [OK], add GEMINI_API_KEY to Cloudflare environment variables")
print("2. If tests failed [X], check:")
print("   - API key is valid and not expired")
print("   - Model name is correct")
print("   - API key has permission to use the model")

