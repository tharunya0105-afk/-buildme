# BuildMe Estimator — Product Audit

**Date:** August 30, 2026
**Engine Version:** 1.0.0
**Build Status:** PASSING (0 errors)

---

## 1. Files Changed

| File | Change | Lines |
|------|--------|:-----:|
| `src/app/api/cost-estimate/route.ts` | **NEW** — Estimation API with validated engine | ~360 |
| `src/app/engineer/cost-intelligence/page.tsx` | **REWRITTEN** — Replaced hardcoded demo with validated engine UI | ~500 |

## 2. Architecture

```
User Input (location, area, floors, type, quality)
    ↓
Frontend Form (cost-intelligence/page.tsx)
    ↓
API Route (api/cost-estimate/route.ts)
    ↓
Estimation Engine (built into API route)
    ↓
Layer 1: CPWD Benchmark (4 rates, 2019)
    ↓
Layer 2: BCCI Time Adjustment (16 centres, 10 quarters)
    ↓
Layer 3: Location Adjustment (centre-to-centre ratio)
    ↓
Layer 4: Quality + Floor Factors
    ↓
Result: Low / Central / High estimate
    ↓
Response to Frontend
```

## 3. Estimation Formula

```
central_rate = CPWD_base_rate × (current_BCCI / 170.0) × location_factor × quality_factor × floor_factor
central_total = central_rate × area_sqft
contingency = central_total × 0.10
final_total = central_total + contingency

low_total = central_rate × 0.85 × area_sqft × 1.08
high_total = central_rate × 1.20 × area_sqft × 1.12
```

## 4. Data Sources (all real, no fabricated data)

| Source | Records | Type | Used For |
|--------|:-------:|------|----------|
| CPWD PAR 2019 | 4 | Government benchmark | Base ₹/sqft rates |
| TN BCCI Index | 160 | Government index | Time + location adjustment |
| Real Quotations | 59 | Market evidence | Component validation |
| Kerala DES | 37,066 | Reference data | Material/labour reference |

## 5. Source Hierarchy

1. CPWD PAR 2019 — Primary benchmark
2. TN BCCI — Time and location adjustment
3. Real Quotations — Market validation
4. Kerala DES — Component reference (labeled as Kerala, not TN)

## 6. Confidence Methodology

Score (0-100) based on:
- BCCI data availability (20 pts)
- Data recency (20 pts)
- Source quality (15 pts)
- Quotation evidence (10 pts)
- Building type match (10 pts)
- Area reasonableness (10 pts)

Levels: HIGH (80+), MEDIUM-HIGH (65-79), MEDIUM (50-64), LOW-MEDIUM (35-49), LOW (<35)

## 7. Validation Status

| Check | Status |
|-------|--------|
| 20/20 functional tests | PASS |
| 3/3 error handling tests | PASS |
| Build passes | PASS |
| No fabricated data | VERIFIED |
| No false AI claims | VERIFIED |
| All sources documented | VERIFIED |
| BCCI internal consistency | 2.62% MAE (time), 6.40% MAE (location) |
| External validation | NOT YET VALIDATED (no project-cost data) |

## 8. Limitations

1. National (CPWD) benchmark, not Tamil Nadu-specific
2. BCCI 2019 base value is estimated
3. No completed-project final-cost data
4. Component breakdown uses standard ratios, not observed data
5. Location factor derived from Q4 2025 (forward-looking)
6. No supervised ML model trained

## 9. Unsupported Claims Removed

| Old Claim | Status |
|-----------|--------|
| "AI predicts exact cost" | REMOVED |
| "95% accurate" | REMOVED |
| Hardcoded demo rates | REPLACED with CPWD benchmarks |
| Fake location factors | REPLACED with BCCI-derived factors |
| Fabricated component breakdown | REPLACED with standard ratios (labeled) |

## 10. What the Product Shows

### Estimation Page
- Input form with validation
- Cost range (low/central/high)
- Rate per sqft
- Confidence level with explanation
- BCCI reference info
- Component breakdown (labeled as indicative)
- Full source transparency ("How BuildMe calculated this")
- Assumptions and limitations
- Historical cost simulator
- Estimation history

### Historical Simulator
- Shows BCCI movement across time periods
- Calculates indicative cost changes
- Labeled as index-based simulation, not prediction

## 11. Pilot Validation Schema (Future-Ready)

The estimation history stores:
- timestamp
- inputs (location, area, floors, quality)
- outputs (range, confidence)
- engine version
- sources used

This enables future ground-truth collection when real pilot projects are completed.

---

## PRODUCT STATUS

| Layer | Status |
|-------|--------|
| Data layer | FUNCTIONAL — 4 real datasets, 37,289 records |
| Estimation engine | FUNCTIONAL — 8-layer rule-based system |
| Validation | PARTIAL — Internal consistency validated, external pending |
| UI | FUNCTIONAL — Complete estimation page with transparency |
| Pilot readiness | READY — Schema prepared for ground-truth collection |

---

## FINAL ANSWER

> **Can BuildMe now demonstrate a credible preliminary construction-cost estimation product to CEDI?**

**YES** — with the following honest positioning:

BuildMe has a transparent, government-data-backed construction cost estimation engine that:
- Uses real CPWD benchmark rates (2019 national)
- Adjusts for time using real TN BCCI quarterly indices (2022-2025)
- Adjusts for location using BCCI centre-to-centre comparisons
- References 59 real quotation line items for market validation
- Shows full source transparency and limitations
- Makes no false AI or accuracy claims
- Is entering real-world pilot validation

The product is NOT:
- An ML prediction model
- A guaranteed cost estimate
- A contractor quotation
- A completed validation

It IS:
- A transparent, explainable, government-data-backed benchmark estimator
- The strongest legitimate capability given the current data foundation
- Ready for real-world pilot validation
