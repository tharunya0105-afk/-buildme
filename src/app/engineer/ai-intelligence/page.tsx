"use client";

import { useState, useEffect } from "react";
import {
  Brain, Camera, ArrowLeft, Info, AlertTriangle, CheckCircle,
  Upload, Eye, Layers, Clock, Shield, FileText,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AiAnalysis {
  id: string;
  overallAssessment: string;
  confidence: number;
  constructionStageObserved: string | null;
  summary: string | null;
  model: string | null;
  provider: string | null;
  createdAt: string;
  project: { name: string };
}

interface Project {
  id: string;
  name: string;
}

interface AiApiStatus {
  configured: boolean;
  provider: string | null;
  model: string | null;
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ─── AI Service Status ─────────────────────────────────────────────────────

function AiServiceStatus({ status }: { status: AiApiStatus }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">AI Service</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            status.configured ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {status.configured ? "CONFIGURED" : "NOT CONFIGURED"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Provider</p>
            <p className="text-sm font-medium text-text-primary">
              {status.provider || "None"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Capability</p>
            <p className="text-sm font-medium text-text-primary">
              Construction photo comparison
            </p>
          </div>
        </div>

        {!status.configured && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800 font-medium">AI service is not configured</p>
            <p className="text-xs text-amber-700 mt-1">
              Set the OPENAI_API_KEY environment variable to enable AI-powered construction
              photo comparison and analysis.
            </p>
          </div>
        )}

        <div className="mt-4 p-3 rounded-lg bg-surface-alt">
          <p className="text-xs text-text-muted">
            <strong className="text-text-primary">Important:</strong> AI observations are
            decision-support only and do not replace a licensed structural engineer.
            All AI outputs require engineer verification before being considered reliable.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AI Progress Tracker (Architecture Visualization) ───────────────────────

function AiProgressArchitecture() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">AI Progress Tracker</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            ARCHITECTURE
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pipeline visualization */}
          <div className="p-4 rounded-lg bg-surface-alt">
            <p className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wide">
              Progress Analysis Pipeline
            </p>
            <div className="space-y-2">
              {[
                { step: "1", label: "Upload previous photo", icon: <Camera className="h-4 w-4" />, color: "bg-blue-500" },
                { step: "2", label: "Upload current photo", icon: <Upload className="h-4 w-4" />, color: "bg-blue-500" },
                { step: "3", label: "Image quality check", icon: <Eye className="h-4 w-4" />, color: "bg-purple-500" },
                { step: "4", label: "Visual comparison", icon: <Layers className="h-4 w-4" />, color: "bg-purple-500" },
                { step: "5", label: "Change detection", icon: <Brain className="h-4 w-4" />, color: "bg-primary" },
                { step: "6", label: "Stage estimation", icon: <FileText className="h-4 w-4" />, color: "bg-primary" },
                { step: "7", label: "Simple explanation", icon: <Info className="h-4 w-4" />, color: "bg-green-500" },
                { step: "8", label: "Engineer verification", icon: <Shield className="h-4 w-4" />, color: "bg-green-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${item.color} text-white flex items-center justify-center text-xs font-bold`}>
                    {item.step}
                  </div>
                  <span className="text-sm text-text-primary">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Observation categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs font-semibold text-green-800 mb-1">OBSERVED</p>
              <p className="text-xs text-green-700">
                What the AI can directly see in the images — visible changes, new elements, apparent materials.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 mb-1">INFERRED</p>
              <p className="text-xs text-amber-700">
                What the AI suggests based on visual patterns — probable construction stage, possible progression.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs font-semibold text-red-800 mb-1">NOT VERIFIABLE</p>
              <p className="text-xs text-red-700">
                What the AI cannot determine from images alone — exact quantities, hidden work, material quality.
              </p>
            </div>
          </div>

          {/* Example output */}
          <div className="p-4 rounded-lg border border-border">
            <p className="text-xs font-semibold text-text-muted mb-2">EXAMPLE AI OUTPUT</p>
            <div className="space-y-2">
              <div className="p-2 rounded bg-green-50">
                <p className="text-xs font-medium text-green-800">OBSERVED</p>
                <p className="text-sm text-green-700">Additional column formwork is visible compared with the previous image.</p>
              </div>
              <div className="p-2 rounded bg-amber-50">
                <p className="text-xs font-medium text-amber-800">INFERRED</p>
                <p className="text-sm text-amber-700">The project may have progressed to the next structural stage.</p>
              </div>
              <div className="p-2 rounded bg-red-50">
                <p className="text-xs font-medium text-red-800">NOT VERIFIABLE</p>
                <p className="text-sm text-red-700">Exact reinforcement quantity and concrete grade cannot be confirmed from this photograph.</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2 italic">
              Confidence: Medium · Engineer verification: Pending
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AI History ─────────────────────────────────────────────────────────────

function AiHistory({ analyses }: { analyses: AiAnalysis[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">AI Analysis History</h2>
        </div>
      </CardHeader>
      <CardContent>
        {analyses.length === 0 ? (
          <EmptyState
            title="No AI analyses yet"
            description="When AI is configured and photos are compared, analyses will appear here."
            icon={<Brain className="h-8 w-8 text-text-muted" />}
          />
        ) : (
          <div className="space-y-3">
            {analyses.map(a => (
              <div key={a.id} className="p-3 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-text-primary">{a.project.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.overallAssessment === "progress_detected"
                      ? "bg-green-100 text-green-700"
                      : a.overallAssessment === "limited_visible_change"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                  }`}>
                    {a.overallAssessment.replace(/_/g, " ")}
                  </span>
                </div>
                {a.summary && (
                  <p className="text-xs text-text-secondary mb-1">{a.summary}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span>Confidence: {Math.round(a.confidence * 100)}%</span>
                  {a.model && <span>Model: {a.model}</span>}
                  <span>{new Date(a.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Model Readiness ────────────────────────────────────────────────────────

function ModelReadiness() {
  const models = [
    {
      name: "Progress Vision",
      description: "Compare construction photos and detect visible changes",
      status: "planned" as const,
      dataRequired: "500+ labelled photo pairs",
      currentData: 0,
    },
    {
      name: "Cost Impact Predictor",
      description: "Estimate cost impact of design changes",
      status: "planned" as const,
      dataRequired: "100+ project cost records",
      currentData: 0,
    },
    {
      name: "Stage Classifier",
      description: "Identify construction stage from photos",
      status: "planned" as const,
      dataRequired: "1000+ labelled construction images",
      currentData: 0,
    },
    {
      name: "Risk Predictor",
      description: "Predict project risk from patterns",
      status: "prototype" as const,
      dataRequired: "50+ completed projects",
      currentData: 0,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Model Readiness</h2>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-text-muted mb-4">
          Each AI model requires real labelled data before it can be trained.
          This table shows what data we need and current progress.
        </p>
        <div className="space-y-3">
          {models.map(model => (
            <div key={model.name} className="p-3 rounded-lg border border-border">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="text-sm font-semibold text-text-primary">{model.name}</h4>
                  <p className="text-xs text-text-muted">{model.description}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  model.status === "prototype" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {model.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-surface-alt rounded-full">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(100, (model.currentData / parseInt(model.dataRequired)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted whitespace-nowrap">
                  {model.currentData}/{model.dataRequired}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Database icon (missing import) ─────────────────────────────────────────

function Database(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5V19A9 3 0 0 0 21 19V5"/>
      <path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AiIntelligencePage() {
  const [analyses, setAnalyses] = useState<AiAnalysis[]>([]);
  const [apiStatus, setApiStatus] = useState<AiApiStatus>({ configured: false, provider: null, model: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check AI API status
    fetch("/api/ai/metrics")
      .then(r => r.json())
      .then(data => {
        setApiStatus({
          configured: data.configured || false,
          provider: data.provider || null,
          model: data.model || null,
        });
      })
      .catch(() => {});

    // Load AI analyses
    fetch("/api/ai/analysis")
      .then(r => r.json())
      .then(data => {
        setAnalyses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <a href="/engineer" className="flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </a>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">AI Intelligence</h1>
            <p className="text-sm text-text-muted mt-1">
              Construction progress analysis through visual comparison and rule-based intelligence.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-surface-alt text-text-muted font-medium">
            risk-engine-v1 + vision pipeline
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* AI Service Status */}
        <AiServiceStatus status={apiStatus} />

        {/* AI Progress Architecture */}
        <AiProgressArchitecture />

        {/* Model Readiness */}
        <ModelReadiness />

        {/* AI History */}
        <AiHistory analyses={analyses} />

        {/* Trust disclaimer */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-text-muted">
                <p className="font-medium text-text-primary mb-1">AI Safety & Trust</p>
                <p>
                  BuildMe AI provides observation assistance, not engineering certification.
                  Every AI output includes OBSERVED, INFERRED, and NOT VERIFIABLE categories.
                  All AI observations require engineer verification before being considered reliable.
                  AI does not replace professional structural engineering judgment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
