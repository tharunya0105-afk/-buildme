"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, DollarSign, CheckCircle, Clock, AlertTriangle,
  Plus, Info, CreditCard, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  address: string;
  estimatedCost: number | null;
}

interface PaymentRequest {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  milestone: string | null;
  status: string;
  evidenceCount: number;
  budgetRemaining: number | null;
  totalPaidSoFar: number | null;
  createdAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  notes: string | null;
}

interface BudgetData {
  originalEstimate: number | null;
  currentExpectedCost: number | null;
  totalPaid: number;
  budgetChangeFromOriginal: number | null;
}

const MILESTONES = [
  { value: "foundation", label: "Foundation" },
  { value: "structure", label: "Structure" },
  { value: "roofing", label: "Roofing" },
  { value: "brickwork", label: "Brickwork" },
  { value: "electrical_plumbing", label: "Electrical/Plumbing" },
  { value: "finishing", label: "Finishing" },
  { value: "completion", label: "Completion" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  requested: { label: "Requested", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="h-3 w-3" /> },
  paid: { label: "Paid", color: "bg-green-100 text-green-700", icon: <CheckCircle className="h-3 w-3" /> },
  disputed: { label: "Disputed", color: "bg-red-100 text-red-700", icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500", icon: <AlertTriangle className="h-3 w-3" /> },
};

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ─── Create Payment Form ────────────────────────────────────────────────────

function CreatePaymentForm({
  projectId,
  budget,
  onCreated,
  onCancel,
}: {
  projectId: string;
  budget: BudgetData | null;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    milestone: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.amount) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          amount: parseFloat(form.amount),
          milestone: form.milestone || null,
          notes: form.notes || null,
          budgetRemaining: budget?.currentExpectedCost && budget?.totalPaid
            ? budget.currentExpectedCost - budget.totalPaid
            : null,
          totalPaidSoFar: budget?.totalPaid ?? null,
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
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Create Payment Request</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Payment Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Roof milestone payment"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Amount (₹) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                placeholder="e.g., 400000"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-muted mb-1 block">Linked Milestone</label>
              <select
                value={form.milestone}
                onChange={e => setForm(p => ({ ...p, milestone: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="">Select milestone</option>
                {MILESTONES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Why is this payment being requested?"
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-1 block">Notes (for homeowner)</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Optional context for the homeowner"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          {/* Budget Context */}
          {budget && (
            <div className="p-3 rounded-lg bg-surface-alt">
              <p className="text-xs font-semibold text-text-muted mb-1">BUDGET CONTEXT</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-text-muted">Expected</p>
                  <p className="font-bold text-text-primary">{formatCurrency(budget.currentExpectedCost ?? 0)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Paid so far</p>
                  <p className="font-bold text-primary">{formatCurrency(budget.totalPaid)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Remaining</p>
                  <p className="font-bold text-text-primary">
                    {formatCurrency((budget.currentExpectedCost ?? 0) - budget.totalPaid)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={submitting || !form.title || !form.amount} className="w-full">
            {submitting ? "Creating..." : "Create Payment Request"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Payment Card ───────────────────────────────────────────────────────────

function PaymentCard({ payment }: { payment: PaymentRequest }) {
  const [expanded, setExpanded] = useState(false);
  const config = STATUS_CONFIG[payment.status] || STATUS_CONFIG.requested;
  const milestoneLabel = MILESTONES.find(m => m.value === payment.milestone)?.label;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-text-primary">{payment.title}</h3>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                {config.icon} {config.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
              <span className="font-semibold text-text-primary">{formatCurrency(payment.amount)}</span>
              {milestoneLabel && <span>Linked: {milestoneLabel}</span>}
              <span>{new Date(payment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
            </div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="p-1 rounded hover:bg-surface-alt">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {payment.description && (
          <p className="text-sm text-text-secondary mb-2">{payment.description}</p>
        )}

        {/* Homeowner view preview */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-3">
          <p className="text-xs font-semibold text-blue-800 mb-1">HOMEOWNER SEES:</p>
          <p className="text-sm text-blue-700">
            &quot;Payment of <strong>{formatCurrency(payment.amount)}</strong> requested for <strong>{payment.title}</strong>
            {milestoneLabel ? ` (linked to ${milestoneLabel} milestone)` : ""}.
            {payment.notes ? ` ${payment.notes}` : ""}&quot;
          </p>
        </div>

        {expanded && (
          <div className="space-y-2 pt-3 border-t border-border">
            {payment.totalPaidSoFar !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Total paid before this request</span>
                <span className="font-medium">{formatCurrency(payment.totalPaidSoFar)}</span>
              </div>
            )}
            {payment.budgetRemaining !== null && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Remaining budget after approval</span>
                <span className="font-medium">{formatCurrency(payment.budgetRemaining)}</span>
              </div>
            )}
            {payment.evidenceCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <FileText className="h-3 w-3" />
                {payment.evidenceCount} supporting evidence items
              </div>
            )}
            {payment.approvedAt && (
              <p className="text-xs text-green-600">
                Approved: {new Date(payment.approvedAt).toLocaleDateString("en-IN")}
              </p>
            )}
            {payment.paidAt && (
              <p className="text-xs text-green-600">
                Paid: {new Date(payment.paidAt).toLocaleDateString("en-IN")}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0) setSelectedProjectId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    Promise.all([
      fetch(`/api/projects/${selectedProjectId}/payments`).then(r => r.ok ? r.json() : []),
      fetch(`/api/projects/${selectedProjectId}/budget`).then(r => r.ok ? r.json() : null),
    ]).then(([paymentsData, budgetData]) => {
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setBudget(budgetData);
    }).catch(() => {});
  }, [selectedProjectId, showCreate]);

  const totalRequested = payments.filter(p => p.status === "requested").reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/engineer" className="flex items-center gap-1 text-sm text-text-muted hover:text-primary mb-2">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Payment Transparency</h1>
            <p className="text-sm text-text-muted mt-1">
              Create payment requests linked to milestones. Homeowners see WHY they are being asked for money.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            {payments.length} payment{payments.length !== 1 ? "s" : ""}
          </span>
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

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center">
            <DollarSign className="h-5 w-5 text-text-muted mx-auto mb-1" />
            <p className="text-xs text-text-muted">Total Paid</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Clock className="h-5 w-5 text-text-muted mx-auto mb-1" />
            <p className="text-xs text-text-muted">Pending Requests</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(totalRequested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <CreditCard className="h-5 w-5 text-text-muted mx-auto mb-1" />
            <p className="text-xs text-text-muted">Total Requests</p>
            <p className="text-lg font-bold text-text-primary">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Payment Request
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && selectedProjectId && (
        <div className="mb-6">
          <CreatePaymentForm
            projectId={selectedProjectId}
            budget={budget}
            onCreated={() => setShowCreate(false)}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Payment List */}
      {payments.length === 0 ? (
        <EmptyState
          title="No payment requests yet"
          description="Create your first payment request to begin transparent milestone-based billing."
        />
      ) : (
        <div className="space-y-4">
          {payments.map(p => (
            <PaymentCard key={p.id} payment={p} />
          ))}
        </div>
      )}

      {/* Explanation */}
      <Card className="mt-8">
        <CardContent className="py-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-text-muted">
              <p className="font-medium text-text-primary mb-1">How Payment Transparency works</p>
              <p>
                Every payment request is linked to a specific construction milestone. Homeowners see exactly
                WHY they are being asked for money — which milestone, what evidence supports it, and how
                it relates to the overall budget. This eliminates the common construction problem of
                unexplained payment demands.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
