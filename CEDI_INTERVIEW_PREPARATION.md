# BuildMe — CEDI Interview Preparation

**30 Hardest Questions with Answer Framework**

---

## PROBLEM QUESTIONS

### Q1: "Why is this actually a serious problem?"

**Short (15s)**: Construction cost estimation is fragmented across government benchmarks, contractor quotations, and changing prices. Engineers spend hours preparing estimates that may be inaccurate, and homeowners can't verify quotations.

**Strong (30s)**: I've observed my father, a practicing civil engineer, prepare estimates using spreadsheets and government schedules. The problem is threefold: (1) government benchmarks don't reflect local prices, (2) contractor quotations vary 40-60% for similar scope, and (3) material prices change quarterly but estimates are static. BuildMe connects these dots transparently.

**Evidence**: Show 9 real quotations with 40-60% variance. Show BCCI quarterly data showing price movement.

**Trap**: Don't say "everyone knows construction is expensive." Be specific about the estimation problem.

---

### Q2: "Why can't engineers just use Excel?"

**Short (15s)**: Excel doesn't account for location-specific cost variation or temporal price changes. It's a calculator, not an intelligence system.

**Strong (30s)**: Excel is excellent for calculations but doesn't connect to live government data (BCCI indices), doesn't adjust for location automatically, and doesn't track projects through completion. BuildMe combines benchmark data, market evidence, and project tracking in one transparent system.

**Evidence**: Show BuildMe's BCCI integration vs static Excel rates.

**Trap**: Don't disrespect Excel. Engineers love Excel. Position BuildMe as complementary.

---

### Q3: "What happens when two quotations differ significantly?"

**Short (15s)**: Currently, engineers rely on experience to judge which is more realistic. There's no systematic way to compare.

**Strong (30s)**: BuildMe provides a benchmark reference point. When two quotations differ, the engineer can compare both against BuildMe's estimate, see which components differ, and make an informed decision. The comparison isn't about accuracy — it's about having a transparent reference.

**Evidence**: Show quotation comparison page.

**Trap**: Don't claim BuildMe determines which quote is "correct."

---

## PRODUCT QUESTIONS

### Q4: "What exactly does BuildMe do?"

**Short (15s)**: BuildMe provides transparent construction cost estimates using government benchmarks and market evidence, and tracks projects through completion for validation.

**Strong (30s)**: BuildMe has three core capabilities: (1) estimation — combining CPWD benchmarks, BCCI indices, and market quotations into a transparent planning range, (2) tracking — recording expenses and evidence during construction, and (3) validation — comparing the original estimate with the actual final cost to measure performance.

**Evidence**: Walk through the CEDI Demo page.

**Trap**: Don't list every feature. Focus on the core value proposition.

---

### Q5: "How is this different from existing construction software?"

**Short (15s)**: Existing software focuses on project management. BuildMe focuses on cost intelligence — connecting benchmarks, market evidence, and actual outcomes.

**Strong (30s)**: Most construction software manages schedules, tasks, and documents. BuildMe specifically addresses cost estimation and validation — the part that causes the most disputes. No existing tool transparently connects government benchmarks with real market quotations and tracks estimate-to-actual performance.

**Evidence**: Show the estimation methodology and provenance system.

**Trap**: Don't say existing software is bad. Say they solve different problems.

---

## DATA QUESTIONS

### Q6: "Where did your data come from?"

**Short (15s)**: Government sources (CPWD, TN BCCI) and real contractor quotations from civil engineering practice.

**Strong (30s)**: BuildMe uses four data layers: (1) CPWD Plinth Area Rates 2019 — official government benchmark, (2) TN BCCI Construction Cost Index — 16 Tamil Nadu centres, quarterly data from 2022-2025, (3) 9 real contractor quotations structured from actual BOQs and estimates, and (4) Kerala government material and labour reference data.

**Evidence**: Show data inventory and provenance system.

**Trap**: Don't say "AI collected the data." It was manually structured from real documents.

---

### Q7: "Why are quotations useful if they aren't final costs?"

**Short (15s)**: Quotations are market evidence. They show what contractors actually charge, which is valuable for benchmarking even if they aren't the final cost.

**Strong (30s)**: A quotation tells you what a contractor offered at a specific time, location, and scope. Even though it's not the final cost, it's real market data that can be compared against government benchmarks. The 9 quotations in BuildMe show how market prices relate to official benchmarks — that relationship is valuable for estimation.

