"use client";

import Link from "next/link";
import { ArrowLeft, Printer, Building2 } from "lucide-react";

export default function PrintButton() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 print:hidden">
      <Link
        href="/investors"
        className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-text-primary shadow-lg border border-border hover:bg-slate-50 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Investor Room
      </Link>
      <Link
        href="/"
        className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-xs font-semibold text-text-primary shadow-lg border border-border hover:bg-slate-50 transition-colors"
      >
        <Building2 className="h-3.5 w-3.5" /> App Home
      </Link>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-accent/90 transition-all hover:scale-105"
      >
        <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
      </button>
    </div>
  );
}
