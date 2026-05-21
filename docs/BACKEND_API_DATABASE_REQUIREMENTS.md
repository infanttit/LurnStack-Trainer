# Backend API and Database Requirements For Trainer Portal

## Purpose

This document is for the backend developer.

The trainer frontend is already built with the current workflow. The backend needs to provide proper API endpoints, database tables, and response formats so the trainer portal can work correctly on live.

This document should be used as the backend development prompt/specification.

## Important Decision

The current frontend workflow is mostly correct.

We do not need to change everything in the frontend.

The backend should create APIs and database structure based on this workflow:

```text
Trainer signup
  -> Trainer login
  -> Trainer dashboard access
  -> Trainer active/inactive status check
  -> Trainer creates live class
  -> Trainer edits live class
  -> Trainer publishes live class
  -> Trainer cancels live class
  -> Trainer deletes live class
```

Frontend changes are only needed if the backend changes the response format, field names, or business rules.

## User Role Required

The backend must support this role:

```text
TRAINER
```

Trainer accounts must be stored separately by role or stored in the users table with a role column.

Only users with trainer role should be allowed to access trainer APIs.

## Required Database Tables

The backend should support at least these data areas:

```text
users / trainers
trainer_sessions
trainer_status
```

The exact table names can follow the backend team's existing standard.

## 1. Trainer User Data

Required trainer fields:

```text
id
fullName
email
phoneNumber
passwordHash
role
isActive
createdAt
updatedAt
```

Expected role value:

```text
TRAINER
```

Expected active status:

```text
true / false
```

Business rule:

```text
Only active trainers can create, edit, publish, cancel, or delete live classes.
Inactive trainers can login and view dashboard, but actions must be blocked.
```

## 2. Trainer Signup API

Endpoint:

```text
POST /api/auth/register
```

Request body:

```json
{
  "FULL_NAME": "Trainer Name",
  "EMAIL_ADDRESS": "trainer@example.com",
  "PHONE_NUMBER": "9876543210",
  "PASSWORD": "Password@123",
  "role": "TRAINER"
}
```

Expected success response:

```json
{
  "success": true,
  "message": "Trainer registered successfully",
  "token": "jwt-token",
  "user": {
    "id": "trainer-id",
    "fullName": "Trainer Name",
    "email": "trainer@example.com",
    "phoneNumber": "9876543210",
    "role": "trainer",
    "isActive": false
  }
}
```

Important:

```text
New trainers can be inactive by default if admin approval is required.
```

## 3. Trainer Login API

Endpoint:

```text
POST /api/auth/login
```

Request body:

```json
{
  "EMAIL_ADDRESS": "trainer@example.com",
  "PASSWORD": "Password@123"
}
```

Expected success response:

```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "trainer-id",
    "fullName": "Trainer Name",
    "email": "trainer@example.com",
    "phoneNumber": "9876543210",
    "role": "trainer",
    "isActive": true
  }
}
```

Business rule:

```text
The frontend will allow dashboard access only when user.role is trainer.
```

## 4. Trainer Status API

Endpoint:

```text
GET /api/trainer/status
```

Authentication:

```text
Bearer token required
```

Expected success response:

```json
{
  "success": true,
  "data": {
    "isActive": true
  }
}
```

Purpose:

```text
Frontend uses this API to check whether trainer can manage live classes.
```

## 5. Trainer Live Session Table

Required fields:

```text
id
trainerId
courseId
title
subtitle
description
startTime
endTime
timezone
meetingLink
thumbnail
isRecurring
recurrenceType
status
todayStatus
todayCancellationReason
createdAt
updatedAt
```

Allowed status values:

```text
active
paused
ended
```

Status rule:

```text
New sessions should be active by default.
Paused sessions should temporarily stop the daily class.
Ended sessions are permanently stopped.
Today's class can be cancelled separately without ending the recurring session.
```

## 6. Get Trainer Sessions API

Endpoint:

```text
GET /api/trainer/sessions
```

Authentication:

```text
Bearer token required
```

Expected success response:

