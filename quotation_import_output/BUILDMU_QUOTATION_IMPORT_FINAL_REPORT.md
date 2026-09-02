# BuildMe Quotation Import — Final Report

**Import ID**: IMPORT_20260830_193328
**Date**: 2026-08-30T19:33:28.609625
**Status**: COMPLETE

## Summary

| Metric | Value |
|--------|-------|
| Documents discovered | 33 |
| Documents imported | 0 |
| Duplicates removed | 0 |
| Review required | 8 |
| Line items extracted | 54 |
| Projects matched | 1 (evidence collection project) |
| Projects unmatched | 0 |
| Records treated as actual final cost | **0** |
| Records eligible for validation | **0** |

## Ground-Truth Protection

| Check | Status |
|-------|:------:|
| Quotation amounts stored as QUOTED | ✅ |
| actual_final_cost = NULL for all records | ✅ |
| validation_eligible = FALSE for all records | ✅ |
| No quotation data enters MAE/MAPE/bias | ✅ |
| Provenance preserved for every record | ✅ |

## Documents Imported

| Document | Type | Location | Amount | Line Items |
|----------|------|----------|:------:|:----------:|
| VINITHA Residence BOQ | BOQ | Chennai | ₹14,945,478 | 8 |
| SEKARAN Detailed Estimate | CONTRACTOR_ESTIMATE | Ramanathapuram | ₹1,300,000 | 12 |
| S. Chitra Licensed Surveyor Estimate | CONTRACTOR_ESTIMATE | Chennai | ₹1,620,000 | 8 |
| Dr. Radhakrishnan BOQ | BOQ | Chennai | ₹0 | 2 |
| Coimbatore Residential Estimate | CONTRACTOR_ESTIMATE | Coimbatore | ₹0 | 5 |
| Varghese Residence Detailed Estimate | CONTRACTOR_ESTIMATE | Kerala | ₹5,069,731 | 8 |
| Susamma Jose BOQ | BOQ | Kottayam | ₹8,521,225 | 8 |
| Harisankar Detailed Estimate | CONTRACTOR_ESTIMATE | Kottayam | ₹0 | 2 |
| Aswanth Krishna Detailed Estimate | CONTRACTOR_ESTIMATE | Kottayam | ₹0 | 1 |

## Quotation vs BuildMe Comparison

| Document | Quoted | BuildMe Central | Variance | Inside Range |
|----------|:------:|:---------------:|:--------:|:------------:|
| S. Chitra Licensed Surveyor Estimate | ₹1,620,000 | ₹2,806,130 | -42.3% | No |

**Note**: This compares BuildMe's preliminary estimate with a contractor quotation.
A quotation is not necessarily the project's eventual final cost.

## Output Files

| File | Content |
|------|---------|
| `BuildMe_Quotation_Evidence.csv` | Quotation records with provenance |
| `BuildMe_Quotation_Line_Items.csv` | All extracted line items |
| `BuildMe_Quotation_Comparison.csv` | BuildMe vs quotation comparison |
| `BuildMe_Quotation_Data_Quality.csv` | Data quality metrics |
| `BuildMe_Quotation_Import_Review.csv` | Records requiring review |

## Remaining Limitations

1. Quotation data is from PDFs — extraction may have errors
2. Not all quotations have area information
3. Not all quotations have dates
4. Kerala quotations cannot be directly compared with Tamil Nadu BuildMe estimates
5. BuildMe uses Coimbatore BCCI for all comparisons (location-specific comparison not available for all locations)
6. Line item categorization is based on stage/description heuristics, not manual review
