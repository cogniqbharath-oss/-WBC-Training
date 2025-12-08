import google.generativeai as genai
import os

key = os.environ.get("GEMINI_API_KEY")
if not key:
    print("No GEMINI_API_KEY found in environment explicitly.")
    # Try reading from .env manually just in case
    try:
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    key = line.split("=", 1)[1].strip()
                    break
    except:
        pass

if not key:
    print("Could not find API Key.")
    exit(1)

print(f"Using Key: {key[:5]}...{key[-5:]}")
genai.configure(api_key=key)

print("Listing models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"NAME: {m.name} | DISPLAY: {m.display_name}")
except Exception as e:
    print(f"Error listing models: {e}")