```json
{
  "success": true,
  "data": [
    {
      "id": "session-id",
      "trainerId": "trainer-id",
      "trainerName": "Trainer Name",
      "trainerEmail": "trainer@example.com",
      "courseId": "course-id",
      "courseTitle": "React Frontend Development",
      "title": "React Live Class",
      "subtitle": "Daily practical session",
      "description": "Live session description",
      "startTime": "13:00",
      "endTime": "14:00",
      "timezone": "Asia/Kolkata",
      "meetingLink": "https://meet.google.com/example",
      "thumbnail": "/uploads/session-thumbnail.jpg",
      "isRecurring": true,
      "recurrenceType": "daily",
      "status": "active",
      "todayStatus": "upcoming",
      "isTodayCancelled": false,
      "todayCancellationReason": "",
      "createdAt": "2026-05-21T10:00:00.000Z",
      "updatedAt": "2026-05-21T10:00:00.000Z"
    }
  ]
}
```

Business rule:

```text
Return only sessions that belong to the logged-in trainer, or include trainerEmail/trainerId so frontend can filter correctly.
```

## 7. Create Trainer Session API

Endpoint:

```text
POST /api/trainer/sessions
```

Authentication:

```text
Bearer token required
```

Request type:

```text
multipart/form-data
```

Fields:

```text
courseId
title
subtitle
description
startTime
endTime
timezone
meetingLink
isRecurring
recurrenceType
thumbnail
```

Important:

```text
The frontend sends multipart/form-data when thumbnail is selected.
The thumbnail field is optional.
If no thumbnail is selected, backend may also accept JSON with the same text fields.
```

Expected success response:

```json
{
  "success": true,
  "message": "Live class created successfully",
  "data": {
    "id": "session-id",
    "courseId": "course-id",
    "courseTitle": "React Frontend Development",
    "title": "React Live Class",
    "subtitle": "Daily practical session",
    "description": "Live class description",
    "startTime": "13:00",
    "endTime": "14:00",
    "timezone": "Asia/Kolkata",
    "meetingLink": "https://meet.google.com/example",
    "thumbnail": "/uploads/session-thumbnail.jpg",
    "isRecurring": true,
    "recurrenceType": "daily",
    "status": "active"
  }
}
```

Business rules:

```text
Only active trainers can create sessions.
Inactive trainers must receive 403 response.
Thumbnail upload should be optional.
```

## 8. Update Trainer Session API

Endpoint:

```text
PATCH /api/trainer/sessions/:id
```

Authentication:

```text
Bearer token required
```

Request type:

```text
multipart/form-data
```

Fields:

```text
title
subtitle
description
startTime
endTime
timezone
meetingLink
isRecurring
recurrenceType
thumbnail
```

Important:

```text
The thumbnail field is optional on update.
If a new thumbnail is sent, replace the old thumbnail.
If no thumbnail is sent, keep the old thumbnail.
```

Business rules:

```text
Only the owner trainer can update their own session.
Only active trainers can update sessions.
Inactive trainers must receive 403 response.
```

Expected success response:

```json
{
  "success": true,
  "message": "Live class updated successfully",
  "data": {
    "id": "session-id",
    "status": "draft"
  }
}
```

## 9. Pause Trainer Session API

Endpoint:

```text
POST /api/trainer/sessions/:id/pause
```

Authentication:

```text
Bearer token required
```

Business rules:

```text
Only the owner trainer can pause their own session.
Only active trainers can pause sessions.
Pause should temporarily stop the recurring daily class.
```

Expected success response:

```json
{
  "success": true,
  "message": "Recurring session paused successfully",
  "data": {
    "id": "session-id",
    "status": "paused"
  }
}
```

## 10. Resume Trainer Session API

Endpoint:

```text
POST /api/trainer/sessions/:id/resume
```

Authentication:

```text
Bearer token required
```

Business rules:

```text
Only the owner trainer can resume their own session.
Only active trainers can resume sessions.
Resume should make the recurring daily class active again.
```

Expected success response:

```json
{
  "success": true,
  "message": "Recurring session resumed successfully",
  "data": {
    "id": "session-id",
    "status": "active"
  }
}
```

## 11. End Trainer Session Permanently API

Endpoint:

```text
POST /api/trainer/sessions/:id/end
```

Authentication:

```text
Bearer token required
```

Business rules:

```text
Only the owner trainer can end their own session.
Only active trainers can end sessions.
End should permanently stop the recurring daily session.
```

Expected success response:

```json
{
  "success": true,
  "message": "Recurring session ended successfully",
  "data": {
    "id": "session-id",
    "status": "ended"
  }
}
```

## 12. Cancel Only Today's Class API

