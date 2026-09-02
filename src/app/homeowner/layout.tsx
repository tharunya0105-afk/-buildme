"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeownerNav } from "@/components/layout/HomeownerNav";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default function HomeownerLayout({
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
  if (role !== "homeowner") {
    router.push(role === "engineer" ? "/engineer" : "/auth/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-alt">
      <HomeownerNav />
      <div className="pl-64">
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
