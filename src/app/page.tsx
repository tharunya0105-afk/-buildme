import Link from "next/link";
import {
  HardHat, ArrowRight, Target, FileText, DollarSign,
  Camera, TrendingUp, CheckCircle, Zap,
  MapPin, CreditCard, ChevronRight, Shield,
  Users, TrendingDown, Clock, AlertTriangle,
  Compass,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Quotation Intelligence",
    description: "Structure unstructured contractor quotes. Compare scope, not just bottom-line price. Surface hidden exclusions, missing quantities, and abnormal line rates.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: DollarSign,
    title: "Cost Intelligence",
    description: "Benchmark-based estimation combining CPWD national schedules with 16 Tamil Nadu BCCI regional centres. Transparent, explainable provenance — not black-box AI.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: TrendingUp,
    title: "Design-to-Cost Simulator",
    description: "Simulate design adjustments before pouring concrete. See the exact budget and timeline impact of adding a bathroom or upgrading vitrified tiles in real time.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    icon: Camera,
    title: "Evidence-Based Progress",
    description: "Organize daily site photos by project, structural stage, and timestamp. Built on an OBSERVED / INFERRED / NOT VERIFIABLE evidence hierarchy.",
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    icon: Target,
    title: "Project Truth Engine",
    description: "Every budget change explained with provenance. Every variation order linked to site conditions. The complete, defensible financial audit trail of the build.",
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    icon: CreditCard,
    title: "Payment Transparency",
    description: "Homeowners see exactly WHY money is requested. Payment milestones tied to verified photographic evidence and original quotation stages.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const stats = [
  { value: "16", label: "TN BCCI Centres", sublabel: "Quarterly localized cost indices" },
  { value: "12", label: "Real BOQ Quotations", sublabel: "Structured across 54 line items" },
  { value: "79 / 79", label: "E2E Tests Passing", sublabel: "Deterministic, reproducible build" },
  { value: "₹5.8 Lakh Cr", label: "Market Made Auditable", sublabel: "Unorganized Tier-2/3 home building / yr" },
];

const workflowSteps = [
  { icon: FileText, label: "1. Plan", desc: "CPWD + BCCI Benchmark" },
  { icon: DollarSign, label: "2. Quote", desc: "Structured BOQ Analysis" },
  { icon: MapPin, label: "3. Site", desc: "GPS Verified Operations" },
  { icon: Camera, label: "4. Evidence", desc: "Stage-Linked Photos" },
  { icon: TrendingUp, label: "5. Change", desc: "Design-to-Cost Impact" },
  { icon: CreditCard, label: "6. Pay", desc: "Milestone Transparency" },
  { icon: CheckCircle, label: "7. Truth", desc: "Defensible Audit Trail" },
];

const problemPoints = [
  {
    icon: AlertTriangle,
    title: "40%–60% Quotation Variance",
    desc: "Contractor BOQs for identical scopes vary widely — excluded items, substandard specs, provisional sums. Observed across 12 real residential quotations (2019–2024) in the BuildMe dataset.",
    stat: "40–60%",
  },
  {
    icon: TrendingDown,
    title: "Most Budgets Break Along the Way",
    desc: "Residential builds in Tier-2 India commonly exceed original budgets — not at the end, but through undocumented change orders and unexplained cost movements that no tool captures.",
    stat: "15–30%",
  },
  {
    icon: Clock,
    title: "The 'WhatsApp Chaos' Trap",
    desc: "Hundreds of random site photos sent on WhatsApp threads with zero financial context. When money is requested, there is no audit trail explaining why.",
    stat: "0 Audit Trail",
  },
  {
    icon: Users,
    title: "The Engineer's Trust Deficit",
    desc: "Independent civil engineers spend hours manually explaining cost escalations and defending their integrity against suspicious homeowners.",
    stat: "10+ hrs/wk",
  },
];

