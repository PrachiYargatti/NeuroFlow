# NeuroFlow AI

Agentic document intelligence workspace built with MERN, JavaScript, and local/free AI.

## Current Status

Implemented:

- Required `client/` and `server/` structure
- Express API foundation
- MongoDB repository with memory fallback
- Demo seed user
- JWT auth with bcrypt password hashing
- Workspace CRUD APIs
- Dashboard summary API
- React/Vite frontend foundation
- Document upload and ingestion
- Chunking and retrieval
- Ollama client with deterministic fallback behavior
- Five-stage workflow engine
- Ask, summarize, compare, action items, and research brief workflows
- Chat, runs, citations, evaluation, and trace UI
- Login, register, dashboard, workspace list, workspace detail, and run detail pages

Needs local verification after dependency install:

- `npm install` in `server/`
- `npm install` in `client/`
- `npm run dev` for both apps

## Demo Login

- Email: `demo@neuroflow.ai`
- Password: `Password@123`

## Run Locally

Install dependencies in each app:

```bash
cd server
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Defaults:

- Client: `http://localhost:5173`
- API: `http://localhost:3001/api`
- API health: `http://localhost:3001/api/health`

MongoDB is optional. Without `MONGODB_URI`, the server runs in memory mode.
