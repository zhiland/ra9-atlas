# Spec-driven development for ra9-atlas

Date: October 17, 2026.  
Source: [Anthropic — The AI-native SDLC playbook](https://claude.com/resources/articles/the-ai-native-sdlc-playbook).

## What we take from the article

The article describes the full AI-native SDLC, not a standalone SDD standard. Useful practices include written intent, a specification, planning before code, checking results, and keeping a single source of truth. Start the process manually. Add automation after refining it.

## Our process

1. Record the need in `intent.md`.
2. Describe behavior and acceptance in `spec.md`. Leave unknowns open.
3. Check the data and mockup. Finish the decision grill.
4. Record go/no-go. If ready, choose an architecture and approve the specification.
5. Create `plan.md`: tasks, dependencies, files to change, and checks linked to requirement IDs.
6. Complete small tasks. Compare results with the specification.
7. Save verification evidence. Independently check important conclusions.
8. Feed fixes back into requirements and related checks.

This sequence is adapted for the project. It does not require separate approval for every edit. The project owner makes new product decisions and decides when to move to implementation. The orchestrator completes preparation already agreed to.

## One source for each kind of information

- `intent.md`: purpose and boundaries.
- `spec.md`: requirements, acceptance, and blockers.
- `PREPARATION-PLAN.md`: preparation order and go/no-go.
- `plan.md`: future implementation plan. Do not create it yet.
- `notes/`: evidence, research, and reviews.
- `STATUS.md`: resume point, links, and next step.
- Obsidian: short summary and pointers, not a second specification.

Files are currently local. There is no Git history or commit yet. When preparing the repository, version selected documents. First review research copies and logs for publication suitability.

## Now / later

Now: intent, draft spec, three data-check cases, mockup, and open decisions.  
Later: implementation plan, application checks, PR, and release.

Automated CI agents, paid reviews, and continuous monitoring are not needed now. The same task can be given to Codex or OpenCode with a minimal set of public files.

## Definition of ready / done

Ready for implementation: the scenario has been checked, requirements and rights are clear, an approach is chosen, and a plan is agreed.  
Done for a task: related requirements are met, check results are saved, and limitations are recorded.

A specification alone proves neither data correctness nor product readiness.
