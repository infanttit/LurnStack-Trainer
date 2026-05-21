# LurnStack Trainer App Workflow

This document explains the complete trainer portal workflow from opening the live site to managing live classes.

## 1. Live Site Access

Trainer portal URL:

```text
https://trainers.lurnstack.com
```

When a trainer opens the site, the React app loads from the deployed production `build` folder.

The app uses browser routing, so the frontend server must fallback unknown routes to:

```text
index.html
```

Required Nginx rule:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 2. Application Startup Workflow

Startup flow:

```text
Browser
  -> index.html
  -> src/index.js
  -> src/App.js
  -> AppProviders
  -> AuthProvider
  -> BrowserRouter
  -> AppRouter
```

During startup:

1. React renders the app.
2. `AuthProvider` checks local/session storage.
3. If a saved token and user exist, the user is treated as logged in.
4. If no valid auth data exists, protected pages redirect to login.

## 3. Route Workflow

Current routes:

```text
/                   -> redirects to /trainer-dashboard
/login              -> trainer login page
/signup             -> trainer signup page
/trainer-dashboard  -> protected trainer dashboard
*                   -> redirects to /trainer-dashboard
```

Protected route rule:

```text
/trainer-dashboard requires logged-in user with role = trainer
```

If the user is not logged in:

```text
/trainer-dashboard -> /login
```

If the user is logged in but is not a trainer:

```text
/trainer-dashboard -> /login
```

## 4. Trainer Signup Workflow

Page:

```text
src/auth/pages/SignupPage.jsx
```

API file:

```text
src/auth/api/authApi.js
```

Signup flow:

```text
Trainer fills signup form
  -> frontend validates fields
  -> frontend sends register request
  -> backend creates trainer account
  -> frontend stores token and user
  -> trainer redirects to /trainer-dashboard
```

Backend endpoint:

```text
POST /api/auth/register
```

Trainer signup sends:

```text
role: TRAINER
```

The frontend expects the backend response to include user details and, ideally, a token.

If no token is returned after register, the frontend attempts login with the same credentials.

## 5. Trainer Login Workflow

Page:

```text
src/auth/pages/LoginPage.jsx
```

Login flow:

```text
Trainer enters email and password
  -> frontend validates form
  -> frontend sends login request
  -> backend returns token and user
  -> frontend checks user role
  -> frontend stores token and user
  -> trainer redirects to /trainer-dashboard
```

Backend endpoint:

```text
POST /api/auth/login
```

The frontend accepts login only when:

```text
user.role === "trainer"
```

If the backend returns a student account, the frontend blocks access.

## 6. Auth Storage Workflow

File:

```text
src/auth/model/authStorage.js
```

Storage keys:

```text
lurnstack:auth:user:v1
lurnstack:auth:token:v1
```

Remember-me behavior:

```text
Remember checked   -> localStorage
Remember unchecked -> sessionStorage
```

Logout clears both:

```text
localStorage
sessionStorage
```

## 7. API Request Workflow

Shared API client:

```text
src/shared/api/axiosClient.js
```

API base URL:

```text
src/shared/config/env.js
```

Production API:

```text
https://api.lurnstack.com
```

For authenticated requests, the frontend automatically sends:

```http
Authorization: Bearer <token>
```

For image upload requests, the frontend uses:

```text
FormData
```

## 8. Trainer Dashboard Load Workflow

Dashboard page:

```text
src/trainers/pages/TrainerDashboardPage.jsx
```

Trainer API:

```text
src/trainers/api/trainerSessionsApi.js
```

When dashboard opens:

```text
/trainer-dashboard
  -> check trainer auth
  -> load trainer sessions
  -> load trainer active/inactive status
  -> show dashboard UI
```

Initial dashboard API calls:

```text
GET /api/trainer/sessions
GET /api/trainer/status
```

Trainer status is checked again every 30 seconds.

## 9. Trainer Active/Inactive Workflow

Backend endpoint:

```text
GET /api/trainer/status
```

If trainer is active:

```text
Trainer can create, edit, publish, cancel, and delete live classes.
```

If trainer is inactive:

```text
Trainer can view dashboard but cannot manage live classes.
```

The frontend blocks actions and shows:

```text
Your trainer account is inactive. You cannot create new classes.
```

