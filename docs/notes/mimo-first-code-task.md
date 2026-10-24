# MiMo first accepted code task

Date: 2026-10-24. Model: `xiaomi/mimo-v2.6-flash` through OpenRouter.
Public base: `85c53e450bff98668591c8ce90ee08796a985306`.

## Task and acceptance

Add `stopReason` to the trusted provider report: initially null,
`budget_exhausted` on insufficient reservation, `request_limit` at six requests.
Keep rejection before paid POST, preserve counters/reservations on rejection,
and add tests of the actual guards. Change only the provider and its test file.
Do not change any security, credential, price, model, token or request limit.

## Observed result

The canonical runner admitted the public base and passed all 51 checks. MiMo
made four HTTP200 requests and changed exactly the two permitted files. Native
read/edit tools completed. The final server stopped. Model event timestamps span
40.5 seconds; this excludes initial runner setup. Local raw evidence remains at
`/private/tmp/ra9-opencode-run-npm3v92l` and is not committed.

API-reported cost: **USD0.001607496**, about **0.161 cents**.
Reported tokens: 36,910 input and 1,882 completion. The conservative reservation
was USD0.04870768 out of an explicit USD0.10 run allowance. Reservation is not
billing. No provider-enforced account spending cap or general cost benchmark is
claimed.

## Review and validation

Codex inspected the entire patch. It initializes one field, splits the existing
guards without changing their thresholds, sets static reason codes under the
existing lock, and exposes the field only in the host summary. Tests exercise
both real `complete()` guards, prevent the authenticated POST, and verify initial
null plus unchanged counters/reservations. No new imports, endpoints, credentials
or runtime graph changes were introduced.

The new regression failed on the previous implementation with missing
`stopReason`, then passed after application. `git apply --check` passed before
application. The patch was accepted without implementation corrections.
All 15 OpenRouter, 18 baseline runner and 19 Nous regressions pass, as does
`git diff --check`. The user's untracked Obsidian draft remains byte-identical.

This is a successful small code task. It supports using MiMo for bounded,
reviewed changes; it does not prove superiority over other models or close the
separate synthetic missing-final-newline finding.
[Hosted CI40097299957](https://github.com/zhiland/ra9-atlas/actions/runs/40097299957)
passed at `84a9447`, including the full Node/browser suite and Python regressions.
No merge or deployment.
