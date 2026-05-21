# LurnStack Trainer App Flow and Live CORS Fix

This document explains the current trainer app flow, how it connects to the backend, and the exact live CORS issue seen on `https://trainers.lurnstack.com/login`.

## Live Domains

Frontend trainer portal:

```text
https://trainers.lurnstack.com
```

Backend API:

```text
https://api.lurnstack.com
```

## Application Flow

1. The browser opens `https://trainers.lurnstack.com`.
2. React loads from the production `build` folder.
3. `src/index.js` renders `src/App.js`.
4. `src/App.js` wraps the app with:
   - `AppProviders`
   - `BrowserRouter`
   - `AppRouter`
5. `AppProviders` loads `AuthProvider`.
6. `AuthProvider` checks web storage for an existing auth token and user.
7. `AppRouter` defines trainer-only routes.
8. `/trainer-dashboard` is protected by `RequireAuth role="trainer"`.
9. If the user is not logged in, they are redirected to `/login`.
10. Login calls the backend API.
11. On success, the token and user are saved.
12. The trainer dashboard loads trainer account status and live class sessions.

## Current Trainer Routes

```text
/                   -> redirects to /trainer-dashboard
/login              -> trainer login
/signup             -> trainer signup
/trainer-dashboard  -> protected trainer dashboard
*                   -> redirects to /trainer-dashboard
```

## Auth Flow

Trainer login page:

```text
src/auth/pages/LoginPage.jsx
```

Auth context:

```text
src/auth/model/AuthContext.jsx
```

Auth storage:

```text
src/auth/model/authStorage.js
```

Auth API:

```text
src/auth/api/authApi.js
```

Login endpoint:

```text
POST https://api.lurnstack.com/api/auth/login
```

Register endpoint:

```text
POST https://api.lurnstack.com/api/auth/register
```

Trainer login always checks for a trainer account. If the backend returns a non-trainer user, the frontend rejects the login with a role error.

## Trainer Dashboard Flow

Dashboard page:

```text
src/trainers/pages/TrainerDashboardPage.jsx
```

Trainer API file:

```text
src/trainers/api/trainerSessionsApi.js
```

The dashboard calls:

```text
GET    /api/trainer/status
GET    /api/trainer/sessions
POST   /api/trainer/sessions
PATCH  /api/trainer/sessions/:id
PATCH  /api/trainer/sessions/:id/publish
PATCH  /api/trainer/sessions/:id/cancel
DELETE /api/trainer/sessions/:id
```

The shared Axios client automatically adds:

```http
Authorization: Bearer <token>
```

## Live Error

When trying to login on:

```text
https://trainers.lurnstack.com/login
```

The browser shows:

```text
Access to XMLHttpRequest at 'https://api.lurnstack.com/api/auth/login' from origin 'https://trainers.lurnstack.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.

Failed to load resource: net::ERR_FAILED
```

## Meaning Of The Error

This is a backend/API CORS issue, not a React build issue.

The production frontend is hosted on:

```text
https://trainers.lurnstack.com
```

The backend is hosted on:

```text
https://api.lurnstack.com
```

These are different origins. Because the frontend sends JSON requests, the browser sends an `OPTIONS` preflight request before the real `POST /api/auth/login`.

The backend response does not include:

```http
Access-Control-Allow-Origin: https://trainers.lurnstack.com
```

So the browser blocks the login request.

## Why Localhost Works

In local development, `package.json` has:

```json
"proxy": "https://api.lurnstack.com"
```

The CRA development server can proxy API calls during `npm start`.

That proxy only exists locally. It is not included in the production `build` folder.

In production, the browser directly calls:

```text
https://api.lurnstack.com/api/auth/login
```

So backend CORS must allow:

```text
https://trainers.lurnstack.com
```

## Backend Team Handoff

Send this to the backend team:

```text
Trainer portal login is failing on live because of CORS.

Frontend origin:
https://trainers.lurnstack.com

Backend API:
https://api.lurnstack.com/api/auth/login

Browser error:
Access to XMLHttpRequest at 'https://api.lurnstack.com/api/auth/login' from origin 'https://trainers.lurnstack.com' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.

Meaning:
The backend/API server is not allowing the origin https://trainers.lurnstack.com in CORS headers. The OPTIONS preflight request for /api/auth/login is failing before the actual POST login request is sent.

Required fix:
Please update backend CORS config to allow:
https://trainers.lurnstack.com

Also ensure OPTIONS preflight requests are handled for auth routes, including:
OPTIONS /api/auth/login
OPTIONS /api/auth/register

Required headers should include:
Access-Control-Allow-Origin: https://trainers.lurnstack.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization

If credentials/cookies are used, also include:
Access-Control-Allow-Credentials: true

Please apply this before API routes/middleware and restart the backend/API service.
```

## Example Express CORS Config

If the backend uses Express, CORS should be configured before API routes:

```js
import cors from "cors";

app.use(cors({
  origin: [
    "https://lurnstack.com",
    "https://www.lurnstack.com",
    "https://admin.lurnstack.com",
    "https://trainers.lurnstack.com",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors());
```

Then routes should be registered after CORS:

```js
app.use("/api/auth", authRoutes);
app.use("/api/trainer", trainerRoutes);
```

## aaPanel/Nginx Checks

For the frontend site `trainers.lurnstack.com`, keep SPA fallback enabled:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

For the API site `api.lurnstack.com`, make sure Nginx or aaPanel does not block `OPTIONS` requests.

The API should respond to:

```text
OPTIONS /api/auth/login
OPTIONS /api/auth/register
```

with the required CORS headers.

## Verification After Backend Fix

1. Restart the backend/API service.
2. Open:

```text
https://trainers.lurnstack.com/login
```

3. Try trainer login.
4. In browser DevTools Network tab, check:
   - `OPTIONS /api/auth/login` succeeds
   - `POST /api/auth/login` succeeds
   - response includes the token/user payload
5. Confirm the page redirects to:

```text
/trainer-dashboard
```

## Frontend Build Notes

Build command:

```bash
npm run build
```

Upload the generated `build` folder to the aaPanel site for:

```text
https://trainers.lurnstack.com
```

The frontend build is already calling the correct backend:

```text
https://api.lurnstack.com/api/auth/login
```

So the live login failure must be fixed on backend CORS/API gateway configuration.
