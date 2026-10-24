# 🧠 NeuroFlow AI — Agentic Document Intelligence

**NeuroFlow AI** is an AI-powered document intelligence workspace that helps users organize documents, retrieve relevant information, ask questions, and generate structured insights using Large Language Models (LLMs).

Built with the **MERN stack and Ollama**, the application combines document processing, embedding-based retrieval, Retrieval-Augmented Generation (RAG) concepts, and multi-stage AI workflows in one workspace.

## 🚀 Key Features

### 📄 1. Intelligent Document Processing
- Upload and process PDF, DOCX, TXT, Markdown, CSV, PNG, JPG, JPEG, and WEBP files.
- Extract text from documents using format-specific processing libraries.
- Apply **OCR using Tesseract.js** to extract text from supported images.
- Split extracted content into overlapping text chunks for efficient retrieval.
- Generate document summaries and track document processing status.

### 🔍 2. Retrieval-Augmented Generation (RAG)
- Convert document chunks and user queries into embeddings using **Ollama**.
- Retrieve relevant document content using **cosine similarity**.
- Fall back to keyword-based matching when embeddings are unavailable.
- Use retrieved document context to support question answering and document analysis.
- Display source citations, document names, relevant snippets, and retrieval scores.

### 🤖 3. Multi-Stage AI Workflow Engine
NeuroFlow implements a structured workflow pipeline with five main stages:

1. **Planner:** Creates the workflow plan.
2. **Retriever:** Retrieves relevant document chunks.
3. **Task:** Generates workflow content using the configured LLM or fallback logic.
4. **Writer:** Normalizes the generated output into structured JSON.
5. **Evaluator:** Records retrieval-grounding information and a confidence label.

Each workflow maintains execution traces to make the processing stages easier to inspect.

### 💬 4. AI-Powered Document Workflows

The application supports five workflow types:

- **Ask Workspace:** Ask questions about uploaded documents and retrieve relevant information.
- **Summarize Workspace:** Generate summaries and key points from document content.
- **Compare Documents:** Identify similarities, differences, and document-specific takeaways.
- **Meeting Action Items:** Extract potential tasks, owners, priorities, and due-date notes.
- **Research Brief:** Generate an executive summary, key themes, and a conclusion.

### 🗂️ 5. Workspace and Document Management
- Create, view, update, and delete workspaces.
- Upload, view, reprocess, and delete documents.
- Organize documents within individual workspaces.
- Maintain workflow execution history and chat conversations.
- Access dashboard summaries and individual workflow run details.

### 🔐 6. Authentication and Data Management
- User registration and login.
- **JWT-based authentication** for protected API endpoints.
- Password hashing using bcrypt.
- MongoDB persistence through Mongoose.
- In-memory repository fallback when MongoDB is not configured.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| UI and Styling | Tailwind CSS, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI and LLM | Ollama, configurable local chat and embedding models |
| Retrieval | Text embeddings, cosine similarity, keyword-based fallback |
| Document Processing | pdf-parse, Mammoth, csv-parse |
| OCR | Tesseract.js |
| Authentication | JWT, bcryptjs |
| API Communication | REST APIs, Axios |
| Frontend State and Data | Zustand, TanStack Query |
| Routing | React Router |
| Development Tools | Git, GitHub, npm |

---

## 🏗️ System Architecture

```text
                     ┌──────────────────────┐
                     │      React UI        │
                     │ Dashboard & Workspace│
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │   Express REST API   │
                     │ Authentication & API │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ Document Processing  │
                     │ Text Extraction/OCR  │
                     │ Cleaning & Chunking  │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ Embedding & Retrieval│
                     │ Cosine Similarity    │
                     │ Keyword Fallback     │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │   AI Workflow Engine │
                     │ Planner → Retriever  │
                     │ Task → Writer        │
                     │ Evaluator             │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ Ollama Local LLM     │
                     │ Structured Responses │
                     └──────────┬───────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ Citations, Results,  │
                     │ Evaluation & Traces  │
                     └──────────────────────┘

        MongoDB / In-Memory Repository
        stores application and workflow data
```

