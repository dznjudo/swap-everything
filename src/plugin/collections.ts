import { CollectionSummary, CollectionAssignments } from "./types";

const STORAGE_KEY_TIER1 = "themeSwitcher_tier1CollectionId";
const STORAGE_KEY_TIER2 = "themeSwitcher_tier2CollectionId";

// ── Read all local variable collections ───────────────────────
export async function getAllCollections(): Promise<CollectionSummary[]> {
  const raw = await figma.variables.getLocalVariableCollectionsAsync();
  return raw.map((c) => ({
    id: c.id,
    name: c.name,
    modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
    variableCount: c.variableIds.length,
  }));
}

// ── Persist collection assignments ────────────────────────────
export async function saveAssignments(
  tier1Id?: string | null,
  tier2Id?: string | null
): Promise<void> {
  if (tier1Id !== undefined)
    await figma.clientStorage.setAsync(STORAGE_KEY_TIER1, tier1Id);
  if (tier2Id !== undefined)
    await figma.clientStorage.setAsync(STORAGE_KEY_TIER2, tier2Id);
}

// ── Load persisted assignments ────────────────────────────────
export async function loadAssignments(): Promise<CollectionAssignments> {
  const tier1Id = await figma.clientStorage.getAsync(STORAGE_KEY_TIER1);
  const tier2Id = await figma.clientStorage.getAsync(STORAGE_KEY_TIER2);
  return {
    tier1Id: (tier1Id as string) || null,
    tier2Id: (tier2Id as string) || null,
  };
}

// ── Heuristic: guess a collection by role keywords ────────────
export function guessCollection(
  collections: CollectionSummary[],
  keywords: string[]
): string | null {
  for (const col of collections) {
    const lower = col.name.toLowerCase();
    if (keywords.some((k) => lower.includes(k))) return col.id;
  }
  return collections.length > 0 ? collections[0].id : null;
}

// ── Clear overrides for inactive sub-brand collections ─────────
// Called before applying a new sub-brand so stale overrides from previously
// active brands don't stack up in the appearances panel or cause "?" resolution.
export async function deactivateCollections(
  collectionIds: string[],
  scope: "page" | "selection"
): Promise<void> {
  if (!collectionIds.length) return;

  const allCollections = await figma.variables.getLocalVariableCollectionsAsync();
  const toClear = allCollections.filter((c) => collectionIds.includes(c.id));
  if (!toClear.length) return;

  const nodes: Array<PageNode | FrameNode> =
    scope === "selection"
      ? (figma.currentPage.selection.filter(
          (n) => "clearExplicitVariableModeForCollection" in n
        ) as FrameNode[])
      : ([
          figma.currentPage,
          ...figma.currentPage.findAll(
            (n) => "clearExplicitVariableModeForCollection" in n
          ),
        ] as Array<PageNode | FrameNode>);

  for (const collection of toClear) {
    console.log(`Deactivating collection "${collection.name}" from ${nodes.length} node(s)`);
    for (const node of nodes) {
      try {
        (node as FrameNode).clearExplicitVariableModeForCollection(collection);
      } catch (_) {
        // node has no override for this collection — skip
      }
    }
  }
}

