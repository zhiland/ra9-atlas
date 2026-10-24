# Isolated OpenCode development

Verified: 2026-10-22 on macOS 27.0.1, OpenCode 2.0.32. The controlled runner
passed synthetic boundary/native-policy/provider checks and a public-repository
smoke task. Use this runner for external development. The earlier
[offline preflight](notes/isolation-preflight.md) and
[isolation study](notes/opencode-macos-isolation.md) are historical checkpoints.

## Run a task

Run from the repository root. Supply a full commit SHA already available in the
public `zhiland/ra9-atlas` repository. The runner verifies that fact through
anonymous GitHub API requests before exporting its tree.

```sh
# Repeat the synthetic end-to-end check after an environment change.
/usr/bin/python3 -B tools/isolation/opencode_runner.py self-test

# Example: start from the published PR #21 checkpoint.
/usr/bin/python3 -B tools/isolation/opencode_runner.py run \
  --repository /Users/andrew/Documents/Detroit \
  --commit 2576a9519b22eaabe8864886a1e794d5d29c276c \
  --prompt 'Read docs/chapter-preparation.md. Describe the next bounded packet task.'
```

Each command prints a new `/private/tmp/ra9-opencode-run-*` directory. It retains
`report.json`, `boundary.sb`, synthetic canaries, private logs and the workspace.
A repository task also exports `changes.patch` and lists its changed files in
the report. Review the patch, check its scope, and run `git apply --check`
before applying an authorized change. Run project checks in the trusted
checkout after application. No patch is applied, committed, pushed, or merged
by the runner. The temporary workspace is not a replacement for Git history.

The runner exports committed public content only. It does not include the
current working tree, untracked files, `.git`, user credentials, or research
caches. Keep private/local materials out of task prompts. Publish an approved
checkpoint through the normal PR workflow before using it as another base.

## Boundary and controls

### Additional opt-in routes — 2026-10-24

The default remains OpenCode GLM Free. The same runner now supports Nous and
OpenRouter through the existing relay port; the OS profile does not expand.
These routes have completed synthetic checks on this host. See the
[model matrix](notes/model-provider-options.md) for per-model results and limits.
Independent implementation review is recorded there before repository admission.

```sh
# Connected dedicated Nous profile; uses only its trusted credential adapter.
/usr/bin/python3 -B tools/isolation/opencode_runner.py self-test \
  --provider nous-free --free-model stepfun/step-3.7-flash:free

# Owner-approved ~/.env stays outside the worker. No environment file is sourced.
/usr/bin/python3 -B tools/isolation/opencode_runner.py self-test \
  --provider openrouter --model recursive/flint-v1.0:free

# Explicit paid opt-in with a conservative per-run reservation in USD.
/usr/bin/python3 -B tools/isolation/opencode_runner.py self-test \
  --provider openrouter --model deepseek/deepseek-v4.1-flash --max-cost-usd 0.02
```

The same provider flags apply to `run`, with its normal public repository and
commit admission. No credential or endpoint flag is exposed to the model.
OpenRouter requests have fixed price filters, no model/provider fallback, a
2048-token completion cap, six-call cap and 64KiB request cap. Catalog prices
and tool support are checked before every request. Paid calls consume a
conservative reservation even if they fail. This estimate is not an account
billing cap or a proven tokenizer bound. Use an account/key spending limit for
a provider-enforced total ceiling. Free routes retain zero price filters.
Contributor training requires a separate explicit opt-in and remains excluded
while its extra declared charges cannot pass admission.

The owner-authorized MiMo working mode is a separate explicit opt-in:

```sh
/usr/bin/python3 -B tools/isolation/opencode_runner.py run \
  --provider openrouter --model xiaomi/mimo-v2.6-flash --long-run \
  --repository /Users/andrew/Documents/Detroit --commit PUBLIC_FULL_SHA \
  --prompt 'Prepared public implementation task'
```

