"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, User, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function DashboardHeader() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-subtitle font-semibold text-text-primary">
            {user?.role === "engineer" ? "Engineer Portal" : "Homeowner Portal"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-muted hover:text-text-primary">
            <Bell className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-muted hover:text-text-primary">
            <Settings className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-text-primary">
              {user?.name || user?.email}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-text-muted hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
