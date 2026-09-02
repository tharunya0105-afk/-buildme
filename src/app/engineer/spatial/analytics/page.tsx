"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CONSTRUCTION_STAGES } from "@/lib/types";
import type { SpatialAnalytics } from "@/lib/spatial/types";

export default function SpatialAnalyticsPage() {
  const [analytics, setAnalytics] = useState<SpatialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/spatial/analytics")
      .then((res) => res.json())
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStageLabel = (stage: string) => {
    return CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-text-secondary">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary mb-4">Failed to load analytics</p>
        <Link href="/engineer/spatial">
          <Button variant="secondary">Back to Map</Button>
        </Link>
      </div>
    );
  }

  const maxDistrictCount = Math.max(
    ...analytics.projectsByDistrict.map((d) => d.count),
    1
  );
  const maxStageCount = Math.max(
    ...analytics.projectsByStage.map((s) => s.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-text-primary">
              Spatial Analytics
            </h2>
          </div>
          <p className="text-sm text-text-secondary">
            Geographic distribution and health metrics for your projects
          </p>
        </div>
        <Link href="/engineer/spatial">
          <Button variant="secondary">View Map</Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Total Projects</p>
                <p className="text-2xl font-bold text-text-primary">{analytics.totalProjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-normal-bg">
                <CheckCircle className="h-5 w-5 text-status-normal" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Low Attention</p>
                <p className="text-2xl font-bold text-status-normal">{analytics.lowAttentionSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-attention-bg">
                <Clock className="h-5 w-5 text-status-attention" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Medium Attention</p>
                <p className="text-2xl font-bold text-status-attention">{analytics.mediumAttentionSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-review-bg">
                <AlertTriangle className="h-5 w-5 text-status-review" />
              </div>
              <div>
                <p className="text-xs text-text-muted">High Attention</p>
                <p className="text-2xl font-bold text-status-review">{analytics.highAttentionSites}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-status-attention-bg">
                <MapPin className="h-5 w-5 text-status-attention" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Overdue Inspections</p>
                <p className="text-2xl font-bold text-status-attention">{analytics.overdueInspections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects by District */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Projects by District
            </h3>
            <p className="text-sm text-text-muted">
              Geographic distribution of your construction sites
            </p>
          </CardHeader>
          <CardContent>
            {analytics.projectsByDistrict.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                No district data available
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.projectsByDistrict.map((item) => (
                  <div key={item.district} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-primary font-medium">{item.district}</span>
                      <span className="text-text-muted">{item.count}</span>
                    </div>
                    <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.count / maxDistrictCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects by Stage */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">
              Projects by Construction Stage
            </h3>
            <p className="text-sm text-text-muted">
              Current progress distribution across all sites
            </p>
          </CardHeader>
          <CardContent>
            {analytics.projectsByStage.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">
                No stage data available
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.projectsByStage.map((item) => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-primary font-medium">
                        {getStageLabel(item.stage)}
                      </span>
                      <span className="text-text-muted">{item.count}</span>
                    </div>
                    <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-light rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.count / maxStageCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location Intelligence Foundation */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">
            Location Intelligence
          </h3>
          <p className="text-sm text-text-muted">
            External spatial datasets — coming soon
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Construction Cost Index",
                description: "Regional material and labor cost variations",
                status: "Planned",
              },
              {
                title: "Weather & Climate",
                description: "Rainfall, temperature, and monsoon data by location",
                status: "Planned",
              },
              {
                title: "Terrain & Flood Risk",
                description: "Soil type, elevation, flood zones, and seismic data",
                status: "Planned",
              },
              {
                title: "Infrastructure Access",
                description: "Proximity to hospitals, schools, markets, highways",
                status: "Planned",
              },
              {
                title: "Material Price Trends",
                description: "Steel, cement, sand price variations by district",
                status: "Planned",
              },
              {
                title: "Building Regulations",
                description: "Local building codes and environmental factors",
                status: "Planned",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-4 rounded-lg border border-border bg-surface-alt"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-text-primary">
                    {item.title}
                  </h4>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-text-muted">{item.description}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-4">
            These spatial datasets will enrich project analysis with location-aware insights.
            Integration architecture is in place — data will be added as external sources become available.
          </p>
        </CardContent>
      </Card>

      {/* Future ML Feature Vector */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">
            ML Feature Architecture
          </h3>
          <p className="text-sm text-text-muted">
            Future AI/ML feature vector — architecture foundation, not active model
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border border-border bg-surface-alt">
            <p className="text-xs text-text-muted mb-3">
              The following feature vector architecture is prepared for future ML model integration.
              Currently uses rule-based scoring only.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                "Latitude",
                "Longitude",
                "District",
                "State",
                "Construction Type",
                "Built-up Area",
                "Construction Stage",
                "Days Since Creation",
                "Inspection Count",
                "Photo Count",
                "Open Alerts",
                "Progress %",
                "Local Cost Index",
                "Weather Risk",
                "Terrain Risk",
                "Infrastructure Score",
              ].map((feature) => (
                <div
                  key={feature}
                  className="text-xs px-2 py-1.5 rounded bg-white border border-border text-text-secondary"
                >
                  {feature}
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-3">
              Currently active: Core project features. External features marked as "Planned" above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
