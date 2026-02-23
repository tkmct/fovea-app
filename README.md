# Fovea App

Rich sample web app used to validate FoveaCI PR-based UX evaluation.

## Features
- Account creation and login
- Product catalog search/filter
- Cart and checkout with coupon and shipping options
- Support ticket submission and list view
- Optional latency/failure injection via environment variables

## Quick Start
```bash
npm install
npm start
# app -> http://localhost:3456
```

## Environment Variables
- `PORT` (default: `3456`)
- `APP_DELAY_MS` (default: `0`)
- `APP_CHECKOUT_FAIL_RATE` (default: `0`, range `0..1`)

## Test
```bash
npm test
```

## Suggested UX Flows for FoveaCI
See `docs/ux-flows.md`.

## GitHub Actions
- `.github/workflows/ci.yml`
  - install, test, start app, health check
- `.github/workflows/foveaci-smoke.yml`
  - workflow_dispatch smoke that checks out `foveaci` repo and runs `fov run` against this app
- `.github/workflows/pr-ux-eval.yml`
  - PR flow: scenario preview comment on every update, and full `pr-eval` run after label `ux-eval-approved`
  - Uses pinned `foveaci` commit for reproducibility (`ref: a683c8c`)

## Integrating with FoveaCI PR Workflow
In `foveaci` repo workflow, replace sample app start step with:
```yaml
- uses: actions/checkout@v4
  with:
    repository: your-org/fovea-app
    ref: main
    path: sample-app

- run: |
    cd sample-app
    npm ci
    npm start >/tmp/example-app.log 2>&1 &

- run: npx wait-on http://localhost:3456/api/health
```

## Open PR Replay Locally
After `pr-ux-eval` completes and uploads artifacts:

1. Download artifact `pr-ux-eval-<PR_NUMBER>` from GitHub Actions.
2. Extract artifact contents to `<artifact_root>`.
3. Clone/build `foveaci` to `<foveaci_root>`.
4. Run:
   ```bash
   node <foveaci_root>/dist/bin/fov.js serve-report --dir <artifact_root>/artifacts/pr-eval/report --port 4173
   ```
5. Open `http://localhost:4173/index.html`.
