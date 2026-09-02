"use client";

import Link from "next/link";
import {
  Brain, Cpu, ArrowRight, CheckCircle, Clock, AlertTriangle,
  Target, Database, BarChart3, Activity, Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

function StatusBadge({ status }: { status: "implemented" | "not_validated" | "planned" | "not_tested" }) {
  const config = {
    implemented: { bg: "bg-status-normal-bg text-status-normal", label: "IMPLEMENTED" },
    not_validated: { bg: "bg-status-review-bg text-status-review", label: "NOT VALIDATED" },
    planned: { bg: "bg-surface-alt text-text-muted", label: "PLANNED" },
    not_tested: { bg: "bg-status-attention-bg text-status-attention", label: "NOT TESTED" },
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-semibold ${config[status].bg}`}>{config[status].label}</span>;
}

export default function AiValidationPage() {
  const comparisonMetrics = [
    { metric: "Precision", ruleBased: "Not available", mlModel: "Not trained" },
    { metric: "Recall", ruleBased: "Not available", mlModel: "Not trained" },
    { metric: "F1 Score", ruleBased: "Not available", mlModel: "Not trained" },
    { metric: "Calibration", ruleBased: "Not available", mlModel: "Not trained" },
    { metric: "False Positives", ruleBased: "Not measured", mlModel: "Not measured" },
    { metric: "False Negatives", ruleBased: "Not measured", mlModel: "Not measured" },
  ];

  const mlLabels = [
    { label: "Risk prediction", description: "Did a project actually require attention?", required: "Pilot outcome data" },
    { label: "Inspection prediction", description: "Did an inspection become overdue?", required: "Longitudinal inspection data" },
    { label: "Issue prediction", description: "Did a significant issue emerge?", required: "Issue outcome labels" },
    { label: "Schedule risk", description: "Did the project miss its expected milestone?", required: "Schedule outcome data" },
    { label: "Recommendation usefulness", description: "Was the recommendation useful?", required: "Engineer feedback" },
    { label: "False positive", description: "Did the system flag a non-existent problem?", required: "Engineer review" },
    { label: "Missed issue", description: "Did the system fail to identify an important issue?", required: "Engineer report" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">AI/ML Validation</h1>
        <p className="text-sm text-text-secondary mt-1">Honest assessment of BuildMe&apos;s AI/ML status and validation path</p>
      </div>

      {/* Current Baseline */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Current Baseline: risk-engine-v1</h3>
            <StatusBadge status="implemented" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Type", value: "Rule-based" },
              { label: "Features", value: "24" },
              { label: "Categories", value: "6" },
              { label: "Explainability", value: "Full traceability" },
            ].map((item) => (
              <div key={item.label} className="p-2 rounded bg-surface-alt text-center">
                <p className="text-[9px] text-text-muted">{item.label}</p>
                <p className="text-xs font-semibold text-text-primary">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded bg-status-attention-bg border border-status-attention-border">
            <p className="text-[10px] text-text-primary font-medium">
              This is NOT a trained ML model. It is an explainable rule-based baseline that generates risk scores from project-level operational features. The purpose is to provide a measurable baseline that future ML models must outperform.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Baseline vs ML Comparison */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Baseline vs. Future ML Comparison</h3>
          <p className="text-[10px] text-text-muted">ML model must beat risk-engine-v1 to be considered useful</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-text-muted font-medium">Metric</th>
                  <th className="text-right py-2 text-text-muted font-medium">Rule-Based Baseline</th>
                  <th className="text-right py-2 text-text-muted font-medium">ML Model</th>
                </tr>
              </thead>
              <tbody>
                {comparisonMetrics.map((row) => (
                  <tr key={row.metric} className="border-b border-border last:border-0">
                    <td className="py-2 text-text-primary">{row.metric}</td>
                    <td className="py-2 text-right text-text-secondary">{row.ruleBased}</td>
                    <td className="py-2 text-right text-text-muted">{row.mlModel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[9px] text-text-muted mt-2">
            All values will populate automatically when real pilot data is available.
          </p>
        </CardContent>
      </Card>

      {/* ML Pipeline */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Future ML Pipeline</h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {[
              { label: "Historical Data", icon: Database },
              { label: "Feature Engineering", icon: Activity },
              { label: "Labels/Outcomes", icon: Target },
              { label: "Train/Val Split", icon: BarChart3 },
              { label: "Baseline Model", icon: Brain },
              { label: "Evaluation", icon: CheckCircle },
              { label: "Calibration", icon: Activity },
              { label: "Pilot Validation", icon: Sparkles },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1 px-2 py-1.5 rounded bg-surface-alt border border-border min-w-[65px] text-center">
                  <step.icon className="h-4 w-4 text-text-muted" />
                  <span className="text-[8px] font-medium text-text-muted text-center">{step.label}</span>
                </div>
                {i < 7 && <span className="mx-0.5 text-text-muted text-xs">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ML Labels */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Future ML Labels</h3>
          <p className="text-[10px] text-text-muted">Structured labels required for model training — none exist yet</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mlLabels.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs text-text-primary">{item.label}</p>
                  <p className="text-[9px] text-text-muted">{item.description}</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-surface-alt text-text-muted flex-shrink-0 ml-3">
                  Requires: {item.required}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Link href="/engineer/validation" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          <ArrowRight className="h-3 w-3 rotate-180" /> Validation Command Center
        </Link>
        <Link href="/engineer/spatial-validation" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Spatial Validation <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
