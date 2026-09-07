# Production magic-link checklist (do not commit secrets)

## Why production is still demo
`GET https://troylabs-alumni-network.vercel.app/api/auth/login` returns `{"mode":"demo"}`.
That means Vercel is missing `NEXT_PUBLIC_SUPABASE_URL` and/or `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 1. Add env vars in Vercel
Project → Settings → Environment Variables → add for Production + Preview:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | same as local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as local `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | same as local `.env.local` |
| `NEXT_PUBLIC_APP_URL` | `https://troylabs-alumni-network.vercel.app` |
| `OPENAI_API_KEY` | same as local (for search) |

`NEXT_PUBLIC_*` vars are baked in at **build** time — you must redeploy after adding them.

## 2. Redeploy
Deployments → … on latest → Redeploy (or push a commit).

## 3. Supabase Auth URLs
Supabase → Authentication → URL Configuration:

- Site URL: `https://troylabs-alumni-network.vercel.app`
- Redirect URLs (add all):
  - `https://troylabs-alumni-network.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - optional preview wildcard: `https://*.vercel.app/auth/callback`

## 4. Verify
Open: `https://troylabs-alumni-network.vercel.app/api/auth/login`

Expected: `{"mode":"magic"}`

Then login should say “Email me a link”.