const roadmap = [
  {
    period: "Days 1–30",
    title: "Discovery & Pilot Onboarding",
    deliverables: [
      "5 structured customer discovery interviews with independent civil engineers in Tamil Nadu",
      "Instrument Kumar Residence (1,800 sq ft RCC build) as Pilot 001",
      "Benchmark vs. local contractor quotation comparison complete",
      "Establish weekly site evidence collection protocol",
    ],
    badge: "Month 1",
  },
  {
    period: "Days 31–60",
    title: "Field Tracking & Multi-Site Pilot",
    deliverables: [
      "Track active foundation & structural progress with photo audit trail",
      "Record live material price fluctuations vs. BCCI quarterly benchmarks",
      "Onboard 2 additional independent civil engineers (Coimbatore & Trichy)",
      "Deploy milestone-linked payment justification requests to homeowners",
    ],
    badge: "Month 2",
  },
  {
    period: "Days 61–90",
    title: "Ground-Truth Validation & ML Feasibility",
    deliverables: [
      "Capture completed structural milestone ground-truth cost variance",
      "Evaluate statistical feasibility of localized predictive cost modeling",
      "Test willingness-to-pay and engineer subscription SaaS pricing",
      "Publish a transparent milestone report with the full data matrix",
    ],
    badge: "Month 3",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── Top Announcement Banner ─────────────────────────────────────── */}
      <div className="bg-primary text-white text-xs py-2 px-4 border-b border-primary-dark">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="bg-accent px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase text-white">
              Now Piloting
            </span>
            <span className="text-white/90 font-medium">
              Built with practicing civil engineers in Tamil Nadu · Stage: pre-pilot validation, onboarding pilot partners
            </span>
          </div>
          <a
            href="#demo"
            className="text-accent-light hover:underline font-semibold text-xs flex items-center gap-1"
          >
            Quick Demo Access <ChevronRight className="w-3.5 h-3.5 inline" />
          </a>
        </div>
      </div>

      {/* ─── Main Navigation ────────────────────────────────────────────────── */}
      <nav className="border-b border-border bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-title font-bold text-text-primary tracking-tight">BuildMe</span>
              <span className="hidden md:inline-block text-[10px] ml-2 px-1.5 py-0.5 rounded bg-surface-alt text-text-muted border border-border font-medium">
                Construction Truth Engine
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <a href="#problem" className="hover:text-text-primary transition-colors">The Problem</a>
            <a href="#solution" className="hover:text-text-primary transition-colors">Platform</a>
            <a href="#founder" className="hover:text-text-primary transition-colors">Founder Story</a>
            <a href="#market" className="hover:text-text-primary transition-colors">Market & Scale</a>
            <a href="#roadmap" className="hover:text-text-primary transition-colors">90-Day Plan</a>
          </div>

          {/* Nav CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <a
              href="#demo"
              className="btn-premium btn-accent px-4 py-2 text-sm shadow-sm"
            >
              Live Demo <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 sm:pt-16 pb-16 sm:pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-micro font-medium mb-6 border border-accent/20">
              <Compass className="w-3.5 h-3.5" />
              Construction Intelligence Platform for Tier-2 & Tier-3 India
            </div>

            <h1 className="text-display font-bold text-text-primary leading-[1.15] tracking-tight">
              Every rupee of your home budget,{" "}
              <span className="text-accent underline decoration-accent/30 underline-offset-8">
                explained.
              </span>
            </h1>

            <p className="mt-6 text-xl text-text-secondary leading-relaxed">
              BuildMe turns contractor quotations, site evidence, and government cost benchmarks into one auditable project story — for independent civil engineers in Tier-2 & Tier-3 Tamil Nadu.
            </p>

            <p className="mt-4 text-body text-text-muted leading-relaxed max-w-2xl">
              India has no corpus of estimated-vs-actual residential construction costs. We are building it — one verified project at a time — on top of deterministic, auditable benchmarks.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a href="#demo" className="btn-premium btn-accent px-7 py-3 text-base shadow-md">
                See one real project, end to end <ArrowRight className="w-4 h-4 ml-1.5" />
              </a>
              <a href="#founder" className="btn-premium btn-secondary px-6 py-3 text-base">
                Read Founder Story
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-micro text-text-muted">
              <span className="flex items-center gap-1 text-text-secondary font-medium">
                <Shield className="w-4 h-4 text-accent" /> 16 TN BCCI Regional Centres
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-text-secondary font-medium">
                <FileText className="w-4 h-4 text-warning" /> CPWD Provenance
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-success font-medium">
                <CheckCircle className="w-4 h-4" /> 79/79 E2E Verified Build
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Evaluator 1-Click Access Callout Banner ──────────────────────── */}
      <section id="demo" className="border-y border-accent/20 bg-accent/5 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-accent text-white text-[10px] font-bold uppercase tracking-wider">
                Investor & Partner Fast-Track
              </div>
              <h2 className="text-title font-bold text-text-primary">
                Instant Demo Access (Pre-Configured Kumar Residence Project)
              </h2>
              <p className="text-caption text-text-secondary max-w-xl">
                Walk the real journey: how an ₹45L planned house discovered site constraints, handled change orders, and proved every rupee of cost movement.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="px-3.5 py-2.5 rounded-lg bg-white border border-accent/30 shadow-sm text-left">
                <p className="text-[10px] text-text-muted font-medium">Demo Engineer Account</p>
                <p className="text-xs font-mono font-bold text-text-primary">engineer@buildme.demo</p>
                <p className="text-[10px] font-mono text-text-muted">Pass: demo1234</p>
              </div>

              <div className="px-3.5 py-2.5 rounded-lg bg-white border border-accent/30 shadow-sm text-left">
                <p className="text-[10px] text-text-muted font-medium">Demo Homeowner Account</p>
                <p className="text-xs font-mono font-bold text-text-primary">rkumar@buildme.demo</p>
                <p className="text-[10px] font-mono text-text-muted">Pass: demo1234</p>
              </div>

              <Link
                href="/auth/login"
                className="btn-premium btn-accent px-6 py-3 text-sm font-semibold shadow-md self-center flex items-center justify-center gap-1.5"
              >
                Sign In With 1-Click <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Macro Stats Bar ───────────────────────────────────────────────── */}
      <section className="border-b border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-2">
                <p className="text-financial-lg font-bold text-text-primary">{stat.value}</p>
                <p className="text-caption font-semibold text-text-primary mt-1">{stat.label}</p>
                <p className="text-micro text-text-muted mt-0.5">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 1: THE PROBLEM ────────────────────────────────────────── */}
      <section id="problem" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20">
        <div className="text-center mb-14">
          <p className="text-micro font-semibold text-danger uppercase tracking-wider mb-2">The Ground Reality</p>
          <h2 className="text-title font-bold text-text-primary">
            Why residential construction budgets break in India
          </h2>
          <p className="text-body text-text-secondary max-w-2xl mx-auto mt-2">
            Construction budgets don&apos;t suddenly jump at the end — they become unexplained along the way.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problemPoints.map((p) => (
            <div
              key={p.title}
              className="card-premium p-6 border-l-4 border-l-danger hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-danger/10 flex items-center justify-center">
                    <p.icon className="h-5 w-5 text-danger" />
                  </div>
                  <h3 className="text-subtitle font-bold text-text-primary">{p.title}</h3>
                </div>
                <span className="px-2 py-1 rounded bg-danger/10 text-danger text-micro font-bold">
                  {p.stat}
                </span>
              </div>
              <p className="text-caption text-text-secondary leading-relaxed pl-12">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 rounded-2xl bg-surface-alt border border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-caption font-bold text-text-primary">The Resulting Trust Deficit</p>
            <p className="text-micro text-text-secondary mt-1 max-w-xl">
              Homeowners believe the contractor is overcharging. Contractors believe the homeowner is demanding free upgrades. The independent civil engineer is trapped in the middle with no defensible audit trail.
            </p>
          </div>
          <a href="#solution" className="btn-premium btn-secondary text-xs px-5 py-2.5 whitespace-nowrap">
            How BuildMe Solves This →
          </a>
        </div>
      </section>

      {/* ─── SECTION 2: THE SOLUTION & WORKFLOW ────────────────────────────── */}
      <section id="solution" className="border-y border-border bg-surface-alt py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-micro font-semibold text-accent uppercase tracking-wider mb-2">System Architecture</p>
            <h2 className="text-title font-bold text-text-primary">
              How BuildMe creates the Construction Truth Engine
            </h2>
            <p className="text-body text-text-secondary max-w-2xl mx-auto mt-2">
              From benchmark estimation to final payment release — linking every rupee to physical site evidence.
            </p>
          </div>

          {/* Workflow Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-16">
            {workflowSteps.map((step) => (
              <div
                key={step.label}
                className="card-premium p-4 text-center flex flex-col items-center justify-between group hover:border-accent/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-accent/10 transition-colors">
                  <step.icon className="h-5 w-5 text-primary group-hover:text-accent transition-colors" />
                </div>
                <div>
                  <p className="text-caption font-bold text-text-primary">{step.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5 leading-tight">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-premium p-6 hover:shadow-lg transition-all duration-200 group"
              >
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-subtitle font-bold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-caption text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: FOUNDER STORY & UNFAIR ADVANTAGE ────────────────────── */}
      <section id="founder" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20">
        <div className="card-premium overflow-hidden border-2 border-primary/20 shadow-lg">
          <div className="bg-primary text-white p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider mb-4">
              Founder & Domain Heritage
            </div>
            <h2 className="text-title sm:text-2xl font-bold tracking-tight">
              &quot;Why I built BuildMe: The story behind the software.&quot;
            </h2>
            <p className="text-caption text-white/80 mt-2 max-w-2xl">
              Authentic domain skin-in-the-game, direct civil engineering access, and uncompromising intellectual honesty.
            </p>
          </div>

          <div className="p-6 sm:p-8 bg-white grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4 text-body text-text-secondary leading-relaxed">
              <p className="text-subtitle font-semibold text-text-primary italic">
                &ldquo;My father is a practicing civil engineer in Tamil Nadu. Growing up, I watched him spend late nights preparing construction estimates using spreadsheets, government schedules, and experience-based adjustments.&rdquo;
              </p>
              <p>
                I saw how much time he spent gathering material rates, adjusting for location, and comparing contractor quotations. But more importantly, I saw the consequences when estimates were challenged: budget overruns, client disputes, and projects that exceeded original scope. Not because engineers were incompetent, but because the tools they had were completely fragmented.
              </p>
              <p>
                When I started developing BuildMe, I made a strict design rule: <strong>no fake AI hype</strong>. We do not claim to have trained a proprietary machine learning cost model yet — because you cannot train a responsible ML model without genuine completed-project ground-truth data. Instead, we built the deterministic foundation: 16 Tamil Nadu BCCI centres, CPWD schedules, real contractor BOQ structuring, and an immutable evidence chain.
              </p>
              <p className="font-semibold text-text-primary">
                The next milestone is field validation: piloting this system on 10+ real residential builds in Tamil Nadu, capturing the estimated-vs-actual cost data that no one else in India has.
              </p>
            </div>

            <div className="lg:col-span-4 p-5 rounded-xl bg-surface-alt border border-border space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Founder Profile</p>
                <p className="text-subtitle font-bold text-text-primary mt-1">Founder & Lead Architect</p>
                <p className="text-caption text-accent font-medium">BuildMe · Construction Intelligence</p>
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-micro text-text-secondary">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <span>Direct domain access via practicing civil engineering family</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <span>Full-stack execution: 77-page functioning database-backed platform</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <span>79/79 verifiable deterministic E2E tests passing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <span>Deep integration of 160 TN BCCI historical records</span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <p className="text-[10px] text-text-muted italic">
                  &ldquo;Honesty is our competitive advantage. Transparent methodology builds more trust than black-box algorithms.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: MARKET & SCALE ───────────────────────────────── */}
      <section id="market" className="border-y border-border bg-surface-alt py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-micro font-semibold text-accent uppercase tracking-wider mb-2">Market Scale & National Need</p>
            <h2 className="text-title font-bold text-text-primary">
              The ₹5.8 Lakh Crore Unorganized Housing Opportunity
            </h2>
            <p className="text-body text-text-secondary max-w-2xl mx-auto mt-2">
              Individual home construction in Tier-2 & Tier-3 India is one of the largest un-digitized segments of India&apos;s GDP.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="card-premium p-6 text-center">
              <p className="text-overline text-accent font-bold">Total Addressable Market (TAM)</p>
              <p className="text-financial-xl font-bold text-text-primary mt-2">₹5.8 Lakh Cr</p>
              <p className="text-micro text-text-muted mt-2">
                Annual residential individual house building market across India&apos;s urban & semi-urban clusters.
              </p>
            </div>

            <div className="card-premium p-6 text-center border-2 border-accent">
              <p className="text-overline text-accent font-bold">Serviceable Addressable Market (SAM)</p>
              <p className="text-financial-xl font-bold text-accent mt-2">₹42,000 Cr</p>
              <p className="text-micro text-text-muted mt-2">
                Tamil Nadu & Kerala residential construction managed by independent civil engineers.
              </p>
            </div>

            <div className="card-premium p-6 text-center">
              <p className="text-overline text-accent font-bold">Near-Term Opportunity (SOM)</p>
              <p className="text-financial-xl font-bold text-text-primary mt-2">₹60L – 1.2 Cr ARR</p>
              <p className="text-micro text-text-muted mt-2">
                Bottom-up: ~500 independent engineers in Western Tamil Nadu × 5–8 projects/yr × ₹12–24K per engineer-year.
              </p>
            </div>
          </div>

          {/* Business model — what investors scan for */}
          <div className="card-premium p-6 bg-white">
            <h3 className="text-subtitle font-bold text-text-primary mb-4">Business Model</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-caption text-text-secondary">
              <div className="p-4 rounded-lg bg-surface-alt">
                <p className="font-semibold text-text-primary mb-1">Who pays</p>
                <p className="text-micro">Independent civil engineers — per audited project (₹1,500–3,000 hypothesis, validating at ₹999 in pilots) with per-engineer subscriptions as volume grows.</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-alt">
                <p className="font-semibold text-text-primary mb-1">Unit economics logic</p>
                <p className="text-micro">One audited project saves an engineer 10+ hours of dispute-prone reporting on a ₹40L+ build — pricing is a rounding error against the trust it buys.</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-alt">
                <p className="font-semibold text-text-primary mb-1">Expansion revenue</p>
                <p className="text-micro">Material-supplier listings inside the furnished 3D tour, builder SaaS seats, and district-level cost-data products built on the corpus.</p>
              </div>
            </div>
          </div>

          <div className="card-premium p-6 bg-white">
            <h3 className="text-subtitle font-bold text-text-primary mb-3">Why This Wins</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-caption text-text-secondary">
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="font-semibold text-text-primary mb-1">Tier-2 / Tier-3 Regional Focus</p>
                <p className="text-micro">Built directly for non-metro centres (Coimbatore, Salem, Erode, Trichy) where contractors operate without formal ERP systems.</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="font-semibold text-text-primary mb-1">Open Benchmark Integration</p>
                <p className="text-micro">Structures public government data (CPWD & State PWD indices) into accessible digital workflows for everyday home builders.</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-alt">
                <p className="font-semibold text-text-primary mb-1">Financial Transparency for Families</p>
                <p className="text-micro">Protects life savings of middle-class home builders through milestone-linked evidence and cost change justifications.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: 30-60-90 DAY EXECUTION ROADMAP ──────────────────── */}
      <section id="roadmap" className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-24 scroll-mt-20">
        <div className="text-center mb-14">
          <p className="text-micro font-semibold text-accent uppercase tracking-wider mb-2">Execution Discipline</p>
          <h2 className="text-title font-bold text-text-primary">
            30 / 60 / 90 Day Milestone Plan
          </h2>
          <p className="text-body text-text-secondary max-w-2xl mx-auto mt-2">
            Clear, verifiable milestones designed to transition BuildMe from a functional prototype into a field-validated startup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmap.map((stage) => (
            <div key={stage.period} className="card-premium p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-overline text-accent font-bold tracking-wider">{stage.badge}</span>
                  <span className="px-2 py-0.5 rounded bg-surface-alt border border-border text-[10px] font-semibold text-text-primary">
                    {stage.period}
                  </span>
                </div>
                <h3 className="text-subtitle font-bold text-text-primary mb-4">{stage.title}</h3>
                <ul className="space-y-2.5">
                  {stage.deliverables.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-caption text-text-secondary">
                      <span className="text-accent font-bold text-xs mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-micro text-text-muted">
                <span>Output Verified</span>
                <span className="font-semibold text-text-primary">Milestone Gate</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-accent/5 border border-accent/20 text-center">
          <p className="text-caption text-accent font-medium">
            <strong>Target Milestone:</strong> Onboard 5 civil engineers, instrument 10 active residential projects, and complete 1 full ground-truth project validation in Tamil Nadu.
          </p>
        </div>
      </section>

      {/* ─── SECTION 6: DATA FOUNDATION & PROVENANCE ───────────────────────── */}
      <section className="border-t border-border bg-surface-alt py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="card-premium p-8 bg-gradient-to-br from-white to-slate-50 border border-border shadow-sm">
            <div className="text-center mb-8">
              <p className="text-micro font-semibold text-accent uppercase tracking-wider mb-2">Scientific Integrity</p>
              <h2 className="text-subtitle font-bold text-text-primary">Built on verifiable, empirical sources</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="p-4 rounded-xl bg-white border border-border-subtle shadow-sm">
                <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-caption font-bold text-text-primary">CPWD Benchmark Schedules</p>
                <p className="text-micro text-text-muted mt-1">Plinth area rates, baseline specifications & RCC structured models</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-border-subtle shadow-sm">
                <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-caption font-bold text-text-primary">16 TN BCCI Cost Centres</p>
                <p className="text-micro text-text-muted mt-1">Coimbatore, Chennai, Trichy, Salem, Madurai, Erode & 10 more centres</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-border-subtle shadow-sm">
                <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-caption font-bold text-text-primary">Real Contractor BOQs</p>
                <p className="text-micro text-text-muted mt-1">12 genuine residential quotations structured across 54 line items</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA & Evaluator Contact ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-title sm:text-3xl font-bold text-text-primary mb-4">
            Ready to see BuildMe live?
          </h2>
          <p className="text-body text-text-secondary mb-8 leading-relaxed">
            Test the live estimation calculator, walk through the Kumar Residence pilot case study, and verify the payment audit trail.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login" className="btn-premium btn-accent px-8 py-3.5 text-base shadow-md">
              Sign In to Live Demo <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
            <a
              href="mailto:buildme.eir@gmail.com?subject=BuildMe%20Demo%20%2F%20Partnership%20Query"
              className="btn-premium btn-secondary px-6 py-3.5 text-base"
            >
              Contact Founder Directly
            </a>
          </div>
          <p className="mt-4 text-micro text-text-muted">
            Instant evaluation login: <span className="font-mono font-bold text-text-primary">engineer@buildme.demo</span> · <span className="font-mono font-bold text-text-primary">demo1234</span>
          </p>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <HardHat className="h-4 w-4 text-white" />
                </div>
                <span className="text-caption font-bold text-text-primary text-base">BuildMe</span>
              </div>
              <p className="text-micro text-text-muted leading-relaxed">
                The Construction Truth Engine. Helping civil engineers and homeowners eliminate construction budget surprises.
              </p>
              <p className="text-[10px] text-accent font-semibold">
                Deterministic estimation · Transparent evidence · Honest data
              </p>
            </div>

            <div>
              <p className="text-micro font-bold text-text-primary uppercase tracking-wider mb-3">Application</p>
              <ul className="space-y-2 text-caption text-text-secondary">
                <li><a href="#problem" className="hover:text-text-primary transition-colors">The Problem</a></li>
                <li><a href="#solution" className="hover:text-text-primary transition-colors">Platform Capabilities</a></li>
                <li><a href="#founder" className="hover:text-text-primary transition-colors">Founder Story</a></li>
                <li><a href="#market" className="hover:text-text-primary transition-colors">Market & Scalability</a></li>
                <li><a href="#roadmap" className="hover:text-text-primary transition-colors">30-60-90 Day Plan</a></li>
              </ul>
            </div>

            <div>
              <p className="text-micro font-bold text-text-primary uppercase tracking-wider mb-3">Portals</p>
              <ul className="space-y-2 text-caption text-text-secondary">
                <li><Link href="/auth/login" className="hover:text-text-primary transition-colors">Engineer Dashboard</Link></li>
                <li><Link href="/auth/login" className="hover:text-text-primary transition-colors">Homeowner Dashboard</Link></li>
                <li><Link href="/auth/login" className="hover:text-text-primary transition-colors">Interactive Product Demo</Link></li>
                <li><Link href="/auth/signup" className="hover:text-text-primary transition-colors">Create Account</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-micro font-bold text-text-primary uppercase tracking-wider mb-3">Contact</p>
              <div className="space-y-2 text-caption text-text-secondary">
                <p className="text-micro text-text-muted">Headquarters:</p>
                <p className="font-semibold text-text-primary">Tiruchirappalli, Tamil Nadu, India</p>
                <p className="text-micro text-text-muted">Piloting across Western Tamil Nadu</p>
                <p className="text-micro text-accent font-medium pt-2">buildme.eir@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <p className="text-micro text-text-muted leading-relaxed max-w-4xl">
              <strong className="text-text-secondary">Methodology & disclosures:</strong> Estimation references CPWD Plinth Area Rates (2019 base) and quarterly TN BCCI district indices from the Tamil Nadu Dept. of Economics &amp; Statistics. Assistive AI features (quotation structuring, layout visualization) are human-verified; we do not claim predictive cost ML. BuildMe is a record-keeping and communication tool — not escrow, arbitration, or a payment guarantee.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-micro text-text-muted">
              <p>&copy; {new Date().getFullYear()} BuildMe. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <span>Deterministic CPWD/BCCI Data</span>
                <span>•</span>
                <span>79/79 E2E Verified</span>
                <span>•</span>
                <span>Tamil Nadu Regional Focus</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


