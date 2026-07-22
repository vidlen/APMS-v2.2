import { pciCategories } from "@/lib/pci-utils";

interface LegendProps {
  activeBands: Set<string>;
  onToggleBand: (label: string) => void;
  onClearBands: () => void;
  bandCounts?: Record<string, number>;
}

export default function Legend({
  activeBands,
  onToggleBand,
  onClearBands,
  bandCounts,
}: LegendProps) {
  const filtering = activeBands.size > 0;
  return (
    <div className="px-5 py-5">
      <h2 className="text-sm font-bold text-foreground mb-3">Legend</h2>
      <div className="flex items-center justify-between mb-3">
        <p className="panel-label">PCI Rating</p>
        {filtering && (
          <button
            onClick={onClearBands}
            className="text-[11px] text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            Clear filter
          </button>
        )}
      </div>
      <div className="space-y-1">
        {pciCategories
          .slice()
          .reverse()
          .map((cat) => {
            const count = bandCounts?.[cat.label];
            const isEmpty = count === 0;
            const isActive = activeBands.has(cat.label);
            const isDimmed = filtering && !isActive;
            return (
              <button
                key={cat.min}
                onClick={() => !isEmpty && onToggleBand(cat.label)}
                disabled={isEmpty}
                title={
                  isEmpty
                    ? `No sections in the ${cat.label} range`
                    : `Show only ${cat.label} sections on the map`
                }
                className={`w-full flex items-center gap-3.5 py-1.5 px-1.5 -mx-1.5 rounded-md text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isEmpty
                    ? "opacity-35 cursor-not-allowed"
                    : isActive
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-secondary/60"
                } ${isDimmed && !isEmpty ? "opacity-45" : ""}`}
              >
                <span
                  className="pci-swatch w-[18px] h-[18px] rounded-[5px] shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-muted-foreground">
                  <span className="font-mono tabular-nums">
                    {cat.min}-{cat.max}
                  </span>{" "}
                  <span className="font-medium text-foreground">{cat.label}</span>
                </span>
                {count !== undefined && (
                  <span className="ml-auto text-[11px] text-muted-foreground font-mono tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