// ── Rebase Semantic aliases to a new active sub-brand ──────────
// When sub-brands are separate collections (e.g. "SubBrand / Brand A" and
// "SubBrand / Brand B") rather than modes of one collection, Semantic's alias
// pointers are hardwired to whichever collection they were originally authored
// against.  Switching mode overrides on the other collection has no effect
// because the alias chain never changes.
//
// This function walks every variable in the Tier 1 (Semantic) collection and,
// for each value that is a VARIABLE_ALIAS pointing into ANY known sub-brand
// collection, re-points it to the variable with the same name in the newly
// active sub-brand collection.  It is safe to call multiple times; if the alias
// already points at the correct target it is left unchanged.
export async function rebaseSemanticAliases(
  semanticCollectionId: string,
  newSubBrandId: string,
  allSubBrandIds: string[]
): Promise<{ updated: number }> {
  if (!semanticCollectionId || !newSubBrandId || !allSubBrandIds.length) {
    return { updated: 0 };
  }

  const allVars = await figma.variables.getLocalVariablesAsync("COLOR");

  // Build a name→variable map for the newly active sub-brand collection.
  const newBrandByName: Record<string, Variable> = {};
  for (const v of allVars) {
    if (v.variableCollectionId === newSubBrandId) {
      newBrandByName[v.name] = v;
    }
  }

  // Set of all variable IDs that belong to any sub-brand collection.
  const subBrandVarIds = new Set(
    allVars
      .filter((v) => allSubBrandIds.includes(v.variableCollectionId))
      .map((v) => v.id)
  );

  // Build a quick id→variable lookup for resolving alias targets.
  const varById: Record<string, Variable> = {};
  for (const v of allVars) varById[v.id] = v;

  const semanticVars = allVars.filter(
    (v) => v.variableCollectionId === semanticCollectionId
  );

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const semanticCollection = collections.find(
    (c) => c.id === semanticCollectionId
  );
  if (!semanticCollection) return { updated: 0 };

  let updated = 0;

  for (const semVar of semanticVars) {
    for (const mode of semanticCollection.modes) {
      const value = semVar.valuesByMode[mode.modeId];
      if (!value || typeof value !== "object") continue;
      if ((value as VariableAlias).type !== "VARIABLE_ALIAS") continue;

      const aliasId = (value as VariableAlias).id;

      // Only rewrite aliases that point into a sub-brand collection.
      if (!subBrandVarIds.has(aliasId)) continue;

      const aliasedVar = varById[aliasId];
      if (!aliasedVar) continue;

      // Find the matching variable in the new active sub-brand by name.
      const newTarget = newBrandByName[aliasedVar.name];
      if (!newTarget) {
        console.warn(
          `rebaseSemanticAliases: no match for "${aliasedVar.name}" in new sub-brand`
        );
        continue;
      }

      // Skip if already pointing at the right variable.
      if (aliasId === newTarget.id) continue;

      semVar.setValueForMode(mode.modeId, {
        type: "VARIABLE_ALIAS",
        id: newTarget.id,
      } as VariableAlias);
      updated++;
    }
  }

  console.log(`rebaseSemanticAliases: updated ${updated} alias(es)`);
  return { updated };
}

// ── Swap variable bindings on fill/stroke layers ───────────────
// For files where brands are separate collections and fills are bound
// directly to brand variables (not through a Semantic intermediary).
// Walks every node in scope and rebinds any fill/stroke color that is
// bound to a variable in any sub-brand collection → the matching variable
// (by name) in the newly active brand collection.
export async function swapLayerVariableBindings(
  allSubBrandIds: string[],
  activeSubBrandId: string,
  scope: "page" | "selection"
): Promise<{ swapped: number }> {
  if (!activeSubBrandId || !allSubBrandIds.length) return { swapped: 0 };

  const allVars = await figma.variables.getLocalVariablesAsync("COLOR");

  // name → variable for the newly active brand collection
  const targetByName: Record<string, Variable> = {};
  for (const v of allVars) {
    if (v.variableCollectionId === activeSubBrandId) {
      targetByName[v.name] = v;
    }
  }

  // variable id → variable for any sub-brand collection (source side)
  const sourceById: Record<string, Variable> = {};
  for (const v of allVars) {
    if (allSubBrandIds.includes(v.variableCollectionId)) {
      sourceById[v.id] = v;
    }
  }

  const nodes: SceneNode[] =
    scope === "selection"
      ? [...figma.currentPage.selection]
      : figma.currentPage.findAll(() => true);

  let swapped = 0;

  const rebindPaints = (paints: ReadonlyArray<Paint>): { changed: boolean; result: Paint[] } => {
    let changed = false;
    const result = paints.map((paint) => {
      if (paint.type !== "SOLID") return paint;
      const bv = (paint as SolidPaint).boundVariables;
      if (!bv || !bv.color) return paint;
      const aliasId = (bv.color as VariableAlias).id;
      const sourceVar = sourceById[aliasId];
      if (!sourceVar) return paint;
      const targetVar = targetByName[sourceVar.name];
      if (!targetVar || targetVar.id === aliasId) return paint;
      changed = true;
      swapped++;
      return figma.variables.setBoundVariableForPaint(
        paint as SolidPaint,
        "color",
        targetVar
      );
    });
    return { changed, result };
  };

  for (const node of nodes) {
    // Fills
    if ("fills" in node) {
      const fills = node.fills;
      if (Array.isArray(fills) && fills.length > 0) {
        const { changed, result } = rebindPaints(fills as ReadonlyArray<Paint>);
        if (changed) (node as GeometryMixin).fills = result;
      }
    }
    // Strokes
    if ("strokes" in node) {
      const strokes = node.strokes;
      if (Array.isArray(strokes) && strokes.length > 0) {
        const { changed, result } = rebindPaints(strokes as ReadonlyArray<Paint>);
        if (changed) (node as GeometryMixin).strokes = result;
      }
    }
  }

  console.log(`swapLayerVariableBindings: swapped ${swapped} binding(s) across ${nodes.length} node(s)`);
  return { swapped };
}

