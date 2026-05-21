# LurnStack Trainer App

React + TailwindCSS single-page app for the trainer portal.

Live trainer site:

```text
https://trainers.lurnstack.com
```

Backend API:

```text
https://api.lurnstack.com
```

## What This App Includes

- Trainer signup
- Trainer login
- Protected trainer dashboard
- Trainer live class create/edit flow
- Trainer live class publish/cancel/delete actions
- Trainer account active/inactive status check

Student shopping, student learning, cart, and public course pages are not routed in this trainer build.

## Project Structure

```text
src/
  app/
    providers/        App-level providers
    router/           Browser routes and path constants
  auth/
    api/              Login/register API calls
    components/       Auth route guards
    lib/              Auth validation helpers
    model/            Auth context and token storage
    pages/            Login and signup pages
  trainers/
    api/              Trainer session API calls
    pages/            Trainer dashboard
  shared/
    api/              Shared Axios client and error helpers
    components/       Shared UI helpers
    config/           Environment config
```

## Main Flow

1. `src/index.js` renders `src/App.js`.
2. `App.js` wraps the app with `AppProviders` and `BrowserRouter`.
3. `AppProviders` loads `AuthProvider`.
4. `AppRouter` defines the trainer-only routes.
5. `/trainer-dashboard` is protected by `RequireAuth role="trainer"`.
6. Login/signup store the token and user in web storage.
7. The shared Axios client attaches the token to API requests.
8. The trainer dashboard loads trainer status and trainer sessions from the backend.

## Routes

```text
/                   -> redirects to /trainer-dashboard
/login              -> trainer login
/signup             -> trainer signup
/trainer-dashboard  -> protected trainer dashboard
*                   -> redirects to /trainer-dashboard
```

## Environment

Create `.env.local` for local development:

```env
REACT_APP_API_BASE_URL=https://api.lurnstack.com
```

If this value is not set:

- localhost defaults to an empty base URL, which can use the CRA dev proxy
- deployed builds default to `https://api.lurnstack.com`

The local CRA proxy is configured in `package.json`:

```json
"proxy": "https://api.lurnstack.com"
```

Important: the CRA proxy only works during `npm start`. It does not exist in the production build.

## Local Development

```bash
npm install
npm start
```

## Production Build

```bash
npm run build
```

Upload the generated `build` folder to the aaPanel site for:

```text
https://trainers.lurnstack.com
```

## aaPanel/Nginx SPA Routing

Because this is a React browser-router SPA, the frontend server must fallback unknown routes to `index.html`.

Use this Nginx rule on the trainer frontend site:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Keep `api.lurnstack.com` separate from `trainers.lurnstack.com`.

## Backend CORS Requirement

The live trainer app calls the API from this origin:

```text
https://trainers.lurnstack.com
```

The backend must allow that origin in CORS. Otherwise login/register will fail in the browser even if the API works locally.

Full backend handoff and troubleshooting doc:

```text
docs/TRAINER_APP_FLOW_AND_CORS.md
```

Full trainer portal workflow document:

```text
docs/TRAINER_APP_WORKFLOW.md
```

## Key API Endpoints

Auth:

```text
POST /api/auth/login
POST /api/auth/register
```

Trainer sessions:

```text
GET    /api/trainer/status
GET    /api/trainer/sessions
POST   /api/trainer/sessions
PATCH  /api/trainer/sessions/:id
PATCH  /api/trainer/sessions/:id/publish
PATCH  /api/trainer/sessions/:id/cancel
DELETE /api/trainer/sessions/:id
```

## Security Note

This frontend stores the auth token in `localStorage` or `sessionStorage`.
For stronger protection against XSS token theft, the backend can later move auth to secure `httpOnly` cookies.
