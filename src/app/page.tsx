import Link from "next/link";
import {
  HardHat, ArrowRight, Target, FileText, DollarSign,
  Camera, TrendingUp, CheckCircle, Zap,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Quotation Intelligence",
    description: "Structure contractor quotations. Compare scope, not just price. Identify what's included, excluded, and missing.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: DollarSign,
    title: "Cost Intelligence",
    description: "Benchmark-based estimation using government data and regional cost indices. Transparent methodology, not black-box AI.",
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    icon: TrendingUp,
    title: "Design-to-Cost",
    description: "Simulate how design changes affect your budget before committing. Add a bathroom, upgrade tiles, see the impact.",
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    icon: Camera,
    title: "Evidence-Based Progress",
    description: "Daily construction photos organized by project, stage, and date. OBSERVED / INFERRED / NOT VERIFIABLE framework.",
    color: "text-info",
    bg: "bg-info/10",
  },
  {
    icon: Target,
    title: "Project Truth",
    description: "Every budget change explained. Every payment request linked to evidence. The complete financial story of your project.",
    color: "text-danger",
    bg: "bg-danger/10",
  },
  {
    icon: Zap,
    title: "Payment Transparency",
    description: "Homeowners understand WHY they're being asked for money. Milestone-linked requests with evidence and budget context.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
];

const stats = [
  { value: "12", label: "Real Quotations", sublabel: "Structured from actual BOQs" },
  { value: "16", label: "TN BCCI Centres", sublabel: "Regional cost intelligence" },
  { value: "54", label: "Line Items", sublabel: "With full provenance" },
  { value: "79/79", label: "Tests Passing", sublabel: "Deterministic, reproducible" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <span className="text-title font-bold text-text-primary tracking-tight">BuildMe</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn-premium btn-primary px-4 py-2 text-sm">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-micro font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Construction Intelligence Platform
          </div>
          
          <h1 className="text-display font-bold text-text-primary leading-tight tracking-tight">
            Know what your house will cost before you build it.
          </h1>
          
          <p className="mt-6 text-xl text-text-secondary leading-relaxed">
            BuildMe connects design decisions, contractor quotations, site progress, and budget tracking in one place.
          </p>
          
          <p className="mt-4 text-body text-text-muted leading-relaxed max-w-2xl">
            Built for independent civil engineers managing multiple residential construction projects. 
            Helps you document progress, explain changes to homeowners, and justify payment requests.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/engineer/cedi-demo" className="btn-premium btn-accent px-6 py-3 text-base">
              See the Demo <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link href="/auth/signup?role=engineer" className="btn-premium btn-secondary px-6 py-3 text-base">
              I&apos;m an Engineer
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-financial-lg font-bold text-text-primary">{stat.value}</p>
                <p className="text-caption font-semibold text-text-primary mt-1">{stat.label}</p>
                <p className="text-micro text-text-muted mt-0.5">{stat.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-title font-bold text-text-primary mb-4">
            Everything you need to manage construction costs
          </h2>
          <p className="text-body text-text-secondary max-w-2xl mx-auto">
            From quotation analysis to payment transparency, BuildMe connects the complete construction financial workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card-premium p-6 hover:shadow-md transition-shadow duration-200">
              <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="text-subtitle font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-caption text-text-secondary leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-title font-bold text-text-primary mb-4">
              How BuildMe works
            </h2>
            <p className="text-body text-text-secondary max-w-2xl mx-auto">
              From quotation to project truth, BuildMe connects every step of the construction financial workflow.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {[
              { icon: "📋", label: "Plan" },
              { icon: "📄", label: "Quote" },
              { icon: "🏗", label: "Site" },
              { icon: "📷", label: "Evidence" },
              { icon: "🔄", label: "Change" },
              { icon: "💰", label: "Money" },
              { icon: "✅", label: "Truth" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-white border border-border-subtle">
                  <span className="text-xl">{step.icon}</span>
                  <span className="text-micro font-medium text-text-primary">{step.label}</span>
                </div>
                {i < 6 && <span className="text-accent font-bold mx-1">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-title font-bold text-text-primary mb-4">
            Ready to see BuildMe in action?
          </h2>
          <p className="text-body text-text-secondary mb-8 max-w-xl mx-auto">
            Experience the complete construction intelligence workflow with the Kumar Residence demo project.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/engineer/cedi-demo" className="btn-premium btn-accent px-6 py-3 text-base">
              Explore the Demo <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link href="/auth/login" className="btn-premium btn-secondary px-6 py-3 text-base">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-alt">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <HardHat className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-caption font-semibold text-text-primary">BuildMe</span>
            </div>
            <p className="text-micro text-text-muted">
              &copy; {new Date().getFullYear()} BuildMe. Construction Intelligence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
