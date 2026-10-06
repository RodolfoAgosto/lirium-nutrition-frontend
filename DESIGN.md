# Lirium UI — Design Brief

Reusable brief. Include it in every v0 prompt so all screens share one look.

## Product tone
Lirium is a nutrition planning platform used by patients and nutritionists.
The UI must feel calm, clean and professional. Think healthcare/wellness, not
a dev tool. No gradients, no neon, no dark "terminal" look, no decorative
illustrations, no animations beyond default component transitions.

## Design tokens
| Token | Value |
|---|---|
| background | #FAFAF7 |
| surface (cards, inputs) | #FFFFFF |
| border | #E3E8E4 |
| text | #263238 |
| text-muted | #5F6D65 |
| primary | #2E7D32 |
| primary-hover | #1B5E20 |
| accent | #E9A23B |
| danger | #C0392B |

- Font: Inter, everywhere. Headings semibold, body regular.
- Radius: 8px on cards, inputs and buttons.
- Spacing: Tailwind default scale, generous whitespace.
- Light theme only.

## Components
- shadcn/ui only (Button, Input, Label, Card, Form, Sonner toast).
- Do not write per-page custom styles. Every page uses the same components
  and the tokens above (map them to CSS variables / Tailwind theme).
- Icons: lucide-react, sparingly.

## Layouts (defined once, shared by all pages)
- **PublicLayout**: slim header with the Lirium logo (leaf icon + "Lirium") on the left and
  "Log in" / "Sign up" buttons on the right. Centered content, no menu.
- **PrivateLayout**: left sidebar (collapses to a top bar on mobile) with the
  navigation menu, the signed-in user's email and a "Log out" button.
  Every future authenticated screen plugs into this layout.

## Responsive
Desktop first (videos are recorded on desktop), must also work at 375px width.

## Logo
Real brand assets live in `public/brand/` (leaf icon + wordmark, light/dark SVG/PNG).
- Header (public and sidebar): `lirium-icon.svg` + "Lirium" text (semibold, text color).
- Landing hero: leaf icon, "Lirium Nutrition" ("Nutrition" in primary) and the
  tagline "PRECISION · HEALTH · TECH" (small, letter-spaced, #607D8B).
- Do not redraw or recolor the logo; use the files as provided.
