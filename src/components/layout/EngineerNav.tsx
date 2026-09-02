"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin, Settings, HardHat, Crosshair, DollarSign,
  FileText, Target, Brain, Rocket, TrendingUp, Camera,
  CreditCard,
} from "lucide-react";

interface NavSection {
  label: string;
  items: Array<{ name: string; href: string; icon: React.ElementType }>;
}

const sections: NavSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { name: "CEDI Demo", href: "/engineer/cedi-demo", icon: Rocket },
      { name: "Project Truth", href: "/engineer/truth", icon: Target },
    ],
  },
  {
    label: "PLAN",
    items: [
      { name: "Quotation Intel", href: "/engineer/quotations", icon: FileText },
      { name: "Cost Intelligence", href: "/engineer/cost-intelligence", icon: DollarSign },
      { name: "Design-to-Cost", href: "/engineer/design-to-cost", icon: TrendingUp },
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
    label: "ADMIN",
    items: [
      { name: "Pilot Center", href: "/engineer/pilots", icon: Rocket },
      { name: "Settings", href: "/engineer/settings", icon: Settings },
    ],
  },
];

export function EngineerNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/engineer") return pathname === "/engineer";
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r border-border bg-white flex flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <HardHat className="h-4 w-4 text-white" />
        </div>
        <span className="text-title font-bold text-text-primary tracking-tight">BuildMe</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section, sIdx) => (
          <div key={section.label} className={sIdx > 0 ? "mt-6" : ""}>
            <p className="text-overline text-text-muted px-3 mb-2">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
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

      {/* Footer */}
      <div className="border-t border-border px-5 py-3">
        <p className="text-micro text-text-muted leading-tight">
          Construction Intelligence
        </p>
      </div>
    </aside>
  );
}
