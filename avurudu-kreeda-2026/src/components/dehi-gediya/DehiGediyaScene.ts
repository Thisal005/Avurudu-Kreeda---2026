// ──────────────────────────────────────────────────────────────
// DehiGediyaScene.ts — Factory that creates the Phaser.Scene
// subclass *after* Phaser has been dynamically imported,
// avoiding the "Phaser is not defined" SSR error.
//
// All game state lives inside the scene.  The React component
// passes in `onGameOver` via the game registry.
// ──────────────────────────────────────────────────────────────

import {
  // Types
  type SceneObject,
  type JuiceParticle,
  type ActivePowerUp,
  type PowerUpDef,

  // Physics
  GRAVITY_STRENGTH,
  FRICTION_NORMAL,
  FRICTION_BIG_BOWL,
  LIME_DROP_THRESHOLD,

  // Spoon / tilt
  MAX_TILT_DEG,
  ANGLE_LERP_SPEED,

  // Speed / difficulty
  BASE_Z_SPEED,
  DIFFICULTY_RAMP_RATE,
  DIFFICULTY_SPEED_SCALE,
  BOOST_SPEED_MULT,
  BOOST_SCORE_PER_SEC,
  COMBO_INTERVAL_SEC,
  MAX_COMBO,

  // Power-ups
  POWERUP_SPAWN_INTERVAL_MS,
  POWERUP_DURATION_SEC,
  BAD_CHANCE,

  // Perspective
  FOCAL_LENGTH,
  HORIZON_RATIO,

  // Layout
  SPOON_LENGTH_RATIO,
  SPOON_LENGTH_MAX,
  BOWL_R_RATIO,
  BOWL_R_MAX,
  BOWL_R_BIG_RATIO,
  BOWL_R_BIG_MAX,
  LIME_R_RATIO,
  LIME_R_MAX,

  // Collision
  CATCH_Z_MIN,
  CATCH_Z_MAX,
  CATCH_X_RADIUS,
  POWERUP_SPAWN_X_MIN,
  POWERUP_SPAWN_X_MAX,

  // Keyboard
  KEYBOARD_SPEED,

  // Wobble
  WOBBLE_BASE_AMP,
  WOBBLE_DIFFICULTY_SCALE,
  WOBBLE_BASE_SPEED,
  WOBBLE_DIFFICULTY_SPEED_SCALE,
  WOBBLE_STEADY_MULT,

  // Bob
  BOB_BASE_FREQ,
  BOB_MAX_FREQ_ADD,
  BOB_AMP,

  // Scoring
  ROCK_PENALTY,
  INITIAL_LIVES,

  // Particles
  JUICE_PARTICLE_MIN_R,
  JUICE_PARTICLE_MAX_R,
  JUICE_PARTICLE_MIN_SPEED,
  JUICE_PARTICLE_MAX_SPEED,
  JUICE_PARTICLE_UPWARD_BIAS,
  JUICE_PARTICLE_GRAVITY,
  JUICE_PARTICLE_DECAY,
  JUICE_BURST_COUNT,
  POWERUP_BURST_COUNT,

  // UI
  MOBILE_BREAKPOINT,
  DROP_ANIM_DURATION,
  DROP_RESET_DELAY,
  GAMEOVER_DELAY,
  HINT_FADE_DELAY,

  // Catalogues
  GOOD_POWERUPS,
  BAD_POWERUPS,

  // Assets
  ASSETS,
} from "./DehiGediyaConfig";

import {
  drawSpoonHandle,
  drawSpoonBowl,
  drawLime,
  drawWarningOverlay,
  drawHands,
} from "./DehiGediyaRenderer";

// ── Registry key for the onGameOver callback ─────────────────

export const GAMEOVER_CB_KEY = "__dehiOnGameOver";

// ──────────────────────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────────────────────

