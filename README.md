# Doctor Linda

> Prepare your data for AI in minutes.

AI Data Preparation Platform — upload a messy dataset, get a plain-language
diagnosis of what's wrong with it, approve the recommended fixes, and
download an AI-ready dataset. (Formerly "DataClean AI" in the PRD.)

## Stack & how the three services connect

```
┌─────────────┐   git push    ┌──────────────┐
│   GitHub    │ ────────────► │ GitHub       │  CI: lint/build check
│  (repo)     │               │ Actions      │  on every push/PR
└──────┬──────┘               └──────────────┘
       │ webhook (auto-deploy on push to main)
       ▼
┌─────────────────────┐        ┌─────────────────────┐
│  Render              │◄─────►│  Supabase            │
│  - backend/  (FastAPI)│ REST/ │  - Postgres (metadata)│
│    -> doctor-linda-api│ Storage│  - Storage (raw+clean │
│                       │  SDK  │    dataset files)     │
└──────────┬────────────┘        └─────────────────────┘
           │ CORS-restricted HTTPS
           ▼
┌─────────────────────┐
│  Vercel               │
│  - frontend/ (Next.js)│
│    -> doctor-linda.app│
└───────────────────────┘
```

- **GitHub** hosts the repo. Both Render and Vercel are connected directly
  to it and redeploy automatically on every push to `main`.
- **Render** runs the FastAPI backend (`backend/`), reading `render.yaml`
  at the repo root as its Blueprint. It talks to Supabase using the
  `service_role` key (server-side only).
- **Supabase** provides Postgres (dataset metadata + row-level security)
  and Storage (the actual raw/cleaned files, in a private `datasets`
  bucket).
- **Vercel** (not in original stack list, but the natural home for
  Next.js) hosts the frontend, which calls the Render API and can query
  Supabase directly with the public `anon` key for lightweight reads.

## One-time setup

### 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor → run `supabase/schema.sql`.
3. Storage → New bucket → name it `datasets`, set to **private**.
4. Settings → API → copy `Project URL`, `anon public` key, and
   `service_role` key (the last one is secret, backend-only).

### 2. GitHub
1. Push this repo to a new GitHub repository.
2. That's it for GitHub itself — Render and Vercel connect to it in the
   next steps. `.github/workflows/ci.yml` runs automatically once pushed.

### 3. Render (backend)
1. Render dashboard → New → Blueprint → connect your GitHub repo.
2. Render detects `render.yaml` and provisions `doctor-linda-api`.
3. Service → Environment → fill in the vars marked `sync: false`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY` (free, no credit card — get one at console.groq.com/keys)
   - `FRONTEND_URL` (fill in after step 4)
4. Every push to `main` now auto-redeploys this service.

### 4. Vercel (frontend)
1. Vercel dashboard → New Project → import the same GitHub repo →
   set root directory to `frontend`.
2. Project → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` → your Render service URL, e.g.
     `https://doctor-linda-api.onrender.com`
3. Deploy. Then go back to Render and set `FRONTEND_URL` to your new
   Vercel URL so CORS allows it.

## Local development

```bash
# backend
cd backend
cp .env.example .env   # fill in real values
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Repo layout

```
doctor-linda/
├── render.yaml              # Render Blueprint (backend deploy config)
├── .github/workflows/ci.yml # lint/build check before Render/Vercel deploy
├── supabase/schema.sql       # Postgres schema + RLS policies
├── backend/                  # FastAPI app
│   └── app/
│       ├── main.py
│       ├── supabase_client.py
│       ├── routes/datasets.py
│       └── services/{profiler,doctor,cleaner}.py
└── frontend/                  # Next.js app
    ├── app/page.tsx
    └── lib/{api,supabaseClient}.ts
```

## Product principles (carried over from the PRD)

- The original dataset is never modified — cleaning always writes a new
  file under `cleaned/`.
- Every recommendation from the AI Dataset Doctor is explained before
  it's applied.
- The LLM (`services/doctor.py`) only diagnoses and recommends; the
  cleaning engine (`services/cleaner.py`) is the only code that performs
  transformations, and only after user approval.
