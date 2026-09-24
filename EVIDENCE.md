# EVIDENCE.md — BuildMe Track 2 Evaluation Log

**Purpose**: This file is the running technical evidence log for the concealment-aware
stage-trajectory mechanism (Candidate A in the prior-art analysis). It is updated
automatically by the eval harness after each run and should be kept under version control.

**Audience**: Patent agent, technical due diligence reviewer.

> ⚠ **WARNING**: Every accuracy number in this document must come from an actual eval
> run against real or realistic (not synthetic-and-labeled-as-real) data.
> Do not manually edit accuracy figures. Empty sections are better than invented ones.
> The eval harness appends to this file automatically — see `eval/run-eval.ts`.

---

## What Is Being Claimed

**Candidate A**: A method for inferring and labeling the construction stage of structural
elements in residential buildings from time-series unstructured site photos, where:

1. A **stage-precedence directed graph** encodes valid transitions and **observability**
   (whether a stage's physical evidence remains visible after the next stage begins) for
   each structural element type in Indian RCC-frame residential construction.

2. A **Viterbi-style constrained path decoder** fits a maximum-likelihood stage trajectory
   through this graph given noisy per-photo classifier probability distributions, enforcing
   monotonic progression and valid transitions.

3. Output labels are **three-valued**: `observed` (direct photographic evidence), 
   `inferred_concealed` (graph forces this stage occurred but it is now physically covered),
   or `unsupported` (insufficient evidence).

4. An **abstention mechanism** routes to human review when independent decoder passes
   disagree past a configurable threshold — logging every abstention event for audit.

**What is NOT claimed** (conventional — see §1.3 of build prompt):
- Generic auth/CRUD/dashboards
- The GPT-4o API call itself (the classifier is a plug-in emission model)
- Regional cost lookup or estimation
- The homeowner read-only portal as a concept

---

## Architecture Overview

```
Photo upload → EXIF extraction → Photo storage
    ↓
Per-photo classifier (GPT-4o Vision stub → fine-tuned ViT future)
    → P(stage | image) per structural element
    ↓
StageRecord written to DB (with raw classifier output for reproducibility)
    ↓
Viterbi trajectory decoder (src/lib/stage-graph/trajectory.ts)
    → constrained by rcc-residential.json stage graph
    → dual-pass abstention check
    ↓
StructuralElement.currentStageStatus = "observed" | "inferred_concealed" | "unsupported"
    ↓
Stage Dashboard (engineer) + Plain-language view (homeowner)
    ↓
AbstentionEvent → Engineer review queue → Resolved label
```

**Key files**:
- `src/lib/stage-graph/rcc-residential.json` — versioned stage graph (the data model)
- `src/lib/stage-graph/index.ts` — graph loader and utilities
- `src/lib/stage-graph/trajectory.ts` — Viterbi decoder (the novel mechanism)
- `src/lib/stage-graph/classifier.ts` — emission model interface (GPT-4o stub)
- `src/app/api/trajectory/[elementId]/route.ts` — production API wire-in
- `eval/run-eval.ts` — eval harness
- `prisma/schema.prisma` — StructuralElement, StageRecord, AbstentionEvent models

---

## Stage Graph Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-09-24 | Initial RCC residential graph — footing, column, beam/slab, brickwork, plaster, flooring, electrical, plumbing, roofing, finishing |

---

## Ablation Switch Reference

All ablation flags are in `TrajectoryConfig` (see `src/lib/stage-graph/trajectory.ts`):

| Flag | Default | Effect when disabled |
|------|---------|----------------------|
| `observabilityAware` | `true` | `inferred_concealed` labels are not emitted; behaves like naive baseline |
| `graphConstrained` | `true` | Any stage-to-stage transition is allowed; graph structure ignored |
| `abstentionThreshold` | `0.15` | Set to 0 to disable abstention entirely |

---

## Eval Runs
### Eval Run: eval-1790265264943
- **Date**: 2026-09-24T15:54:24.943Z
- **Dataset**: v0.1-sample — 3 elements, 7 photos
- **Trajectory Accuracy**: 0.0% vs Baseline 0.0% (+0.0%)
- **Abstention Rate**: 0.0%
- **Report**: `eval/reports/report-eval-1790265264943.md`

### Eval Run: eval-1790265043208
- **Date**: 2026-09-24T15:50:43.208Z
- **Dataset**: v0.1-sample — 3 elements, 7 photos
- **Trajectory Accuracy**: 0.0% vs Baseline 0.0% (+0.0%)
- **Abstention Rate**: 0.0%
- **Report**: `eval/reports/report-eval-1790265043208.md`

### Eval Run: eval-1790264625957
- **Date**: 2026-09-24T15:43:45.957Z
- **Dataset**: v0.1-sample — 3 elements, 7 photos
- **Trajectory Accuracy**: 0.0% vs Baseline 0.0% (+0.0%)
- **Abstention Rate**: 0.0%
- **Report**: `eval/reports/report-eval-1790264625957.md`


*No eval runs yet. Add real labeled data to `eval/sample-dataset.json`, then run:*

```bash
npx tsx eval/run-eval.ts --dataset eval/sample-dataset.json --output eval/reports
```

*The harness will append a run entry here automatically.*

---

## Dataset Notes

| Dataset | Source | License Verified? | Notes |
|---------|--------|-------------------|-------|
| `eval/sample-dataset.json` | Synthetic (illustrative only) | N/A | For harness testing only — do NOT report these accuracy numbers |
| *(real dataset TBD)* | On-site photos from pilot projects | Pending | Must verify license before use; confirm with each pilot engineer |

**BCCI dataset** (referenced in prior notes): Verify license before any use.
The BCCI PDF reports in `../dataset/` are publicly available BCCI publications —
these are **cost reference data**, not image datasets. No image data from BCCI.

---

## Key Dates (for patent filing timeline)

| Event | Date | Evidence |
|-------|------|---------|
| Stage graph v1.0 designed and committed | 2026-09-24 | Git commit hash: TBD |
| Trajectory module first committed | 2026-09-24 | Git commit hash: TBD |
| Prisma schema with StructuralElement/StageRecord | 2026-09-24 | Git commit hash: TBD |
| First real eval run | TBD | See "Eval Runs" section above |
| First pilot project with labeled ground truth | TBD | — |

---

## Open Questions for Patent Agent

1. Is the stage-graph + Viterbi combination novel enough given prior work in BIM-based
   progress monitoring? (Note: this system explicitly does NOT require a BIM model.)
2. Does the three-valued output label (observed / inferred_concealed / unsupported) as a
   formal system constitute a patentable contribution?
3. Should the abstention mechanism be a dependent claim or an independent claim?
4. What is the prior art landscape for temporal construction stage estimation from
   unstructured photos specifically in emerging-market contexts (no BIM, no controlled
   site photography)?

---

*This file is maintained by the BuildMe engineering team. Last updated: 2026-09-24.*
*Do not edit accuracy figures manually. Run `npx tsx eval/run-eval.ts` to update.*
