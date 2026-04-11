// ──────────────────────────────────────────────────────────────
// DehiGediyaConfig.ts — Single source of truth for all game
// constants, type definitions and asset paths.
// ──────────────────────────────────────────────────────────────

// ── Interfaces ───────────────────────────────────────────────

/** A 3-D perspective object travelling toward the player. */
export interface SceneObject {
  readonly type: "powerup";
  readonly subType: string;
  readonly col: number;
  readonly labelText: string;
  x: number;
  y: number;
  z: number;
  gfx: Phaser.GameObjects.Container;
  active: boolean;
}

/** A short-lived juice/dust splash particle. */
export interface JuiceParticle {
  circle: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  life: number;
}

/** Blueprint for a spawnable power-up type (good or bad). */
export interface PowerUpDef {
  readonly type: string;
  readonly icon: string;
  readonly label: string;
  readonly color: number;
}

/** Active power-up flavours the player can hold. */
export type ActivePowerUp = "steady" | "big" | "boost" | null;

// ── Physics ──────────────────────────────────────────────────

export const GRAVITY_STRENGTH = 9.2;
export const FRICTION_NORMAL = 0.95;
export const FRICTION_BIG_BOWL = 0.90;
export const LIME_DROP_THRESHOLD = 1.0;
export const LIME_WARNING_THRESHOLD = 0.72;

// ── Spoon & tilt ─────────────────────────────────────────────

export const MAX_TILT_DEG = 42;
export const ANGLE_LERP_SPEED = 11;

// ── Speed & difficulty ───────────────────────────────────────

export const BASE_Z_SPEED = 280;
export const DIFFICULTY_RAMP_RATE = 0.018;
export const DIFFICULTY_SPEED_SCALE = 22;
export const BOOST_SPEED_MULT = 1.9;
export const BOOST_SCORE_PER_SEC = 35;
export const COMBO_INTERVAL_SEC = 4.5;
export const MAX_COMBO = 8;

// ── Power-up timing ──────────────────────────────────────────

export const POWERUP_SPAWN_INTERVAL_MS = 3500;
export const POWERUP_DURATION_SEC = 7;
export const BAD_CHANCE = 0.35;

// ── Perspective ──────────────────────────────────────────────

export const FOCAL_LENGTH = 320;
export const HORIZON_RATIO = 0.42;

// ── Layout ratios (relative to screen size) ──────────────────

export const SPOON_LENGTH_RATIO = 0.55;
export const SPOON_LENGTH_MAX = 340;
export const BOWL_R_RATIO = 0.09;
export const BOWL_R_MAX = 64;
export const BOWL_R_BIG_RATIO = 0.14;
export const BOWL_R_BIG_MAX = 100;
export const LIME_R_RATIO = 0.055;
export const LIME_R_MAX = 40;

// ── Collision / catch zones ──────────────────────────────────

export const CATCH_Z_MIN = 40;
export const CATCH_Z_MAX = 160;
export const CATCH_X_RADIUS = 130;
export const POWERUP_SPAWN_X_MIN = -220;
export const POWERUP_SPAWN_X_MAX = 220;

// ── Keyboard ─────────────────────────────────────────────────

export const KEYBOARD_SPEED = 1400;

// ── Wobble ───────────────────────────────────────────────────

export const WOBBLE_BASE_AMP = 11;
export const WOBBLE_DIFFICULTY_SCALE = 3.5;
export const WOBBLE_BASE_SPEED = 1.8;
export const WOBBLE_DIFFICULTY_SPEED_SCALE = 0.55;
export const WOBBLE_STEADY_MULT = 0.15;

// ── Bob ──────────────────────────────────────────────────────

export const BOB_BASE_FREQ = 9;
export const BOB_MAX_FREQ_ADD = 8;
export const BOB_AMP = 14;

// ── Scoring ──────────────────────────────────────────────────

export const ROCK_PENALTY = 500;
export const INITIAL_LIVES = 3;

// ── Particle ─────────────────────────────────────────────────

export const JUICE_PARTICLE_MIN_R = 4;
export const JUICE_PARTICLE_MAX_R = 10;
export const JUICE_PARTICLE_MIN_SPEED = 60;
export const JUICE_PARTICLE_MAX_SPEED = 220;
export const JUICE_PARTICLE_UPWARD_BIAS = 80;
export const JUICE_PARTICLE_GRAVITY = 400;
export const JUICE_PARTICLE_DECAY = 1.8;
export const JUICE_BURST_COUNT = 18;
export const POWERUP_BURST_COUNT = 14;

// ── UI ───────────────────────────────────────────────────────

export const MOBILE_BREAKPOINT = 600;
export const DROP_ANIM_DURATION = 550;
export const DROP_RESET_DELAY = 700;
export const GAMEOVER_DELAY = 1200;
export const HINT_FADE_DELAY = 4000;

// ── Power-up catalogues ──────────────────────────────────────

export const GOOD_POWERUPS: readonly PowerUpDef[] = [
  { type: "steady", icon: "✋",  label: "STEADY",   color: 0x3498db },
  { type: "big",    icon: "🍽️", label: "BIG BOWL", color: 0xf39c12 },
  { type: "boost",  icon: "⚡",  label: "DASH!",    color: 0xe74c3c },
] as const;

export const BAD_POWERUPS: readonly PowerUpDef[] = [
  { type: "crow", icon: "🐦‍⬛", label: "CROW", color: 0x882222 },
  { type: "rock", icon: "🪨",   label: "ROCK", color: 0xff3333 },
] as const;

// ── Assets ───────────────────────────────────────────────────

export const ASSETS = {
  video: { key: "dehi_bg",   path: "/Dehi/dehi_bg.mp4" },
  audio: {
    bgm:  { key: "dehi_bgm",  path: "/Dehi/bgd.mp3"  },
    good: { key: "dehi_good", path: "/Dehi/good.mp3" },
    bad:  { key: "dehi_bad",  path: "/Dehi/bad.mp3"  },
    lose: { key: "dehi_lose", path: "/Dehi/lose.mp3" },
  },
} as const;
