---
description: Build Xe Cá Viên phase-by-phase from repository foundation through a deployable release
---

# /build-game

Read:

- @.agents/rules/00-project-core.md
- @docs/GAME_SPEC.md
- @docs/FOOD_CATALOG.md
- @docs/ART_BIBLE.md

Then execute the project in the phase order defined in GAME_SPEC.

Rules:

1. Inspect the current repository before acting.
2. Resume from the first incomplete phase; do not rebuild finished working phases.
3. For each phase, create the smallest complete vertical increment.
4. Run typecheck, lint, relevant tests and production build after implementation.
5. Fix failures before moving forward.
6. Keep a concise `docs/BUILD_STATUS.md` with:
   - completed phase
   - verification commands/results
   - current architecture decisions
   - next phase
7. Never fabricate test/deploy success.
8. Do not generate final art until the cooking loop and asset interface are stable.
9. Never introduce emoji production UI or generic AI-slop styling.
10. Preserve Vercel + Neon compatibility.

When a phase requires credentials or an external dashboard action that cannot safely be automated:

- implement everything that can be implemented locally
- document the exact required environment variable names and dashboard step
- continue with all non-blocked work
- do not hardcode secrets

Goal:
A production-buildable, mobile-first, content-rich web game that can be connected to a GitHub repository and deployed on Vercel.
