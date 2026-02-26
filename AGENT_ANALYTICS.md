# AGENT_ANALYTICS.md — Analytics & SEO Setup Guide

This template includes **batteries-included analytics** for PostHog, Google Analytics 4, Google Search Console, and IndexNow. All secrets are managed via **Doppler**.

## Doppler Architecture

There are **two Doppler projects** involved:

| Project            | Purpose                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `narduk-analytics` | **Universal management keys** — shared across all apps. Contains: `POSTHOG_PERSONAL_API_KEY`, `GA_ACCOUNT_ID`, `GSC_SERVICE_ACCOUNT_JSON` (or `_PATH`), `GSC_USER_EMAIL` |
| `<app-name>`       | **Per-app keys** — created by `setup-new-app.mjs`. Contains: `POSTHOG_PUBLIC_KEY`, `GA_MEASUREMENT_ID`, `INDEXNOW_KEY`, `SITE_URL`, `APP_NAME`                           |

The automation scripts in `tools/setup-analytics.ts` use the universal keys from `narduk-analytics` to **create** app-specific resources (PostHog projects, GA4 properties, GSC registrations) and then write the resulting per-app keys to the app's Doppler project.

## Quick Start (New App)

```bash
# 1. Check what's configured
doppler run --project narduk-analytics --config base -- npm run setup

# 2. Full bootstrap — creates PostHog project, GA4 property, GSC verification file, IndexNow key
doppler run --project narduk-analytics --config base -- npm run setup:all

# 3. Deploy so Google can find the GSC verification file
npm run deploy

# 4. Verify GSC ownership + submit sitemap (run AFTER deploy)
doppler run --project narduk-analytics --config base -- npm run setup:gsc:verify
```

## What Each Service Does

### PostHog (`app/plugins/posthog.client.ts`)

- **Plugin**: Client-only, reads `POSTHOG_PUBLIC_KEY` from runtimeConfig
- **SPA tracking**: Manual `$pageview` capture on `router.afterEach`
- **Localhost**: Opts out of capturing entirely
- **Internal traffic**: Tags `.pages.dev` hostnames with `is_internal_user: true`
- **Setup automation**: `npm run setup:posthog` creates a PostHog project via API using `POSTHOG_PERSONAL_API_KEY` from `narduk-analytics`

### Google Analytics 4 (`app/plugins/gtag.client.ts`)

- **Plugin**: Client-only, reads `GA_MEASUREMENT_ID` from runtimeConfig
- **Script injection**: Dynamically injects `gtag.js` (no SSR penalty)
- **SPA tracking**: Sends `page_view` events on route changes
- **Localhost**: Skips entirely
- **Setup automation**: `npm run setup:ga` creates a GA4 property + web data stream via Google Analytics Admin API using the service account from `narduk-analytics`

### Google Search Console (`tools/setup-analytics.ts` + `tools/gsc-toolbox.ts`)

- **Registration**: Adds site URL to GSC
- **Verification**: Creates `public/google*.html` file + no-extension fallback (Cloudflare compatibility)
- **Ownership grant**: Adds `GSC_USER_EMAIL` as owner so the property appears in your personal GSC dashboard
- **Sitemap submission**: Auto-submits `sitemap.xml` after verification
- **Two-step flow**: `npm run setup:gsc` (pre-deploy) → deploy → `npm run setup:gsc:verify` (post-deploy)

### IndexNow (`server/routes/[key].txt.ts` + `server/api/indexnow/submit.post.ts`)

- **Key verification**: Dynamic server route serves the key at `/{key}.txt` — no static file needed
- **URL submission**: POST to `/api/indexnow/submit` with `{ "urls": [...] }` to ping Bing/Yandex/Seznam/Naver
- **Auto-generation**: `npm run setup:all` generates a random 32-char key and saves it to Doppler
- **Post-deploy usage**:
  ```bash
  curl -X POST https://your-site.com/api/indexnow/submit \
    -H "Content-Type: application/json" \
    -d '{"urls": ["https://your-site.com/", "https://your-site.com/about"]}'
  ```

## Environment Variables Reference

### Universal Keys (in `narduk-analytics` Doppler project)

| Key                             | Format                     | Purpose                                  |
| ------------------------------- | -------------------------- | ---------------------------------------- |
| `POSTHOG_PERSONAL_API_KEY`      | `phx_...`                  | Creates PostHog projects via API         |
| `POSTHOG_HOST`                  | `https://us.i.posthog.com` | PostHog API host (US or EU)              |
| `GA_ACCOUNT_ID`                 | `123456789`                | Google Analytics account ID              |
| `GSC_SERVICE_ACCOUNT_JSON_PATH` | `./key.json`               | Path to GCP service account key          |
| `GSC_SERVICE_ACCOUNT_JSON`      | `{...}` or base64          | Inline service account key (alternative) |
| `GSC_USER_EMAIL`                | `user@gmail.com`           | Email to grant GSC ownership             |

### Per-App Keys (in app's Doppler project)

| Key                  | Format              | Created By                      |
| -------------------- | ------------------- | ------------------------------- |
| `POSTHOG_PUBLIC_KEY` | `phc_...`           | `setup:posthog`                 |
| `GA_MEASUREMENT_ID`  | `G-XXXXXXX`         | `setup:ga`                      |
| `INDEXNOW_KEY`       | 32-char hex         | `setup:all` or `setup:indexnow` |
| `SITE_URL`           | `https://myapp.com` | Manual (required before setup)  |
| `APP_NAME`           | `my-app`            | From `package.json` name        |

## npm Scripts

| Script                     | Command                                         |
| -------------------------- | ----------------------------------------------- |
| `npm run setup`            | Check status of all 4 services                  |
| `npm run setup:all`        | Full bootstrap (PostHog → GA4 → GSC → IndexNow) |
| `npm run setup:posthog`    | Create PostHog project only                     |
| `npm run setup:ga`         | Create GA4 property + web stream only           |
| `npm run setup:gsc`        | GSC: register + create verification file        |
| `npm run setup:gsc:verify` | GSC: verify ownership + submit sitemap          |

## Files Overview

```
app/plugins/
  posthog.client.ts         # PostHog tracking (client-only)
  gtag.client.ts            # GA4 tracking (client-only)
server/routes/
  [key].txt.ts              # IndexNow key verification endpoint
server/api/indexnow/
  submit.post.ts            # IndexNow URL submission API
tools/
  setup-analytics.ts        # Main setup automation (all services)
  gsc-toolbox.ts            # Standalone GSC management
```

## Graceful Degradation

All plugins **no-op gracefully** when their keys are empty:

- No PostHog key → plugin returns early, no tracking
- No GA4 ID → plugin returns early, no script injected
- No IndexNow key → `/{key}.txt` returns 404, submit endpoint returns 400

This means the template works in dev and CI without any analytics keys configured.
