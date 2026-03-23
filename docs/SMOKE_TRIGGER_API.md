# Smoke test: Trigger.dev + Aura API + Expo

## Prerequisites

1. [Trigger.dev](https://trigger.dev) account, project created, **DEV** secret key copied.
2. Set `TRIGGER_PROJECT_REF` in `packages/trigger` environment (same ref as dashboard) when running the Trigger CLI.
3. Anthropic API key for chat; optional Google AI key for Gemini router.

## 1. Configure env

- Copy [`.env.example`](../.env.example) values into **`apps/api/.env.local`** (create the file).
- Ensure `TRIGGER_SECRET_KEY` and `ANTHROPIC_API_KEY` are set for full flow.
- Optional: set `AURA_API_KEY` and the same value in Expo as `EXPO_PUBLIC_AURA_API_KEY`.

## 2. Run three processes

| Terminal | Command | Notes |
|----------|---------|--------|
| A | `pnpm trigger:dev` | Run from repo root; CLI uses `packages/trigger/trigger.config.ts`. Login via `npx trigger.dev@latest login` if needed. |
| B | `pnpm api` | Starts Hono on `http://127.0.0.1:8787` (or `PORT`). |
| C | `pnpm mobile` | Then `i` / `a` for simulator. |

## 3. API health

```bash
curl -s http://127.0.0.1:8787/health
```

Expect `{"ok":true}`.

## 4. Trigger a job (daily sync)

```bash
curl -s -X POST http://127.0.0.1:8787/v1/jobs/daily-sync \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-1"
```

If `AURA_API_KEY` is set, add:

`-H "Authorization: Bearer <your-key>"`

Expect JSON with `runId`. Confirm the run appears in the Trigger.dev dashboard.

## 5. Chat (Claude + optional Gemini)

```bash
curl -s -X POST http://127.0.0.1:8787/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-1" \
  -d '{"messages":[{"role":"user","content":"What is Aura?"}]}'
```

Expect `message` and optional `router` / `action`.

## 6. Mobile

- Set `EXPO_PUBLIC_AURA_API_URL` to the machine IP the device/emulator can reach (e.g. `http://127.0.0.1:8787` for iOS simulator; Android emulator often needs `http://10.0.2.2:8787`).
- **Today**: tap **Refresh from school** — should show a run id or an error if API/Trigger is down.
- **AI → Chat**: send a message — should show an assistant reply when `ANTHROPIC_API_KEY` is set.

## Task IDs (must match API and `packages/trigger`)

| Task id | Route |
|---------|--------|
| `daily-assignment-trigger` | `POST /v1/jobs/daily-sync` |
| `shadow-replan` | `POST /v1/jobs/shadow-replan` |
| `sunday-briefing` | `POST /v1/jobs/sunday-briefing` |
