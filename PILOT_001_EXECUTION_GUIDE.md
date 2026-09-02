# BuildMe Pilot #001 — Execution Guide

**Pilot ID**: BUILDME-PILOT-001
**Status**: READY TO EXECUTE
**Date**: August 2026

---

## 1. Pilot Onboarding Workflow

### Step 1: Project Information Collection

Gather from the participating engineer:

| Field | Required | Notes |
|-------|:--------:|-------|
| Location (district/city) | Yes | District level only for privacy |
| Built-up area (sqft) | Yes | Approximate is acceptable |
| Number of floors | Yes | |
| Building type | Yes | residential_rcc or load_bearing |
| Construction stage | Yes | planning/foundation/structure/etc. |
| Quality specification | Yes | economy/standard/premium/luxury |

**Do NOT collect**: personal names, phone numbers, exact addresses, financial account information.

### Step 2: Create Project in BuildMe

1. Login as engineer
2. Navigate to Sites → Create New Project
3. Enter project information (use district-level location only)
4. Assign homeowner (use pilot participant role, not personal identity)

### Step 3: Generate BuildMe Estimate

1. Navigate to Cost Intelligence
2. Enter: location, area, floors, building type, quality
3. Click "Calculate Estimate"
4. Review: Low / Central / High estimates
5. Review: "How BuildMe calculated this" (source transparency)
6. Review: Evidence Confidence level
7. Click "Save to Project"

### Step 4: Activate Tracking

1. Navigate to Ground Truth
2. Select the pilot project
3. Click "Start Tracking This Project"
4. Verify status changes to "Active"

### Step 5: Record Baseline

Record the engineer's current process BEFORE BuildMe:

- How do they currently estimate costs?
- How long does estimation take?
- How do they communicate estimates to homeowners?
- What tools do they use?

---

## 2. Pilot Checklist

### Pre-Pilot

- [ ] Engineer informed about pilot purpose
- [ ] Engineer consent obtained (verbal is sufficient for pilot)
- [ ] Project information collected (district, area, floors, type, quality)
- [ ] BuildMe account created for engineer
- [ ] Project created in BuildMe
- [ ] BuildMe estimate generated
- [ ] Estimate saved to project
- [ ] Tracking activated
- [ ] Baseline process documented

### During Pilot

- [ ] Engineer uses BuildMe for estimate review with homeowner
- [ ] Expenses recorded as they occur (at least weekly)
- [ ] Any issues or questions logged
- [ ] Evidence documents attached where available

### Post-Completion

- [ ] Final project cost recorded
- [ ] Completion date recorded
- [ ] Validation status set (user_reported or document_supported)
- [ ] Evidence documents attached (invoice, final bill, etc.)
- [ ] Engineer feedback collected (5 questions)
- [ ] Pilot report completed

---

## 3. Pilot Evidence Package

### Evidence Types to Collect

| Type | When | Required? |
|------|------|:---------:|
| Quotation/BOQ | Before construction | If available |
| Expense receipts | During construction | Recommended |
| Progress photos | During construction | Optional |
| Final bill/invoice | After completion | Recommended |
| Completion certificate | After completion | If available |

### Evidence Attachment

For each evidence document:
1. Navigate to Ground Truth → Select project
2. Click "Add Evidence"
3. Select evidence type (quotation/invoice/final_bill/etc.)
4. Enter document name
5. Add description
6. Upload or reference document

### Privacy Rules

**DO include**: District/city, area, building type, cost ranges
**DO NOT include**: Personal names, phone numbers, exact addresses, bank details

---

## 4. Pilot Feedback Form

### 5-Question Feedback Form

Collect from the participating engineer after using BuildMe:

**Q1: Was the estimate understandable?**
- [ ] Yes, completely
- [ ] Mostly, with some questions
- [ ] Difficult to understand
- [ ] Not understandable

**Q2: Were the required inputs easy to provide?**
- [ ] Yes, very easy
- [ ] Somewhat easy
- [ ] Difficult
- [ ] Very difficult

