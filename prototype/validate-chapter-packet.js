#!/usr/bin/env node
/* Node-only validator for a versioned chapter-preparation packet.
   Run:
     node prototype/validate-chapter-packet.js packets/hostage.packet.json
     node prototype/validate-chapter-packet.js --emit-template hostage \
       --title "The Hostage" --out packets/hostage.packet.json

   The validator checks packet structure, source metadata, stable IDs, changed
   edges, edge-local conditions, coverage boundaries, unknown/conflict records,
   legacy ?edge=N claims, review metadata and optional ATLAS reconciliation.
   It does not verify a game claim, source truth, independence, or rights
   clearance. Those remain separate review and merge gates.

   Exit codes: 0 structurally valid; 1 structural/file error; 2 --require-review
   was requested but the packet is not review-ready. */

'use strict';

const fs = require('fs');
const path = require('path');
const { readAtlasData } = require('./validate-atlas-data.js');

const PACKET_KIND = 'ra9-atlas.chapter-preparation.packet';
const PACKET_VERSION = '1.0';
const PACKET_STATUSES = new Set(['draft', 'prepared', 'reviewed']);
const COVERAGE_STATUSES = new Set(['not-added', 'partial', 'checked-against-chart']);
const BASES = new Set(['chart-transcribed', 'guide-reported', 'mixed', 'unknown']);
const SOURCE_CLASSES = new Set(['chart-image', 'first-party', 'supplementary-guide', 'community-transcript', 'reference']);
const ACCESS_OUTCOMES = new Set(['inspected', 'inspected-excerpt', 'http-error', 'unavailable', 'search-snippet-only', 'not-accessed']);
const RIGHTS_STATES = new Set(['not-reviewed', 'reference-only', 'license-identified', 'permission-identified', 'restricted']);
const NODE_KINDS = new Set(['action', 'flag', 'choice', 'outcome', 'stage']);
const EDGE_KINDS = new Set(['traced', 'conditional', 'prerequisite', 'hypothesis', 'uncertain']);
const CONDITION_OPERATORS = new Set(['SINGLE', 'AND', 'OR']);
const REVIEW_STATES = new Set(['not-started', 'pending', 'in-progress', 'approved', 'rejected']);
const MERGE_STATES = new Set(['blocked', 'ready']);

const ID_RE = /^[a-z0-9][a-z0-9._-]*$/;
const EDGE_ID_RE = /^e_[a-z0-9][a-z0-9._-]*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function validDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function sourceRefErrors(sourceIds, owner, refs, required) {
  const errors = [];
  if (required && (!Array.isArray(refs) || refs.length === 0)) {
    errors.push(`${owner} has no source references`);
    return errors;
  }
  if (refs == null) return errors;
  if (!Array.isArray(refs)) {
    errors.push(`${owner} sources must be an array`);
    return errors;
  }
  const seen = new Set();
  for (const ref of refs) {
    if (typeof ref !== 'string' || !ref.trim()) {
      errors.push(`${owner} has a malformed source reference`);
      continue;
    }
    if (!sourceIds.has(ref)) errors.push(`${owner} references unknown source "${ref}"`);
    if (seen.has(ref)) errors.push(`${owner} repeats source "${ref}"`);
    seen.add(ref);
  }
  return errors;
}

function nodeShapeErrors(node, owner, requireChapter) {
  const errors = [];
  if (!isObject(node)) return [`${owner} must be an object`];
  const id = text(node.id);
  if (!id) errors.push(`${owner} has no id`);
  else if (!ID_RE.test(id)) errors.push(`${owner} id "${id}" must match ${ID_RE}`);
  if (!text(node.label)) errors.push(`${owner} ("${id || '?'}") has no label`);
  if (!NODE_KINDS.has(node.kind)) errors.push(`${owner} ("${id || '?'}") has unknown kind "${node.kind}"`);
  if (requireChapter && !text(node.chapter)) errors.push(`${owner} ("${id || '?'}") has no chapter`);
  if (requireChapter && text(node.chapter) && !ID_RE.test(text(node.chapter))) {
    errors.push(`${owner} ("${id || '?'}") chapter "${node.chapter}" must match ${ID_RE}`);
  }
  if (node.kind === 'choice') {
    if (!Array.isArray(node.options) || node.options.length !== 2 ||
        node.options.some(option => typeof option !== 'string' || !option.trim()) ||
        new Set(node.options).size !== 2) {
      errors.push(`${owner} ("${id || '?'}") must list exactly two unique non-empty options`);
    }
  } else if (node.options != null && (!Array.isArray(node.options) || node.options.length)) {
    errors.push(`${owner} ("${id || '?'}") is not a choice and must not list options`);
  }
  return errors;
}