export function createDehiGediyaScene(
  PhaserModule: typeof Phaser,
): typeof Phaser.Scene {
  const { Math: PMath, Input } = PhaserModule;

  return class DehiGediyaScene extends PhaserModule.Scene {
    // ── Dimensions ───────────────────────────────────────────
    private gameWidth = 0;
    private gameHeight = 0;

    // ── Physics ──────────────────────────────────────────────
    private limeOffset = 0;
    private limeVelocity = 0;
    private spoonAngle = 0;
    private targetAngle = 0;
    private wobblePhase = 0;
    private simulatedPointerX = 0;

    // ── Input (created once) ─────────────────────────────────
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;

    // ── Running / world ──────────────────────────────────────
    private distanceRun = 0;
    private difficultyMultiplier = 1;
    private zSpeed = BASE_Z_SPEED;

    // ── State ────────────────────────────────────────────────
    private lives = INITIAL_LIVES;
    private score = 0;
    private comboTimer = 0;
    private comboMultiplier = 1;
    private isGameOver = false;
    private activePowerUp: ActivePowerUp = null;
    private powerupTimer = 0;
    private canDrop = true;
    private droppingInProgress = false;

    // ── Graphics layers ──────────────────────────────────────
    private shadowGfx!: Phaser.GameObjects.Graphics;
    private spoonGfx!: Phaser.GameObjects.Graphics;
    private limeGfx!: Phaser.GameObjects.Graphics;
    private handsGfx!: Phaser.GameObjects.Graphics;
    private warningGfx!: Phaser.GameObjects.Graphics;
    private dustGfx!: Phaser.GameObjects.Graphics;

    // ── 3-D scene objects ────────────────────────────────────
    private sceneObjects: SceneObject[] = [];

    // ── Particles (juice splash) ─────────────────────────────
    private juiceParticles: JuiceParticle[] = [];

    // ── Computed layout ──────────────────────────────────────
    private horizonY = 0;
    private spoonLength = 0;
    private bowlR = 0;
    private limeR = 0;
    private defaultBowlR = 0;   // cached reset value

    // ── UI ───────────────────────────────────────────────────
    private scoreText!: Phaser.GameObjects.Text;
    private distanceText!: Phaser.GameObjects.Text;
    private livesContainer!: Phaser.GameObjects.Container;
    private feedbackText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private speedometerText!: Phaser.GameObjects.Text;

    constructor() {
      super("DehiGediyaScene");
    }

    // ── Typed accessor for the onGameOver callback ───────────

    private get onGameOver(): (score: number) => void {
      return this.game.registry.get(GAMEOVER_CB_KEY) as (score: number) => void;
    }

    // ═════════════════════════════════════════════════════════
    //  PRELOAD
    // ═════════════════════════════════════════════════════════

    preload(): void {
      this.load.video(ASSETS.video.key, ASSETS.video.path);
      this.load.audio(ASSETS.audio.bgm.key, ASSETS.audio.bgm.path);
      this.load.audio(ASSETS.audio.good.key, ASSETS.audio.good.path);
      this.load.audio(ASSETS.audio.bad.key, ASSETS.audio.bad.path);
      this.load.audio(ASSETS.audio.lose.key, ASSETS.audio.lose.path);
    }

    // ═════════════════════════════════════════════════════════
    //  CREATE
    // ═════════════════════════════════════════════════════════

    create(): void {
      this.gameWidth = this.scale.width;
      this.gameHeight = this.scale.height;
      this.horizonY = this.gameHeight * HORIZON_RATIO;

      // Scale spoon & lime to screen
      this.spoonLength = Math.min(this.gameHeight * SPOON_LENGTH_RATIO, SPOON_LENGTH_MAX);
      this.defaultBowlR = Math.min(this.gameWidth * BOWL_R_RATIO, BOWL_R_MAX);
      this.bowlR = this.defaultBowlR;
      this.limeR = Math.min(this.gameWidth * LIME_R_RATIO, LIME_R_MAX);

      this.createGraphicsLayers();
      this.createVideoBackground();
      this.createUI();
      this.createControls();
      this.createAudio();
      this.createTimers();
    }

    // ── Create helpers ───────────────────────────────────────

    private createGraphicsLayers(): void {
      this.shadowGfx  = this.add.graphics().setDepth(9);
      this.spoonGfx   = this.add.graphics().setDepth(10);
      this.limeGfx    = this.add.graphics().setDepth(11);
      this.handsGfx   = this.add.graphics().setDepth(12);
      this.warningGfx = this.add.graphics().setDepth(28).setAlpha(0);
      this.dustGfx    = this.add.graphics().setDepth(8);
    }

    private createVideoBackground(): void {
      const bgVideo = this.add.video(
        this.gameWidth / 2,
        this.gameHeight / 2,
        ASSETS.video.key,
      );
      bgVideo.play(true);
      bgVideo.setMute(true);
      bgVideo.setLoop(true);
      bgVideo.setDepth(0);

      const gw = this.gameWidth;
      const gh = this.gameHeight;
      const updateScale = () => {
        if (bgVideo.width > 0 && bgVideo.height > 0) {
          bgVideo.setScale(Math.max(gw / bgVideo.width, gh / bgVideo.height));
        }
      };
      bgVideo.on("play", updateScale);
      this.time.delayedCall(100, updateScale);
    }

    private createUI(): void {
      const isMobile = this.gameWidth < MOBILE_BREAKPOINT;
      const uiScale = isMobile ? 0.8 : 1;

      // ── Score bar ──
      const scoreY = isMobile ? 70 : 8;
      const scoreW = 200 * uiScale;
      const scoreH = 56 * uiScale;

      const barBg = this.add.graphics().setDepth(20);
      barBg.fillStyle(0x000000, 0.35);
      barBg.fillRoundedRect(8, scoreY, scoreW, scoreH, 12);

      const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        fontFamily: "'Segoe UI', Arial, sans-serif",
      };

      this.scoreText = this.add
        .text(8 + 12 * uiScale, scoreY + 8 * uiScale, "KP: 0", {
          ...textStyle,
          fontSize: `${26 * uiScale}px`,
          color: "#ffe600",
          fontStyle: "bold",
        })
        .setDepth(21);

      this.distanceText = this.add
        .text(8 + 12 * uiScale, scoreY + 34 * uiScale, "0 m", {
          ...textStyle,
          fontSize: `${15 * uiScale}px`,
          color: "#ffffff",
        })
        .setDepth(21);

      // ── Combo badge ──
      const comboW = 140 * uiScale;
      const comboH = 56 * uiScale;
      const comboX = this.gameWidth - comboW - 8;

      const comboBg = this.add.graphics().setDepth(20);
      comboBg.fillStyle(0x000000, 0.35);
      comboBg.fillRoundedRect(comboX, 8, comboW, comboH, 12);

      this.comboText = this.add
        .text(comboX + comboW / 2, 8 + 12 * uiScale, "COMBO", {
          ...textStyle,
          fontSize: `${13 * uiScale}px`,
          color: "#aaaaaa",
        })
        .setOrigin(0.5, 0)
        .setDepth(21);

      this.speedometerText = this.add
        .text(comboX + comboW / 2, 8 + 28 * uiScale, "1×", {
          ...textStyle,
          fontSize: `${28 * uiScale}px`,
          color: "#ffe600",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0)
        .setDepth(21);

      // ── Lives ──
      this.livesContainer = this.add
        .container(this.gameWidth / 2 - 34 * uiScale, 14)
        .setDepth(21);
      if (isMobile) this.livesContainer.setScale(uiScale);
      this.updateLivesDisplay();

      // ── Feedback text ──
      this.feedbackText = this.add
        .text(this.gameWidth / 2, this.gameHeight * 0.32, "", {
          ...textStyle,
          fontSize: "38px",
          color: "#ffe600",
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 6,
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(26)
        .setAlpha(0);

      // ── Controls hint ──
      const hint = this.add
        .text(
          this.gameWidth / 2,
          this.gameHeight - 36,
          "◀  Drag / A–D / ← →  ▶  to balance",
          {
            ...textStyle,
            fontSize: "15px",
            color: "#ffffff",
            fontStyle: "bold",
            backgroundColor: "#00000099",
            padding: { x: 14, y: 6 },
          },
        )
        .setOrigin(0.5)
        .setDepth(30);

      this.time.delayedCall(HINT_FADE_DELAY, () =>
        this.tweens.add({ targets: hint, alpha: 0, duration: 600 }),
      );
    }

    private createControls(): void {
      this.simulatedPointerX = this.gameWidth / 2;

      if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.D);
      }

      this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
        if (!this.isGameOver) this.simulatedPointerX = p.x;
      });
    }

    private createAudio(): void {
      const bgm = this.sound.add(ASSETS.audio.bgm.key, {
        loop: true,
        volume: 0.4,
      });
      bgm.play();
    }

    private createTimers(): void {
      this.time.addEvent({
        delay: POWERUP_SPAWN_INTERVAL_MS,
        callback: this.spawnPowerUp,
        callbackScope: this,
        loop: true,
      });
    }

    // ═════════════════════════════════════════════════════════
    //  LIVES DISPLAY
    // ═════════════════════════════════════════════════════════

    private updateLivesDisplay(): void {
      this.livesContainer.removeAll(true);
      for (let i = 0; i < INITIAL_LIVES; i++) {
        const filled = i < this.lives;
        const c = this.add.graphics();
        c.fillStyle(filled ? 0x32cd32 : 0x444444, 1);
        c.fillCircle(i * 34, 16, 13);
        if (filled) {
          c.fillStyle(0x7cfc00, 0.7);
          c.fillCircle(i * 34 - 4, 10, 5);
        }
        this.livesContainer.add(c);
      }
    }

    // ═════════════════════════════════════════════════════════
    //  POWER-UPS
    // ═════════════════════════════════════════════════════════

    private spawnPowerUp(): void {
      if (this.isGameOver) return;

      const isBad = Math.random() > 1 - BAD_CHANCE;
      const catalogue: readonly PowerUpDef[] = isBad ? BAD_POWERUPS : GOOD_POWERUPS;
      const sel = PMath.RND.pick(catalogue as PowerUpDef[]);

      const x3D = PMath.Between(POWERUP_SPAWN_X_MIN, POWERUP_SPAWN_X_MAX);

      const container = this.add.container(0, 0).setDepth(4);

      // Ground shadow
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.35);
      shadow.fillEllipse(0, 50, 48, 14);

      // Outer glow
      const glow = this.add.graphics();
      glow.fillStyle(sel.color, 0.4);
      glow.fillCircle(0, 0, 48);
      glow.fillStyle(sel.color, 0.15);
      glow.fillCircle(0, 0, 60);

      // Main coloured orb
      const orb = this.add.graphics();
      orb.fillStyle(sel.color, 0.85);
      orb.fillCircle(0, 0, 38);
      orb.fillCircle(10, 10, 24);

      // Inner highlight (glass reflection)
      orb.fillStyle(0xffffff, 0.5);
      orb.fillCircle(-12, -14, 12);
      orb.fillStyle(0xffffff, 0.8);
      orb.fillCircle(-16, -18, 4);

      // Border
      orb.lineStyle(4, isBad ? 0xff0000 : 0xffffff, 0.9);
      orb.strokeCircle(0, 0, 38);

      // Icon
      const label = this.add
        .text(0, 0, sel.icon, { fontSize: "36px" })
        .setOrigin(0.5);

      container.add([shadow, glow, orb, label]);

      this.sceneObjects.push({
        type: "powerup",
        subType: sel.type,
        col: sel.color,
        labelText: sel.label,
        x: x3D,
        y: 50,
        z: 1300,
        gfx: container,
        active: true,
      });
    }

    private activatePowerUp(type: string, col?: number): void {
      if (type === "crow") {
        this.difficultyMultiplier += 1.5;
        this.cameras.main.shake(400, 0.03);
        this.showFeedback("CROW ATTACK! 🐦‍⬛", "#ff0000");
        this.sound.play(ASSETS.audio.bad.key, { volume: 0.8 });
      } else if (type === "rock") {
        this.score = Math.max(0, this.score - ROCK_PENALTY);
        this.comboMultiplier = 1;
        this.speedometerText.setText("1×");
        this.cameras.main.shake(200, 0.015);
        this.showFeedback(`-${ROCK_PENALTY} KP! 🪨`, "#ff0000");
        this.flashWarning(0xff0000, 0.5, 400);
        this.sound.play(ASSETS.audio.bad.key, { volume: 0.8 });
      } else {
        this.activePowerUp = type as ActivePowerUp;
        this.powerupTimer = POWERUP_DURATION_SEC;
        if (type === "big") {
          this.bowlR = Math.min(this.gameWidth * BOWL_R_BIG_RATIO, BOWL_R_BIG_MAX);
        }
        const msg =
          type === "steady" ? "STEADY HANDS! 🖐"
          : type === "big"  ? "BIG BOWL! 🍽️"
          :                   "AVURUDU DASH! ⚡";
        const hexColor = col
          ? `#${col.toString(16).padStart(6, "0")}`
          : "#ffe600";
        this.showFeedback(msg, hexColor);
        this.sound.play(ASSETS.audio.good.key, { volume: 0.7 });
      }

      // Burst particles at catch
      const cx = this.gameWidth / 2;
      const cy = this.gameHeight * 0.4;
      for (let i = 0; i < POWERUP_BURST_COUNT; i++) {
        this.spawnJuiceParticle(cx, cy, col ?? 0xff0000);
      }
    }

    // ═════════════════════════════════════════════════════════
    //  FEEDBACK TEXT
    // ═════════════════════════════════════════════════════════

    private showFeedback(msg: string, color: string): void {
      this.feedbackText.setText(msg).setColor(color).setAlpha(1).setScale(1.4);
      this.tweens.add({
        targets: this.feedbackText,
        scale: 1,
        duration: 450,
        ease: "Back.easeOut",
      });
      this.time.delayedCall(1400, () =>
        this.tweens.add({
          targets: this.feedbackText,
          alpha: 0,
          duration: 350,
        }),
      );
    }

    // ═════════════════════════════════════════════════════════
    //  WARNING FLASH (shared helper)
    // ═════════════════════════════════════════════════════════

    private flashWarning(
      color: number,
      alpha: number,
      duration: number,
    ): void {
      this.warningGfx.clear();
      this.warningGfx.fillStyle(color, alpha);
      this.warningGfx.fillRect(0, 0, this.gameWidth, this.gameHeight);
      this.warningGfx.setAlpha(1);
      this.tweens.add({ targets: this.warningGfx, alpha: 0, duration });
    }

    // ═════════════════════════════════════════════════════════
    //  JUICE / DUST PARTICLES
    // ═════════════════════════════════════════════════════════

    private spawnJuiceParticle(
      x: number,
      y: number,
      color: number,
    ): void {
      const r = PMath.Between(JUICE_PARTICLE_MIN_R, JUICE_PARTICLE_MAX_R);
      const circle = this.add.circle(x, y, r, color, 0.9).setDepth(22);
      const angle = Math.random() * Math.PI * 2;
      const speed = PMath.Between(JUICE_PARTICLE_MIN_SPEED, JUICE_PARTICLE_MAX_SPEED);

      this.juiceParticles.push({
        circle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - JUICE_PARTICLE_UPWARD_BIAS,
        life: 1,
      });
    }

    private updateJuiceParticles(dt: number): void {
      for (let i = this.juiceParticles.length - 1; i >= 0; i--) {
        const p = this.juiceParticles[i];
        p.life -= dt * JUICE_PARTICLE_DECAY;
        p.vy += JUICE_PARTICLE_GRAVITY * dt;
        p.circle.x += p.vx * dt;
        p.circle.y += p.vy * dt;
        p.circle.setAlpha(Math.max(0, p.life));

        if (p.life <= 0) {
          p.circle.destroy();
          this.juiceParticles.splice(i, 1);
        }
      }
    }

    // ═════════════════════════════════════════════════════════
    //  DRAW FIRST-PERSON (thin orchestrator)
    // ═════════════════════════════════════════════════════════

    private drawFirstPerson(bobY: number): void {
      const pivotX = this.gameWidth / 2;
      const pivotY = this.gameHeight + 90 + bobY;
      const rad = PMath.DegToRad(this.spoonAngle);

      const tipX = pivotX + Math.sin(rad) * this.spoonLength;
      const tipY = pivotY - Math.cos(rad) * this.spoonLength;

      const perpX = Math.cos(rad);
      const perpY = Math.sin(rad);
      const BW = 88;
      const TW = 12;

      // Delegate to renderer
      this.spoonGfx.clear();
      drawSpoonHandle(this.spoonGfx, pivotX, pivotY, tipX, tipY, perpX, perpY, BW, TW);
      drawSpoonBowl(this.spoonGfx, tipX, tipY, this.bowlR);

      // Lime
      this.limeGfx.clear();
      this.shadowGfx.clear();

      if (this.canDrop && !this.droppingInProgress) {
        const offset = this.limeOffset * this.bowlR * 0.8;
        const limeX = tipX + offset * perpX;
        const limeY = tipY + offset * perpY - this.limeR * 0.4;

        drawLime(this.limeGfx, this.shadowGfx, limeX, limeY, this.limeR);

        const isWarning = drawWarningOverlay(
          this.warningGfx,
          this.limeOffset,
          this.gameWidth,
          this.gameHeight,
        );

        // Juice drip near edge
        if (isWarning && Math.random() > 0.72) {
          const side = this.limeOffset > 0 ? 1 : -1;
          this.spawnJuiceParticle(limeX + side * this.limeR, limeY, 0x32cd32);
        }
      }

      // Hands
      this.handsGfx.clear();
      drawHands(this.handsGfx, pivotX, pivotY, perpX, perpY, BW);
    }

    // ═════════════════════════════════════════════════════════
    //  DROP LIME
    // ═════════════════════════════════════════════════════════

    private dropLime(direction: number): void {
      if (this.droppingInProgress || this.isGameOver) return;
      this.droppingInProgress = true;
      this.canDrop = false;

      const rad = PMath.DegToRad(this.spoonAngle);
      const perpX = Math.cos(rad);
      const perpY = Math.sin(rad);
      const pivotX = this.gameWidth / 2;
      const pivotY = this.gameHeight + 90;
      const tipX = pivotX + Math.sin(rad) * this.spoonLength;
      const tipY = pivotY - Math.cos(rad) * this.spoonLength;
      const offset = this.limeOffset * this.bowlR * 0.9;
      const startX = tipX + offset * perpX;
      const startY = tipY + offset * perpY - this.limeR * 0.5;

      // Juice splash burst
      for (let i = 0; i < JUICE_BURST_COUNT; i++) {
        this.spawnJuiceParticle(startX, startY, 0x32cd32);
      }

      // Lime falls toward camera
      const droppedLime = this.add.graphics().setDepth(26);
      droppedLime.fillStyle(0x32cd32, 1);
      droppedLime.fillCircle(0, 0, this.limeR);
      droppedLime.fillStyle(0x7cfc00, 0.7);
      droppedLime.fillCircle(
        -this.limeR * 0.3,
        -this.limeR * 0.3,
        this.limeR * 0.42,
      );
      droppedLime.setPosition(startX, startY);

      this.tweens.add({
        targets: droppedLime,
        y: this.gameHeight + 250,
        x: startX + direction * 180,
        scale: 4,
        alpha: 0,
        duration: DROP_ANIM_DURATION,
        ease: "Quad.easeIn",
        onComplete: () => {
          droppedLime.destroy();
          this.cameras.main.shake(300, 0.022);
          this.flashWarning(0xff0000, 0.5, 500);

          this.lives--;
          this.updateLivesDisplay();
          this.comboMultiplier = 1;
          this.speedometerText.setText("1×");

          if (this.lives <= 0) {
            this.handleGameOver();
          } else {
            this.time.delayedCall(DROP_RESET_DELAY, () => {
              this.resetAfterDrop();
            });
          }
        },
      });
    }

    private handleGameOver(): void {
      this.isGameOver = true;
      this.sound.stopAll();
      this.sound.play(ASSETS.audio.lose.key, { volume: 1.0 });

      const finalScore = Math.floor(this.score);
      this.time.delayedCall(GAMEOVER_DELAY, () => {
        const cb = this.onGameOver;
        if (typeof cb === "function") {
          cb(Math.max(0, finalScore));
        }
      });
    }

    private resetAfterDrop(): void {
      this.limeOffset = 0;
      this.limeVelocity = 0;
      this.activePowerUp = null;
      this.bowlR = this.defaultBowlR;
      this.droppingInProgress = false;
      this.canDrop = true;
      this.showFeedback(
        `Drop!\n${this.lives} lime(s) left 🍋`,
        "#ff6600",
      );
    }

    // ═════════════════════════════════════════════════════════
    //  UPDATE (game loop)
    // ═════════════════════════════════════════════════════════

    update(time: number, delta: number): void {
      const dt = delta / 1000;

      // Particles run even during game over
      this.updateJuiceParticles(dt);

      if (this.isGameOver) {
        this.drawFirstPerson(0);
        return;
      }

      this.updateKeyboard(dt);
      this.updateTargetAngle();
      this.updateDifficulty(dt);
      this.updateScoreAndCombo(dt);
      this.updatePowerUpTimer(dt);

      const bobY = this.calculateBob(time);
      this.updateWobble(dt);
      this.updateSpoonAngle(dt);
      this.updateLimePhysics(dt);

      const cx = this.gameWidth / 2;
      const rad = PMath.DegToRad(this.spoonAngle);
      const tipX = cx + Math.sin(rad) * this.spoonLength;

      this.updateSceneObjects(dt, cx, bobY, tipX);
      this.drawFirstPerson(bobY);
    }

    // ── Update sub-routines ──────────────────────────────────

    private updateKeyboard(dt: number): void {
      if (!this.input.keyboard) return;

      const goLeft = this.cursors?.left?.isDown || this.keyA?.isDown;
      const goRight = this.cursors?.right?.isDown || this.keyD?.isDown;

      if (goLeft) this.simulatedPointerX -= KEYBOARD_SPEED * dt;
      if (goRight) this.simulatedPointerX += KEYBOARD_SPEED * dt;
      this.simulatedPointerX = PMath.Clamp(
        this.simulatedPointerX,
        0,
        this.gameWidth,
      );
    }

    private updateTargetAngle(): void {
      const cx = this.gameWidth / 2;
      const dist = this.simulatedPointerX - cx;
      this.targetAngle = PMath.Clamp(
        (dist / cx) * MAX_TILT_DEG,
        -MAX_TILT_DEG,
        MAX_TILT_DEG,
      );
    }

    private updateDifficulty(dt: number): void {
      this.difficultyMultiplier += dt * DIFFICULTY_RAMP_RATE;
      let speed = BASE_Z_SPEED + (this.difficultyMultiplier - 1) * DIFFICULTY_SPEED_SCALE;
      if (this.activePowerUp === "boost") {
        speed *= BOOST_SPEED_MULT;
        this.score += dt * BOOST_SCORE_PER_SEC;
      }
      this.zSpeed = speed;
      this.distanceRun += speed * dt;
    }

    private updateScoreAndCombo(dt: number): void {
      this.comboTimer += dt;
      if (this.comboTimer > COMBO_INTERVAL_SEC) {
        this.comboMultiplier = Math.min(this.comboMultiplier + 1, MAX_COMBO);
        this.comboTimer = 0;
        this.speedometerText.setText(`${this.comboMultiplier}×`);
        if (this.comboMultiplier > 1) {
          this.speedometerText.setScale(1.6);
          this.tweens.add({
            targets: this.speedometerText,
            scale: 1,
            duration: 300,
            ease: "Back.easeOut",
          });
        }
      }
      this.score += ((this.zSpeed * dt) / DIFFICULTY_SPEED_SCALE) * this.comboMultiplier;
      this.scoreText.setText(`KP: ${Math.floor(this.score)}`);
      this.distanceText.setText(`${Math.floor(this.distanceRun / 10)} m`);
    }

    private updatePowerUpTimer(dt: number): void {
      if (!this.activePowerUp) return;
      this.powerupTimer -= dt;
      if (this.powerupTimer <= 0) {
        this.activePowerUp = null;
        this.bowlR = this.defaultBowlR;
        this.showFeedback("Power-up gone!", "#888888");
      }
    }

    private calculateBob(time: number): number {
      const bobFreq = BOB_BASE_FREQ + Math.min(this.difficultyMultiplier * 1.5, BOB_MAX_FREQ_ADD);
      return Math.sin((time / 1000) * bobFreq) * BOB_AMP;
    }

    private updateWobble(dt: number): void {
      this.wobblePhase += dt;
    }

    private updateSpoonAngle(dt: number): void {
      let wobbleAmp = WOBBLE_BASE_AMP + (this.difficultyMultiplier - 1) * WOBBLE_DIFFICULTY_SCALE;
      const wobbleSpeed = WOBBLE_BASE_SPEED + (this.difficultyMultiplier - 1) * WOBBLE_DIFFICULTY_SPEED_SCALE;

      if (this.activePowerUp === "steady") wobbleAmp *= WOBBLE_STEADY_MULT;

      const wobbleDeg =
        Math.sin(this.wobblePhase * wobbleSpeed) * wobbleAmp +
        Math.cos(this.wobblePhase * wobbleSpeed * 1.7) * wobbleAmp * 0.45 +
        Math.sin(this.wobblePhase * wobbleSpeed * 3.1) * wobbleAmp * 0.18;

      const totalTarget = this.targetAngle + wobbleDeg;
      this.spoonAngle = PMath.Linear(
        this.spoonAngle,
        totalTarget,
        Math.min(dt * ANGLE_LERP_SPEED, 0.5),
      );
    }

    private updateLimePhysics(dt: number): void {
      if (!this.canDrop || this.droppingInProgress) return;

      const accel = GRAVITY_STRENGTH * Math.sin(PMath.DegToRad(this.spoonAngle));
      const friction = this.activePowerUp === "big" ? FRICTION_BIG_BOWL : FRICTION_NORMAL;

      this.limeVelocity += accel * dt;
      this.limeVelocity *= friction;
      this.limeOffset += this.limeVelocity * dt;

      if (this.limeOffset < -LIME_DROP_THRESHOLD) {
        this.dropLime(-1);
      } else if (this.limeOffset > LIME_DROP_THRESHOLD) {
        this.dropLime(1);
      }
    }

    private updateSceneObjects(
      dt: number,
      cx: number,
      bobY: number,
      tipX: number,
    ): void {
      for (let i = this.sceneObjects.length - 1; i >= 0; i--) {
        const obj = this.sceneObjects[i];
        if (!obj.active) continue;

        obj.z -= this.zSpeed * dt;

        if (obj.z <= 1) {
          obj.gfx.destroy();
          this.sceneObjects.splice(i, 1);
          continue;
        }

        const sc = FOCAL_LENGTH / obj.z;
        const sx = cx + obj.x * sc;
        const sy = this.horizonY + obj.y * sc + bobY * 0.4;

        obj.gfx.setPosition(sx, sy).setScale(sc);
        obj.gfx.setDepth(Math.max(2, 9 - obj.z / 180));

        // Power-up catch detection
        if (
          obj.type === "powerup" &&
          obj.z < CATCH_Z_MAX &&
          obj.z > CATCH_Z_MIN &&
          Math.abs(sx - tipX) < CATCH_X_RADIUS
        ) {
          this.activatePowerUp(obj.subType, obj.col);
          obj.gfx.destroy();
          this.sceneObjects.splice(i, 1);
        }
      }
    }
  };
}
