# Opt into source row groups without changing legacy binary nodes

Runtime contract 1.1 permits `rowGroup: true` on choice nodes with two or more
source rows. Unflagged nodes keep the binary contract and exact legacy layout,
even under 1.1. This avoids silently reinterpreting published choices when new
source groups contain outcomes or variations rather than player decisions.

A shared layout module owns the heading, row bounds and option anchors for the
new groups. Renderer and validator use the same geometry and option routes. Routes must
remain outside endpoint interiors. Overlapping columns use an outside corridor. Group-level exits keep
no option index. We retain the existing choice kind and add an explicit opt-in
rather than splitting groups into invented binary branches or introducing a new
kind throughout navigation and edge handling. Source interpretation, gameplay
and publication remain separate from this representation decision.
