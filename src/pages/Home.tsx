import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import { Plane, ChevronLeft, ChevronRight, Construction } from "lucide-react";
import MapView from "@/components/MapView";
import DetailPanel from "@/components/DetailPanel";
import Legend from "@/components/Legend";
import SurveyYearSelector from "@/components/SurveyYearSelector";
import SearchBar from "@/components/SearchBar";
import StatsBar from "@/components/StatsBar";
import NeedsAttention from "@/components/NeedsAttention";
import SectionsTable from "@/components/SectionsTable";
import AdminHeaderControl from "@/components/admin/AdminHeaderControl";
import ThemeToggle from "@/components/ThemeToggle";
import { usePavementData } from "@/hooks/usePavementData";
import { countByCondition, type SectionData } from "@/lib/pci-utils";
import type { SurveyYear } from "@/lib/survey-years";
import { useData } from "@/lib/data-store";

const NARROW_BREAKPOINT = 640;
const MIN_LOADING_SCREEN_MS = 2000;

type WorkspaceTab = "pci" | "forecast" | "rehab";

const WORKSPACE_TABS: {
  id: WorkspaceTab;
  label: string;
  shortLabel: string;
  placeholderCaption?: string;
}[] = [
  { id: "pci", label: "Pavement Condition Index (PCI)", shortLabel: "PCI" },
  {
    id: "forecast",
    label: "PCI Forecasting",
    shortLabel: "Forecasting",
    placeholderCaption: "This Feature Still Waiting for ATC Clearance to Take Off",
  },
  {
    id: "rehab",
    label: "Rehabilitation Plan",
    shortLabel: "Rehab Plan",
    placeholderCaption: "This Feature Is Closed Due To WIP",
  },
];

function isNarrowViewport() {
  return typeof window !== "undefined" && window.innerWidth < NARROW_BREAKPOINT;
}

