# Copilot instructions for this repository

Quick, actionable guidance for AI coding assistants working in this monorepo (backend Express + frontend React/Vite). Keep suggestions small, focused, and tied to concrete files.

What this repo is

- Monorepo (pnpm) with two packages: `packages/backend` (Express + TypeScript + Prisma) and `packages/frontend` (Vite + React).
- Backend provides REST API, authentication via `better-auth`, Prisma ORM, and several on-chain providers/tools under `src/providers`, `src/services`, and `src/utils`.

High-level architecture (why it matters)

- Backend is the main integration point for external services: Solana RPC (see `src/utils/rpc.ts`), Solana-specific metadata providers (`src/providers/*`), and UploadThing file uploads (`src/utils/uploadthing.ts`). Prefer changes in backend services to be small and well-tested.
- Provider pattern: `services/*.ts` define small service classes (e.g., `onchain.service.ts`, `token-volume-service.ts`) that "register" provider instances (see `registerProvider` usage in `src/services/*` and `src/utils/tools.ts`). When adding a new provider, implement the interface in `src/interfaces` and register it in the appropriate service/tool.
- Prisma is used for persistence; client is created once in `src/config/database.ts`. Use `prisma` import from that module.

Developer workflows (concrete commands)

- Run both apps locally: `npm run dev` (root) — uses workspaces.
- Backend dev only: `npm run dev --workspace=backend` (or `npm run dev:backend`). Backend scripts live in `packages/backend/package.json` (e.g., `dev`, `build`, `db:generate`, `db:migrate`, `db:seed`).
- Generate Prisma client: `cd packages/backend && npm run db:generate` (or from root via workspace script).
- Typecheck: `npm run type-check` at root (runs across workspaces).

Project-specific patterns & conventions

- Environment: `.env` in `packages/backend` contains secrets (e.g., `UPLOADTHING_TOKEN`, `SOLANA_TRACKER_API`). Don't commit secrets. When adding env usage, add it to `AUTH_STRUCTURE.md` or README.
- Better-auth integration: `src/index.ts` wires the auth handler using `toNodeHandler(auth)`; frontend uses `better-auth/react` helpers. For routes that use sessions, look for `fromNodeHeaders` usage in `src/utils/uploadthing.ts` and `middleware/auth.ts`.
- Provider + service fallback pattern: Services iterate registered providers and return first successful result; errors are collected and only thrown if all providers fail (see `src/services/onchain.service.ts` and `src/utils/tools.ts`). Follow this pattern for reliability.
- RPC & multi-provider connection: Use `createMultiProviderConnection()` from `src/utils/rpc.ts` for Solana network calls — it tries multiple RPC endpoints.
- Error handling: Centralized middleware in `src/middleware/errorHandler.ts` handles Prisma errors and maps them to HTTP responses. When adding new errors, update that middleware.

Files to inspect for changes (quick reference)

- Backend entry: `packages/backend/src/index.ts` (server wiring, auth, health checks)
- Auth & DB: `packages/backend/src/utils/auth.ts`, `packages/backend/src/config/database.ts`, `packages/backend/AUTH_STRUCTURE.md`
- Providers: `packages/backend/src/providers/*` (e.g., `rpc-provider.ts`, `solanatracker-provider.ts`, Metaplex helpers)
- Services: `packages/backend/src/services/*` (onchain.service.ts, token-volume-service.ts)
- Tools & agent flows: `packages/backend/src/utils/tools.ts` (AI tool integrations and token analysis flow)
- Routes: `packages/backend/src/routes/*` (chat, users, uploadthing route wiring)
- Frontend upload helper: `packages/frontend/app/lib/uploadthing.tsx` (uses http://localhost:3000/api/uploadthing by default)

Concrete examples to follow

- Add provider: implement interface in `src/interfaces/token-metadata.ts`, create provider in `src/providers/`, and register with `MetadataService.registerProvider()` in `src/utils/tools.ts` or during app init.
- DB access: import `prisma` from `src/config/database.ts` and prefer `prisma.$transaction` for multi-step changes.
- File uploads: follow `src/utils/uploadthing.ts` for server-side UploadThing router + `packages/frontend/app/lib/uploadthing.tsx` for client helpers.

When to ask the human

- If a change needs new environment variables (ask for .env values or guidance on how to mock them locally).
- If database schema changes are required (create Prisma migration and run `npm run db:migrate` — coordinate with maintainers).
- If a new external API key/service is required (confirm usage, rate limits, billing implications).

Testing and quick validation

- Run `npm run dev --workspace=backend` and hit `/api/health` and `/db-health` to validate server + DB connectivity.
- For provider code, add a small smoke test in `packages/backend/src/providers/__playground__.ts` (temporary) that constructs the provider and calls a single method; remove before commit.

Keep suggestions safe and minimal

- Avoid heavy refactors across many files in one PR. Prefer incremental changes and follow existing registration/fallback patterns.

If anything here is unclear or you'd like a different focus (e.g., more frontend guidance or CI/workflow rules), tell me and I'll iterate.
