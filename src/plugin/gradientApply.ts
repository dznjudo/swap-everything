import { GRADIENT_SETS } from "./gradients";

// ── Apply a gradient set by mutating existing paint styles ────
// Because Figma can't bind gradients as variable aliases, the plugin
// updates the style *definitions* in place. Any layer using
// `gradient/hero` etc. as a fill style reflects the change immediately.

export async function applyGradientSet(
  setName: string
): Promise<{ success: boolean; message: string }> {
  if (setName === "None") {
    return { success: true, message: "Gradients unchanged." };
  }

  const gradients = GRADIENT_SETS[setName];
  if (!gradients) {
    return { success: false, message: `Unknown gradient set: "${setName}"` };
  }

  const localStyles = await figma.getLocalPaintStylesAsync();
  let updated = 0;
  let created = 0;

  for (const [styleName, gradient] of Object.entries(gradients)) {
    let style = localStyles.find((s) => s.name === styleName);
    const isNew = !style;

    if (!style) {
      style = figma.createPaintStyle();
      style.name = styleName;
      style.description = "Managed by Theme Switcher plugin";
    }

    style.paints = [
      {
        type: gradient.type,
        gradientTransform: gradient.transform,
        gradientStops: gradient.stops,
      },
    ];

    isNew ? created++ : updated++;
  }

  const parts: string[] = [];
  if (updated) parts.push(`${updated} updated`);
  if (created) parts.push(`${created} created`);

  return {
    success: true,
    message: `✓ Gradients → "${setName}" (${parts.join(", ")})`,
  };
}
