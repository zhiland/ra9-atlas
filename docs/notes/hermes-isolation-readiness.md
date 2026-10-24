# Hermes project-only isolation readiness

Date: 2026-10-24. Requested: a new Hermes conversation using Nous Portal Free,
with access restricted to ra9-atlas project files.

Historical whole-agent assessment. The user declined Docker/VM setup. Subsequent
work uses only the Hermes credential adapter with the existing isolated OpenCode
runner; see [Nous verification](nous-free-runner.md) and the
[current model matrix](model-provider-options.md). Whole-agent Hermes isolation
is still not certified. The pending setup below describes the abandoned option.

## Observed state

The installed Hermes launcher resolves to the existing user Hermes installation.
Its global configuration declares `terminal.backend: local`, persistent containers
and no automatic cwd mount. No Docker, Colima, Podman or OrbStack command was
found on PATH or in the checked standard binary/application locations. This is
a bounded installation check, not a filesystem-wide inventory.

The desktop accessibility request timed out. No new model conversation was
created, no model was changed, and no project content was sent to Hermes.
The app wrapper's Info.plist version 0.0.1 does not establish the engine version.
Existing Hermes conversations and settings remain unchanged.

## Boundary requirement

The [official configuration guide](https://hermes-agent.nousresearch.com/docs/user-guide/configuration)
states that local execution has no isolation. A fresh chat, profile HOME or
working directory is not an OS read boundary. The [security guide](https://hermes-agent.nousresearch.com/docs/guides/secure-hermes-on-a-work-machine)
also distinguishes write guards from containment of terminal access.

Use a separate isolated instance rather than changing the existing running agent.
A whole-agent container/VM is preferable to restricting only terminal execution:
host-side memory, skills, plugins, attachments and helper tools must not import
private state into the model context. Expose only an admitted public project
snapshot and empty per-chat state. Do not mount host HOME, Obsidian, user Hermes
state, credential directories or the Docker socket. Provider authentication must
stay outside model-readable tool paths. Keep only the selected free route and
its required authentication available, without paid or auxiliary fallbacks.

## Required acceptance probes — not executed yet

1. Read and edit a fabricated allowed project file.
2. Deny read, list and write against fabricated sibling files and host HOME.
3. Deny symlink/hardlink escapes and alternate host path aliases.
4. Verify effective tools, memory, plugins, inherited environment and mounts.
5. Verify the private provider route and zero model price before inference.
6. Start a fresh isolated chat and repeat file-tool and terminal probes there.
7. Confirm denied reads remain denied, no private bytes enter context, and all
   processes stop after the synthetic run. Only then admit project content.

An available Docker backend alone does not certify all these properties. Its
per-session behavior and file-tool routing must match the installed version.
Container/VM setup and Nous authentication remain pending. A user preference is
requested because an isolated instance differs from the existing desktop chat.