function edgeShapeErrors(edge, owner, nodeById) {
  const errors = [];
  if (!isObject(edge)) return [`${owner} must be an object`];
  const id = text(edge.id);
  if (!id) errors.push(`${owner} has no id`);
  else if (!EDGE_ID_RE.test(id)) errors.push(`${owner} id "${id}" must match ${EDGE_ID_RE}`);
  if (!EDGE_KINDS.has(edge.kind)) errors.push(`${owner} ("${id || '?'}") has unknown kind "${edge.kind}"`);
  if (!text(edge.from)) errors.push(`${owner} ("${id || '?'}") has no from endpoint`);
  if (!text(edge.to)) errors.push(`${owner} ("${id || '?'}") has no to endpoint`);
  if (text(edge.from) && text(edge.from) === text(edge.to)) errors.push(`${owner} ("${id || '?'}") is a self-loop`);
  if (edge.note != null && (typeof edge.note !== 'string' || !edge.note.trim())) {
    errors.push(`${owner} ("${id || '?'}") has an empty note`);
  }
  if (edge.fromOption != null) {
    const from = nodeById.get(edge.from);
    if (!Number.isInteger(edge.fromOption) || edge.fromOption < 0) {
      errors.push(`${owner} ("${id || '?'}") fromOption must be a non-negative integer`);
    } else if (!from || from.kind !== 'choice' || !Array.isArray(from.options) || edge.fromOption >= from.options.length) {
      errors.push(`${owner} ("${id || '?'}") fromOption ${edge.fromOption} does not name an option of its from node`);
    }
  }
  if (edge.legacyEdgeIndex != null &&
      (!Number.isInteger(edge.legacyEdgeIndex) || edge.legacyEdgeIndex < 0)) {
    errors.push(`${owner} ("${id || '?'}") legacyEdgeIndex must be a non-negative integer`);
  }
  return errors;
}

function evidenceRecordErrors(records, label, expectedStatus, sourceIds, nodeIds, edgeIds) {
  const errors = [];
  if (!Array.isArray(records)) {
    errors.push(`${label} records must be an array`);
    return errors;
  }
  for (const record of records) {
    if (!isObject(record)) {
      errors.push(`${label} record must be an object`);
      continue;
    }
    const id = text(record.id) || '?';
    if (!text(record.id)) errors.push(`${label} record has no id`);
    else if (!ID_RE.test(record.id)) errors.push(`${label} id "${record.id}" must match ${ID_RE}`);
    if (record.status !== expectedStatus) {
      errors.push(`${label} "${id}" has status "${record.status}", expected "${expectedStatus}"`);
    }
    if (!text(record.explanation)) errors.push(`${label} "${id}" has no explanation`);
    const nodes = record.nodes;
    const edges = record.edges;
    if (nodes != null && !Array.isArray(nodes)) errors.push(`${label} "${id}" nodes must be an array`);
    if (edges != null && !Array.isArray(edges)) errors.push(`${label} "${id}" edges must be an array`);
    const nodeList = Array.isArray(nodes) ? nodes : [];
    const edgeList = Array.isArray(edges) ? edges : [];
    if (!nodeList.length && !edgeList.length) {
      errors.push(`${label} "${id}" has no node or edge reference`);
    }
    for (const nodeId of nodeList) {
      if (typeof nodeId !== 'string' || !nodeIds.has(nodeId)) {
        errors.push(`${label} "${id}" references missing node "${nodeId}"`);
      }
    }
    for (const edgeId of edgeList) {
      if (typeof edgeId !== 'string' || !edgeIds.has(edgeId)) {
        errors.push(`${label} "${id}" references missing edge "${edgeId}"`);
      }
    }
    errors.push(...sourceRefErrors(sourceIds, `${label} "${id}"`, record.sources, true));
  }
  return errors;
}

function diffLists(actual, expected, label) {
  const missing = expected.filter(value => !actual.includes(value));
  const extra = actual.filter(value => !expected.includes(value));
  const errors = [];
  if (missing.length) errors.push(`${label} is missing: ${missing.join(', ')}`);
  if (extra.length) errors.push(`${label} has unexpected entries: ${extra.join(', ')}`);
  return errors;
}

function createDraftPacket(chapterId, title) {
  const id = text(chapterId);
  const chapterTitle = text(title) || (id ? `Chapter ${id}` : 'Untitled chapter');
  return {
    kind: PACKET_KIND,
    packetVersion: PACKET_VERSION,
    packetStatus: 'draft',
    packetId: (id || 'chapter') + '-packet',
    chapter: {
      id: id || 'replace-with-chapter-id',
      title: chapterTitle
    },
    coverage: {
      status: 'not-added',
      scope: `Draft preparation scope for ${chapterTitle}. No evidence has been collected yet.`,
      included: [],
      omitted: ['All chapter content; no evidence has been collected yet.'],
      sources: []
    },
    sources: [],
    chart: {
      basis: 'chart-transcribed',
      sources: [],
      nodes: [],
      edges: []
    },
    supplementary: [],
    conditions: [],
    unknowns: [],
    conflicts: [],
    review: {
      independent: {
        required: true,
        state: 'not-started',
        reviewer: null,
        date: null,
        scope: 'Independent source review has not started.',
        notes: 'Automated structural validation cannot complete an independent source review.'
      },
      mergeGate: {
        state: 'blocked',
        reason: 'Draft packet: no evidence and no independent source review.'
      }
    }
  };
}

