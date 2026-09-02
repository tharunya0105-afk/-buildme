"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Camera, ClipboardCheck, FileText, MapPin, Building2,
  Plus, BarChart3, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  name: string;
  propertyType: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  builtArea: number | null;
  askingPrice: number | null;
  conditionLevel: string;
  conditionScore: number;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyAge: number | null;
  _count: {
    inspections: number;
    photos: number;
    documents: number;
  };
  createdAt: string;
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function PropertyComparePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properties")
      .then(res => res.json())
      .then((data: Property[]) => {
        const list = Array.isArray(data) ? data : [];
        setProperties(list);
        // Auto-select first 2 if available
        if (list.length >= 2) setSelectedIds([list[0].id, list[1].id]);
        else if (list.length === 1) setSelectedIds([list[0].id]);
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  const selectedProperties = properties.filter(p => selectedIds.includes(p.id));

  const toggleProperty = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/engineer/property-intelligence" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Property Intelligence
        </Link>
        <h2 className="text-2xl font-bold text-text-primary">Compare Properties</h2>
        <p className="text-sm text-text-secondary mt-1">
          Side-by-side comparison of property condition, area, documentation, and cost. Select 2–3 properties to compare.
        </p>
      </div>

      {/* Property Selector */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-text-primary">Select Properties to Compare (max 3)</h3>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-text-primary mb-1">No properties to compare.</p>
              <p className="text-xs text-text-muted mb-4">Add at least two properties to compare them.</p>
              <Link href="/engineer/properties/new"><Button><Plus className="h-4 w-4 mr-2" />Add Property</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {properties.map((prop) => {
                const isSelected = selectedIds.includes(prop.id);
                return (
                  <button
                    key={prop.id}
                    onClick={() => toggleProperty(prop.id)}
                    disabled={!isSelected && selectedIds.length >= 3}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50"
                    } ${!isSelected && selectedIds.length >= 3 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full border-2 ${isSelected ? "border-primary bg-primary" : "border-border"}`} />
                      <p className="text-sm font-semibold text-text-primary">{prop.name}</p>
                    </div>
                    <p className="text-xs text-text-muted">
                      {prop.propertyType || "Property"} • {prop.city || "No location"}
                    </p>
                    {prop.builtArea && (
                      <p className="text-xs text-text-muted">{prop.builtArea.toLocaleString()} sq ft</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {selectedProperties.length >= 2 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-text-primary">Comparison</h3>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs font-medium text-text-muted w-40">Attribute</th>
                    {selectedProperties.map(p => (
                      <th key={p.id} className="text-left py-2 text-xs font-medium text-text-primary">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Type</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p.propertyType || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">City</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p.city || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Built-up Area</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p.builtArea ? `${p.builtArea.toLocaleString()} sq ft` : "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Bedrooms</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p.bedrooms || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Bathrooms</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p.bathrooms || "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Age</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p.propertyAge ? `${p.propertyAge} years` : "—"}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Asking Price</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary font-medium">
                        {p.askingPrice ? formatPrice(p.askingPrice) : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Condition Level</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary capitalize">{p.conditionLevel}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Condition Score</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className={`py-2 font-medium ${
                        p.conditionScore >= 60 ? "text-status-review" :
                        p.conditionScore >= 30 ? "text-status-attention" : "text-status-normal"
                      }`}>
                        {p.conditionScore}/100
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Photos</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p._count.photos}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Inspections</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p._count.inspections}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 text-text-muted">Documents</td>
                    {selectedProperties.map(p => (
                      <td key={p.id} className="py-2 text-text-primary">{p._count.documents}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rate per sq ft comparison */}
            {selectedProperties.filter(p => p.builtArea && p.askingPrice).length >= 2 && (
              <div className="mt-4 p-3 rounded-lg bg-surface-alt border border-border">
                <p className="text-xs font-medium text-text-primary mb-2">Price per sq ft</p>
                <div className="space-y-1">
                  {selectedProperties.filter(p => p.builtArea && p.askingPrice).map(p => (
                    <div key={p.id} className="flex justify-between text-xs">
                      <span className="text-text-secondary">{p.name}</span>
                      <span className="text-text-primary font-medium">
                        ₹{Math.round((p.askingPrice || 0) / (p.builtArea || 1)).toLocaleString()}/sq ft
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 p-2 rounded bg-surface-alt border border-border">
              <p className="text-[10px] text-text-muted">
                Comparison is based on user-provided property data. Condition scores are rule-based indicators, not structural certifications.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Not enough properties */}
      {selectedProperties.length < 2 && properties.length >= 1 && (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-sm text-text-muted">Select at least two properties to compare them.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
