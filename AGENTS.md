# Repository Guidelines

## Project Structure & Module Organization
Source lives in a Next.js/TypeScript layout: `app/` for routed pages, `components/` for reusable UI, and `lib/` for route-planning logic (graph building, heuristics). Shared geographic data helpers belong under `lib/map/`, while UI assets sit in `public/` (icons, Leaflet tiles). Tests mirror the tree inside `tests/` (e.g., `tests/lib/routeAStar.test.ts`). Design notes remain in `docs/`, and any new architectural memo should extend `docs/detailed_design.md` for continuity.

## Build, Test, and Development Commands
- `npm install`: install project dependencies defined for Next.js, Leaflet, and algorithm tooling.
- `npm run dev`: launch the local dev server with hot reload at `http://localhost:3000`; environment variables from `.env.local` are loaded automatically.
- `npm run build`: compile the production bundle, verifying type safety and catching route-config issues.
- `npm run lint`: run ESLint/Prettier to enforce formatting and code-quality gates before pushing.
- `npm run test`: execute the Jest + React Testing Library suite; append `--watch` when iterating locally.

## Coding Style & Naming Conventions
Use TypeScript strict mode and ES2022 modules. Keep indentation at two spaces, prefer explicit return types on exported helpers, and avoid default exports for domain logic. Components are PascalCase (`RouteSummaryCard`), hooks/utilities are camelCase, and files stay kebab-case except React components (`components/RouteSummaryCard.tsx`). Run `npm run lint -- --fix` to apply the shared ESLint + Prettier ruleset before committing.

## Testing Guidelines
Cover algorithm branches with Jest unit tests placed beside their counterpart in `tests/lib`. UI behavior belongs in `tests/components` using React Testing Library, mocking Leaflet APIs where needed. Maintain ≥80% line coverage (`npm run test -- --coverage`), and name files `*.test.ts`/`*.test.tsx`. For regression-prone flows (route export, Overpass fetch), add Playwright smoke tests under `tests/e2e` and gate merges on their CI status.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat(route-engine): add scenic-weight option`, `fix(ui): guard empty origin`). Keep messages in present tense and limit subject lines to 72 chars. Pull requests must describe motivation, highlight UI changes with screenshots or recordings, and link to the tracking issue. Include checklists for testing performed (`npm run lint`, `npm run test`). Request review from an owner familiar with the touched module (`lib/`, `app/map/`, etc.) and wait for green CI before merging.

## Security & Configuration Tips
Never hardcode API keys; rely on `.env.local` for Overpass rate limits, Google syncing, and map tokens. Validate inputs server-side in API routes (`app/api/`) to prevent path injection, and throttle Overpass requests via a shared limiter in `lib/network`. When sharing logs, redact coordinates that could identify user whereabouts.
