# ra9-atlas

Domain glossary for the Detroit: Become Human interactive guide.

## Terms

**Interactive guide**: a reference for actions, conditions, and consequences, with navigation between related events.
_Avoid_: game, playthrough simulator.

**Chapter**: a named section of the game. One chapter can contain several character charts.

**Character chart**: a separate event map for one character within a chapter.

**Cross-chapter link**: a dependency between an event in one chapter and an action or state in another. It can have additional conditions.

**Dataset**: collected claims about events and links, with sources and verification status.

**Active connector**: a currently represented relationship between events, with its stated source and evidence limits.

**Withdrawn edge claim**: a historical relationship that review rejected or replaced. It remains identifiable for old references but is not part of the active event graph.
_Avoid_: uncertain connector, hidden branch.

**Authoring bundle**: the canonical collection of atlas claims, evidence references, layout and historical identities used to prepare an application dataset.
_Avoid_: independently verified dataset, automatic source approval.

**Compatibility ledger**: the record of published identities and their meanings, retained so existing references cannot silently select a different claim.
