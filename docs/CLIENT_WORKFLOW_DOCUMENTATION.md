# LurnStack Trainer Portal Workflow Documentation

## Overview

The LurnStack Trainer Portal is a dedicated web application for trainers. It allows trainers to create an account, log in securely, manage their profile access, create live classes, and manage uploaded live class sessions from one dashboard.

This portal is designed only for trainers. Student shopping, student learning, cart, and course purchase flows are not part of this application.

## Main Purpose

The trainer portal helps trainers:

- Register as a trainer
- Log in to their trainer account
- Access a private trainer dashboard
- Create live class sessions
- Upload class thumbnails
- Manage scheduled live classes
- Publish, edit, cancel, or delete live classes
- View their account activation status

## User Roles

There is one main user role in this portal:

```text
Trainer
```

Only trainer accounts can access the trainer dashboard.

## Complete Trainer Journey

The complete trainer journey follows this flow:

```text
Trainer opens portal
  -> Trainer signs up or logs in
  -> Trainer enters dashboard
  -> Trainer checks account status
  -> Trainer creates live class
  -> Trainer manages uploaded classes
  -> Trainer publishes, edits, cancels, or deletes classes
  -> Trainer logs out
```

## 1. Trainer Opens The Portal

The trainer opens the trainer portal website:

```text
https://trainers.lurnstack.com
```

If the trainer is already logged in, they are taken to the trainer dashboard.

If the trainer is not logged in, they are asked to log in.

## 2. Trainer Signup Workflow

New trainers can create a trainer account using the signup page.

The signup form collects:

- Full name
- Email address
- Phone number
- Password
- Terms and privacy agreement

After the trainer submits the form:

1. The system checks that the required details are entered correctly.
2. The trainer account is created.
3. The trainer is logged in automatically when possible.
4. The trainer is redirected to the dashboard.

Signup result:

```text
Trainer account created successfully
```

## 3. Trainer Login Workflow

Existing trainers can log in using:

- Email address
- Password

After login:

1. The system verifies the trainer account.
2. The system confirms that the user is a trainer.
3. The trainer is redirected to the dashboard.

If the login details are wrong, the trainer sees an error message and can try again.

Login result:

```text
Trainer enters dashboard
```

## 4. Trainer Dashboard Workflow

The dashboard is the main working area for trainers.

From the dashboard, trainers can:

- View account status
- View dashboard summary
- Create new live classes
- View uploaded classes
- Edit existing classes
- Publish classes
- Cancel classes
- Delete classes
- Log out

The dashboard is protected, so only logged-in trainers can access it.

## 5. Trainer Account Status Workflow

Each trainer account can be active or inactive.

### Active Trainer

An active trainer can:

- Create live classes
- Edit live classes
- Publish live classes
- Cancel live classes
- Delete live classes

### Inactive Trainer

An inactive trainer can view the dashboard, but cannot manage live classes.

If the trainer account is inactive, the system shows a message explaining that class management is restricted.

This helps the business control which trainers are allowed to publish or manage live sessions.

## 6. Create Live Class Workflow

The trainer can create a new live class from the dashboard.

The trainer enters:

- Course title
- Category
- Class title
- Class description
- Scheduled date
- Start time
- End time
- Meeting link
- Optional class thumbnail image

Before saving, the system checks:

- Required fields are completed
- End time is after start time
- Thumbnail image is valid
- Thumbnail size is acceptable

After the class is created:

1. The trainer sees a success message.
2. The class list is refreshed.
3. The trainer is moved to the uploaded classes section.

Create class result:

```text
New live class is saved in the trainer dashboard
```

## 7. Uploaded Classes Workflow

The uploaded classes section shows the trainer's live classes.

For each class, the trainer can see important details such as:

- Course title
- Class title
- Class schedule
- Meeting link
- Thumbnail
- Current class status

Class statuses may include:

- Draft
- Published
- Cancelled
- Completed

## 8. Edit Live Class Workflow

If a trainer wants to change class details, they can edit the class.

The edit workflow:

```text
Trainer selects class
  -> Trainer clicks edit
  -> Existing details appear in the form
  -> Trainer updates details
  -> Trainer saves changes
  -> Updated class appears in uploaded classes
```

Edit class result:

```text
Live class details are updated
```

## 9. Publish Live Class Workflow

Publishing makes the class ready for users to access according to the platform rules.

The publish workflow:

```text
Trainer selects class
  -> Trainer clicks publish
  -> System updates class status
  -> Class appears as published
```

Publish result:

```text
Live class is marked as published
```

## 10. Cancel Live Class Workflow

If a trainer cannot conduct a class, they can cancel it.

The cancel workflow:

```text
Trainer selects class
  -> Trainer clicks cancel
  -> Trainer enters cancellation reason
  -> System saves the cancellation
  -> Class appears as cancelled
```

The cancellation reason is stored with the class.

Cancel result:

```text
Live class is marked as cancelled
```

## 11. Delete Live Class Workflow

If a class should be removed permanently, the trainer can delete it.

The delete workflow:

```text
Trainer selects class
  -> Trainer clicks delete
  -> Confirmation message appears
  -> Trainer confirms delete
  -> Class is removed from the list
```

Delete result:

```text
Live class is removed permanently
```

## 12. Logout Workflow

When the trainer finishes their work, they can log out.

Logout flow:

```text
Trainer clicks logout
  -> Session is cleared
  -> Trainer is redirected to login page
```

Logout result:

```text
Trainer account is safely signed out
```

## Business Workflow Summary

The trainer portal supports the following business process:

```text
Trainer onboarding
  -> Trainer account verification
  -> Trainer dashboard access
  -> Live class creation
  -> Live class management
  -> Published class availability
  -> Ongoing trainer session control
```

## Client-Friendly Feature Summary

| Area | Description |
| --- | --- |
| Trainer Signup | Allows new trainers to create an account |
| Trainer Login | Allows existing trainers to access the portal |
| Protected Dashboard | Keeps trainer tools private and secure |
| Account Status | Controls whether trainers can manage classes |
| Create Class | Allows trainers to schedule new live sessions |
| Upload Thumbnail | Allows trainers to add visual class images |
| Manage Classes | Allows trainers to view and update live classes |
| Publish Class | Marks a class as ready |
| Cancel Class | Cancels a class with a reason |
| Delete Class | Permanently removes a class |
| Logout | Safely signs the trainer out |

## Final Workflow

```text
Open trainer portal
  -> Sign up or log in
  -> Access dashboard
  -> Check active status
  -> Create live class
  -> Manage uploaded classes
  -> Publish, edit, cancel, or delete classes
  -> Log out
```

This workflow gives trainers a focused portal to manage live class activity without mixing student-side features into the trainer experience.
