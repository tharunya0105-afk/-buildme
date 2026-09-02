"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Camera,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/layout/EmptyState";
import { CONSTRUCTION_STAGES } from "@/lib/types";

interface Inspection {
  id: string;
  inspectionDate: string;
  stage: string | null;
  notes: string | null;
  project: {
    id: string;
    name: string;
    address: string;
    city: string | null;
  };
  _count: {
    photos: number;
  };
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inspections?limit=50")
      .then((res) => res.json())
      .then((data) => {
        setInspections(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStageLabel = (stage: string | null) => {
    if (!stage) return "—";
    return CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading inspections...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Inspections</h2>
        <p className="text-sm text-text-secondary mt-1">
          Site inspection records and photo documentation
        </p>
      </div>

      {inspections.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={<ClipboardCheck className="h-8 w-8 text-text-muted" />}
              title="No inspections recorded"
              description="Start a site visit from a project page to record inspection notes, capture photos, and document construction progress."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inspections.map((inspection) => (
            <Link
              key={inspection.id}
              href={`/engineer/inspections/${inspection.id}`}
            >
              <Card hover>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-alt">
                        <ClipboardCheck className="h-6 w-6 text-text-muted" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-text-primary">
                            {inspection.project.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-text-muted mt-0.5">
                          <span>{formatDate(inspection.inspectionDate)}</span>
                          <span>·</span>
                          <span>{getStageLabel(inspection.stage)}</span>
                          <span>·</span>
                          <div className="flex items-center gap-1">
                            <Camera className="h-3.5 w-3.5" />
                            <span>
                              {inspection._count.photos} photo
                              {inspection._count.photos !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        {inspection.notes && (
                          <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                            {inspection.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-text-muted flex-shrink-0" />
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
