# Controlled model routes

Checked: 2026-10-24. Implementation base: `2e59e5b`.

## Acceptance

Finish provider selection without weakening the canonical OpenCode runner.
Keep the pinned binaries, Seatbelt profile, public-commit admission, native
permission gates and two exact loopback ports. Add explicit OpenRouter opt-in
using only the owner-approved literal `OPENROUTER_API_KEY` from `~/.env`.
Never export that key, the file, other variables or private data to the worker,
its environment, config, prompt or logs. Test a fabricated credential-neighbor
file under the final profile before inference. Do not change global OpenCode,
Hermes or account settings. Do not create a Docker/VM dependency.

Require an exact allowlisted model, fresh catalog prices/tools/context, a fixed
TLS origin/path, no redirects and no client routing/credential/plugin overrides.
For paid routes require an explicit run budget, input at most $0.20/M and output
at most $1/M, no request/image charge, bounded cache pricing, at most six calls,
64KiB serialized requests and 2048 completion tokens. Never retry or fall back
to another model automatically. Force OpenRouter price filters and tool-parameter
support. A `:free` route must retain zero prices and zero price filters.

Reserve conservative estimated cost before each attempt, including failed calls:
twice the serialized request bytes plus 2048 input framing tokens, and the full
completion cap at fresh catalog prices. Do not refund reservations. This is an
application guard, not a provider-enforced billing cap or a proven tokenizer
bound. Operator-approved test runs together must stay within a $0.10 reservation.
Report actual usage/cost separately where supplied by the API.

Default to providers that deny data collection. Contributor requires an explicit
public-data training opt-in. Only prepared public content may be sent. Dedicated
DeepSeek API access remains pending until a local credential is available; do not
request or print a key in chat. Preserve user changes and merge/publication gates.

## Catalog snapshot

Prices below are USD per million tokens from the public Models API, not a quote
for every endpoint. Prices can change; the relay rechecks before every request.

| Model | Input | Output | Context | Route decision |
| --- | ---: | ---: | ---: | --- |
| Xiaomi MiMo 2.6 Flash | 0.14 | 0.28 | 1.05M | First code task accepted; synthetic newline finding remains |
| DeepSeek V4.1 Flash | 0.02 | 1.00 | 1.05M | 53/53; paid reserve |
| Meta Muse Spark 1.3 Contributor | 0.10 | 0.20 | 1.05M | Excluded: training and extra search fee |
| Qwen3 Coder Next | 0.12 | 0.80 | 262K | Optional coding reserve |
| MiniMax M3.1 Flash | 0.15 | 0.60 | 1.05M | Optional coding reserve |
| Recursive Flint free | 0 | 0 | 262K | 53/53; public task failed, reserve only |
| Cohere North Mini Code free | 0 | 0 | 256K | 53/53 plus public task; primary route |
| GLM 5.2 | 0.0341 | 7.00 | 1.05M | Excluded: output exceeds ceiling |

`GLM 5.2 Flash` was not an exact catalog match. Do not substitute the expensive
GLM 5.2 route silently. Do not use `:batch` variants for interactive OpenCode.

Nous StepFun 3.7 Flash Free already passed 53 synthetic checks, including native
glob, grep, read and write. Laguna XS Free returned HTTP429 after two HTTP200
completions. Existing OpenCode free routes also returned quota429. A catalog
listing or a normal chat response alone is not an end-to-end coding-tool check.

## Verification

The initial MiMo probe hit its conservative USD0.02 reservation after three
HTTP200 completions. A requested shell operation was denied by native policy.
A second bounded probe received four HTTP200 completions and executed glob,
grep, read and write, but wrote an output missing the required final newline.
It repeated writes and hit its USD0.03 guard before final success. The two CLI
event cost totals were USD0.00061866 and USD0.00073668. Partial tool use is not a
passing end-to-end result; MiMo is not the selected project route.

At the user's request, a further MiMo run raised the reservation to USD0.06.
`/private/tmp/ra9-opencode-run-ncff286i` completed four HTTP200 requests and
52/53 checks. It stopped only on exact file content: `ISOLATED_PROVIDER_OK`
was missing the required final newline. The client completed; no budget/call
guard was hit. API cost was USD0.000268580, while the conservative reservation
was USD0.02297624. Server shutdown passed. This distinguishes a model output
error from the earlier reservation stops. USD0.02 is two cents of reserved
capacity, not an actual MiMo charge. USD0.0011 is about 0.11 cents, not
0.0011 cents; these small tests do not establish relative cost per solved task.