export default function Home() {
  const location = useLocation();
  // Returning from the admin page should land straight on the map — the
  // branded splash is only meant to smooth over the very first page load.
  const skipSplash = (location.state as { fromAdmin?: boolean } | null)?.fromAdmin === true;

  const [selectedYear, setSelectedYear] = useState<SurveyYear>("2025");
  const { sections, loading, error } = usePavementData(selectedYear);
  const { years } = useData();
  const [isNarrow, setIsNarrow] = useState(isNarrowViewport);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [detailedSection, setDetailedSection] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isNarrowViewport);
  const [minSplashElapsed, setMinSplashElapsed] = useState(skipSplash);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("pci");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(skipSplash);
  const [activeBands, setActiveBands] = useState<Set<string>>(new Set());
  const [showTable, setShowTable] = useState(false);
  const bandCounts = useMemo(() => countByCondition(sections), [sections]);

  // Keep the branded splash on screen for a minimum window so it doesn't
  // just flash by when data loads quickly off localhost.
  useEffect(() => {
    if (skipSplash) return;
    const timer = setTimeout(() => setMinSplashElapsed(true), MIN_LOADING_SCREEN_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the very first data load should show the full branded splash —
  // switching survey years re-triggers `loading` too, but that should just
  // refresh the map/sidebar in place, not blow away the whole app shell.
  useEffect(() => {
    if (!loading) setHasLoadedOnce(true);
  }, [loading]);

  // Re-check viewport width once right after mount — the very first
  // synchronous read can race a just-applied viewport resize (seen with
  // automated/CDP-driven resizing) — then keep isNarrow in sync on
  // ordinary window resizes without fighting a manual sidebar toggle.
  useEffect(() => {
    const narrow = isNarrowViewport();
    setIsNarrow(narrow);
    setSidebarCollapsed(narrow);
    setViewportWidth(window.innerWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => {
      setIsNarrow(isNarrowViewport());
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleFeatureClick = useCallback((section: SectionData | null) => {
    setSelectedSection(section);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedSection(null);
    setDetailedSection(null);
  }, []);

  const handleToggleDetails = useCallback((sectionName: string) => {
    setDetailedSection((prev) => (prev === sectionName ? null : sectionName));
  }, []);

  const handleExitDetails = useCallback(() => {
    setDetailedSection(null);
  }, []);

  const handleToggleBand = useCallback((label: string) => {
    setActiveBands((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const handleClearBands = useCallback(() => {
    setActiveBands(new Set());
  }, []);

  // When leaving the per-sample-unit view, fall back to the parent
  // section's aggregate data if a sample unit was selected, so the panel
  // doesn't keep showing a single unit's PCI once the map is back to the
  // section-overview polygons.
  useEffect(() => {
    if (detailedSection === null && selectedSection?.sampleUnit !== undefined) {
      const parent = sections.find((s) => s.Section === selectedSection.Section);
      setSelectedSection(parent ?? null);
    }
  }, [detailedSection, selectedSection, sections]);

  if ((loading && !hasLoadedOnce) || !minSplashElapsed) {
    return (
      <div className="w-full h-screen h-dvh bg-background flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-7">
            <div className="flex items-center gap-8">
              <img
                src="/branding/ugm-logo.png"
                alt="Universitas Gadjah Mada"
                className="h-28 w-28 object-contain"
              />
              <img
                src="/branding/injourney-logo.webp"
                alt="InJourney Airports"
                className="h-28 w-28 object-contain"
              />
            </div>
            <img
              src="/branding/soekarno-hatta-wordmark.png"
              alt="Soekarno-Hatta International Airport, by InJourney Airports"
              className="h-20 w-auto object-contain"
            />
          </div>

          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen h-dvh bg-background flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md px-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-destructive text-xl">!</span>
          </div>
          <p className="text-foreground font-medium">Failed to load data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Sample-unit detail is the one view with a wide distress table (Type,
  // Severity, Quantity, Deduct) — a little extra width there lets distress
  // names wrap onto 1-2 lines instead of many; every other view (map,
  // section-level detail, sections table) keeps its original width so the
  // map stays the dominant element on screen.
  const isSampleUnitDetail = !showTable && selectedSection?.sampleUnit !== undefined;
  // A literal "100%" here (instead of a resolved px number) never actually
  // reaches full width: the sidebar's `transition-all` animates `width` via
  // flex-basis, and animating a percentage through flex-basis resolution
  // gets stuck near 0 instead of settling at the target (verified: the
  // identical transition works correctly with a plain px number, as the
  // showTable/isSampleUnitDetail branches below already do).
  // Table view is sized to match a workspace tab's width (tabs are 3 equal
  // flex-1 columns spanning the full app width, so one tab = viewportWidth
  // / 3) — floored at 450, the minimum that fits all 5 columns (after
  // tightening column padding/font-size in SectionsTable) without a
  // horizontal scrollbar (verified natural width: 442px).
  const sidebarWidth = isNarrow
    ? viewportWidth
    : showTable
      ? Math.max(Math.round(viewportWidth / 3), 450)
      : isSampleUnitDetail
        ? 400
        : 320;
  const showPciData = years.find((y) => y.id === selectedYear)?.hasData ?? false;
  const activeTabIndex = WORKSPACE_TABS.findIndex((tab) => tab.id === activeTab);
  // The floating aside sits `right-3` (12px) off the viewport edge; the
  // collapse toggle tracks its left edge the same way the old docked layout
  // tracked `right: sidebarWidth`, just offset by that inset. Narrow+open is
  // special-cased to the left edge — with the aside spanning (near) the
  // full width there, anchoring by `right: sidebarWidth` would push the
  // toggle off-screen to the left.
  const PANEL_INSET = 12;
  const toggleAtLeftEdge = isNarrow && !sidebarCollapsed;

  return (
    <div className="relative w-full h-screen h-dvh bg-background overflow-hidden">
      {/* Floating top bar — brand, workspace switch, and global controls in
          one glass bar over the map instead of a stacked header + tab row. */}
      <header className="glass-panel absolute top-3 left-3 right-3 z-30 flex items-center gap-3 h-14 rounded-xl px-3 pt-[env(safe-area-inset-top)]">
        <div
          className="flex items-center gap-2.5 shrink-0"
          title="Airport Pavement Management System — Soekarno-Hatta International Airport"
        >
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center shrink-0">
            <Plane size={17} className="text-primary-foreground" />
          </div>
          <div className="leading-tight hidden sm:block">
            <h1 className="text-foreground text-sm font-bold leading-tight">APMS</h1>
            <p className="text-muted-foreground text-[11px] leading-tight">Soekarno-Hatta</p>
          </div>
        </div>

        {/* Segmented workspace switch — replaces the old full-width tab
            row. Thumb slides via transform only (no width/layout
            animation), sized against the inner grid so it lands on exact
            thirds regardless of the track's own padding. */}
        <div className="flex-1 min-w-0 flex justify-center">
          <div
            role="tablist"
            aria-label="Workspace"
            className="w-full max-w-[190px] sm:max-w-xs rounded-lg bg-secondary/70 p-1"
          >
            <div className="relative grid grid-cols-3">
              <span
                aria-hidden
                className="absolute inset-y-0 w-1/3 rounded-md bg-background shadow-sm transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
              />
              {WORKSPACE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  title={tab.label}
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 px-1.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md text-center truncate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SearchBar
            sections={sections}
            onSelect={handleFeatureClick}
            selectedSection={selectedSection}
          />

          {/* Narrow viewports carry brand + search + admin already, so the
              selector moves into the sidebar there instead of squeezing
              SearchBar out — see the sidebar-top fallback below. */}
          {activeTab === "pci" && !isNarrow && (
            <SurveyYearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
          )}

          <ThemeToggle />
          <AdminHeaderControl />
        </div>
      </header>

      {/* Body: full-bleed map with a floating sidebar over it, or a
          floating placeholder for modules still in development. */}
      {activeTab === "pci" ? (
        <div className="absolute inset-0">
          {/* Map fills the entire viewport now — the sidebar floats over
              it instead of docking beside it and shrinking it. */}
          {showPciData ? (
            <>
              <MapView
                key={selectedYear}
                selectedYear={selectedYear}
                onFeatureClick={handleFeatureClick}
                selectedSection={selectedSection}
                detailedSection={detailedSection}
                onExitDetails={handleExitDetails}
                activeBands={activeBands}
                onClearBands={handleClearBands}
              />

              {/* Attribution overlay (sits on imagery, independent of app theme) */}
              <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
                <div className="flex justify-end px-3 pb-1">
                  <p className="text-[11px] text-white/80 [text-shadow:0_1px_3px_rgb(0_0_0_/_0.7)]">
                    Airport Pavement Management System
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center space-y-3 max-w-sm px-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Construction size={20} className="text-primary" />
                </div>
                <p className="text-foreground font-medium">{selectedYear} PCI Survey</p>
                <p className="text-muted-foreground text-sm">
                  This Feature Is Closed Due To WIP
                </p>
              </div>
            </div>
          )}

          {/* Sidebar collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className={`absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-6 h-12 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary ${
              toggleAtLeftEdge ? "rounded-r-md" : "rounded-l-md"
            }`}
            style={
              toggleAtLeftEdge
                ? { left: PANEL_INSET }
                : { right: sidebarCollapsed ? PANEL_INSET : sidebarWidth + PANEL_INSET }
            }
            title={sidebarCollapsed ? "Show panel" : "Hide panel"}
            aria-label={sidebarCollapsed ? "Show panel" : "Hide panel"}
          >
            {sidebarCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Floating sidebar. Collapse slides it off-screen via transform
              (not width) — the old docked layout had to snap its width
              instead of transitioning because animating flex-basis gets
              stuck near 0; that constraint doesn't apply to an absolutely
              positioned panel, so the slide can transition smoothly here.
              The column itself is unstyled — it's a positioning shell only;
              each state below carries its own glass treatment, since the
              overview state renders three independent floating cards while
              detail/table render as one sheet. */}
          <aside
            className="absolute top-20 bottom-3 z-20 transition-transform duration-300 ease-out"
            style={{
              right: PANEL_INSET,
              left: isNarrow ? PANEL_INSET : undefined,
              width: isNarrow ? undefined : sidebarWidth,
              transform: sidebarCollapsed ? "translateX(calc(100% + 12px))" : "translateX(0)",
            }}
          >
            <div className="h-full overflow-y-auto custom-scrollbar pb-[env(safe-area-inset-bottom)] flex flex-col gap-3">
              {/* Narrow-viewport fallback for the year selector — rendered
                  above the swappable panels below so it still survives
                  section selection and the table view. */}
              {isNarrow && (
                <div className="glass-panel rounded-xl px-5 py-3 shrink-0">
                  <SurveyYearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
                </div>
              )}

              {showTable && showPciData ? (
                <div className="glass-panel rounded-xl overflow-y-auto custom-scrollbar flex-1 min-h-0">
                  <SectionsTable
                    sections={sections}
                    activeBands={activeBands}
                    onClearBands={handleClearBands}
                    selectedSection={selectedSection}
                    onSelect={handleFeatureClick}
                    onClose={() => setShowTable(false)}
                  />
                </div>
              ) : selectedSection && showPciData ? (
                <div className="glass-panel rounded-xl overflow-hidden flex-1 min-h-0">
                  <DetailPanel
                    section={selectedSection}
                    selectedYear={selectedYear}
                    onClose={handleClosePanel}
                    onViewDetails={handleToggleDetails}
                    isDetailedView={detailedSection === selectedSection.Section}
                  />
                </div>
              ) : (
                <>
                  {showPciData && (
                    <div
                      className="glass-panel rounded-xl overflow-hidden shrink-0 animate-card-in"
                      style={{ animationDelay: "0ms" }}
                    >
                      <StatsBar sections={sections} onOpenTable={() => setShowTable(true)} />
                    </div>
                  )}
                  {showPciData && (
                    <div
                      className="glass-panel rounded-xl overflow-hidden shrink-0 animate-card-in"
                      style={{ animationDelay: "60ms" }}
                    >
                      <NeedsAttention sections={sections} onSelect={handleFeatureClick} />
                    </div>
                  )}
                  <div
                    className="glass-panel rounded-xl overflow-hidden shrink-0 animate-card-in"
                    style={{ animationDelay: "120ms" }}
                  >
                    <Legend
                      activeBands={activeBands}
                      onToggleBand={handleToggleBand}
                      onClearBands={handleClearBands}
                      bandCounts={bandCounts}
                    />
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="text-center space-y-3 max-w-sm px-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Construction size={20} className="text-primary" />
            </div>
            <p className="text-foreground font-medium">
              {WORKSPACE_TABS.find((tab) => tab.id === activeTab)?.label}
            </p>
            <p className="text-muted-foreground text-sm">
              {WORKSPACE_TABS.find((tab) => tab.id === activeTab)?.placeholderCaption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
