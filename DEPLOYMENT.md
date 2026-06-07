# Deploying LiveBid for Free

This guide deploys the full stack for **$0/month** (plus ~pennies for S3 storage):

| Piece | Host | Plan | Notes |
|---|---|---|---|
| Next.js frontend | [Vercel](https://vercel.com) | Hobby (free) | No credit card |
| Spring Boot API | [Render](https://render.com) | Free web service | No credit card; Docker deploy |
| PostgreSQL | [Neon](https://neon.com) | Free | No credit card; 0.5 GB |
| Redis | Render Key Value | Free | Created automatically by `render.yaml` |
| Images | AWS S3 (existing bucket) | — | Already configured; ~$0.01/mo at hobby scale |

```
Browser ──HTTPS──> Vercel (Next.js)
   │
   ├──REST + SockJS/STOMP──> Render (Spring Boot API) ──> Neon (Postgres)
   │                                   └──> Render Key Value (Redis)
   └──pre-signed PUT/GET──> AWS S3
```

---

## Step 1 — Neon (PostgreSQL)

1. Sign up at https://neon.com (GitHub login works, no card).
2. Create a project (e.g. `livebid`), region **AWS us-west-2 (Oregon)** to sit near the Render backend.
3. On the project dashboard, open **Connect** and copy the **direct** connection string
   (toggle "Connection pooling" **off** — Hibernate/HikariCP prefers the direct endpoint; the
   direct host has no `-pooler` in its name).
   It looks like: `postgresql://neondb_owner:PASSWORD@ep-xxx-123.us-west-2.aws.neon.tech/neondb?sslmode=require`
4. Translate it into the three values Render will ask for:
   - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://ep-xxx-123.us-west-2.aws.neon.tech/neondb?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME` = `neondb_owner`
   - `SPRING_DATASOURCE_PASSWORD` = the password from the string

> The schema is created automatically on first boot (`spring.jpa.hibernate.ddl-auto=update`).
> Free-tier Neon suspends compute after 5 min idle; the first query after idle takes ~1s extra. Harmless.

## Step 2 — Render (backend + Redis)

1. Sign up at https://render.com with GitHub (no card).
2. **New → Blueprint**, select the `LiveBid` repo. Render reads [`render.yaml`](render.yaml)
   and creates two resources: `livebid-api` (Docker web service) and `livebid-redis` (Key Value).
3. When prompted for env vars, paste:
   - The three `SPRING_DATASOURCE_*` values from Step 1
   - `GOOGLE_CLIENT_ID` — same value as your local `.env`
   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — same as your local `.env`
   - (`JWT_SECRET` is auto-generated; Redis host/port are auto-wired)
4. Deploy. First build takes ~5–10 min (Maven build inside Docker on 0.1 CPU).
5. Verify: `https://livebid-api.onrender.com/auctions` should return JSON (`[]` on a fresh DB).
   Your exact URL is shown on the service page.

## Step 3 — Vercel (frontend)

1. Sign up at https://vercel.com with GitHub (Hobby plan, no card).
2. **Add New → Project**, import the `LiveBid` repo.
3. Set **Root Directory** to `livebid-ui` (Framework preset: Next.js auto-detects).
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://livebid-api.onrender.com` (your Step 2 URL, **no trailing slash**)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` = same client ID as the backend
5. Deploy. You get `https://<project>.vercel.app`.

## Step 4 — Google OAuth: authorize the new domain

Sign-in will fail until Google trusts the Vercel origin:

1. Open https://console.cloud.google.com/apis/credentials and edit your OAuth 2.0 Client ID.
2. Under **Authorized JavaScript origins**, add `https://<project>.vercel.app`
   (keep `http://localhost:3000` for local dev).
3. Save (can take a few minutes to propagate).

## Step 5 — S3 CORS: allow uploads from the new domain

The bucket currently only allows `http://localhost:3000`. Add the Vercel origin:

```bash
aws s3api put-bucket-cors --bucket livebid-auction-images --region us-east-2 --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://<project>.vercel.app"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3000
  }]
}'
```

## Step 6 — Keep the backend awake (optional but recommended)

Render's free tier spins the service down after **15 minutes** without inbound traffic.
While asleep: requests take ~30–60s to cold-start the JVM, WebSockets drop, and the
**auction-closing scheduler doesn't run** (expired auctions close late, on next wake).

Fix with a free uptime pinger — e.g. https://uptimerobot.com (free, no card):
create an HTTP(S) monitor for `https://livebid-api.onrender.com/auctions` at a
**5-minute interval**. One always-awake service fits within Render's 750 free
instance-hours/month (a full month is ~744 h).

## Smoke test

1. Open `https://<project>.vercel.app` — auction list loads (empty on fresh DB).
2. Sign in with Google.
3. Create an auction with an image → image preview renders (S3 upload + pre-signed GET).
4. Start the auction, place a bid from a second browser/incognito profile — the price
   updates live in both windows (WebSocket).
5. Let the auction expire — within ~10s it flips to CLOSED and the winner gets a notification
   (scheduler; requires the backend to be awake).

## Free-tier caveats

- **Render free (512 MB / 0.1 CPU):** JVM boots in ~2–4 min on cold deploy. The Dockerfile
  caps heap at 75% of the container (`-XX:MaxRAMPercentage=75.0`).
- **Render Key Value free:** 25 MB, no persistence — fine, it's a non-authoritative price cache;
  Postgres remains the source of truth.
- **Neon free:** 0.5 GB storage, compute autosuspends after 5 min idle (sub-second wake).
- **Vercel Hobby:** non-commercial use only; 100 GB bandwidth/month.
- **AWS S3:** the only non-free piece — a few hundred MB of images plus hobby traffic costs
  cents per month (egress under AWS's 100 GB/mo free allowance).
