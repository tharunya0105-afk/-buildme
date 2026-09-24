"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, Clock, HardHat, Menu, X, Box, ShieldCheck } from "lucide-react";

const navigation = [
  { name: "My Home", href: "/homeowner", icon: Home },
  { name: "Structural Stages", href: "/homeowner/stages", icon: ShieldCheck },
  { name: "Virtual Tour", href: "/homeowner/tour", icon: Box },
  { name: "Updates", href: "/homeowner/updates", icon: Bell },
  { name: "Timeline", href: "/homeowner/timeline", icon: Clock },
];

function NavLogo() {
  return (
    <div className="flex items-center gap-2">
      <HardHat className="h-6 w-6 text-primary" />
      <span className="text-lg font-semibold text-text-primary">BuildMe</span>
    </div>
  );
}

function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="mt-4 px-3 flex-1">
      <ul className="space-y-1">
        {navigation.map((item) => {
          const isActive =
            item.href === "/homeowner"
              ? pathname === "/homeowner"
              : pathname.startsWith(item.href);
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={onItemClick}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-surface-alt hover:text-text-primary"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function HomeownerNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ─── Desktop Sidebar (md+) ─────────────────────────────────── */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-white flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <NavLogo />
        </div>
        <NavLinks />
      </aside>

      {/* ─── Mobile Top Bar (<md) ──────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-white/95 backdrop-blur-sm flex items-center justify-between px-4">
        <NavLogo />
        <button
          id="homeowner-nav-hamburger"
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