// ── Switch variable mode on page or selected frames ───────────
export async function switchCollectionMode(
  collectionId: string,
  modeName: string,
  scope: "page" | "selection"
): Promise<{ success: boolean; message: string }> {
  console.log("switchCollectionMode called", { collectionId, modeName, scope });
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  console.log("Found collections", collections.map((c) => ({ id: c.id, name: c.name })));
  const collection = collections.find((c) => c.id === collectionId);

  if (!collection) {
    const msg = "Collection no longer exists in this file.";
    console.error("switchCollectionMode: collection not found", { collectionId, availableIds: collections.map((c) => c.id) });
    return { success: false, message: msg };
  }

  console.log("Found collection", { id: collection.id, name: collection.name, modes: collection.modes.map((m) => m.name) });
  const mode = collection.modes.find((m) => m.name === modeName);
  if (!mode) {
    const available = collection.modes.map((m) => m.name).join(", ");
    const msg = `Mode "${modeName}" not found in "${collection.name}". Available: ${available}`;
    console.error("switchCollectionMode: mode not found", { modeName, available });
    return {
      success: false,
      message: msg,
    };
  }

  console.log("Found mode", { name: mode.name, modeId: mode.modeId });

  let applied = 0;

  if (scope === "selection") {
    const selTargets = figma.currentPage.selection.filter(
      (n) => "setExplicitVariableModeForCollection" in n
    ) as FrameNode[];

    console.log("Targets for applying (selection)", { count: selTargets.length });

    if (selTargets.length === 0) {
      const msg = "Select one or more frames first.";
      console.error("switchCollectionMode: no targets in selection");
      return { success: false, message: msg };
    }

    for (const node of selTargets) {
      try {
        node.setExplicitVariableModeForCollection(collection, mode.modeId);
        applied++;
      } catch (err) {
        console.error("Failed to apply mode to node", err);
      }
    }
  } else {
    // Page scope strategy:
    //
    //   Goal: one clean entry per top-level frame in the appearances panel,
    //   nothing on nested frames (they inherit from the top-level frame above).
    //
    //   1. Set on the page (best-effort — updates the page-level entry).
    //   2. Set on every direct child of the page that supports the mixin.
    //      This is the reliable path for visual updates.
    //   3. Clear stale overrides from any deeper descendants so they inherit
    //      cleanly and don't add extra rows to the appearances panel.
    //      (Fallback: if clear fails, set the correct mode directly.)

    // Step 1 — page
    try {
      figma.currentPage.setExplicitVariableModeForCollection(collection, mode.modeId);
      applied++;
      console.log("Page-level mode set.");
    } catch (err) {
      console.error("Page-level set failed (non-fatal):", err);
    }

    // Step 2 — top-level frames / sections / components
    const topLevel = figma.currentPage.children.filter(
      (n) => "setExplicitVariableModeForCollection" in n
    ) as FrameNode[];

    console.log(`Setting mode on ${topLevel.length} top-level frame(s)`);

    for (const frame of topLevel) {
      try {
        frame.setExplicitVariableModeForCollection(collection, mode.modeId);
        applied++;
      } catch (err) {
        console.error("Failed to set mode on top-level frame:", err);
      }
    }

    // Step 3 — clear stale overrides from deeper descendants
    const nestedStale = figma.currentPage.findAll((n) => {
      if (n.parent === figma.currentPage) return false; // already handled in step 2
      if (!("explicitVariableModes" in n)) return false;
      const modes = (n as FrameNode).explicitVariableModes;
      return modes != null && collection.id in modes;
    }) as FrameNode[];

    console.log(`Clearing ${nestedStale.length} stale nested override(s)`);

    for (const node of nestedStale) {
      try {
        node.clearExplicitVariableModeForCollection(collection);
      } catch (_) {
        // clear not supported — set the correct mode as fallback so at least
        // the color is right even if an extra appearances entry remains
        try {
          (node as FrameNode).setExplicitVariableModeForCollection(collection, mode.modeId);
        } catch (__) { /* skip */ }
      }
    }
  }

  const msg = `✓ "${collection.name}" → "${modeName}" (${applied} node${applied !== 1 ? "s" : ""})`;
  console.log("switchCollectionMode result", { success: true, applied, msg });
  return {
    success: true,
    message: msg,
  };
}
