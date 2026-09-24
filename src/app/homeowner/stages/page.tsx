"use client";

import { useEffect, useState } from "react";
import HomeownerStageView from "@/components/ui/HomeownerStageView";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Project {
  id: string;
  name: string;
}

export default function HomeownerStagesPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProject(data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/homeowner">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Structural Verification
            </h1>
            <p className="text-sm text-text-muted">
              {project ? project.name : "Your Home"} &middot; Stage & Concealment Transparency
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-5">
              <div className="skeleton h-4 w-24 rounded mb-2" />
              <div className="skeleton h-5 w-40 rounded mb-4" />
              <div className="skeleton h-6 w-32 rounded-full" />
            </div>
          ))}
        </div>
      ) : project ? (
        <HomeownerStageView projectId={project.id} />
      ) : (
        <div className="text-center py-12 text-text-muted">
          No project found. Once an engineer assigns you to a site, structural status will be verified here.
        </div>
      )}
    </div>
  );
}
