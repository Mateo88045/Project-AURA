# Aura — parallel workstream agents (task aggregation)

Use this doc to split work across **focused agents** (separate Cursor chats, engineers, or future automation). Each agent owns paths and rules; the **rollup** section is the single checklist everyone updates.

Align with [CLAUDE.md](../CLAUDE.md): Dev A = mobile UI only; Dev B = Supabase / Trigger / integrations. The agents below map to those boundaries where possible.

---

## Agent A — `TriggerWorker`

**Owns**

- [`packages/trigger/`](../packages/trigger/) — `trigger.config.ts`, task definitions, deploy/dev CLI
- Pipeline A job logic (fetch → normalize → **Gemini grade** → **deterministic** schedule → shadow write → notify), once integrations exist

**Does not own**

- Expo screens under `apps/mobile/app/`
- Putting `TRIGGER_SECRET_KEY` in the mobile app

**Environment**

- `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_REF` (or `TRIGGER_PROJECT_ID`), future `GOOGLE_GENERATIVE_AI_API_KEY` / Supabase service role inside worker only

**Starter prompt (paste into a dedicated chat)**

> You are Agent TriggerWorker. Only edit `packages/trigger/`. Implement or harden Trigger.dev v3 tasks; keep the scheduler non-LLM. Do not touch `apps/mobile/app/`.

---

## Agent B — `HttpApi`

**Owns**

- [`apps/api/`](../apps/api/) — Hono server, `/v1/jobs/*`, `/v1/chat`, auth stub → later Supabase JWT

**Does not own**

- Trigger task implementations (call `tasks.trigger` only)
- Mobile UI

**Environment**

- `TRIGGER_SECRET_KEY`, `AURA_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `ENABLE_GEMINI_ROUTER`, `PORT`

**Starter prompt**

> You are Agent HttpApi. Only edit `apps/api/`. Proxy job triggers to Trigger.dev; implement chat with Claude + optional Gemini router. Do not add secrets to Expo.

---

## Agent C — `MobileClient`

**Owns**

- [`apps/mobile/`](../apps/mobile/) — UI, `services/*` calling the API with `EXPO_PUBLIC_*` only

**Does not own**

- Real Supabase queries (stubs + TODOs per CLAUDE.md)
- Trigger task code

**Environment**

- `EXPO_PUBLIC_AURA_API_URL`, optional `EXPO_PUBLIC_AURA_API_KEY` (must match API `AURA_API_KEY` when set)

**Starter prompt**

> You are Agent MobileClient. Only edit `apps/mobile/`. Replace any direct `@aura/trigger` usage with `fetch` to the Aura API. Build chat UI and job buttons; no API keys for Anthropic/Google in Expo.

---

## Agent D — `PlatformDocs`

**Owns**

- Root [`package.json`](../package.json) scripts (`api`, `trigger:dev`, …)
- `.env.example`, `.gitignore` (e.g. `.trigger`), smoke-test docs under `docs/`

**Does not own**

- Business logic inside tasks or screens

**Starter prompt**

> You are Agent PlatformDocs. Add scripts, env examples, and a short smoke-test doc. Do not change scheduler or LLM prompts unless fixing typos in docs.

---

## Aggregated rollup (single checklist)

Mark items done in one place (PR description or this file).

| ID | Task | Owner agent | Status |
|----|------|-------------|--------|
| R1 | Trigger: `pnpm trigger:dev` runs; tasks registered; project ref set | TriggerWorker | |
| R2 | API: `/health` + `/v1/jobs/daily-sync` returns `runId` when `TRIGGER_SECRET_KEY` set | HttpApi | |
| R3 | API: `/v1/chat` works with `ANTHROPIC_API_KEY`; optional Gemini router | HttpApi | |
| R4 | Mobile: `jobs` service uses API only (no `@aura/trigger` in bundle) | MobileClient | |
| R5 | Mobile: AI chat screen lists messages + composer + errors | MobileClient | |
| R6 | Mobile: Today (or Settings) triggers daily sync via API | MobileClient | |
| R7 | Root scripts + `.env.example` + smoke doc | PlatformDocs | |
| R8 | Supabase: replace stubs (separate Dev B milestone) | Dev B | |

---

## How to “aggregate” in practice

1. Open **one chat per agent** (or one engineer per row) and paste the starter prompt + link to this file.
2. After each PR, update the **rollup table** so the next agent knows what’s unblocked.
3. **Merge order** when wiring end-to-end: TriggerWorker (tasks deploy) → HttpApi (trigger + chat) → MobileClient (UI) → PlatformDocs (polish).

---

## Contract between agents

- **Job IDs** must match between `packages/trigger` task `id` and `tasks.trigger("<id>", payload)` in `apps/api`.
- **Chat request/response** shape is owned by HttpApi; MobileClient must match (`messages[]` → `{ message, action?, router? }`).
