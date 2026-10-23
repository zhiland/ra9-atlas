# rA9 Atlas

An unofficial interactive map of choices and consequences in **Detroit: Become Human**.
The goal is a complete, source-audited guide. The current application is a partial static prototype.

**Spoilers:** the map contains story outcomes. Its consent screen covers the map until you accept.

## Try the prototype

Use Node.js 22 or later and npm for development. Python 3 can serve the static files.
From the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [the default map](http://127.0.0.1:8000/prototype/poc4-editorial.html).
[Amber](http://127.0.0.1:8000/prototype/poc4-amber.html) and
[dark cyan](http://127.0.0.1:8000/prototype/poc4-darkcyan.html) use the same data and behavior.
No backend or runtime package installation is required to view the map.

Select a chapter, search for an event, or select a node or connector for evidence and details.
Zoom changes the camera. The nodes and branches stay in one map world.

## Coverage and evidence

The sample has **123 nodes and 104 active connectors across seven chapter regions**.
The Hostage inventory accounts for 33 boxes, 40 labels and 36 pictured connectors.
Its option-specific model has 37 claims: **32 traced and 5 uncertain**.
Both approach-to-failure origins remain uncertain. The other six chapter regions are partial.
Two old A New Home claims are withdrawn; their permalinks explain the correction.
The data retains 106 records in total, including those two historical claims.

Chart coverage, guide support, gameplay verification and interface tests are separate claims.
No gameplay transition is verified. Uncertain links stay labeled and dashed.
The [Hostage review](docs/notes/hostage-packet-source-review.md) and
[A New Home review](docs/notes/anewhome-packet-source-review.md) record their bounded findings.
The [Shades of Color preparation](docs/notes/shades-of-color-source-review.md) is source-reviewed
and integrated as a partial region. Its six detached icon origins stay unknown.
The [Painter opening packet](docs/notes/painter-packet-source-review.md) is integrated as a partial opening: nine boxes, five traces and three detached
segments with unknown origins. Source-derived publication rights remain unresolved.

See [current status](docs/STATUS.md), [coverage](docs/notes/poc4-coverage.md),
[source register](docs/SOURCES.md), and [license boundaries](docs/license-boundary.md).

## Development checks

```sh
npm ci
npx playwright install chromium
npm run build:data # after reviewed graph edits
npm test
```

The suite validates data and preparation packets, then checks graph behavior,
layout and desktop/mobile-width Chromium interactions. Browser tests need permission
for a localhost server. Viewport emulation does not certify Safari, physical touch,
assistive technology or gameplay accuracy.

Graph edits belong in [the authoring bundle](docs/authoring-data.md). Generation preserves the existing graph and legacy links.
The [chapter inventory](docs/notes/chapter-inventory-reconciliation.md) records source headings and explicit gaps; it is not a complete game-chart census.
[CI](docs/ci.md) runs deterministic checks on pull requests; source approval and publication remain separate.

Useful focused checks:

```sh
npm run validate
npm run test:packet
node prototype/validate-chapter-packet.js packets/hostage.packet.json --require-review
/usr/bin/python3 -B tests/opencode-runner.test.py
/usr/bin/python3 -B tests/seatbelt-preflight.test.py
```

`--require-review` exits 2 while the merge gate remains blocked.
The runner regression tests use local sockets and mocked upstream requests.
They do not launch OpenCode or contact a model provider. The runner itself requires
the pinned macOS runtime in [its guide](docs/opencode-runner.md).

## Project map

| Path | Purpose |
| --- | --- |
| `data/atlas.source.json`, `data/legacy-index.json` | Canonical authoring bundle and published identity ledger |
| `prototype/atlas-data.js` | Deterministic generated browser graph |
| `data/chapter-inventory.json` | Partial reconciliation of 32 chapter rows and 39 source headings |
| `prototype/atlas-app.js`, `atlas-core.js`, `atlas.css` | Shared map UI, navigation and styling |
| `packets/` | Chapter preparation documents, separate from runtime ownership |
| `tests/` | Data, interaction and isolation regressions |
| `tools/isolation/` | Controlled OpenCode launcher and boundary probes |
| `docs/` | Requirements, roadmap, source records and historical research |

Start with the [specification](docs/spec.md), [roadmap](docs/ROADMAP.md),
[data contract](docs/data-contract.md), and [packet workflow](docs/chapter-preparation.md).
The [documentation index](docs/README.md) distinguishes current instructions from historical checkpoints.
The earlier [map concept](prototype/navigation-mockup.html) and
[standalone Hostage prototype](prototype/hostage-poc3.html) remain reference artifacts.

## OpenCode workflow

Use only `tools/isolation/opencode_runner.py`, following the
[runner guide](docs/opencode-runner.md). It admits a confirmed public commit,
uses a fresh isolated workspace and exports a patch for review.
Run project tests in the trusted checkout after reviewing and applying that patch.
The tested macOS boundary is host/version specific.

## License and affiliation

MIT covers original project code and documentation only.
Game content, third-party sources and source-derived samples are excluded.
See [LICENSE](LICENSE), [content boundaries](docs/license-boundary.md), and
[the source-rights audit](docs/notes/source-license-audit.md).

This project is not affiliated with Quantic Dream or Sony Interactive Entertainment.
