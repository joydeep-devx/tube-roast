# TubeRoast

TubeRoast connects to your Google account, looks at the YouTube data Google lets it read, and generates a personalized, good-natured roast of your taste using an LLM.

> **Status:** early development. Google sign-in works; YouTube analysis and roasts are next.

## What data TubeRoast uses

**Signing in** asks Google only for your name and profile picture (`openid profile`). TubeRoast stores your Google account ID, name and avatar URL. No email, and no Google tokens.

**Roasting** will separately request **read-only** YouTube access (`youtube.readonly`) only when you ask for a roast. It can see:

- Videos you have liked (the most recent 1,000 at most, as limited by the YouTube Data API)
- Channels you subscribe to
- Playlists you have created

It **cannot** see your watch history. The YouTube Data API has not exposed watch history since 2016.

Only an aggregated summary (top channels, topics and counts) is sent to the LLM. OAuth tokens and raw activity lists are never sent to the LLM or stored long term.

## Tech stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | React, Vite, Tailwind CSS, Motion                 |
| Backend  | Node.js, Express, Zod, MongoDB + Mongoose, express-session |
| Services | Google OAuth 2.0; YouTube Data API v3 and NVIDIA hosted LLM API *(planned)* |

## Project structure

```
tube-roast/
├─ client/   React + Vite frontend
└─ server/   Express REST API
```

## Getting started

Requirements: Node.js `>=22.12.0` (developed on Node 24), npm, a MongoDB database (e.g. a free MongoDB Atlas cluster) and a Google Cloud project.

### Google Cloud setup

1. Create a project at https://console.cloud.google.com and enable **YouTube Data API v3**.
2. In **Google Auth Platform**, set up Branding, choose **External** audience, keep the app in **Testing**, and add your Google account under **Audience → Test users**.
3. Under **Data Access**, add the `openid` and `.../auth/userinfo.profile` scopes.
4. Under **Clients**, create a **Web application** client with the authorized redirect URI `http://localhost:5173/api/auth/google/callback`.
5. Copy the client ID and secret into `server/.env`. The secret is shown only once.

Run the API and the client in two terminals.

**1. API server**

```bash
cd server
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

The API runs at http://localhost:5000. Check it with `curl http://localhost:5000/api/health`.

**2. Client**

```bash
cd client
npm install
npm run dev
```

The app runs at http://localhost:5173. In development, Vite forwards every `/api/*` request to the API server.

### Scripts

| Where     | Command           | Purpose                                   |
| --------- | ----------------- | ----------------------------------------- |
| `client/` | `npm run build`   | Production build into `dist/`             |
| `client/` | `npm run preview` | Serve the production build                |
| `client/` | `npm run lint`    | Run oxlint                                |
| `server/` | `npm run dev`     | Start the API and restart on file changes |
| `server/` | `npm start`       | Start the API                             |
| `server/` | `npm test`        | Run the API tests with Vitest             |
