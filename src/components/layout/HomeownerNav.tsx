"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, Clock, HardHat } from "lucide-react";

const navigation = [
  { name: "My Home", href: "/homeowner", icon: Home },
  { name: "Updates", href: "/homeowner/updates", icon: Bell },
  { name: "Timeline", href: "/homeowner/timeline", icon: Clock },
];

export function HomeownerNav() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <HardHat className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold text-text-primary">BuildMe</span>
      </div>

      <nav className="mt-4 px-3">
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
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
    </aside>
  );
}
