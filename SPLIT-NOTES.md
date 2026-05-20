# LurnStack Trainer App

Host this build on `https://trainers.lurnstack.com`.

This app is trainer-only:

- Trainer signup always sends `role: "trainer"`.
- Trainer login always checks for a trainer account.
- Only login, signup, and trainer dashboard routes are included.
- Student shopping and learning pages are not routed in this build.

Use the same backend API:

```env
REACT_APP_API_BASE_URL=https://api.lurnstack.com
```

Build:

```bash
npm run build
```

