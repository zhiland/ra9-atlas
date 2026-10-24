# ra9-atlas — agent run log

Updated: 2026-10-24. These are bounded runs, not continuously active agents.

## Controlled provider checkpoint — 2026-10-24

North Mini Code Free passed a 53-check synthetic run and a 51-check public
repository task at base `2e59e5b`. Its sole checklist patch was reviewed, checked
with `git apply --check`, applied and clarified by Codex. API cost was zero.
North is the primary free route; Nous StepFun Free is a verified free reserve.
DeepSeek V4.1 Flash passed 53 checks through OpenRouter with explicit budget
controls. Flint passed the synthetic test but failed the public task safely.
MiMo completed tools but failed the bounded exact-output test. Contributor was
rejected before inference for an unpriced extra fee. Both independent review
axes closed their findings. See the [full matrix](notes/model-provider-options.md).
No runtime graph change, merge, deployment or dedicated DeepSeek key setup.

| Run | Model / effort | Task | Result |
|---|---|---|---|
| source_survey | GPT-6 Luna / medium | Initial source survey | [Report](notes/source-survey.md) |
| audience_survey | GPT-6 Luna / medium | Initial audience survey | [Report](notes/audience-survey.md) |
| plan_review | GPT-6 Astra / high | Preparation plan review | Findings integrated into PREPARATION-PLAN.md |
| plan_audit_v2 | GPT-6 Astra / high | Go/no-go review and discussion | [Report](notes/plan-review-v2.md) |
| OpenCode public source audit | GLM-5.3-Flash Free / default | Public project checks | [Corrected findings](notes/opencode-review.md). Raw log stays local. |
| text_coverage | GPT-6 Luna / medium | Initial source matrix | [Report](notes/source-coverage-initial.md) |
| verify_d1_d3 | GPT-6 Luna / medium | Local branch and late detour conditions | [Report](notes/verification-d1-d3.md) |
| verify_d2 | GPT-6 Luna / medium | Alice's box and later Todd encounter | [Report](notes/verification-d2.md) |
| translate_research | GPT-6 Luna / medium | Translate the 12 research notes into English | Completed. Local evidence and logs were not changed. |
| poc4_effort_check | OpenCode v2.0.32 / DeepSeek free `#max` requested | Inspect CLI/catalog and probe model route | Model selected locally; gateway rejected request before a model response. Backend max application is unverified; no workaround or paid fallback. PoC4 plan saved; implementation not started. |

All listed runs are complete; the PoC4 model request did not complete.

## Review boundaries

The orchestrator checked GitHub metadata, three JSON examples, license boundaries, the fschutt demo, and the detour discrepancy.
See [Gate 01](notes/decision-gate-01.md).

For D1–D3, both agents incorporated attribution and wording corrections.
No application work was assigned. No additional Astra review was needed for that package.
See [Gate 02](notes/decision-gate-02.md).

## Historical usage snapshots

Before D1–D3: 98% of the five-hour window and 60% of the weekly window remained.
After D1–D3: 70% and 56% remained.
Before translation: 55% and 54% remained.
These measurements cover the whole account. They are not current capacity estimates.

## 2026-10-22 repository and source review

Separate Standards and Spec reviewers inspected the fixed-point diff
`git diff 2576a95...b75ea04` and relevant packet/runtime code. A separate
Hostage reviewer inspected the primary chart and live guide locations.
The executor applied corrections and requested follow-up checks.
See [repository findings](notes/repository-review-2026-10-22.md) and
[the Hostage review](notes/hostage-packet-source-review.md).
Source approval leaves the separate publication gate blocked.

## 2026-10-23 next-chapter draft checkpoint

OpenCode completed the bounded A New Home extraction through the corrected
runner from public commit `7f89e88`. Codex reviewed/corrected the one-file patch
and validated it against ATLAS. The packet remains draft and source review is
pending. See [the extraction note](notes/anewhome-packet-draft.md).

## 2026-10-23 A New Home independent source correction

A separate reviewer found two inherited chart errors and corrected stage kinds.
OpenCode implemented withdrawn-link UI/core behavior through the verified runner
from public `2334d58`; 49 per-run checks passed. Codex inspected/applied the patch,
corrected data/validation and tested legacy links. Separate Standards/Spec
reviewers found heading/contract issues and a missing resolver export; all were
corrected. The source reviewer then approved the corrected partial packet.
See [the implementation report](notes/anewhome-correction-implementation.md).
Publication remains blocked independently of source approval.

