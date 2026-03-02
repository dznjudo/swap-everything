import { GradientSets } from "./types";

// ── Gradient sets are plugin-owned (not Figma variables) ─────
// These define the paint style content. Any layer using
// `gradient/hero`, `gradient/card`, or `gradient/surface`
// as a fill style will update automatically when a set is applied.

export const GRADIENT_SETS: GradientSets = {
  None: {},

  Vivid: {
    "gradient/hero": {
      type: "GRADIENT_LINEAR",
      stops: [
        { color: { r: 0.25, g: 0.47, b: 1, a: 1 }, position: 0 },
        { color: { r: 0.53, g: 0.15, b: 0.95, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
    "gradient/card": {
      type: "GRADIENT_RADIAL",
      stops: [
        { color: { r: 0.2, g: 0.72, b: 0.9, a: 1 }, position: 0 },
        { color: { r: 0.09, g: 0.38, b: 0.89, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
    "gradient/surface": {
      type: "GRADIENT_LINEAR",
      stops: [
        { color: { r: 0.07, g: 0.07, b: 0.18, a: 1 }, position: 0 },
        { color: { r: 0.16, g: 0.13, b: 0.35, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
  },

  Sunset: {
    "gradient/hero": {
      type: "GRADIENT_LINEAR",
      stops: [
        { color: { r: 1, g: 0.42, b: 0.21, a: 1 }, position: 0 },
        { color: { r: 0.95, g: 0.1, b: 0.47, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
    "gradient/card": {
      type: "GRADIENT_RADIAL",
      stops: [
        { color: { r: 1, g: 0.75, b: 0.3, a: 1 }, position: 0 },
        { color: { r: 1, g: 0.35, b: 0.15, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
    "gradient/surface": {
      type: "GRADIENT_LINEAR",
      stops: [
        { color: { r: 0.18, g: 0.07, b: 0.07, a: 1 }, position: 0 },
        { color: { r: 0.3, g: 0.1, b: 0.05, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
  },

  Forest: {
    "gradient/hero": {
      type: "GRADIENT_LINEAR",
      stops: [
        { color: { r: 0.13, g: 0.7, b: 0.46, a: 1 }, position: 0 },
        { color: { r: 0.05, g: 0.42, b: 0.29, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
    "gradient/card": {
      type: "GRADIENT_RADIAL",
      stops: [
        { color: { r: 0.6, g: 0.95, b: 0.7, a: 1 }, position: 0 },
        { color: { r: 0.13, g: 0.7, b: 0.46, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
    "gradient/surface": {
      type: "GRADIENT_LINEAR",
      stops: [
        { color: { r: 0.04, g: 0.12, b: 0.08, a: 1 }, position: 0 },
        { color: { r: 0.07, g: 0.2, b: 0.12, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
  },

  Aurora: {
    "gradient/hero": {
      type: "GRADIENT_LINEAR",
      stops: [
        { color: { r: 0.4, g: 0.9, b: 0.95, a: 1 }, position: 0 },
        { color: { r: 0.55, g: 0.3, b: 0.95, a: 1 }, position: 0.5 },
        { color: { r: 0.1, g: 0.9, b: 0.6, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
    "gradient/card": {
      type: "GRADIENT_RADIAL",
      stops: [
        { color: { r: 0.6, g: 0.95, b: 1, a: 0.3 }, position: 0 },
        { color: { r: 0.4, g: 0.2, b: 0.8, a: 0.8 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
    "gradient/surface": {
      type: "GRADIENT_LINEAR",
      stops: [
        { color: { r: 0.03, g: 0.07, b: 0.16, a: 1 }, position: 0 },
        { color: { r: 0.06, g: 0.04, b: 0.2, a: 1 }, position: 1 },
      ],
      transform: [[1, 0, 0], [0, 1, 0]],
    },
  },
};
