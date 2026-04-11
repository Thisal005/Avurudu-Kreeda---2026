// ──────────────────────────────────────────────────────────────
// GiniUthsawayaConfig.ts — single source of truth for all
// firecracker data, asset paths and layout constants.
// ──────────────────────────────────────────────────────────────

/** Shape of one firecracker item in the shop catalogue. */
export interface FirecrackerType {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly image: string;
}

/** Master catalogue – order determines shop display order. */
export const FIRECRACKERS: readonly FirecrackerType[] = [
  { id: 'patas',     name: 'Small Patas',       price: 50,   image: '/firecrackers/One.png'   },
  { id: 'flowerpot', name: 'Big Pattas',         price: 120,  image: '/firecrackers/Two.png'   },
  { id: 'chakkaram', name: 'Chakkaram / Wheel',  price: 180,  image: '/firecrackers/Four.png'  },
  { id: 'rocket',    name: 'Rocket',             price: 250,  image: '/firecrackers/Five.png'  },
  { id: 'bomb',      name: 'Big Bomb',           price: 320,  image: '/firecrackers/Eight.png' },
  { id: 'mega',      name: 'Mega Pack',          price: 800,  image: '/firecrackers/Three.png' },
  { id: 'Time Bomb', name: 'Time Bomb',          price: 1000, image: '/firecrackers/Six.png'   },
  { id: 'Nuce',      name: 'Nuce',               price: 2000, image: '/firecrackers/Seven.png' },
] as const;

// ── Audio ────────────────────────────────────────────────────

/** Map of logical sound-key → public asset path. */
export const SOUND_FILES: Readonly<Record<string, string>> = {
  patas:     '/firecrackers/patas.mp3',
  bigpatas:  '/firecrackers/bigpatas.mp3',
  chakkaram: '/firecrackers/chakra.mp3',
  rocket:    '/firecrackers/rocket.MP3',
  bomb:      '/firecrackers/bomb.mp3',
  timebomb1: '/firecrackers/sound_1.mp3',
  timebomb2: '/firecrackers/timebomb.mp3',
  nuce1:     '/firecrackers/nuce1.mp3',
  nuce2:     '/firecrackers/nuce2.mp3',
};

// ── Textures ─────────────────────────────────────────────────

/** Phaser texture-key → public image path.  Loaded in the Scene preload(). */
export const FIRECRACKER_TEXTURES: Readonly<Record<string, string>> = {
  patas:       '/firecrackers/One.png',
  flowerpot:   '/firecrackers/Two.png',
  chakkaram:   '/firecrackers/Four.png',
  rocket:      '/firecrackers/Five.png',
  bomb:        '/firecrackers/Eight.png',
  mega:        '/firecrackers/Three.png',
  'Time Bomb': '/firecrackers/Six.png',
  'Nuce':      '/firecrackers/Seven.png',
};

// ── Layout ───────────────────────────────────────────────────

/** Per-firecracker fuse-zone offset (relative to centre). */
export const FUSE_ZONE_OFFSETS: Readonly<Record<string, { dx: number; dy: number }>> = {
  patas:       { dx: -30, dy: -50 },
  flowerpot:   { dx:   0, dy: -60 },
  chakkaram:   { dx:  50, dy:   0 },
  rocket:      { dx:   0, dy:  70 },
  bomb:        { dx:   0, dy: -50 },
  mega:        { dx:   0, dy: -60 },
  'Time Bomb': { dx:   0, dy: -50 },
  'Nuce':      { dx:   0, dy: -60 },
};

/** Max sprite pixel-size before scaling (desktop / mobile). */
export const MAX_VISUAL_SIZE_DESKTOP = 400;
export const MAX_VISUAL_SIZE_MOBILE  = 200;

/** Threshold below which we consider the viewport "mobile". */
export const MOBILE_BREAKPOINT = 768;

/** Threshold at or above which we consider the viewport "desktop". */
export const DESKTOP_BREAKPOINT = 1024;

/** Number of background stars drawn in the Phaser scene. */
export const STAR_COUNT = 150;

// ── localStorage keys ────────────────────────────────────────

export const LS_KEY_POINTS    = 'kreedaPoints';
export const LS_KEY_INVENTORY = 'firecrackerInventory';
