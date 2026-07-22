import type { GeoJSONFeatureCollection } from "@/lib/geojson-types";

export interface AddedYearMeta {
  id: string;
  label: string;
  clonedFrom: string | null;
}

// Everything an admin can change, stored as a compact set of deltas rather
// than full data copies — base survey files (megabytes) are never
// duplicated into localStorage, only the edits on top of them.
export interface DataOverrides {
  addedYears: AddedYearMeta[];
  removedYears: string[];
  sectionPci: Record<string, Record<string, string>>;
  unitScores: Record<string, Record<string, Record<number, number>>>;
  uploadedSections: Record<string, GeoJSONFeatureCollection>;
  uploadedUnits: Record<string, Record<string, GeoJSONFeatureCollection>>;
}

const STORAGE_KEY = "apms-data-overrides-v1";

export function emptyOverrides(): DataOverrides {
  return {
    addedYears: [],
    removedYears: [],
    sectionPci: {},
    unitScores: {},
    uploadedSections: {},
    uploadedUnits: {},
  };
}

export function loadOverrides(): DataOverrides {
  if (typeof localStorage === "undefined") return emptyOverrides();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyOverrides();
    const parsed = JSON.parse(raw);
    return { ...emptyOverrides(), ...parsed };
  } catch {
    return emptyOverrides();
  }
}

export function saveOverrides(overrides: DataOverrides): { ok: boolean; error?: string } {
  if (typeof localStorage === "undefined") return { ok: true };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    return { ok: true };
  } catch (err) {
    const isQuotaError =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return {
      ok: false,
      error: isQuotaError
        ? "Local storage is full. Export your changes, then reset drafts to free up space."
        : "Failed to save changes locally.",
    };
  }
}

export function clearOverridesStorage(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
