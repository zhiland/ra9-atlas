# Semantic diff worker failure

Date: 2026-10-24. Public task base: `df6d3fe`.
The isolated MiMo run failed before exporting any repository changes.
`report.json` records `passed:false`, `partial:true`, an empty `changedFiles`
list and successful server shutdown. No implementation patch was accepted.

OpenCode logged `Timed out waiting for response headers`; the runner then
failed its client-exit check. The relay currently buffers upstream responses
before forwarding them. Long reasoning can exceed the client's header deadline;
this is the leading transport hypothesis, not yet a verified repair. Repeated
step starts show that removing host retry logic does not prove the absence of
OpenCode-internal retry attempts. Inspect both layers before another paid run.

API usage was reported for13 of15 requests: USD0.036165940 is the reported
subtotal, not a proven final charge. Reported tokens:455,948 input,
98,776 completion and86,295 reasoning. Reserved capacity is not billed cost.

Next: diagnose the client/relay timeout interaction, keep the same isolation
boundary and bounded buffers, add a meaningful regression, and revalidate any
changed runner/config boundary before restarting this public task. Do not
change OS/network access or introduce paid fallback. Preserve the owner's20%
Codex reserve; substantial work is deferred until the current quota reset.

## Verified transport correction

The pinned2.0.32 binary defines a300000ms header deadline and supports
`headerTimeout:false` and `timeout:false`. Working mode now sets both in native
provider settings; bounded probes are unchanged. A regression failed before the
fix and passed afterward. All67 Python regressions passed:21 OpenRouter,
20 Nous,18 runner and8 preflight. Both independent review axes found no blocker.

A native synthetic test used the canonical IsolatedRun and no external
inference. A20ms client deadline with a200ms delayed valid SSE response failed
after4 attempts. With the production disabled-deadline settings, the same
response succeeded on1 attempt. Both native runs retained OS/policy checks and
stopped their servers. The test scales time, not the production protocol.

The OS profile, loopback ports, credential boundary,300s upstream socket-idle
and16MiB bounded response buffer are unchanged. The owner explicitly withdrew
the20% Codex reserve for immediate continuation; the previous deferred schedule
no longer applies. A live canonical provider self-test is required before the
large task restarts.
