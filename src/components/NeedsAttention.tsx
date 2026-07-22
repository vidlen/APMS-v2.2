import { AlertTriangle } from "lucide-react";
import type { SectionData } from "@/lib/pci-utils";
import { parsePCIValue, getPCICategory, pciCategories } from "@/lib/pci-utils";

interface NeedsAttentionProps {
  sections: SectionData[];
  onSelect: (section: SectionData) => void;
}

const MAX_ITEMS = 5;

// A section "needs attention" once it falls below Satisfactory — i.e. Fair
// or worse on the same 7-band scale used everywhere else in the app.
const OK_LABELS = new Set(["Satisfactory", "Good"]);

export default function NeedsAttention({ sections, onSelect }: NeedsAttentionProps) {
  const flagged = sections
    .map((section) => {
      const pci = parsePCIValue(section["PCI Rating"]);
      return { section, pci, category: getPCICategory(pci) };
    })
    .filter((s) => !OK_LABELS.has(s.category.label))
    .sort((a, b) => a.pci - b.pci);

  if (flagged.length === 0) {
    return (
      <div className="px-5 py-5 border-b border-border">
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle size={14} className="text-muted-foreground" />
          Needs Attention
        </h2>
        <p className="text-muted-foreground text-xs">
          All sections are Satisfactory condition or better.
        </p>
      </div>
    );
  }

  const shown = flagged.slice(0, MAX_ITEMS);
  const remaining = flagged.length - shown.length;

  return (
    <div className="px-5 py-5 border-b border-border">
      <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <AlertTriangle size={14} className="text-destructive" />
        Needs Attention
      </h2>
      <div className="space-y-1.5">
        {shown.map(({ section, pci, category }) => (
          <button
            key={section.Section}
            onClick={() => onSelect(section)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md border border-border bg-secondary hover:bg-border/40 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div
              className="pci-swatch w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold font-mono tabular-nums shrink-0"
              style={{ backgroundColor: category.color, color: category.textColor }}
            >
              {Math.round(pci)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-foreground text-sm font-medium font-mono truncate">{section.Section}</div>
              <div className="text-muted-foreground text-[11px] truncate">{category.label}</div>
            </div>
          </button>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-muted-foreground text-[11px] mt-2 text-center">
          +{remaining} more section{remaining === 1 ? "" : "s"} below {pciCategories.at(-2)?.label}
        </p>
      )}
    </div>
  );
}
