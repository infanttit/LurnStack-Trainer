# Trainer Attendance Backend API

This frontend already has the trainer attendance page at:

```text
/trainer/attendance
```

It loads trainer sessions, then calls:

```text
GET /api/trainer/sessions/:sessionId/attendance
```

The backend must implement or confirm this endpoint.

## Required Endpoint

```http
GET /api/trainer/sessions/:sessionId/attendance
Authorization: Bearer <trainer_jwt>
```

## Security Rule

Trainer can view attendance only for sessions created by that trainer.

Backend flow:

```text
Read trainerId from JWT
Find session by :sessionId
Verify session.trainerId === trainerId
If not, return 403
Query attendance rows for sessionId
Join users/students for student name and email
Return summary counts and student list
```

## Status Mapping

Map attendance statuses like this:

```text
joined  -> present
present -> present
late    -> late
absent  -> absent
```

Present and late can appear immediately. Absent should appear only after the session has ended and attendance has been finalized.

## Expected Response

```json
{
  "success": true,
  "data": {
    "sessionId": "526b9eed-426a-4140-97b3-de4aa095f5a2",
    "sessionTitle": "AWS",
    "totalStudents": 1,
    "presentCount": 1,
    "lateCount": 0,
    "absentCount": 0,
    "attendedCount": 1,
    "attendancePercentage": 100,
    "students": [
      {
        "studentId": 1,
        "fullName": "Student Name",
        "email": "student@email.com",
        "status": "present",
        "firstJoinedAt": "2026-05-22T12:49:35+05:30",
        "lastJoinedAt": "2026-05-22T12:49:35+05:30",
        "joinCount": 1
      }
    ]
  }
}
```

## Counting Rules

```text
presentCount = students with mapped status present
lateCount = students with mapped status late
absentCount = students with status absent, only after finalization
attendedCount = presentCount + lateCount
totalStudents = total enrolled/expected students for the session
attendancePercentage = attendedCount / totalStudents * 100
```

If `totalStudents` is `0`, return `attendancePercentage: 0`.

## Error Responses

Unauthorized:

```json
{
  "success": false,
  "message": "Please log in as a trainer to view attendance."
}
```

Forbidden:

```json
{
  "success": false,
  "message": "You can view attendance only for sessions created by you."
}
```

Not found:

```json
{
  "success": false,
  "message": "Attendance is not available for this session yet."
}
```

## Example Express-Style Pseudocode

```js
router.get("/api/trainer/sessions/:sessionId/attendance", requireTrainerAuth, async (req, res) => {
  const trainerId = req.user.id;
  const { sessionId } = req.params;

  const session = await LiveSession.findOne({
    where: { id: sessionId, trainerId },
  });

  if (!session) {
    return res.status(403).json({
      success: false,
      message: "You can view attendance only for sessions created by you.",
    });
  }

  const rows = await Attendance.findAll({
    where: { sessionId },
    include: [{ model: User, as: "student", attributes: ["id", "fullName", "email"] }],
  });

  const students = rows.map((row) => {
    const status = row.status === "joined" ? "present" : row.status;
    return {
      studentId: row.student.id,
      fullName: row.student.fullName,
      email: row.student.email,
      status,
      firstJoinedAt: row.firstJoinedAt,
      lastJoinedAt: row.lastJoinedAt,
      joinCount: row.joinCount || 0,
    };
  });

  const presentCount = students.filter((student) => student.status === "present").length;
  const lateCount = students.filter((student) => student.status === "late").length;
  const absentCount = students.filter((student) => student.status === "absent").length;
  const attendedCount = presentCount + lateCount;
  const totalStudents = students.length;
  const attendancePercentage = totalStudents ? (attendedCount / totalStudents) * 100 : 0;

  return res.json({
    success: true,
    data: {
      sessionId: session.id,
      sessionTitle: session.title,
      totalStudents,
      presentCount,
      lateCount,
      absentCount,
      attendedCount,
      attendancePercentage,
      students,
    },
  });
});
```