function validatePacket(packet, options) {
  const opts = options || {};
  const atlas = opts.atlas || null;
  const p = isObject(packet) ? packet : {};
  const checks = [];
  const check = (name, run) => {
    let errors;
    try {
      errors = run() || [];
    } catch (error) {
      errors = [`validator exception: ${error.message}`];
    }
    checks.push({ name, errors });
  };

  const sources = list(p.sources);
  const sourceIds = new Set(sources.filter(isObject).map(source => source.id).filter(id => typeof id === 'string'));
  const chart = isObject(p.chart) ? p.chart : {};
  const chartNodes = list(chart.nodes);
  const chartEdges = list(chart.edges);
  const supplementary = list(p.supplementary);
  const externalNodes = supplementary.flatMap(item => isObject(item) ? list(item.externalNodes) : []);
  const supplementaryEdges = supplementary.flatMap(item => isObject(item) ? list(item.edges) : []);
  const allNodes = chartNodes.concat(externalNodes);
  const allEdges = chartEdges.concat(supplementaryEdges);
  const nodeById = new Map(allNodes.filter(isObject).map(node => [node.id, node]));
  const edgeById = new Map(allEdges.filter(isObject).map(edge => [edge.id, edge]));
  const nodeIds = new Set(nodeById.keys());
  const edgeIds = new Set(edgeById.keys());

  check('packet kind, version, status and chapter identity', () => {
    const errors = [];
    if (!isObject(packet)) errors.push('packet must be a JSON object');
    if (p.kind !== PACKET_KIND) errors.push(`kind must be "${PACKET_KIND}", found "${p.kind}"`);
    if (p.packetVersion !== PACKET_VERSION) {
      errors.push(`packetVersion must be "${PACKET_VERSION}", found "${p.packetVersion}"`);
    }
    if (!PACKET_STATUSES.has(p.packetStatus)) {
      errors.push(`packetStatus must be one of ${[...PACKET_STATUSES].join(', ')}, found "${p.packetStatus}"`);
    }
    if (!text(p.packetId)) errors.push('packetId is required');
    else if (!ID_RE.test(p.packetId)) errors.push(`packetId "${p.packetId}" must match ${ID_RE}`);
    if (!isObject(p.chapter)) {
      errors.push('chapter must be an object');
    } else {
      if (!text(p.chapter.id)) errors.push('chapter.id is required');
      else if (!ID_RE.test(p.chapter.id)) errors.push(`chapter.id "${p.chapter.id}" must match ${ID_RE}`);
      if (!text(p.chapter.title)) errors.push('chapter.title is required');
    }
    if (p.atlas != null) {
      if (!isObject(p.atlas)) errors.push('atlas must be an object when present');
      else {
        if (!text(p.atlas.source)) errors.push('atlas.source is required when atlas reconciliation is declared');
        if (!text(p.atlas.chapterId)) errors.push('atlas.chapterId is required when atlas reconciliation is declared');
      }
    }
    for (const field of ['sources', 'supplementary', 'conditions', 'unknowns', 'conflicts']) {
      if (!Array.isArray(p[field])) errors.push(`${field} must be an array`);
    }
    if (!isObject(p.chart)) errors.push('chart must be an object');
    else {
      if (!Array.isArray(p.chart.nodes)) errors.push('chart.nodes must be an array');
      if (!Array.isArray(p.chart.edges)) errors.push('chart.edges must be an array');
    }
    if (!isObject(p.review)) errors.push('review must be an object');
    return errors;
  });

  check('stable IDs are present and unique', () => {
    const errors = [];
    function unique(records, label) {
      const seen = new Set();
      list(records).forEach((record, index) => {
        if (!isObject(record)) return;
        const id = text(record.id);
        if (!id) errors.push(`${label} at index ${index} has no id`);
        else if (seen.has(id)) errors.push(`duplicate ${label} id "${id}"`);
        seen.add(id);
      });
    }
    unique(sources, 'source');
    unique(chartNodes.concat(externalNodes), 'node');
    unique(allEdges, 'edge');
    unique(p.conditions, 'condition');
    unique(p.unknowns, 'unknown');
    unique(p.conflicts, 'conflict');
    const seenEdges = new Set();
    for (const edge of allEdges.filter(isObject)) {
      const option = edge.fromOption == null ? '' : `#${edge.fromOption}`;
      const key = `${edge.from}${option}->${edge.to}`;
      if (seenEdges.has(key)) errors.push(`duplicate directed edge ${key} ("${edge.id}")`);
      seenEdges.add(key);
    }
    return errors;
  });

  check('sources carry URL, class, role, locator, access state, attribution and a rights review state', () => {
    const errors = [];
    if (p.packetStatus !== 'draft' && sources.length === 0) {
      errors.push('a non-draft packet needs at least one source');
    }
    sources.forEach((source, index) => {
      const owner = `source[${index}]${isObject(source) && text(source.id) ? ` ("${source.id}")` : ''}`;
      if (!isObject(source)) {
        errors.push(`${owner} must be an object`);
        return;
      }
      if (!text(source.url) || !/^https?:\/\/[^\s]+$/.test(source.url)) {
        errors.push(`${owner} url must be an absolute http(s) URL`);
      }
      if (!SOURCE_CLASSES.has(source.class)) {
        errors.push(`${owner} class must be one of ${[...SOURCE_CLASSES].join(', ')}, found "${source.class}"`);
      }
      if (!text(source.role)) errors.push(`${owner} has no role`);
      if (!text(source.locator)) errors.push(`${owner} has no locator`);
      if (!text(source.attribution)) errors.push(`${owner} has no attribution`);
      if (!Array.isArray(source.access) || source.access.length === 0) {
        errors.push(`${owner} needs at least one access date/outcome record`);
      } else {
        source.access.forEach((access, accessIndex) => {
          const accessOwner = `${owner} access[${accessIndex}]`;
          if (!isObject(access)) {
            errors.push(`${accessOwner} must be an object`);
            return;
          }
          if (!validDate(access.date)) errors.push(`${accessOwner} date must be a real YYYY-MM-DD date`);
          if (!text(access.actor)) errors.push(`${accessOwner} has no actor`);
          if (!ACCESS_OUTCOMES.has(access.outcome)) {
            errors.push(`${accessOwner} outcome must be one of ${[...ACCESS_OUTCOMES].join(', ')}, found "${access.outcome}"`);
          }
          if (access.outcome === 'http-error' &&
              (!Number.isInteger(access.httpStatus) || access.httpStatus < 100 || access.httpStatus > 599)) {
            errors.push(`${accessOwner} outcome "http-error" needs an HTTP status number`);
          }
        });
      }
      if (!isObject(source.rights)) {
        errors.push(`${owner} has no rights review record`);
      } else {
        if (!RIGHTS_STATES.has(source.rights.state)) {
          errors.push(`${owner} rights.state must be one of ${[...RIGHTS_STATES].join(', ')}, found "${source.rights.state}"`);
        }
        if (!text(source.rights.note)) errors.push(`${owner} rights.note is required`);
      }

    });
    return errors;
  });

  check('chart nodes keep stable IDs, labels, kinds and choice options', () => {
    const errors = [];
    if (!isObject(p.chart)) return ['chart must be an object'];
    if (p.chart.basis !== 'chart-transcribed') {
      errors.push(`chart.basis must be "chart-transcribed", found "${p.chart.basis}"`);
    }
    const hasChartEvidence = chartNodes.length > 0 || chartEdges.length > 0;
    errors.push(...sourceRefErrors(sourceIds, 'chart', p.chart.sources, hasChartEvidence || p.packetStatus !== 'draft'));
    chartNodes.forEach((node, index) => {
      const owner = `chart node[${index}]`;
      errors.push(...nodeShapeErrors(node, owner, false));
    });
    if (p.packetStatus !== 'draft' && chartNodes.length === 0 && supplementaryEdges.length === 0) {
      errors.push('a non-draft packet needs at least one chart node or supplementary edge');
    }
    return errors;
  });

  check('chart edges keep endpoints, kinds, options and unique legacy indices', () => {
    const errors = [];
    const chartNodeIds = new Set(chartNodes.filter(isObject).map(node => node.id));
    const chartNodeMap = new Map(chartNodes.filter(isObject).map(node => [node.id, node]));
    const seenIndexes = new Set();
    chartEdges.forEach((edge, index) => {
      const owner = `chart edge[${index}]`;
      errors.push(...edgeShapeErrors(edge, owner, chartNodeMap));
      if (!isObject(edge)) return;
      if (!chartNodeIds.has(edge.from)) errors.push(`${owner} ("${edge.id || '?'}") from endpoint "${edge.from}" is not a chart node`);
      if (!chartNodeIds.has(edge.to)) errors.push(`${owner} ("${edge.id || '?'}") to endpoint "${edge.to}" is not a chart node`);
      if (edge.legacyEdgeIndex != null) {
        if (seenIndexes.has(edge.legacyEdgeIndex)) {
          errors.push(`${owner} ("${edge.id || '?'}") reuses legacyEdgeIndex ${edge.legacyEdgeIndex}`);
        }
        seenIndexes.add(edge.legacyEdgeIndex);
      }
    });
    return errors;
  });

  check('supplementary claims stay separate, sourced and attached to declared endpoints', () => {
    const errors = [];
    supplementary.forEach((item, index) => {
      const owner = `supplementary[${index}]`;
      if (!isObject(item)) {
        errors.push(`${owner} must be an object`);
        return;
      }
      if (!text(item.id)) errors.push(`${owner} has no id`);
      else if (!ID_RE.test(item.id)) errors.push(`${owner} id "${item.id}" must match ${ID_RE}`);
      if (item.basis === 'chart-transcribed') {
        errors.push(`${owner} ("${item.id || '?'}") must not present supplementary claims as chart-transcribed`);
      } else if (!BASES.has(item.basis)) {
        errors.push(`${owner} ("${item.id || '?'}") has unknown basis "${item.basis}"`);
      }
      if (!text(item.summary)) errors.push(`${owner} ("${item.id || '?'}") has no summary`);
      const nodes = list(item.externalNodes);
      const edges = list(item.edges);
      if (!nodes.length && !edges.length) {
        errors.push(`${owner} ("${item.id || '?'}") has no external node or edge`);
      }
      errors.push(...sourceRefErrors(sourceIds, `${owner} ("${item.id || '?'}")`, item.sources, nodes.length > 0 || edges.length > 0));
      if (!Array.isArray(item.externalNodes)) errors.push(`${owner} externalNodes must be an array`);
      if (!Array.isArray(item.edges)) errors.push(`${owner} edges must be an array`);
      nodes.forEach((node, nodeIndex) => {
        errors.push(...nodeShapeErrors(node, `${owner} external node[${nodeIndex}]`, true));
      });
      const edgeMap = new Map(allNodes.filter(isObject).map(node => [node.id, node]));
      edges.forEach((edge, edgeIndex) => {
        const edgeOwner = `${owner} edge[${edgeIndex}]`;
        errors.push(...edgeShapeErrors(edge, edgeOwner, edgeMap));
        if (!isObject(edge)) return;
        if (!nodeIds.has(edge.from)) errors.push(`${edgeOwner} ("${edge.id || '?'}") from endpoint "${edge.from}" is not declared`);
        if (!nodeIds.has(edge.to)) errors.push(`${edgeOwner} ("${edge.id || '?'}") to endpoint "${edge.to}" is not declared`);
      });
    });
    return errors;
  });

  check('conditions are plain-English groups attached to exactly one existing edge', () => {
    const errors = [];
    if (!Array.isArray(p.conditions)) return ['conditions must be an array'];
    p.conditions.forEach((condition, index) => {
      const owner = `condition[${index}]`;
      if (!isObject(condition)) {
        errors.push(`${owner} must be an object`);
        return;
      }
      const id = text(condition.id) || '?';
      if (typeof condition.appliesTo !== 'string' || !condition.appliesTo.trim()) {
        errors.push(`${owner} ("${id}") appliesTo must name exactly one edge id (edge-local conditions only)`);
      } else if (!edgeIds.has(condition.appliesTo)) {
        errors.push(`${owner} ("${id}") applies to missing edge "${condition.appliesTo}"`);
      }
      if (!CONDITION_OPERATORS.has(condition.operator)) {
        errors.push(`${owner} ("${id}") has unknown operator "${condition.operator}"`);
      }
      if (!text(condition.summary)) errors.push(`${owner} ("${id}") has no plain-English summary`);
      if (!Array.isArray(condition.requirements) || condition.requirements.length === 0 ||
          condition.requirements.some(requirement => typeof requirement !== 'string' || !requirement.trim())) {
        errors.push(`${owner} ("${id}") has malformed requirements`);
      } else {
        if (condition.operator === 'SINGLE' && condition.requirements.length !== 1) {
          errors.push(`${owner} ("${id}") needs exactly one requirement for SINGLE`);
        }
        if ((condition.operator === 'AND' || condition.operator === 'OR') && condition.requirements.length < 2) {
          errors.push(`${owner} ("${id}") needs at least two requirements for ${condition.operator}`);
        }
      }
      errors.push(...sourceRefErrors(sourceIds, `${owner} ("${id}")`, condition.sources, true));
    });
    return errors;
  });

  check('coverage records scope, included and omitted boundaries', () => {
    const errors = [];
    const coverage = p.coverage;
    if (!isObject(coverage)) return ['coverage must be an object'];
    if (!COVERAGE_STATUSES.has(coverage.status)) {
      errors.push(`coverage.status must be one of ${[...COVERAGE_STATUSES].join(', ')}, found "${coverage.status}"`);
    }
    if (!text(coverage.scope)) errors.push('coverage.scope is required');
    for (const field of ['included', 'omitted']) {
      if (!Array.isArray(coverage[field])) {
        errors.push(`coverage.${field} must be an array`);
      } else {
        coverage[field].forEach((entry, index) => {
          if (typeof entry !== 'string' || !entry.trim()) {
            errors.push(`coverage.${field}[${index}] must be a non-empty string`);
          }
        });
      }
    }
    const included = list(coverage.included);
    const omitted = list(coverage.omitted);
    if (p.packetStatus !== 'draft' && included.length === 0) errors.push('a non-draft packet needs at least one included item');
    if (coverage.status !== 'not-added' && included.length === 0) {
      errors.push('a partial or checked coverage record needs at least one included item');
    }
    if (coverage.status === 'partial' || coverage.status === 'checked-against-chart') {
      if (omitted.length === 0) errors.push('a partial or checked coverage record needs at least one omitted item');
    }
    if (p.packetStatus === 'draft' && coverage.status === 'checked-against-chart') {
      errors.push('a draft packet must not claim checked-against-chart coverage');
    }
    errors.push(...sourceRefErrors(sourceIds, 'coverage', coverage.sources, p.packetStatus !== 'draft' || included.length > 0));
    return errors;
  });

  check('unknown and conflict records are complete, distinguishable and sourced', () => {
    const errors = [];
    errors.push(...evidenceRecordErrors(p.unknowns, 'unknown', 'unknown', sourceIds, nodeIds, edgeIds));
    errors.push(...evidenceRecordErrors(p.conflicts, 'conflict', 'conflict', sourceIds, nodeIds, edgeIds));
    return errors;
  });

  check('legacy ?edge=N claims are explicit and unique', () => {
    const errors = [];
    const claimed = allEdges.filter(isObject).filter(edge => edge.legacyEdgeIndex != null);
    if (claimed.length) {
      if (!isObject(p.legacy)) {
        errors.push('legacy metadata is required when any edge claims legacyEdgeIndex');
      } else {
        if (p.legacy.canonical !== '?edge=N') {
          errors.push(`legacy.canonical must stay "?edge=N" for packet version ${PACKET_VERSION}`);
        }
        if (!text(p.legacy.edgeIndexBase)) errors.push('legacy.edgeIndexBase is required');
        if (!text(p.legacy.note)) errors.push('legacy.note is required');
      }
    }
    const seen = new Set();
    for (const edge of claimed) {
      if (seen.has(edge.legacyEdgeIndex)) {
        errors.push(`legacyEdgeIndex ${edge.legacyEdgeIndex} is claimed by more than one edge`);
      }
      seen.add(edge.legacyEdgeIndex);
    }
    return errors;
  });

  check('independent review and merge gate stay separate from structural validation', () => {
    const errors = [];
    const review = p.review;
    if (!isObject(review)) return ['review must be an object'];
    const independent = review.independent;
    const merge = review.mergeGate;
    if (!isObject(independent)) {
      errors.push('review.independent must be an object');
    } else {
      if (typeof independent.required !== 'boolean') errors.push('review.independent.required must be a boolean');
      if (!REVIEW_STATES.has(independent.state)) {
        errors.push(`review.independent.state must be one of ${[...REVIEW_STATES].join(', ')}, found "${independent.state}"`);
      }
      if (!text(independent.scope)) errors.push('review.independent.scope is required');
      if (independent.state === 'approved') {
        if (!text(independent.reviewer)) errors.push('an approved review needs a named reviewer');
        if (!validDate(independent.date)) errors.push('an approved review needs a real YYYY-MM-DD date');
      }
      if (p.packetStatus === 'reviewed' && independent.state !== 'approved') {
        errors.push('packetStatus "reviewed" requires an approved independent review');
      }
      if (independent.state === 'approved' && p.packetStatus !== 'reviewed') {
        errors.push('an approved independent review requires packetStatus "reviewed"');
      }
      if (p.packetStatus === 'draft' && independent.state === 'approved') {
        errors.push('a draft packet must not claim an approved independent review');
      }
    }
    if (!isObject(merge)) {
      errors.push('review.mergeGate must be an object');
    } else {
      if (!MERGE_STATES.has(merge.state)) {
        errors.push(`review.mergeGate.state must be one of ${[...MERGE_STATES].join(', ')}, found "${merge.state}"`);
      }
      if (merge.state === 'blocked' && !text(merge.reason)) {
        errors.push('a blocked merge gate needs a reason');
      }
      const approved = isObject(independent) && independent.state === 'approved';
      if (merge.state === 'ready' && !approved) {
        errors.push('mergeGate cannot be ready before the independent review is approved');
      }
      if (merge.state === 'ready' && p.packetStatus !== 'reviewed') {
        errors.push('mergeGate cannot be ready unless packetStatus is "reviewed"');
      }
      if (merge.state === 'blocked' && approved) {
        errors.push('an approved independent review must set mergeGate to "ready"');
      }
      if (p.packetStatus === 'draft' && merge.state === 'ready') {
        errors.push('a draft packet must keep the merge gate blocked');
      }
    }
    return errors;
  });

  check('ATLAS reconciliation by IDs, labels, endpoints and ?edge=N indices', () => {
    const errors = [];
    if (!isObject(p.atlas)) return errors;
    if (!atlas) {
      errors.push('ATLAS reconciliation is declared but no ATLAS data was supplied to the validator');
      return errors;
    }
    const chapter = list(atlas.chapters).find(entry => entry && entry.id === p.atlas.chapterId);
    if (!chapter) {
      errors.push(`ATLAS chapter "${p.atlas.chapterId}" is missing`);
      return errors;
    }
    const atlasNodes = list(atlas.nodes).filter(node => node && node.chapter === p.atlas.chapterId);
    const atlasNodeById = new Map(list(atlas.nodes).filter(node => node && node.id).map(node => [node.id, node]));
    const atlasEdgeById = new Map(list(atlas.edges).filter(edge => edge && edge.id).map(edge => [edge.id, edge]));
    const actualNodeIds = atlasNodes.map(node => node.id);
    const packetChartNodeIds = chartNodes.filter(isObject).map(node => node.id);
    if (p.atlas.exactChapterNodes) {
      errors.push(...diffLists(packetChartNodeIds, actualNodeIds, 'chart node ID set'));
      if (sameJson(packetChartNodeIds.slice().sort(), actualNodeIds.slice().sort()) && !sameJson(packetChartNodeIds, actualNodeIds)) {
        errors.push('chart node order differs from the ATLAS chapter order');
      }
    }
    chartNodes.forEach((node, index) => {
      if (!isObject(node)) return;
      const actual = atlasNodeById.get(node.id);
      const owner = `chart node[${index}] ("${node.id || '?'}")`;
      if (!actual || actual.chapter !== p.atlas.chapterId) {
        errors.push(`${owner} is not an ATLAS node in chapter "${p.atlas.chapterId}"`);
        return;
      }
      if (actual.label !== node.label) errors.push(`${owner} label differs from ATLAS: "${actual.label}"`);
      if (actual.kind !== node.kind) errors.push(`${owner} kind differs from ATLAS: "${actual.kind}"`);
      if (!sameJson(actual.options || null, node.options || null)) errors.push(`${owner} options differ from ATLAS`);
    });
    const atlasInternalEdges = list(atlas.edges).filter(edge => {
      if (!edge || !atlasNodeById.has(edge.from) || !atlasNodeById.has(edge.to)) return false;
      return atlasNodeById.get(edge.from).chapter === p.atlas.chapterId &&
        atlasNodeById.get(edge.to).chapter === p.atlas.chapterId;
    });
    const actualEdgeIds = atlasInternalEdges.map(edge => edge.id);
    const packetChartEdgeIds = chartEdges.filter(isObject).map(edge => edge.id);
    if (p.atlas.exactChapterEdges) {
      errors.push(...diffLists(packetChartEdgeIds, actualEdgeIds, 'chart edge ID set'));
      if (sameJson(packetChartEdgeIds.slice().sort(), actualEdgeIds.slice().sort()) && !sameJson(packetChartEdgeIds, actualEdgeIds)) {
        errors.push('chart edge order differs from the ATLAS chapter order');
      }
    }
    chartEdges.forEach((edge, index) => {
      if (!isObject(edge)) return;
      const actual = atlasEdgeById.get(edge.id);
      const owner = `chart edge[${index}] ("${edge.id || '?'}")`;
      if (!actual) {
        errors.push(`${owner} is not an ATLAS edge`);
        return;
      }
      if (actual.from !== edge.from || actual.to !== edge.to) {
        errors.push(`${owner} endpoints differ from ATLAS: ${actual.from}->${actual.to}`);
      }
      if (actual.kind !== edge.kind) errors.push(`${owner} kind differs from ATLAS: "${actual.kind}"`);
      if ((actual.fromOption == null ? null : actual.fromOption) !== (edge.fromOption == null ? null : edge.fromOption)) {
        errors.push(`${owner} fromOption differs from ATLAS`);
      }
    });
    externalNodes.forEach((node, index) => {
      if (!isObject(node)) return;
      const actual = atlasNodeById.get(node.id);
      const owner = `supplementary external node[${index}] ("${node.id || '?'}")`;
      if (!actual) {
        errors.push(`${owner} is not an ATLAS node`);
        return;
      }
      if (actual.label !== node.label) errors.push(`${owner} label differs from ATLAS: "${actual.label}"`);
      if (actual.kind !== node.kind) errors.push(`${owner} kind differs from ATLAS: "${actual.kind}"`);
      if (node.chapter && actual.chapter !== node.chapter) {
        errors.push(`${owner} chapter differs from ATLAS: "${actual.chapter}"`);
      }
    });
    supplementaryEdges.forEach((edge, index) => {
      if (!isObject(edge)) return;
      const actual = atlasEdgeById.get(edge.id);
      const owner = `supplementary edge[${index}] ("${edge.id || '?'}")`;
      if (!actual) {
        errors.push(`${owner} is not an ATLAS edge`);
        return;
      }
      if (actual.from !== edge.from || actual.to !== edge.to) {
        errors.push(`${owner} endpoints differ from ATLAS: ${actual.from}->${actual.to}`);
      }
      if (actual.kind !== edge.kind) errors.push(`${owner} kind differs from ATLAS: "${actual.kind}"`);
      if ((actual.fromOption == null ? null : actual.fromOption) !== (edge.fromOption == null ? null : edge.fromOption)) {
        errors.push(`${owner} fromOption differs from ATLAS`);
      }
    });
    const atlasEdges = list(atlas.edges);
    allEdges.forEach((edge, index) => {
      if (!isObject(edge) || edge.legacyEdgeIndex == null) return;
      const actual = atlasEdges[edge.legacyEdgeIndex];
      const owner = `edge ("${edge.id || '?'}")`;
      if (!actual) {
        errors.push(`${owner} legacyEdgeIndex ${edge.legacyEdgeIndex} is outside the ATLAS edges array`);
        return;
      }
      if (actual.id !== edge.id) {
        errors.push(`${owner} legacyEdgeIndex ${edge.legacyEdgeIndex} points to ATLAS edge "${actual.id}", not "${edge.id}"`);
      }
    });
    return errors;
  });

  const allErrors = checks.reduce((out, item) => out.concat(item.errors), []);
  const warnings = [];
  if (!isObject(p.atlas)) {
    warnings.push('No ATLAS reconciliation is declared; this remains a preparation document until reconciled.');
  }
  if (p.packetStatus === 'draft') {
    warnings.push('Draft packet: structural validity does not make it review-ready or merge-ready.');
  }
  const independent = isObject(p.review) && isObject(p.review.independent) ? p.review.independent : {};
  const merge = isObject(p.review) && isObject(p.review.mergeGate) ? p.review.mergeGate : {};
  const reviewApproved = independent.state === 'approved';
  const reviewReady = allErrors.length === 0 &&
    p.packetStatus === 'reviewed' &&
    reviewApproved &&
    merge.state === 'ready' &&
    isObject(p.coverage) &&
    (p.coverage.status === 'partial' || p.coverage.status === 'checked-against-chart');

  return {
    checks,
    errors: allErrors,
    warnings,
    failed: allErrors.length > 0,
    ok: allErrors.length === 0,
    reviewReady,
    review: {
      state: independent.state || null,
      mergeGate: merge.state || null,
      approved: reviewApproved,
      packetStatus: p.packetStatus || null
    },
    counts: {
      sources: sources.length,
      chartNodes: chartNodes.length,
      chartEdges: chartEdges.length,
      supplementaryItems: supplementary.length,
      supplementaryNodes: externalNodes.length,
      supplementaryEdges: supplementaryEdges.length,
      conditions: list(p.conditions).length,
      unknowns: list(p.unknowns).length,
      conflicts: list(p.conflicts).length,
      legacyEdgeIndices: allEdges.filter(edge => isObject(edge) && edge.legacyEdgeIndex != null).length
    }
  };
}

