# Airtel SCM SOW Form (Vercel + Supabase + Mandatory AI Check)

Simple dynamic SOW form for Airtel SCM buyers. Submission is blocked unless AI validation passes.

## Features
- Dynamic SOW fields from env config (`SOW_FORM_FIELDS_JSON`) with safe fallback defaults
- Runtime custom field creation from UI
- Mandatory AI validation before submit (`/api/validate-sow`)
- Authoritative re-validation on submit (`/api/submit-sow`) to prevent client bypass
- Serverless API routes for Vercel
- Supabase persistence for accepted submissions

## Quick Start
```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and set:
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOW_FORM_FIELDS_JSON` (optional JSON array for dynamic fields)

Example `SOW_FORM_FIELDS_JSON`:
```json
[
  {"id":"projectTitle","label":"Project Title","type":"text","required":true},
  {"id":"buyerName","label":"Buyer Name","type":"text","required":true},
  {"id":"scopeSummary","label":"Scope Summary","type":"textarea","required":true}
]
```

## Supabase Table
Run this SQL in Supabase:
```sql
create table if not exists public.sow_submissions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ai_score numeric,
  ai_issues jsonb,
  form_data jsonb not null
);
```

## Deploy on Vercel
1. Push repo to GitHub.
2. Import project in Vercel.
3. Add env vars from `.env.example` in Vercel project settings.
4. Deploy.

Vercel automatically deploys Next.js serverless routes.
