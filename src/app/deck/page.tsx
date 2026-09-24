// ─── Investor Deck (printable) ──────────────────────────────────────────────
// 10 slides rendered from the funding-committee memo and corrected one-pager.
// Built for print: A4 landscape pages, one slide per page. Ctrl/Cmd+P →
// "Save as PDF" → enable background graphics for full effect.
// Sources: Fundraising/COMMITTEE_MEMO.md · Fundraising/ONE_PAGER_AND_COPY_FIXES.md

import type { Metadata } from "next";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "BuildMe — Investor Deck",
  description:
    "The audit trail for home construction — 10-slide investor deck, printable.",
};

// ─── Slide shell ─────────────────────────────────────────────────────────────
function Slide({
  n,
  title,
  kicker,
  children,
}: {
  n: number;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="deck-slide relative mx-auto mb-6 flex h-[720px] w-[1120px] max-w-full flex-col overflow-hidden rounded-xl border border-border bg-white p-12 shadow-sm print:h-[168mm] print:w-[281mm] print:mb-0 print:rounded-none print:border-0 print:shadow-none print:break-after-page">
      <header className="mb-5 flex items-baseline justify-between">
        <div>
          {kicker && (
            <p className="text-caption font-semibold uppercase tracking-widest text-accent">
              {kicker}
            </p>
          )}
          <h2 className="text-title text-3xl font-bold">{title}</h2>
        </div>
        <span className="text-caption text-text-muted">
          BuildMe · {n}/10
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      <footer className="mt-4 border-t border-border pt-2 text-caption text-text-muted print:text-[9px]">
        BuildMe — the audit trail for home construction · Tamil Nadu, India
      </footer>
    </section>
  );
}