Do not combine `--long-run` with `--max-cost-usd`. This mode may spend the
remaining account credit. It has no local call count, run duration or reservation
ceiling. Catalog output/context capacities replace probe token caps, and reasoning
is explicitly enabled. Account-credit queries and unchanged quote/price guards
run before each completion. No top-up, fallback or automatic retry is performed.
The pinned native client also has `headerTimeout:false` and `timeout:false`
in working mode: its default300000ms header deadline otherwise races the
buffered relay during long reasoning. Probe deadlines remain unchanged.
The host performs no automatic retry; OpenCode can retry transport failures,
so this setting removes the demonstrated header-timeout retry loop.
The technical relay framing and socket-idle bounds remain. Numeric progress is
printed after completions. If a public task stops early, the stopped workspace
still exports a clearly marked partial patch for review. All isolation and
publication gates remain; see [working-mode acceptance](notes/mimo-long-run.md).

Tokens remain in the trusted host relay/credential helper. OpenCode receives
only the loopback URL and a public placeholder. Synthetic read/list/write probes
check denial at each credential directory. Nous uses a separate auth profile;
the Hermes agent, chats and settings do not run or change. Neither route uses
the generic Hermes proxy. Streaming responses are buffered to a bounded 16MiB
before forwarding. Missing auth, quota, price changes or failed gates stop work.

### Shared OS boundary

- A fresh scratch directory holds HOME, all XDG home directories, TMPDIR, a
  copied executable and the prepared public tree. Children receive an explicit
  environment, `/dev/null` input, and closed inherited descriptors. There are
  no mounts added by this wrapper. Seatbelt enforces access within the host
  filesystem. This is not a VM or mount namespace.
- OpenCode, ripgrep and PCRE are pinned by SHA-256 in
  [opencode_runner.py](../tools/isolation/opencode_runner.py). A binary change
  blocks execution until reviewed and revalidated. The wrapper never upgrades
  OpenCode or imports host account/session state. The public rg binary and PCRE
  library are copied into scratch. A Python launcher sets the local library path
  after entering Seatbelt, so no Homebrew directory read is granted.
- Seatbelt permits system runtime reads and scratch writes. It denies sibling
  data, symlink escapes, new cross-boundary hardlinks, data-volume aliases,
  unrelated loopback ports, direct external TCP and UDP. Its runtime allowlist
  includes system libraries and the CLT Python framework, with `/dev/null` as
  an allowed stream sink. It excludes the host home and
  all of Homebrew. Synthetic read/list/write probes run under the final profile
  on every invocation.
- The wrapper starts `opencode serve --stdio` on one selected loopback port
  **inside Seatbelt**. The client uses an explicit `--server` URL and a fresh
  ephemeral password. The reported server PID must match the launched process.
  Both processes use the same boundary. This replaces the earlier generic
  `--standalone` template: V2 standalone chooses a dynamic port. An explicit
  private server lets the OS policy admit one exact port and deny existing
  shared services. It does not discover or start the host shared service.
- Project/Claude config discovery, model-catalog network refresh, filewatching,
  snapshots, updates and formatters are disabled. The generated global config
  is the single permitted document source. Its policies permit read, edit,
  glob and grep. They deny shell, external-directory access, Code Mode,
  subagents, MCP, plugins and skills. Explicit native permission rules remove
  Code Mode and browser catalogs. The relay also rejects an advertised `execute`
  tool. A policy-only execute denial did not remove pure Code Mode calls in the
  inspected version. Configured synthetic plugin/MCP attempts
  must produce no execution marker. A discovered synthetic skill must remain
  absent. Built-in OpenCode plugins remain part of the pinned runtime.
- The runner triggers location initialization, waits for
  `opencode.config.policy` to become active, then checks real V2 permission
  decisions. A healthy `/api/info` response is insufficient: this version can
  answer before its policy plugin is active. No task prompt is submitted before
  the permission and effective-config gates pass.
