import { GRADIENT_SETS } from "./gradients";
import { saveAssignments } from "./collections";

// ═══════════════════════════════════════════════════════════════
// Token Library Setup
// Seeds Figma with Foundation → Semantic → SubBrand collections.
// After seeding, the plugin only reads from Figma — never from
// these definitions again. Add/remove tokens in Figma freely.
// ═══════════════════════════════════════════════════════════════

export async function setupTokenLibrary(): Promise<void> {
  figma.notify("Building token library…", { timeout: 3000 });

  const hex = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return {
      r: ((n >> 16) & 255) / 255,
      g: ((n >> 8) & 255) / 255,
      b: (n & 255) / 255,
      a: 1,
    };
  };

  // ── 1. Foundation ────────────────────────────────────────────
  const foundation = figma.variables.createVariableCollection("Foundation");
  foundation.renameMode(foundation.modes[0].modeId, "Default");
  const fMode = foundation.modes[0].modeId;

  const foundationTokens: Record<string, string> = {
    "blue/50": "#e3f2fd", "blue/100": "#bbdefb", "blue/200": "#90caf9",
    "blue/300": "#64b5f6", "blue/400": "#42a5f5", "blue/500": "#2196f3",
    "blue/600": "#1e88e5", "blue/700": "#1976d2", "blue/800": "#1565c0", "blue/900": "#0d47a1",
    "grey/50": "#fafafa", "grey/100": "#f5f5f5", "grey/200": "#eeeeee",
    "grey/300": "#e0e0e0", "grey/400": "#bdbdbd", "grey/500": "#9e9e9e",
    "grey/600": "#757575", "grey/700": "#616161", "grey/800": "#424242", "grey/900": "#212121",
    "red/100": "#ffcdd2", "red/300": "#e57373", "red/500": "#f44336", "red/700": "#d32f2f", "red/900": "#b71c1c",
    "green/100": "#c8e6c9", "green/300": "#81c784", "green/500": "#4caf50", "green/700": "#388e3c", "green/900": "#1b5e20",
    "orange/100": "#ffe0b2", "orange/300": "#ffb74d", "orange/500": "#ff9800", "orange/700": "#f57c00",
    "purple/100": "#e1bee7", "purple/300": "#ba68c8", "purple/500": "#9c27b0", "purple/700": "#7b1fa2",
    "teal/100": "#b2dfdb", "teal/300": "#4db6ac", "teal/500": "#009688", "teal/700": "#00796b",
    "common/white": "#ffffff", "common/black": "#000000",
    "dark/surface/1": "#121212", "dark/surface/2": "#1e1e1e",
    "dark/surface/3": "#252525", "dark/surface/4": "#2c2c2c",
  };

  const fVars: Record<string, Variable> = {};
  for (const [name, hexVal] of Object.entries(foundationTokens)) {
    const v = figma.variables.createVariable(name, foundation, "COLOR");
    v.setValueForMode(fMode, hex(hexVal));
    fVars[name] = v;
  }

  const alias = (key: string): VariableAlias => ({
    type: "VARIABLE_ALIAS",
    id: fVars[key].id,
  });

  // ── 2. Semantic ──────────────────────────────────────────────
  const semantic = figma.variables.createVariableCollection("Semantic");
  semantic.renameMode(semantic.modes[0].modeId, "Light");
  const darkModeId = semantic.addMode("Dark");
  const lightModeId = semantic.modes[0].modeId;

  const semanticDefs: [string, string, string][] = [
    ["color/background/primary",   "common/white",   "dark/surface/1"],
    ["color/background/secondary", "grey/50",        "dark/surface/2"],
    ["color/background/elevated",  "common/white",   "dark/surface/3"],
    ["color/surface/default",      "grey/100",       "dark/surface/2"],
    ["color/surface/overlay",      "grey/200",       "dark/surface/4"],
    ["color/text/primary",         "grey/900",       "common/white"],
    ["color/text/secondary",       "grey/600",       "grey/400"],
    ["color/text/disabled",        "grey/400",       "grey/600"],
    ["color/text/inverse",         "common/white",   "grey/900"],
    ["color/border/default",       "grey/300",       "grey/700"],
    ["color/border/strong",        "grey/500",       "grey/500"],
    ["color/border/focus",         "blue/500",       "blue/300"],
    ["color/action/primary",       "blue/600",       "blue/400"],
    ["color/action/primary/hover", "blue/700",       "blue/300"],
    ["color/action/primary/text",  "common/white",   "common/white"],
    ["color/state/success",        "green/500",      "green/300"],
    ["color/state/warning",        "orange/500",     "orange/300"],
    ["color/state/error",          "red/500",        "red/300"],
    ["color/state/info",           "blue/500",       "blue/300"],
    ["color/state/success/bg",     "green/100",      "green/900"],
    ["color/state/error/bg",       "red/100",        "red/900"],
    ["color/brand/accent",         "blue/500",       "blue/300"],
    ["color/brand/accent/muted",   "blue/100",       "blue/900"],
    ["color/brand/secondary",      "purple/500",     "purple/300"],
  ];

  for (const [name, lightKey, darkKey] of semanticDefs) {
    const v = figma.variables.createVariable(name, semantic, "COLOR");
    v.setValueForMode(lightModeId, alias(lightKey));
    v.setValueForMode(darkModeId, alias(darkKey));
  }

  // ── 3. SubBrand ──────────────────────────────────────────────
  const subBrand = figma.variables.createVariableCollection("SubBrand");
  subBrand.renameMode(subBrand.modes[0].modeId, "Default");
  const brandAModeId = subBrand.addMode("Brand A");
  const brandBModeId = subBrand.addMode("Brand B");
  const defaultSubModeId = subBrand.modes[0].modeId;

  const subBrandDefs: [string, string, string, string][] = [
    ["color/brand/accent",         "blue/500",   "teal/500",   "orange/500"],
    ["color/brand/accent/muted",   "blue/100",   "teal/100",   "orange/100"],
    ["color/brand/secondary",      "purple/500", "teal/300",   "orange/300"],
    ["color/action/primary",       "blue/600",   "teal/700",   "orange/700"],
    ["color/action/primary/hover", "blue/700",   "teal/500",   "orange/500"],
    ["color/border/focus",         "blue/500",   "teal/500",   "orange/500"],
  ];

  for (const [name, defKey, aKey, bKey] of subBrandDefs) {
    const v = figma.variables.createVariable(name, subBrand, "COLOR");
    v.setValueForMode(defaultSubModeId, alias(defKey));
    v.setValueForMode(brandAModeId, alias(aKey));
    v.setValueForMode(brandBModeId, alias(bKey));
  }

  // ── 4. Gradient paint styles ──────────────────────────────────
  const initialSet = GRADIENT_SETS["Vivid"];
  for (const [styleName, gradient] of Object.entries(initialSet)) {
    const style = figma.createPaintStyle();
    style.name = styleName;
    style.description = "Managed by Theme Switcher — swap via plugin";
    style.paints = [
      {
        type: gradient.type,
        gradientTransform: gradient.transform,
        gradientStops: gradient.stops,
      },
    ];
  }

  // ── 5. Save collection assignments ───────────────────────────
  await saveAssignments(semantic.id, subBrand.id);

  // ── 6. Build sample frames ────────────────────────────────────
  await buildSampleFrames(semantic, subBrand);

  // ── 7. Set initial page-level mode overrides ─────────────────
  // Without this, all variable-bound fills show "?" in Figma because
  // no explicit mode has been declared anywhere in the scope chain.
  const lightMode = semantic.modes.find((m) => m.name === "Light");
  if (lightMode) {
    figma.currentPage.setExplicitVariableModeForCollection(semantic, lightMode.modeId);
  }
  const brandAMode = subBrand.modes.find((m) => m.name === "Brand A");
  if (brandAMode) {
    figma.currentPage.setExplicitVariableModeForCollection(subBrand, brandAMode.modeId);
  }
}

