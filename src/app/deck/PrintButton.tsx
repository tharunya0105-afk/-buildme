"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-accent/90 print:hidden"
    >
      🖨 Print / Save as PDF
    </button>
  );
}
