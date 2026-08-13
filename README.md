# Transclive

Transclive is a real-time audio transcription platform that uses Deepgram for streaming speech-to-text and an AI summarization service to generate summaries and titles for transcriptions. It provides a Next.js client and an Express + TypeScript server that persist transcriptions with Prisma/Postgres and supports real-time WebSocket streaming for microphone audio ingestion.

- Repository root: .
- Client app: [client/](./client)
- Server app: [server/](./server)

Table of contents

- Project overview
- Features
- Architecture & important files
- Tech stack
- Getting started (development)
- Environment variables
- Database (Prisma)
- Running (development & production)
- API reference (quick)
- WebSocket protocol (transcription)
- Security & secrets
- Contributing
- License

## Project overview

Transclive provides a web client for recording audio (browser microphone), streams binary audio frames to the server over a WebSocket, forwards the audio to Deepgram for live transcription, persists final segments to a Postgres database, and supports generating an AI-produced summary/title for saved transcriptions.

## Features

- Real-time streaming transcription via WebSocket (/ws/transcribe)
- Deepgram integration for speech-to-text (streaming)
- Persistent storage of transcriptions and segments in Postgres via Prisma
- User authentication (email/password) with cookie-based auth_token
- AI-powered summarization endpoint to create title + summary from transcript text
- Health endpoint and Prisma Studio for DB inspection

## Architecture & important files

- Server
    - [server/src/server.ts](./server/src/server.ts) - HTTP server bootstrap
    - [server/src/app.ts](./server/src/app.ts) - Express app (routes & middleware)
    - [server/src/services/transcription.websocket.ts](./server/src/services/transcription.websocket.ts) - WebSocket handling and Deepgram integration
    - [server/prisma/schema.prisma](./server/prisma/schema.prisma) - Prisma schema (DB models)
    - [server/src/controllers/auth.controller.ts](./server/src/controllers/auth.controller.ts) - auth endpoints and cookie management
    - [server/src/controllers/transcription.controller.ts](./server/src/controllers/transcription.controller.ts) - CRUD & summary generation
- Client
    - [client/](./client) - Next.js app
    - [client/next.config.ts](./client/next.config.ts)

## Tech stack

- Frontend: Next.js 16 (React 19), Tailwind CSS, shadcn, TypeScript
- Backend: Node.js, Express, TypeScript, Prisma ORM
- Database: PostgreSQL (any provider supported by Prisma)
- Streaming & Speech-to-Text: Deepgram SDK
- AI summarization: External AI API (configured by AI_API_KEY)
- Auth: Cookie-based JWT tokens, password hashing with Argon2

## Getting started (development)

Prerequisites

- Node.js (recommend Node 18+ or latest LTS)
- npm (or yarn)
- PostgreSQL instance (local or managed) or a connection string

Clone the repo
```bash
git clone <repo-url>
cd transclive
```
Install dependencies

# root (concurrently)
```bash
npm install
```
# client
```bash
npm --prefix client install
```
# server
```bash
npm --prefix server install
```
Environment

- Environment variables are required for the server and client. Example files are NOT included with secrets — create your own.

Example server .env (do NOT commit secrets):
```
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DATABASE
DEEPGRAM_API_KEY=your_deepgram_api_key
AUTH_SECRET=a_random_secret_for_jwt_signing
AI_API_KEY=your_ai_service_api_key
CLIENT_URL=http://localhost:3000
PORT=8016
NODE_ENV=development
ALLOWEDORIGINS=http://localhost:3000
```
Example client .env.local:

NEXT_PUBLIC_API_URL=http://localhost:8016

See [server/.env.production](./server/.envexample.production) for an example layout (do not reuse secrets from there).

## Database (Prisma)

The database schema lives at [server/prisma/schema.prisma](./server/prisma/schema.prisma). Main models:

- User: id, email, passwordHash, timestamps
- Transcription: id, userId, title, language, duration, status, summary, summaryStatus, timestamps
- TranscriptSegment: id, transcriptionId, text, start, end, speaker, confidence

Prisma helper scripts (from server package.json)

- npm --prefix server run prisma:generate # generate Prisma client
- npm --prefix server run prisma:migrate # run migrations (development)
- npm --prefix server run prisma:studio # open Prisma Studio

Run migrations (local dev)

cd server
npm run prisma:generate
npm run prisma:migrate

## Running the project

Development

# runs both client and server concurrently from repo root

npm run dev

Or run independently

