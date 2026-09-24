# BuildMe — Founder Story

**For CEDI EiR Cohort 3 Application**

---

## Why Construction?

My father is a practicing civil engineer. Growing up, I watched him prepare construction estimates using spreadsheets, government schedules, and experience-based adjustments. I saw how much time he spent gathering rates, adjusting for location, and comparing contractor quotations.

I also saw the consequences when estimates were wrong: budget overruns, client disputes, and projects that exceeded their original scope. Not because engineers were incompetent, but because the tools they had were insufficient.

---

## What Problem Did I Observe?

Construction cost estimation in India is fragmented across multiple unreliable sources:

1. **Government benchmarks** (CPWD) are national averages, not local market prices
2. **Contractor quotations** vary 40-60% for similar scope
3. **Material prices** change quarterly but estimates are static
4. **Location differences** are significant but poorly documented
5. **Project tracking** is manual and error-prone

The result: engineers spend hours preparing estimates that may be inaccurate, and homeowners have no way to verify whether a quotation is reasonable.

---

## Why Existing Approaches Are Insufficient

**Excel spreadsheets** don't account for location-specific cost variation or temporal price changes.

**Government calculators** provide national benchmarks, not local market prices.

**Contractor quotations** are black boxes — you see the total but not the methodology.

**Existing construction software** focuses on project management, not cost intelligence.

None of these connect the dots between: benchmark → market evidence → project tracking → actual outcome → validation.

---

## Why I Built BuildMe

I wanted to answer a simple question:

> "Can a transparent, data-driven tool help engineers prepare better construction estimates and track projects more effectively?"

BuildMe is my attempt to answer that question honestly.

I'm not claiming BuildMe already provides accurate estimates. I'm claiming that the infrastructure to test that hypothesis now exists.

---

## What I Built Myself

- Cost estimation engine (CPWD + BCCI + quotation evidence)
- TN BCCI data integration (16 centres, quarterly, 2022-2025)
- Real quotation import and structuring (9 documents, 54 line items)
- Ground-truth tracking pipeline
- Validation analytics framework
- GPS/geofencing workforce verification
- Risk intelligence engine (rule-based)
- Evidence management system
- Export functionality (JSON/CSV)
- Authentication and authorization
- 77-page working prototype

All with 0 TypeScript errors and 79/79 E2E tests passing.

---

## What Evidence I've Collected

1. **Government data**: 160 TN BCCI records, 4 CPWD benchmarks
2. **Market evidence**: 9 real contractor quotations, 54 line items
3. **Supporting data**: 34,666 Kerala material prices, 2,400 labour wages
4. **Internal validation**: 20/20 estimator tests, 79/79 E2E tests
5. **Transparency**: Every estimate traces to a real source

---

## What I've Learned

1. **The problem is real** — Construction cost estimation is genuinely fragmented
2. **The data exists** — Government benchmarks and market quotations can be structured
3. **The methodology matters** — Transparent estimation is more valuable than black-box prediction
4. **Honesty is a competitive advantage** — Not claiming accuracy when you don't have evidence builds trust
5. **Pilots are essential** — The product must be used by someone other than its creator

---

## What Remains Unproven

1. **Estimator accuracy** — No completed projects to compare against
2. **Customer willingness to pay** — No validated pricing
3. **User adoption** — No real users yet
4. **Business model** — All hypotheses
5. **Scalability** — SQLite prototype, not production-grade

---

## Why CEDI?

CEDI can accelerate the critical next step: **real-world validation**.

BuildMe has the technical infrastructure to collect genuine construction project data. What it needs is:
1. Access to civil engineers willing to pilot
2. Mentorship on customer discovery and validation
3. Support for the transition from prototype to validated product

CEDI's network and mentorship can provide what I cannot build alone: evidence that BuildMe actually works for real engineers on real projects.

---

## The One Sentence

> "I built a transparent construction cost-estimation tool on real government data and market evidence, and I'm now ready to test it on real construction projects with CEDI's support."
