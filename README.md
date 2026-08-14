# TransClive — Real-Time Audio Transcriber

TransClive is a full-stack real-time audio transcription application built for the Full Stack assessment.

It lets authenticated users record microphone audio, see live transcription results, persist finalized transcripts, search and manage transcript history, and automatically generate an AI summary after a recording is saved.

## Features

### Authentication

- User registration and login
- Logout
- Protected transcription APIs
- HTTP-only cookie-based authentication
- Password hashing
- Per-user transcript ownership

### Real-time transcription

- Browser microphone capture
- Start / Stop recording
- Real-time Deepgram transcription
- Interim transcription results
- Finalized transcript segments
- Speaker diarization
- Speaker labels
- Timestamped transcript segments
- Language selection
- Recording duration

### Transcript management

- Persistent PostgreSQL storage through Prisma
- Transcript history
- Search through saved transcripts
- Pagination
- Transcript detail page
- Rename transcript
- Delete transcript
- Word count
- Transcript metadata

### AI summary

- Automatic summary generation after transcription is saved
- AI-generated title and summary
- Summary status handling
- Summary failure does not invalidate the saved transcript
- Summary retry support

### UX / reliability

- Explicit recording lifecycle states
- Microphone and connection error handling
- Separate transcription persistence and summary generation
- Empty-state handling
- Loading/saving/summarizing feedback

---

## Architecture

```text
                         ┌─────────────────────────┐
                         │        Next.js          │
                         │                         │
                         │  Authentication UI      │
                         │  Recorder UI            │
                         │  Live Transcript        │
                         │  History                │
                         │  Transcript Detail      │
                         └────────────┬────────────┘
                                      │
                            REST / HTTP + Cookie
                                      │
                         ┌────────────▼────────────┐
                         │      Express API        │
                         │                         │
                         │  Auth                   │
                         │  Transcript APIs        │
                         │  Persistence             │
                         │  Summary service         │
                         └─────────┬──────┬─────────┘
                                   │      │
                            Prisma │      │ AI API
                                   │      │
                         ┌─────────▼─┐  ┌─▼──────────┐
                         │ PostgreSQL │  │ AI Service │
                         └────────────┘  └────────────┘


REAL-TIME PATH

┌───────────────┐       WebSocket       ┌──────────────┐
│   Browser     │ ◄────────────────────► │   Deepgram   │
│               │                        │     STT      │
│ Microphone    │ ───── audio ─────────►│              │
│ Transcript UI │ ◄── interim/final ────│              │
└───────┬───────┘                        └──────────────┘
        │
        │ finalized transcript
        ▼
┌──────────────────┐
│ Express / Prisma │
│ PostgreSQL       │
└──────────────────┘
```

The real-time transcription path is kept separate from application persistence. The backend is responsible for authentication, authorization, persistence, and summary generation rather than acting as an unnecessary audio proxy.

The permanent Deepgram API key is kept server-side.

---

## Recording Flow

```text
User selects language
        ↓
Start recording
        ↓
Request microphone permission
        ↓
Connect to Deepgram
        ↓
Stream microphone audio
        ↓
Receive interim + final results
        ↓
User clicks Stop
        ↓
Finalize Deepgram stream
        ↓
Persist finalized transcript
        ↓
Return transcription ID
        ↓
Automatically request summary
        ↓
Store title + summary
```

Transcript persistence and AI summarization are deliberately separate operations. A summary failure does not delete or invalidate the transcript.

---

## Recording State

The frontend models the recording lifecycle explicitly:

```text
IDLE
  ↓
CONNECTING
  ↓
RECORDING
  ↓
STOPPING
  ↓
SAVING
  ↓
SUMMARIZING
  ↓
READY
```

Failure states are handled separately so that the UI can distinguish transcription/persistence problems from summary-generation problems.

---

## Technology Stack

| Layer               | Technology                      |
| ------------------- | ------------------------------- |
| Frontend            | Next.js                         |
| UI                  | React + TypeScript              |
| Styling             | Tailwind CSS + shadcn/ui        |
| Backend             | Node.js + Express               |
| Backend language    | TypeScript                      |
| Database            | PostgreSQL                      |
| ORM                 | Prisma                          |
| Real-time STT       | Deepgram WebSocket              |
| Authentication      | HTTP-only cookie authentication |
| Password hashing    | Argon2/bcrypt                   |
| Validation          | Server-side validation          |
| AI summary          | Provider-backed summary service |
| API                 | REST                            |
| Real-time transport | WebSocket                       |

---

## Project Structure

```text
transclive/
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── history/
│   │   │   └── history/[id]/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
│
├── server/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   └── package.json
│
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL
- A Deepgram API key
- An API key/configuration for the configured AI summary provider

### 1. Clone the repository

```bash
git clone https://github.com/Ravish-Ranjan/transclive.git
cd transclive
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create the backend environment file according to the variables used by the project.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
DEEPGRAM_API_KEY="your-deepgram-key"
AI_API_KEY="your-ai-provider-key"
NODE_ENV="development"
```

Run Prisma migrations/generation as required by the current project:

```bash
npx prisma generate
npx prisma migrate dev
```

Start the backend:

```bash
npm run dev
```

The development backend runs on port `816`.

### 3. Configure the frontend

```bash
cd ../client
npm install
```

Configure the API URL:

```env
NEXT_PUBLIC_API_URL="http://localhost:816"
```

Start the frontend:

```bash
npm run dev
```

Then open the Next.js development URL shown by the terminal, normally:

```text
http://localhost:3000
```

> If the project uses additional environment variables, copy them from the repository's `.env.example` and fill in the required values. Never commit real credentials.

---

## Environment Variables

Backend: look in [here](server/.envexample.production)

```text
DATABASE_URL="<datbase-url>"
DEEPGRAM_API_KEY="<deepgram-api-key>"
AUTH_SECRET="<super-secret-auth-key>"
AI_API_KEY="<ai-api-key>"
CLIENT_URL="http://localhost:3000"
PORT=<port>
NODE_ENV="production"
ALLOWEDORIGINS="list,of,allowed,origins"
```

Frontend:

```text
NEXT_PUBLIC_API_URL
```

Secrets must remain outside source control.

---

## API Overview

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Transcriptions

```http
GET    /api/transcriptions
GET    /api/transcriptions/:id
PATCH  /api/transcriptions/:id
DELETE /api/transcriptions/:id
```

### Summary

```http
POST /api/transcriptions/:id/summary
```

The summary endpoint is also triggered automatically after a successful transcription save.

---

## Data Model

The core relationship is:

```text
User
 │
 └── 1:N
      │
      └── Transcription