// ─── Small helpers ───────────────────────────────────────────────────────────
function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
      {children}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DeckPage() {
  return (
    <main className="min-h-screen bg-surface-alt py-8 print:bg-white print:py-0">
      <PrintButton />

      {/* Slide 1 — Title */}
      <Slide n={1} kicker="Seed · Pre-traction" title="BuildMe">
        <div className="flex flex-1 flex-col justify-center">
          <p className="max-w-3xl text-2xl font-semibold leading-snug">
            Every rupee of a home budget, explained — the audit trail for India&apos;s
            ₹5.8&nbsp;Lakh&nbsp;Cr informal housing market.
          </p>
          <p className="mt-4 max-w-2xl text-body text-text-secondary">
            BuildMe turns contractor quotations, site evidence, and government cost
            benchmarks into one auditable project story — for independent civil
            engineers in Tier-2 &amp; Tier-3 Tamil Nadu.
          </p>
          <div className="mt-8 rounded-lg border-l-4 border-accent bg-accent/5 p-4">
            <p className="font-semibold text-accent">
              India has no corpus of estimated-vs-actual residential construction
              costs. We are building it, one verified project at a time.
            </p>
          </div>
          <p className="mt-8 text-caption text-text-muted">
            Founder: civil engineer&apos;s son · full-stack builder · direct pilot-site
            access · September 2026
          </p>
        </div>
      </Slide>

      {/* Slide 2 — Problem */}
      <Slide n={2} kicker="The problem" title="A ₹5.8L Cr market runs on WhatsApp and Excel">
        <div className="grid flex-1 grid-cols-3 gap-4">
          <div className="rounded-xl border border-border p-5">
            <p className="text-4xl font-bold text-accent">40–60%</p>
            <p className="mt-2 font-semibold">quotation variance</p>
            <p className="mt-2 text-caption text-text-secondary">
              Observed spread across 12 real contractor BOQs for comparable
              residential scopes (BuildMe quotation dataset, 2019–2024).
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-4xl font-bold text-accent">10+ hrs/wk</p>
            <p className="mt-2 font-semibold">defending numbers</p>
            <p className="mt-2 text-caption text-text-secondary">
              Independent engineers spend it answering homeowner doubts they can&apos;t
              prove — no evidence trail, no benchmarks, disputes everywhere.
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <p className="text-4xl font-bold text-accent">0</p>
            <p className="mt-2 font-semibold">ground-truth corpora</p>
            <p className="mt-2 text-caption text-text-secondary">
              India has no dataset of what homes actually cost when finished.
              Our own public-data audit (published in this repo) confirms it.
            </p>
          </div>
        </div>
        <p className="mt-5 text-body text-text-secondary">
          A homeowner&apos;s biggest life purchase has no audit trail. The trusted
          professional in the middle — the engineer — is stuck defending numbers
          nobody can verify.
        </p>
      </Slide>

      {/* Slide 3 — Solution */}
      <Slide n={3} kicker="The solution" title="One wedge: quotation audit → payment proof">
        <ol className="flex-1 space-y-3">
          {[
            ["1 · Quotation audit", "Contractor BOQs normalized to one comparable scope — a defensible comparison the engineer can show a client."],
            ["2 · Deterministic estimate", "CPWD plinth-area rates × 16 TN BCCI district indices. Every number traces to a public schedule — auditable by any engineer."],
            ["3 · Milestone evidence", "GPS photos and stage context captured at the payment moment. OBSERVED / INFERRED / NOT-VERIFIABLE discipline."],
            ["4 · Payment justification", "Evidence-backed payment requests get paid faster and pre-empt disputes. Every rupee traced to a quotation or change order."],
          ].map(([t, d]) => (
            <li key={t} className="flex items-start gap-4 rounded-lg border border-border bg-surface-alt p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
                {t.slice(0, 1)}
              </span>
              <div>
                <p className="font-semibold">{t.slice(4)}</p>
                <p className="text-caption text-text-secondary">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-caption text-text-muted">
          Shipped: a 77-page working platform — quotation intel, estimation engine,
          evidence chain, budget story, AI layout → 3D virtual tour.
        </p>
      </Slide>

      {/* Slide 4 — Why now */}
      <Slide n={4} kicker="Why now" title="Public data, new law, ubiquitous hardware">
        <ul className="flex-1 space-y-4 text-body">
          <Bullet>
            <strong>Quarterly public cost data nobody has productized.</strong> TN
            DES publishes BCCI cost indices for 16 districts — structured,
            government-published, free. We turn it into the estimation engine.
          </Bullet>
          <Bullet>
            <strong>DPDP Act 2023.</strong> Digital consent and records are becoming
            mainstream for consumers — evidence trails move from paper to platform.
          </Bullet>
          <Bullet>
            <strong>Smartphones at every site.</strong> The habit gap is workflow,
            not hardware. Photo capture is designed into the payment milestone, not
            a daily chore.
          </Bullet>
          <Bullet>
            <strong>The status quo is failing visibly.</strong> WhatsApp + Excel
            cannot answer &ldquo;why did the budget change?&rdquo; — and everyone knows it.
          </Bullet>
        </ul>
      </Slide>

      {/* Slide 5 — Business model */}
      <Slide n={5} kicker="Business model" title="Engineers pay per audited project — a rounding error against a ₹40L build">
        <div className="grid flex-1 grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-4">
              <p className="font-semibold">Per-project pricing</p>
              <p className="mt-1 text-body text-text-secondary">
                ₹1,500–3,000 per audited project (hypothesis — validating via Van
                Westendorp in 5 discovery interviews; pilot pricing ₹999).
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-semibold">Why it closes</p>
              <p className="mt-1 text-body text-text-secondary">
                One audited quotation that wins a client — or one payment request
                paid without a dispute — repays the year&apos;s fees. Price is a
                rounding error against a ₹40L build.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-semibold">Expansion revenue</p>
              <p className="mt-1 text-body text-text-secondary">
                Material-supplier listings inside the 3D tour · builder SaaS seats ·
                per-district cost data products.
              </p>
            </div>
          </div>
          <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-5">
            <p className="text-caption font-semibold uppercase tracking-widest text-accent">
              The unit that matters
            </p>
            <p className="mt-3 text-body">
              Engineer runs 5–8 projects/yr through the platform.
            </p>
            <p className="mt-3 text-3xl font-bold text-accent">₹12–24K</p>
            <p className="text-caption text-text-secondary">revenue per engineer-year</p>
            <p className="mt-4 text-caption text-text-muted">
              Hypothesis under validation — every number on this slide carries its
              exact definition and experiment plan.
            </p>
          </div>
        </div>
      </Slide>

      {/* Slide 6 — Bottom-up market */}
      <Slide n={6} kicker="Market" title="Bottom-up: ₹60L–1.2 Cr near-term ARR">
        <div className="flex flex-1 flex-col justify-center">
          <table className="w-full max-w-3xl text-body">
            <tbody>
              {[
                ["ARPU (hypothesis to validate)", "₹1,500–3,000 per audited project"],
                ["Projects per engineer per year", "5–8"],
                ["≈ Revenue per engineer-year", "₹12,000–24,000"],
                ["Independent engineers, western TN", "~500 (relationship network)"],
                ["Near-term SOM", "₹60L–1.2 Cr ARR"],
                ["South-India expansion (5,000 engineers)", "₹6–12 Cr ARR"],
              ].map(([k, v], i) => (
                <tr key={k} className={i % 2 === 0 ? "bg-surface-alt" : ""}>
                  <td className="border-b border-border px-4 py-2.5">{k}</td>
                  <td className="border-b border-border px-4 py-2.5 text-right font-semibold">
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 flex items-start gap-3 rounded-lg border-l-4 border-accent bg-accent/5 p-4">
            <p className="text-caption text-text-secondary">
              <strong className="text-text-primary">Why bottom-up only:</strong> every
              assumption above is testable in discovery interviews and will be tagged
              &ldquo;validated in interview #K&rdquo; as evidence lands. The unorganized
              market being made auditable is ₹5.8L Cr/yr — context, not the model.
            </p>
          </div>
        </div>
      </Slide>

      {/* Slide 7 — Moat */}
      <Slide n={7} kicker="Moat" title="The corpus nobody else can buy">
        <div className="grid flex-1 grid-cols-3 gap-4">
          <div className="flex flex-col rounded-xl border-2 border-accent/40 bg-accent/5 p-5">
            <Tag>Primary moat</Tag>
            <p className="mt-3 font-semibold">Estimated-vs-actual corpus</p>
            <p className="mt-2 flex-1 text-caption text-text-secondary">
              Every completed pilot project deposits a verified cost pair — estimate,
              actual, area, district, spec, stage timeline. Our own dataset audit
              names this India&apos;s #1 construction-data gap. Public indices tell you
              the index moved; our corpus tells you what a 1,200 sqft house in Erode
              actually cost last quarter.
            </p>
            <p className="mt-3 text-caption font-semibold text-accent">
              North-star metric: N verified cost pairs
            </p>
          </div>
          <div className="flex flex-col rounded-xl border border-border p-5">
            <p className="mt-1 font-semibold">Evidence-chain lock-in</p>
            <p className="mt-2 flex-1 text-caption text-text-secondary">
              Six months of a project&apos;s photos, quotations, and payments live in one
              auditable timeline. The project&apos;s entire financial memory is here —
              switching cost is real.
            </p>
          </div>
          <div className="flex flex-col rounded-xl border border-border p-5">
            <p className="mt-1 font-semibold">Engineer trust networks</p>
            <p className="mt-2 flex-1 text-caption text-text-secondary">
              ~500 engineers in western TN is a relationship business — density in a
              geography, not a feature a large player can copy quickly.
            </p>
          </div>
          <div className="col-span-3 rounded-lg border border-border bg-surface-alt p-4">
            <p className="text-caption text-text-secondary">
              <strong className="text-text-primary">Honest moat posture:</strong> the
              BCCI/CPWD indices are public — any competitor can download them
              tomorrow. They are a feature, not the moat. The corpus is.
            </p>
          </div>
        </div>
      </Slide>

      {/* Slide 8 — Competition */}
      <Slide n={8} kicker="Competition" title="We compete with WhatsApp chaos, not Powerplay">
        <table className="w-full flex-1 text-caption">
          <thead>
            <tr className="border-b-2 border-border text-left">
              <th className="px-3 py-2"></th>
              <th className="px-3 py-2">WhatsApp + Excel</th>
              <th className="px-3 py-2">Powerplay</th>
              <th className="px-3 py-2">Brick&amp;Bolt</th>
              <th className="px-3 py-2 text-accent">BuildMe</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Deterministic regional cost benchmark", "✗", "✗", "internal", "✓ 16 BCCI centres"],
              ["Quotation scope normalization", "✗", "partial", "internal", "✓"],
              ["Homeowner-facing evidence story", "chat chaos", "✗", "consumer app", "✓ share-link"],
              ["Estimated-vs-actual corpus", "✗", "✗", "proprietary", "accumulating"],
              ["Target user", "everyone", "contractors", "end-to-end builder", "independent engineer"],
            ].map((row) => (
              <tr key={row[0]} className="border-b border-border">
                <td className="px-3 py-2.5 font-semibold">{row[0]}</td>
                <td className="px-3 py-2.5 text-center text-text-muted">{row[1]}</td>
                <td className="px-3 py-2.5 text-center text-text-muted">{row[2]}</td>
                <td className="px-3 py-2.5 text-center text-text-muted">{row[3]}</td>
                <td className="px-3 py-2.5 text-center font-semibold text-accent">{row[4]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-body text-text-secondary">
          The layer that makes the WhatsApp chaos auditable — for the buyer no one
          else serves: the independent engineer&apos;s commercial workflow.
        </p>
      </Slide>

      {/* Slide 9 — Traction + product */}
      <Slide n={9} kicker="Traction & product" title="Honest today, compounding tomorrow">
        <div className="grid flex-1 grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-caption font-semibold uppercase tracking-widest text-text-muted">
                Live in-product traction (queried, not curated)
              </p>
              <ul className="mt-2 space-y-1.5 text-caption text-text-secondary">
                <li>· 77-page working platform shipped solo — estimation engine, quotation intel, evidence chain, 3D virtual tour</li>
                <li>· 12 real contractor quotations digitized; 2 estimated-vs-actual pairs instrumented live</li>
                <li>· In-app traction dashboard with exact definitions for every metric</li>
                <li>· Published dataset audit of all public cost sources — our honesty is verifiable</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-caption font-semibold uppercase tracking-widest text-text-muted">
                Honest limitations
              </p>
              <p className="mt-2 text-caption text-text-secondary">
                No revenue yet. No paying customer yet. Predictive ML deliberately not
                claimed until the pilot corpus supports it — that discipline is our
                brand.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              ["Day 30 — proof of pain", "5 recorded discovery interviews · 1 signed pilot engineer · 3 BOQs structured · pricing experiments run"],
              ["Day 60 — proof of use", "≥10 photo-verified milestones · first estimated-vs-actual pair captured end-to-end · homeowner share-link shipped · infra hardened (object storage + Postgres)"],
              ["Day 90 — proof of value", "1 paying engineer · ≥3 cost pairs in the corpus · CAC hypothesis measured · milestone report"],
            ].map(([t, d], i) => (
              <div key={t} className="flex gap-4 rounded-lg border border-border p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-white">
                  {30 * (i + 1)}
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-0.5 text-caption text-text-secondary">{d}</p>
                </div>
              </div>
            ))}
            <p className="text-caption text-text-muted">
              Milestone-linked: each gate must pass before the next phase&apos;s spend.
            </p>
          </div>
        </div>
      </Slide>

      {/* Slide 10 — Ask */}
      <Slide n={10} kicker="The ask" title="Funds the 90-day proof, milestone-linked">
        <div className="grid flex-1 grid-cols-4 gap-3">
          {[
            ["40%", "Field pilot ops", "site visits, engineer onboarding, instrumentation"],
            ["30%", "Engineering / infra", "object storage, Postgres migration, offline queue"],
            ["20%", "Design", "share-link experience, quotation-audit flow polish"],
            ["10%", "Compliance", "entity setup, ToS, DPDP baseline"],
          ].map(([pct, t, d]) => (
            <div key={t} className="rounded-xl border border-border bg-surface-alt p-4 text-center">
              <p className="text-3xl font-bold text-accent">{pct}</p>
              <p className="mt-1 text-sm font-semibold">{t}</p>
              <p className="mt-1 text-caption text-text-secondary">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl border-2 border-accent/30 bg-accent/5 p-5">
          <p className="text-body">
            <strong>What this buys:</strong> in 90 days, a paying engineer and a real
            cost-pair corpus — or a cheap, documented failure. Either outcome is
            information a committee can act on.
          </p>
          <p className="mt-2 text-caption text-text-muted">
            Grant amount and program name set per application — the plan, gates, and
            use of funds are program-agnostic.
          </p>
        </div>
        <p className="mt-4 text-caption text-text-secondary">
          Contact: [your email] · Fundraising/COMMITTEE_MEMO.md in the repo has
          the full diligence prep — all 8 expected questions, answered.
        </p>
      </Slide>
    </main>
  );
}
