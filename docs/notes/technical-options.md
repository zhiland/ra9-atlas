# Technical options for the next implementation slice

Checked 2026-10-19. This is a recommendation for owner review, not an approved architecture. It uses the current map-first requirements in [spec.md](../spec.md), the agreed decisions in [grill-round-01.md](grill-round-01.md), and the current PoC4 implementation. It does not establish full-game coverage, gameplay truth, or release readiness.

## Recommendation

Keep the current static SVG/DOM renderer as the provisional baseline. It already supports the gray chart style, orthogonal connectors, labels, and hash navigation without runtime dependencies. Treat versioned JSON in Git as the canonical graph source, with a checked-in JSON Schema and build-time validation. Do not add a runtime database or select a framework yet.

GitHub Pages is the simplest hosting candidate because the public repository and Actions workflow already exist. Hosting remains an open decision under [roadmap issue #6](https://github.com/zhiland/ra9-atlas/issues/6); Cloudflare Pages is a viable fallback if GitHub limits or operations later justify a second platform. A custom domain is a separate purchase on either option.

## Rendering candidates

| Candidate | Fit and trade-offs |
|---|---|
| **Current custom SVG/DOM** | Smallest change and no added runtime package. Existing code has orthogonal paths and distinct edge types. It has only been exercised at PoC scale (45 nodes/49 edges in PoC4; 33/36 in PoC3); whole-game scale is unknown. Keyboard navigation of the graph is not yet implemented. |
| **Cytoscape.js** | MIT, supports touch gestures and right-angle “taxi” edges. Routing is best-effort and documented taxi edges have at most two turns. Official docs give performance tuning advice but no numeric graph limit. The docs do not describe screen-reader or keyboard graph navigation; a custom accessible interface would need assessment. Best fallback if the spike shows the current renderer is inadequate. |
| **React Flow** | MIT and has the strongest documented keyboard and screen-reader features. It adds React and a build stack. Its core provides step paths, while automatic obstacle-avoiding edge routing is shown as a Pro feature. This is more than the first release needs. |

The candidates' published docs do not provide a comparable measured capacity for this chart style. No performance claim here substitutes for testing the real interaction patterns.

## Data and publishing choices

| Choice | Recommendation |
|---|---|
| Canonical data | Versioned JSON plus JSON Schema 2020-12, validated with Ajv in development and CI. JSON keeps provenance and changes reviewable in Git. Inspect the existing sample data before defining any schema fields. |
| SQLite | Do not use for v1. An authoring database creates a second source of truth unless export is strictly one-way; a browser database adds startup and packaging work without a demonstrated query need. SQLite is public domain, but that does not improve the review workflow here. |
| GitHub Pages | Candidate, not a decision. GitHub Free requires a public repository. Published size is limited to 1 GB; bandwidth (100 GB/month) and builds (10/hour) are soft limits. Pages is not for commercial SaaS/e-commerce. GitHub Actions publishing avoids the Pages build-rate limit. |
| Cloudflare Pages | Fallback candidate. Free-plan docs specify 500 builds/month, one concurrent build, 20-minute timeout, 20,000 files/site, and 25 MiB per file. The limits page gives no bandwidth figure; do not assume one. Static assets are free under the current Pages pricing docs. |

Neither host is a server-maintenance requirement for a static guide. Keep analytics and third-party trackers out of the first release per the project decision.

## One bounded spike

Before selecting the production renderer or final schema, inspect `prototype/atlas-data.js`, `prototype/hostage-data.js`, and `prototype/map-data.js`. Then extend a synthetic, text-free version of the current sample to about 1,000 nodes and 1,500 edges. This is a stress fixture, not game content or a claim about final graph size.

The spike passes when:

1. JSON Schema and structural validation reject duplicate IDs and broken references; unit checks pass.
2. Playwright completes consent, chapter jump, node selection, conditional cross-chapter navigation, search, reverse lookup, and permalink reload on desktop Chromium and a mobile-emulated project.
3. Every connector remains orthogonal; traced, conditional, prerequisite, and unresolved links remain distinct through shape and text, not color alone.
4. Desktop first interaction is under 3 seconds; p95 pan/zoom frame time is at most 50 ms, with no stall above 200 ms. Record the same measurements in mobile emulation, but do not treat emulation as a real-device result.
5. Report static asset sizes and added runtime dependencies. Target zero new runtime dependencies.

If the baseline misses these gates, compare it with Cytoscape.js using the same fixture and checks, including the effort required for accessible keyboard and screen-reader navigation. Do not make a full-game content expansion part of this spike.

## Primary sources

Checked 2026-10-19.

- [Cytoscape.js documentation](https://js.cytoscape.org/) and [MIT license](https://raw.githubusercontent.com/cytoscape/cytoscape.js/master/LICENSE).
- React Flow [accessibility](https://reactflow.dev/learn/advanced-use/accessibility), [performance](https://reactflow.dev/learn/advanced-use/performance), [testing](https://reactflow.dev/learn/advanced-use/testing), [layouting](https://reactflow.dev/learn/layouting/layouting), [edge routing example](https://reactflow.dev/examples/edges/edge-routing), [attribution](https://reactflow.dev/remove-attribution), and [MIT license](https://github.com/xyflow/xyflow/blob/main/LICENSE).
- [JSON Schema specification](https://json-schema.org/specification), [Ajv](https://ajv.js.org/), and [SQLite copyright](https://sqlite.org/copyright.html).
- GitHub Pages [limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) and [overview](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages).
- Cloudflare Pages [limits](https://developers.cloudflare.com/pages/platform/limits/), [static-site setup](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), and [pricing](https://developers.cloudflare.com/pages/functions/pricing/).
- Playwright [projects](https://playwright.dev/docs/test-projects).
