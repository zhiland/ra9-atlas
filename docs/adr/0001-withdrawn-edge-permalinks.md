# Preserve withdrawn claims without drawing them as connectors

Accepted 2026-10-23 for the bounded prototype correction. A source review found
two existing A New Home edges that are not pictured direct connectors. Keep
their IDs, endpoints and array positions as `kind: withdrawn` records with a
reason and `replacedBy` IDs. Exclude them from active graph paths, neighbour
relations and ordinary connection lists. Their old permalinks open an explicit
withdrawal notice with replacement links. Append corrected active edges.

Deleting array entries would retarget index-based links. Retargeting endpoints
would silently change the claim behind an existing ID. Calling the known errors
uncertain would misstate the evidence. Historical edge records and active
connectors therefore have different counts. This decision does not make the
preparation packet the runtime source of truth or finalize the production schema.
