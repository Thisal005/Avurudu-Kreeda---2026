// ──────────────────────────────────────────────────────────────
// DehiGediyaRenderer.ts — Pure drawing helpers for the first-
// person spoon-and-lime perspective.  Every function receives
// only the graphics handles and coordinates it needs; no game
// state is mutated, making these functions easy to test and
// reason about.
// ──────────────────────────────────────────────────────────────

import { LIME_WARNING_THRESHOLD } from "./DehiGediyaConfig";

// ── Spoon handle ─────────────────────────────────────────────

export function drawSpoonHandle(
  gfx: Phaser.GameObjects.Graphics,
  pivotX: number,
  pivotY: number,
  tipX: number,
  tipY: number,
  perpX: number,
  perpY: number,
  bottomWidth: number,
  topWidth: number,
): void {
  // Base metallic body
  gfx.fillStyle(0xb0b0b0, 1);
  gfx.beginPath();
  gfx.moveTo(pivotX - bottomWidth * perpX, pivotY - bottomWidth * perpY);
  gfx.lineTo(tipX - topWidth * perpX, tipY - topWidth * perpY);
  gfx.lineTo(tipX + topWidth * perpX, tipY + topWidth * perpY);
  gfx.lineTo(pivotX + bottomWidth * perpX, pivotY + bottomWidth * perpY);
  gfx.closePath();
  gfx.fillPath();

  // Dark edge reflection (left)
  gfx.lineStyle(6, 0x444444, 0.8);
  gfx.beginPath();
  gfx.moveTo(pivotX - bottomWidth * perpX, pivotY - bottomWidth * perpY);
  gfx.lineTo(tipX - topWidth * perpX, tipY - topWidth * perpY);
  gfx.strokePath();

  // Lighter edge reflection (right)
  gfx.lineStyle(4, 0x888888, 0.7);
  gfx.beginPath();
  gfx.moveTo(pivotX + bottomWidth * perpX, pivotY + bottomWidth * perpY);
  gfx.lineTo(tipX + topWidth * perpX, tipY + topWidth * perpY);
  gfx.strokePath();

  // Centre highlight (shiny metal)
  gfx.lineStyle(2, 0xffffff, 0.9);
  gfx.beginPath();
  gfx.moveTo(
    pivotX - bottomWidth * 0.3 * perpX,
    pivotY - bottomWidth * 0.3 * perpY,
  );
  gfx.lineTo(tipX - topWidth * 0.3 * perpX, tipY - topWidth * 0.3 * perpY);
  gfx.strokePath();
}

// ── Spoon bowl ───────────────────────────────────────────────

export function drawSpoonBowl(
  gfx: Phaser.GameObjects.Graphics,
  tipX: number,
  tipY: number,
  bowlR: number,
): void {
  // Outer metallic base
  gfx.fillStyle(0xcccccc, 1);
  gfx.fillCircle(tipX, tipY, bowlR);

  // Rim shadow
  gfx.lineStyle(3, 0x555555, 1);
  gfx.strokeCircle(tipX, tipY, bowlR);

  // Inner concave
  gfx.fillStyle(0x999999, 1);
  gfx.fillCircle(tipX, tipY, bowlR * 0.85);

  // Deep shadow at bottom
  gfx.fillStyle(0x666666, 0.6);
  gfx.fillCircle(tipX, tipY + bowlR * 0.2, bowlR * 0.65);

  // Sheen at top lip
  gfx.fillStyle(0xffffff, 0.6);
  gfx.fillEllipse(tipX, tipY - bowlR * 0.6, bowlR * 1.2, bowlR * 0.35);
}

// ── Lime ─────────────────────────────────────────────────────

const DIMPLE_ANGLE_STEP = 137.5; // golden-angle for natural pore spacing