## 2026-10-23 Shades of Color preparation

OpenCode assembled the third packet from parent-inspected public facts through
`opencode_runner.py`, starting at public `8fb8313`. All 49 boundary/native-policy/
provider checks passed and the private server stopped. Parent patch review fixed
preparation metadata and a missing unknown-record source/reference.

The separate `shades_source_review` agent independently derived the chart inventory
before comparing the packet, then approved the partial source interpretation.
Separate Standards and Spec reviewers found no implementation defect; their shared
provenance wording clarification was applied. See [the source and implementation
report](notes/shades-of-color-source-review.md). Publication remains blocked;
no runtime integration, merge or deployment was performed.


## 2026-10-23 Shades runtime integration

Two combined external jobs timed out safely. Single-file retries passed 49 checks
with servers stopped. The reviewed UI patch was accepted; a proposed validator
with incorrect schema assumptions was rejected. Codex implemented the correct
bounded fence and 21 regressions. Separate source follow-up found one detail
citation omission, fixed and regression-tested. Standards found no defect; Spec
requested mobile appended-link coverage and corrected inventory wording, both
closed. See [the integration report](notes/shades-runtime-integration.md).

## 2026-10-23 delayed hash regression follow-up

Ubuntu CI exposed details reopening after mobile Escape. Codex reproduced the
queued self-written hash event with the real browser handler, corrected event
consumption, and verified external hashes and browser Back. The regression failed
before the fix and passed after it. Full npm verification passes 68 browser checks;
a separate Standards follow-up found no open issue. See the
[integration report](notes/shades-runtime-integration.md).

## 2026-10-23 Painter opening preparation

A separate source reviewer derived nine boxes, five traces and three detached
segments before the packet existed. The controlled OpenCode worker used public
`419835a`, passed 49 checks and stopped its server. Its only patch was the packet.
Codex inspected/applied it after `git apply --check` and supplied missing required
review-scope metadata. The source reviewer then approved the bounded packet with
no corrections. Six packet regressions and a sourced inventory attribution are
added. Runtime and publication gates remain unchanged. See the
[report](notes/painter-packet-source-review.md) for code-review and test results.

## 2026-10-23 Painter opening integration

OpenCode from public `7053764` produced the one-file runtime fence, passed49
checks and stopped its server. Patch inspection and apply-check preceded use.
Codex added canonical data, ledger, generation and regressions. A separate source
fidelity review found zero discrepancies and verified full preservation of old
objects. Independent Standards/Spec review and final tests are recorded in the
[integration report](notes/painter-runtime-integration.md).

## 2026-10-23 preparation choices version 1.1

Controlled OpenCode from public `bee077d` changed the single preparation validator,
passed49 checks and stopped its server. Patch inspection/apply-check preceded use.
Codex added18 synthetic regressions and version documentation. Existing packets,
map data and runtime remain unchanged. Final review/CI results are in the
[version report](notes/packet-choice-arity.md).

## 2026-10-24 Painter leisure source preparation

A separate reviewer derived six objects, thirteen grouped rows and seven traces
before seeing a packet. Controlled OpenCode from public `b1f4f5c` stopped safely
after provider HTTP429/free quota exhaustion. No patch or paid fallback was used.
Codex prepared the packet, and the reviewer approved it with zero corrections.
No runtime change occurs. See [report](notes/painter-leisure-review.md).

## 2026-10-24 runtime source row groups

Codex implemented explicit opt-in runtime1.1 geometry and validation after the
free OpenCode route quota failure. No additional external run or paid fallback
is used. Eleven unit/contract and six synthetic browser scenarios cover the
new representation and legacy compatibility. See [report](notes/runtime-row-groups.md).

## 2026-10-24 Painter leisure runtime integration

Codex integrates the reviewed packet after runtime row-group support. Five nodes
and seven relationships append. All old graph objects remain frozen. Separate
source fidelity, Standards and Spec checks are required. No external model run
or paid fallback is used. See [report](notes/painter-leisure-runtime.md).
