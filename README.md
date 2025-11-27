## WBC Training landing page

Static marketing page that mirrors the public wbctraining.com experience—hero banner, services overview, insights grid, testimonials, newsletter form, and contact module. The project is intentionally lightweight—there is no build tooling, just hand-authored HTML and CSS.

### Structure
- `index.html` / `WBC Training.html` – same markup so either file can be opened directly or served. Sections follow the official site order: hero, how we help, services, insights & webinars, testimonials, newsletter, and contact.
- `styles.css` – layout + component styling with CSS custom properties for the navy/teal palette, grid utilities, responsive fallbacks, and the floating AI chatbot widget.
- `assets/brand-logo.svg` – stripe gradient logo displayed in the header.
- `assets/chat-logo.svg` – gradient chat emblem used as the launcher button that opens the AI panel.

### Preview locally
1. Windows: double-click `serve.bat` or run `python serve.py` from PowerShell / CMD. (If you prefer the stdlib server, use `python -m http.server 8000`—note the module is `http.server`, not `http.serve`.)
2. Visit `http://localhost:8000/`—the script serves `index.html` and the CSS automatically.

### Customising
- Swap the Unsplash hero image for approved brand photography.
- Update service card images, insight cards, testimonials, or contact info directly in the HTML sections.
- Adjust colors or typography via the CSS variables at the top of `styles.css`.
- Modify chatbot responses in the `faqResponses` array at the bottom of the HTML if you want different instant answers.

### Credits
Fonts served via Google Fonts (`Space Grotesk`). Imagery taken from Unsplash placeholders—swap for owned assets before publishing.

