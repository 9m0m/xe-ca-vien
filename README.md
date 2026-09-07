# Xe Cá Viên — Antigravity Starter Pack

Copy these files into the root of the `xe-ca-vien` repository.

## Antigravity

Set `.agents/rules/00-project-core.md` as an **Always On** Workspace Rule.

Antigravity's official docs place workspace rules under `.agents/rules/`.
The workflow can be invoked as `/build-game` if your Antigravity setup exposes workspace workflows.

## Suggested first prompt

Read the Always On workspace rule and all referenced docs. Initialize the Xe Cá Viên repository and execute `/build-game`. Start at Phase 1 and continue phase-by-phase. Preserve the documented stack and do not generate final art yet. Verify typecheck, lint, tests and production build at each phase.

## Infrastructure

Frontend + API: Vercel
PostgreSQL: Neon through Vercel Marketplace
ORM: Drizzle
Guest identity: server-issued session initially
Optional cross-device auth: Better Auth / Neon Auth later
