# BuildMe — Pilot Data Collection Protocol

**Objective**: Collect structured data from one real construction project to validate BuildMe's estimation methodology.

---

## Data Collection Phases

### Phase 1: Project Onboarding

Collect from the engineer:

| Field | Required | Example |
|-------|:--------:|---------|
| Location/district | YES | Coimbatore |
| Built-up area (sqft) | YES | 1,800 |
| Number of floors | YES | 2 |
| Building type | YES | RCC framed |
| Quality level | YES | Standard |
| Project start date | YES | 2026-09-01 |
| Estimated completion | If available | 2027-03-01 |
| Site address | NO (privacy) | District/city only |

### Phase 2: BuildMe Estimate

Generate and record:

| Field | Required |
|-------|:--------:|
| BuildMe estimate (low) | YES |
| BuildMe estimate (central) | YES |
| BuildMe estimate (high) | YES |
| CPWD benchmark used | YES |
| BCCI centre | YES |
| BCCI index value | YES |
| BCCI date | YES |
| Location match type | YES |
| Evidence confidence | YES |
| Methodology version | YES |
| Estimate timestamp | YES |

### Phase 3: Market Evidence

Collect from the engineer:

| Field | Required | Notes |
|-------|:--------:|-------|
| Contractor quotation amount | YES | Total quoted |
| Quotation scope | YES | What's included |
| Quotation exclusions | YES | What's NOT included |
| Quotation date | YES | When quoted |
| BOQ if available | IF AVAILABLE | Line items |

### Phase 4: During Construction (Ongoing)

Record expenses as they occur:

| Category | Fields |
|----------|--------|
| Material | Amount, type, date, description |
| Labour | Amount, type, date, description |
| Professional fees | Amount, type, date, description |
| Approvals | Amount, type, date, description |
| Transportation | Amount, type, date, description |
| Equipment | Amount, type, date, description |
| Other | Amount, type, date, description |

### Phase 5: Completion

When project completes:

| Field | Required |
|-------|:--------:|
| Final construction cost | YES |
| Completion date | YES |
| Actual duration | YES |
| Supporting evidence | IF AVAILABLE |
| Validation status | YES |

---

## Evidence Classification

### Validation Status Levels

| Level | Status | What It Proves |
|:-----:|--------|----------------|
| 0 | UNVERIFIED | Project exists but outcome unknown |
| 1 | USER_REPORTED | Engineer reported final cost |
| 2 | DOCUMENT_SUPPORTED | Final cost backed by invoice/bill |
| 3 | INDEPENDENTLY_VERIFIED | Third-party confirmed final cost |

### What Counts as Ground Truth

A project becomes ground-truth eligible when:
1. It is marked COMPLETED
2. A final cost is recorded
3. The original BuildMe estimate exists
4. Methodology version is preserved
5. Validation status is assigned

### What Does NOT Count

- Quotation amounts (these are market evidence, not final cost)
- Incomplete projects
- Estimated (not actual) final costs
- QA/test data

---

## Data Quality Rules

1. No personal names in analytics
2. No exact addresses (district/city only)
3. No phone numbers
4. No financial account information
5. Project IDs should be pseudonymous
6. All records isolated by engineer + project

---

## Analysis Plan

When ≥3 completed projects exist, calculate:

- MAE (Mean Absolute Error)
- Median Absolute Error
- Bias (systematic over/under estimation)
- Range coverage (% of actuals within low-high range)
- Breakdown by location, building type, area range

**Do NOT calculate these metrics with <3 observations.**
