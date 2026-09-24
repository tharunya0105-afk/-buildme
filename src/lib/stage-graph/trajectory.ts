/**
 * Trajectory Fitting Module — Viterbi-style Stage Decoder
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  TRACK 2 — CONCEALMENT-AWARE STAGE TRAJECTORY                          ║
 * ║  This module is the patentable core mechanism.                          ║
 * ║  It is isolated here to remain independently testable and describable.  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Given a time-ordered sequence of noisy per-photo stage probability
 * distributions for one structural element, this module fits a
 * maximum-likelihood path through the stage-precedence graph, respecting:
 *   1. Valid stage transitions (no skipping, no regression)
 *   2. Monotonic progression (stages do not regress)
 *   3. Observability constraints (concealed stages are inferred, not observed)
 *
 * Output per stage: "observed" | "inferred_concealed" | "unsupported"
 *
 * HOW IT DIFFERS FROM A PLAIN CLASSIFIER:
 *   A per-image classifier independently labels each photo — it has no
 *   memory of prior photos and no graph constraints. This decoder:
 *   - Maintains temporal coherence across the observation sequence
 *   - Enforces that the fitted path is valid in the stage graph
 *   - Labels stages that were skipped in observations as "inferred_concealed"
 *     when the graph says they must have occurred (e.g., rebar before concrete)
 *   - Abstains rather than silently emitting when confidence is insufficient
 *
 * ALGORITHM:
 *   Standard Viterbi on the stage-precedence DAG.
 *   Emission probability: P(observation | stage) = classifier probability[stage]
 *   Transition probability: uniform across valid transitions; 0 for invalid ones
 *   Additional log-prior penalty applied when a stage is skipped
 *   (to prefer minimal jumps).
 */

import {
  getStagesForElement,
  getStageNode,
  isConcealed,
  type StageNode,
} from "./index";

// ─── Public Types ─────────────────────────────────────────────────────────────

/**
 * A single observation: for one photo at one point in time,
 * the classifier outputs a probability over all possible stages.
 */
export interface StageObservation {
  /** ISO timestamp of the photo */
  timestamp: string;
  /** Photo ID (for traceability to source evidence) */
  photoId: string;
  /**
   * Classifier output: a probability distribution over stage IDs.
   * Keys are stage IDs (e.g. "column_rebar"), values are probabilities [0,1].
   * Does NOT need to be a complete distribution over all stages — missing stages
   * are treated as probability 0.
   */
  stageProbabilities: Record<string, number>;
  /**
   * Optional: raw classifier confidence (independent of stage labels).
   * Used to weight this observation's contribution to the path.
   */
  overallConfidence?: number;
}

/** How a stage was determined */
export type StageStatus =
  | "observed"            // directly seen in ≥1 photo with sufficient confidence
  | "inferred_concealed"  // graph forces this stage to have occurred, but it was not visible
  | "unsupported";        // not enough evidence to determine status

/** The result for a single stage node in the fitted trajectory */
export interface TrajectoryStageResult {
  stageId: string;
  stageLabel: string;
  status: StageStatus;
  /**
   * Observability from the graph — separate from status:
   * status reflects evidence; observability reflects physical possibility.
   */
  observability: "visible" | "concealed_by_next" | "permanently_concealed";
  /**
   * Highest emission probability seen for this stage across all observations.
   * null for inferred_concealed stages.
   */
  maxObservedProbability: number | null;
  /** Photo IDs that contributed evidence for this stage */
  supportingPhotoIds: string[];
  /** When this stage was first observed (ISO string), null if inferred */
  firstObservedAt: string | null;
}