Endpoint:

```text
POST /api/trainer/sessions/:id/cancel-today
```

Authentication:

```text
Bearer token required
```

Request body:

```json
{
  "reason": "Trainer unavailable today"
}
```

Business rules:

```text
Only the owner trainer can cancel today's class.
Only active trainers can cancel today's class.
Cancellation reason is required.
This should not stop the recurring session for future days.
```

Expected success response:

```json
{
  "success": true,
  "message": "Today's class cancelled successfully",
  "data": {
    "id": "session-id",
    "isTodayCancelled": true,
    "todayCancellationReason": "Trainer unavailable today"
  }
}
```

## 13. Restore Today's Cancelled Class API

Endpoint:

```text
DELETE /api/trainer/sessions/:id/cancel-today
```

Authentication:

```text
Bearer token required
```

Business rules:

```text
Only the owner trainer can restore today's class.
Only active trainers can restore today's class.
This should remove today's cancellation and keep the recurring session active.
```

Expected success response:

```json
{
  "success": true,
  "message": "Today's class restored successfully",
  "data": {
    "id": "session-id",
    "isTodayCancelled": false,
    "todayCancellationReason": ""
  }
}
```

## 14. Delete Trainer Session API

Endpoint:

```text
DELETE /api/trainer/sessions/:id
```

Authentication:

```text
Bearer token required
```

Business rules:

```text
Only the owner trainer can delete their own session.
Only active trainers can delete sessions.
Delete should permanently remove the session record.
Use POST /api/trainer/sessions/:id/end if the business wants to keep history but stop future classes.
```

Expected success response:

```json
{
  "success": true,
  "message": "Recurring session deleted successfully"
}
```

## 15. Required Error Responses

Unauthorized:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

Forbidden inactive trainer:

```json
{
  "success": false,
  "message": "Action restricted. Inactive trainers cannot create classes."
}
```

Not found:

```json
{
  "success": false,
  "message": "The live class could not be found."
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed"
}
```

## 16. Required CORS Setup

The backend must allow the live trainer frontend:

```text
https://trainers.lurnstack.com
```

Required CORS support:

```text
OPTIONS /api/auth/login
OPTIONS /api/auth/register
OPTIONS /api/trainer/status
OPTIONS /api/trainer/sessions
```

Required headers:

```http
Access-Control-Allow-Origin: https://trainers.lurnstack.com
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Without this, live login and trainer APIs will be blocked by the browser.

## 17. Backend Developer Prompt

Use this exact requirement:

```text
Create backend support for the LurnStack Trainer Portal.

The trainer frontend is already built. Please create the required database tables and API endpoints for trainer signup, trainer login, trainer active/inactive status, and trainer live class management.

Required role:
TRAINER

Required APIs:
POST /api/auth/register
POST /api/auth/login
GET /api/trainer/courses
GET /api/trainer/status
GET /api/trainer/sessions
GET /api/trainer/sessions/:sessionId
POST /api/trainer/sessions
PATCH /api/trainer/sessions/:id
POST /api/trainer/sessions/:id/pause
POST /api/trainer/sessions/:id/resume
POST /api/trainer/sessions/:id/end
DELETE /api/trainer/sessions/:id
POST /api/trainer/sessions/:id/cancel-today
DELETE /api/trainer/sessions/:id/cancel-today

Trainer sessions must support:
courseId, courseTitle, title, subtitle, description, startTime, endTime, timezone, meetingLink, thumbnail, isRecurring, recurrenceType, status, todayStatus, isTodayCancelled, todayCancellationReason, trainerId, trainerName, trainerEmail.

Create and update session endpoints must accept multipart/form-data when thumbnail is uploaded.
Thumbnail field name must be thumbnail.
Thumbnail should be optional.

Only active trainers can create, edit, pause, resume, end, delete, cancel today, or restore today's class.
Inactive trainers can login and view dashboard but cannot manage sessions.

All protected trainer APIs must require Bearer token authentication.
All session actions must verify that the logged-in trainer owns the session.

Please also configure CORS to allow:
https://trainers.lurnstack.com

The response format should use:
success, message, data, user, token.
```

## Final Answer About Current Flow

The current frontend flow is correct for a trainer portal.

Do not change everything now.

Backend should first build the APIs and database based on this document. After backend is ready, test the frontend. Only adjust frontend if any backend field names or response formats are different.
