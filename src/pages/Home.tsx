import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import {
  Plane,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Construction,
  Gauge,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
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
  icon: LucideIcon;
  placeholderCaption?: string;
}[] = [
  { id: "pci", label: "Pavement Condition Index (PCI)", shortLabel: "PCI", icon: Gauge },
  {
    id: "forecast",
    label: "PCI Forecasting",
    shortLabel: "Forecasting",
    icon: TrendingUp,
    placeholderCaption: "This Feature Still Waiting for ATC Clearance to Take Off",
  },
  {
    id: "rehab",
    label: "Rehabilitation Plan",
    shortLabel: "Rehab Plan",
    icon: Wrench,
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
            <div
              className="flex items-center gap-8 animate-card-in"
              style={{ animationDelay: "0ms" }}
            >
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
              className="h-20 w-auto object-contain animate-card-in"
              style={{ animationDelay: "150ms" }}
            />
          </div>

          {/* Indeterminate progress bar — a moving segment rather than a
              spinner, since there's no real completion fraction to show. */}
          <div className="w-40 h-1 rounded-full bg-secondary overflow-hidden animate-card-in" style={{ animationDelay: "300ms" }}>
            <div className="w-1/3 h-full rounded-full bg-primary animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen h-dvh bg-background flex items-center justify-center px-6">
        <div className="glass-panel rounded-2xl text-center space-y-3 max-w-md px-8 py-8 animate-card-in">
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
  // Table view targets 42% of the viewport, capped at 560 so it never
  // dominates a wide desktop window, and floored at 450 — the minimum
  // that fits all 5 columns (after tightening column padding/font-size in
  // SectionsTable) without a horizontal scrollbar (verified natural
  // width: 442px).
  const sidebarWidth = isNarrow
    ? viewportWidth
    : showTable
      ? Math.min(560, Math.max(450, Math.round(viewportWidth * 0.42)))
      : isSampleUnitDetail
        ? 460
        : 380;
  const showPciData = years.find((y) => y.id === selectedYear)?.hasData ?? false;
  const activeTabIndex = WORKSPACE_TABS.findIndex((tab) => tab.id === activeTab);
  // The floating aside sits `right-3` (12px) off the viewport edge; the
  // collapse toggle tracks its left edge the same way the old docked layout
  // tracked `right: sidebarWidth`, just offset by that inset.
  const PANEL_INSET = 12;

  // Overview/Needs Attention/Legend as three independent glass cards, or a
  // single glass sheet for the detail/table views — shared as-is between
  // the desktop floating column and the narrow bottom drawer below.
  const sidebarBody =
    showTable && showPciData ? (
      <div className="glass-panel rounded-xl overflow-y-auto custom-scrollbar flex-1 min-h-0 animate-card-in">
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
      <div className="glass-panel rounded-xl overflow-hidden flex-1 min-h-0 animate-card-in">
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
    );

  return (
    <div className="relative w-full h-screen h-dvh bg-background overflow-hidden">
      {/* Floating top bar — brand, workspace switch, and global controls in
          one glass bar over the map instead of a stacked header + tab row. */}
      <header className="glass-panel absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-3 h-14 rounded-xl px-3 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
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

          {/* Narrow viewports carry brand + centered tabs + admin already —
              a search input wide enough to be usable would overlap the
              centered tabs (verified: even shrunk to its narrowest useful
              width, ~50px was all that was left). It moves into the
              drawer's own header instead, mirroring the year selector. */}
          {!isNarrow && (
            <SearchBar
              sections={sections}
              onSelect={handleFeatureClick}
              selectedSection={selectedSection}
            />
          )}
        </div>

        {/* Segmented workspace switch — replaces the old full-width tab
            row. Positioned absolutely (not flex-centered between the two
            side groups) so it lands on the bar's true midpoint regardless
            of how wide the left/right groups are — a flex-1 middle column
            would center in the *leftover* space instead, which drifts off
            the visual center whenever the two sides are asymmetric like
            they are here. Thumb slides via transform only, sized against
            the inner grid so it lands on exact thirds regardless of the
            track's own padding. */}
        <div
          role="tablist"
          aria-label="Workspace"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 lg:w-64 h-11 rounded-lg bg-secondary/70 p-1"
        >
          <div className="relative grid grid-cols-3 h-full">
            <span
              aria-hidden
              className="absolute inset-y-0 w-1/3 rounded-md bg-background shadow-sm transition-transform duration-200 ease-out"
              style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
            />
            {WORKSPACE_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  title={tab.label}
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex items-center justify-center gap-1.5 h-full text-[11px] sm:text-xs font-semibold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {/* Icons below lg, text label at lg+ — a pure CSS
                      breakpoint, not tied to the isNarrow JS state, so it
                      can't drift stale after a resize. The compact/icon
                      treatment runs through the whole sub-1024px range
                      (not just <640px) because the search bar and side
                      controls sharing this bar leave the centered tabs no
                      room to widen out any earlier — verified at 768px,
                      where a sm-level bump collided with both neighbors. */}
                  <Icon size={14} className="lg:hidden shrink-0" />
                  <span className="hidden lg:inline truncate">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Narrow viewports carry brand + search + admin already, so the
              selector moves into the sidebar there instead of squeezing
              the bar out — see the sidebar-top fallback below. */}
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
              <div className="glass-panel rounded-2xl text-center space-y-3 max-w-sm px-8 py-8 animate-card-in">
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

          {isNarrow ? (
            <>
              {/* Reopen affordance once the drawer is fully dismissed — the
                  drawer itself unmounts at that point, so nothing else on
                  screen offers a way back in. */}
              {sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="glass-panel absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 h-11 rounded-full text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ChevronUp size={14} />
                  Sections
                </button>
              )}

              {/* Non-modal: no dark scrim, so the map stays visible and
                  interactive above the sheet at its 45% peek — this is a
                  persistent panel with two resting heights, not a one-shot
                  takeover dialog. */}
              <Drawer
                open={!sidebarCollapsed}
                onOpenChange={(open) => setSidebarCollapsed(!open)}
                snapPoints={[0.45, 0.92]}
                modal={false}
              >
                <DrawerContent showOverlay={false} className="rounded-t-xl">
                  <DrawerHeader className="sr-only">
                    <DrawerTitle>Section panel</DrawerTitle>
                    <DrawerDescription>
                      PCI overview, needs attention, legend, and section details for the
                      selected survey year
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className="flex flex-col gap-2 px-4 pb-2 shrink-0">
                    {/* Search moved here from the top bar — see the note by
                        its removal above. */}
                    <SearchBar
                      sections={sections}
                      onSelect={handleFeatureClick}
                      selectedSection={selectedSection}
                    />
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <SurveyYearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
                      </div>
                      <button
                        onClick={() => setSidebarCollapsed(true)}
                        aria-label="Hide panel"
                        title="Hide panel"
                        className="w-11 h-11 rounded-md bg-secondary hover:bg-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-[env(safe-area-inset-bottom)] flex flex-col gap-3">
                    {sidebarBody}
                  </div>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            <>
              {/* Sidebar collapse toggle */}
              <button
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="absolute top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-6 h-12 rounded-l-md bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary"
                style={{ right: sidebarCollapsed ? PANEL_INSET : sidebarWidth + PANEL_INSET }}
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
                  The column itself is unstyled — it's a positioning shell
                  only; each state below carries its own glass treatment,
                  since the overview state renders three independent floating
                  cards while detail/table render as one sheet. */}
              <aside
                className="absolute top-20 bottom-3 right-3 z-20 transition-transform duration-300 ease-out"
                style={{
                  width: sidebarWidth,
                  transform: sidebarCollapsed ? "translateX(calc(100% + 12px))" : "translateX(0)",
                }}
              >
                <div className="h-full overflow-y-auto custom-scrollbar pb-[env(safe-area-inset-bottom)] flex flex-col gap-3">
                  {sidebarBody}
                </div>
              </aside>
            </>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <div className="glass-panel rounded-2xl text-center space-y-3 max-w-sm px-8 py-8">
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