**Evidence**: Show quotation vs benchmark comparison.

**Trap**: Don't claim quotations prove accuracy. They prove market evidence.

---

### Q8: "How accurate is your estimator?"

**Short (15s)**: We don't know yet. We have 0 completed projects to compare against. This is honest.

**Strong (30s)**: BuildMe's estimator is transparent and reproducible, but it hasn't been validated against real project outcomes yet. We have 0 completed projects with final costs. We're deliberately not claiming accuracy because we don't have the evidence. The next step is to validate on real projects.

**Evidence**: Show the validation dashboard with 0 completed projects.

**Trap**: Don't say "very accurate" or cite internal tests as external validation.

---

## AI/ML QUESTIONS

### Q9: "Where exactly is the AI?"

**Short (15s)**: BuildMe's intelligence is currently rule-based, not AI. The AI architecture exists but isn't configured yet.

**Strong (30s)**: BuildMe's current intelligence comes from a transparent rule-based system: CPWD benchmark + BCCI adjustment + location evidence. An AI document extraction pipeline is coded but requires an API key we don't have yet. We're not claiming AI capabilities we don't have.

**Evidence**: Show the AI Intelligence page with "NOT CONFIGURED" status.

**Trap**: Don't say "AI-assisted" if AI isn't actually running.

---

### Q10: "Why haven't you trained an ML model?"

**Short (15s)**: We need 30+ completed projects with final costs before ML training makes sense. We have 0.

**Strong (30s)**: Training ML on insufficient data produces overfitting and false confidence. BuildMe is deliberately collecting genuine ground-truth data first. The benchmark engine provides transparent, reproducible estimates while we accumulate the observations needed for meaningful ML. This is a strength — we're building a scientifically defensible system.

**Evidence**: Show the ML Readiness document.

**Trap**: Don't say "ML is planned for later" without explaining why.

---

## SPATIAL QUESTIONS

### Q11: "What does spatial intelligence actually add?"

**Short (15s)**: Location significantly affects construction costs. BuildMe uses BCCI centre data to adjust estimates for location.

**Strong (30s)**: Construction costs vary by location due to material availability, labour markets, and transportation. BuildMe's spatial layer uses 16 TN BCCI centres with quarterly data to provide location-specific adjustments. The GPS/geofencing system verifies workforce location for project tracking.

**Evidence**: Show BCCI centre comparison and GPS verification.

**Trap**: Don't claim BuildMe has real GIS or terrain analysis.

---

## VALIDATION QUESTIONS

### Q12: "How many real projects have validated you?"

**Short (15s)**: Zero. We have 0 completed projects with final costs. This is honest.

**Strong (30s)**: BuildMe has 0 completed projects for validation. We have 12 real quotations structured as market evidence, but quotations are not final costs. We're currently recruiting our first pilot. We're not claiming validation we don't have.

**Evidence**: Show the validation dashboard with honest empty states.

**Trap**: Don't cite quotation comparison as validation.

---

### Q13: "How many users do you have?"

**Short (15s)**: Zero. The product exists but hasn't been used by anyone other than me.

**Strong (30s)**: BuildMe has 0 real users. It's a working prototype ready for pilot deployment. We're currently recruiting civil engineers for the first pilot. The product is technically ready — what's needed is real-world testing.

**Evidence**: Show the pilot recruitment plan.

**Trap**: Don't inflate numbers or call demo data "users."

---

## BUSINESS MODEL QUESTIONS

### Q14: "How will you make money?"

**Short (15s)**: We're testing pricing hypotheses. The most likely model is subscription or per-project pricing for engineers. Nothing is validated yet.

**Strong (30s)**: We have four pricing hypotheses: subscription (₹999-1999/month), per-project (₹500-2000), freemium, and enterprise. All are unvalidated. The first step is to determine whether engineers find BuildMe valuable enough to use, then test willingness to pay. We're not assuming a business model works without evidence.

**Evidence**: Show the Business Model Hypothesis document.

**Trap**: Don't present hypothetical revenue as actual plans.

---

### Q15: "Who exactly pays?"

**Short (15s)**: Most likely civil engineers or small construction firms. We're testing this through customer discovery.

**Strong (30s)**: Our hypothesis is that civil engineers preparing residential construction estimates would pay for better benchmarking and tracking. But this is unvalidated. The first experiment is to determine whether engineers actually want the product, then whether they'd pay.

**Evidence**: Show the customer discovery protocol.

