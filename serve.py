"""Lightweight development server for the WBC Training landing page."""

import os
import json
from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer
from pathlib import Path

try:
    import google.generativeai as genai  # optional dependency
except ImportError:
    genai = None
    print("WARNING: google-generativeai package missing. Chat endpoint disabled.")

PORT = 8000
ROOT = Path(__file__).resolve().parent

# Load API key from env or .env file
def load_api_key() -> str | None:
    """Get GEMINI_API_KEY from environment or .env."""
    env_key = os.environ.get("GEMINI_API_KEY")
    if env_key:
        return env_key.strip()

    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            striped = line.strip()
            if not striped or striped.startswith("#"):
                continue
            if striped.startswith("GEMINI_API_KEY="):
                _, value = striped.split("=", 1)
                return value.strip().strip('"').strip("'")
    return None

# Configure Gemini API
API_KEY = load_api_key()
DEFAULT_MODEL = "gemini-pro"
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", DEFAULT_MODEL)

if API_KEY and genai:
    try:
        genai.configure(api_key=API_KEY)
        print(f"✓ Gemini API configured successfully (preferred model: {GEMINI_MODEL})")
        client = genai.GenerativeModel(GEMINI_MODEL)
    except Exception as api_error:
        print(f"ERROR: Unable to initialize Gemini client -> {api_error}")
        client = None
elif not API_KEY:
    print("WARNING: GEMINI_API_KEY not found. Chat endpoint disabled.")
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
                     response_text = "Error: API Key not configured. Please set GEMINI_API_KEY environment variable."
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
                    
                    try:
                        response = client.generate_content(
                            f"{system_prompt}\n\nUser question: {user_message}",
                            generation_config=genai.types.GenerationConfig(
                                temperature=0.7,
                                max_output_tokens=800,
                            )
                        )
                        response_text = response.text.strip()
                    except Exception as e:
                        response_text = f"Gemini API error: {str(e)}"

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

