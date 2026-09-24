# BuildMe Ground-Truth Data Model

## Overview

BuildMe's ground-truth system collects real project outcome data to validate and improve its estimation methodology. The system is designed to be empty until genuine project data is recorded during real pilots.

## Extended Project Model

The existing `Project` model has been extended with ground-truth fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `trackingStatus` | String | `"planning"` | Project tracking lifecycle |
| `finalCostInr` | Float? | null | Actual final cost (only when completed) |
| `completionDate` | DateTime? | null | Actual completion date |
| `validationStatus` | String | `"unverified"` | How the final cost was verified |
| `validationNotes` | String? | null | Notes about verification |
| `methodologyVersion` | String? | null | Estimation methodology version used |

### Tracking Status Values

| Value | Meaning |
|-------|---------|
| `planning` | Project exists but not yet being tracked |
| `active` | Actively recording expenditure against estimate |
| `completed` | Construction finished, final cost recorded |
| `cancelled` | Project cancelled before completion |

### Validation Status Values

| Value | Meaning |
|-------|---------|
| `unverified` | No final cost recorded yet |
| `user_reported` | Engineer entered the final cost |
| `document_supported` | Final cost supported by documents/invoices |
| `independently_verified` | Verified by an independent party |

## Extended CostEstimate Model

The `CostEstimate` model has been extended with estimation provenance:

| Field | Type | Description |
|-------|------|-------------|
| `methodologyVersion` | String? | Engine version (e.g., "1.0") |
| `bcciCentre` | String? | BCCI centre used |
| `bcciValue` | Float? | BCCI value at time of estimate |
| `bcciDate` | String? | BCCI reference date |
| `locationMatch` | String? | "DIRECT", "PROXY", or "UNAVAILABLE" |
| `evidenceConfidence` | String? | "HIGH", "MEDIUM", or "LOW" |
| `evidenceConfidenceScore` | Int? | Score 0–100 |

## Existing BudgetEvent Model

The existing `BudgetEvent` model is used for expense recording:

| Field | Usage |
|-------|-------|
| `type` | Expense category (material_cost, labour_cost, etc.) |
| `category` | Construction phase (foundation, structure, etc.) |
| `amount` | Expense amount in INR |
| `source` | Who recorded it |
| `confidence` | Verification level |

## API Endpoints

### GET /api/projects/[id]/track
Returns project tracking status, budget metrics, and ground-truth data.

### POST /api/projects/[id]/track
Activates tracking for a project.

### PATCH /api/projects/[id]/track
Updates tracking status, final cost, or validation status.

### GET /api/projects/[id]/expenses
Lists all expenses for a project.

### POST /api/projects/[id]/expenses
Records a new expense.

### PATCH /api/projects/[id]/expenses
Updates an expense.

### DELETE /api/projects/[id]/expenses?expenseId=X
Deletes an expense.

### GET /api/ground-truth/export
Exports ground-truth dataset and validation analytics.

### GET /api/ground-truth/export?format=csv
Downloads ground-truth dataset as CSV.

## Privacy Design

- No personally identifying information is stored
- No home addresses beyond city/district
- No phone numbers in analytics
- No financial account information
- All records are isolated by engineer and project
- Export uses project_id, not personal identifiers
