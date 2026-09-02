"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home,
  Plus,
  MapPin,
  Camera,
  FileText,
  ArrowRight,
  Search,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { CONDITION_LEVEL_LABELS, CONDITION_LEVEL_COLORS, CONDITION_LEVEL_BG } from "@/lib/property/types";
import type { PropertyConditionLevel } from "@/lib/property/types";

interface PropertyItem {
  id: string;
  name: string;
  propertyType: string | null;
  city: string | null;
  conditionLevel: string;
  conditionScore: number;
  askingPrice: number | null;
  createdAt: string;
  photos: { id: string; fileUrl: string; category: string | null }[];
  _count: { inspections: number; photos: number; documents: number; analyses: number };
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((data) => {
        setProperties(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getTypeLabel = (type: string | null) => {
    if (!type) return "Property";
    const labels: Record<string, string> = {
      house: "Independent House",
      villa: "Villa",
      apartment: "Apartment",
      independent: "Independent Floor",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">My Properties</h2>
          <p className="text-sm text-text-secondary mt-1">
            Properties you&apos;re evaluating for potential purchase
          </p>
        </div>
        <Link href="/engineer/properties/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      {properties.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<Home className="h-8 w-8 text-text-muted" />}
              title="No properties yet"
              description="Start evaluating a property by adding its details and uploading inspection photos."
              action={
                <div className="flex gap-3">
                  <Link href="/engineer/properties/new">
                    <Button>
                      <Search className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                  </Link>
                </div>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <Link key={property.id} href={`/engineer/properties/${property.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="py-4">
                  {/* Photo preview */}
                  {property.photos.length > 0 ? (
                    <div className="h-40 rounded-lg overflow-hidden mb-3 bg-surface-alt">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={property.photos[0].fileUrl}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-40 rounded-lg mb-3 bg-surface-alt flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-text-muted" />
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-text-primary">{property.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CONDITION_LEVEL_BG[property.conditionLevel as PropertyConditionLevel] || "bg-surface-alt"} ${CONDITION_LEVEL_COLORS[property.conditionLevel as PropertyConditionLevel] || "text-text-muted"}`}>
                      {property.conditionScore}/100
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-text-muted">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span>{getTypeLabel(property.propertyType)}</span>
                    </div>
                    {property.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{property.city}</span>
                      </div>
                    )}
                    {property.askingPrice && (
                      <p className="font-medium text-text-secondary">{formatPrice(property.askingPrice)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {property._count.photos} photos
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {property._count.documents} docs
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
