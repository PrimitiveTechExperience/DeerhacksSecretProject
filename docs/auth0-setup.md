# Auth0 Setup

This app supports two auth providers:

- `local` (default)
- `auth0`

Set provider using:

```env
NEXT_PUBLIC_AUTH_PROVIDER=auth0
```

## Required Auth0 environment variables

```env
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_BASE_URL=http://localhost:3000
```

Optional:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Auth0 Application settings

- Allowed Callback URLs:
  - `http://localhost:3000/api/auth/callback`
- Allowed Logout URLs:
  - `http://localhost:3000/`
- Allowed Web Origins:
  - `http://localhost:3000`

## Routes used

- `GET /api/auth/login` -> Auth0 Universal Login
- `GET /api/auth/signup` -> Auth0 Universal Signup (`screen_hint=signup`)
- `GET /api/auth/callback` -> code exchange + session cookie
- `GET /api/auth/logout` -> clear app cookie + Auth0 logout
- `GET /api/auth/session` -> current session payload

## Notes

- Local provider routes still exist for development fallback.
- Auth0 integration is isolated via `lib/auth/config.ts` and adapter layer in `lib/auth/client.ts`.

