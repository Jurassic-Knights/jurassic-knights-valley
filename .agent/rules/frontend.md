---
trigger: model_decision
description: React/TSX component standards — functional components, hooks, Tailwind styling, accessibility. Apply when creating or editing React components, TSX files, Tailwind config, or dashboard/UI that uses React.
---

# Frontend (React / TSX)

## Components

- Use functional components and hooks; no class components unless legacy/third-party requires it.
- One primary component per file; colocate small subcomponents or extract when they grow.
- Name files to match the default export (e.g. `WeaponWheel.tsx` → `WeaponWheel`).

## State and Data

- Prefer local state; lift only when multiple components need it.
- Use context sparingly; keep scope minimal.
- For forms and complex UI state, use a single source of truth and one-way data flow.

## Styling (Tailwind)

- Use Tailwind utility classes; avoid inline styles for layout/theme; use Tailwind config for tokens.
- Prefer semantic class names and responsive prefixes (`sm:`, `md:`).
- Keep markup readable; extract long class strings to constants or small components.

## Accessibility and UX

- Use semantic HTML and ARIA where needed.
- Ensure keyboard access and visible focus states on interactive elements.
- Prefer composition (slots, children) over prop drilling.