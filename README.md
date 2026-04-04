# 3D Burst (KeyVault Scroll Showcase)

A single-page, scroll-driven 3D-style product experience for a fictional premium mechanical keyboard brand (**KeyVault**).

The page uses a pre-rendered image sequence (`frames/output_0001.png` → `frames/output_0192.png`) mapped to a full-screen Three.js plane. As users scroll through the hero section, the displayed frame updates to create a smooth rotational/product reveal effect.

## Features

- **Scroll-scrubbed frame animation** powered by Three.js.
- **Progressive frame loading** with an in-page loading overlay.
- **Responsive full-screen hero** with fixed navigation, progress bar, and frame counter.
- **Product storytelling sections**: Features, Specs, Gallery, and Footer.
- **Polished visual design system** using CSS custom properties and gradient accents.

## Project Structure

```text
.
├── index.html          # Markup for the one-page experience
├── style.css           # Styling, layout, and design tokens
├── app.js              # Three.js setup, frame loading, scroll logic, UI behaviors
├── frames/             # 192 pre-rendered PNG frames for animation
└── README.md
```

## How It Works

1. `app.js` initializes a Three.js scene with an orthographic camera and a full-screen plane.
2. Frame textures are loaded from `frames/output_XXXX.png`.
3. Scroll progress in the hero section maps to a target frame index.
4. The current frame smoothly interpolates toward the target frame for fluid motion.
5. UI elements (counter, navbar state, progress bar, hero content opacity) update based on scroll position.

## Run Locally

Because the project loads local image assets and external CDN scripts/fonts, use a local HTTP server rather than opening `index.html` directly.

### Option A: Python

```bash
python3 -m http.server 8000
```

Then open: <http://localhost:8000>

### Option B: Node (if installed)

```bash
npx serve .
```

## Requirements

- A modern browser with WebGL support.
- Internet access for:
  - Three.js CDN (`cdnjs`)
  - Google Fonts (`Inter`)

## Customization Notes

- **Frame count**: Update `TOTAL_FRAMES` in `app.js` if your sequence length changes.
- **Frame naming**: Keep `output_XXXX.png` naming or update `FRAME_PATH`.
- **Hero scroll duration**: Adjust `.hero-section { height: 500vh; }` in `style.css`.
- **Brand/content**: Update copy and sections in `index.html`.

## License

No license file is currently included in this repository. Add one if you plan to distribute or reuse this project publicly.