---

## 🧠 How It Works

### Step 1: Upload Documents
The user uploads a supported document to a workspace. The backend validates the file type and stores the uploaded file.

### Step 2: Extract and Clean Text
NeuroFlow extracts text using the appropriate parser. For image files, it uses OCR. The extracted text is cleaned and prepared for processing.

### Step 3: Create Text Chunks
The extracted text is divided into overlapping chunks. The current implementation uses a target chunk size of approximately **1,200 characters** with a **200-character overlap**.

### Step 4: Generate Embeddings
NeuroFlow requests embeddings from the configured Ollama embedding model and stores them with the corresponding document chunks.

### Step 5: Retrieve Relevant Context
When the user asks a question or starts a workflow, the application embeds the query and ranks document chunks using cosine similarity. If embeddings are unavailable, it uses keyword-overlap scoring.

### Step 6: Generate AI Output
The workflow engine constructs a prompt containing the workflow type, input, expected JSON structure, and retrieved document context. It requests a structured response from Ollama.

If the Ollama request fails, the application uses deterministic fallback logic to produce basic workflow results.

### Step 7: Evaluate and Display Results
The application records citations, retrieval-grounding information, a confidence label, and execution traces. Results are displayed in the workspace and workflow interfaces.

---

## 📁 Project Structure

```text
NeuroFlow-main/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   └── queries.js
│   │   ├── components/
│   │   │   ├── AppShell.jsx
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── Field.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── StatCard.jsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── RunDetailsPage.jsx
│   │   │   ├── WorkspaceDetailsPage.jsx
│   │   │   └── WorkspacesPage.jsx
│   │   ├── store/
│   │   │   └── authStore.js
│   │   ├── router.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── .env.example
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── package-lock.json
│
├── .env.example
├── .gitignore
└── README.md
```

### Important Backend Modules

| Module | Responsibility |
|---|---|
| `textExtractionService.js` | Extracts text from supported document formats and images |
| `chunkService.js` | Splits extracted text into overlapping chunks |
| `ollamaService.js` | Communicates with Ollama for text generation and embeddings |
| `retrievalService.js` | Ranks document chunks using embeddings or keyword matching |
| `workflowService.js` | Orchestrates AI workflows, citations, evaluation, and traces |
| `documentService.js` | Handles document ingestion, processing, and reprocessing |
| `authService.js` | Manages user authentication |
| `workspaceService.js` | Handles workspace operations |
| `repository.js` | Selects the MongoDB or in-memory repository |
| `upload.js` | Validates uploads and manages file storage |

---

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running NeuroFlow:

- Node.js and npm
- Git
- MongoDB, if persistent database storage is required
- Ollama, if you want to use local LLM generation and embeddings

### 1. Clone the Repository

```bash
git clone https://github.com/PrachiYargatti/NeuroFlow.git
cd NeuroFlow
```

### 2. Configure the Backend

Navigate to the server directory:

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory.

Example configuration:

```env
PORT=3001
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://127.0.0.1:27017/neuroflow

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3.1:8b
OLLAMA_EMBED_MODEL=nomic-embed-text

SEED_SAMPLE_DATA=true
```

**Configuration notes:**
- `MONGODB_URI` is optional. Without it, NeuroFlow uses its in-memory repository.
- Change `JWT_SECRET` to a secure, randomly generated value before deployment.
- The configured Ollama models must be available in your Ollama installation.
- Keep secrets in environment variables; do not commit your `.env` file.

### 3. Install and Prepare Ollama

Install Ollama from its official website:

https://ollama.com/

Start Ollama and download the default models configured by NeuroFlow:

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

Make sure the Ollama service is available at:

```text
http://localhost:11434
```

You can change the model names using `OLLAMA_CHAT_MODEL` and `OLLAMA_EMBED_MODEL`.

### 4. Start the Backend

