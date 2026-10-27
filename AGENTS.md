# MoneyMate development guide

- Explain changes in Vietnamese; user learns by reading code.
- Repo contains two independent packages: MoneyMate-fe and MoneyMate-be.
- Frontend: React Native, Expo Router, TypeScript strict with Atomic Design. Keep app files and routes thin.
- Backend: Node.js TypeScript, HTTP API and future DB/business logic.
- Current frontend is an in-memory demo, not yet connected to backend.
- Keep amounts integer VND; server must revalidate client input when financial APIs are added.
- Do not import source across frontend/backend.
- Follow docs/architecture.md; create folders only when needed.
- Use pnpm and maintain separate lockfiles.
- Check each changed package with pnpm typecheck.
- For frontend structural changes, export Android/web from MoneyMate-fe.
- Shared colors live at MoneyMate-fe/src/theme/colors.ts.

- Each package has ESLint and Prettier configs. Run pnpm check in changed packages.
- Frontend uses ESLint 9 for Expo React plugin compatibility; backend uses ESLint 10.
- Keep formatting consistent using each package's pnpm format command.

- PostgreSQL will be cloud-hosted; never commit credentials or log DATABASE_URL.
- Run backend pnpm check and pnpm test; pnpm db:check requires actual configured database.


- Models define actual PostgreSQL tables with Drizzle ORM. Types contain interfaces/DTOs. Schemas use Zod for runtime input validation.
- configs/database.ts returns {pool, db}; use db for ORM queries and pool.end() on shutdown.
- Never apply cloud migrations unless the task authorizes applying them. db:generate is local-only; db:migrate changes DATABASE_URL target.
- Audit timestamps/version and soft-delete filtering require explicit updates in services; there is no Mongoose middleware.

- Backend entry point is src/app.ts. Express factory lives in configs/express.config.ts for isolated HTTP tests.
- Keep routes under routes, paths in routes/index.ts, OpenAPI under configs/swagger.config.ts. Await DB connection before listen.

- Frontend structure: app -> routes -> screens -> components (atoms/molecules/organisms/templates). No features folder.
- Frontend types, schemas, hooks, providers, services, helpers, configs, constants, theme have separate roles.
- Auth screens are UI-only until backend auth endpoints exist. Never fake successful registration or persist passwords.
- Dashboard state is a clearly labelled session-only demo. Plans/actual are monthly, VND only, with required categories and allocations.
- Run frontend pnpm check, pnpm test and Expo export for UI structure changes.
