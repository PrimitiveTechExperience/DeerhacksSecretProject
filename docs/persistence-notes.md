# User Persistence Plan (SQLite)

This project includes a schema at `db/schema.sql` and repository skeleton at `lib/db/repository.ts`.

## Runtime setup

Install SQLite driver:

```bash
npm i better-sqlite3
```

Optional DB path override:

```env
SQLITE_DB_PATH=./db/app.sqlite
```

Health check endpoint:

- `GET /api/db/health`

## What is stored per user

- `users`: identity/profile mapping (`local` now, `auth0` later).
- `user_settings`: save policy preferences.
- `learning_progress`: completed roadmap levels by track (`practical`, `theory`).
- `simulator_snapshots`: saved simulator parameter states.
- `theory_chat_threads` and `theory_chat_messages`: solution-review chat history and attachments metadata.
- `auth_sessions`: optional server-managed sessions for future hardening.

## Save policy options

- `manual_only`: save only when user presses save action.
- `auto_interval`: periodic snapshot save every N seconds.
- `on_level_complete`: snapshot when a level is passed.
- `on_exit`: snapshot when leaving simulator route.

Use `user_settings.save_policy` + `auto_save_seconds` to drive this behavior.

## Auth0 migration path

- Keep `users.id` as internal app id.
- Fill `users.auth_provider='auth0'` and `users.provider_subject=<auth0_sub>`.
- Replace local auth routes with Auth0 middleware/callback routes.
- Keep app-level tables unchanged (`learning_progress`, `simulator_snapshots`, `theory_chat_*`).
