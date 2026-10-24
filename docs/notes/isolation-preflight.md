# Offline isolation preflight

Date: 2026-10-22. Scope: the next bounded isolation package after PR #21.
**Historical checkpoint.** This offline package did not complete the launch
gate. The later [controlled runner](../opencode-runner.md) completed synthetic
provider/native-policy tests and a public-commit smoke task on 2026-10-22.
The remaining-gate list below describes this earlier offline package only.

## Repository checkpoint

GitHub metadata was checked on 2026-10-22. PRs
[#19](https://github.com/zhiland/ra9-atlas/pull/19),
[#20](https://github.com/zhiland/ra9-atlas/pull/20), and
[#21](https://github.com/zhiland/ra9-atlas/pull/21) were open and unmerged.
Their heads were `0ddb64d`, `26c6e19`, and `2576a95` respectively. Their bases
remain the roadmap, Hostage pilot, and chapter-preparation branches. GitHub
returned no submitted reviews or inline review threads for these PRs. That
absence is not approval. No PR was merged or changed.

The primary checkout started on `codex/roadmap-pilot-stage1` at `26c6e19`,
five commits ahead of its remote. Work continues on
`codex/isolation-preflight`, based on the inspected PR #21 head. The untracked
isolation study matched PR #21 byte-for-byte. A temporary backup preserved it
before switching branches. The untracked Obsidian update draft stays untouched
and excluded from commits.

The PR #20 diff was inspected for its source/identity boundary. Its Hostage
packet remains pending independent source review. This startup inspection
does not approve source claims or rights. No graph data changed in this package.

## Reproducible diagnostic

[seatbelt_preflight.py](../../tools/isolation/seatbelt_preflight.py) replaces
reliance on the earlier disposable harness for **synthetic offline probes**.
It accepts only a report destination. It cannot execute a caller-supplied
command, admit a repository, or start OpenCode.

```sh
# macOS only. Choose a new report filename. Existing files are not overwritten.
/usr/bin/python3 -B tools/isolation/seatbelt_preflight.py \
  --report /private/tmp/ra9-seatbelt-report.json

# Setup and failure-path checks. These do not require sandbox privileges.
/usr/bin/python3 -B tests/seatbelt-preflight.test.py
```

The diagnostic creates a new private scratch directory in `/private/tmp`.
It retains the profile, fabricated files, and probe there for inspection.
The JSON report contains the profile text, macOS version, runtime path,
environment key names, direct probe process IDs, and individual results.
It contains no host environment values or user file contents.

The wrapper uses `subprocess.run` with an explicit environment, workspace
`cwd`, closed inherited descriptors, and `/dev/null` input. HOME, all four
XDG home directories, and TMPDIR are new directories inside the scratch.
The payload uses Python isolated mode. It receives only synthetic sibling
paths, a temporary loopback port, and a fabricated descriptor number.

The profile denies operations by default. It permits reads from system
runtime directories and the Apple Command Line Tools Python framework.
It permits writes only inside the new workspace. It has no network allowance
and grants no Homebrew runtime read. Apple runtime imports and the system
allowlist remain broader than one folder. This is **not** a general sandbox
escape audit or a claim that all host data is inaccessible.

## Executed evidence

Host: macOS 27.0.1. The final diagnostic passed **21/21 checks** outside the
calling Codex sandbox. Inside that sandbox, loopback setup was denied before
the payload ran. Nested sandbox restrictions are an environment failure,
never a successful denial test.

| Operation | Observed result |
| --- | --- |
| Workspace read, list, write, persisted output | Allowed |
| Absolute/relative sibling reads, sibling list/write | Permission denied |
| Symlink escape read/write | Permission denied |
| New hardlink from sibling into workspace | Permission denied |
| Sibling read/list/write through `/System/Volumes/Data` alias | Permission denied |
| Shell child reading the sibling | Permission denied, no canary output |
| Environment | Exact allowlist, all home/temp paths inside scratch |
| Deliberately inheritable parent canary descriptor | Closed in child |
| TCP connection to a listening loopback socket | Permission denied |
| UDP send to loopback | Permission denied |
| Sibling canary and attempted new file | Original intact, new file absent |

The first runtime attempts failed before the probes: the system Python shim
needed xcode-select access, and the direct interpreter needed ancestor metadata
and random-device reads. The final profile uses the direct CLT interpreter,
narrow ancestor metadata access, and read-only random devices. All canaries
ran again after those changes. A launch failure never counts as a passed probe.
The final profile also restricts system reads to `/System/Library` instead of
the whole `/System` tree. The data-volume alias probes passed under that final
profile. Eight setup/failure-path unit tests passed separately.

The baseline `npm test` passed all existing suites outside the Codex sandbox:
84 contract, 43 unit, 4 map, 10 stable-zoom, 12 layout, 55 packet, and 58 browser
checks. The initial restricted run stopped at localhost `listen EPERM` after
contract/unit checks. Chromium viewport checks do not certify Safari,
physical touch, or assistive technology.

## Remaining launch gates

1. Audit the actual OpenCode runtime and public scratch export. Reject private
   files, caches, symlinks, submodules, hardlinks, and inherited private handles.
   This diagnostic deliberately admits no repository at all.
2. Select and test the actual VM or OS wrapper. A no-home-mount Linux VM remains
   the preferred durable option. The tested Seatbelt profile is deprecated and
   covers Python/shell probes only. Adding OpenCode runtime paths changes it
   and requires all probes again.
3. With separate authorization to start OpenCode, test its private
   `--standalone` server inside that boundary. Inspect its process placement
   and effective V2 policy. Test permitted read/edit and denied shell,
   external-directory, and integration actions. No part of this step ran.
4. Review the minimal provider network allowance. Repeat all canaries after
   changing it. Use one synthetic provider request before admitting a prepared
   public repository. No credentials or provider requests were used here.

These gates remain open. The report always says `productionReady: false` and
`opencodeStarted: false`, even when every offline probe passes. The earlier
[isolation study](opencode-macos-isolation.md) remains historical evidence.
