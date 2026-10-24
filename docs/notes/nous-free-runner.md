# Nous Portal Free through the controlled OpenCode runner

Date: 2026-10-24. Base: `2e59e5b`.

## Acceptance

Keep the existing OpenCode binary, native policy, filesystem isolation and two
allowed loopback ports. Default GLM behavior stays exact. Add an explicit opt-in
Nous free route. Do not launch a Hermes agent, install a VM/container or change
existing Hermes conversations/model settings.

Use only the installed Hermes credential adapter in a separate trusted process.
Keep its dedicated authentication directory outside the worker workspace and
outside the exported public tree. Never place credentials in worker environment,
config, prompt, logs or error responses. The adapter supplies raw inference only,
without Hermes memory, skills, plugins, tools or agent context.

Allow one selected free model and one fixed HTTPS inference origin/path. Require
fresh official catalog evidence of zero input/output and other declared charges,
adequate context and tools support before every completion. Reject paid models,
unknown prices, routing/fallback overrides, redirects, malformed input and endpoint
overrides. No paid fallback, credential import from other providers or generic
local inference proxy is permitted. Missing login or any failed gate blocks work.

Check mocked relay/auth/price failures, protocol behavior and token exclusion.
Repeat native canaries and a real synthetic tool test before any repository task.
Only admitted public commits may enter the worker. Review patches separately.
Source/publication/merge gates do not change.

## Evidence before implementation

The unchanged GLM self-test at `/private/tmp/ra9-opencode-run-4g3_bvbx` again
received HTTP429/FreeUsageLimitError after native gates. Its server stopped.
The public Nous `/v1/models` catalog returned HTTP200 and eight zero-price `:free`
routes. Catalog listing is not proof of account entitlement or working inference.
The existing Hermes Nous adapter initially reported no login. The user completed
dedicated OAuth in a private ra9-atlas auth profile. Existing Hermes state stays
outside that path.

## Verification

The 18 Nous route tests and 18 existing runner regressions pass. A real OpenCode
request exposed its `store:false` field, which the initial allowlist rejected.
A regression test reproduced that failure. The route now permits only the exact
boolean `false`; enabling upstream request storage remains forbidden.

The authenticated native run at `/private/tmp/ra9-opencode-run-6t8ey19c` passed
46 startup/boundary checks, including denial of read/list/write access to a
fabricated file in the dedicated auth directory. The Laguna XS free route
returned two HTTP200 responses, and native glob/grep ran on synthetic data.
Its next completion returned HTTP429. The runner stopped without a paid fallback
and confirmed server shutdown. This is working login and partial live inference,
not a completed read/write self-test or repository-task certification.

The StepFun `stepfun/step-3.7-flash:free` run at
`/private/tmp/ra9-opencode-run-uu8g5hko` passed all 53 checks. Three completions
returned HTTP200. Native glob, grep, read and write completed, and `result.txt`
contained exactly `ISOLATED_PROVIDER_OK` with a final newline. The server stopped.
This verifies the synthetic route on the pinned local host/runtime. Independent
implementation review and repository-task admission remain pending.
