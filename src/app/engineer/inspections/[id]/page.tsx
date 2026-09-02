"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ClipboardCheck,
  User,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PhotoGallery } from "@/components/photos/PhotoGallery";
import { CONSTRUCTION_STAGES } from "@/lib/types";

interface InspectionDetail {
  id: string;
  inspectionDate: string;
  stage: string | null;
  notes: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
    address: string;
    city: string | null;
  };
  engineer: {
    id: string;
    name: string;
    email: string;
  };
  photos: Array<{
    id: string;
    fileUrl: string;
    fileName: string | null;
    latitude: number | null;
    longitude: number | null;
    timestamp: string;
    createdAt: string;
  }>;
}

export default function InspectionDetailPage() {
  const params = useParams();
  const [inspection, setInspection] = useState<InspectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/inspections/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load inspection");
        return res.json();
      })
      .then((data) => {
        setInspection(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStageLabel = (stage: string | null) => {
    if (!stage) return "—";
    return CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading inspection...</div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="text-center py-20">
        <p className="text-danger mb-4">{error || "Inspection not found"}</p>
        <Link href="/engineer/sites">
          <Button variant="secondary">Back to Sites</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/engineer/sites/${inspection.project.id}`}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Site
        </Link>

        <h2 className="text-2xl font-bold text-text-primary">
          Inspection — {formatDate(inspection.inspectionDate)}
        </h2>

        <div className="flex items-center gap-4 text-sm text-text-secondary mt-2">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{inspection.project.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatTime(inspection.inspectionDate)}</span>
          </div>
        </div>
      </div>

      {/* Inspection info */}
      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-text-muted mb-1">Date</p>
              <p className="text-sm font-medium text-text-primary">
                {formatDate(inspection.inspectionDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Time</p>
              <p className="text-sm font-medium text-text-primary">
                {formatTime(inspection.inspectionDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Stage</p>
              <p className="text-sm font-medium text-text-primary">
                {getStageLabel(inspection.stage)}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted mb-1">Photos</p>
              <p className="text-sm font-medium text-text-primary">
                {inspection.photos.length}
              </p>
            </div>
          </div>

          {inspection.notes && (
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm font-medium text-text-primary mb-2">
                Engineer Notes
              </p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {inspection.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engineer info */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {inspection.engineer.name}
              </p>
              <p className="text-xs text-text-muted">
                Recorded on {formatDate(inspection.inspectionDate)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">
            Site Photos
          </h3>
          <p className="text-sm text-text-muted">
            {inspection.photos.length} photo
            {inspection.photos.length !== 1 ? "s" : ""} captured during this
            inspection
          </p>
        </CardHeader>
        <CardContent>
          <PhotoGallery photos={inspection.photos} />
        </CardContent>
      </Card>
    </div>
  );
}
