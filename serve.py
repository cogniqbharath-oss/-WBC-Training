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
    return "gemini-flash-latest"

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
            payload = {
                'ok': True,
                'message': 'WBC Training chat endpoint. POST JSON { "message": "..." } to this endpoint.'
            }
            self.wfile.write(json.dumps(payload).encode('utf-8'))
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/gemini-chat':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                user_message = data.get('message', '').strip()
                history = data.get('history', [])
                
                if not client:
                    reply = "Error: API not configured locally."
                else:
                    sys_prompt = """You are Sarah, a friendly and experienced training consultant from WBC Training. 
Your goal is to help visitors understand how our business capability programmes can help their teams.

About WBC Training:
- WBC Training has been developing business capabilities since 2005.
- We specialize in training for complex operations and capital projects in energy, infrastructure, and life sciences.
- Our offerings include:
    * 3–5 day Online & Classroom Courses: Focused on Leadership, Procurement, Strategy, Governance, and Stakeholder Management.
    * 1–2 hour Online Workshops: Rapid skill boosts for busy professionals.
    * In-House Training: Custom-tailored agendas delivered on-site or virtually.
- Premium Flagship Programmes:
    * Capital Portfolio Leadership: 5-day intensive for executives (London, Dubai, Houston).
    * Operational Excellence Lab: 3-day immersive lab with digital twin simulations.
    * Energy Transition Studio: 2-day strategic advisory sprint.
- Key Insights: We offer resources like the CREST Model for building trust and frameworks for difficult discussions.
- Contact Details: 
    * Email: info@wbctraining.com
    * Phone/WhatsApp: +44 7540 269 827
    * Office: Epsom, U.K. (Registered No. 9454985).

Personality & Tone Guidelines:
- Be Human: Use a warm, professional, and helpful tone. Speak like a real person, not a database.
- Conversational: It's okay to use friendly openings like "Hello! I'd be happy to help with that" or "That's a great area to focus on."
- Empathetic: Acknowledge the user's needs or challenges (e.g., managing complex projects).
- Informative & Natural: Provide accurate details from the info above, but present them naturally in conversation.
- Answer Directly: Still ensure the user's specific question is answered clearly."""

                    # Format history for genai
                    contents = []
                    for entry in history:
                        role = "user" if entry['role'] == "user" else "model"
                        contents.append({"role": role, "parts": [part['text'] for part in entry['parts']]})
                    
                    # Prepend system instruction to the first message if no history, or just use it as start
                    if not contents:
                        contents.append({"role": "user", "parts": [f"System Instructions: {sys_prompt}\n\nUser: {user_message}"]})
                    else:
                        contents.append({"role": "user", "parts": [user_message]})

                    response = client.generate_content(contents)
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
