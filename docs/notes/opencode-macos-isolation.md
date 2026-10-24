# OpenCode on macOS: folder isolation study (22 October 2026)

Historical checkpoint. For current requirements and work order, use [the runner guide](../opencode-runner.md) and [current status](../STATUS.md).
The statements below describe the original package, not the current repository state.

## Decision

Use an isolated Linux VM with **no host-home mount** for the strongest boundary before giving an agent a network-connected model and shell. Place a fresh copy of the public repository in the guest, or mount only a dedicated public scratch directory. Lima supports `--mount-none`/plain mode; its ordinary default mounts the host home read-only, which is unacceptable here. Bubblewrap can add a second, mount-based boundary **inside Linux**; it is Linux-specific and does not run natively on this Mac. [Lima usage](https://lima-vm.io/docs/usage/), [Lima plain mode](https://lima-vm.io/docs/config/plain/), [Bubblewrap README](https://github.com/containers/bubblewrap/blob/main/README.md), [Apple Virtualization framework](https://developer.apple.com/documentation/virtualization/creating-and-running-a-linux-virtual-machine).

For a lighter local path, macOS `sandbox-exec`/Seatbelt is a useful **provisional** kernel-enforced filesystem boundary. A synthetic test on this Mac worked. It is deprecated by the installed `sandbox-exec(1)` manual, and this study did not prove a complete network-connected OpenCode session or a security guarantee against macOS sandbox escapes and privileged IPC. Apple documents the supported, entitlement-based App Sandbox for packaged apps; applying it directly to this existing command-line binary is a different engineering project. [Apple App Sandbox](https://developer.apple.com/documentation/xcode/configuring-the-macos-app-sandbox). **The OpenCode server, not merely its CLI client, must run inside this sandbox.** V2 normally connects the CLI to a shared background server that owns tool execution; its `--standalone` flag starts a private server. The installed V2 CLI confirms that flag. [OpenCode V2 CLI](https://dev.opencode.ai/v2/docs/cli/).

OpenCode's own permissions are defense in depth, not the filesystem boundary. V2 explicitly says its shell runs with host-user filesystem, process and network authority, and command-path inference is best effort. It also defaults external-directory access to allow unless configured otherwise. V1 permission syntax differs, so a V1 policy must not be presumed effective on the installed V2 binary. [OpenCode V2 permissions](https://dev.opencode.ai/v2/docs/permissions/).

## Local evidence

Host: macOS 27.0.1, Apple silicon; `/usr/bin/sandbox-exec` and OpenCode v2.0.32 are installed. `bwrap`, `docker`, `limactl`, and `colima` were not found in `PATH`. The test profile and harness are at `/private/tmp/opencode-sandbox-study/seatbelt-test.sb` and `/private/tmp/opencode-sandbox-study/test_seatbelt.py`. All file contents were fabricated canaries under that temporary directory. The test was run outside the calling Codex sandbox because nested `sandbox_apply` returned `Operation not permitted` there. No model/provider request occurred.

The profile uses `(deny default)`, imports Apple's `dyld-support.sb`, permits process exec/fork and system/OpenCode runtime reads, permits read/write only within the synthetic workspace, and has **no network allowance**. The imported Apple file calls itself a private interface subject to change. The profile is a tested prototype, not a production wrapper.

| Probe | Result |
| --- | --- |
| Read and write in allowed directory | Succeeded |
| Read/list sibling directory, including absolute path | Denied: `Operation not permitted` |
| Write in sibling directory | Denied; canary remained intact |
| Read and write through symlink from allowed directory to sibling | Denied |
| Shell child reads sibling | Denied |
| Sanitized child environment omits a synthetic parent secret | Confirmed |
| `opencode --version` and `opencode debug paths` with synthetic `HOME`/XDG paths | Succeeded offline; all reported data/config/cache/state/log/DB paths stayed in the synthetic workspace |

The local `sandbox-exec(1)` manual marks the command **DEPRECATED**. The successful canary probes demonstrate those operations on this host and profile; they do not prove all filesystem APIs, IPC paths, subprocesses, plugins, or future macOS/OpenCode versions.

## Requirements before any real model run

1. Stage only the **public** repository into a dedicated scratch workspace. Inspect symlinks and submodules before admitting them; avoid pre-opened descriptors or hardlinks to private data. Do not mount the Obsidian vault, the user's home, SSH directory, browser profile, Docker socket, or other private locations.
2. Launch `opencode --standalone` **inside the OS sandbox** from a clean environment (`env -i` equivalent), with `HOME`, `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_CACHE_HOME`, `XDG_STATE_HOME`, and `TMPDIR` inside the scratch area. The tested offline path command confirms V2 honors these paths. Without `--standalone`, the CLI may connect to the existing unsandboxed shared server and tools execute there. OpenCode can load global/project/managed config, plugins, and credentials; inspect the effective isolated config and disable unneeded integrations. V2 plugins can add tools. [OpenCode V2 CLI](https://dev.opencode.ai/v2/docs/cli/), [V2 config](https://dev.opencode.ai/v2/docs/config/), [V2 plugins](https://dev.opencode.ai/v2/docs/cli/plugins), [provider credential storage](https://dev.opencode.ai/v2/docs/cli/providers).
3. Add only the network privileges needed for the selected provider and validate DNS/TLS/provider login using synthetic input. Any network-enabled agent can transmit data it is allowed to read; environment tokens, copied credentials, and tool output are therefore within its disclosure scope. The tested profile currently denies network, and provider operation remains untested.
4. Repeat the canary matrix after adding runtime or network allowances, then test a full OpenCode session with a **dummy public workspace** before loading the real public repository. Keep native policies narrow as a second layer. The installed V2 CLI has no `--pure` flag; that flag appeared in V1 documentation and must not be used as a V2 control. [OpenCode V2 CLI](https://dev.opencode.ai/v2/docs/cli/), [V2 permissions](https://dev.opencode.ai/v2/docs/permissions/).

The macOS prototype has a broader runtime read allowlist (`/System`, `/usr`, `/opt/homebrew`) than “one folder”; this is for executables and libraries. The relevant claim is that **project/user data outside the dedicated workspace** was inaccessible in the tested probes. A VM with no host mount gives a clearer and more durable boundary. Neither VM nor a production Seatbelt wrapper was installed or activated by this study.

## Native OpenCode V2 audit (same host)

The installed CLI is v2.0.32. Read-only inspection found no `opencode.json(c)`, `.opencode/`, or `AGENTS.md` in the Detroit workspace or its ancestors; no global config, global instruction file, plugin/agent/skill directory, system config directory, or macOS managed-preference file was present. The global OpenCode directory contained only `service.json` with a `password` key; its value was not displayed. This file is service authentication, not a folder policy. Saved account/session state and any connected Console policy were not inspected.

V2's shipped policy allows most tools, including `external_directory`; its only special file-read prompts concern `.env` patterns. Therefore the prior prompt-level instruction to stay in the public repository had no native deny behind it. V2 `AGENTS.md` and configured instructions are model guidance, not access control. On this host none was found in the inspected discovery paths; this does not establish what an earlier running server had cached. [V2 permissions and defaults](https://dev.opencode.ai/v2/docs/permissions/), [V2 instructions](https://dev.opencode.ai/v2/docs/instructions/).

An **illustrative, uninstalled defense-in-depth** policy for a clean scratch workspace is below. The first rule denies every tool action; only built-in `read`, `edit` (which covers write/patch), and user questions are exempted. Every other action, including `external_directory`, `shell`, `glob`, `grep`, Code Mode `execute`, and MCP tools, remains denied. The integration rules prevent plugins, MCP servers, and skills from loading. `formatter: false` prevents a configured formatter from spawning a process after edits. V2 policy `allow` only removes a prior policy denial; normal permission checks still apply. [V2 policies](https://dev.opencode.ai/v2/docs/policies/), [V2 tools](https://dev.opencode.ai/v2/docs/tools/), [V2 formatters](https://dev.opencode.ai/v2/docs/formatters/).

```json
{
  "$schema": "https://opencode.ai/config.json",
  "formatter": false,
  "policies": [
    { "action": "tool.use", "resource": "*", "effect": "deny" },
    { "action": "tool.use", "resource": "read:*", "effect": "allow" },
    { "action": "tool.use", "resource": "edit:*", "effect": "allow" },
    { "action": "tool.use", "resource": "question:*", "effect": "allow" },
    { "action": "integration.use", "resource": "mcp:*", "effect": "deny" },
    { "action": "integration.use", "resource": "plugin:*", "effect": "deny" },
    { "action": "integration.use", "resource": "skill:*", "effect": "deny" }
  ]
}
```

This disables search and command execution, so an agent must browse the scratch tree with `read` directory listings and edit known paths. It is a product rule, **not** a host filesystem boundary: config loading, formatters, server placement, bugs, and other non-tool execution paths still need control. In particular, `glob` is checked against its pattern and `grep` against its search expression, not a path, so a bare `external_directory` deny is not a complete one-folder policy for every search tool. V2's shell path inference is explicitly best effort. [V2 tools](https://dev.opencode.ai/v2/docs/tools/), [V2 permissions](https://dev.opencode.ai/v2/docs/permissions/).

The JSON syntax of the proposed policy was checked in a synthetic `HOME`. The installed CLI `--help` confirmed `--standalone` and no `--pure`. An offline `debug config` attempt did not complete; its local log reported that the shared service port was already in use. No effective policy/tool invocation was tested, no real config was modified, and no model call occurred. The next validation must run a private V2 server inside the OS boundary against synthetic paths, then attempt the native-policy read/edit cases before trusting either layer.