**Trap**: Don't say "everyone in construction" — be specific.

---

## COMPETITION QUESTIONS

### Q16: "Why won't existing construction software copy this?"

**Short (15s)**: They could. Our potential advantage is the dataset we're building — real estimates compared with actual outcomes.

**Strong (30s)**: BuildMe's potential moat isn't the estimation engine — it's the ground-truth dataset. As real projects are tracked through completion, BuildMe accumulates estimate-vs-actual data that improves the methodology. This data flywheel is hard to replicate without doing the same pilot work.

**Evidence**: Show the estimate→actual→validation pipeline.

**Trap**: Don't claim BuildMe has a moat. Say "potential future advantage."

---

### Q17: "What stops someone from building this in a weekend?"

**Short (15s)**: The estimation engine is straightforward. The hard part is collecting real data and validating the methodology.

**Strong (30s)**: Anyone can build a cost calculator. BuildMe's value is in the data infrastructure — government benchmarks, real quotations, ground-truth tracking, and validation analytics. The technical prototype took months. The data collection and validation will take years. That's the real barrier.

**Evidence**: Show the data pipeline and validation framework.

**Trap**: Don't claim BuildMe is technically unique. Say the value is in data and validation.

---

## FOUNDER QUESTIONS

### Q18: "Why are you the person to build this?"

**Short (15s)**: My father is a civil engineer. I have direct domain access, technical skills, and a systematic approach to validation.

**Strong (30s)**: I have three advantages: (1) domain access — my father is a practicing civil engineer with direct access to the target market, (2) technical capability — I've built the entire prototype myself, and (3) scientific discipline — I'm not claiming validation I don't have, which means the eventual validation will be credible.

