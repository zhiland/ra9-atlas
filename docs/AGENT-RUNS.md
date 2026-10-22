# ra9-atlas — agent run log

Updated: 2026-10-22. These are bounded runs, not continuously active agents.

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
