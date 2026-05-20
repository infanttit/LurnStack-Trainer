# LurnStack (Frontend)

React (Create React App) + TailwindCSS single-page app with feature-based modules (auth, cart, live-classes, courses, etc.). Deployed as an SPA on the VPS/aapanel frontend domain (`lurnstack.com`).

## Service domains

- Frontend: `https://lurnstack.com`
- Admin: `https://admin.lurnstack.com`
- Backend API: `https://api.lurnstack.com`

## VPS/aapanel routing

This React app uses browser routes. On a VPS, the web server must fallback
unknown frontend routes to `index.html`, otherwise refreshing `/courses`,
`/login`, `/signup`, `/dashboard`, or another React route will show a server
404. Apache builds include `public/.htaccess`. Nginx/aaPanel must use the
`try_files` rule in `docs/aapanel-spa-routing.md`; the same snippet is copied
into the build as `nginx-spa-fallback.conf`.

## Quick start

1) Create `.env.local` (or copy from `.env.example`):

`REACT_APP_API_BASE_URL=https://api.lurnstack.com`

2) Run:

- `npm start`

## VPS/aapanel build

Build the frontend with:

- `npm run build`

Upload or point the `lurnstack.com` document root to the generated `build`
folder. Make sure the SPA fallback rule is enabled, otherwise refresh on
frontend routes will show 404.

For Nginx/aaPanel, the required frontend rule is:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Keep `api.lurnstack.com` separate from the frontend site.

## Architecture (high level)

- App entry: `src/index.js` → `src/App.js`
- Global providers: `src/app/providers/AppProviders.jsx` (Redux + AuthContext + CartContext)
- Routing: `src/app/router/router.jsx` + `src/app/router/paths.js`
- Shared layout shell: `src/app/AppShell.jsx` (navbar/footer + integrations + `Outlet`)

## Auth flow (VPS backend)

- API base URL comes from `REACT_APP_API_BASE_URL` (`src/shared/config/env.js`)
- Login: `POST /api/auth/login` (`src/auth/api/authApi.js`)
- Register: `POST /api/auth/register` (`src/auth/api/authApi.js`)
- Token + user persistence:
  - “Remember me” checked → `localStorage`
  - unchecked → `sessionStorage`
  (`src/auth/model/authStorage.js`)

## Notes on security

This frontend stores the auth token in Web Storage (session/local). For strongest protection against XSS token theft, prefer **httpOnly secure cookies** on the backend (requires backend changes).
