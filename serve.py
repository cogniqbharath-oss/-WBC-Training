"""Lightweight development server for the WBC Training landing page."""

from http.server import SimpleHTTPRequestHandler
from socketserver import TCPServer
from pathlib import Path


PORT = 8000
ROOT = Path(__file__).resolve().parent


class RootedHandler(SimpleHTTPRequestHandler):
  """Serve files relative to the repository root."""

  def __init__(self, *args, **kwargs):
    super().__init__(*args, directory=str(ROOT), **kwargs)


def main():
  with TCPServer(("", PORT), RootedHandler) as httpd:
    print(f"Serving {ROOT} at http://localhost:{PORT}/ (press Ctrl+C to stop)")
    try:
      httpd.serve_forever()
    except KeyboardInterrupt:
      print("\nShutting down server.")


if __name__ == "__main__":
  main()

