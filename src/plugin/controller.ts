import { GRADIENT_SETS } from "./gradients";
import { getAllCollections, loadAssignments, saveAssignments, guessCollection, switchCollectionMode, deactivateCollections, rebaseSemanticAliases, swapLayerVariableBindings } from "./collections";
import { applyGradientSet } from "./gradientApply";
import { setupTokenLibrary } from "./library";
import { InitData, UIMessage } from "./types";

// helper: return sub-brand collections for tier2 dropdown.
// If we know the name of the tier1 collection, prefer only those whose
// names start with that tier1 name followed by a slash (e.g. "UB Brand / Rule /").
// This matches how many teams name their collections hierarchically.  If the
// prefix filter ends up empty, fall back to simply returning every collection
// except the tier1 one so the UI never has an empty list.
function makeSubBrandList(
  collections: { id: string; name: string; modes: any[] }[],
  tier1Id: string | null,
  tier1Name?: string
) {
  let filtered = collections.filter((c) => c.id !== tier1Id);

  if (tier1Name) {
    const prefix = tier1Name.trim().toLowerCase();
    // ensure prefix ends with slash space for matching
    const normalized = prefix.endsWith("/") ? prefix : prefix + "/";
    const withPrefix = filtered.filter((c) =>
      c.name.trim().toLowerCase().startsWith(normalized)
    );
    if (withPrefix.length > 0) {
      filtered = withPrefix;
    }
  }

  return filtered.map((c) => ({
    id: c.id,
    name: c.name,
    modes: c.modes.map((m) => m.name),
  }));
}

figma.showUI(__html__, { width: 340, height: 560, title: "Theme Switcher" });

// ── Build full init payload from Figma state ──────────────────
async function buildInitData(): Promise<InitData> {
  console.log("buildInitData: starting");

  let collections;
  try {
    console.log("buildInitData: before getAllCollections");
    collections = await getAllCollections();
    console.log("buildInitData: after getAllCollections", collections);
  } catch (err) {
    console.error("buildInitData: getAllCollections failed", err);
    throw err;
  }

  if (!Array.isArray(collections)) {
    const msg = `expected array from getAllCollections but got ${typeof collections}`;
    console.error(msg, collections);
    throw new Error(msg);
  }

console.log("buildInitData: got collections count", collections.length);

  let tier1Id: string | null;
  let tier2Id: string | null;
  try {
    console.log("buildInitData: before loadAssignments");
    const asg = await loadAssignments();
    tier1Id = asg.tier1Id;
    tier2Id = asg.tier2Id;
    console.log("buildInitData: loadAssignments returned", asg);
  } catch (err) {
    console.error("buildInitData: loadAssignments failed", err);
    throw err;
  }

  const validIds = new Set(collections.map((c) => c.id));
  const resolvedTier1 = tier1Id && validIds.has(tier1Id) ? tier1Id : null;
  const resolvedTier2 = tier2Id && validIds.has(tier2Id) ? tier2Id : null;

  const autoTier1 =
    resolvedTier1 ?? guessCollection(collections, ["semantic", "theme", "global"]);
  let autoTier2 =
    resolvedTier2 ?? guessCollection(collections, ["brand", "sub", "override", "child"]);
  // if the guess or stored value ends up identical to tier1, treat as no tier2
  if (autoTier2 && autoTier2 === autoTier1) {
    autoTier2 = null;
  }

  const tier1Collection = collections.find((c) => c.id === autoTier1);
  const tier2Collection = collections.find((c) => c.id === autoTier2);

  // dynamic list for switch panel: prefer collections whose name is
  // hierarchically under the tier‑1 name, otherwise just everything else.
  let subBrandCollections = makeSubBrandList(
    collections,
    autoTier1,
    tier1Collection?.name
  );
  console.log("makeSubBrandList initial", {
    tier1: tier1Collection?.name,
    autoTier1,
    subBrandCollections: subBrandCollections.map((c) => c.name),
  });
  // ensure the currently selected tier2 appears even if it's the only one
  if (autoTier2 && !subBrandCollections.find((c) => c.id === autoTier2)) {
    const t2col = collections.find((c) => c.id === autoTier2);
    if (t2col) {
      subBrandCollections.unshift({
        id: t2col.id,
        name: t2col.name,
        modes: t2col.modes.map((m) => m.name),
      });
    }
  }

  const result: InitData = {
    collections,
    tier1Id: autoTier1,
    tier2Id: autoTier2,
    tier1Modes: tier1Collection ? tier1Collection.modes.map((m) => m.name) : [],
    tier2Modes: tier2Collection ? tier2Collection.modes.map((m) => m.name) : [],
    tier1Name: tier1Collection?.name ?? "",
    tier2Name: tier2Collection?.name ?? "",
    subBrandCollections,
    gradientSets: Object.keys(GRADIENT_SETS),
  };
  console.log("buildInitData: returning", {
    tier1: result.tier1Name,
    tier2: result.tier2Name,
    collections: result.collections.length,
    subBrands: result.subBrandCollections.length,
  });
  return result;
}

