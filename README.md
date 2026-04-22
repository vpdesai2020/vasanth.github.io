# Vasant Kumar Desai — Portfolio

Personal portfolio website for **Vasant Kumar Desai** — Data Engineer & Clinical Data Programmer.

Built with plain HTML, CSS, and vanilla JavaScript. No build tools required — deploys directly to GitHub Pages.

**Live:** [https://vpdesai2020.github.io](https://vpdesai2020.github.io)

## Project Structure

```text
/
├── index.html                          ← Single-page shell
├── assets/
│   ├── css/style.css                   ← All styles (glass panels, responsive)
│   └── js/
│       ├── app.js                      ← Main logic — fetches JSON, renders sections
│       ├── animations.js               ← Scroll reveals & counter animations
│       └── three-scene.js              ← Milky Way night sky 3D background
├── data/profile.json                   ← All dynamic content (edit this to update)
├── Vasant_Kumar_Desai_Resume.pdf       ← Downloadable resume
└── .github/workflows/deploy.yml        ← Auto-deploy on push to main
```

## Updating Content

All dynamic content lives in `data/profile.json`. To update:

1. Edit `data/profile.json`
2. Commit and push
3. GitHub Actions redeploys automatically

No code changes needed for new jobs, certifications, skills, or contact info.

## Local Preview

```powershell
python -m http.server 8000
```

Open `http://127.0.0.1:8000/`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Markup | Semantic HTML5 |
| Styling | CSS3 (custom properties, glass-morphism, responsive) |
| Fonts | Space Grotesk (headings) + Inter (body) via Google Fonts |
| 3D Background | Three.js r158 (CDN, lazy-loaded) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

## Features

- **JSON-driven** — single file for all content updates
- **Milky Way night sky** — immersive Three.js star field with nebula clusters and shooting stars
- **Glass-morphism UI** — frosted panels with subtle noise texture
- **Fully responsive** — optimised for mobile, tablet, and desktop
- **Accessible** — reduced-motion fallback, semantic markup, keyboard navigation
- **Back-to-top button** — appears on scroll for easy navigation
- **Visitor counter** — via hits.seeyoufarm.com badge
