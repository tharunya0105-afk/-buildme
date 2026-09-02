"use client";

import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Settings</h2>
        <p className="text-sm text-text-secondary mt-1">
          Manage your account and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">
            Profile
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={user?.name || ""}
            disabled
          />
          <Input
            label="Email"
            type="email"
            value={user?.email || ""}
            disabled
          />
          <Input
            label="Role"
            type="text"
            value={user?.role === "engineer" ? "Civil Engineer" : "Homeowner"}
            disabled
          />
          <p className="text-sm text-text-muted">
            Profile editing will be available in a future update.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary">
            Notifications
          </h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">
            Notification preferences will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
