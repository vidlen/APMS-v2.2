import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { SectionData } from "@/lib/pci-utils";
import { getPCICategory, parsePCIValue } from "@/lib/pci-utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

interface CommandSearchProps {
  sections: SectionData[];
  onSelect: (section: SectionData) => void;
  selectedSection: SectionData | null;
}

export default function CommandSearch({ sections, onSelect, selectedSection }: CommandSearchProps) {
  const [open, setOpen] = useState(false);

  // Global shortcut so search is reachable from anywhere in the app, not
  // just when the trigger in the top bar happens to be visible.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = useCallback(
    (section: SectionData) => {
      onSelect(section);
      setOpen(false);
    },
    [onSelect]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 bg-secondary border border-border rounded-md h-9 px-3.5 w-full max-w-[180px] sm:max-w-xs text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Search size={15} className="text-muted-foreground shrink-0" />
        <span className="text-muted-foreground text-sm truncate flex-1">Search Branch</span>
        <KbdGroup className="hidden sm:inline-flex shrink-0">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search sections"
        description="Search PCI sections by designator, type, or PCN"
      >
        <CommandInput placeholder="Search Branch, Type, or PCN..." />
        <CommandList>
          <CommandEmpty>No branches found.</CommandEmpty>
          {sections.map((section) => {
            const pci = parsePCIValue(section["PCI Rating"]);
            const category = getPCICategory(pci);
            const isActive = selectedSection?.Section === section.Section;
            return (
              <CommandItem
                key={section.Section}
                value={`${section.Section} ${section.Type} ${section.PCN}`}
                onSelect={() => handleSelect(section)}
                className={`gap-3 py-2 ${isActive ? "bg-primary/10" : ""}`}
              >
                <div
                  className="pci-swatch w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold font-mono tabular-nums shrink-0"
                  style={{ backgroundColor: category.color, color: category.textColor }}
                >
                  {section["PCI Rating"]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground text-sm font-medium font-mono truncate">
                    {section.Section}
                  </div>
                  <div className="text-muted-foreground text-[11px] truncate">
                    {section.Type} · PCN <span className="font-mono">{section.PCN}</span>
                  </div>
                </div>
              </CommandItem>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}
