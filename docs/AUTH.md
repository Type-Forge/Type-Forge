# Authentication

TypeForge uses **Auth.js (NextAuth v5)** with a **Credentials** provider, **Prisma 7**
talking to **PostgreSQL** (Aurora-ready), **bcrypt** password hashing, and **Zod**
validation. Sessions are **JWT cookie sessions** (the Credentials provider does not
support database sessions).

## Architecture

| Concern            | Where                                                        |
| ------------------ | ----------------------------------------------------------- |
| User schema        | [prisma/schema.prisma](../prisma/schema.prisma)             |
| Prisma config      | [prisma.config.ts](../prisma.config.ts)                     |
| DB client (adapter)| [lib/prisma.ts](../lib/prisma.ts)                           |
| Auth config        | [lib/auth.ts](../lib/auth.ts)                               |
| Validation (Zod)   | [lib/validations/auth.ts](../lib/validations/auth.ts)       |
| Auth.js route      | [app/api/auth/[...nextauth]/route.ts](../app/api/auth/[...nextauth]/route.ts) |
| Registration route | [app/api/auth/register/route.ts](../app/api/auth/register/route.ts) |
| Forms / pages      | `components/auth/*`, `app/signin`, `app/signup`             |
| Session provider   | [components/providers/AuthProvider.tsx](../components/providers/AuthProvider.tsx) |
| Client hook        | [hooks/useAuth.ts](../hooks/useAuth.ts)                     |
| Route protection   | [proxy.ts](../proxy.ts) (optimistic) + [app/profile/layout.tsx](../app/profile/layout.tsx) (authoritative) |

### Route protection model
- **`proxy.ts`** (Next 16's renamed Middleware) does a fast, edge-safe *optimistic*
  redirect based on the presence of the session cookie. Unauthenticated users hitting
  a protected route go to `/signin?callbackUrl=...`; authenticated users hitting
  `/signin`/`/signup` go home.
- **`app/profile/layout.tsx`** does the *authoritative* check with `auth()` server-side.

To protect more routes later (e.g. `/account`, `/leaderboard`), add the prefix to
`PROTECTED_PREFIXES` in `proxy.ts` and add a server `auth()` guard in that route's layout.

### Password Security & Hashing

Passwords are **never** stored as plain text. We utilize a secure, adaptive hashing function to protect credentials:
- **Hashing Algorithm**: We use `bcrypt` (`bcryptjs` library) with `12` salt rounds (work factor) to hash passwords on signup in [app/api/auth/register/route.ts](file:///c:/Users/sayan/typeforge/app/api/auth/register/route.ts).
- **Encoding & Representation**: The resulting bcrypt string (e.g., starting with `$2a$` or `$2b$`) contains the work factor, the salt, and the encrypted checksum. This entire block is represented using a custom base64/radix-64 alphabet (`./`, `0-9`, `A-Z`, `a-z`) and is wire-compatible with hexadecimal-encoded raw binary digests.
- **Verification**: In [lib/auth.ts](file:///c:/Users/sayan/typeforge/lib/auth.ts), the credentials provider retrieves the stored hash and compares incoming plain-text passwords securely using `bcrypt.compare`.

## Setup

### 1. Environment variables
Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — your Postgres/Aurora connection string.
- `AUTH_SECRET` — generate with `openssl rand -base64 33`.

### 2. Provision Aurora PostgreSQL (AWS Console)
1. RDS → **Create database** → **Amazon Aurora** → **PostgreSQL-Compatible**.
2. Set a master username/password; create an initial database name (e.g. `typeforge`).
3. Under **Connectivity**, enable **Public access** (for local dev) and attach a
   security group whose inbound rules allow PostgreSQL (port `5432`) from your IP.
4. After creation, copy the **writer endpoint** and build the URL:
   ```
   postgresql://USER:PASSWORD@your-cluster.cluster-xxxx.<region>.rds.amazonaws.com:5432/typeforge?sslmode=require
   ```
5. Put it in `.env` as `DATABASE_URL`.

> The Prisma driver adapter (`@prisma/adapter-pg`) is wire-compatible with Aurora, so
> nothing in the code changes between local Postgres and Aurora — only `DATABASE_URL`.

### 3. Create the database tables
```bash
npx prisma migrate dev --name init   # creates tables + a migration
npx prisma generate                  # regenerate client (runs automatically with migrate)
```
For production / Aurora applies:
```bash
npx prisma migrate deploy
```

### 4. Run
```bash
npm run dev
```
Visit `/signup` to create an account, then `/profile` (protected).

### Data Sync (Anonymous → Authenticated)

When a user logs in or signs up, the `useSyncOnLogin` hook (in `hooks/useSyncOnLogin.ts`)
automatically merges anonymous localStorage data with the database:

1. **Pull**: Fetches the user's DB data (sessions, drill stats, yolo profiles, settings)
2. **Merge**: Combines with localStorage data, preferring the more recent version
3. **Push**: Saves any localStorage-only records to the DB

This means:
- A user can take 100 tests without signing up
- When they finally create an account, all their progress is preserved
- Data is synced across devices when they log in elsewhere

Key files:
- `app/actions/sync.ts` — Server actions for fetching/pushing data
- `hooks/useSyncOnLogin.ts` — Client hook that triggers the merge
- `components/providers/AuthProvider.tsx` — Wires the hook into the app

## Notes & future work
- The `Session` table from the original issue is intentionally omitted because the
  Credentials provider uses JWT sessions. If you later add OAuth providers (Google,
  GitHub) you can switch to the Prisma adapter + database sessions.
- Social login (Google/GitHub) is fully implemented — see `docs/OAUTH.md` for setup.
