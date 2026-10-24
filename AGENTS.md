# ra9-atlas

For external OpenCode work, read [the runner guide](docs/opencode-runner.md)
before the first launch or any boundary change. Use only
`tools/isolation/opencode_runner.py`. A direct OpenCode CLI launch bypasses
this project's verified isolation. The guide defines public-input admission,
patch review, test execution, and the host/version verification limits.

Start independent implementation packages from `main`. Stack PRs only while a
required dependency remains unmerged. After an owner-authorized integration,
close redundant PRs only after verifying that their heads are ancestors of main.
