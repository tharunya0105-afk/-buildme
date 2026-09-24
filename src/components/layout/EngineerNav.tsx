"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin, Settings, HardHat, Crosshair, DollarSign,
  FileText, Target, Brain, Rocket, TrendingUp, Camera,
  CreditCard, Menu, X, Layers, Activity, Briefcase, Award,
} from "lucide-react";

interface NavSection {
  label: string;
  items: Array<{ name: string; href: string; icon: React.ElementType }>;
}

const sections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { name: "Interactive Demo", href: "/engineer/interactive-demo", icon: Rocket },
      { name: "Project Truth", href: "/engineer/truth", icon: Target },
    ],
  },
  {
    label: "PLAN",
    items: [
      { name: "Quotation Intel", href: "/engineer/quotations", icon: FileText },
      { name: "Cost Intelligence", href: "/engineer/cost-intelligence", icon: DollarSign },
      { name: "Design-to-Cost", href: "/engineer/design-to-cost", icon: TrendingUp },
      { name: "Layout Studio", href: "/engineer/layouts", icon: Layers },
    ],
  },
  {
    label: "FIELD",
    items: [
      { name: "Sites", href: "/engineer/sites", icon: MapPin },
      { name: "Evidence", href: "/engineer/evidence", icon: Camera },
      { name: "AI Progress", href: "/engineer/ai-progress", icon: Brain },
    ],
  },
  {
    label: "MONEY",
    items: [
      { name: "Payments", href: "/engineer/payments", icon: CreditCard },
      { name: "Spatial", href: "/engineer/spatial", icon: Crosshair },
    ],
  },
  {
    label: "FUNDING & INVESTORS",
    items: [
      { name: "Investor Room", href: "/investors", icon: Briefcase },
      { name: "10-Slide Deck", href: "/deck", icon: FileText },
      { name: "Traction & Diligence", href: "/engineer/traction", icon: Activity },
      { name: "Program Readiness", href: "/engineer/program-readiness", icon: Award },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { name: "Pilot Center", href: "/engineer/pilots", icon: Rocket },
      { name: "Settings", href: "/engineer/settings", icon: Settings },
    ],
  },
];

function NavLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
        <HardHat className="h-4 w-4 text-white" />
      </div>
      <span className="text-title font-bold text-text-primary tracking-tight">BuildMe</span>
    </div>
  );
}

function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/engineer") return pathname === "/engineer";
    return pathname.startsWith(href);
  };
  return (
    <>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section, sIdx) => (
          <div key={section.label} className={sIdx > 0 ? "mt-6" : ""}>
            <p className="text-overline text-text-muted px-3 mb-2">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onItemClick}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive(item.href)
                        ? "bg-accent/10 text-accent"
                        : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                    }`}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-border px-5 py-3">
        <p className="text-micro text-text-muted leading-tight">Construction Intelligence</p>
        <p className="text-[10px] text-text-muted/60 mt-0.5">BuildMe · Pre-Launch</p>
      </div>
    </>
  );
}

export function EngineerNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ─── Desktop Sidebar (md+) ─────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-white flex-col">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
          <NavLogo />
        </div>
        <NavLinks />
      </aside>

      {/* ─── Mobile Top Bar (<md) ──────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-white/95 backdrop-blur-sm flex items-center justify-between px-4">
        <NavLogo />
        <button
          id="nav-hamburger"
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ─── Mobile Drawer ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-white flex flex-col shadow-2xl animate-fade-in">
            <div className="flex h-14 items-center justify-between border-b border-border px-5">
              <NavLogo />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg hover:bg-surface-alt transition-colors text-text-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks onItemClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
