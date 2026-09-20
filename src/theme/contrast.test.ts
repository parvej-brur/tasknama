import { describe, expect, it } from "@jest/globals";

import {
  PROJECT_COLOR_LABELS,
  PROJECT_SWATCHES,
  darkPalette,
  lightPalette,
  priorityColor,
  readableOn,
  type Palette,
} from "./tokens";

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;

// Every foreground / background pair the UI actually draws text with.
function textPairs(p: Palette): [string, string, string][] {
  return [
    ["text on background", p.text, p.background],
    ["text on surface", p.text, p.surface],
    ["muted text on background", p.textMuted, p.background],
    ["muted text on surface", p.textMuted, p.surface],
    ["muted text on alt surface", p.textMuted, p.surfaceAlt],
    ["primary text on surface", p.primary, p.surface],
    ["primary text on background", p.primary, p.background],
    ["primary text on primary tint", p.primary, p.primaryMuted],
    ["button label on primary", p.onPrimary, p.primary],
    ["danger text on surface", p.danger, p.surface],
    ["danger text on background", p.danger, p.background],
    ["danger text on danger tint", p.danger, p.dangerMuted],
    ["warning text on surface", p.warning, p.surface],
    ["warning text on warning tint", p.warning, p.warningMuted],
    ["success text on surface", p.success, p.surface],
    ["snackbar text", p.onSnackbar, p.snackbar],
    ["snackbar action", p.snackbarAction, p.snackbar],
    ["text on danger snackbar", p.onPrimary, p.danger],
    ["text on hero", p.onHero, p.hero],
    ["muted text on hero", p.onHeroMuted, p.hero],
    ["text on accent", p.onAccent, p.accent],
    ["highlight text on highlight", p.highlight.fg, p.highlight.bg],
    ["highlight text on surface (active tab label)", p.highlight.fg, p.surface],
    ["muted text on background (tabs, captions)", p.textMuted, p.background],
    ...Object.entries(p.tints).flatMap(([name, tint]): [string, string, string][] => [
      [`${name} tint text`, tint.fg, tint.bg],
      [`text on ${name} tint`, p.text, tint.bg],
    ]),
  ];
}

const palettes: [string, Palette][] = [
  ["light", lightPalette],
  ["dark", darkPalette],
];

describe.each(palettes)("%s palette meets WCAG AA (4.5:1) for text", (_name, palette) => {
  it.each(textPairs(palette))("%s", (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
  });

  it("priority colours are readable on the surface", () => {
    for (const priority of ["low", "medium", "high"] as const) {
      expect(contrast(priorityColor(priority, palette), palette.surface)).toBeGreaterThanOrEqual(AA);
    }
  });
});

describe.each(palettes)("%s palette non-text contrast (3:1)", (_name, palette) => {
  it("unchecked control edge is visible on the surface", () => {
    expect(contrast(palette.borderStrong, palette.surface)).toBeGreaterThanOrEqual(3);
  });
});

describe("readableOn", () => {
  it.each(Object.entries(PROJECT_SWATCHES))("%s swatch gets legible ink in both themes", (_id, swatch) => {
    for (const bg of [swatch.light, swatch.dark]) {
      expect(contrast(readableOn(bg), bg)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("project colours", () => {
  // Used as dots and progress fills, not text, so the non-text bar (3:1) applies.
  it.each(Object.entries(PROJECT_SWATCHES))("%s is visible on both surfaces", (_id, swatch) => {
    expect(contrast(swatch.light, lightPalette.surface)).toBeGreaterThanOrEqual(3);
    expect(contrast(swatch.dark, darkPalette.surface)).toBeGreaterThanOrEqual(3);
  });
});

// ---- Colour restrictions: no red, and no green / teal / aqua -----------------

function hueOf(hex: string): { hue: number; chroma: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  if (chroma === 0) return { hue: 0, chroma };
  const raw =
    max === r ? ((g - b) / chroma) % 6 : max === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
  return { hue: (raw * 60 + 360) % 360, chroma };
}

// Every solid colour the app can draw, with a name for the failure message.
function everyColour(): [string, string][] {
  const out: [string, string][] = [];
  const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9A-Fa-f]{6}$/.test(v);
  for (const [scheme, palette] of palettes) {
    for (const [key, value] of Object.entries(palette)) {
      if (isHex(value)) out.push([`${scheme}.${key}`, value]);
    }
    for (const [name, tint] of Object.entries(palette.tints)) {
      out.push([`${scheme}.tints.${name}.bg`, tint.bg], [`${scheme}.tints.${name}.fg`, tint.fg]);
    }
    out.push([`${scheme}.highlight.bg`, palette.highlight.bg], [`${scheme}.highlight.fg`, palette.highlight.fg]);
  }
  for (const [id, swatch] of Object.entries(PROJECT_SWATCHES)) {
    out.push([`swatch.${id}.light`, swatch.light], [`swatch.${id}.dark`, swatch.dark]);
  }
  return out;
}

describe("colour restrictions", () => {
  // Near-greys carry no meaningful hue, so only clearly coloured values are checked.
  const coloured = everyColour().filter(([, hex]) => hueOf(hex).chroma >= 0.08);

  it.each(coloured)("%s is not red", (_name, hex) => {
    const { hue } = hueOf(hex);
    expect(hue >= 338 || hue <= 14).toBe(false);
  });

  it.each(coloured)("%s is not green, teal or aqua", (_name, hex) => {
    const { hue } = hueOf(hex);
    expect(hue >= 70 && hue <= 200).toBe(false);
  });

  it("every project colour has a spoken name", () => {
    for (const id of Object.keys(PROJECT_SWATCHES)) {
      expect(PROJECT_COLOR_LABELS[id as keyof typeof PROJECT_COLOR_LABELS]).toBeTruthy();
    }
  });
});
