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

# Configure Gemini API
# Ideally, set this in your environment variables: set GEMINI_API_KEY=your_key
API_KEY = os.environ.get("GEMINI_API_KEY")
if API_KEY and genai:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-pro')
elif not API_KEY:
    print("WARNING: GEMINI_API_KEY not found. Chat endpoint disabled.")
    model = None
else:
    model = None

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
                
                if not model:
                     response_text = "Error: API Key not configured. Please set GEMINI_API_KEY environment variable."
                else:
                    chat = model.start_chat(history=[])
                    response = chat.send_message(user_message)
                    response_text = response.text

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

