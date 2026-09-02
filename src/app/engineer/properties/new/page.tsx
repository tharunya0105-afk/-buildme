"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Search } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LocationPicker } from "@/components/maps/LocationPicker";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/property/types";

export default function NewPropertyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    propertyType: "" as PropertyType | "",
    builtArea: "",
    floors: "",
    propertyAge: "",
    constructionYear: "",
    address: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    askingPrice: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
    constructionType: "",
    notes: "",
  });

  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    formattedAddress: string;
  }>({ latitude: null, longitude: null, formattedAddress: "" });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.name.trim()) {
      setError("Property name is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          propertyType: formData.propertyType || null,
          builtArea: formData.builtArea || null,
          floors: formData.floors || null,
          propertyAge: formData.propertyAge || null,
          constructionYear: formData.constructionYear || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          district: formData.district.trim() || null,
          state: formData.state.trim() || null,
          pincode: formData.pincode.trim() || null,
          latitude: location.latitude,
          longitude: location.longitude,
          formattedAddress: location.formattedAddress || formData.address,
          askingPrice: formData.askingPrice || null,
          bedrooms: formData.bedrooms || null,
          bathrooms: formData.bathrooms || null,
          parking: formData.parking || null,
          constructionType: formData.constructionType || null,
          notes: formData.notes.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to create property");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/engineer/properties/${data.id}`), 1500);
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
            <h2 className="text-2xl font-bold text-text-primary mb-2">Property Added</h2>
            <p className="text-text-secondary">Redirecting to property evaluation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/engineer/properties" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Link>
        <h2 className="text-2xl font-bold text-text-primary">Add Property for Evaluation</h2>
        <p className="text-sm text-text-secondary mt-1">Enter details about the property you&apos;re considering.</p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-status-review-bg border border-status-review-border text-sm text-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Property Information</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Property Name *" type="text" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g., Green Valley Residence" required />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">Property Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PROPERTY_TYPES.map((type) => (
                  <button key={type.value} type="button" onClick={() => updateField("propertyType", type.value)}
                    className={`p-3 rounded-md border text-sm font-medium transition-colors text-center ${formData.propertyType === type.value ? "border-primary bg-primary/5 text-primary" : "border-border text-text-secondary hover:border-border-strong hover:bg-surface-alt"}`}>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Built-up Area (sq ft)" type="number" value={formData.builtArea} onChange={(e) => updateField("builtArea", e.target.value)} placeholder="e.g., 2000" min="0" />
              <Input label="Floors" type="number" value={formData.floors} onChange={(e) => updateField("floors", e.target.value)} placeholder="e.g., 2" min="0" />
              <Input label="Property Age (years)" type="number" value={formData.propertyAge} onChange={(e) => updateField("propertyAge", e.target.value)} placeholder="e.g., 10" min="0" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Construction Year" type="number" value={formData.constructionYear} onChange={(e) => updateField("constructionYear", e.target.value)} placeholder="e.g., 2016" min="1900" />
              <Input label="Bedrooms" type="number" value={formData.bedrooms} onChange={(e) => updateField("bedrooms", e.target.value)} placeholder="e.g., 3" min="0" />
              <Input label="Bathrooms" type="number" value={formData.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} placeholder="e.g., 2" min="0" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Asking Price" type="number" value={formData.askingPrice} onChange={(e) => updateField("askingPrice", e.target.value)} placeholder="e.g., 5000000" min="0" />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-text-primary">Parking</label>
                <select value={formData.parking} onChange={(e) => updateField("parking", e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary">
                  <option value="">Not specified</option>
                  <option value="yes">Available</option>
                  <option value="covered">Covered</option>
                  <option value="open">Open</option>
                  <option value="no">Not available</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Property Location</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Address" type="text" value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Street address" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="City" type="text" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" />
              <Input label="District" type="text" value={formData.district} onChange={(e) => updateField("district", e.target.value)} placeholder="District" />
              <Input label="State" type="text" value={formData.state} onChange={(e) => updateField("state", e.target.value)} placeholder="State" />
              <Input label="Pincode" type="text" value={formData.pincode} onChange={(e) => updateField("pincode", e.target.value)} placeholder="Pincode" />
            </div>
            <LocationPicker onLocationSelect={setLocation} initialLatitude={location.latitude} initialLongitude={location.longitude} initialAddress={location.formattedAddress} />
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Additional Notes</h3>
            <p className="text-sm text-text-muted mt-1">Optional</p>
          </CardHeader>
          <CardContent>
            <textarea value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Any additional notes about this property..." rows={3}
              className="block w-full rounded-md border border-border px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary" />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-8">
          <Link href="/engineer/properties">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Property"}
          </Button>
        </div>
      </form>
    </div>
  );
}
