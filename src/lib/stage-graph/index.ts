/**
 * Stage Graph — Types and Loader
 *
 * Defines the directed graph of construction stages per element type.
 * Observability is the key novel attribute: it marks whether a stage's
 * physical evidence remains visible after subsequent stages begin.
 *
 * This module is part of Track 2 (concealment-aware trajectory). It is
 * kept strictly separate from product code so it can be described,
 * tested, and claimed independently.
 *
 * PROPRIETARY — The stage-precedence graph structure and observability
 * model are the subject of patent preparation. Do not describe as novel
 * anything outside this Track 2 module.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Whether a stage node's evidence remains physically visible after next stage */
export type Observability =
  | "visible"           // evidence remains visible even after next stage
  | "concealed_by_next" // evidence is physically covered by the next stage
  | "permanently_concealed"; // no longer recoverable by any non-destructive means

export interface StageNode {
  id: string;
  label: string;
  shortLabel: string;
  observability: Observability;
  description: string;
  /** Stage ID that buries this one (null if never concealed) */
  concealedBy: string | null;
  /** Valid successor stage IDs in the precedence graph */
  validTransitions: string[];
}

export interface ElementTypeGraph {
  label: string;
  stages: StageNode[];
}

export interface StageGraphData {
  version: string;
  buildingType: string;
  description: string;
  elementTypes: Record<string, ElementTypeGraph>;
  projectLevelStages: {
    id: string;
    label: string;
    order: number;
    progressPct: number;
  }[];
}

// ─── Loader ───────────────────────────────────────────────────────────────────

import graphData from "./rcc-residential.json";

export const STAGE_GRAPH: StageGraphData = graphData as StageGraphData;

/** Get all stage nodes for a given element type */
export function getStagesForElement(elementType: string): StageNode[] {
  return STAGE_GRAPH.elementTypes[elementType]?.stages ?? [];
}

/** Look up a single stage node by ID (searches across all element types) */
export function getStageNode(stageId: string): StageNode | undefined {
  for (const elementType of Object.values(STAGE_GRAPH.elementTypes)) {
    const found = elementType.stages.find((s) => s.id === stageId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Returns all ancestor stage IDs for a given stage (stages that must
 * have occurred before this one, per the precedence graph).
 */
export function getAncestors(elementType: string, targetStageId: string): string[] {
  const stages = getStagesForElement(elementType);
  const ancestors: string[] = [];

  // Build reverse adjacency: for each node, who points to it?
  const reverseAdj: Record<string, string[]> = {};
  for (const stage of stages) {
    for (const next of stage.validTransitions) {
      if (!reverseAdj[next]) reverseAdj[next] = [];
      reverseAdj[next].push(stage.id);
    }
  }

  // BFS backward from target
  const queue = [targetStageId];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const parents = reverseAdj[current] ?? [];
    for (const parent of parents) {
      ancestors.push(parent);
      queue.push(parent);
    }
  }
  return ancestors;
}

/**
 * Returns the index/position of a stage within its element type's ordered list.
 * Returns -1 if not found.
 */
export function getStageIndex(elementType: string, stageId: string): number {
  const stages = getStagesForElement(elementType);
  return stages.findIndex((s) => s.id === stageId);
}

/**
 * Validates that a stage transition is permitted by the graph.
 * Returns true if fromStageId → toStageId is a valid edge.
 */
export function isValidTransition(
  elementType: string,
  fromStageId: string,
  toStageId: string
): boolean {
  const stages = getStagesForElement(elementType);
  const fromNode = stages.find((s) => s.id === fromStageId);
  return fromNode?.validTransitions.includes(toStageId) ?? false;
}

/** Returns true if the given stage is concealed (not directly observable) */
export function isConcealed(stageId: string): boolean {
  const node = getStageNode(stageId);
  return (
    node?.observability === "concealed_by_next" ||
    node?.observability === "permanently_concealed"
  );
}