export function drawLime(
  limeGfx: Phaser.GameObjects.Graphics,
  shadowGfx: Phaser.GameObjects.Graphics,
  limeX: number,
  limeY: number,
  limeR: number,
): void {
  // Contact shadow inside bowl
  shadowGfx.fillStyle(0x000000, 0.4);
  shadowGfx.fillEllipse(limeX + 2, limeY + limeR * 0.6, limeR * 1.4, limeR * 0.6);

  // Dark green base shadow
  limeGfx.fillStyle(0x1e5c1e, 1);
  limeGfx.fillCircle(limeX, limeY, limeR);

  // Bright green midtone
  limeGfx.fillStyle(0x32cd32, 1);
  limeGfx.fillCircle(limeX - limeR * 0.1, limeY - limeR * 0.1, limeR * 0.9);

  // Yellow-green sheen top
  limeGfx.fillStyle(0x7cfc00, 0.8);
  limeGfx.fillCircle(limeX - limeR * 0.25, limeY - limeR * 0.25, limeR * 0.5);

  // Skin dimples (pores)
  limeGfx.fillStyle(0x1e5c1e, 0.4);
  for (let i = 0; i < 12; i++) {
    const dx = Math.cos(i * DIMPLE_ANGLE_STEP) * limeR * 0.6;
    const dy = Math.sin(i * DIMPLE_ANGLE_STEP) * limeR * 0.6;
    limeGfx.fillCircle(limeX + dx, limeY + dy, 1.5);
  }

  // Specular glossy reflections
  limeGfx.fillStyle(0xffffff, 0.6);
  limeGfx.fillCircle(limeX - limeR * 0.35, limeY - limeR * 0.35, limeR * 0.15);
  limeGfx.fillCircle(limeX - limeR * 0.45, limeY - limeR * 0.25, limeR * 0.06);

  // Stem
  limeGfx.fillStyle(0x2d6a2d, 1);
  limeGfx.fillCircle(limeX + limeR * 0.65, limeY - limeR * 0.65, limeR * 0.16);
}

// ── Warning overlay ──────────────────────────────────────────

/**
 * Draws the orange danger tint when the lime is close to falling.
 * Returns true if the warning is active (for juice-drip particle spawning).
 */
export function drawWarningOverlay(
  warningGfx: Phaser.GameObjects.Graphics,
  limeOffset: number,
  gameW: number,
  gameH: number,
): boolean {
  const absOffset = Math.abs(limeOffset);

  if (absOffset > LIME_WARNING_THRESHOLD) {
    const warningAlpha = (absOffset - LIME_WARNING_THRESHOLD) / (1 - LIME_WARNING_THRESHOLD);
    warningGfx.clear();
    warningGfx.fillStyle(0xff6600, warningAlpha * 0.3);
    warningGfx.fillRect(0, 0, gameW, gameH);
    warningGfx.setAlpha(1);
    return true;
  }

  warningGfx.clear();
  warningGfx.setAlpha(0);
  return false;
}

// ── Hands ────────────────────────────────────────────────────

export function drawHands(
  gfx: Phaser.GameObjects.Graphics,
  pivotX: number,
  pivotY: number,
  perpX: number,
  perpY: number,
  bottomWidth: number,
): void {
  const skinColor = 0xf5cba7;
  const skinDark = 0xd4956a;
  const sleeveCol = 0xffffff;

  // Sleeves (Sri Lankan white Avurudu shirt cuffs)
  gfx.fillStyle(sleeveCol, 1);
  gfx.fillRoundedRect(pivotX - bottomWidth - 76, pivotY - 10, 96, 180, 14);
  gfx.fillRoundedRect(pivotX + bottomWidth - 20, pivotY - 10, 96, 180, 14);

  // Cuff borders
  gfx.lineStyle(3, 0xe0c8a0, 1);
  gfx.strokeRoundedRect(pivotX - bottomWidth - 76, pivotY - 10, 96, 180, 14);
  gfx.strokeRoundedRect(pivotX + bottomWidth - 20, pivotY - 10, 96, 180, 14);

  // Left hand
  gfx.fillStyle(skinColor, 1);
  gfx.fillCircle(pivotX - bottomWidth - 28, pivotY - 20, 54);
  gfx.lineStyle(3, skinDark, 1);
  gfx.strokeCircle(pivotX - bottomWidth - 28, pivotY - 20, 54);

  // Left fingers
  for (let f = -1; f <= 3; f++) {
    gfx.fillStyle(skinColor, 1);
    gfx.fillRoundedRect(
      pivotX - bottomWidth * perpX - 28 + f * 15 - 6,
      pivotY - bottomWidth * perpY - 66,
      10,
      28,
      5,
    );
  }

  // Right hand
  gfx.fillStyle(skinColor, 1);
  gfx.fillCircle(pivotX + bottomWidth + 28, pivotY - 20, 54);
  gfx.lineStyle(3, skinDark, 1);
  gfx.strokeCircle(pivotX + bottomWidth + 28, pivotY - 20, 54);

  // Right fingers
  for (let f = -1; f <= 3; f++) {
    gfx.fillStyle(skinColor, 1);
    gfx.fillRoundedRect(
      pivotX + bottomWidth * perpX + 28 + f * 15 - 6,
      pivotY + bottomWidth * perpY - 66,
      10,
      28,
      5,
    );
  }
}
