# TL Alumni Network

A portal for TL startup accelerator club alumni — semantic people search, live 3D globe, editable profiles, and admin messaging tools.

## Quick start

```bash
npm install
npm run seed    # Generate demo alumni data from data/seed-alumni.csv
npm run dev     # http://localhost:3000
```

### Demo login accounts

| Email | Role |
|-------|------|
| `president@usc.edu` | Admin |
| `copresident@usc.edu` | Admin |
| `jordan.kim@usc.edu` | Member |
| `liam.o_brien@gmail.com` | Member (approved personal domain) |

## Features

- **Semantic search** — natural language + structured filters (program, division, industry)
- **3D globe** — alumni pins with zoom, filters, realtime refresh
- **Profiles** — editable profiles with geocoded location
- **Admin** — text blasts, event invites, domain allowlist, analytics
- **Embed mode** — `/embed` route for future website integration

## Configuration

Copy `.env.example` to `.env.local`. The app runs in **demo mode** without Supabase env vars using seeded JSON data.

### Allowed email domains

Edit [`config/allowed-domains.json`](config/allowed-domains.json) or use Admin → Users to add domains.

### Seed data

Update [`data/seed-alumni.csv`](data/seed-alumni.csv) with your roster, then run `npm run seed`.

## Production setup

1. Create a [Supabase](https://supabase.com) project
2. Run [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) then [`002_auth_rls_invites.sql`](supabase/migrations/002_auth_rls_invites.sql)
3. Set Supabase env vars
4. Set `OPENAI_API_KEY` for production-quality semantic search
5. Set SendBlue credentials for iMessage/SMS
6. Deploy to [Vercel](https://vercel.com)

## Project structure

```
src/app/          Next.js routes (home, globe, profile, admin, embed)
src/components/   UI, globe, search, profile, admin
src/lib/          Search, embeddings, messaging, geocoding, data stores
supabase/         Postgres schema + pgvector
config/           Allowed email domains
data/             Alumni seed CSV
scripts/          Seed generator + Supabase import
```

## Embed (Phase 4)

```html
<iframe
  src="https://alumni.yoursite.com/embed?accent=%236366f1"
  width="100%"
  height="600"
  frameborder="0"
></iframe>
```
# troylabs-alumni-network