function readPacket(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function usage() {
  return [
    'Usage:',
    '  node prototype/validate-chapter-packet.js <packet.json> [--atlas <atlas-data.js>] [--require-review] [--json]',
    '  node prototype/validate-chapter-packet.js --emit-template <chapter-id> [--title <title>] [--out <file>]',
    '',
    'Default validation is structural. --require-review exits 2 unless the independent',
    'review is approved and the merge gate is ready. It does not replace that review.'
  ].join('\n');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--require-review') args.requireReview = true;
    else if (value === '--json') args.json = true;
    else if (value === '--help' || value === '-h') args.help = true;
    else if (value === '--atlas') args.atlas = argv[++index];
    else if (value === '--emit-template') args.emitTemplate = argv[++index];
    else if (value === '--title') args.title = argv[++index];
    else if (value === '--out') args.out = argv[++index];
    else args._.push(value);
  }
  return args;
}

function printResult(file, packet, result) {
  console.log(`chapter packet: ${file}`);
  for (const item of result.checks) {
    if (item.errors.length) {
      console.log(`  FAIL  ${item.name}`);
      for (const error of item.errors) console.log(`        - ${error}`);
    } else {
      console.log(`  ok    ${item.name}`);
    }
  }
  for (const warning of result.warnings) console.log(`  note  ${warning}`);
  const counts = result.counts;
  console.log(`\nInventory: ${counts.chartNodes} chart nodes, ${counts.chartEdges} chart edges, ` +
    `${counts.supplementaryItems} supplementary item(s), ${counts.supplementaryEdges} supplementary edge(s), ` +
    `${counts.conditions} edge-local condition(s), ${counts.unknowns} unknown(s), ${counts.conflicts} conflict(s).`);
  console.log(`Legacy indices claimed: ${counts.legacyEdgeIndices}.`);
  console.log(`Independent review: ${result.review.state}; merge gate: ${result.review.mergeGate}; review-ready: ${result.reviewReady ? 'yes' : 'no'}.`);
  if (result.failed) {
    console.log('\nStructural validation failed. This is not a source or rights review.');
  } else {
    console.log('\nStructural validation passed. This does not establish source truth, independence, rights clearance, or gameplay verification.');
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return 0;
  }
  if (args.emitTemplate) {
    const packet = createDraftPacket(args.emitTemplate, args.title);
    const result = validatePacket(packet);
    if (result.failed) {
      console.error('Generated template failed its own structural validation:');
      for (const error of result.errors) console.error('  - ' + error);
      return 1;
    }
    const output = JSON.stringify(packet, null, 2) + '\n';
    if (args.out) {
      fs.writeFileSync(args.out, output);
      console.log(`Wrote draft chapter packet: ${args.out}`);
    } else {
      process.stdout.write(output);
    }
    return 0;
  }
  const file = args._[0];
  if (!file) {
    console.error(usage());
    return 1;
  }
  let packet;
  try {
    packet = readPacket(file);
  } catch (error) {
    console.error(`Cannot read packet "${file}": ${error.message}`);
    return 1;
  }
  let atlas = null;
  if (isObject(packet.atlas)) {
    const repoRoot = path.join(__dirname, '..');
    const atlasFile = args.atlas
      ? path.resolve(process.cwd(), args.atlas)
      : path.resolve(repoRoot, packet.atlas.source || '');
    try {
      atlas = readAtlasData(atlasFile);
    } catch (error) {
      console.error(`Cannot read ATLAS "${atlasFile}": ${error.message}`);
      return 1;
    }
  } else if (args.atlas) {
    try {
      atlas = readAtlasData(path.resolve(process.cwd(), args.atlas));
    } catch (error) {
      console.error(`Cannot read ATLAS "${args.atlas}": ${error.message}`);
      return 1;
    }
  }
  const result = validatePacket(packet, { atlas });
  if (args.json) {
    console.log(JSON.stringify({
      file,
      ok: result.ok,
      errors: result.errors,
      warnings: result.warnings,
      counts: result.counts,
      review: result.review,
      reviewReady: result.reviewReady
    }, null, 2));
  } else {
    printResult(file, packet, result);
  }
  if (result.failed) return 1;
  if (args.requireReview && !result.reviewReady) return 2;
  return 0;
}

module.exports = {
  PACKET_KIND,
  PACKET_VERSION,
  createDraftPacket,
  readPacket,
  validatePacket
};

if (require.main === module) {
  process.exitCode = main();
}