// ── Message handler ───────────────────────────────────────────
figma.ui.onmessage = async (msg: UIMessage) => {
  switch (msg.type) {
    case "INIT": {
      try {
        const data = await buildInitData();
        figma.ui.postMessage({ type: "INIT_DATA", data });
      } catch (err) {
        console.error("INIT handler failed", err);
        figma.notify("Error initializing plugin – see console");
      }
      break;
    }

    case "ASSIGN_COLLECTIONS": {
      let { tier1Id, tier2Id } = msg;
      // equal assignments mean no tier2 override
      if (tier2Id && tier2Id === tier1Id) {
        tier2Id = null;
      }
      await saveAssignments(tier1Id, tier2Id);
      const collections = await getAllCollections();
      const t1 = collections.find((c) => c.id === tier1Id);
      const t2 = collections.find((c) => c.id === tier2Id);
      // recompute switch‑panel collection list, using the name of the new
      // tier1 collection if available so we can limit to its "children".
      let subBrandCollections = makeSubBrandList(
        collections,
        tier1Id,
        t1?.name
      );
      console.log("makeSubBrandList after assign", {
        tier1: t1?.name,
        tier1Id,
        subBrandCollections: subBrandCollections.map((c) => c.name),
      });
      if (tier2Id && !subBrandCollections.find((c) => c.id === tier2Id)) {
        const t2col = collections.find((c) => c.id === tier2Id);
        if (t2col) {
          subBrandCollections.unshift({
            id: t2col.id,
            name: t2col.name,
            modes: t2col.modes.map((m) => m.name),
          });
        }
      }
      figma.ui.postMessage({
        type: "COLLECTIONS_ASSIGNED",
        tier1Id,
        tier2Id,
        tier1Modes: t1 ? t1.modes.map((m) => m.name) : [],
        tier2Modes: t2 ? t2.modes.map((m) => m.name) : [],
        tier1Name: t1?.name ?? "",
        tier2Name: t2?.name ?? "",
        subBrandCollections,
      });
      break;
    }

    case "APPLY_THEME": {
      const { tier1CollectionId, tier1Mode, tier2CollectionId, tier2Mode, gradientSet, scope, allSubBrandIds } = msg;
      console.log("APPLY_THEME received", {
        tier1: { id: tier1CollectionId, mode: tier1Mode },
        tier2: { id: tier2CollectionId, mode: tier2Mode },
        gradient: gradientSet,
        scope,
        allSubBrandIds,
      });
      const results = [];

      // Clear overrides for all sub-brand collections that are NOT the active one.
      // This prevents stale "SubBrand / Brand A" entries from stacking up when
      // the user switches to "SubBrand / Brand B" (or vice versa).
      if (allSubBrandIds && allSubBrandIds.length > 0) {
        const inactive = allSubBrandIds.filter((id) => id !== tier2CollectionId);
        if (inactive.length > 0) {
          console.log("Deactivating inactive sub-brand collections:", inactive);
          await deactivateCollections(inactive, scope);
        }
      }

      // Rebase Semantic aliases to point at the newly active sub-brand collection.
      // This handles files where Semantic variables alias into sub-brand collections.
      if (tier1CollectionId && tier2CollectionId && allSubBrandIds && allSubBrandIds.length > 0) {
        console.log("Rebasing Semantic aliases to new sub-brand...");
        const { updated } = await rebaseSemanticAliases(tier1CollectionId, tier2CollectionId, allSubBrandIds);
        console.log(`Alias rebase complete: ${updated} updated`);
      }

      // Swap layer-level variable bindings for fills/strokes bound directly to
      // sub-brand collection variables (handles files where each brand is a
      // separate collection and fills are bound to brand variables, not Semantic).
      if (tier2CollectionId && allSubBrandIds && allSubBrandIds.length > 0) {
        console.log("Swapping layer variable bindings to new sub-brand...");
        const { swapped } = await swapLayerVariableBindings(allSubBrandIds, tier2CollectionId, scope);
        console.log(`Layer binding swap complete: ${swapped} swapped`);
      }

      if (tier1CollectionId && tier1Mode) {
        console.log("Applying tier1...");
        results.push(await switchCollectionMode(tier1CollectionId, tier1Mode, scope));
      }
      if (tier2CollectionId && tier2Mode) {
        console.log("Applying tier2...");
        results.push(await switchCollectionMode(tier2CollectionId, tier2Mode, scope));
      } else {
        console.log("Skipping tier2: id=", tier2CollectionId, "mode=", tier2Mode);
      }
      if (gradientSet) {
        console.log("Applying gradient...");
        results.push(await applyGradientSet(gradientSet));
      }

      figma.ui.postMessage({ type: "APPLY_RESULT", results });
      break;
    }

    case "SETUP_LIBRARY": {
      await setupTokenLibrary();
      const data = await buildInitData();
      figma.ui.postMessage({ type: "SETUP_DONE", data });
      break;
    }

    case "REFRESH": {
      const data = await buildInitData();
      figma.ui.postMessage({ type: "INIT_DATA", data });
      break;
    }

    case "CLOSE": {
      figma.closePlugin();
      break;
    }
  }
};
