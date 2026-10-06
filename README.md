# Lirium Nutrition — Web client

Minimal Next.js client for the [Lirium Nutrition Planning API](https://github.com/RodolfoAgosto/lirium-nutrition-planning).
Built to demonstrate the backend's security flows (JWT login, Google OAuth2 with
one-time code exchange, logout with token blacklist).

## Stack
Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3.

## Run locally
```bash
npm install
cp .env.example .env.local   # optional: defaults to the Render API
npm run dev                  # http://localhost:3000
```

## Screens
| Route | Layout | Purpose |
|---|---|---|
| `/` | Public | Landing |
| `/login` | Public | Email/password + Google |
| `/register` | Public | Create account |
| `/oauth2/callback` | none | Exchanges the Google one-time `code` for JWT tokens |
| `/home` | Private | Authenticated home (sidebar menu, logout) |

Layouts live in `src/components/layout`. Any new authenticated screen goes under
`src/app/(private)/` and automatically gets the sidebar. The menu is defined once
in `private-layout.tsx`.

## Auth flow
- Tokens are stored in `localStorage` (demo-grade) behind `src/lib/auth.ts`.
- The JWT payload is decoded client-side for `sub` (email) and `roles`.
- Logout calls `POST /api/auth/logout` (server blacklists the token `jti`), then clears local tokens.
- Google: `/login` → `${API}/oauth2/authorization/google` → backend redirects to `/oauth2/callback?code=…` → `POST /api/auth/oauth2/exchange`.

## Backend configuration (Render env vars)
- `FRONTEND_URL` = this app's URL (enables the redirect after Google login)
- `CORS_ALLOWED_ORIGINS` = this app's URL

Design tokens and rules: see `DESIGN.md`.