From the `server/` directory:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:3001
```

API base URL:

```text
http://localhost:3001/api
```

Health endpoint:

```text
http://localhost:3001/api/health
```

### 5. Configure the Frontend

Open another terminal and navigate to the client directory:

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 6. Start the Frontend

From the `client/` directory:

```bash
npm run dev
```

Open the URL displayed by Vite. The default development URL is:

```text
http://localhost:5173
```

---

## 🔌 API Overview

All API endpoints are prefixed with `/api`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a user |
| POST | `/auth/login` | Authenticate a user |
| GET | `/auth/me` | Retrieve the authenticated user's information |

### Workspaces

| Method | Endpoint | Description |
|---|---|---|
| GET | `/workspaces` | List workspaces |
| POST | `/workspaces` | Create a workspace |
| GET | `/workspaces/:id` | Retrieve a workspace |
| PATCH | `/workspaces/:id` | Update a workspace |
| DELETE | `/workspaces/:id` | Delete a workspace |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| GET | `/workspaces/:workspaceId/documents` | List workspace documents |
| POST | `/workspaces/:workspaceId/documents/upload` | Upload and process a document |
| GET | `/documents/:id` | Retrieve document details |
| POST | `/documents/:id/reprocess` | Reprocess a document |
| DELETE | `/documents/:id` | Delete a document |

### AI Workflows and Chat

| Method | Endpoint | Description |
|---|---|---|
| POST | `/workspaces/:workspaceId/chat` | Ask a question about workspace documents |
| GET | `/workspaces/:workspaceId/chat` | List chat threads |
| GET | `/workspaces/:workspaceId/chat/:threadId/messages` | Retrieve chat messages |
| GET | `/workspaces/:workspaceId/runs` | List workflow runs |
| POST | `/workspaces/:workspaceId/runs/summarize` | Summarize workspace content |
| POST | `/workspaces/:workspaceId/runs/compare` | Compare selected documents |
| POST | `/workspaces/:workspaceId/runs/meeting-action-items` | Extract meeting action items |
| POST | `/workspaces/:workspaceId/runs/research-brief` | Generate a research brief |
| GET | `/runs/:id` | Retrieve workflow run details |

Protected endpoints require valid authentication. Refer to the backend route and controller files for the exact request payloads and response formats.

---

## 🔒 Security and Data Handling

- Passwords are hashed using bcrypt before storage.
- JWT authentication protects workspace, document, and workflow endpoints.
- Repository operations scope user-owned data to the authenticated user.
- Uploaded files are stored on the backend filesystem.
- The upload middleware limits individual files to **10 MB** and accepts only supported file extensions.

**Before production deployment:**
- Use a strong, unique JWT secret.
- Configure appropriate CORS origins.
- Add production-grade rate limiting and additional upload security checks.
- Protect uploaded files and configure appropriate storage cleanup.
- Avoid exposing sensitive document content in application logs.
- Review authentication, session handling, and error responses before making the application publicly accessible.

---

## ⚠️ Current Limitations

- AI generation and embedding creation depend on the configured Ollama service and models.
- When Ollama is unavailable, fallback logic provides basic deterministic results rather than full LLM-generated answers.
- Keyword-based retrieval is used when embedding generation is unavailable.
- The workflow confidence label is a simple heuristic based on the number of retrieved chunks; it is not a calibrated measure of answer correctness.
- The in-memory repository does not provide durable persistence across server restarts.
- Local development setup and runtime behavior should be verified after installing dependencies.

---

## 🔮 Future Enhancements

Potential improvements include:

- Add automated tests for authentication, document processing, retrieval, and workflow execution.
- Introduce a dedicated vector database for larger document collections.
- Improve retrieval with hybrid search and reranking.
- Add configurable model selection and streaming responses.
- Expand evaluation with answer relevance, citation correctness, and faithfulness metrics.
- Add background processing for large document collections.
- Deploy the frontend, backend, database, and AI services with production-ready configuration.

---

## 🎯 Project Objective

NeuroFlow AI demonstrates how **LLMs, document processing, embeddings, retrieval, and structured AI workflows** can be combined into a practical document intelligence application.

The project brings together full-stack development and applied Generative AI to help users extract information, analyze documents, and generate structured outputs from their own content.
