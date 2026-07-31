# F1 AI Race Engineer — Control Room

Premium landing experience for the F1 AI Race Engineer project. Built with
Next.js, TypeScript, Tailwind CSS, Three.js, and GSAP.

This is the frontend shell only — the Python/XGBoost models from the
original Streamlit app are unchanged and intended to sit behind an API
that this frontend will eventually call.

## Setup

This project was hand-authored (not scaffolded via `create-next-app`)
because the build environment it was generated in has no network access.
You'll need to install dependencies yourself:

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Architecture

```
src/
  app/
    layout.tsx        Root layout — loads Inter + JetBrains Mono fonts
    page.tsx           Assembles the full landing page from components
    globals.css        Base styles, custom cursor cursor:none, scrollbar
  components/
    scene/
      TelemetryScene.tsx   The Three.js grid-horizon hero visual
      SceneOverlay.tsx     Vignette + film grain layers above the canvas
    layout/
      Nav.tsx              Floating glass navigation
      Hero.tsx             Headline, sub copy, CTAs, scroll cue
      StatStrip.tsx         Four-column metric bar
      ModuleGrid.tsx         Six system-capability cards
      ModuleIcon.tsx          SVG icon set for the module grid
      Footer.tsx
      AnimationProvider.tsx  Client wrapper that mounts the GSAP hook
    hud/
      HudPanel.tsx          Live-metric readout cards (desktop only)
    ui/
      CustomCursor.tsx       Glowing dot + lagging ring cursor
      Button.tsx              ButtonPrimary / ButtonGhost primitives
  lib/
    tokens.ts                Design tokens + content data (single source
                              of truth — colors, copy, stats, module list)
    useIntroAnimation.ts      GSAP load sequence + scroll-reveal hook
```

## Design tokens

All colors, copy strings, and content arrays (module list, stats, HUD
metrics) live in `src/lib/tokens.ts`. Update content there rather than
hardcoding strings in components — this keeps the system reusable as you
build out more pages.

Color palette:
- `void` `#05060A` — page background
- `panel` `#0B0E16` / `panel-2` `#10141F` — card surfaces
- `cyan` `#00E5C9` — primary accent (telemetry, live states)
- `race-red` `#FF2D55` — used sparingly for alternating accents
- `ink-hi/mid/lo` — text hierarchy

## Extending this

To add a new page (e.g. the dashboard), create `src/app/dashboard/page.tsx`
and reuse `TelemetryScene`, `Nav`, `Footer`, and the `ButtonPrimary` /
`ButtonGhost` primitives so the visual language stays consistent. New
content-driven sections should follow the `ModuleGrid` pattern: data in
`tokens.ts`, layout in the component, `data-reveal` on the wrapper for
scroll-in animation.

## Known limitations of this build

- The Python ML models are not yet wired to this frontend — that requires
  building an API layer (FastAPI/Flask recommended) around the existing
  `.pkl` models and pointing fetch calls at it from new page components.
- Only the hero/landing page is built. The brief's dashboard, telemetry
  control room, and other modules are designed as cards linking out but
  not yet implemented as full pages.
- 3D content is intentionally abstract (grid + particles), not a literal
  car model, per the agreed direction — swapping in a GLTF car model
  would mean adding `@react-three/drei`'s `useGLTF` loader inside
  `TelemetryScene.tsx`.
