"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LocationPicker } from "@/components/maps/LocationPicker";
import {
  CONSTRUCTION_TYPES,
  CONSTRUCTION_STAGES,
  ConstructionType,
  ConstructionStage,
} from "@/lib/types";

export default function NewSitePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    homeownerName: "",
    homeownerEmail: "",
    address: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    constructionType: "" as ConstructionType | "",
    builtArea: "",
    currentStage: "" as ConstructionStage | "",
    expectedCompletion: "",
    estimatedCost: "",
    engineerNotes: "",
  });

  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    formattedAddress: string;
  }>({
    latitude: null,
    longitude: null,
    formattedAddress: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationSelect = (loc: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
  }) => {
    setLocation(loc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Site name is required");
      setLoading(false);
      return;
    }
    if (!formData.homeownerName.trim()) {
      setError("Homeowner name is required");
      setLoading(false);
      return;
    }
    if (!formData.homeownerEmail.trim()) {
      setError("Homeowner email is required");
      setLoading(false);
      return;
    }
    if (!formData.address.trim()) {
      setError("Construction address is required");
      setLoading(false);
      return;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      setLoading(false);
      return;
    }
    if (!formData.constructionType) {
      setError("Construction type is required");
      setLoading(false);
      return;
    }
    if (!formData.currentStage) {
      setError("Current construction stage is required");
      setLoading(false);
      return;
    }

    // Get progress from stage
    const stageData = CONSTRUCTION_STAGES.find(
      (s) => s.value === formData.currentStage
    );
    const progress = stageData ? stageData.progress : 0;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },          body: JSON.stringify({
            name: formData.name.trim(),
            address: formData.address.trim(),
            city: formData.city.trim(),
            district: formData.district.trim() || null,
            state: formData.state.trim() || null,
            pincode: formData.pincode.trim() || null,
            constructionType: formData.constructionType,
          builtArea: formData.builtArea ? parseFloat(formData.builtArea) : null,
          currentStage: formData.currentStage,
          progress,
          latitude: location.latitude,
          longitude: location.longitude,
          formattedAddress: location.formattedAddress || formData.address,
          homeownerName: formData.homeownerName.trim(),
          homeownerEmail: formData.homeownerEmail.trim(),
          expectedCompletion: formData.expectedCompletion || null,
          estimatedCost: formData.estimatedCost
            ? parseFloat(formData.estimatedCost)
            : null,
          engineerNotes: formData.engineerNotes.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create site");
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect after brief delay to show success
      setTimeout(() => {
        router.push(`/engineer/sites/${data.id}`);
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle className="h-16 w-16 text-status-normal mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Construction site created successfully.
            </h2>
            <p className="text-text-secondary">
              Redirecting to your new site...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/engineer/sites"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sites
        </Link>
        <h2 className="text-2xl font-bold text-text-primary">
          Add Construction Site
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Enter the details for your new construction site.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-status-review-bg border border-status-review-border text-sm text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Site Information
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Site Name *"
              type="text"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., Villa Al Wasl - Unit 5"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Homeowner Name *"
                type="text"
                value={formData.homeownerName}
                onChange={(e) => updateField("homeownerName", e.target.value)}
                placeholder="Full name"
                required
              />
              <Input
                label="Homeowner Email *"
                type="email"
                value={formData.homeownerEmail}
                onChange={(e) => updateField("homeownerEmail", e.target.value)}
                placeholder="homeowner@example.com"
                required
              />
            </div>

            <Input
              label="Construction Address *"
              type="text"
              value={formData.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Street address"
              required
            />

            <Input
              label="City *"
              type="text"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="City"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="District"
                type="text"
                value={formData.district}
                onChange={(e) => updateField("district", e.target.value)}
                placeholder="District"
              />
              <Input
                label="State"
                type="text"
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                placeholder="State"
              />
              <Input
                label="Pincode"
                type="text"
                value={formData.pincode}
                onChange={(e) => updateField("pincode", e.target.value)}
                placeholder="Pincode"
              />
            </div>
          </CardContent>
        </Card>

        {/* Construction Details */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Construction Details
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Construction Type *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONSTRUCTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField("constructionType", type.value)}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors text-center ${
                      formData.constructionType === type.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-text-secondary hover:border-border-strong hover:bg-surface-alt"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Approximate Built-up Area (sq ft)"
              type="number"
              value={formData.builtArea}
              onChange={(e) => updateField("builtArea", e.target.value)}
              placeholder="e.g., 2500"
              min="0"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Current Construction Stage *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONSTRUCTION_STAGES.map((stage) => (
                  <button
                    key={stage.value}
                    type="button"
                    onClick={() => updateField("currentStage", stage.value)}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors text-center ${
                      formData.currentStage === stage.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-text-secondary hover:border-border-strong hover:bg-surface-alt"
                    }`}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Site Location
            </h3>
          </CardHeader>
          <CardContent>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLatitude={location.latitude}
              initialLongitude={location.longitude}
              initialAddress={location.formattedAddress}
            />
          </CardContent>
        </Card>

        {/* Optional Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Additional Information
            </h3>
            <p className="text-sm text-text-muted mt-1">Optional</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Expected Completion Date"
              type="date"
              value={formData.expectedCompletion}
              onChange={(e) => updateField("expectedCompletion", e.target.value)}
            />

            <Input
              label="Estimated Project Cost"
              type="number"
              value={formData.estimatedCost}
              onChange={(e) => updateField("estimatedCost", e.target.value)}
              placeholder="e.g., 500000"
              min="0"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-text-primary">
                Engineer Notes
              </label>
              <textarea
                value={formData.engineerNotes}
                onChange={(e) => updateField("engineerNotes", e.target.value)}
                placeholder="Any additional notes about this project..."
                rows={3}
                className="block w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/engineer/sites">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Construction Site"}
          </Button>
        </div>
      </form>
    </div>
  );
}
