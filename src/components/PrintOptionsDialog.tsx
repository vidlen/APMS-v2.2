import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getPCICategory, parsePCIValue, type SectionData } from "@/lib/pci-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PrintMode } from "@/components/PrintReport";

interface PrintOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SectionData[];
  initialSelection: Set<string>;
  onPrint: (selection: Set<string>, mode: PrintMode) => void;
}

export default function PrintOptionsDialog({
  open,
  onOpenChange,
  sections,
  initialSelection,
  onPrint,
}: PrintOptionsDialogProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<PrintMode>("summary");
  const [selection, setSelection] = useState<Set<string>>(initialSelection);

  // Re-seed from the current legend filter each time the dialog opens
  // (not on every parent re-render, or a user's in-dialog picks would
  // keep getting stomped while it's open).
  useEffect(() => {
    if (open) {
      setSelection(initialSelection);
      setQuery("");
      setMode("summary");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) => s.Section.toLowerCase().includes(q) || s.Type.toLowerCase().includes(q)
    );
  }, [sections, query]);

  const toggle = (name: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Print Report</DialogTitle>
          <DialogDescription>Choose which sections to include and how much detail to print.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-secondary/70 shrink-0">
          {(
            [
              { id: "summary", label: "Summary Table" },
              { id: "detailed", label: "Full Section Details" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`h-8 rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                mode === m.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter sections..."
            className="h-8 pl-7 text-xs"
          />
        </div>

        <div className="flex items-center justify-between text-xs shrink-0">
          <span className="text-muted-foreground">
            {selection.size} of {sections.length} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => setSelection(new Set(sections.map((s) => s.Section)))}
              className="text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Select all
            </button>
            <button
              onClick={() => setSelection(new Set())}
              className="text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar border border-border rounded-md divide-y divide-border">
          {rows.map((s) => {
            const cat = getPCICategory(parsePCIValue(s["PCI Rating"]));
            const checked = selection.has(s.Section);
            return (
              <label
                key={s.Section}
                className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-secondary/50"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(s.Section)} />
                <span
                  className="pci-swatch w-7 h-7 rounded text-[11px] font-bold font-mono tabular-nums flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.color, color: cat.textColor }}
                >
                  {s["PCI Rating"]}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-mono text-foreground truncate">{s.Section}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{s.Type}</span>
                </span>
              </label>
            );
          })}
          {rows.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">No sections match.</p>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={selection.size === 0} onClick={() => onPrint(selection, mode)}>
            Print{selection.size > 0 ? ` (${selection.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
