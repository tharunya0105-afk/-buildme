import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "BuildMe — Investor Deck",
};

export default function DeckLayout({ children }: { children: ReactNode }) {
  return <div className="bg-white text-text-primary">{children}</div>;
}
