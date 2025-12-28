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
def load_api_key() -> str:
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
            if "=" in striped:
                k, v = striped.split("=", 1)
                if k.strip() == "GEMINI_API_KEY":
                    return v.strip().strip('"').strip("'")
    return ""

def load_env_model() -> str:
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line:
                k, v = line.split("=", 1)
                if k.strip() == "GEMINI_MODEL":
                    return v.strip().strip('"').strip("'")
    return "gemini-2.0-flash"

API_KEY = load_api_key()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL") or load_env_model()

client = None
if API_KEY and genai:
    try:
        genai.configure(api_key=API_KEY)
        client = genai.GenerativeModel(GEMINI_MODEL)
        print(f"[OK] Gemini configured with model: {GEMINI_MODEL}")
    except Exception as e:
        print(f"ERROR: Gemini init failed: {e}")

class RootedHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/gemini-chat':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'online'}).encode('utf-8'))
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/gemini-chat':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                user_message = data.get('message', '').strip()
                
                if not client:
                    reply = "Error: API not configured locally."
                else:
                    sys_prompt = "You are a friendly AI Concierge for WBC Training. Be human-like and helpful."
                    full_prompt = f"{sys_prompt}\n\nUser: {user_message}"
                    response = client.generate_content(full_prompt)
                    reply = response.text.strip()

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'reply': reply, 'response': reply}).encode('utf-8'))
                
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'reply': f'Error: {str(e)}'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def main():
    print(f"Starting server at http://localhost:{PORT}")
    with TCPServer(("", PORT), RootedHandler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    main()
