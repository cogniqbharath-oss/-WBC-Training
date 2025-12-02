"""Lightweight development server for the WBC Training landing page."""

import os
import json
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer
from pathlib import Path

try:
    from groq import Groq  # optional dependency
except ImportError:
    Groq = None
    print("WARNING: groq package missing. Chat endpoint disabled.")

PORT = 8000
ROOT = Path(__file__).resolve().parent

# Load API key from env or .env file
def load_api_key() -> str | None:
    """Get GROQ_API_KEY from environment or .env."""
    env_key = os.environ.get("GROQ_API_KEY")
    if env_key:
        return env_key.strip()

    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            striped = line.strip()
            if not striped or striped.startswith("#"):
                continue
            if striped.startswith("GROQ_API_KEY="):
                _, value = striped.split("=", 1)
                return value.strip().strip('"').strip("'")
    return None

# Configure Groq API
API_KEY = load_api_key()
DEFAULT_MODEL = "llama-3.1-8b-instant"
GROQ_MODEL = os.environ.get("GROQ_MODEL", DEFAULT_MODEL)
FALLBACK_MODEL_CANDIDATES = [GROQ_MODEL, DEFAULT_MODEL, "llama3-8b-8192", "gemma-7b-it"]
FALLBACK_MODELS = []
for model_name in FALLBACK_MODEL_CANDIDATES:
    if model_name not in FALLBACK_MODELS:
        FALLBACK_MODELS.append(model_name)

if API_KEY and Groq:
    try:
        client = Groq(api_key=API_KEY)
        print(f"✓ Groq API configured successfully (preferred model: {GROQ_MODEL})")
    except Exception as api_error:
        print(f"ERROR: Unable to initialize Groq client -> {api_error}")
        client = None
elif not API_KEY:
    print("WARNING: GROQ_API_KEY not found. Chat endpoint disabled.")
    client = None
else:
    client = None

class RootedHandler(SimpleHTTPRequestHandler):
    """Serve files relative to the repository root and handle chat API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_POST(self):
        if self.path == '/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                user_message = data.get('message', '')
                
                if not client:
                     response_text = "Error: API Key not configured. Please set GROQ_API_KEY environment variable."
                else:
                    # System prompt for WBC Training context
                    system_prompt = """You are an AI concierge for WBC Training, a business capability training company. 
                    You help with:
                    - Course information and schedules
                    - Booking availability
                    - Pricing and fees
                    - Location and travel directions
                    - Training programme details
                    
                    Be helpful, professional, and concise. If you don't know something, suggest contacting info@wbctraining.com or calling +44 7540 269 827."""
                    
                    response_text = None
                    last_error = None
                    for model_name in FALLBACK_MODELS:
                        try:
                            completion = client.chat.completions.create(
                                model=model_name,
                                messages=[
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": user_message},
                                ],
                                temperature=0.7,
                                max_tokens=800,
                            )
                            response_text = completion.choices[0].message.content.strip()
                            break
                        except Exception as e:
                            last_error = e
                            continue

                    if not response_text:
                        response_text = f"Groq API error: {last_error}"

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'response': response_text}).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
        else:
            self.send_error(404, "File not found")

def main():
    with TCPServer(("", PORT), RootedHandler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{PORT}/ (press Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    main()

