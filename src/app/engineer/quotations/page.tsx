"use client";

import { useState, useEffect } from "react";
import {
  FileText, AlertTriangle, CheckCircle, XCircle, Upload,
  ArrowLeft, DollarSign, Layers, Eye, GitCompareArrows,
  Info, ChevronDown, ChevronUp, Plus,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Quotation {
  id: string;
  title: string;
  totalAmount: number | null;
  ratePerSqFt: number | null;
  rateType: string | null;
  builtArea: number | null;
  qualityLevel: string | null;
  scopeCompleteness: number;
  includesStructure: boolean;
  includesFoundation: boolean;
  includesMasonry: boolean;
  includesPlastering: boolean;
  includesFlooring: boolean;
  includesWaterproofing: boolean;
  includesPainting: boolean;
  includesDoors: boolean;
  includesElectrical: boolean;
  includesPlumbing: boolean;
  includesKitchen: boolean;
  includesBathroom: boolean;
  includesFittings: boolean;
  includesFabrication: boolean;
  missingInfo: string | null;
  comparisonWarning: string | null;
  materialBrands: string | null;
  paymentTerms: string | null;
  escalationClause: string | null;
  exclusions: string | null;
  assumptions: string | null;
  validity: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  builtArea: number | null;
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ─── Scope Categories ───────────────────────────────────────────────────────

const SCOPE_CATEGORIES = [
  { key: "structure", label: "Structure", icon: "🏗" },
  { key: "foundation", label: "Foundation", icon: "⬇️" },
  { key: "masonry", label: "Masonry", icon: "🧱" },
  { key: "plastering", label: "Plastering", icon: "🎨" },
  { key: "flooring", label: "Flooring", icon: "🟫" },
  { key: "waterproofing", label: "Waterproofing", icon: "💧" },
  { key: "painting", label: "Painting", icon: "🖌" },
  { key: "doors", label: "Doors & Windows", icon: "🚪" },
  { key: "electrical", label: "Electrical", icon: "⚡" },
  { key: "plumbing", label: "Plumbing", icon: "🔧" },
  { key: "kitchen", label: "Kitchen", icon: "🍳" },
  { key: "bathroom", label: "Bathroom", icon: "🚿" },
  { key: "fittings", label: "Fittings", icon: "🔩" },
  { key: "fabrication", label: "Fabrication", icon: "⚙️" },
];

// ─── Create Quotation Form ──────────────────────────────────────────────────

function CreateQuotationForm({
  projectId,
  onCreated,
  onCancel,
}: {
  projectId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    totalAmount: "",
    ratePerSqFt: "",
    builtArea: "",
    qualityLevel: "standard",
    materialBrands: "",
    paymentTerms: "",
    escalationClause: "",
    validity: "30 days",
    exclusions: "",
    assumptions: "",
    includedScope: ["structure", "foundation", "masonry"],
  });
  const [submitting, setSubmitting] = useState(false);

  const toggleScope = (key: string) => {
    setForm(prev => ({
      ...prev,
      includedScope: prev.includedScope.includes(key)
        ? prev.includedScope.filter(k => k !== key)
        : [...prev.includedScope, key],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          totalAmount: form.totalAmount ? parseFloat(form.totalAmount) : null,
          ratePerSqFt: form.ratePerSqFt ? parseFloat(form.ratePerSqFt) : null,
          builtArea: form.builtArea ? parseFloat(form.builtArea) : null,
          qualityLevel: form.qualityLevel,
          materialBrands: form.materialBrands || null,
          paymentTerms: form.paymentTerms || null,
          escalationClause: form.escalationClause || null,
          validity: form.validity || null,
          exclusions: form.exclusions ? form.exclusions.split(",").map(s => s.trim()) : null,
          assumptions: form.assumptions ? form.assumptions.split(",").map(s => s.trim()) : null,
          includedScope: form.includedScope,
          sourceType: "manual",
        }),
      });
      if (res.ok) onCreated();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Add Quotation</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Quotation Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Hemanth Kumar R - Structure Estimate"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Total Amount (₹)</label>
              <input
                type="number"
                value={form.totalAmount}
                onChange={e => setForm(p => ({ ...p, totalAmount: e.target.value }))}
                placeholder="e.g., 4000000"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Rate per sq.ft (₹)</label>
              <input
                type="number"
                value={form.ratePerSqFt}
                onChange={e => setForm(p => ({ ...p, ratePerSqFt: e.target.value }))}
                placeholder="e.g., 2500"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Built Area (sq.ft)</label>
              <input
                type="number"
                value={form.builtArea}
                onChange={e => setForm(p => ({ ...p, builtArea: e.target.value }))}
                placeholder="e.g., 1600"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Quality Level</label>
            <div className="flex gap-2">
              {["economy", "standard", "premium", "luxury"].map(level => (
                <button
                  key={level}
                  onClick={() => setForm(p => ({ ...p, qualityLevel: level }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    form.qualityLevel === level
                      ? "bg-primary text-white"
                      : "bg-surface-alt text-text-secondary hover:bg-surface"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block">
              Included Scope (tap to toggle)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SCOPE_CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => toggleScope(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    form.includedScope.includes(cat.key)
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {form.includedScope.includes(cat.key) ? (
                    <CheckCircle className="h-3 w-3 ml-auto" />
                  ) : (
                    <XCircle className="h-3 w-3 ml-auto" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {form.includedScope.length} of {SCOPE_CATEGORIES.length} categories included
              — {SCOPE_CATEGORIES.length - form.includedScope.length} excluded
            </p>
          </div>

          {/* Material + Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Material Brands</label>
              <input
                type="text"
                value={form.materialBrands}
                onChange={e => setForm(p => ({ ...p, materialBrands: e.target.value }))}
                placeholder="e.g., Ramco cement, JSW TMT"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Payment Terms</label>
              <input
                type="text"
                value={form.paymentTerms}
                onChange={e => setForm(p => ({ ...p, paymentTerms: e.target.value }))}
                placeholder="e.g., 15% advance, milestones"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Escalation Clause</label>
              <input
                type="text"
                value={form.escalationClause}
                onChange={e => setForm(p => ({ ...p, escalationClause: e.target.value }))}
                placeholder="e.g., Rates revised if stopped >3 months"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Validity</label>
              <input
                type="text"
                value={form.validity}
                onChange={e => setForm(p => ({ ...p, validity: e.target.value }))}
                placeholder="e.g., 30 days"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Exclusions (comma-separated)</label>
            <input
              type="text"
              value={form.exclusions}
              onChange={e => setForm(p => ({ ...p, exclusions: e.target.value }))}
              placeholder="e.g., Electrical, Plumbing, Fittings"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Assumptions (comma-separated)</label>
            <input
              type="text"
              value={form.assumptions}
              onChange={e => setForm(p => ({ ...p, assumptions: e.target.value }))}
              placeholder="e.g., Standard soil, no tree removal, road access"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !form.title}>
            {submitting ? "Creating..." : "Create Quotation"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quotation Detail Card ──────────────────────────────────────────────────

function QuotationCard({ q }: { q: Quotation }) {
  const [expanded, setExpanded] = useState(false);
  const included = SCOPE_CATEGORIES.filter(c => {
    const key = `includes${c.key.charAt(0).toUpperCase() + c.key.slice(1)}` as keyof Quotation;
    return q[key];
  });
  const excluded = SCOPE_CATEGORIES.filter(c => {
    const key = `includes${c.key.charAt(0).toUpperCase() + c.key.slice(1)}` as keyof Quotation;
    return !q[key];
  });
  const missing = q.missingInfo ? JSON.parse(q.missingInfo) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-text-primary">{q.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
              {q.totalAmount && <span>{formatCurrency(q.totalAmount)}</span>}
              {q.ratePerSqFt && <span>₹{q.ratePerSqFt.toLocaleString("en-IN")}/sq.ft</span>}
              {q.builtArea && <span>{q.builtArea} sq.ft</span>}
              {q.qualityLevel && (
                <span className="capitalize px-2 py-0.5 rounded-full bg-surface-alt">
                  {q.qualityLevel}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-surface-alt"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Scope Completeness */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-muted">Scope completeness</span>
            <span className="font-medium text-text-primary">{q.scopeCompleteness}%</span>
          </div>
          <div className="w-full h-2 bg-surface-alt rounded-full">
            <div
              className={`h-full rounded-full ${
                q.scopeCompleteness >= 75 ? "bg-green-500" : q.scopeCompleteness >= 50 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${q.scopeCompleteness}%` }}
            />
          </div>
        </div>

        {/* Included/Excluded grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs font-semibold text-green-700 mb-2">INCLUDED</p>
            <div className="space-y-1">
              {included.map(c => (
                <div key={c.key} className="flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle className="h-3 w-3" />
                  <span>{c.icon} {c.label}</span>
                </div>
              ))}
              {included.length === 0 && (
                <p className="text-xs text-text-muted">No categories confirmed</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 mb-2">EXCLUDED / UNKNOWN</p>
            <div className="space-y-1">
              {excluded.map(c => (
                <div key={c.key} className="flex items-center gap-1.5 text-xs text-red-600">
                  <XCircle className="h-3 w-3" />
                  <span>{c.icon} {c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Missing Information */}
        {missing.length > 0 && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
            <p className="text-xs font-semibold text-amber-800 mb-1">MISSING / UNCLEAR</p>
            {missing.map((item: string, i: number) => (
              <p key={i} className="text-xs text-amber-700">⚠ {item}</p>
            ))}
          </div>
        )}

        {/* Comparison Warning */}
        {q.comparisonWarning && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-3">
            <p className="text-xs font-semibold text-red-800">⚠ COMPARABILITY WARNING</p>
            <p className="text-xs text-red-700 mt-1">{q.comparisonWarning}</p>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-3 mt-4 pt-4 border-t border-border">
            {q.materialBrands && (
              <div>
                <p className="text-xs font-semibold text-text-muted">MATERIAL BRANDS</p>
                <p className="text-sm text-text-primary">{q.materialBrands}</p>
              </div>
            )}
            {q.paymentTerms && (
              <div>
                <p className="text-xs font-semibold text-text-muted">PAYMENT TERMS</p>
                <p className="text-sm text-text-primary">{q.paymentTerms}</p>
              </div>
            )}
            {q.escalationClause && (
              <div>
                <p className="text-xs font-semibold text-text-muted">ESCALATION</p>
                <p className="text-sm text-text-primary">{q.escalationClause}</p>
              </div>
            )}
            {q.validity && (
              <div>
                <p className="text-xs font-semibold text-text-muted">VALIDITY</p>
                <p className="text-sm text-text-primary">{q.validity}</p>
              </div>
            )}
            {q.exclusions && (
              <div>
                <p className="text-xs font-semibold text-text-muted">EXCLUSIONS</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {JSON.parse(q.exclusions).map((e: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {q.assumptions && (
              <div>
                <p className="text-xs font-semibold text-text-muted">ASSUMPTIONS</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {JSON.parse(q.assumptions).map((a: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Comparison View ────────────────────────────────────────────────────────

function ComparisonView({
  quotationA,
  quotationB,
  projectId,
}: {
  quotationA: Quotation;
  quotationB: Quotation;
  projectId: string;
}) {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/quotations/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotationAId: quotationA.id, quotationBId: quotationB.id }),
    })
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [quotationA.id, quotationB.id, projectId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-text-muted mt-2">Analyzing scope differences...</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const r = result as {
    quotationA: { title: string; totalAmount: number; ratePerSqFt: number | null; scopeCompleteness: number };
    quotationB: { title: string; totalAmount: number; ratePerSqFt: number | null; scopeCompleteness: number };
    summary: {
      sharedCategories: string[];
      onlyInQuotationA: string[];
      onlyInQuotationB: string[];
      missingFromBoth: string[];
      scopeOverlap: number;
    };
    comparabilityWarning: string;
    priceComparison: {
      quotationAPrice: number;
      quotationBPrice: number;
      priceDifference: number;
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Scope Comparison</h2>
        </div>
      </CardHeader>
      <CardContent>
        {/* Price comparison */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">{r.quotationA.title}</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(r.quotationA.totalAmount)}</p>
            <p className="text-xs text-text-muted">
              {r.quotationA.ratePerSqFt ? `₹${r.quotationA.ratePerSqFt.toLocaleString("en-IN")}/sq.ft` : "Rate N/A"}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">Price Difference</p>
            <p className={`text-lg font-bold ${r.priceComparison.priceDifference > 0 ? "text-red-600" : "text-green-600"}`}>
              {r.priceComparison.priceDifference > 0 ? "+" : ""}{formatCurrency(Math.abs(r.priceComparison.priceDifference))}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-surface-alt">
            <p className="text-xs text-text-muted mb-1">{r.quotationB.title}</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(r.quotationB.totalAmount)}</p>
            <p className="text-xs text-text-muted">
              {r.quotationB.ratePerSqFt ? `₹${r.quotationB.ratePerSqFt.toLocaleString("en-IN")}/sq.ft` : "Rate N/A"}
            </p>
          </div>
        </div>

        {/* Comparability Warning */}
        <div className={`p-4 rounded-lg mb-6 ${
          r.summary.scopeOverlap < 50 ? "bg-red-50 border border-red-200"
            : r.summary.scopeOverlap < 75 ? "bg-amber-50 border border-amber-200"
              : "bg-green-50 border border-green-200"
        }`}>
          <p className={`text-sm font-semibold ${
            r.summary.scopeOverlap < 50 ? "text-red-800"
              : r.summary.scopeOverlap < 75 ? "text-amber-800"
                : "text-green-800"
          }`}>
            {r.summary.scopeOverlap < 50 ? "⚠ NOT DIRECTLY COMPARABLE"
              : r.summary.scopeOverlap < 75 ? "⚠ CAUTION"
                : "✓ MODERATELY COMPARABLE"}
          </p>
          <p className={`text-xs mt-1 ${
            r.summary.scopeOverlap < 50 ? "text-red-700"
              : r.summary.scopeOverlap < 75 ? "text-amber-700"
                : "text-green-700"
          }`}>
            {r.comparabilityWarning}
          </p>
        </div>

        {/* Scope Breakdown */}
        <div className="space-y-4">
          {r.summary.sharedCategories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 mb-2">SHARED SCOPE ({r.summary.sharedCategories.length})</p>
              <div className="flex flex-wrap gap-1">
                {r.summary.sharedCategories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs">{cat}</span>
                ))}
              </div>
            </div>
          )}

          {r.summary.onlyInQuotationA.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-700 mb-2">ONLY IN QUOTATION A ({r.summary.onlyInQuotationA.length})</p>
              <div className="flex flex-wrap gap-1">
                {r.summary.onlyInQuotationA.map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">{cat}</span>
                ))}
              </div>
            </div>
          )}

          {r.summary.onlyInQuotationB.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-purple-700 mb-2">ONLY IN QUOTATION B ({r.summary.onlyInQuotationB.length})</p>
              <div className="flex flex-wrap gap-1">
                {r.summary.onlyInQuotationB.map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs">{cat}</span>
                ))}
              </div>
            </div>
          )}

          {r.summary.missingFromBoth.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 mb-2">MISSING FROM BOTH ({r.summary.missingFromBoth.length})</p>
              <div className="flex flex-wrap gap-1">
                {r.summary.missingFromBoth.map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs">{cat}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 rounded-lg bg-surface-alt">
          <p className="text-xs text-text-muted">
            <strong>How to read:</strong> A lower scope overlap % means the quotations cover different work.
            Price differences may reflect scope differences rather than actual cost differences.
            Always normalize scope before comparing prices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function QuotationIntelligencePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects
  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0) setSelectedProjectId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch quotations
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    fetch(`/api/projects/${selectedProjectId}/quotations`)
      .then(r => r.json())
      .then(data => {
        setQuotations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedProjectId, showCreate]);

  const toggleCompare = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const qA = quotations.find(q => q.id === selectedForCompare[0]);
  const qB = quotations.find(q => q.id === selectedForCompare[1]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <a href="/engineer" className="flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </a>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Quotation Intelligence</h1>
            <p className="text-sm text-text-muted mt-1">
              Upload quotations, analyze scope, compare estimates, and identify gaps.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
              {quotations.length} quotation{quotations.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="mb-6">
          <label className="text-xs text-text-muted mb-1 block">Select project</label>
          <div className="flex gap-2 flex-wrap">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedProjectId === p.id
                    ? "bg-primary text-white"
                    : "bg-surface-alt text-text-primary hover:bg-surface"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <Button onClick={() => { setShowCreate(true); setCompareMode(false); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Quotation
        </Button>
        {quotations.length >= 2 && (
          <Button
            variant={compareMode ? "primary" : "secondary"}
            onClick={() => { setCompareMode(!compareMode); setSelectedForCompare([]); }}
          >
            <GitCompareArrows className="h-4 w-4 mr-1" />
            {compareMode ? "Cancel Compare" : "Compare Quotations"}
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && selectedProjectId && (
        <div className="mb-6">
          <CreateQuotationForm
            projectId={selectedProjectId}
            onCreated={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Comparison View */}
      {compareMode && qA && qB && selectedProjectId && (
        <div className="mb-6">
          <ComparisonView quotationA={qA} quotationB={qB} projectId={selectedProjectId} />
        </div>
      )}

      {/* Quotation List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-text-muted mt-3">Loading quotations...</p>
        </div>
      ) : quotations.length === 0 ? (
        <EmptyState
          title="No quotations yet"
          description="Add your first construction quotation to begin scope analysis and comparison."
          action={<Button onClick={() => setShowCreate(true)}>Add Quotation</Button>}
        />
      ) : (
        <div className="space-y-4">
          {quotations.map(q => (
            <div key={q.id} className="relative">
              {compareMode && (
                <button
                  onClick={() => toggleCompare(q.id)}
                  className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                    selectedForCompare.includes(q.id)
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-muted border-border hover:border-primary"
                  }`}
                >
                  {selectedForCompare.indexOf(q.id) + 1 || ""}
                </button>
              )}
              <QuotationCard q={q} />
            </div>
          ))}
        </div>
      )}

      {/* Intelligence Explanation */}
      <Card className="mt-8">
        <CardContent className="py-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-text-muted">
              <p className="font-medium text-text-primary mb-1">How Quotation Intelligence works</p>
              <p>
                BuildMe analyzes each quotation to identify which construction categories are included, excluded,
                or unclear. This scope analysis enables fair comparison between quotations — because two ₹2,000/sq.ft
                quotations can have very different scopes. Always check the scope completeness score and exclusion
                list before comparing prices.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
