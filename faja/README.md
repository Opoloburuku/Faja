# Faja (working name)

Lead engine: public intent signals -> scored leads -> matched to at most 3 businesses per lead (or 1 with a territory lock).

## What's already live
- **Supabase project `faja`** (ca-central-1): https://gxhnkffqgycfajhuxylz.supabase.co
  - Schema, row-level security, matching (`assign_leads`), onboarding (`create_workspace`)
  - Edge function `connector-calgary-permits` pulls City of Calgary open-data permits
  - Scheduled daily at 4:15 am Calgary time (pg_cron)

## Deploy the web app (about 5 minutes)
1. Install the Vercel CLI and sign in: `npm i -g vercel && vercel login`
2. From the `web` folder: `vercel --prod`
3. When asked, accept the Next.js defaults. Then add these environment variables in the
   Vercel project settings (or with `vercel env add`), and redeploy:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://gxhnkffqgycfajhuxylz.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_uX4-VbEQrKPMRcrc0kk81g_GV2XHfRm` (public key, safe in the browser)
4. In Supabase: Authentication -> URL Configuration -> set **Site URL** to your Vercel URL and add
   `https://<your-vercel-url>/auth/callback` to Redirect URLs, so sign-up confirmation emails work.

Run locally: `cd web && npm install && npm run dev` (uses `.env.local`, already filled in).

## Layout
- `web/` Next.js 14 app: landing, sign-in, onboarding, lead feed, pipeline
- `supabase/functions/connector-calgary-permits/` the first connector
- Database schema lives in the live Supabase project (see its Database and Migrations pages)