DeepSeek V4.1 Flash passed 53/53 checks twice. The final implementation checkpoint
at `/private/tmp/ra9-opencode-run-ot9_88of` returned four HTTP200 completions and
reported API cost USD0.001276795, distinct from its conservative USD0.01164760
reservation. The first test's CLI cost was USD0.00111970. Server shutdown passed.

Flint Free passed 53/53 twice, including the strict message validation and
quote-matched price filters. Final report: `/private/tmp/ra9-opencode-run-cj5h9ob3`.
Five HTTP200 completions reported API cost USD0, with native glob/grep/read/write.
North Mini Code Free also passed 53/53 at
`/private/tmp/ra9-opencode-run-svpx3ne3` with five HTTP200 completions. Both stopped
their servers. No result establishes general coding quality or future quota.

Contributor was blocked before inference because its fresh catalog declares
`web_search: 0.0025`, which this relay does not price. Its base prices also carry
permission to use prompts/outputs for training. No Contributor inference was
sent and no account privacy setting changed. Qwen and MiniMax are catalog-only
reserves; no inference-quality claim is made for them.

All paid test reservations total USD0.09; actual reported CLI/API costs total
USD0.003751835 (about 0.38 cents). These are API observations, not a reconciled
account invoice. No dedicated DeepSeek credential was available in the inherited
environment. Direct DeepSeek is unnecessary for the selected OpenRouter reserve.

The owner subsequently selected MiMo for the next bounded trial. This is an
operational preference, not a passing self-test or a proven quality ranking.
Its missing final newline remains an open exact-output issue. Start with a small
reviewable task and keep all correctness checks; do not waive the failed check.
DeepSeek is the verified paid reserve; North Mini Code is the demonstrated free
project route, followed by Nous StepFun. Flint stays lower priority after its
failed public task. No evidence yet establishes that MiMo is generally better
than the free models or five times cheaper per solved task. The MiMo probes used
the same model/version with different budget limits, not an old/new model pair.
Use an explicit run budget for paid routes. Do not probe quotas repeatedly.

The owner later authorized an explicit MiMo [working mode](mimo-long-run.md)
using the remaining OpenRouter balance instead of a local per-run reservation,
request-count or elapsed-time ceiling. This is separate from bounded probes;
reasoning is explicitly enabled and all OS/credential/price gates remain.

The [first MiMo code task](mimo-first-code-task.md) then passed all 51 public-run
checks. Its two-file patch was accepted without implementation corrections;
15 OpenRouter,18 runner and19 Nous tests pass. Four requests cost
USD0.001607496; model-event time was40.5 seconds. This supports bounded reviewed
work, not a general quality or cost ranking.
Independent code review and public repository smoke results follow below.

## Independent review

Spec found and closed two gaps: host usage/cost aggregation and malformed message
admission. Standards found catalog type-validation, price-filter/reservation
agreement and controlled malformed-tool handling gaps; fixes have regressions.
Final Standards and Spec follow-ups have zero open findings. Local Python
checks pass: 18 baseline runner, 19 Nous, 14 OpenRouter and 8 preflight tests.
The strict final Nous StepFun synthetic rerun passed 53/53 checks at
`/private/tmp/ra9-opencode-run-cegtq2je`.

The first Flint public task stopped after a truncated malformed write call;
no patch was accepted. North Mini Code then passed the bounded public task at
`/private/tmp/ra9-opencode-run-hy1ledq9`: 51 checks, three HTTP200 completions,
API cost USD0, one exported checklist and confirmed server shutdown. Base
`2e59e5b5803101080c7e385d19bd180dbe485edd` was anonymously admitted. Codex reviewed
the patch and checked `git apply --check` before application, then clarified
that four unknowns refer to Painter leisure rather than the entire atlas.
The [next-slice checklist](painter-next-slice-outline.md) does not claim fresh
source inspection. Runtime data remain unchanged.
[Ubuntu CI40095626510](https://github.com/zhiland/ra9-atlas/actions/runs/40095626510)
passed at implementation commit `a47533a`, including the full Node/browser suite
and all Python checks. Draft [PR36](https://github.com/zhiland/ra9-atlas/pull/36)
remains unmerged. Subsequent checkpoint edits record verification only.

## Sources

- [Official public model catalog](https://openrouter.ai/api/v1/models)
- [Provider routing and maximum prices](https://openrouter.ai/docs/guides/routing/provider-selection)
- [Contributor model and training policy](https://openrouter.ai/meta/muse-spark-1.3-contributor)
- [Existing runner guide](../opencode-runner.md)
- [Nous verification](nous-free-runner.md)
