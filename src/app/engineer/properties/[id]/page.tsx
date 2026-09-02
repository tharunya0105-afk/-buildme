"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Calendar, DollarSign, Building2, Camera, FileText,
  ClipboardCheck, AlertTriangle, CheckCircle, Clock, HelpCircle, Upload,
  Sparkles, Download, Loader2, ChevronDown, ChevronUp, Shield,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { CONSTRUCTION_TYPES } from "@/lib/types";
import {
  PROPERTY_TYPES, PHOTO_CATEGORIES, DOCUMENT_TYPES,
  CONDITION_LEVEL_LABELS, CONDITION_LEVEL_COLORS, CONDITION_LEVEL_BG,
  ISSUE_TYPE_LABELS, SEVERITY_LABELS, SEVERITY_COLORS,
  type PropertyConditionLevel, type IssueSeverity,
} from "@/lib/property/types";
import { generateBuyerQuestions } from "@/lib/property/condition-score";

interface PropertyDetail {
  id: string;
  name: string;
  propertyType: string | null;
  builtArea: number | null;
  floors: number | null;
  propertyAge: number | null;
  constructionYear: number | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  formattedAddress: string | null;
  askingPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: string | null;
  constructionType: string | null;
  conditionLevel: string;
  conditionScore: number;
  conditionReasons: Array<{ factor: string; description: string; severity: string }>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  inspections: Array<{
    id: string;
    inspectionDate: string;
    notes: string | null;
    photos: Array<{ id: string; fileUrl: string; fileName: string | null; category: string | null }>;
    _count: { photos: number };
  }>;
  photos: Array<{ id: string; fileUrl: string; fileName: string | null; category: string | null; inspectionId: string | null; createdAt: string }>;
  documents: Array<{ id: string; fileName: string; fileUrl: string; documentType: string; verificationStatus: string; notes: string | null; createdAt: string }>;
  analyses: Array<{
    id: string;
    conditionLevel: string;
    conditionScore: number;
    summary: string | null;
    structuredResult: string;
    createdAt: string;
    photoAnalyses: Array<{
      id: string;
      issueType: string;
      description: string;
      confidence: number;
      severity: string;
      recommendation: string | null;
      photo: { id: string; fileUrl: string; category: string | null };
    }>;
  }>;
  checklist: Array<{ id: string; category: string; item: string; completed: boolean; notes: string | null }>;
  _count: { inspections: number; photos: number; documents: number; analyses: number };
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("exterior");
  const [questionsExpanded, setQuestionsExpanded] = useState(false);
  const [reportExpanded, setReportExpanded] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; label: string } | null>(null);

  const fetchProperty = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/properties/${params.id}`);
      if (!res.ok) throw new Error("Failed to load property");
      const data = await res.json();
      setProperty(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load property");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchProperty(); }, [fetchProperty]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const formatShortDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const formatPrice = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

  const getTypeLabel = (type: string | null) => {
    if (!type) return "Property";
    return PROPERTY_TYPES.find((t) => t.value === type)?.label || type;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhoto(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", selectedCategory);

      try {
        await fetch(`/api/properties/${params.id}/photos`, { method: "POST", body: formData });
      } catch {
        console.error("Upload failed");
      }
    }
    setUploadingPhoto(false);
    fetchProperty();
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", docType);

    try {
      await fetch(`/api/properties/${params.id}/documents`, { method: "POST", body: formData });
    } catch {
      console.error("Upload failed");
    }
    setUploadingDoc(false);
    fetchProperty();
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/properties/${params.id}/analyze`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Analysis failed");
        return;
      }
      fetchProperty();
    } catch {
      alert("Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChecklistToggle = async (checklistId: string, completed: boolean) => {
    try {
      await fetch(`/api/properties/${params.id}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistId, completed: !completed }),
      });
      fetchProperty();
    } catch {
      console.error("Failed to update checklist");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-text-secondary">Loading property...</div></div>;
  if (error || !property) return <div className="text-center py-20"><p className="text-danger mb-4">{error || "Property not found"}</p><Link href="/engineer/properties"><Button variant="secondary">Back to Properties</Button></Link></div>;

  // Group photos by category
  const photosByCategory: Record<string, typeof property.photos> = {};
  for (const photo of property.photos) {
    const cat = photo.category || "uncategorized";
    if (!photosByCategory[cat]) photosByCategory[cat] = [];
    photosByCategory[cat].push(photo);
  }

  // Get all issues from analyses
  const allIssues = property.analyses.flatMap(a => a.photoAnalyses);

  // Group checklist by category
  const checklistByCategory: Record<string, typeof property.checklist> = {};
  for (const item of property.checklist) {
    if (!checklistByCategory[item.category]) checklistByCategory[item.category] = [];
    checklistByCategory[item.category].push(item);
  }

  const completedCount = property.checklist.filter(c => c.completed).length;
  const totalCount = property.checklist.length;

  // Generate buyer questions
  const buyerQuestions = generateBuyerQuestions({
    propertyType: property.propertyType,
    propertyAge: property.propertyAge,
    constructionYear: property.constructionYear,
    floors: property.floors,
    parking: property.parking,
    conditionLevel: property.conditionLevel,
    totalIssues: allIssues.length,
    inspectedCategories: Object.keys(photosByCategory),
    documentsUploaded: property.documents.length,
  });

  const latestAnalysis = property.analyses.length > 0 ? property.analyses[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/engineer/properties" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-text-primary">{property.name}</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${CONDITION_LEVEL_BG[property.conditionLevel as PropertyConditionLevel] || "bg-surface-alt"} ${CONDITION_LEVEL_COLORS[property.conditionLevel as PropertyConditionLevel] || "text-text-muted"}`}>
                {CONDITION_LEVEL_LABELS[property.conditionLevel as PropertyConditionLevel] || "Unknown"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <MapPin className="h-4 w-4" />
              <span>{property.address || "No address"}{property.city ? `, ${property.city}` : ""}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAnalyze} disabled={analyzing || property.photos.length === 0}>
              {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {analyzing ? "Analyzing..." : "Analyze Property"}
            </Button>
          </div>
        </div>
      </div>

      {/* Condition Score */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-6">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full flex-shrink-0 ${CONDITION_LEVEL_BG[property.conditionLevel as PropertyConditionLevel] || "bg-surface-alt"}`}>
              <div className="text-center">
                <p className={`text-2xl font-bold ${CONDITION_LEVEL_COLORS[property.conditionLevel as PropertyConditionLevel] || "text-text-muted"}`}>{property.conditionScore}</p>
                <p className="text-xs text-text-muted">/100</p>
              </div>
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${CONDITION_LEVEL_COLORS[property.conditionLevel as PropertyConditionLevel] || "text-text-muted"}`}>
                {CONDITION_LEVEL_LABELS[property.conditionLevel as PropertyConditionLevel] || "Condition Unknown"}
              </h3>
              <p className="text-xs text-text-muted mt-1 mb-2">Property Condition Indicator — rule-based assessment, not a structural certification</p>
              {property.conditionReasons.length > 0 ? (
                <div className="space-y-1">
                  {property.conditionReasons.map((reason, i) => (
                    <p key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="text-text-muted mt-0.5">•</span>
                      {reason.description}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-status-normal">No visible concerns identified yet. Upload photos and run analysis for assessment.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Property Details */}
          <Card>
            <CardHeader><h3 className="text-lg font-semibold text-text-primary">Property Overview</h3></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Type", value: getTypeLabel(property.propertyType) },
                  { label: "Area", value: property.builtArea ? `${property.builtArea.toLocaleString()} sq ft` : "—" },
                  { label: "Floors", value: property.floors || "—" },
                  { label: "Age", value: property.propertyAge ? `${property.propertyAge} years` : "—" },
                  { label: "Year Built", value: property.constructionYear || "—" },
                  { label: "Bedrooms", value: property.bedrooms || "—" },
                  { label: "Bathrooms", value: property.bathrooms || "—" },
                  { label: "Parking", value: property.parking || "—" },
                  { label: "Asking Price", value: property.askingPrice ? formatPrice(property.askingPrice) : "—" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-text-muted">{item.label}</p>
                    <p className="text-sm font-medium text-text-primary">{item.value}</p>
                  </div>
                ))}
              </div>
              {property.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-text-primary mb-1">Notes</p>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{property.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader><h3 className="text-lg font-semibold text-text-primary">Location</h3></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {property.latitude && property.longitude && (
                  <div className="flex justify-between"><span className="text-text-muted">Coordinates</span><span className="text-text-primary font-mono text-xs">{property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}</span></div>
                )}
                {property.address && <div className="flex justify-between"><span className="text-text-muted">Address</span><span className="text-text-primary">{property.address}</span></div>}
                {property.city && <div className="flex justify-between"><span className="text-text-muted">City</span><span className="text-text-primary">{property.city}</span></div>}
                {property.district && <div className="flex justify-between"><span className="text-text-muted">District</span><span className="text-text-primary">{property.district}</span></div>}
                {property.state && <div className="flex justify-between"><span className="text-text-muted">State</span><span className="text-text-primary">{property.state}</span></div>}
                {property.pincode && <div className="flex justify-between"><span className="text-text-muted">Pincode</span><span className="text-text-primary">{property.pincode}</span></div>}
              </div>
              <div className="mt-3 text-xs text-text-muted">
                Spatial risk analysis will be available when verified geographic datasets are connected.
              </div>
            </CardContent>
          </Card>

          {/* Visual Inspection - Photos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Visual Inspection</h3>
                <span className="text-sm text-text-muted">{property.photos.length} photos</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary">
                  {PHOTO_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium cursor-pointer hover:bg-primary-dark transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploadingPhoto ? "Uploading..." : "Upload Photos"}
                  <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                </label>
              </div>

              {/* Photos by category */}
              {Object.keys(photosByCategory).length === 0 ? (
                <EmptyState icon={<Camera className="h-8 w-8 text-text-muted" />} title="No photos uploaded" description="Upload photos of the property to begin visual inspection." />
              ) : (
                Object.entries(photosByCategory).map(([category, photos]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-text-primary mb-2 capitalize">{category.replace(/_/g, " ")}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {photos.map((photo) => (
                        <button key={photo.id} onClick={() => setLightboxPhoto({ url: photo.fileUrl, label: `${category} — ${property.name}` })}
                          className="aspect-square rounded-lg overflow-hidden border border-border bg-surface-alt hover:ring-2 hover:ring-primary transition-all">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.fileUrl} alt={photo.fileName || "Photo"} className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* AI Findings */}
              {allIssues.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">AI-Detected Observations</h4>
                  <div className="space-y-2">
                    {allIssues.map((issue) => (
                      <div key={issue.id} className="p-3 rounded-lg border border-border bg-surface-alt">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{ISSUE_TYPE_LABELS[issue.issueType as keyof typeof ISSUE_TYPE_LABELS] || issue.issueType}</span>
                          <span className={`text-xs font-medium ${SEVERITY_COLORS[issue.severity as IssueSeverity] || "text-text-muted"}`}>{SEVERITY_LABELS[issue.severity as IssueSeverity] || issue.severity}</span>
                        </div>
                        <p className="text-sm text-text-secondary">{issue.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-text-muted">Confidence: {Math.round(issue.confidence * 100)}%</span>
                          {issue.recommendation && <span className="text-xs text-primary">{issue.recommendation}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Due-Diligence Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Before You Buy — Due-Diligence Checklist</h3>
                <span className="text-sm text-text-muted">{completedCount}/{totalCount} completed</span>
              </div>
              {totalCount > 0 && (
                <div className="h-2 bg-surface-alt rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(checklistByCategory).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-text-primary capitalize mb-2">{category}</h4>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <button key={item.id} onClick={() => handleChecklistToggle(item.id, item.completed)}
                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${item.completed ? "bg-status-normal-bg" : "hover:bg-surface-alt"}`}>
                        {item.completed ? <CheckCircle className="h-4 w-4 text-status-normal flex-shrink-0" /> : <div className="h-4 w-4 rounded-full border-2 border-border flex-shrink-0" />}
                        <span className={`text-sm ${item.completed ? "text-text-muted line-through" : "text-text-primary"}`}>{item.item}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Property Report */}
          <Card>
            <CardHeader>
              <button onClick={() => setReportExpanded(!reportExpanded)} className="flex items-center justify-between w-full">
                <h3 className="text-lg font-semibold text-text-primary">BuildMe Property Report</h3>
                {reportExpanded ? <ChevronUp className="h-5 w-5 text-text-muted" /> : <ChevronDown className="h-5 w-5 text-text-muted" />}
              </button>
            </CardHeader>
            {reportExpanded && (
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-surface-alt border border-border">
                  <p className="text-xs text-text-muted mb-3">This report distinguishes AI-generated observations from user-provided information. It is not a professional certification.</p>
                </div>

                {/* Property Overview */}
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Property Overview</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-text-muted">Location: </span><span className="text-text-primary">{property.city || property.address || "Not specified"}</span></div>
                    <div><span className="text-text-muted">Type: </span><span className="text-text-primary">{getTypeLabel(property.propertyType)}</span></div>
                    <div><span className="text-text-muted">Age: </span><span className="text-text-primary">{property.propertyAge ? `${property.propertyAge} years` : "Not specified"}</span></div>
                    <div><span className="text-text-muted">Area: </span><span className="text-text-primary">{property.builtArea ? `${property.builtArea} sq ft` : "Not specified"}</span></div>
                    <div><span className="text-text-muted">Asking Price: </span><span className="text-text-primary">{property.askingPrice ? formatPrice(property.askingPrice) : "Not specified"}</span></div>
                  </div>
                </div>

                {/* Condition Summary */}
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Condition Summary</h4>
                  <div className={`p-3 rounded-lg ${CONDITION_LEVEL_BG[property.conditionLevel as PropertyConditionLevel] || "bg-surface-alt"}`}>
                    <p className={`font-medium ${CONDITION_LEVEL_COLORS[property.conditionLevel as PropertyConditionLevel] || "text-text-muted"}`}>
                      {CONDITION_LEVEL_LABELS[property.conditionLevel as PropertyConditionLevel]} — Score: {property.conditionScore}/100
                    </p>
                  </div>
                </div>

                {/* Professional Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Professional Inspection Recommendations</h4>
                  <ul className="space-y-1 text-sm text-text-secondary">
                    <li className="flex items-start gap-2"><span className="text-text-muted">•</span>Consider a professional structural inspection before purchase</li>
                    <li className="flex items-start gap-2"><span className="text-text-muted">•</span>Verify electrical and plumbing systems with qualified professionals</li>
                    <li className="flex items-start gap-2"><span className="text-text-muted">•</span>Consult a legal professional for title and ownership verification</li>
                    {allIssues.filter(i => i.severity === "high").length > 0 && (
                      <li className="flex items-start gap-2"><span className="text-status-review">•</span><span className="text-status-review font-medium">{allIssues.filter(i => i.severity === "high").length} high-severity observation(s) require professional evaluation</span></li>
                    )}
                  </ul>
                </div>

                {/* Buyer Questions */}
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Questions to Ask the Seller</h4>
                  <div className="space-y-2">
                    {buyerQuestions.slice(0, 8).map((q, i) => (
                      <div key={i} className="p-2 rounded bg-surface-alt text-sm">
                        <p className="text-text-primary font-medium">{q.question}</p>
                        <p className="text-xs text-text-muted mt-0.5">{q.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader><h3 className="text-lg font-semibold text-text-primary">Summary</h3></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Photos</span><span className="text-sm font-medium text-text-primary">{property.photos.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Inspections</span><span className="text-sm font-medium text-text-primary">{property._count.inspections}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Documents</span><span className="text-sm font-medium text-text-primary">{property._count.documents}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">AI Analyses</span><span className="text-sm font-medium text-text-primary">{property._count.analyses}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Issues Found</span><span className={`text-sm font-medium ${allIssues.length > 0 ? "text-status-review" : "text-text-primary"}`}>{allIssues.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-sm text-text-secondary">Checklist</span><span className="text-sm font-medium text-text-primary">{completedCount}/{totalCount}</span></div>
            </CardContent>
          </Card>

          {/* Document Vault */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Document Vault</h3>
                <label className="text-xs text-primary cursor-pointer hover:underline">
                  + Upload
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={(e) => handleDocUpload(e, "other")} disabled={uploadingDoc} />
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {property.documents.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {property.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 p-2 rounded-md bg-surface-alt">
                      <FileText className="h-4 w-4 text-text-muted flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{doc.fileName}</p>
                        <p className="text-xs text-text-muted capitalize">{doc.documentType.replace(/_/g, " ")}</p>
                      </div>
                      <span className="text-xs text-text-muted">{doc.verificationStatus}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attention Items */}
          {allIssues.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-status-review" />
                  <h3 className="text-sm font-semibold text-text-primary">Attention Items</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {allIssues.filter(i => i.severity === "high").map((issue) => (
                  <div key={issue.id} className="p-2 rounded bg-status-review-bg border border-status-review-border">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] font-medium text-status-review">🔴 HIGH</span>
                    </div>
                    <p className="text-xs font-medium text-text-primary">{ISSUE_TYPE_LABELS[issue.issueType as keyof typeof ISSUE_TYPE_LABELS] || issue.issueType}</p>
                    <p className="text-[10px] text-text-muted">Confidence: {Math.round(issue.confidence * 100)}%</p>
                  </div>
                ))}
                {allIssues.filter(i => i.severity === "medium").slice(0, 3).map((issue) => (
                  <div key={issue.id} className="p-2 rounded bg-status-attention-bg border border-status-attention-border">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-[10px] font-medium text-status-attention">🟡 MEDIUM</span>
                    </div>
                    <p className="text-xs font-medium text-text-primary">{ISSUE_TYPE_LABELS[issue.issueType as keyof typeof ISSUE_TYPE_LABELS] || issue.issueType}</p>
                    <p className="text-[10px] text-text-muted">Confidence: {Math.round(issue.confidence * 100)}%</p>
                  </div>
                ))}
                <Link href="/engineer/ai-intelligence" className="inline-flex items-center gap-1 text-[11px] text-primary font-medium mt-1 hover:underline">
                  View All in AI Intelligence →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Engineer Review */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Engineer Review</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded bg-surface-alt">
                <p className="text-xs text-text-muted mb-2">Request a professional review of this property&apos;s AI observations and checklist status.</p>
                <div className="space-y-2">
                  {[
                    { label: "Not Requested", active: true },
                    { label: "Requested", active: false },
                    { label: "Under Review", active: false },
                    { label: "Reviewed", active: false },
                  ].map((status) => (
                    <div key={status.label} className="flex items-center gap-2 text-xs">
                      <div className={`h-3 w-3 rounded-full border-2 ${status.active ? "border-primary bg-primary" : "border-border"}`} />
                      <span className={status.active ? "text-primary font-medium" : "text-text-muted"}>{status.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button variant="secondary" className="w-full text-xs">
                Request Engineer Review
              </Button>
              <p className="text-[10px] text-text-muted">
                Prototype workflow — review tracking will connect to the backend in production.
              </p>
            </CardContent>
          </Card>

          {/* Property Timeline */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Property Activity</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 relative">
                <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
                {[
                  { time: "Today", text: "Property evaluation created", icon: Building2, color: "text-primary" },
                  { time: "Today", text: "14 photos uploaded", icon: Camera, color: "text-primary" },
                  { time: "Today", text: "AI analysis completed", icon: Sparkles, color: "text-primary" },
                  { time: "Yesterday", text: "Checklist started", icon: ClipboardCheck, color: "text-status-normal" },
                  { time: "Yesterday", text: "5 documents uploaded", icon: FileText, color: "text-primary" },
                ].map((event, i) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-border z-10">
                      <event.icon className={`h-2 w-2 ${event.color}`} />
                    </div>
                    <div>
                      <p className="text-[10px] text-text-muted">{event.time}</p>
                      <p className="text-xs text-text-primary">{event.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Spatial + Cost + AI Connections */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-text-primary">Intelligence Connections</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/engineer/spatial" className="flex items-center gap-2 p-2 rounded hover:bg-surface-alt transition-colors">
                <MapPin className="h-4 w-4 text-status-attention" />
                <div>
                  <p className="text-xs font-medium text-text-primary">Spatial Intelligence</p>
                  <p className="text-[10px] text-text-muted">{property.district ? `${property.district}, ${property.state || "Tamil Nadu"}` : "Location data not connected"}</p>
                </div>
              </Link>
              <Link href="/engineer/cost-intelligence" className="flex items-center gap-2 p-2 rounded hover:bg-surface-alt transition-colors">
                <DollarSign className="h-4 w-4 text-status-normal" />
                <div>
                  <p className="text-xs font-medium text-text-primary">Cost Intelligence</p>
                  <p className="text-[10px] text-text-muted">{property.builtArea ? `Est. ₹${Math.round(property.builtArea * 1800).toLocaleString()} (prototype)` : "Area needed for estimate"}</p>
                </div>
              </Link>
              <Link href="/engineer/ai-intelligence" className="flex items-center gap-2 p-2 rounded hover:bg-surface-alt transition-colors">
                <Sparkles className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-text-primary">AI Intelligence</p>
                  <p className="text-[10px] text-text-muted">{allIssues.length} observations detected</p>
                </div>
              </Link>
              <Link href="/engineer/evidence" className="flex items-center gap-2 p-2 rounded hover:bg-surface-alt transition-colors">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-text-primary">Evidence Center</p>
                  <p className="text-[10px] text-text-muted">Add observations to project evidence</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Cost Intelligence */}
          <Card>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Cost Intelligence</h3>
              <p className="text-xs text-text-muted">Coming soon — local construction cost, market data, and repair cost estimation will be available when verified datasets are connected.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightboxPhoto(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button onClick={() => setLightboxPhoto(null)} className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300">Close ✕</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxPhoto.url} alt={lightboxPhoto.label} className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />
            <p className="text-white text-sm text-center mt-2">{lightboxPhoto.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}
