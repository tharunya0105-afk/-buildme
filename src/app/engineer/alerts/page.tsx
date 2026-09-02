"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/layout/EmptyState";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Alerts</h2>
        <p className="text-sm text-text-secondary mt-1">
          Issues and attention items across your sites
        </p>
      </div>

      <Card>
        <CardContent className="py-16">
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8 text-text-muted" />}
            title="No active alerts"
            description="When AI-assisted analysis detects potential issues or your projects need attention, alerts will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
