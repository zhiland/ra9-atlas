# CI

GitHub Actions workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
runs the repository's deterministic checks on hosted Linux.
It is the repeatable verification gate for every pull request and every main push.
It does not deploy, publish, or approve anything.

## Workflow scope

| Aspect | Value |
| --- | --- |
| Triggers | `pull_request` on any target branch; `push` restricted to `main`; `workflow_dispatch` (manual) |
| Permissions | Workflow-wide `contents: read` — least privilege, no write scopes, no secrets |
| Checkout | `actions/checkout` v7.0.1 pinned to the verified release SHA, with `persist-credentials: false` so later git commands cannot reuse checkout credentials |
| Node setup | `actions/setup-node` v7.1.0 pinned to the verified release SHA; Node 22 with the npm package cache |
| Runner | `ubuntu-24.04` |
| Job timeout | 20 minutes per job via `timeout-minutes` |
| Concurrency | Superseded runs are cancelled per pull request number (merge ref) or per push/dispatch ref; the newest commit wins |
| Excluded events | No `pull_request_target`; no fork-token escalation; no release or deployment jobs |

Only two third-party actions are used, and both are pinned by immutable commit SHA
with the version tag documented beside the pin:

- `actions/checkout@v7.0.1` → `3d3c42e5aac5ba805825da76410c181273ba90b1`
- `actions/setup-node@v7.1.0` → `949feb2413d6458794dcd2491c4babbbce0c15c1`

`PLAYWRIGHT_BROWSERS_PATH` is set to `$RUNNER_TEMP/playwright` by the first shell step through
`GITHUB_ENV`, so Chromium is downloaded to scratch space instead of a shared
tool cache and is discarded with the runner. `npm ci` installs the lockfile state. Action setup and browser/system dependency installation also use the network.

## Steps

The job runs these steps in order:

1. `npm ci` — install locked `devDependencies` (Playwright; the project has no runtime dependencies).
2. `npx playwright install --with-deps chromium` — download Chromium plus its system libraries into the temp browser path.
3. `npm test` — Node-side deterministic checks. Includes deterministic source-generation and inventory checks.
4. `python3 -B tests/opencode-runner.test.py` — regression tests for admission, egress, and patch boundaries.
5. `python3 -B tests/seatbelt-preflight.test.py` — host-independent checks for offline diagnostic setup and fail-closed behavior.

## Required local commands

Run the same sequence before opening a pull request; Local success complements the hosted run; it does not establish Linux success:

```sh
npm ci
npx playwright install --with-deps chromium
npm test
python3 -B tests/opencode-runner.test.py
python3 -B tests/seatbelt-preflight.test.py
```

The environment variables and working directory should match a clean checkout;
`python3 -B` suppresses bytecode writes.

## Mocked, no-model Python tests

The two Python suites are unit tests, not live agent runs:

- `tests/opencode-runner.test.py` verifies admission, egress, and patch
  boundaries using in-memory archives, fixture files, local loopback HTTP
  against a temporary relay, and mocks. A test-level guard patch replaces the
  HTTPS connection class and raises an assertion if any test attempts real
  network contact, so the suite covers the egress rules without performing
  egress. It never starts, talks to, or requires external OpenCode, and never
  uses provider or self-test flows.
- `tests/seatbelt-preflight.test.py` is host-independent: forking behaviors are
  patched, so it never installs a sandbox profile and never invokes
  `sandbox-exec`. It checks environment sanitation and path-profile
  fail-closed rules against temporary directories. Hosted execution must confirm Linux compatibility; the actual isolation target is macOS.

## What CI does not do

- It does not run external OpenCode, provider checks, or self-tests.
- It does not invoke `sandbox-exec` or deploy anything.
- It references no repository secrets. GitHub supplies the read-only job token.
- It uploads no raw logs and no private or downloaded materials; step output is stored in GitHub Actions logs. The workflow has no artifact-upload step.
- CI passing is not source-truth approval and not a publication gate. The
  workflow checks reproducibility and the boundaries tested above. Approving
  evidence, source review, and any publication remain human and document-gated
  activities under [SOURCES](SOURCES.md) and
  [chapter preparation](chapter-preparation.md).

## Primary references

- [Checkout](https://github.com/actions/checkout)
- [Setup Node releases](https://github.com/actions/setup-node/releases)
- [Playwright CI](https://playwright.dev/docs/ci-intro)

## Executed checkpoint

[Run39908393426](https://github.com/zhiland/ra9-atlas/actions/runs/39908393426)
passed all steps on Ubuntu24.04 at `593b589` (2026-10-23), including npm/Chromium
and both mocked Python suites. This verifies the tested implementation, not the
native macOS isolation boundary or gameplay evidence.