/** Full trajectory result for one structural element */
export interface TrajectoryResult {
  elementType: string;
  elementId: string;
  /** Ordered list of stages in the fitted path (only stages ON the path) */
  fittedPath: TrajectoryStageResult[];
  /**
   * The last stage in the fitted path — the current inferred construction state.
   * null if no path could be fitted (abstention).
   */
  currentStage: TrajectoryStageResult | null;
  /**
   * Overall trajectory confidence [0,1].
   * Low confidence triggers abstention.
   */
  trajectoryConfidence: number;
  /**
   * Whether the decoder abstained from emitting a result.
   * True when: multiple-pass disagreement, confidence below threshold,
   * or regression detected.
   */
  abstained: boolean;
  /** Reason for abstention, if abstained */
  abstentionReason?: string;
  /** Viterbi log-likelihood of the fitted path */
  pathLogLikelihood: number;
  /** Total number of observations processed */
  observationCount: number;
  /** Timestamp of most recent observation */
  latestObservationAt: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface TrajectoryConfig {
  /**
   * Minimum probability threshold for a stage to count as "observed".
   * Below this, a stage can still be "inferred_concealed" from the graph,
   * but will not be marked as directly observed.
   */
  observedThreshold: number; // default: 0.35
  /**
   * Abstention threshold: if trajectoryConfidence < this, do not emit status.
   */
  abstentionThreshold: number; // default: 0.15
  /**
   * Log penalty applied when a stage transition skips more than 1 node.
   * Discourages the decoder from jumping far ahead.
   */
  skipPenaltyPerNode: number; // default: 1.5 (in nats)
  /**
   * Enable/disable observability-awareness.
   * When false: inferred_concealed labels are not emitted; behaves like baseline.
   * ABLATION SWITCH — set to false to run baseline comparison.
   */
  observabilityAware: boolean;
  /**
   * Enable/disable graph constraint enforcement.
   * When false: any stage-to-stage transition is allowed; behaves like unconstrained.
   * ABLATION SWITCH.
   */
  graphConstrained: boolean;
}

export const DEFAULT_TRAJECTORY_CONFIG: TrajectoryConfig = {
  observedThreshold: 0.35,
  abstentionThreshold: 0.15,
  skipPenaltyPerNode: 1.5,
  observabilityAware: true,
  graphConstrained: true,
};

// ─── Internal ─────────────────────────────────────────────────────────────────

const LOG_ZERO = -Infinity;
const SMOOTH_EPSILON = 1e-9; // Laplace smoothing for zero-probability emissions

function logProb(p: number): number {
  return Math.log(Math.max(p, SMOOTH_EPSILON));
}

/**
 * Build an adjacency list from the stage array for this element type.
 * Index i -> list of indices j such that stages[i] -> stages[j] is valid.
 */
function buildAdjacency(stages: StageNode[]): number[][] {
  const adj: number[][] = stages.map(() => []);
  const idxById: Record<string, number> = {};
  stages.forEach((s, i) => (idxById[s.id] = i));

  for (let i = 0; i < stages.length; i++) {
    for (const nextId of stages[i].validTransitions) {
      const j = idxById[nextId];
      if (j !== undefined) adj[i].push(j);
    }
  }
  return adj;
}

/**
 * Topological sort of stage DAG (Kahn's algorithm).
 * Returns indices in topological order.
 */
function topoSort(stages: StageNode[], adj: number[][]): number[] {
  const inDegree = new Array<number>(stages.length).fill(0);
  for (const successors of adj) {
    for (const j of successors) inDegree[j]++;
  }
  const queue: number[] = [];
  for (let i = 0; i < stages.length; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }
  const order: number[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    for (const j of adj[node]) {
      inDegree[j]--;
      if (inDegree[j] === 0) queue.push(j);
    }
  }
  return order;
}

// ─── Core Viterbi Decoder ─────────────────────────────────────────────────────

/**
 * Fit a maximum-likelihood stage trajectory through the precedence graph.
 *
 * The Viterbi algorithm here operates on the DAG of stages (not a sequence
 * of time steps in the traditional sense). We fold the time dimension by
 * computing, for each stage, the maximum emission evidence seen for it
 * across all observations, then decode the best monotonic path.
 *
 * This is equivalent to: for each observation t, what is the most probable
 * stage? Collect these votes. Then find the highest-likelihood valid path
 * through the graph consistent with those votes in temporal order.
 */
export function fitTrajectory(
  elementType: string,
  elementId: string,
  observations: StageObservation[],
  config: TrajectoryConfig = DEFAULT_TRAJECTORY_CONFIG
): TrajectoryResult {
  const stages = getStagesForElement(elementType);

  // Early return if no stages defined for this element type
  if (stages.length === 0) {
    return makeAbstentionResult(elementType, elementId, observations, "Unknown element type — no stage graph defined");
  }

  // Sort observations chronologically
  const sortedObs = [...observations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (sortedObs.length === 0) {
    return makeAbstentionResult(elementType, elementId, observations, "No observations provided");
  }

  const adj = buildAdjacency(stages);
  const topoOrder = topoSort(stages, adj);
  const N = stages.length;

  // ── Step 1: Aggregate emissions per stage across all observations ──────────
  // maxEmission[i] = highest probability ever assigned to stage i across all photos
  const maxEmission = new Array<number>(N).fill(0);
  const supportingPhotos: string[][] = stages.map(() => []);
  const firstSeenAt: (string | null)[] = stages.map(() => null);

  for (const obs of sortedObs) {
    for (let i = 0; i < N; i++) {
      const stageId = stages[i].id;
      const p = obs.stageProbabilities[stageId] ?? 0;
      if (p > maxEmission[i]) maxEmission[i] = p;
      if (p >= config.observedThreshold) {
        supportingPhotos[i].push(obs.photoId);
        if (!firstSeenAt[i]) firstSeenAt[i] = obs.timestamp;
      }
    }
  }

  // ── Step 2: Viterbi over the DAG ──────────────────────────────────────────
  // dp[i] = max log-likelihood of any path ending at node i
  // backtrack[i] = previous node index on that best path
  const dp = new Array<number>(N).fill(LOG_ZERO);
  const backtrack = new Array<number>(N).fill(-1);

  // Initialise root nodes (in-degree = 0)
  const inDegree = new Array<number>(N).fill(0);
  for (const successors of adj) {
    for (const j of successors) inDegree[j]++;
  }
  for (let i = 0; i < N; i++) {
    if (inDegree[i] === 0) {
      dp[i] = logProb(maxEmission[i]);
    }
  }

  // Forward pass in topological order
  for (const i of topoOrder) {
    if (dp[i] === LOG_ZERO) continue;
    const successors = config.graphConstrained ? adj[i] : topoOrder.filter((j) => j > i);
    for (const j of successors) {
      // Skip penalty if not direct successor
      const stageDistance = j - i; // simple index distance (assumes topoOrder = linear order)
      const skipPenalty = stageDistance > 1 ? config.skipPenaltyPerNode * (stageDistance - 1) : 0;
      const candidate = dp[i] + logProb(maxEmission[j]) - skipPenalty;
      if (candidate > dp[j]) {
        dp[j] = candidate;
        backtrack[j] = i;
      }
    }
  }

  // ── Step 3: Find best terminal node ──────────────────────────────────────
  // Terminal = node with no successors, or node with highest dp value
  const terminalCandidates = topoOrder.filter(
    (i) => adj[i].length === 0 || dp[i] > LOG_ZERO
  );

  let bestTerminal = -1;
  let bestScore = LOG_ZERO;
  for (const i of terminalCandidates) {
    if (dp[i] > bestScore) {
      bestScore = dp[i];
      bestTerminal = i;
    }
  }

  // Abstain if no valid path found
  if (bestTerminal === -1 || bestScore === LOG_ZERO) {
    return makeAbstentionResult(elementType, elementId, observations, "No valid path through stage graph");
  }

  // ── Step 4: Reconstruct path via backtracking ──────────────────────────────
  const pathIndices: number[] = [];
  let current = bestTerminal;
  while (current !== -1) {
    pathIndices.unshift(current);
    current = backtrack[current];
  }

  // ── Step 5: Compute trajectory confidence ─────────────────────────────────
  const pathEmissions = pathIndices.map((i) => maxEmission[i]);
  const observedCount = pathEmissions.filter((p) => p >= config.observedThreshold).length;
  const rawConfidence = observedCount / pathIndices.length;

  // Weight by average observed confidence
  const avgObservedConfidence =
    pathEmissions.filter((p) => p >= config.observedThreshold).reduce((s, p) => s + p, 0) /
    Math.max(observedCount, 1);
  const trajectoryConfidence = rawConfidence * avgObservedConfidence;

  // ── Step 6: Abstain if confidence too low ──────────────────────────────────
  if (trajectoryConfidence < config.abstentionThreshold) {
    return makeAbstentionResult(
      elementType,
      elementId,
      observations,
      `Trajectory confidence ${trajectoryConfidence.toFixed(3)} below threshold ${config.abstentionThreshold}`
    );
  }

  // ── Step 7: Assign statuses ──────────────────────────────────────────────
  const fittedPath: TrajectoryStageResult[] = pathIndices.map((i) => {
    const stage = stages[i];
    const maxP = maxEmission[i];
    const isDirectlyObserved = maxP >= config.observedThreshold;
    const isGraphConcealed = isConcealed(stage.id);

    let status: StageStatus;
    if (isDirectlyObserved) {
      status = "observed";
    } else if (config.observabilityAware && isGraphConcealed) {
      // The graph tells us this stage must have occurred (it's on the fitted path),
      // but its physical evidence would be concealed by this point — so we infer it.
      status = "inferred_concealed";
    } else if (maxP > 0) {
      // Some evidence but below threshold
      status = "unsupported";
    } else {
      // No evidence at all — infer from path fit
      status = config.observabilityAware ? "inferred_concealed" : "unsupported";
    }

    return {
      stageId: stage.id,
      stageLabel: stage.label,
      status,
      observability: stage.observability,
      maxObservedProbability: maxP > 0 ? maxP : null,
      supportingPhotoIds: supportingPhotos[i],
      firstObservedAt: firstSeenAt[i],
    };
  });

  const lastStage = fittedPath[fittedPath.length - 1];

  return {
    elementType,
    elementId,
    fittedPath,
    currentStage: lastStage ?? null,
    trajectoryConfidence,
    abstained: false,
    pathLogLikelihood: bestScore,
    observationCount: sortedObs.length,
    latestObservationAt: sortedObs[sortedObs.length - 1]?.timestamp ?? null,
  };
}

// ─── Abstention ───────────────────────────────────────────────────────────────

function makeAbstentionResult(
  elementType: string,
  elementId: string,
  observations: StageObservation[],
  reason: string
): TrajectoryResult {
  return {
    elementType,
    elementId,
    fittedPath: [],
    currentStage: null,
    trajectoryConfidence: 0,
    abstained: true,
    abstentionReason: reason,
    pathLogLikelihood: LOG_ZERO,
    observationCount: observations.length,
    latestObservationAt: observations.length > 0
      ? [...observations].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0].timestamp
      : null,
  };
}

// ─── Dual-Pass Abstention ─────────────────────────────────────────────────────

/**
 * Run the trajectory fitter twice (two independent passes on the same data
 * with different random seeds / config perturbations) and check if results agree.
 *
 * If the two passes disagree on the current stage by more than `stageDistanceThreshold`
 * positions in the stage list, return abstention instead of a result.
 *
 * This is the mechanism described in Section 2.4 of the patent spec draft.
 */
export function fitTrajectoryWithDualPassCheck(
  elementType: string,
  elementId: string,
  observations: StageObservation[],
  config: TrajectoryConfig = DEFAULT_TRAJECTORY_CONFIG,
  stageDistanceThreshold = 2
): { result: TrajectoryResult; dualPassAgreed: boolean } {
  const stages = getStagesForElement(elementType);

  // Pass A: standard
  const resultA = fitTrajectory(elementType, elementId, observations, config);

  // Pass B: slightly perturbed config (higher observed threshold) to simulate
  // a second independent model run. In production, Pass B would use a different
  // classifier checkpoint or a different feature set.
  const configB: TrajectoryConfig = {
    ...config,
    observedThreshold: config.observedThreshold * 1.1, // slightly stricter
    skipPenaltyPerNode: config.skipPenaltyPerNode * 0.9,
  };
  const resultB = fitTrajectory(elementType, elementId, observations, configB);

  // Both abstained — return abstention
  if (resultA.abstained && resultB.abstained) {
    return {
      result: makeAbstentionResult(
        elementType,
        elementId,
        observations,
        "Both passes abstained"
      ),
      dualPassAgreed: false,
    };
  }

  // One abstained — use the non-abstaining result but flag low agreement
  if (resultA.abstained || resultB.abstained) {
    const result = resultA.abstained ? resultB : resultA;
    return { result, dualPassAgreed: false };
  }

  // Both produced results — check agreement on current stage
  const currentA = resultA.currentStage?.stageId;
  const currentB = resultB.currentStage?.stageId;

  if (!currentA || !currentB) {
    return { result: resultA, dualPassAgreed: false };
  }

  if (currentA === currentB) {
    return { result: resultA, dualPassAgreed: true };
  }

  // Check stage distance
  const idxA = stages.findIndex((s) => s.id === currentA);
  const idxB = stages.findIndex((s) => s.id === currentB);
  const distance = Math.abs(idxA - idxB);

  if (distance > stageDistanceThreshold) {
    // Abstain: passes too far apart
    return {
      result: makeAbstentionResult(
        elementType,
        elementId,
        observations,
        `Dual-pass disagreement: Pass A → ${currentA}, Pass B → ${currentB} (distance ${distance})`
      ),
      dualPassAgreed: false,
    };
  }

  // Passes disagree but within tolerance — return the higher-confidence result
  const result =
    resultA.trajectoryConfidence >= resultB.trajectoryConfidence ? resultA : resultB;
  return { result, dualPassAgreed: false };
}
