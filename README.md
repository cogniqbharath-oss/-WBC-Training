## WBC Training landing page

Static marketing page showcasing WBC Training programmes, bookings, and automation stack. The project is intentionally lightweight—there is no build tooling, just hand-authored HTML and CSS.

### Structure
- `WBC Training.html` – main markup, including hero, booking form, testimonials, automation stack, and the new immersive image showcase section.
- `styles.css` – all layout, typography, and component styling. Uses CSS custom properties for colors and spacing, plus responsive grid layouts.

### Preview locally
1. Run `python serve.py` from the repo root (uses Python's built-in HTTP server).
2. Visit `http://localhost:8000/`—the script serves `index.html` and the CSS automatically.

### Customising
- Replace the Unsplash image URLs in the `image-showcase` section with company photography.
- Update contact details, locations, or course listings directly in the HTML.
- Adjust colors or typography by editing the CSS variables at the top of `styles.css`.

### Credits
Fonts served via Google Fonts (`Space Grotesk`). Imagery taken from Unsplash placeholders—swap for owned assets before publishing.

