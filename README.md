# Glass Garden Rooms website + quotes app

One project, one Vercel deployment, one domain.

| Address | What it is |
| --- | --- |
| `/`, `/verandas.html`, `/blog/...` | The public website. Plain static HTML in `public/`, served exactly as written. |
| `/quotes` | Steve's private quotes app. Requires sign-in. |
| `/proposal/<code>` | The proposal link a client receives. Public but unguessable, and not indexed. |

## Folder layout

- `public/` holds the website: HTML pages, `css/`, `js/`, `images/`, `Brand/`, `blog/`, PDFs, `sitemap.xml`, `robots.txt`. Edit these files as before. They are not processed in any way.
- `public/library/` holds the starter photos for the quotes photo library.
- `app/`, `components/` and `lib/` hold the quotes app (Next.js).
- `web/` and `studio/` are old builds kept for history. They are not served, and `vercel.json` redirects their addresses to the homepage.
- `vercel.json` keeps the website's existing redirects and headers.

## Website SEO

Website pages are served as static files and never pass through Next.js. The homepage is served at `/` from `public/index.html`. Unknown addresses show the existing "page moved" 404 page and redirect home. The quotes app and proposals carry `noindex`, and `robots.txt` disallows `/quotes`.

## The quotes app

- **Sign-in.** Email and password. "Keep me signed in" lasts 30 days on that device, and the browser can save the password. Add more users in Settings.
- **Quotes save automatically.** Statuses are Draft, Sent, Opened by client, and Accepted. Numbering continues from `QUOTE_START_NUMBER`.
- **Steve enters the prices.** That covers the package, upgrades, installation and discount. The totals and the 12-month 0% finance figure are calculated.
- **GoHighLevel.**
  - Search contacts to fill in client details.
  - "Send via GoHighLevel" emails the proposal link from GoHighLevel, creates the contact if new, and creates or updates an opportunity.
  - It tags the contact `quote-sent`, then `quote-viewed` on first open and `quote-accepted` on Accept. Use these tags to trigger follow-up workflows.
- **Photo library.** Tagged photos are suggested for each quote, and "Pick the best 4 for me" fills them in.
- **Proposal.** Seven A4 pages that read well on phones, download as a PDF, and have an online Accept button.

## Run locally

```bash
cp .env.example .env.local      # fill in AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run dev                     # website: http://localhost:3100  quotes: http://localhost:3100/quotes
```

Without `DATABASE_URL`, quote data is stored in `data/store.json`, which is git-ignored.

## Deploy (existing glassgardenrooms.net Vercel project)

1. Under **Project Settings > Build & Deployment**:
   - set **Framework Preset** to **Next.js**;
   - leave **Root Directory** empty, which means the repository root;
   - clear any custom Output Directory.
2. Under **Storage**, create:
   - a **Neon Postgres** database, which sets `DATABASE_URL`;
   - a **Blob** store, which sets `BLOB_READ_WRITE_TOKEN` and is needed for photo uploads.
3. Under **Environment Variables**, add the variables in `.env.example`:
   - `AUTH_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `APP_URL=https://www.glassgardenrooms.net`
   - `QUOTE_START_NUMBER`
   - the `GHL_...` values
4. Push the branch and check the **preview deployment**. Then deploy to production.
   - Website pages, images and the contact form should work as before.
   - `/quotes` should ask for a sign-in.
5. Sign in at `/quotes` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`; that first account is created on the first sign-in. Then change the password in Settings.

## Connect GoHighLevel

1. In the sub-account, go to **Settings > Private Integrations** and create a token with these scopes:
   - `contacts.readonly`
   - `contacts.write`
   - `conversations.readonly`
   - `conversations.write`
   - `conversations/message.write`
   - `opportunities.readonly`
   - `opportunities.write`
2. Set `GHL_PRIVATE_INTEGRATION_TOKEN` (it starts `pit-`) and `GHL_LOCATION_ID`, then redeploy.
3. Open `/quotes/settings`. It confirms the connection and lists your pipelines and stage IDs. Copy the chosen ones into the variables below, then redeploy:
   - `GHL_PIPELINE_ID`
   - `GHL_STAGE_SENT_ID`
   - `GHL_STAGE_ACCEPTED_ID`
4. Optional: set `GHL_EMAIL_FROM` to an address allowed in GoHighLevel's email settings.

Until GoHighLevel is connected, type client details by hand and use **Copy client link**.
