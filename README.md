# PillPath

A calm, mobile-first PWA for tracking medication when headaches or migraines are in play.

There are two separate lists on purpose:

- **As-needed** — extra pills (for example max 8 in 24 hours), with warnings as you near the limit
- **Daily** — regular medication, including whether the dose is going up, coming down, or holding

Samuel can log for his partner. She can log too. Both see the same result.

## Stack

- Vite + React + TypeScript
- TanStack Router
- Tailwind CSS
- Cloudflare Workers + D1
- Installable PWA

## Local development

```bash
npm install
npm run dev
```

The Worker creates the D1 tables on first request, so a local database is enough to start.

## Deploy to Cloudflare

1. Log in: `npx wrangler login`
2. Create D1: `npx wrangler d1 create pillpath`
3. Put the returned `database_id` into `wrangler.jsonc`
4. Apply the schema: `npx wrangler d1 migrations apply pillpath --remote`
5. Deploy: `npm run deploy`

Then attach a custom subdomain in the Cloudflare dashboard (Workers & Pages → pillpath → Custom Domains), for example `pillpath.yourdomain.com`.

## Phone install

Open the deployed URL on a phone. Android can use the install prompt. On iPhone use Share → Add to Home Screen.
