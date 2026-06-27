# TypeForge — Architecture Overview

> A premium typing speed trainer with real-time multiplayer battles, adaptive drill practice, and a YOLO letter-mastery mode. Built with Next.js 16, Prisma 7, PostgreSQL (Aurora-ready), Auth.js v5, Zustand, and WebSockets.

---

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [Authentication Flow](#authentication-flow)
5. [Typing Engine & State Management](#typing-engine--state-management)
6. [Multiplayer / WebSocket System](#multiplayer--websocket-system)
7. [Page & Route Map](#page--route-map)
8. [Component Architecture](#component-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [File Structure Reference](#file-structure-reference)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│  Next.js 16 App (React 19 + Zustand stores)                    │
│  ├── Typing Engine (keystroke capture, WPM calc, caret)         │
│  ├── 7 Zustand Stores (typing, stats, settings, battle,        │
│  │   multiplayer, drill, yolo)                                  │
│  └── WebSocket Client (multiplayer-store.ts)                   │
│                                                                 │
└────────────────────┬────────────────────┬───────────────────────┘
                     │                    │
            Next.js API Routes     WebSocket Server
            (Server Actions)       (standalone Node.js)
                     │                    │
                     ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL (Neon → Aurora)                  │
│                                                                 │
│  Prisma 7 + @prisma/adapter-pg (driver adapter)                │
│  Models: User, UserSettings, SessionResult, YoloProfile,       │
│          DrillProfile, LeaderboardEntry, FriendRequest,         │
│          Friendship, BattleRoom, BattleHistory                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.9 |
| Language | TypeScript | 5.x |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS | 4.x |
| Animation | motion (Framer) | 12.40.0 |
| State | Zustand | 5.0.14 |
| ORM | Prisma | 7.8.0 |
| Database | PostgreSQL (Neon, Aurora-ready) | — |
| Auth | Auth.js (NextAuth v5) | 5.0.0-beta.31 |
| WebSocket | ws | 8.21.0 |
| Validation | Zod | 4.4.3 |
| Password Hash | bcryptjs | 3.0.3 |
| Notifications | sonner | 2.0.7 |

---

## Database Schema

### Core Models

**User** — Central identity model with cached leaderboard metrics
- `id`, `name`, `username` (unique), `email` (unique), `passwordHash`, `image`
- Social links: `githubUrl`, `twitterUrl`, `websiteUrl`
- Cached bests: `bestWpm`, `bestScore`, `bestAccuracy` (O(1) leaderboard queries)
- Indexed on `bestScore DESC` for fast leaderboard ranking

**UserSettings** — 1:1 with User
- Theme, typing sounds, animations, font size, text width, caret style, accent color, difficulty

**SessionResult** — 1:many with User (each typing test result)
- `wpm`, `accuracy`, `totalKeystrokes`, `correctKeystrokes`, `incorrectKeystrokes`
- `duration`, `wordsCompleted`, `mode` (enum: words/timed/battle/drill/yolo)
- `config` (JSON — SessionConfig metadata), `timeline` (JSON — graph data), `errorKeys` (JSON)
- Indexed on `[userId, timestamp]` and `[mode]`

**LeaderboardEntry** — Per-user best scores per leaderboard type
- `type` = "words" | "timed" | "battle-elo"
- Unique on `[userId, type]`, indexed on `[type, score DESC]`

**BattleRoom** — Real-time multiplayer match state
- `playerOneId`, `playerTwoId`, `status` (waiting/countdown/active/disconnected/finished/abandoned)
- `seed` (for deterministic word generation on both clients)
- Stats: `playerOneWpm`, `playerTwoWpm`, `playerOneAcc`, `playerTwoAcc`
- `winnerId`, timestamps for countdown/started/finished

**BattleHistory** — Archived completed battles

**FriendRequest** — Pending friend requests (sender→receiver)
- Unique on `[senderId, receiverId]`

**Friendship** — Established friendships
- Canonical ordering: `[userOneId, userTwoId]` where userOneId < userTwoId

**YoloProfile** — 1:1 with User (YOLO mode letter mastery)
- `activeLetter`, `streak`, `letterProfiles` (JSON — 26 letter confidence scores)

**DrillProfile** — 1:1 with User (drill mode analytics)
- `keyStats`, `bigramStats`, `trigramStats`, `mistakeRecords`, `drillHistory` (all JSON)

### Relationships

```
User 1──1 UserSettings
User 1──many SessionResult
User 1──1 YoloProfile
User 1──1 DrillProfile
User 1──many LeaderboardEntry
User 1──many FriendRequest (sent/received)
User 1──many Friendship (userOne/userTwo)
User 1──many BattleRoom (playerOne/playerTwo/winner)
```

---

## Authentication Flow

### Strategy: JWT Sessions (Auth.js v5)

Auth.js uses **Credentials provider** with JWT session strategy (no database session rows).

### Routes
- `app/api/auth/[...nextauth]/route.ts` — Auth.js catch-all API route
- `app/api/auth/register/route.ts` — Email/password registration (bcrypt 12 rounds)

### Protection Model
1. **`proxy.ts`** (Next.js 16 Middleware) — Optimistic cookie-based redirect
   - Protected: `/profile`, `/friends`, `/battle`
   - Auth pages: `/signin`, `/signup` (redirect authenticated users home)
2. **`app/profile/layout.tsx`** — Authoritative server-side `auth()` check

### Session Shape
```typescript
{
  user: {
    id: string,
    name: string,
    email: string,
    username: string | null
  }
}
```

### Data Sync (Anonymous → Authenticated)

When a user logs in, the `useSyncOnLogin` hook automatically merges localStorage with the DB:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  localStorage   │ ──► │   Merge Logic    │ ──► │  DB + localStorage│
│  (anonymous)    │     │  (by ID + time)  │     │  (synced)        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              ▲
                              │
                        ┌──────────────────┐
                        │   DB (Aurora)    │
                        │  (authenticated) │
                        └──────────────────┘
```

- Sessions: union by ID, keep most recent version
- Drill stats: take higher attempt count per key/bigram
- YOLO profiles: take higher confidence per letter
- Settings: use DB version if exists, else push local

### Social Login (Optional)
Google + GitHub OAuth providers enabled only when `AUTH_GOOGLE_ID/SECRET` and `AUTH_GITHUB_ID/SECRET` are set. See `docs/OAUTH.md`.

---

## Typing Engine & State Management

### 7 Zustand Stores

| Store | Persisted | Purpose |
|-------|-----------|---------|
| `typing-store` | No | Active session state (words, caret position, keystrokes) |
| `stats-store` | Yes (`turing-type-stats`) | Session history (last 50), best WPM, averages |
| `settings-store` | Yes (`turing-type-settings-v3`) | User preferences (theme, font, sounds) |
| `battle-store` | No | AI battle mode (ghost AI progress) |
| `multiplayer-store` | No | WebSocket connection, friends, challenges |
| `drill-store` | Yes (`turing-type-drills`) | Key/bigram/trigram stats, mistake records |
| `yolo-store` | Yes (`turing-type-yolo`) | Letter confidence scores, streaks, progression |

### Typing Engine Flow
1. `useKeyboardHandler` → captures keyboard events on focus container
2. `useTypingEngine` → processes keystrokes, calculates WPM/accuracy in real-time
3. `useCaret` → positions the blinking caret based on current word/letter index
4. `useCountdown` → manages timed mode countdown
5. On session finish → `stats-store.addResult()` → async `saveSessionResult()` to DB

### Word Generation
- `engine/word-generator.ts` — ~9,867 word pool, indexed by letter/bigram/trigram
- `engine/typing-engine.ts` — Word initialization, keystroke processing
- `engine/drill-engine.ts` — Adaptive drill text generation targeting weak keys
- `engine/battle-engine.ts` — AI opponent WPM simulation
- `engine/cipher-engine.ts` — Optional cipher display mode
- `lib/words/` — Word lists organized by difficulty

---

## Multiplayer / WebSocket System

### Architecture
- **Standalone WebSocket server** (`websocket-server.js`) — runs on port 3001
- Direct Prisma + PostgreSQL connection (same DB as the Next.js app)
- Client connects via `multiplayer-store.ts` with auto-reconnect (3s)

### Message Protocol
| Direction | Message Type | Purpose |
|-----------|-------------|---------|
| C→S | `challenge` | Send battle challenge to a friend |
| C→S | `respond-challenge` | Accept/decline incoming challenge |
| C→S | `join-room` | Join an existing battle room |
| C→S | `leave-room` | Leave/forfeit a battle |
| C→S | `progress` | Send typing progress (0-1 float) |
| C→S | `finish` | Report final WPM + accuracy |
| S→C | `presence` | Online friends list |
| S→C | `friend-connected/disconnected` | Real-time presence updates |
| S→C | `battle-start` | Battle countdown begins |
| S→C | `opponent-progress` | Opponent's real-time progress |
| S→C | `battle-finished` | Final results with winner |
| S→C | `room-restore` | Reconnection state restoration |

### Disconnection Handling
- 30-second grace period for reconnection
- Room status set to `disconnected` in DB
- On timeout: forfeit, opponent wins, BattleHistory written

### Deterministic Word Generation
Both clients generate identical word sequences from a shared `seed` (mode + value + random string). No word data is sent over WebSocket — only progress percentages.

---

## Page & Route Map

| Route | Auth Required | Description |
|-------|:---:|-------------|
| `/` | No | Main typing dashboard (words/timed/drill/yolo modes) |
| `/signin` | No | Email + password sign-in |
| `/signup` | No | Email + password registration |
| `/profile` | Yes | User profile, stats, social links |
| `/friends` | Yes | Search users, friend requests, online friends |
| `/battle` | Yes | Real-time multiplayer battle room |
| `/leaderboard` | No | Global rankings (best WPM/score) |
| `/settings` | No | Theme, fonts, sounds, difficulty preferences |

---

## Component Architecture

```
components/
├── auth/              — SignInForm, SignUpForm
├── battle/            — BattleView, BattleResults, BattleCountdown
├── drill/             — DrillDashboard, DrillResults
├── keyboard/          — KeyboardLayout (visual keyboard display)
├── leaderboard/       — LeaderboardView
├── notifications/     — NotificationDrawer (friend request alerts)
├── providers/         — AuthProvider, ThemeProvider, WebSocketProvider
├── stats/             — StatsBar, ResultsCard, StatsHistory, AnalysisDrawer
├── typing/            — TypingArea, WordDisplay, Caret
├── ui/                — Button, Container, Navbar, Footer, Logo, ModeSelector,
│                        FloatingPillTabs, GroupedList, WhiteCard, AlertModal,
│                        SettingsDrawer, SubOptionSelector, ThemeToggle
└── yolo/              — YoloDashboard, YoloResults, YoloToastBanner
```

---

## Deployment Architecture

### Current (Development)
```
Local Machine
├── Next.js dev server (localhost:3000)
├── WebSocket server (localhost:3001)
└── Neon PostgreSQL (serverless Postgres)
```

### Target (Production — Hackathon)
```
Vercel (Frontend + API Routes)
├── Next.js 16 app (SSR + static)
├── Server Actions (Prisma → Aurora PostgreSQL)
└── Static assets

AWS EC2 / ECS / Railway (WebSocket Server)
├── websocket-server.js (Node.js process)
├── Prisma 7 + @prisma/adapter-pg
└── Connects to Aurora PostgreSQL

AWS Aurora PostgreSQL
├── Writer endpoint (writes)
├── Reader endpoint (optional reads)
└── SSL required, port 5432
```

### Key Deployment Notes
- Vercel **cannot** run the standalone WebSocket server — it needs a separate host
- The WebSocket server uses raw `ws` library, not Socket.io
- Prisma 7 driver adapter (`@prisma/adapter-pg`) is wire-compatible with Aurora
- Switching from Neon to Aurora is **only a DATABASE_URL change** — zero code changes
- Data sync: anonymous localStorage ↔ DB happens automatically on login via `useSyncOnLogin`

---

## File Structure Reference

```
typeforge/
├── app/
│   ├── actions/           — Server Actions (auth, friends, profile, session)
│   ├── api/auth/          — Auth.js routes
│   ├── battle/            — Battle page (multiplayer)
│   ├── friends/           — Friends management page
│   ├── leaderboard/       — Global leaderboard
│   ├── profile/           — User profile (protected)
│   ├── settings/          — Settings page
│   ├── signin/            — Sign-in page
│   ├── signup/            — Sign-up page
│   ├── globals.css        — Theme system (Apple HIG colors)
│   ├── layout.tsx         — Root layout (providers, navbar, footer)
│   └── page.tsx           — Home page (main typing dashboard)
├── components/            — React components (see Component Architecture)
├── docs/                  — Documentation (AUTH.md, architecture.md)
├── engine/                — Core engines (typing, cipher, battle, drill, word-generator)
├── hooks/                 — React hooks (useTypingEngine, useCaret, useCountdown, etc.)
├── lib/                   — Utilities (audio, auth, constants, prisma, utils, words)
├── prisma/                — Schema + migrations
├── public/                — Static assets
├── scripts/               — Build scripts (generate-word-bank.js)
├── stores/                — Zustand state stores (7 stores)
├── types/                 — TypeScript type definitions
├── websocket-server.js    — Standalone WebSocket server
├── proxy.ts               — Next.js 16 middleware (route protection)
├── prisma.config.ts       — Prisma 7 configuration
└── package.json           — Dependencies and scripts
```

---

## Design System (Apple HIG)

- **Fonts**: Inter (UI) + JetBrains Mono (typing only)
- **Colors**: Dark mode default, light mode toggle. Accent blue `#0a84ff` / `#007aff`
- **Radii**: 20px cards, 38px bottom sheets, 8px controls, 10-12px buttons
- **Animations**: Spring-based (motion/Framer), `active:scale-[0.97]` press feedback
- **Layout**: iOS-style grouped lists, translucent surfaces, no shadows on navbar
- **Scrollbar**: Custom thin scrollbar matching theme