- Only two exact outbound loopback ports are admitted: the private server and
  a local inference relay. The relay accepts one POST route and the fixed
  `glm-5.3-flash-free` model, then forwards to
  `https://opencode.ai/inference/openai/v1/chat/completions` with TLS verification.
  It preserves genuine OpenCode protocol headers. It does not follow redirects,
  accept CONNECT, provide a general proxy, or route to another host/model.
  The catalog must report zero input/output cost. No user API key or paid
  fallback is supplied. Free-route availability can change and failures block
  the task.

OpenCode writes source changes through native tools. Codex performs research,
test execution and patch review in the trusted environment. Source review,
publication approval and PR merge gates remain separate.

## Executed checks

| Check | Result |
| --- | --- |
| Synthetic final-profile, native policy and real provider/tool self-test | 51/51 passed |
| Public commit `2576a9519b22eaabe8864886a1e794d5d29c276c` smoke task | 49/49 passed, one new Markdown file exported |
| Actual model search/read/write | glob, grep, read and write completed; exact `ISOLATED_PROVIDER_OK` output created |
| Configured MCP, plugin and skill admission | Blocked, no execution markers |
| Provider requests | HTTP 200 via fixed relay, no private input |
| Runner regression suite | 14 passed, including tar traversal/links, output links, relay rejection, policy-readiness race, and patch fidelity |
| Original preflight setup suite | 8 passed |
| Full `npm test` | 84 contract, 43 unit, 4 map, 10 stable-zoom, 12 layout, 55 packet, 58 browser passed |
| Cleanup | Both test servers stopped; runner leaves no shared server |

The public smoke task used glob/grep and read `package.json` and
`docs/chapter-preparation.md`.
It added only a three-bullet temporary note with the project name, packet
command and source-review boundary. The patch was reviewed and was not applied
to the product. The original untracked Obsidian draft retains SHA-256
`f0a9eb2733ba7b3bcd886852dbd30fe093912f50351b1dd16a7eacae37998833`.

Setup defects were resolved before the final passing run. Search initially
failed because rg lacked its runtime and subprocess `/dev/null` access.
The pinned scratch runtime and narrow stream allowance fixed that failure.
All canaries ran again under the final profile. Startup gates now wait
for the policy plugin, and the model-level endpoint override prevents catalog
settings from bypassing the relay. The denied direct attempt stayed inside the
synthetic workspace. A first relay attempt omitted genuine client headers and
was rejected by the free service. Preserving those headers fixed it without
changing identity or supplying credentials. An initial repository-run approval
was rejected for missing public-payload evidence. The GitHub connector then
confirmed `visibility: public` and the exact PR #21 head, and the same command
passed approval and execution.

## Verification limits

Seatbelt and Apple's imported profile are deprecated/private interfaces. These
checks establish behavior on this host, binary and profile. They do not prove
resistance to kernel/runtime exploits, every IPC path, privileged local actors,
or future OS changes. A Linux VM without a host-home mount remains the stronger
durable alternative. Revalidate after changing the binary, runtime allowlist,
network rules or integration policy. Never replace a failed gate with an
unsandboxed run. Raw model output remains untrusted and local until reviewed.

Official references: [private servers](https://dev.opencode.ai/v2/docs/cli/),
[configuration](https://dev.opencode.ai/v2/docs/config/),
[native policies](https://dev.opencode.ai/v2/docs/policies/),
[API schema](https://dev.opencode.ai/v2/openapi.json).

## Repository review correction — 2026-10-22

Independent code review found that local `git replace` refs could substitute
an unpublished tree for a confirmed public SHA. Local `export-subst` attributes
could also insert unpublished ref names through `git archive`.
The exporter now reads raw commit/tree/blob objects with fixed `/usr/bin/git`,
a clean Git environment, replacement refs disabled and lazy fetching disabled.
It verifies each object's hash and builds the archive without attributes or ref expansion.

The 18 regression tests cover both reproductions, inherited Git overrides,
and exact patch application with bare CR and Unicode separators.
The corrected runner repeated all 51 synthetic end-to-end checks successfully.
The original 49-check public smoke above remains a historical baseline.
Use the corrected exporter for future tasks; older source backups retain the defects.
