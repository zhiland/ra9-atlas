# MiMo long-run admission

Owner request: 2026-10-24. Permit a substantial independent public-repository
task rather than the earlier six-call probe. This does not waive patch review.

The owner explicitly rejected the intermediate 60-call/one-hour/USD1 proposal.
`--long-run` is OpenRouter/MiMo-only and uses the remaining OpenRouter account
balance: no local request-count ceiling, overall client deadline or run-reservation
ceiling. Check account credits before each completion; stop when balance is zero
or the provider refuses service. Do not top up, change account billing settings,
retry automatically or switch providers/models. Failed balance queries stop work.
The output/context capacities come from the admitted official catalog, not the
probe's token cap. Preserve the relay's existing 8MiB request and16MiB response
framing bounds and a300-second upstream socket-idle timeout. Probe defaults stay
unchanged. Force `reasoning.enabled=true`; supported effort levels are not
established. Keep zero shell/MCP/subagent access, pinned binaries, identical OS
profile, public-commit admission, host-only credentials, exact model/origin,
fresh quote-matched price filters and no fallback. Tests must cover explicit
admission, unchanged defaults and the outgoing reasoning/token/timeout fields.
Keep only numeric usage/cost progress. Export an explicitly unaccepted partial
patch after worker shutdown if inference ends before task success; do not lose
completed edits when account credit runs out. A partial patch cannot claim a
passing run and still requires review. Never apply or merge it automatically.

Task: add a deterministic JSON/Markdown coverage CLI, pure report function,
fixture/real-data/CLI regressions, npm test integration and documentation.
Do not edit canonical data, generated browser data, identities or source claims.
Structural counts must not imply chart completeness or source/publication approval.
Export the patch for separate review and trusted test execution.

## Working-mode verification

The previous model-specific final-newline defect remains a historical finding.
The synthetic functional fixture now requires an exact two-line payload with an
internal LF and no terminal whitespace. It compares raw bytes, not normalized
text. CRLF rejection has a CLI-level regression. Existing patch byte-fidelity
tests remain unchanged; no OS/native permission gate was removed.

Run `/private/tmp/ra9-opencode-run-n4iosbjr` passed all53 checks: four HTTP200
completions, USD0.000360484 API cost and63 reported reasoning tokens. Independent
Spec review verified all35 output bytes exactly. The server stopped. Mocked
tests prove that working mode continues beyond125 calls and USD99 of cumulative
informational reservations while positive account credit remains, and rejects
zero/invalid credit before inference. Partial export is marked unaccepted.

Standards and Spec follow-ups closed transport retry handling: selected-route
transport errors now produce a scrubbed nonretryable403. A new localhost
regression checks this path. Local tests pass:20 OpenRouter,20 Nous and18 baseline
runner checks. The native profile and pinned binaries are unchanged.

The coverage implementation task was launched from anonymously admitted public
commit `84a944723467ebb791773ae4092da5329250fb10`. Its raw workspace/progress remain
under `/private/tmp/ra9-opencode-run-o_5yqo2k` and are not committed. The model may
finish before an hour; running time is not a work target. Stop on task completion
instead of spending credit to fill time. Patch review and tests are still pending.
