# TubeRoast

TubeRoast connects to your Google account, looks at the YouTube data Google lets it read, and generates a personalized, good-natured roast of your taste using an LLM.

> **Status:** working MVP. Sign in with Google, connect YouTube read-only, and get an AI-written roast of your taste. Roast history UI and deployment are next.

## What data TubeRoast uses

**Signing in** asks Google only for your name and profile picture (`openid profile`). TubeRoast stores your Google account ID, name and avatar URL. No email, and no Google tokens.

**Connecting YouTube** is a separate, optional step that requests **read-only** access (`youtube.readonly`). TubeRoast then reads:

- Your 200 most recently liked videos (title, channel, category, tags, topics, length)
- Up to 200 channels you subscribe to
- Up to 50 playlists you created (titles and item counts)

This data is fetched from YouTube when needed and is **not stored**. The short-lived (about 1 hour) access token is kept only in your encrypted server-side session, never in the browser. Disconnecting or signing out revokes it at Google.

It **cannot** see your watch history. The YouTube Data API has not exposed watch history since 2016.

**Roasting** turns that data into a small summary (top channels, categories, keywords, video-length and playlist stats, and "traits") with deterministic, unit-tested code. Only this summary is sent to the AI model, hosted by NVIDIA. You can see exactly what is sent under "What the AI will see". The model writes the jokes; it is an existing general-purpose LLM, not a custom-trained model.

TubeRoast stores your 20 most recent roasts with a tiny snapshot (counts, top 3 channels, traits). OAuth tokens, raw YouTube data and the full summary are never stored.

## Tech stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | React, Vite, Tailwind CSS, Motion                 |
| Backend  | Node.js, Express, Zod, MongoDB + Mongoose, express-session |
| Services | Google OAuth 2.0, YouTube Data API v3, NVIDIA hosted LLM API (OpenAI-compatible) |

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
3. Under **Data Access**, add the `openid`, `.../auth/userinfo.profile` and `.../auth/youtube.readonly` scopes. The YouTube scope is listed as *sensitive*; that is fine while the app is in Testing.
4. Under **Clients**, create a **Web application** client with the authorized redirect URI `http://localhost:5173/api/auth/google/callback`.
5. Copy the client ID and secret into `server/.env`. The secret is shown only once.

### NVIDIA API key

1. Sign in at https://build.nvidia.com, open **API Keys** from your account menu and click **Generate API Key**.
2. Copy the key (it starts with `nvapi-`) into `server/.env` as `NVIDIA_API_KEY`. Keep it server-side only.
3. Optionally set `NVIDIA_MODEL` to another model listed by `GET https://integrate.api.nvidia.com/v1/models` that supports structured output.

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
| `client/` | `npm test`        | Run the client tests (Vitest + Testing Library + jsdom) |
| `server/` | `npm run dev`     | Start the API and restart on file changes |
| `server/` | `npm start`       | Start the API                             |
| `server/` | `npm test`        | Run the API tests with Vitest             |
