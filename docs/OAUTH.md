# OAuth Setup (Google & GitHub)

TypeForge supports Google and GitHub OAuth login via Auth.js v5. The buttons always appear on the auth pages, but they only work once you add the OAuth credentials to your `.env` file.

## Quick Setup

### Google OAuth

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `TypeForge`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-vercel-domain.vercel.app/api/auth/callback/google` (prod)
6. Copy the **Client ID** and **Client Secret**

### GitHub OAuth

1. Go to [GitHub → Developer Settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Application name: `TypeForge`
4. Homepage URL: `http://localhost:3000` (dev) or `https://your-vercel-domain.vercel.app` (prod)
5. Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github` (dev)
   - `https://your-vercel-domain.vercel.app/api/auth/callback/github` (prod)
6. Click **Register application**
7. Copy the **Client ID**
8. Generate a new **Client Secret** and copy it

### Add to `.env`

```bash
# Google
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# GitHub
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

### Add to Vercel (Production)

In the Vercel dashboard → Your project → Settings → Environment Variables, add the same variables above.

## How It Works

- The `SocialAuth` component conditionally shows Google/GitHub buttons
- Auth.js auto-reads `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- If the env vars are empty/missing, the providers are not registered (no runtime error)
- OAuth users get a JWT session (same as credentials users)
- The `passwordHash` field is `null` for OAuth-only users

## Data Sync for OAuth Users

When an OAuth user logs in for the first time:
1. A new `User` record is created via Auth.js callbacks (if not exists)
2. The `useSyncOnLogin` hook fires
3. Any anonymous localStorage data (sessions, drill stats, yolo profiles) is merged with the DB
4. The user's progress is preserved across devices

## Notes

- No database session rows are created (JWT strategy)
- The `image` field from OAuth profiles is available via `session.user.image`
- Users can link both OAuth and email/password to the same account (by using the same email)
