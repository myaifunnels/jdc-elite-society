<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

This is a single Next.js 16 (Turbopack) app. Standard commands live in `package.json` (`dev`, `build`, `lint`, `start`). Dependencies are installed by the startup update script, so you normally just run the service.

- Run the app in development with `npm run dev` (serves on `http://localhost:3000`). Use `npm run build` for a production build and `npm run lint` for ESLint.
- The database is OPTIONAL for local dev. `src/lib/auth-store.ts` (and the other `*-store.ts` modules) fall back to in-memory storage when `DATABASE_URL` is unset. Set `DATABASE_URL` to a Postgres connection string only when you need persistence; tables are auto-created on first use.
- A seed admin account is created automatically: `admin@gmail.com` / `admin` (override with `ADMIN_EMAIL` / `ADMIN_PASSWORD`). Use it to reach the CRM at `/dashboard`.
- Gotcha: without `DATABASE_URL`, in-memory CRM/user state is per-module under Turbopack, so records created via API routes (e.g. `POST /api/inquiries`) may not appear in server-rendered dashboard pages and reset on reload. This is expected in dev — use a real `DATABASE_URL` for shared, persistent data.
- All third-party integrations are optional and degrade gracefully when their env vars are absent: Google Maps (`NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`), Cloudflare R2 (`R2_*`), GoHighLevel (`GHL_*`), and Resend email (`RESEND_API_KEY`, `MAIL_FROM`). See `render.yaml` for the full list.
