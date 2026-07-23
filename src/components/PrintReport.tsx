import {
  parsePCIValue,
  getPCICategory,
  pciCategories,
  countByCondition,
  type SectionData,
} from "@/lib/pci-utils";
import { describePCNPart, PCN_PAVEMENT_TYPE, PCN_SUBGRADE_CATEGORY, PCN_TIRE_PRESSURE, PCN_EVALUATION_METHOD } from "@/lib/pcn-utils";
import { parseConstructionYear, parseDimension } from "@/lib/section-meta-utils";
import type { SampleUnitDistress } from "@/lib/sample-units";
import type { GeoJSONFeatureCollection } from "@/lib/geojson-types";
import type { SurveyYear } from "@/lib/survey-years";

export type PrintMode = "summary" | "detailed";

interface PrintReportProps {
  sections: SectionData[];
  selectedYear: SurveyYear;
  selection: Set<string>;
  mode: PrintMode;
  unitsBySection: Record<string, GeoJSONFeatureCollection>;
}

function ReportHeader({ selectedYear, subtitle }: { selectedYear: SurveyYear; subtitle: string }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
      <div>
        <h1 className="text-xl font-bold">Airport Pavement Management System</h1>
        <p className="text-sm">Soekarno-Hatta International Airport &mdash; {subtitle}</p>
      </div>
      <div className="text-right text-xs shrink-0 pl-4">
        <p>Survey Year: {selectedYear}</p>
        <p>
          Generated:{" "}
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}

