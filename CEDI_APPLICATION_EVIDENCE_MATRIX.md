# BuildMe — CEDI Application Evidence Matrix

**Date**: August 30, 2026
**Status**: Pre-Pilot, Prototype Complete

---

## Evidence Matrix

| CEDI Area | Evidence We Have | Evidence Missing | Strength | Next Action |
|-----------|-----------------|------------------|:--------:|-------------|
| **Problem** | Construction cost estimation is fragmented across benchmarks, quotations, changing prices, location differences. Real quotes from 9 contractors show 40-60% variance for similar scope. | Formal problem validation through customer interviews | 7/10 | Conduct 5 engineer interviews to validate pain severity |
| **Founder-problem fit** | Father is practicing civil engineer. Direct access to construction professionals. Built quotation dataset from real engineering practice. | No formal advisor relationship. No construction degree. | 8/10 | Leverage father's network for pilot recruitment |
| **Product** | 77-page working prototype. Estimation engine, tracking, evidence, validation, export. All DB-backed. | No real user testing. No usability feedback from engineers. | 7/10 | Get 1 engineer to actually use it on a project |
| **Technology** | Risk engine (rule-based), spatial intelligence (GPS+Haversine), estimation engine (CPWD+BCCI), evidence system, export, auth. 0 TS errors, 79/79 tests. | SQLite (not production). No real ML. No real AI. | 8/10 | Document architecture for evaluator |
| **Data** | 160 TN BCCI records. 4 CPWD benchmarks. 34,666 Kerala material prices. 2,400 labour wages. 12 real quotations. 54 line items. | No ground-truth completed projects. No Tamil Nadu material/labour prices. | 6/10 | Collect 3 more local quotations |
| **AI/ML** | Architecture exists. Risk engine v1 implemented. AI document intelligence pipeline coded. | No trained ML model. No AI API configured. No validation. | 4/10 | Honestly present as "architecture ready, awaiting data" |
| **Spatial** | GPS/geofencing. Haversine distance. Leaflet maps. BCCI centre data. Project health scoring. | No real GIS. No weather. No terrain. No flood data. | 6/10 | Present BCCI spatial data as evidence layer |
| **Market evidence** | 9 real contractor quotations structured from actual BOQs/estimates. | No market sizing. No competitive analysis with real data. | 5/10 | Use quotation variance as market problem evidence |
| **Customer validation** | 0 interviews. 0 surveys. 0 feedback. | Everything | 2/10 | Conduct 5 interviews this week |
| **Pilot** | Infrastructure complete. Tracking, expenses, evidence, validation. | 0 active pilots. 0 completed pilots. | 3/10 | Recruit 1 pilot this week |
| **Business model** | Hypotheses documented. Pricing experiments designed. | No validated pricing. No revenue. No customers. | 2/10 | Test pricing in interviews |
| **Scalability** | Next.js prototype. SQLite. Single server. | No load testing. No multi-tenant. No cloud deployment. | 3/10 | Document scaling plan for evaluator |
| **Defensibility** | Potential data moat from pilot → ground truth → ML. Transparent methodology. | No actual data moat yet. No network effects. | 4/10 | Explain the data flywheel concept |
| **Traction** | Working product. Real data. Honest documentation. | 0 users. 0 revenue. 0 pilots. 0 validated outcomes. | 3/10 | Execute one real pilot |
| **Team** | Solo founder. Technical execution demonstrated. Domain access through family. | No co-founder. No advisors. No team. | 5/10 | Identify 1-2 advisors |

---

## Overall Assessment

### Evidence Strength by Category

| Category | Score | Status |
|----------|:-----:|--------|
| Problem | 7/10 | REAL problem, needs formal validation |
| Founder-problem fit | 8/10 | Strong domain access |
| Product | 7/10 | Working, untested by real users |
| Technology | 8/10 | Serious architecture, prototype-grade |
| Data | 6/10 | Real government/market data, no ground truth |
| AI/ML | 4/10 | Architecture only |
| Spatial | 6/10 | Functional, limited scope |
| Market | 5/10 | Real quotations, no market sizing |
| Validation | 2/10 | Infrastructure exists, 0 observations |
| Traction | 3/10 | Product exists, no users |
| Business | 2/10 | Hypothesis only |
| Scalability | 3/10 | Prototype-grade |
| Defensibility | 4/10 | Potential, not actual |
| Team | 5/10 | Solo, technically capable |

### Weighted CEDI Score: 5.2/10

### Verdict: **SELECT WITH CONDITIONS**

BuildMe is a technically credible prototype with honest positioning. The founder understands the problem, has built substantial infrastructure, and knows exactly what hasn't been proven. The biggest gap is zero real-world usage. CEDI selection should be conditional on executing a real pilot within 30 days.

---

## What This Matrix Proves

1. The founder has done real work (not just ideas)
2. The data is real (not fabricated)
3. The product is functional (not a mockup)
4. The methodology is transparent (not black-box)
5. The limitations are documented (not hidden)

## What This Matrix Does NOT Prove

1. Anyone wants to use BuildMe
2. The estimator is accurate
3. The business model works
4. BuildMe is better than alternatives
5. ML would improve the product