**Q3: Was the estimate useful for planning?**
- [ ] Yes, very useful
- [ ] Somewhat useful
- [ ] Not very useful
- [ ] Not useful at all

**Q4: What was the biggest limitation?**
[Open text response]

**Q5: Would you use BuildMe again for another project?**
- [ ] Yes, definitely
- [ ] Yes, probably
- [ ] Maybe
- [ ] Probably not
- [ ] Definitely not

**Additional comments:**
[Open text response]

---

## 5. Pilot Success Criteria

### Product Usage (Must-Have)

| Criterion | Target | How to Measure |
|-----------|:------:|----------------|
| Project onboarded | ✓ | Project exists in BuildMe with pilot label |
| Estimate generated | ✓ | Cost Intelligence produced result |
| Estimate saved | ✓ | Estimate attached to project record |
| Tracking activated | ✓ | Project trackingStatus = "active" |
| ≥1 expense recorded | ✓ | At least one BudgetEvent exists |

### Usability (Should-Have)

| Criterion | Target | How to Measure |
|-----------|:------:|----------------|
| User understands estimate | ✓ | Feedback Q1 = "Yes" or "Mostly" |
| User can identify sources | ✓ | User views "How BuildMe calculated this" |
| User can record expenses | ✓ | ≥1 expense recorded by user |

### Evidence (Nice-to-Have)

| Criterion | Target | How to Measure |
|-----------|:------:|----------------|
| ≥1 evidence document | If available | ProjectEvidence record exists |
| Final cost recorded | When complete | finalCostInr is set |
| Validation status assigned | When complete | validationStatus ≠ "unverified" |

### What Success is NOT

- "Estimate was accurate" — Accuracy cannot be measured until the project is complete
- "User loved the product" — Feedback may be negative, and that's valuable
- "Saved time" — Time savings cannot be measured without baseline comparison

---

## 6. Pilot Timeline

| Day | Activity | Deliverable |
|:---:|----------|-------------|
| 1 | Onboard project | Project created, estimate generated, tracking active |
| 2 | Review estimate with engineer | Feedback on understandability |
| 3-7 | Observe usage | Activity log entries |
| 8-30 | Ongoing expense recording | Budget events logged |
| Completion | Record final cost | finalCostInr, completionDate set |
| +1 day | Collect engineer feedback | 5-question form completed |
| +3 days | Complete pilot report | PILOT_001_REPORT.md |

---

## 7. Data Categories

The pilot must clearly distinguish:

### QA DATA
- Synthetic/test records used to test software
- Prefixed with `QA_TEST_`
- Cleaned up after test runs
- NEVER appears in validation analytics

### PILOT DATA
- Real project usage from Pilot #001
- May be incomplete (project still in progress)
- Contributes to pilot evidence but NOT to external validation until complete

### GROUND-TRUTH DATA
- Completed projects with legitimate final-cost evidence
- Eligible for external validation
- The ultimate goal of the pilot

---

## 8. CEDI Language Guide

### If Project is ACTIVE (not yet complete):

> "BuildMe has begun pilot deployment on a genuine construction project in [district]. The project is currently being tracked, with [X] expenses recorded. Final-cost validation is not yet available."

### If Project is COMPLETED:

> "BuildMe's original estimate for a [area] sqft residential project in [district] has been compared with the documented final cost of [amount]. The estimate was [X]% [above/below] the actual cost. This represents an early real-world observation."

### NEVER Say:

- "BuildMe saved X%" (unless measured with baseline)
- "The estimate was X% accurate" (unless validated)
- "Pilot was successful" (unless criteria are met)
- "Engineers love BuildMe" (unless feedback supports it)

---

## 9. Pilot Report Template

See: `BUILDMU_PILOT_001_REPORT.md`

---

## 10. Post-Pilot Actions

After the pilot completes:

1. Record the estimate-vs-actual comparison
2. Analyze what worked and what didn't
3. Collect engineer feedback
4. Document problems discovered
5. List product changes required
6. Update methodology if needed
7. Prepare CEDI evidence summary
8. Plan Pilot #002 based on learnings
