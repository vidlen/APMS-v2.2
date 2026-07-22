import { useMemo } from "react";
import { Table2 } from "lucide-react";
import type { SectionData } from "@/lib/pci-utils";
import { parsePCIValue, pciCategories, countByCondition } from "@/lib/pci-utils";

interface StatsBarProps {
  sections: SectionData[];
  onOpenTable: () => void;
}

export default function StatsBar({ sections, onOpenTable }: StatsBarProps) {
  const stats = useMemo(() => {
    const total = sections.length;
    const avgPCI =
      sections.reduce((sum, s) => sum + parsePCIValue(s["PCI Rating"]), 0) /
      total;
    const counts = countByCondition(sections);
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    return { total, avgPCI: avgPCI.toFixed(1), dominant: dominant?.[0] || "N/A", counts };
  }, [sections]);

  const items = [
    { label: "Total Sections", value: stats.total, mono: true },
    { label: "Average PCI", value: stats.avgPCI, mono: true },
    { label: "Dominant Status", value: stats.dominant, mono: false },
  ];

  return (
    <div className="px-5 py-5 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">Overview</h2>
        <button
          onClick={onOpenTable}
          className="flex items-center gap-1.5 p-2 -m-2 rounded-sm text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          title="Browse all sections in a sortable table"
        >
          <Table2 size={13} />
          Table
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center gap-1.5 rounded-md border border-border bg-secondary px-2 py-3"
          >
            <div
              className={`text-foreground text-sm font-bold tabular-nums leading-tight ${item.mono ? "font-mono" : ""}`}
            >
              {item.value}
            </div>
            <div className="text-muted-foreground text-[11px] leading-tight">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Condition distribution across all sections */}
      <div className="mt-4">
        <div className="h-2.5 rounded-full overflow-hidden flex bg-border/40">
          {pciCategories.map((cat) => {
            const count = stats.counts[cat.label] ?? 0;
            if (count === 0 || stats.total === 0) return null;
            return (
              <div
                key={cat.label}
                title={`${cat.label}: ${count}`}
                className="h-full"
                style={{ width: `${(count / stats.total) * 100}%`, backgroundColor: cat.color }}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {pciCategories.map((cat) => {
            const count = stats.counts[cat.label] ?? 0;
            if (count === 0) return null;
            return (
              <div key={cat.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-foreground font-medium font-mono tabular-nums">{count}</span>
                <span>{cat.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
