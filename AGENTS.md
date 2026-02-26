# AGENTS.md — AI Agent Instructions

> **🚨 CRITICAL: DO NOT PUSH TO `loganrenz/nuxt-v4-template` 🚨**
>
> This is a **read-only template repository**. Before writing ANY code, you MUST create your own repo:
>
> ```bash
> gh repo create <project-name> --template loganrenz/nuxt-v4-template --private --clone
> cd <project-name>
> npm install
> ```
>
> **Verify your remote** with `git remote -v` — it must NOT point to `loganrenz/nuxt-v4-template`.

This is a **Nuxt 4 + Nuxt UI 4** template deployed to **Cloudflare Workers** with **D1 SQLite** (Drizzle ORM).

## Project Structure

```
app/                  # All frontend code (Nuxt 4 convention)
  components/         # Vue components (thin — delegate logic to composables)
  composables/        # Business logic, state, data fetching
  pages/              # File-based routing
  layouts/            # Page layouts (default, blank, docs)
  middleware/         # Route guards
  types/              # Shared TypeScript interfaces
  assets/css/main.css # Tailwind CSS 4 @theme tokens
  app.config.ts       # Nuxt UI color tokens (primary/neutral)
server/
  api/                # Nitro endpoints — use [name].[method].ts naming
  database/           # Drizzle schema definitions
  middleware/         # CSRF, rate limiting, D1 injection
  utils/              # WebCrypto hashing, DB helpers
content/              # @nuxt/content markdown files
drizzle/              # SQL migration files
.agents/workflows/    # Antigravity audit workflows (run via /slash-commands)
```

## Hard Constraints (Cloudflare Workers)

- **NO Node.js modules** — no `fs`, `path`, `crypto`, `bcrypt`, `child_process`
- **Use Web Crypto API** — `crypto.subtle` for all hashing (PBKDF2)
- **Nitro preset** is `cloudflare-module` (ES Module format, V8 isolates)
- **Drizzle ORM only** — no Prisma or other Node-dependent ORMs
- All server code must be stateless across requests (edge isolate model)

## Nuxt UI 4 Rules

- `UDivider` → renamed to **`USeparator`** in v4
- Icons use `i-` prefix: `i-lucide-home`, not `name="heroicons-..."`
- Use design token colors (`primary`, `neutral`) not arbitrary color strings
- Tailwind CSS 4 — configure via `@theme` in `main.css`, not `tailwind.config`

## SEO (Required on Every Page)

Every page **must** call both:

```ts
useSeo({
  title: '...',
  description: '...',
  ogImage: { title: '...', description: '...', icon: '🎯' },
});
useWebPageSchema({ name: '...', description: '...' }); // or useArticleSchema, useProductSchema, etc.
```

Sitemap and robots.txt are automatic. OG image templates live in `app/components/OgImage/`.

## Architecture Patterns

- **Thin Components, Thick Composables** — components subscribe to composables, pass props down, emit events up. No inline fetch or complex logic in templates.
- **SSR-safe state** — use `useState()` or Pinia stores. Never use bare `ref()` at module scope (causes cross-request leaks).
- **Data fetching** — always use `useAsyncData` or `useFetch`, never raw `$fetch` in `<script setup>`.
- **Client-only code** — wrap `window`/`document` access in `onMounted` or `<ClientOnly>`.

## Form Standards

All forms **must** follow these conventions for consistent width, spacing, and styling:

- **Wrapper**: Use `<AppFormCard>` for the card chrome. Props: `title`, `description`, `icon`, `size` (`narrow` | `default` | `wide` | `full`).
- **Validation**: Use Nuxt UI's native `<UForm :schema :state>` with Zod. Connect fields via `<UFormField name="...">`.
- **Layout classes** (defined in `main.css`):
  - `.form-section` — vertical flex with consistent gap between fields
  - `.form-row` — responsive 2-column grid for side-by-side fields
  - `.form-actions` — right-aligned button row; `.form-actions-full` for full-width buttons; `.form-actions-center` for centered
- **Width presets**: `narrow` (24rem, login/signup), `default` (32rem), `wide` (40rem, contact/settings), `full` (no max-width)

## Starting a New Project from This Template

1. Install dependencies
2. **Critial First Step**: Change the `name` field in `package.json` away from `"nuxt-v4-template"`. Remove the git origin (`git remote remove origin`) so you don't accidentally push commits to the template repository.
3. Delete demo files: `app/pages/components.vue`, `app/pages/todos.vue`, `server/api/todos*`, `app/components/AuthDemo.vue`
4. Keep: `app/app.vue`, `server/utils/auth.ts`, `server/api/auth/*`, `server/database/schema.ts`
5. Update `nuxt.config.ts` `site` block with your domain and site name

## 🚨 CRITICAL RULE: NEVER COMMIT TO THIS REPOSITORY 🚨

If you are an agent building a new project inside a clone of this repository, **DO NOT COMMIT OR PUSH** directly back to `loganrenz/nuxt-v4-template`. You must ensure the user has set up a new remote origin first, or you are working in a detached environment. Accidental commits to the template repo will break it for everyone.

## Testing Infrastructure

This template includes a dual-layer testing strategy:

- **Unit & Composables (Vitest)**: Run `npm run test:unit`. Uses `@nuxt/test-utils` for full Nuxt environment context.
- **End-to-End (Playwright)**: Run `npm run test:e2e`. Playwright automatically spins up the Nuxt 4 dev server for isolated routing and UI checks.

## Quality Audit Workflows

Run these during development (Antigravity slash-commands, or manually follow the steps):

| Workflow                  | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| `/check-nuxt-ui-v4`       | Validates UI 4 component usage                      |
| `/check-nuxt-ssr`         | Validates SSR-safe data fetching and hydration      |
| `/check-store-separation` | Validates thin component / thick composable pattern |
| `/check-nitro-edge`       | Validates Cloudflare Workers compatibility          |

## Analytics & SEO

This template ships with **PostHog**, **GA4**, **Google Search Console**, and **IndexNow** — all wired up and ready to go. Universal management keys live in the **`narduk-analytics`** Doppler project.

**See [AGENT_ANALYTICS.md](./AGENT_ANALYTICS.md) for the full setup guide**, including:

- Doppler two-tier architecture (`narduk-analytics` → per-app project)
- `npm run setup:all` one-command bootstrap
- Environment variable reference
- How each plugin/route works