// One section's full detail — construction year, dimension, PCN breakdown,
// and (for runways) per-sample-unit PCI + distress. Mirrors DetailPanel's
// fields rather than its floating-glass layout, since a printed page reads
// densely and in black/white, not as translucent cards.
function SectionDetailBlock({
  section,
  units,
}: {
  section: SectionData;
  units: GeoJSONFeatureCollection | undefined;
}) {
  const pciValue = parsePCIValue(section["PCI Rating"]);
  const category = getPCICategory(pciValue);
  const constructionYear = section["Last Major Construction Year"]
    ? parseConstructionYear(section["Last Major Construction Year"])
    : null;
  const dimension = section.Dimension ? parseDimension(section.Dimension) : null;

  const [pcnNumeric, pcnType, pcnSubgrade, pcnTire, pcnMethod] = section.PCN.split("/");
  const pcnTypeMeaning = describePCNPart(PCN_PAVEMENT_TYPE, pcnType || "");
  const pcnSubgradeMeaning = describePCNPart(PCN_SUBGRADE_CATEGORY, pcnSubgrade || "");
  const pcnTireMeaning = describePCNPart(PCN_TIRE_PRESSURE, pcnTire || "");
  const pcnMethodMeaning = describePCNPart(PCN_EVALUATION_METHOD, pcnMethod || "");

  const unitFeatures = units?.features ?? [];

  return (
    <div className="break-inside-avoid-page pb-5 mb-5 border-b-2 border-black last:border-b-0">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <h2 className="text-base font-bold font-mono">
          {section.Section} <span className="font-sans font-normal text-sm">&mdash; {section.Type}</span>
        </h2>
        <span className="text-sm font-mono font-bold shrink-0">
          PCI {section["PCI Rating"]} &middot; {category.label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3 text-[10px] mb-3">
        {constructionYear && (
          <div>
            <div className="uppercase tracking-wide">Last Major Construction</div>
            <div className="font-mono font-bold text-xs">{constructionYear.year}</div>
          </div>
        )}
        {dimension && (
          <div>
            <div className="uppercase tracking-wide">Dimension</div>
            <div className="font-mono font-bold text-xs">
              {dimension.kind === "linear"
                ? `${dimension.length} x ${dimension.width} m`
                : `${dimension.area.toLocaleString()} m²`}
            </div>
          </div>
        )}
        <div>
          <div className="uppercase tracking-wide">PCN</div>
          <div className="font-mono font-bold text-xs">{section.PCN}</div>
        </div>
      </div>

      <table className="w-full text-[10px] border-collapse mb-3">
        <tbody>
          <tr>
            <td className="font-semibold pr-2 py-0.5 w-1/6">Load (PCN)</td>
            <td className="pr-4 w-1/6">{pcnNumeric || "—"}</td>
            <td className="font-semibold pr-2 py-0.5 w-1/6">Pavement</td>
            <td className="pr-4 w-1/6">{pcnTypeMeaning.label}</td>
            <td className="font-semibold pr-2 py-0.5 w-1/6">Subgrade</td>
            <td className="w-1/6">{pcnSubgradeMeaning.label}</td>
          </tr>
          <tr>
            <td className="font-semibold pr-2 py-0.5">Tire Pressure</td>
            <td className="pr-4">{pcnTireMeaning.label}</td>
            <td className="font-semibold pr-2 py-0.5">Method</td>
            <td colSpan={3}>{pcnMethodMeaning.label}</td>
          </tr>
        </tbody>
      </table>

      {unitFeatures.length > 0 && (
        <>
          <h3 className="text-[11px] font-bold uppercase tracking-wide mb-1.5">
            Sample Units ({unitFeatures.length})
          </h3>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1 pr-2">Unit</th>
                <th className="text-left py-1 pr-2">PCI</th>
                <th className="text-left py-1 pr-2">Condition</th>
                <th className="text-left py-1">Distress</th>
              </tr>
            </thead>
            <tbody>
              {unitFeatures.map((f) => {
                const score = f.properties["pci_score"] as number;
                const unitCat = getPCICategory(score);
                const distresses = (f.properties["distresses"] as SampleUnitDistress[] | undefined) ?? [];
                return (
                  <tr key={f.properties["sampleUnit"] as number} className="border-b border-black/20 align-top break-inside-avoid">
                    <td className="py-1 pr-2 font-mono">{f.properties["sampleUnit"] as number}</td>
                    <td className="py-1 pr-2 font-mono">{Number.isInteger(score) ? score : score.toFixed(2)}</td>
                    <td className="py-1 pr-2">{unitCat.label}</td>
                    <td className="py-1">
                      {distresses.length === 0
                        ? "—"
                        : distresses.map((d) => `${d.type} (${d.severity}, ${d.quantity} ${d.quantityUnits})`).join("; ")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

// Screen-hidden, print-only. Mounted alongside the live app at all times
// (cheap — same `sections`/`unitsBySection` already in memory from the map)
// rather than built on demand, so the print button just closes the picker
// dialog and calls `window.print()` with no extra render step.
export default function PrintReport({ sections, selectedYear, selection, mode, unitsBySection }: PrintReportProps) {
  const rows = sections.filter((s) => selection.has(s.Section));

  const total = rows.length;
  const avgPCI = total
    ? (rows.reduce((sum, s) => sum + parsePCIValue(s["PCI Rating"]), 0) / total).toFixed(1)
    : "0.0";
  const counts = countByCondition(rows);
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  if (mode === "detailed") {
    return (
      <div className="hidden print:block print-only text-black bg-white p-8">
        <ReportHeader selectedYear={selectedYear} subtitle="Section Detail Report" />
        <p className="text-xs mb-4">{total} of {sections.length} sections included</p>
        {rows
          .slice()
          .sort((a, b) => a.Section.localeCompare(b.Section))
          .map((s) => (
            <SectionDetailBlock key={s.Section} section={s} units={unitsBySection[s.Section]} />
          ))}
        {rows.length === 0 && <p className="text-sm">No sections selected.</p>}
      </div>
    );
  }

  return (
    <div className="hidden print:block print-only text-black bg-white p-8">
      <ReportHeader selectedYear={selectedYear} subtitle="Pavement Condition Index Report" />

      <p className="text-xs mb-3">{total} of {sections.length} sections included</p>

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

      {/* Plain text legend — a colored swatch box relies on background
          graphics, which most browsers omit from print output by default,
          so it would've printed as an empty outlined square. */}
      <ul className="mb-5 text-[10px] space-y-0.5">
        {pciCategories.map((cat) => (
          <li key={cat.label}>
            {cat.label} ({cat.min}&ndash;{cat.max}): {counts[cat.label] ?? 0}
          </li>
        ))}
      </ul>

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
                No sections selected.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
