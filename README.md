# Merugu Studio — business website

Frontend website for Merugu's freelance studio. Playful sticker-wall design
language learned (line by line, study only) from gutfeeling.agency — all copy,
code and assets here are original.

## Map

- `index.html` — the whole site: nav, hero (draggable word sticker), services
  wall (everything draggable), method/manifesto, contact, slingshot, footer.
- `assets/css/site.css` — design tokens + all styles.
- `assets/js/site.js` — drag engine, tidy-up, slingshot physics, cursor pills,
  toasts, scroll reveals, active nav. Vanilla JS, no libraries.
- `assets/images/` — (empty; the site is pure CSS/SVG, no raster images)
- `assets/fonts/` — self-hosted woff2: Bowlby One, DM Mono 500, Instrument Sans
  (400-700 + italic), Permanent Marker. No external requests; works offline.

## Rename the brand

Search for `MERUGU STUDIO` / `Merugu Studio` / `Merugu` in `index.html` —
one pass replaces the brand everywhere.

## Run locally

```bash
cd business-website && python3 -m http.server 8000
# open http://localhost:8000
```
