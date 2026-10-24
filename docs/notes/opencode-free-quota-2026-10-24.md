# OpenCode free-route quota probe

Date: 2026-10-24. User requested a DeepSeek Free attempt and Console reset check.

Historical quota/research checkpoint. Later connected and tested alternatives
are recorded in the [current model matrix](model-provider-options.md). The failed
OpenCode routes below were not bypassed or converted to paid routes.

The canonical runner temporarily selected `deepseek-v4.1-flash-free` instead of
GLM. The destination, native policy and public/synthetic input boundary stayed
unchanged. All 18 runner regressions passed. The synthetic native run passed its
pre-request boundary/configuration/free-cost gates, then received HTTP 429 with
`FreeUsageLimitError: Free usage limit reached`. The private server stopped.
No model edit was accepted. The original GLM selection was restored exactly.

GLM and DeepSeek now have the same observed free-quota rejection. This does not
establish the exact accounting scope or reset time. No paid route was selected.
Local evidence: `/private/tmp/ra9-opencode-run-qpl6nfrk/report.json` and
`run.jsonl`. Raw logs remain outside Git.

Console redirected to its login page in both browsers. No reset timer was
visible. A Brave handoff tab remains for owner login. No new account, credential,
subscription or payment was created. Recheck the timer after owner login.

## Additional requested probes and documentation review

Big Pickle, MiMo V2.6 Flash Free and Nemotron 3 Ultra Free each passed the
pre-request native/configuration/free-cost gates and returned the same HTTP 429
FreeUsageLimitError. All three private servers stopped. The runner source was
restored exactly. Evidence directories end in 3y9yx9nw, ohh33kkr and 5acf3pl6.
Together with GLM and DeepSeek, five models now have observed quota rejection.
This suggests shared accounting, but does not prove account/IP scope or reset.

[OpenCode's model documentation](https://opencode.ai/v2/docs/console/models/)
calls Big Pickle a free stealth model. It does not identify it as an original
OpenCode-trained model. No documented promise was found that login alone grants
more free requests. Login, paid Console credits and a Go subscription are distinct.
No new authentication, payment or account was configured during these probes.

[Nous Portal](https://portal.nousresearch.com/) offers a $0 plan for free models
with standard rate limits and no monthly paid credits. Its current catalog lists
zero-price variants of LongCat 2.5 Preview, Step 3.7 Flash, Laguna S/XS 2.1 and Solar
Mini 4. Listings do not prove successful inference or quality for this project.
Hermes is an agent client; Portal supplies inference. The older Nemotron free
[guide](https://hermes-agent.nousresearch.com/docs/guides/run-nemotron-3-ultra-free)
explicitly dates that promotion June 4–18. It must not establish October availability.

Hermes also supports [other providers](https://hermes-agent.nousresearch.com/docs/integrations/providers),
including OpenRouter, NVIDIA and local endpoints. OpenRouter's free routes have
[their own limits](https://openrouter.ai/docs/api_reference/limits). Local inference
avoids a hosted per-token fee but requires hardware. No Hermes inference was run,
no credentials were inspected, and no production isolation for Hermes is claimed.
A new provider needs an isolated synthetic test before any project content.
