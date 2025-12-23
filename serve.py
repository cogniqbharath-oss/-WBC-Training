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
DEFAULT_MODEL = "gemini-1.5-flash"

# Try to find model in .env if not in os.environ
def load_env_model():
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.strip().startswith("GEMINI_MODEL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

GEMINI_MODEL = os.environ.get("GEMINI_MODEL") or load_env_model() or DEFAULT_MODEL

client = None

if API_KEY and genai:
    try:
        genai.configure(api_key=API_KEY)
        print(f"[OK] Gemini API configured successfully (preferred model: {GEMINI_MODEL})")

        # Attempt to list available models so we can choose a compatible one.
        available_models = []
        try:
            lm = None
            try:
                lm = genai.list_models()
            except Exception:
                try:
                    lm = genai.models.list()
                except Exception:
                    lm = None

            if lm is not None:
                if isinstance(lm, dict) and 'models' in lm:
                    for m in lm['models']:
                        if isinstance(m, dict) and 'name' in m:
                            available_models.append(m['name'])
                        elif isinstance(m, str):
                            available_models.append(m)
                elif hasattr(lm, 'models'):
                    for m in lm.models:
                        name = getattr(m, 'name', None) or getattr(m, 'id', None) or str(m)
                        available_models.append(name)
                else:
                    try:
                        for m in lm:
                            name = getattr(m, 'name', None) or str(m)
                            available_models.append(name)
                    except Exception:
                        pass
        except Exception as e:
            print(f"Could not list models: {e}")

        if available_models:
            print("Available models (sample):", available_models[:20])

        # Build an ordered candidate list
        candidate_models = [GEMINI_MODEL]
        if available_models:
            preferred = [
                'models/gemini-2.0-flash',
                'models/gemini-2.0-flash-lite-preview',
                'models/gemini-1.5-flash',
                'models/gemini-1.5-flash-8b'
            ]
            for p in preferred:
                if any(p == name for name in available_models):
                    candidate_models.append(p)

            for name in available_models:
                lname = name.lower()
                if 'gemini' in lname and 'embed' not in lname and 'embedding' not in lname and 'tts' not in lname:
                    if name not in candidate_models:
                        candidate_models.append(name)

        candidate_models.extend([
            GEMINI_MODEL,
            'gemini-1.5',
            'gemini-1.0',
            'models/text-bison-001',
            'text-bison-001'
        ])

        for candidate in candidate_models:
            try:
                print(f"Attempting model: {candidate}")
                client = genai.GenerativeModel(candidate)
                GEMINI_MODEL = candidate
                print(f"[OK] Selected working model: {GEMINI_MODEL}")
                break
            except Exception as e:
                print(f"Model {candidate} not available or incompatible: {e}")

        if not client:
            print("ERROR: Unable to find a compatible Gemini model. Chat endpoint disabled.")

    except Exception as api_error:
        print(f"ERROR: Unable to initialize Gemini client -> {api_error}")
        client = None
elif not API_KEY:
    print("WARNING: GEMINI_API_KEY not found. Chat endpoint disabled.")
else:
    client = None

class RootedHandler(SimpleHTTPRequestHandler):
    """Serve files relative to the repository root and handle chat API."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        """Add CORS headers to all responses."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        """Handle GET requests for health or info on /api/gemini-chat; otherwise serve files."""
        if self.path == '/api/gemini-chat':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            payload = {
                'ok': True,
                'message': 'WBC Training chat endpoint. POST JSON { "message": "..." } to this endpoint.'
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return
        # Fall back to normal file serving for other GET requests
        return super().do_GET()

    def do_POST(self):
        """Handle POST requests - chat endpoint."""
        if self.path == '/api/gemini-chat':
            try:
                # Get content length safely
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'response': 'Error: Invalid request (empty body)'}).encode('utf-8'))
                    return
                
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                user_message = data.get('message', '').strip()
                
                if not user_message:
                    self.send_response(400)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'response': 'Error: Message cannot be empty'}).encode('utf-8'))
                    return
                
                if not client:
                    response_text = "Error: API Key not configured. Please set GEMINI_API_KEY environment variable."
                else:
                    # System prompt for WBC Training context
                    system_prompt = """You are an AI concierge for WBC Training, a business capability training company established in 2005. 
You help users with:
- Course information: 3-5 day classroom/online courses in Leadership, Procurement, Strategy, Governance, and Stakeholder Management.
- Online Workshops: 1-2 hour focused sessions for rapid skill boosts.
- In-House Training: Custom agendas delivered on-site or virtually.
- Premium Offerings: Capital Portfolio Leadership (Flagship), Operational Excellence Lab (Simulation), and Energy Transition Studio (Advisory).
- Key Clients: GKP, Accenture, Schlumberger, Delta Lift Resources, Summit Industrial, HKN, and FTSE 100 Utilities.
- Contact: info@wbctraining.com or +44 7540 269 827.
- Location: London, Dubai, Erbil (Registered in Epsom, KT17 1HQ, UK).

Guidelines:
1. Be professional, helpful, and concise.
2. If you don't know a specific detail, suggest contacting the team at info@wbctraining.com.
3. PREVENT HALLUCINATION: Only provide information found in the context above or on the website. 
4. If asked about "menu", "coffee", or "cafe", gently redirect the user that you are an AI for a Business Training company, not a cafe.
5. Mention that most cohorts report 98% faster stakeholder alignment."""
                    
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

                # Always return 200 with response field for client compatibility
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'response': response_text}).encode('utf-8'))
                
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'response': 'Error: Invalid JSON'}).encode('utf-8'))
            except Exception as e:
                print(f"Error handling POST request: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'response': f'Error: {str(e)}'}).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'response': 'Error: Endpoint not found'}).encode('utf-8'))

def main():
    with TCPServer(("", PORT), RootedHandler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{PORT}/ (press Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == "__main__":
    main()