npm --prefix client run dev # Next dev server (default port 3000)
npm --prefix server run dev # server (default port from env or 8000)

Production (build & start)

# Build both

npm --prefix client run build
npm --prefix server run build

# Start server and client separately (example)

npm --prefix server run start
npm --prefix client run start

Notes: server dev uses tsx: "tsx watch src/server.ts" — ensure dev dependencies for server are installed.

## API reference (quick)

Base API URL: ${NEXT_PUBLIC_API_URL} (default from client/.env.local)

- GET /api/health
    - Health check, also verifies DB connection

- Auth
    - POST /api/auth/register { email, password } -> registers user and sets auth cookie
    - POST /api/auth/login { email, password } -> logs in and sets auth cookie
    - POST /api/auth/logout -> clears auth cookie
    - GET /api/auth/me (requires auth) -> returns current user

- Transcriptions (/api/transcriptions)
    - GET /api/transcriptions?search=... (requires auth) -> list
    - POST /api/transcriptions/:id/summary (requires auth) -> generate summary/title via AI
    - GET /api/transcriptions/:id (requires auth) -> get transcription + segments
    - DELETE /api/transcriptions/:id (requires auth) -> delete transcription
    - PATCH /api/transcriptions/:id/title (requires auth) -> rename transcription

See implementation at [server/src/controllers](./server/src/controllers)

## WebSocket protocol (transcription)

Endpoint (relative to server host): /ws/transcribe

Authentication

- Clients must present a valid auth cookie named `auth_token` on the WebSocket connection request. The server verifies this token before accepting the connection.

Client -> Server messages

- Binary frames: audio chunks from the browser microphone (raw audio as binary WebSocket frames). These are forwarded to Deepgram.
- JSON control messages (text frames):
    - Start recording:
      { "type": "start", "language": "en-US" }
        - language optional, defaults to "en-US"
    - Stop recording:
      { "type": "stop" }

Server -> Client JSON messages

- { type: "ready" } - deepgram connection opened and server ready to receive audio
- { type: "transcript", segment: {...}, isFinal: boolean, speechFinal: boolean } - incremental or final segment
- { type: "utterance_end", lastWordEnd: number } - utterance ended
- { type: "transcription_saved", transcription: { id, language, duration, createdAt } } - saved DB record when deepgram connection closed
- { type: "deepgram_closed" } - deepgram connection closed
- { type: "stopping" } - server is stopping recording session
- { type: "error", message: "..." } - errors

Important: audio frames must be sent as binary WebSocket frames. The server expects the Deepgram SDK to receive media via deepgramConnection.sendMedia(bytes).

## Security & secrets

- Do NOT commit secrets into the repository. Keep environment variables (API keys, DATABASE_URL, AUTH_SECRET, AI_API_KEY) out of source control.
- The server sets the `auth_token` cookie as HTTP-only and sets the secure flag in production.
- The server reads CORS allowed origins from ALLOWEDORIGINS (comma separated) — set this appropriately in production.

Recommended env keys (server)

- DATABASE_URL (Postgres connection string)
- DEEPGRAM_API_KEY
- AUTH_SECRET (jwt signing secret)
- AI_API_KEY (used when generating summaries)
- CLIENT_URL
- PORT
- NODE_ENV
- ALLOWEDORIGINS

Client

- NEXT_PUBLIC_API_URL (base API URL used by the client)

## Development notes & troubleshooting

- If WebSocket authentication fails, verify the browser has the `auth_token` cookie set from login/register and the cookie domain/path is correct.
- If Deepgram streaming fails, confirm DEEPGRAM_API_KEY and network connectivity. The server logs Deepgram errors.
- For database issues, check DATABASE_URL and run Prisma Studio: `npm --prefix server run prisma:studio`.
- To regenerate Prisma client after schema changes: `npm --prefix server run prisma:generate`.

## Contributing

1. Fork the repository
2. Create a feature branch: git checkout -b feat/your-feature
3. Install & run tests (if any)
4. Open a PR describing changes

Please keep changes focused and include tests or manual verification steps for behavioral changes.

## License

This project uses GPL-2.0 as specified in package.json.

## Contact / Maintainer

Maintainer: Ravish Ranjan

Files to inspect while developing

- [server/src/services/transcription.websocket.ts](./server/src/services/transcription.websocket.ts) (WebSocket & deepgram flow)
- [server/prisma/schema.prisma](./server/prisma/schema.prisma) (DB models)
- [client/next.config.ts](./client/next.config.ts)
