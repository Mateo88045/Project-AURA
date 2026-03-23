# Aura

Agentic scheduling app for U.S. high school students. See **[CLAUDE.md](./CLAUDE.md)** for product and implementation rules.

## Parallel workstreams

To split Trigger.dev, API, mobile, and docs work across separate chats or owners, use **[docs/AGENTS.md](./docs/AGENTS.md)** — it defines four agents and a single **aggregated task rollup** table.

## Smoke test (Trigger + API + chat)

Follow **[docs/SMOKE_TRIGGER_API.md](./docs/SMOKE_TRIGGER_API.md)**. Copy **[.env.example](./.env.example)** into `apps/api/.env.local` and set `EXPO_PUBLIC_*` in Expo as needed.