## 10. Create Live Class Workflow

Dashboard tab:

```text
Create live class
```

Create flow:

```text
Trainer opens create tab
  -> fills course details
  -> selects date and time
  -> adds meeting link
  -> optionally uploads thumbnail
  -> frontend validates fields
  -> frontend sends FormData to backend
  -> backend creates session
  -> frontend reloads class list
  -> trainer moves to uploaded classes tab
```

Backend endpoint:

```text
POST /api/trainer/sessions
```

Payload type:

```text
multipart/form-data
```

Fields:

```text
courseTitle
category
description
classTitle
scheduledDate
startTime
endTime
meetingLink
thumbnail
```

Validation rules:

```text
All required fields must be filled.
End time must be after start time.
Thumbnail must be an image.
Thumbnail must be 5 MB or smaller.
```

## 11. Edit Live Class Workflow

Edit flow:

```text
Trainer clicks edit on a class
  -> existing class data fills create form
  -> trainer updates details
  -> frontend validates fields
  -> frontend sends update request
  -> backend updates session
  -> frontend reloads class list
```

Backend endpoint:

```text
PATCH /api/trainer/sessions/:id
```

Payload type:

```text
multipart/form-data
```

## 12. Publish Live Class Workflow

Publish flow:

```text
Trainer clicks publish
  -> frontend sends publish request
  -> backend marks class as published
  -> frontend reloads class list
```

Backend endpoint:

```text
PATCH /api/trainer/sessions/:id/publish
```

## 13. Cancel Live Class Workflow

Cancel flow:

```text
Trainer clicks cancel
  -> confirmation dialog opens
  -> trainer enters cancellation reason
  -> frontend sends cancel request
  -> backend marks class as cancelled
  -> frontend reloads class list
```

Backend endpoint:

```text
PATCH /api/trainer/sessions/:id/cancel
```

Payload:

```json
{
  "reason": "Cancellation reason"
}
```

## 14. Delete Live Class Workflow

Delete flow:

```text
Trainer clicks delete
  -> confirmation dialog opens
  -> trainer confirms delete
  -> frontend sends delete request
  -> backend deletes session
  -> frontend reloads class list
```

Backend endpoint:

```text
DELETE /api/trainer/sessions/:id
```

## 15. Live CORS Workflow

Live frontend origin:

```text
https://trainers.lurnstack.com
```

Backend origin:

```text
https://api.lurnstack.com
```

Because these are different origins, browser requests go through CORS.

For login/register, the browser sends:

```text
OPTIONS /api/auth/login
OPTIONS /api/auth/register
```

Then, if allowed, the browser sends:

```text
POST /api/auth/login
POST /api/auth/register
```

The backend must allow:

```http
Access-Control-Allow-Origin: https://trainers.lurnstack.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Without these headers, the browser blocks login before the real request is completed.

## 16. Deployment Workflow

Build command:

```bash
npm run build
```

Deployment flow:

```text
Run npm run build
  -> build folder is generated
  -> upload build folder contents to aaPanel
  -> point trainers.lurnstack.com document root to build
  -> enable SPA fallback rule
  -> verify login and dashboard
```

## 17. Post-Deployment Verification

After deploying frontend:

1. Open:

```text
https://trainers.lurnstack.com/login
```

2. Try trainer login.
3. Confirm redirect:

```text
/trainer-dashboard
```

4. Confirm dashboard calls work:

```text
GET /api/trainer/status
GET /api/trainer/sessions
```

5. Create a test live class.
6. Publish the class.
7. Cancel or delete the test class if needed.

## 18. Common Live Issues

### Login blocked by CORS

Cause:

```text
Backend does not allow https://trainers.lurnstack.com
```

Fix:

```text
Update backend CORS config and allow OPTIONS preflight requests.
```

### Refresh shows 404

Cause:

```text
Frontend server does not fallback to index.html.
```

Fix:

```text
Add Nginx try_files SPA fallback rule.
```

### Dashboard opens but actions fail

Possible causes:

```text
Trainer account is inactive.
Token is missing or expired.
Backend trainer session endpoint is failing.
```

Check:

```text
GET /api/trainer/status
GET /api/trainer/sessions
Browser DevTools Network tab
```
