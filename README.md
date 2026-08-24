# Vasant Kumar Desai — Portfolio

Personal portfolio website for **Vasant Kumar Desai** — Data Engineer & Clinical Data Programmer.

Built with plain HTML, CSS, and vanilla JavaScript. No build tools required — deploys directly to GitHub Pages.

**Live:** [https://vpdesai2020.github.io](https://vpdesai2020.github.io)

## Project Structure

```text
/
├── index.html                          ← Single-page shell
├── assets/
│   ├── css/style.css                   ← Clinical visual system and responsive layout
│   ├── images/                         ← Favicon and social preview artwork
│   └── js/
│       ├── app.js                      ← Main logic — fetches JSON, renders sections
│       └── animations.js               ← Scroll reveals & counter animations
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
| Styling | CSS3 (custom properties, container queries, responsive) |
| Fonts | Zero-request native sans and monospace system stacks |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

## Features

- **JSON-driven** — single file for all content updates
- **Clinical data pipeline visual** — domain-specific system flow in the hero
- **Impact explorer** — keyboard-accessible case-study tabs with measurable outcomes
- **Evidence matrix** — competencies connected to concrete delivery examples
- **Clinical visual system** — technical grid, editorial typography, and restrained color
- **Fully responsive** — optimised for mobile, tablet, and desktop
- **Accessible** — static fallback, reduced-motion support, semantic tabs, and keyboard navigation
- **Back-to-top button** — appears on scroll for easy navigation
- **Zero third-party requests** — no remote fonts, counters, badges, or runtime libraries
