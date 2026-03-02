// ── Shared Types ─────────────────────────────────────────────

export interface CollectionSummary {
  id: string;
  name: string;
  modes: ModeSummary[];
  variableCount: number;
}

export interface ModeSummary {
  modeId: string;
  name: string;
}

export interface CollectionAssignments {
  tier1Id: string | null;
  tier2Id: string | null;
}

export interface GradientStop {
  color: { r: number; g: number; b: number; a: number };
  position: number;
}

export interface GradientDefinition {
  type: "GRADIENT_LINEAR" | "GRADIENT_RADIAL";
  stops: GradientStop[];
  transform: [[number, number, number], [number, number, number]];
}

export interface GradientSet {
  [styleName: string]: GradientDefinition;
}

export interface GradientSets {
  [setName: string]: GradientSet;
}

export interface InitData {
  collections: CollectionSummary[];
  tier1Id: string | null;
  tier2Id: string | null;
  tier1Modes: string[];
  tier2Modes: string[];
  tier1Name: string;
  tier2Name: string;
  // only collections that look like "sub‑brands" (heuristic)
  subBrandCollections: { id: string; name: string; modes: string[] }[];
  gradientSets: string[];
}

export interface ApplyResult {
  success: boolean;
  message: string;
}

// ── Plugin → UI messages ──────────────────────────────────────

export type PluginMessage =
  | { type: "INIT_DATA"; data: InitData }
  | { type: "COLLECTIONS_ASSIGNED"; tier1Id: string | null; tier2Id: string | null; tier1Modes: string[]; tier2Modes: string[]; tier1Name: string; tier2Name: string; subBrandCollections?: { id: string; name: string; modes: string[] }[] }
  | { type: "APPLY_RESULT"; results: ApplyResult[] }
  | { type: "SETUP_DONE"; data: InitData };

// ── UI → Plugin messages ──────────────────────────────────────

export type UIMessage =
  | { type: "INIT" }
  | { type: "REFRESH" }
  | { type: "CLOSE" }
  | { type: "ASSIGN_COLLECTIONS"; tier1Id: string; tier2Id: string | null }
  | { type: "APPLY_THEME"; tier1CollectionId: string; tier1Mode: string; tier2CollectionId: string; tier2Mode: string; gradientSet: string; scope: "page" | "selection"; allSubBrandIds?: string[] }
  | { type: "SETUP_LIBRARY" };
