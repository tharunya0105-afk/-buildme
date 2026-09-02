"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EngineerNav } from "@/components/layout/EngineerNav";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function EngineerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const role = (session?.user as any)?.role;
  if (role !== "engineer") {
    router.push(role === "homeowner" ? "/homeowner" : "/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-alt">
      <EngineerNav />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
