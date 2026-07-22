# APMS v2.2 — Airport Pavement Management System

Pavement condition (PCI) dashboard for Soekarno-Hatta International Airport. This is a UI redesign of [APMS-V1.5](https://github.com/vidlen/APMS-V1.5) — the map, GeoJSON/JSON datasets, PCI band colors, and all admin/data logic are unchanged; only presentation was rebuilt.

## Design: "Glass Cockpit"

The satellite map fills the entire viewport; every control floats over it as a translucent, blurred glass panel — a top bar, a right-hand column of cards (desktop) or a bottom drawer (narrow viewports), and map chrome (zoom, tooltip, back button, filter pill). Light and dark themes are both first-class, toggled via the header.

Built entirely from dependencies already present in the original scaffold — `next-themes`, `vaul`, `cmdk`/`ui/command`, `ui/collapsible`, `ui/drawer` — no new runtime dependencies were added for the redesign.

## Stack

Vite + React 19 + TypeScript, Tailwind CSS 3 + shadcn/ui, OpenLayers (satellite map + GeoJSON layers).

## Getting started

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build
npm run lint      # eslint
```

## Structure

```
src/
  components/         PCI tab UI: MapView, DetailPanel, SectionsTable,
                       StatsBar, NeedsAttention, Legend, SearchBar,
                       SurveyYearSelector, ThemeToggle
  components/admin/   Admin login + data editing panels
  components/ui/       shadcn/ui primitives
  lib/                 PCI/PCN classification, data store, GeoJSON I/O, auth
  pages/               Home (PCI dashboard) and Admin
public/data/           Section/sample-unit GeoJSON per survey year — untouched
```

## What changed vs. V1.5

Full-bleed map with floating glass chrome replacing the docked sidebar layout; a centered segmented workspace switch replacing the full-width tab row; the floating column split into independent glass cards (Overview / Needs Attention / Legend) with a staggered entrance; a bottom drawer with snap points for narrow viewports; dual light/dark theming; Geist/Geist Mono typography. See the commit history for the phase-by-phase breakdown.
