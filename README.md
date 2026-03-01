# Robot Kinematics Learning App

An interactive web app for learning robot kinematics through a browser‑based simulator, guided learning roadmap, and AI coach. Built with Next.js App Router, Tailwind CSS, and a Turso (hosted SQLite) backend.

## Features

- **Landing page** with marketing copy and call‑to‑action to sign up and start learning.
- **Learning map** at `/learn` with three tracks:
    - Practical simulator levels.
    - Theory + math levels (with LaTeX/KaTeX rendering).
    - Pick & Place demo levels.
- **Interactive simulator** at `/app` and `/simulator` with:
    - Adjustable continuum robot parameters.
    - Level evaluation and completion tracking.
- **Pick & Place demo** at `/pick-place` with a dedicated control panel and progress tracking.
- **AI coach** endpoints that provide hints, theory help, and optional voice narration via external AI providers.
- **Auth0 authentication** (GitHub/Google via Universal Login) with a local session cookie.
- **Persistent progress** stored in Turso in production, with optional local SQLite for development.

## Tech stack

- **Framework:** Next.js 16 (App Router, React Server/Client Components).
- **UI:** React, Tailwind CSS, Radix UI primitives, shadcn‑style components.
- **Auth:** Auth0 (OAuth) plus a simple session cookie helper.
- **Database:**
    - Turso via `@libsql/client` in production.
    - `better-sqlite3` for local SQLite when Turso is not configured.
- **AI / TTS:**
    - Gemini (or compatible) for the coach API.
    - ElevenLabs (or compatible) for voice narration.

## Project structure

High‑level layout:

- `app/`
    - `page.tsx` – marketing landing page.
    - `learn/` – learning map UI and track selection.
    - `app/`, `simulator/`, `pick-place/` – simulator and demo experiences.
    - `api/` – Next.js App Router API routes (auth, coach, AI, narrate, user progress/settings, DB health).
- `components/`
    - `landing/` – hero, features, how‑it‑works, navbar, footer.
    - `simulator/` – simulator shell, control panel, coach panel, Unity placeholders.
    - `learn/` – learning map board.
    - `auth/` – auth buttons and provider.
    - `ui/` – shared UI primitives (buttons, dialogs, sliders, etc.).
- `lib/`
    - `levels.ts`, `theory-levels.ts`, `pick-place-levels.ts` – level definitions and world progress helpers.
    - `learning-progress.ts`, `pick-place-progress.ts` – client‑side progress helpers.
    - `auth/` – Auth0 config, server helpers, and session utilities.
    - `db/` – repository implementations for SQLite and Turso, adapter, and types.
    - `ai/` – AI usage helpers used by the coach and narration routes.
- `db/schema.sql` – canonical SQL schema used by both SQLite and Turso.
- `docs/`
    - `auth0-setup.md` – Auth0 tenant and application configuration.
    - `unity-webgl-integration.md` – notes on integrating a Unity WebGL build.
    - `persistence-notes.md` – notes on persistence strategy.

## Getting started (local development)

1. **Install prerequisites**
    - Node.js 20+ (recommended).
    - A package manager: `npm` (or `pnpm`/`yarn` if you prefer).

2. **Install dependencies**

    ```bash
    npm install
    # or
    # pnpm install
    ```

3. **Configure environment variables**
    - Copy `.env.example` to `.env.local` and fill in the required values.
    - For a minimal local setup you need:
        - Auth0 credentials (domain, client id/secret, base URL).
        - AI provider keys if you want the coach and narration to work.
    - Database options:
        - **Local SQLite:** comment out the Turso variables and (optionally) set `SQLITE_DB_PATH`. The app will create and migrate `db/app.sqlite` automatically using `db/schema.sql`.
        - **Turso (recommended for prod‑like testing):** set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`. The app will connect to Turso and apply `db/schema.sql` on first use.

4. **Run the dev server**

    ```bash
    npm run dev
    ```

    Then open http://localhost:3000 in your browser.

## Auth and persistence

- Auth0 integration and callback/login/logout routes are documented in `docs/auth0-setup.md`.
- User progress, theory chat threads, simulator snapshots, and settings all share the same schema defined in `db/schema.sql` and are accessed through the repositories in `lib/db/`.
- In production (e.g. Vercel), set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` so the app uses Turso for all persistence.

## Scripts

- `npm run dev` – start the Next.js dev server.
- `npm run build` – create a production build.
- `npm run start` – run the production build.
- `npm run lint` – run ESLint over the project (requires eslint to be installed globally or added to devDependencies).

## Deployment notes

- The app is designed to run well on Vercel:
    - Next.js App Router APIs map cleanly to serverless functions.
    - Filesystem is treated as read‑only; all writes go through Turso.
- Make sure to configure the same environment variables on Vercel that you use in `.env.local` for Auth0, AI providers, and Turso.

## License

This repository is provided for educational and internal project use. Add your license of choice here.
