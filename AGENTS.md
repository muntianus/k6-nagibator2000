# Repository Guidelines

## Project Structure & Module Organization
- Source: k6 scripts live at the repo root (e.g., `script.js`, `test.js`, generated `*_test.js`).
- Optional: place shared utilities in `lib/` and input HAR files under `assets/`.
- Dependencies: managed via `package.json` (`har-to-k6`, `bootstrap` present). Avoid committing `node_modules/`.

## Build, Test, and Development Commands
- `npm ci`: install exact dependencies from `package-lock.json`.
- `k6 run script.js`: execute a local load test.
- `k6 run --vus 1 --duration 10s script.js`: quick smoke run for validation.
- `npx har-to-k6 assets/example.har -o generated/example_test.js`: convert HAR to a k6 script.
- Tip: add npm scripts for convenience:
  - In `package.json` → `scripts`: `{"smoke":"k6 run --vus 1 --duration 10s script.js"}`

## Coding Style & Naming Conventions
- JavaScript (ES modules): `import http from 'k6/http'`; export `options` and `default`.
- Indentation: 2 spaces; keep lines < 100 chars; include semicolons consistently.
- Filenames: no spaces; prefer kebab-case (e.g., `login-smoke.js`) or `*_test.js` for generated files.
- Structure: keep constants/config at top; group requests in `group()`; use `check()` assertions.

## Testing Guidelines
- Keep a minimal smoke stage to verify scripts before heavier runs.
- Use `check(resp, {...})` to assert status/content; fail fast on critical paths.
- Reuse helpers from `lib/` to avoid duplication; keep scripts deterministic.
- Optional coverage isn’t applicable; focus on clear stages and thresholds.

## Commit & Pull Request Guidelines
- Commits: short, imperative, and scoped. Examples:
  - `feat: add smoke test for homepage`
  - `chore: convert HAR to k6 script`
- Pull Requests: include purpose, runnable command (`k6 run ...`), notable env vars (`__ENV`), and screenshots of k6 summary if helpful. Link related issues.

## Security & Configuration Tips
- Do not commit secrets, cookies, or tokens; prefer `__ENV.*` and pass via `k6 run --env KEY=val`.
- Scrub PII from HAR files before conversion; keep large/generated artifacts out of VCS via `.gitignore`.