**Evidence**: Show the quotation dataset (built from father's practice).

**Trap**: Don't say "I'm passionate" or "I'm innovative."

---

### Q19: "What's your background?"

**Short (15s)**: I'm a [your background] with direct access to the construction industry through my family.

**Strong (30s)**: [Honest answer about your actual background]. My connection to construction comes through my father's practice. I've spent [time] building BuildMe and collecting data from real engineering practice.

**Evidence**: Be honest about what you've actually done.

**Trap**: Don't inflate credentials. Honesty is your strength.

---

## CEDI QUESTIONS

### Q20: "Why do you need CEDI?"

**Short (15s)**: CEDI can accelerate the critical next step: real-world validation through pilot deployment and mentorship.

**Strong (30s)**: BuildMe has the technical infrastructure to collect genuine construction project data. What I need is: (1) access to civil engineers willing to pilot, (2) mentorship on customer discovery and validation, and (3) support transitioning from prototype to validated product. CEDI's network and mentorship can provide what I cannot build alone.

**Evidence**: Show the pilot recruitment plan.

**Trap**: Don't say "I need funding." Say "I need validation support."

---

### Q21: "What will you accomplish in 3 months?"

**Short (15s)**: 5 customer interviews, 1 active pilot, and if the project completes, 1 ground-truth observation.

**Strong (30s)**: Month 1: Complete 5 customer discovery interviews and recruit 1 pilot. Month 2: Onboard the pilot project, generate estimates, start tracking. Month 3: If the project completes, record final cost and analyze BuildMe's performance. If not, collect expense data and engineer feedback.

**Evidence**: Show the 30/60/90 day plan.

**Trap**: Don't promise impossible numbers. Be realistic.

---

### Q22: "What happens if your estimator doesn't perform well?"

**Short (15s)**: We learn and improve. That's the whole point of validation.

**Strong (30s)**: If BuildMe's estimate differs significantly from actual costs, we'll know exactly why — the methodology is transparent. We can identify whether the issue is in the benchmark, the location adjustment, the time adjustment, or the quality adjustment. This is valuable learning that improves the methodology.

**Evidence**: Show the estimation methodology layers.

**Trap**: Don't say "it will definitely perform well."

---

## EXECUTION QUESTIONS

### Q23: "What's the single most important thing you need to do next?"

**Short (15s)**: Execute one real pilot. Everything else is ready for it.

**Strong (30s)**: Get one civil engineer to use BuildMe on a genuine construction project. That single pilot will answer: (1) Is the product usable? (2) Is the estimate useful? (3) Does the tracking workflow work? (4) Would the engineer use it again? Everything else — ML, business model, scaling — depends on this.

**Evidence**: Show the pilot recruitment plan.

**Trap**: Don't say "build more features."

---

### Q24: "What's your biggest risk?"

**Short (15s)**: That nobody wants to use BuildMe. That's why we need to test with real engineers.

**Strong (30s)**: The biggest risk is that engineers don't find BuildMe valuable enough to adopt. The estimation engine might be useful but not differentiated enough. The only way to discover this is through real-world testing. That's why the next step is pilot deployment, not feature development.

**Evidence**: Show the customer discovery protocol.

**Trap**: Don't say "there are no risks."

---

### Q25: "What have you learned from building this?"

**Short (15s)**: The problem is real, the data exists, and honesty is a competitive advantage.

**Strong (30s)**: Three key learnings: (1) Government construction data is publicly available and can be structured — the data barrier is lower than expected. (2) Market quotations reveal real variance — 40-60% differences for similar scope. (3) Not claiming accuracy when you don't have evidence builds more credibility than fabricating validation.

**Evidence**: Show the quotation variance data.

**Trap**: Don't say "I learned to code" or generic lessons.

---

## TECHNICAL QUESTIONS

### Q26: "Why SQLite? That's not production-grade."

**Short (15s)**: SQLite is a prototype limitation. The architecture is designed for easy migration to PostgreSQL.

**Strong (30s)**: SQLite was chosen for rapid prototyping. The Prisma schema and API layer are database-agnostic. Migration to PostgreSQL or another production database is straightforward. The focus right now is on validation, not production deployment.

**Evidence**: Show the Prisma schema.

**Trap**: Don't defend SQLite as production-grade.

---

### Q27: "Can this scale?"

**Short (15s)**: The architecture scales. The current deployment doesn't. That's a deliberate trade-off for rapid prototyping.

**Strong (30s)**: The Next.js API layer, Prisma ORM, and React frontend are all production-grade. The current SQLite database is a prototype limitation. Scaling to production would require PostgreSQL, proper hosting, and multi-tenant architecture. These are engineering decisions, not product decisions.

**Evidence**: Show the architecture.

**Trap**: Don't claim it's production-ready.

---

### Q28: "What's the tech stack?"

**Short (15s)**: Next.js, TypeScript, Prisma, SQLite, Tailwind CSS, Leaflet maps.

**Strong (30s)**: Frontend: Next.js + TypeScript + Tailwind CSS. Backend: Next.js API routes + Prisma ORM. Database: SQLite (prototype). Maps: Leaflet with OpenStreetBar. Testing: Python E2E suite. Estimation: Python engine + TypeScript API.

**Evidence**: Show the codebase.

**Trap**: Don't overcomplicate the answer.

---

## HARD QUESTIONS

### Q29: "Isn't this just a calculator with extra steps?"

**Short (15s)**: A calculator computes. BuildMe connects government data, market evidence, and project tracking into a transparent system.

**Strong (30s)**: A calculator takes inputs and produces outputs. BuildMe takes the same inputs but connects them to real government benchmarks (CPWD), adjusts for location using real indices (BCCI), compares against real market evidence (quotations), and tracks the project through completion for validation. The value is in the connections, not the calculation.

**Evidence**: Show the estimation methodology flow.

**Trap**: Don't get defensive. Acknowledge the simplicity and explain the value.

---

### Q30: "Why should CEDI select you?"

**Short (15s)**: I've built a working product on real data, I know what hasn't been proven, and I have a clear plan for validation.

**Strong (30s)**: Three reasons: (1) I've already built substantial infrastructure — 77 pages, 0 errors, real government data, real quotations. (2) I'm honest about what hasn't been proven — no fabricated validation, no fake AI claims. (3) I have a clear next step — execute one real pilot with CEDI's support. The product is ready for testing. What's needed is the testing itself.

**Evidence**: Show the entire BuildMe product.

**Trap**: Don't say "I'm passionate" or "I'll work hard." Show evidence of what you've already done.

---

## THE MOST IMPORTANT ANSWER

### "Why should CEDI select you?"

**The answer**:

> "I've built a working construction cost-estimation platform on real government data and market evidence. It's not perfect — the estimator hasn't been validated, there are no real users yet, and the business model is unproven. But the infrastructure to test these hypotheses now exists. What I need is CEDI's support to execute the next experiment: getting BuildMe into the hands of real civil engineers on real construction projects. If it works, we'll have genuine validation. If it doesn't, we'll learn exactly why. Either way, we'll have evidence instead of assumptions."