```

A transcription contains information such as:

- owner/user ID
- title
- language
- transcript text
- structured segments
- speaker information
- timestamps
- duration
- word count
- summary
- summary/persistence status
- creation/update timestamps

Every transcript access, update, and delete operation is authorized against the authenticated user.

---

## Important Engineering Decisions

### 1. Finalized segments are persisted

Interim Deepgram results are used for the live UI but are not repeatedly persisted.

This avoids duplicate transcript text and unnecessary database/network traffic.

### 2. Structured transcript segments

The application retains structured segment information rather than relying only on a single large string.

A segment can contain:

```json
{
	"text": "Hello, how are you?",
	"speaker": 0,
	"start": 0.42,
	"end": 2.1
}
```

This makes speaker rendering, timestamps, metadata, and future transcript processing easier.

### 3. Summary generation is independent

The transcript is saved before summary generation begins:

```text
Transcript saved
      ↓
Summary requested
      ↓
AI service
      ↓
Summary stored
```

Therefore an AI failure does not destroy a successfully saved transcript.

### 4. User isolation

The authenticated user identity is obtained from the server-side authentication context.

The application does not trust a client-supplied user ID for authorization.

### 5. Server-side secrets

The permanent Deepgram API key is never placed in frontend source code.

---

## Implemented Requirements

### P0 — Mandatory

- [x] Authentication
- [x] Microphone permission handling
- [x] Start recording
- [x] Stop recording
- [x] Real-time transcription
- [x] Interim transcription results
- [x] Final transcription results
- [x] Backend persistence after Stop
- [x] Persistent transcript history
- [x] Error handling
- [x] Secure Deepgram API-key handling

### P1 — Recommended

- [x] Transcript history page
- [x] Transcript detail page
- [x] Transcript deletion
- [x] Transcript renaming
- [x] Speaker diarization
- [x] Timestamps
- [x] Transcript search
- [x] Recording duration
- [x] Word count
- [x] AI-generated summary
- [x] Language selection
- [x] Recording/session states
- [x] Summary retry handling

### P2 — Optional

The following are intentionally not required for the assessment's core completion:

- [ ] IndexedDB interrupted-session recovery
- [ ] TXT/JSON export
- [ ] Copy transcript
- [ ] Keyboard shortcuts
- [ ] Advanced accessibility improvements
- [ ] More advanced language configuration
- [ ] Transcript editing
- [ ] Automatic title generation as a separate feature

---

## Assumptions

- The initial application targets browser-based microphone recording.
- Language is selected before recording begins.
- Speaker labels represent diarized speaker IDs rather than real identities.
- Transcript persistence occurs after the recording is stopped.
- AI summarization is asynchronous relative to transcript persistence.
- PostgreSQL is sufficient for the expected assessment-scale search workload.
- Permanent third-party API credentials are stored only on the backend.
- The application is intended for normal authenticated users rather than a complex role/permission hierarchy.

---

## Known Limitations / Future Improvements

The assessment is focused on completing the core product rather than implementing every production-hardening enhancement.

Potential next improvements include:

1. Idempotent save/session IDs for robust retry-safe persistence.
2. Full automatic recovery from browser/network interruption.
3. Automated unit, integration, and end-to-end test coverage.
4. More extensive accessibility testing.
5. Transcript export and copy actions.
6. Transcript editing.
7. Production observability and metrics.
8. More extensive validation and rate limiting.
9. Large-transcript virtualization and optimized search for higher scale.

These are deliberately secondary to the completed P0/P1 functionality.

---

## Testing Checklist

- [x] Register a new user
- [x] Log in
- [x] Start recording
- [x] Allow microphone access
- [x] Confirm interim transcription appears
- [x] Confirm final transcription appears
- [x] Stop recording
- [x] Confirm transcript is saved
- [x] Confirm summary generation starts automatically
- [x] Confirm summary is stored
- [x] Open History
- [x] Search for a transcript
- [x] Open transcript detail
- [x] Rename transcript
- [x] Refresh and confirm rename persisted
- [x] Delete transcript
- [x] Confirm it disappears from history
- [x] Test microphone denial
- [x] Test invalid login
- [x] Confirm another user cannot access the transcript

---

## AI Usage

AI tools were used during development for implementation assistance, debugging, architecture discussion, and documentation.

The resulting application was assembled and integrated specifically for this assessment repository. AI assistance does not replace the project's application-specific implementation, configuration, testing, or integration work.

---

## Assessment Context

This repository was created as part of a Full Stack assessment requiring a real-time audio transcription application.

The implementation prioritizes:

- real-time behavior
- clean separation of concerns
- authenticated user isolation
- persistence
- explicit failure states
- practical architecture
- maintainability
- secure handling of third-party credentials