// ── Dynamic sample frame builder ─────────────────────────────
async function buildSampleFrames(
  semanticCollection: VariableCollection,
  subBrandCollection: VariableCollection
): Promise<void> {
  const page = figma.currentPage;
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const allVars = await figma.variables.getLocalVariablesAsync("COLOR");
  const semanticVars = allVars.filter(
    (v) => v.variableCollectionId === semanticCollection.id
  );
  const subBrandVars = allVars.filter(
    (v) => v.variableCollectionId === subBrandCollection.id
  );

  // Unified name→variable map. SubBrand overrides Semantic for shared names.
  const varByName: Record<string, { variable: Variable; source: string }> = {};
  for (const v of semanticVars) varByName[v.name] = { variable: v, source: "semantic" };
  for (const v of subBrandVars) varByName[v.name] = { variable: v, source: "subbrand" };

  const bindFill = (node: GeometryMixin, tokenName: string): boolean => {
    const entry = varByName[tokenName];
    if (!entry) return false;
    (node as RectangleNode).fills = [
      figma.variables.setBoundVariableForPaint(
        { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } },
        "color",
        entry.variable
      ),
    ];
    return true;
  };

  const bindStroke = (node: GeometryMixin, tokenName: string): boolean => {
    const entry = varByName[tokenName];
    if (!entry) return false;
    (node as RectangleNode).strokes = [
      figma.variables.setBoundVariableForPaint(
        { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
        "color",
        entry.variable
      ),
    ];
    return true;
  };

  const bindTextFill = (textNode: TextNode, tokenName: string): boolean => {
    const entry = varByName[tokenName];
    if (!entry) return false;
    textNode.fills = [
      figma.variables.setBoundVariableForPaint(
        { type: "SOLID", color: { r: 0, g: 0, b: 0 } },
        "color",
        entry.variable
      ),
    ];
    return true;
  };

  const findToken = (...patterns: string[]): string | null => {
    for (const pattern of patterns) {
      const key = Object.keys(varByName).find((n) => n.includes(pattern));
      if (key) return key;
    }
    return null;
  };

  const bgPrimary      = findToken("background/primary", "background");
  const actionPrimary  = findToken("action/primary");
  const actionText     = findToken("action/primary/text", "text/inverse");
  const textSecondary  = findToken("text/secondary");
  const borderDefault  = findToken("border/default");
  const borderFocus    = findToken("border/focus");
  const surfaceDefault = findToken("surface/default", "background/secondary");

  // ── Token Preview Card ───────────────────────────────────────
  const card = figma.createFrame();
  card.name = "🎨 Token Preview Card";
  card.resize(360, 480);
  card.cornerRadius = 12;
  card.x = 0; card.y = 0;
  if (bgPrimary) bindFill(card, bgPrimary);

  const header = figma.createFrame();
  header.name = "Header";
  header.resize(360, 72);
  if (actionPrimary) bindFill(header, actionPrimary);
  card.appendChild(header);

  const titleTxt = figma.createText();
  titleTxt.fontName = { family: "Inter", style: "Bold" };
  titleTxt.characters = "Token Preview";
  titleTxt.fontSize = 18;
  titleTxt.x = 20; titleTxt.y = 24;
  if (!bindTextFill(titleTxt, actionText ?? "")) {
    titleTxt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  }
  header.appendChild(titleTxt);

  const subtitleTxt = figma.createText();
  subtitleTxt.fontName = { family: "Inter", style: "Regular" };
  subtitleTxt.characters = `${semanticVars.length} semantic · ${subBrandVars.length} sub-brand tokens`;
  subtitleTxt.fontSize = 12;
  subtitleTxt.x = 20; subtitleTxt.y = 88;
  if (!bindTextFill(subtitleTxt, textSecondary ?? "")) {
    subtitleTxt.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
  }
  card.appendChild(subtitleTxt);

  const divider = figma.createRectangle();
  divider.resize(320, 1); divider.x = 20; divider.y = 116;
  if (!bindFill(divider, borderDefault ?? "")) {
    divider.fills = [{ type: "SOLID", color: { r: 0.9, g: 0.9, b: 0.9 } }];
  }
  card.appendChild(divider);

  const chipY = 132;
  const subOnlyTokens = subBrandVars.slice(0, 3);
  for (let i = 0; i < subOnlyTokens.length; i++) {
    const v = subOnlyTokens[i];
    const chip = figma.createFrame();
    chip.name = `SubBrand/${v.name.split("/").pop()}`;
    chip.resize(100, 28);
    chip.x = 20 + i * 112; chip.y = chipY;
    chip.cornerRadius = 14;
    chip.fills = [
      figma.variables.setBoundVariableForPaint(
        { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } },
        "color",
        v
      ),
    ];
    card.appendChild(chip);
  }

  const btn = figma.createFrame();
  btn.name = "Button/Primary";
  btn.resize(320, 44);
  btn.x = 20; btn.y = chipY + 44;
  btn.cornerRadius = 8;
  if (actionPrimary) bindFill(btn, actionPrimary);
  card.appendChild(btn);

  const btnTxt = figma.createText();
  btnTxt.fontName = { family: "Inter", style: "Bold" };
  btnTxt.characters = "Primary Action";
  btnTxt.fontSize = 15;
  btnTxt.x = 100; btnTxt.y = 12;
  if (!bindTextFill(btnTxt, actionText ?? "")) {
    btnTxt.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  }
  btn.appendChild(btnTxt);

  const ghost = figma.createFrame();
  ghost.name = "Button/Ghost";
  ghost.resize(320, 44);
  ghost.x = 20; ghost.y = chipY + 100;
  ghost.cornerRadius = 8;
  ghost.strokeWeight = 1.5;
  if (bgPrimary) bindFill(ghost, bgPrimary);
  if (actionPrimary) bindStroke(ghost, actionPrimary);
  card.appendChild(ghost);

  const ghostTxt = figma.createText();
  ghostTxt.fontName = { family: "Inter", style: "Bold" };
  ghostTxt.characters = "Ghost Action";
  ghostTxt.fontSize = 15;
  ghostTxt.x = 108; ghostTxt.y = 12;
  if (!bindTextFill(ghostTxt, actionPrimary ?? "")) {
    ghostTxt.fills = [{ type: "SOLID", color: { r: 0.2, g: 0.2, b: 0.2 } }];
  }
  ghost.appendChild(ghostTxt);

  const inputFrame = figma.createFrame();
  inputFrame.name = "Input/Focus State";
  inputFrame.resize(320, 44);
  inputFrame.x = 20; inputFrame.y = chipY + 160;
  inputFrame.cornerRadius = 6;
  inputFrame.strokeWeight = 2;
  if (surfaceDefault) bindFill(inputFrame, surfaceDefault);
  if (borderFocus) bindStroke(inputFrame, borderFocus);
  card.appendChild(inputFrame);

  const inputTxt = figma.createText();
  inputTxt.fontName = { family: "Inter", style: "Regular" };
  inputTxt.characters = "Focus border (sub-brand override)";
  inputTxt.fontSize = 12;
  inputTxt.x = 12; inputTxt.y = 13;
  if (!bindTextFill(inputTxt, textSecondary ?? "")) {
    inputTxt.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
  }
  inputFrame.appendChild(inputTxt);

  const paintStyles = await figma.getLocalPaintStylesAsync();
  const gradientStyles = paintStyles.filter((s) => s.name.startsWith("gradient/"));

  if (gradientStyles.length > 0) {
    const gradBand = figma.createRectangle();
    gradBand.name = gradientStyles[0].name;
    gradBand.resize(360, 72);
    gradBand.x = 0; gradBand.y = chipY + 220;
    gradBand.fillStyleId = gradientStyles[0].id;
    card.appendChild(gradBand);

    const gradLabel = figma.createText();
    gradLabel.fontName = { family: "Inter", style: "Bold" };
    gradLabel.characters = gradientStyles[0].name;
    gradLabel.fontSize = 12;
    gradLabel.x = 20; gradLabel.y = chipY + 234;
    gradLabel.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    card.appendChild(gradLabel);
  }

  page.appendChild(card);

  // ── Swatch Grid ───────────────────────────────────────────────
  const SWATCH_SIZE = 64;
  const SWATCH_GAP = 8;
  const COLS = 4;
  const LABEL_H = 20;

  const allDisplayVars = [
    ...semanticVars.map((v) => ({ variable: v, source: "semantic" })),
    ...subBrandVars
      .filter((v) => !semanticVars.find((s) => s.name === v.name))
      .map((v) => ({ variable: v, source: "subbrand" })),
  ];

  const groups: Record<string, { variable: Variable; source: string }[]> = {};
  for (const { variable, source } of allDisplayVars) {
    const parts = variable.name.split("/");
    const groupKey = parts.length >= 2 ? parts[1] : "other";
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push({ variable, source });
  }

  let gridX = 400;
  let gridY = 0;

  for (const [groupName, items] of Object.entries(groups)) {
    const rows = Math.ceil(items.length / COLS);
    const gridW = COLS * (SWATCH_SIZE + SWATCH_GAP) + 16;
    const gridH = rows * (SWATCH_SIZE + LABEL_H + SWATCH_GAP) + 40;

    const groupFrame = figma.createFrame();
    groupFrame.name = `🎨 ${groupName}`;
    groupFrame.resize(gridW, gridH);
    groupFrame.x = gridX;
    groupFrame.y = gridY;
    groupFrame.cornerRadius = 10;
    groupFrame.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.96, b: 0.97 } }];

    const groupLabel = figma.createText();
    groupLabel.fontName = { family: "Inter", style: "Bold" };
    groupLabel.characters = groupName.toUpperCase();
    groupLabel.fontSize = 10;
    groupLabel.letterSpacing = { value: 0.8, unit: "PIXELS" };
    groupLabel.x = 12; groupLabel.y = 10;
    groupLabel.fills = [{ type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } }];
    groupFrame.appendChild(groupLabel);

    for (let i = 0; i < items.length; i++) {
      const { variable, source } = items[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const sx = 8 + col * (SWATCH_SIZE + SWATCH_GAP);
      const sy = 28 + row * (SWATCH_SIZE + LABEL_H + SWATCH_GAP);

      const swatch = figma.createFrame();
      swatch.name = variable.name;
      swatch.resize(SWATCH_SIZE, SWATCH_SIZE);
      swatch.x = sx; swatch.y = sy;
      swatch.cornerRadius = 6;

      if (source === "subbrand") {
        swatch.strokeWeight = 2;
        swatch.strokes = [{ type: "SOLID", color: { r: 0.9, g: 0.6, b: 0.1 } }];
      }

      swatch.fills = [
        figma.variables.setBoundVariableForPaint(
          { type: "SOLID", color: { r: 0.5, g: 0.5, b: 0.5 } },
          "color",
          variable
        ),
      ];
      groupFrame.appendChild(swatch);

      const lastSegment = variable.name.split("/").slice(-2).join("/");
      const swatchTxt = figma.createText();
      swatchTxt.fontName = { family: "Inter", style: "Regular" };
      swatchTxt.characters = lastSegment;
      swatchTxt.fontSize = 9;
      swatchTxt.x = sx;
      swatchTxt.y = sy + SWATCH_SIZE + 2;
      swatchTxt.resize(SWATCH_SIZE, LABEL_H);
      swatchTxt.fills = [{ type: "SOLID", color: { r: 0.4, g: 0.4, b: 0.4 } }];
      groupFrame.appendChild(swatchTxt);
    }

    page.appendChild(groupFrame);
    gridX += gridW + 16;
    if (gridX > 1600) { gridX = 400; gridY += gridH + 24; }
  }

  figma.viewport.scrollAndZoomIntoView(page.children);
}
