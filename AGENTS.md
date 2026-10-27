# MoneyMate development guide

- Explain changes in Vietnamese; user learns by reading code.
- Repo contains two independent packages: MoneyMate-fe and MoneyMate-be.
- Frontend: React Native, Expo Router, TypeScript strict with Atomic Design. Keep app files and routes thin.
- Backend: Node.js TypeScript, HTTP API and future DB/business logic.
- Frontend uses real authenticated API data; fixtures belong only in tests.
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
- Auth uses Better Auth with Drizzle and the official Expo plugin. Library-managed signed session cookies: HttpOnly on web, SecureStore via Expo plugin on native. Never implement parallel cookie/token/password/session logic. Legacy password verification is migration-only.
- Dashboard reads real snapshots. Plans/actual are monthly, VND only, with required categories and allocations. Mutations await API success; ownership, transactions and version checks are mandatory.
- Run frontend pnpm check, pnpm test and Expo export for UI structure changes.

- Backend flow: routes -> controllers -> services -> repositories -> models. Auth validations live in validations/auth.validation.ts; constants split by domain; utils are reusable.
- Existing migrations 0000–0003 were applied for real API integration and Better Auth migration. Future cloud changes still require task authorization.
- pnpm test skips PostgreSQL integration unless RUN_DB_TESTS=1. That test creates and removes its own disposable users; never use real user accounts.

- Function design: keep functions small and focused, use descriptive names, and prefer a parameter object for related arguments.
- Do not use boolean flags to select operations; expose separate create/update/remove, archive/restore, and submission actions.
- Prefer named handlers and lookup maps over switch statements; use guard clauses to avoid nested conditions.
- Keep calculations, validation and payload preparation pure. Isolate intentional database/network/state changes in clearly named repositories, services or hooks.
- Screens compose UI; hooks manage state and effects; helpers perform reusable calculations. Split long UI sections into named components.
