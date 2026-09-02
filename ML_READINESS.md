# BuildMe ML Readiness Assessment

## Current Status: NOT READY FOR ML TRAINING

BuildMe is deliberately using a **benchmark-based estimation engine** instead of ML because the available data does not support supervised learning for construction cost prediction.

---

## Why No ML Yet

### Insufficient Ground Truth
- **Completed projects with final cost**: 0
- **Minimum required for meaningful ML**: 30+ (ideally 100+)
- **Current dataset cannot train a cost prediction model**

### Why This Is Correct
Building an ML model on insufficient data would produce:
- Overfitting to noise
- False confidence in predictions
- No ability to generalize
- Misleading accuracy claims

The benchmark engine (CPWD + BCCI + quotation evidence) provides **transparent, reproducible estimates** that are honest about their limitations. This is better than an unvalidated ML model.

---

## Current Data Foundation

### Available for ML Features
| Feature | Source | Status |
|---------|--------|:------:|
| Built-up area | User input | AVAILABLE |
| Floors | User input | AVAILABLE |
| Location/district | User input | AVAILABLE |
| Building type | User input | AVAILABLE |
| Quality level | User input | AVAILABLE |
| BCCI index | Government | AVAILABLE (16 centres) |
| CPWD benchmark | Government | AVAILABLE |
| Quotation evidence | Market | AVAILABLE (9 docs) |

### Missing for ML Training
| Missing | Required For |
|---------|-------------|
| Final construction cost | Target variable |
| Actual project duration | Duration prediction |
| Material quantities used | Material cost model |
| Labour hours | Labour cost model |
| Completion evidence | Ground truth |
| Multiple projects per location | Location model |

---

## ML Readiness Requirements

### Minimum Dataset for Cost Prediction
- **30+ completed residential projects** with:
  - Initial BuildMe estimate
  - Actual final cost
  - Location
  - Area, floors, building type
  - Quality level
  - Construction period
  - Methodology version

### Minimum Dataset for Cost-Overrun Prediction
- **50+ completed projects** with:
  - Initial estimate
  - Final cost
  - Expenditure timeline
  - Change requests
  - Site conditions
  - Weather/delay data

### Minimum Dataset for Material Price Forecasting
- **100+ monthly material price observations** per material
- Currently have: BCCI quarterly indices (not material-specific)

---

## Planned ML Roadmap

### Phase 1: Data Collection (Now)
- Pilot deployment with civil engineers
- Real project tracking through completion
- Ground-truth observation collection

### Phase 2: Baseline Model (30+ observations)
- Simple regression on area, location, floors, quality
- Compare against benchmark engine
- Establish baseline MAE/MAPE

### Phase 3: Feature Engineering (100+ observations)
- Material-specific features
- Labour market features
- Site condition features
- Temporal features

### Phase 4: Model Development (500+ observations)
- Gradient boosting or neural network
- Cross-validation
- Out-of-sample testing
- Model interpretability

### Phase 5: Production ML (1000+ observations)
- Continuous retraining
- Model monitoring
- A/B testing against benchmark engine
- Confidence calibration

---

## Key Principle

> **Benchmark engine first → Ground truth → ML later**

This is a strength, not a weakness. It means BuildMe is:
1. Honest about what it can and cannot predict
2. Collecting the right data for future ML
3. Not making false accuracy claims
4. Building a scientifically defensible system

---

## Current Estimate Methodology

BuildMe v1.0 uses:
1. **CPWD Plinth Area Rates 2019** (government benchmark)
2. **TN BCCI Construction Cost Index** (government index, 16 centres, 2022-2025)
3. **Location adjustment** (centre vs reference)
4. **Time adjustment** (quarterly index movement)
5. **Quality adjustment** (economy/standard/premium)
6. **Planning range** (evidence confidence-based bounds)

This is **rule-based**, not ML. It is transparent, reproducible, and honest about its limitations.
