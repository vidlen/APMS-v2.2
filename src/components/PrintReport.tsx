import {
  parsePCIValue,
  getPCICategory,
  pciCategories,
  countByCondition,
  type SectionData,
} from "@/lib/pci-utils";
import type { SurveyYear } from "@/lib/survey-years";

interface PrintReportProps {
  sections: SectionData[];
  selectedYear: SurveyYear;
  activeBands: Set<string>;
}

// Screen-hidden, print-only. Mounted alongside the live app at all times
// (cheap — same `sections` already in memory) rather than built on demand,
// so the "Print" button is just `window.print()` with no report-mode state
// to manage. Only reachable via that button, which only renders on the PCI
// tab, so no need to gate this on `activeTab` itself.
export default function PrintReport({ sections, selectedYear, activeBands }: PrintReportProps) {
  const rows =
    activeBands.size === 0
      ? sections
      : sections.filter((s) => activeBands.has(getPCICategory(parsePCIValue(s["PCI Rating"])).label));

  const total = rows.length;
  const avgPCI = total
    ? (rows.reduce((sum, s) => sum + parsePCIValue(s["PCI Rating"]), 0) / total).toFixed(1)
    : "0.0";
  const counts = countByCondition(rows);
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  return (
    <div className="hidden print:block text-black bg-white p-8">
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">Airport Pavement Management System</h1>
          <p className="text-sm">Soekarno-Hatta International Airport &mdash; Pavement Condition Index Report</p>
        </div>
        <div className="text-right text-xs shrink-0 pl-4">
          <p>Survey Year: {selectedYear}</p>
          <p>
            Generated:{" "}
            {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {activeBands.size > 0 && (
        <p className="text-xs mb-3">Filtered to condition: {[...activeBands].join(", ")}</p>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div className="border border-black py-2">
          <div className="text-lg font-bold">{total}</div>
          <div className="text-[10px] uppercase tracking-wide">Total Sections</div>
        </div>
        <div className="border border-black py-2">
          <div className="text-lg font-bold">{avgPCI}</div>
          <div className="text-[10px] uppercase tracking-wide">Average PCI</div>
        </div>
        <div className="border border-black py-2">
          <div className="text-lg font-bold">{dominant}</div>
          <div className="text-[10px] uppercase tracking-wide">Dominant Condition</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5 text-[10px]">
        {pciCategories.map((cat) => (
          <div key={cat.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 inline-block border border-black shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span>
              {cat.label} ({cat.min}&ndash;{cat.max}): {counts[cat.label] ?? 0}
            </span>
          </div>
        ))}
      </div>

      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1.5 pr-2">Section</th>
            <th className="text-left py-1.5 pr-2">Type</th>
            <th className="text-left py-1.5 pr-2">PCN</th>
            <th className="text-left py-1.5 pr-2">PCI</th>
            <th className="text-left py-1.5">Condition</th>
          </tr>
        </thead>
        <tbody>
          {rows
            .slice()
            .sort((a, b) => a.Section.localeCompare(b.Section))
            .map((s) => (
              <tr key={s.Section} className="border-b border-black/30 break-inside-avoid">
                <td className="py-1 pr-2 font-mono">{s.Section}</td>
                <td className="py-1 pr-2">{s.Type}</td>
                <td className="py-1 pr-2 font-mono">{s.PCN}</td>
                <td className="py-1 pr-2 font-mono">{s["PCI Rating"]}</td>
                <td className="py-1">{getPCICategory(parsePCIValue(s["PCI Rating"])).label}</td>
              </tr>
            ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-6">
                No sections to report.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
