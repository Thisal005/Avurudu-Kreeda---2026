"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

interface DehiGediyaGameProps {
  onGameOver: (score: number) => void;
}

export default function DehiGediyaGame({ onGameOver }: DehiGediyaGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGame = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGame.current) return;

    class MainScene extends Phaser.Scene {
      private gameWidth = 0;
      private gameHeight = 0;

      // ── Physics ──────────────────────────────────────────────────
      private limeOffset = 0;       // Normalised – 1=right edge
      private limeVelocity = 0;
      private spoonAngle = 0;       // current rendered angle (deg)
      private targetAngle = 0;      // player-input target (deg)
      private wobblePhase = 0;
      private simulatedPointerX = 0;
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

      // ── Running / World ───────────────────────────────────────────
      private distanceRun = 0;
      private difficultyMultiplier = 1;
      private zSpeed = 280;

      // ── State ─────────────────────────────────────────────────────
      private lives = 3;
      private score = 0;
      private comboTimer = 0;
      private comboMultiplier = 1;
      private isGameOver = false;
      private activePowerUp: "steady" | "big" | "boost" | null = null;
      private powerupTimer = 0;
      private canDrop = true;
      private droppingInProgress = false;

      // ── Graphics layers ───────────────────────────────────────────
      private shadowGfx!: Phaser.GameObjects.Graphics;
      private spoonGfx!: Phaser.GameObjects.Graphics;
      private limeGfx!: Phaser.GameObjects.Graphics;
      private handsGfx!: Phaser.GameObjects.Graphics;
      private warningGfx!: Phaser.GameObjects.Graphics;
      private dustGfx!: Phaser.GameObjects.Graphics;

      // ── Scene objects (3-D perspective) ───────────────────────────
      private sceneObjects: any[] = [];

      // ── Particles (lime juice splash) ─────────────────────────────
      private juiceParticles: any[] = [];

      // ── Constants ─────────────────────────────────────────────────
      private FOCAL = 320;
      private HORIZON_Y = 0;
      private SPOON_LENGTH = 0;   // set in create
      private BOWL_R = 0;         // half bowl width (pixels)
      private LIME_R = 0;

      // ── UI ────────────────────────────────────────────────────────
      private scoreText!: Phaser.GameObjects.Text;
      private distanceText!: Phaser.GameObjects.Text;
      private livesContainer!: Phaser.GameObjects.Container;
      private feedbackText!: Phaser.GameObjects.Text;
      private comboText!: Phaser.GameObjects.Text;
      private speedometerText!: Phaser.GameObjects.Text;

      constructor() {
        super("MainScene");
      }

      preload() {
        this.load.video('dehi_bg', '/Dehi/dehi_bg.mp4');
        this.load.audio('dehi_bgm', '/Dehi/bgd.mp3');
        this.load.audio('dehi_good', '/Dehi/good.mp3');
        this.load.audio('dehi_bad', '/Dehi/bad.mp3');
      }

      create() {
        this.gameWidth  = this.scale.width;
        this.gameHeight = this.scale.height;
        this.HORIZON_Y  = this.gameHeight * 0.42;

        // scale spoon & lime to screen size
        this.SPOON_LENGTH = Math.min(this.gameHeight * 0.55, 340);
        this.BOWL_R       = Math.min(this.gameWidth * 0.09, 64);
        this.LIME_R       = Math.min(this.gameWidth * 0.055, 40);

        // ── Graphics layers (depth order) ──
        this.shadowGfx    = this.add.graphics().setDepth(9);
        this.spoonGfx     = this.add.graphics().setDepth(10);
        this.limeGfx      = this.add.graphics().setDepth(11);
        this.handsGfx     = this.add.graphics().setDepth(12);
        this.warningGfx   = this.add.graphics().setDepth(28).setAlpha(0);
        this.dustGfx      = this.add.graphics().setDepth(8);

        // ── Video Background ──
        const bgVideo = this.add.video(this.gameWidth / 2, this.gameHeight / 2, 'dehi_bg');
        bgVideo.play(true); // true means loop
        bgVideo.setMute(true);
        bgVideo.setLoop(true);
        bgVideo.setDepth(0);
        const updateScale = () => {
          if (bgVideo.width > 0 && bgVideo.height > 0) {
            const scale = Math.max(this.gameWidth / bgVideo.width, this.gameHeight / bgVideo.height);
            bgVideo.setScale(scale);
          }
        };
        bgVideo.on('play', updateScale);
        this.time.delayedCall(100, updateScale); // fallback

        // ── Responsive UI Logic ──
        const isMobile = this.gameWidth < 600;
        const uiScale = isMobile ? 0.8 : 1;

        // ── Score bar ──
        // On mobile, push below the HTML Quit button
        const scoreY = isMobile ? 70 : 8;
        const scoreW = 200 * uiScale;
        const scoreH = 56 * uiScale;

        const barBg = this.add.graphics().setDepth(20);
        barBg.fillStyle(0x000000, 0.35);
        barBg.fillRoundedRect(8, scoreY, scoreW, scoreH, 12);

        this.scoreText = this.add.text(8 + 12 * uiScale, scoreY + 8 * uiScale, "KP: 0", {
          fontSize: `${26 * uiScale}px`, color: "#ffe600", fontStyle: "bold",
          fontFamily: "'Segoe UI', Arial, sans-serif"
        }).setDepth(21);

        this.distanceText = this.add.text(8 + 12 * uiScale, scoreY + 34 * uiScale, "0 m", {
          fontSize: `${15 * uiScale}px`, color: "#ffffff",
          fontFamily: "'Segoe UI', Arial, sans-serif"
        }).setDepth(21);

        // ── Combo badge ──
        const comboW = 140 * uiScale;
        const comboH = 56 * uiScale;
        const comboX = this.gameWidth - comboW - 8;

        const comboBg = this.add.graphics().setDepth(20);
        comboBg.fillStyle(0x000000, 0.35);
        comboBg.fillRoundedRect(comboX, 8, comboW, comboH, 12);

        this.comboText = this.add.text(comboX + comboW / 2, 8 + 12 * uiScale, "COMBO", {
          fontSize: `${13 * uiScale}px`, color: "#aaaaaa",
          fontFamily: "'Segoe UI', Arial, sans-serif"
        }).setOrigin(0.5, 0).setDepth(21);

        this.speedometerText = this.add.text(comboX + comboW / 2, 8 + 28 * uiScale, "1×", {
          fontSize: `${28 * uiScale}px`, color: "#ffe600", fontStyle: "bold",
          fontFamily: "'Segoe UI', Arial, sans-serif"
        }).setOrigin(0.5, 0).setDepth(21);

        // ── Lives ──
        // Center the lives
        this.livesContainer = this.add.container(this.gameWidth / 2 - (34 * uiScale), 14).setDepth(21);
        if (isMobile) this.livesContainer.setScale(uiScale);
        this.updateLivesDisplay();

        // ── Feedback text (centre) ──
        this.feedbackText = this.add.text(
          this.gameWidth / 2, this.gameHeight * 0.32, "", {
            fontSize: "38px", color: "#ffe600", fontStyle: "bold",
            fontFamily: "'Segoe UI', Arial, sans-serif",
            stroke: "#000000", strokeThickness: 6,
            align: "center"
          }
        ).setOrigin(0.5).setDepth(26).setAlpha(0);

        // ── Controls hint ──
        const hint = this.add.text(
          this.gameWidth / 2, this.gameHeight - 36,
          "◀  Drag / A–D / ← →  ▶  to balance",
          {
            fontSize: "15px", color: "#ffffff", fontStyle: "bold",
            fontFamily: "'Segoe UI', Arial, sans-serif",
            backgroundColor: "#00000099", padding: { x: 14, y: 6 }
          }
        ).setOrigin(0.5).setDepth(30);
        // fade after 4 s
        this.time.delayedCall(4000, () =>
          this.tweens.add({ targets: hint, alpha: 0, duration: 600 })
        );

        // ── Controls ──
        this.simulatedPointerX = this.gameWidth / 2;
        if (this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
        }
        this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
          if (!this.isGameOver) this.simulatedPointerX = p.x;
        });

        // ── Audio ──
        const bgm = this.sound.add('dehi_bgm', { loop: true, volume: 0.4 });
        bgm.play();

        // ── Spawn timers ──
        this.time.addEvent({ delay: 3500, callback: this.spawnPowerUp,   callbackScope: this, loop: true });
      }

      // ═══════════════════════════════════════════════════════════════
      //  LIVES DISPLAY
      // ═══════════════════════════════════════════════════════════════
      updateLivesDisplay() {
        this.livesContainer.removeAll(true);
        for (let i = 0; i < 3; i++) {
          const filled = i < this.lives;
          const c = this.add.graphics();
          // Lime icon
          c.fillStyle(filled ? 0x32CD32 : 0x444444, 1);
          c.fillCircle(i * 34, 16, 13);
          if (filled) {
            c.fillStyle(0x7CFC00, 0.7);
            c.fillCircle(i * 34 - 4, 10, 5);
          }
          this.livesContainer.add(c);
        }
      }

      // (Sky, Floor, and Road dashed simulation removed as we use video background)

      // ═══════════════════════════════════════════════════════════════
      //  POWER-UPS
      // ═══════════════════════════════════════════════════════════════
      spawnPowerUp() {
        if (this.isGameOver) return;
        const isBad = Math.random() > 0.65; // 35% chance to be bad
        const goodTypes = [
          { t: "steady", icon: "✋", label: "STEADY", col: 0x3498db },
          { t: "big",    icon: "🍽️",  label: "BIG BOWL", col: 0xf39c12 },
          { t: "boost",  icon: "⚡",  label: "DASH!",    col: 0xe74c3c }
        ];
        const badTypes = [
          { t: "crow", icon: "🐦‍⬛", label: "CROW", col: 0x882222 },
          { t: "rock", icon: "🪨", label: "ROCK", col: 0xff3333 }
        ];
        const sel = Phaser.Math.RND.pick(isBad ? badTypes : goodTypes);
        
        // Spawn across the entire road (including the center lane) to force dodging bad items
        const x3D = Phaser.Math.Between(-220, 220);

        const c = this.add.container(0, 0).setDepth(4);
        
        // Ground shadow
        const shadow = this.add.graphics();
        shadow.fillStyle(0x000000, 0.35);
        shadow.fillEllipse(0, 50, 48, 14);

        // Outer glow
        const glow = this.add.graphics();
        glow.fillStyle(sel.col, 0.4);
        glow.fillCircle(0, 0, 48);
        glow.fillStyle(sel.col, 0.15);
        glow.fillCircle(0, 0, 60);

        // Main colored orb
        const orb = this.add.graphics();
        orb.fillStyle(sel.col, 0.85);
        orb.fillCircle(0, 0, 38);
        
        // Inner shadow for 3D effect
        //orb.fillStyle(0x000000, 0.25);
        orb.fillCircle(10, 10, 24);

        // Inner highlight (glass reflection)
        orb.fillStyle(0xffffff, 0.5);
        orb.fillCircle(-12, -14, 12);
        orb.fillStyle(0xffffff, 0.8);
        orb.fillCircle(-16, -18, 4);

        // Border
        orb.lineStyle(4, isBad ? 0xff0000 : 0xffffff, 0.9);
        orb.strokeCircle(0, 0, 38);

        // Icon with drop shadow
        const label = this.add.text(0, 0, sel.icon, { 
          fontSize: "36px", 
          //shadow: { color: '#000000', fill: true, offsetX: 2, offsetY: 2, blur: 5 }
        }).setOrigin(0.5);

        c.add([shadow, glow, orb, label]);

        this.sceneObjects.push({
          type: "powerup", subType: sel.t, col: sel.col, labelText: sel.label,
          x: x3D, y: 50, z: 1300, gfx: c, active: true
        });
      }

      activatePowerUp(type: string, col?: number) {
        if (type === "crow") {
          this.difficultyMultiplier += 1.5;
          this.cameras.main.shake(400, 0.03);
          this.showFeedback("CROW ATTACK! 🐦‍⬛", "#ff0000");
          this.sound.play('dehi_bad', { volume: 0.8 });
        } else if (type === "rock") {
          if (this.score >= 500) this.score -= 500;
          else this.score = 0;
          this.comboMultiplier = 1;
          this.speedometerText.setText("1×");
          this.cameras.main.shake(200, 0.015);
          this.showFeedback("-500 KP! 🪨", "#ff0000");
          this.warningGfx.clear();
          this.warningGfx.fillStyle(0xff0000, 0.5);
          this.warningGfx.fillRect(0, 0, this.gameWidth, this.gameHeight);
          this.warningGfx.setAlpha(1);
          this.tweens.add({ targets: this.warningGfx, alpha: 0, duration: 400 });
          this.sound.play('dehi_bad', { volume: 0.8 });
        } else {
          this.activePowerUp = type as any;
          this.powerupTimer  = 7;
          if (type === "big") this.BOWL_R = Math.min(this.gameWidth * 0.14, 100);
          let msg = type === "steady" ? "STEADY HANDS! 🖐"
                  : type === "big"    ? "BIG BOWL! 🍽️"
                  :                     "AVURUDU DASH! ⚡";
          this.showFeedback(msg, col ? `#${col.toString(16).padStart(6,"0")}` : "#ffe600");
          this.sound.play('dehi_good', { volume: 0.7 });
        }
        
        // Burst particles at catch
        for (let i = 0; i < 14; i++) this.spawnJuiceParticle(this.gameWidth/2, this.gameHeight*0.4, col || 0xff0000);
      }

      // ═══════════════════════════════════════════════════════════════
      //  FEEDBACK TEXT
      // ═══════════════════════════════════════════════════════════════
      showFeedback(msg: string, color: string) {
        this.feedbackText.setText(msg).setColor(color).setAlpha(1).setScale(1.4);
        this.tweens.add({ targets: this.feedbackText, scale: 1, duration: 450, ease: "Back.easeOut" });
        this.time.delayedCall(1400, () =>
          this.tweens.add({ targets: this.feedbackText, alpha: 0, duration: 350 })
        );
      }

      // ═══════════════════════════════════════════════════════════════
      //  JUICE / DUST PARTICLE
      // ═══════════════════════════════════════════════════════════════
      spawnJuiceParticle(x: number, y: number, color: number) {
        const r = Phaser.Math.Between(4, 10);
        const c = this.add.circle(x, y, r, color, 0.9).setDepth(22);
        const angle = Math.random() * Math.PI * 2;
        const speed = Phaser.Math.Between(60, 220);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 80;
        this.juiceParticles.push({ c, vx, vy, life: 1 });
      }

      // (Draw logic removed)
      //  DRAW FIRST-PERSON SPOON, LIME & HANDS
      // ═══════════════════════════════════════════════════════════════
      drawFirstPerson(bobY: number) {
        const pivotX = this.gameWidth / 2;
        const pivotY = this.gameHeight + 90 + bobY;
        const rad    = Phaser.Math.DegToRad(this.spoonAngle);

        const tipX = pivotX + Math.sin(rad) * this.SPOON_LENGTH;
        const tipY = pivotY - Math.cos(rad) * this.SPOON_LENGTH;

        // ── Spoon handle ──────────────────────────────────────────
        this.spoonGfx.clear();

        const perpX = Math.cos(rad);
        const perpY = Math.sin(rad);
        const BW = 88, TW = 12; // bottom / top half-width

        // Base metallic handle
        this.spoonGfx.fillStyle(0xb0b0b0, 1);
        this.spoonGfx.beginPath();
        this.spoonGfx.moveTo(pivotX - BW * perpX, pivotY - BW * perpY);
        this.spoonGfx.lineTo(tipX - TW * perpX, tipY - TW * perpY);
        this.spoonGfx.lineTo(tipX + TW * perpX, tipY + TW * perpY);
        this.spoonGfx.lineTo(pivotX + BW * perpX, pivotY + BW * perpY);
        this.spoonGfx.closePath();
        this.spoonGfx.fillPath();

        // Edge shading (metallic dark reflection)
        this.spoonGfx.lineStyle(6, 0x444444, 0.8);
        this.spoonGfx.beginPath();
        this.spoonGfx.moveTo(pivotX - BW * perpX, pivotY - BW * perpY);
        this.spoonGfx.lineTo(tipX - TW * perpX, tipY - TW * perpY);
        this.spoonGfx.strokePath();

        this.spoonGfx.lineStyle(4, 0x888888, 0.7);
        this.spoonGfx.beginPath();
        this.spoonGfx.moveTo(pivotX + BW * perpX, pivotY + BW * perpY);
        this.spoonGfx.lineTo(tipX + TW * perpX, tipY + TW * perpY);
        this.spoonGfx.strokePath();

        // Center highlight (shiny metal)
        this.spoonGfx.lineStyle(2, 0xffffff, 0.9);
        this.spoonGfx.beginPath();
        this.spoonGfx.moveTo(pivotX - BW * 0.3 * perpX, pivotY - BW * 0.3 * perpY);
        this.spoonGfx.lineTo(tipX - TW * 0.3 * perpX, tipY - TW * 0.3 * perpY);
        this.spoonGfx.strokePath();

        // ── Spoon bowl ────────────────────────────────────────────
        const BR = this.BOWL_R;
        
        // Outer bowl (metallic round base)
        this.spoonGfx.fillStyle(0xcccccc, 1);
        this.spoonGfx.fillCircle(tipX, tipY, BR);
        
        // Rim shadow (thickness)
        this.spoonGfx.lineStyle(3, 0x555555, 1);
        this.spoonGfx.strokeCircle(tipX, tipY, BR);

        // Inner concave illusion (darker metal)
        this.spoonGfx.fillStyle(0x999999, 1);
        this.spoonGfx.fillCircle(tipX, tipY, BR * 0.85);

        // Deep shadow at bottom of the bowl
        this.spoonGfx.fillStyle(0x666666, 0.6);
        this.spoonGfx.fillCircle(tipX, tipY + BR * 0.2, BR * 0.65);

        // Sheen at the top lip
        this.spoonGfx.fillStyle(0xffffff, 0.6);
        this.spoonGfx.fillEllipse(tipX, tipY - BR * 0.6, BR * 1.2, BR * 0.35);

        // ── Lime ──────────────────────────────────────────────────
        this.limeGfx.clear();
        this.shadowGfx.clear();

        if (this.canDrop && !this.droppingInProgress) {
          const offset   = this.limeOffset * this.BOWL_R * 0.8; // clamp slightly tighter for oval
          const limeX    = tipX + offset * perpX;
          const limeY    = tipY + offset * perpY - this.LIME_R * 0.4;
          const LR       = this.LIME_R;

          // Realistic Contact Shadow inside the bowl
          this.shadowGfx.fillStyle(0x000000, 0.4);
          this.shadowGfx.fillEllipse(limeX + 2, limeY + LR * 0.6, LR * 1.4, LR * 0.6);

          // Lime body – multi-pass for 3D juicy look
          this.limeGfx.fillStyle(0x1e5c1e, 1);        // dark green base shadow
          this.limeGfx.fillCircle(limeX, limeY, LR);
          
          this.limeGfx.fillStyle(0x32CD32, 1);        // bright green midtone
          this.limeGfx.fillCircle(limeX - LR * 0.1, limeY - LR * 0.1, LR * 0.9);
          
          this.limeGfx.fillStyle(0x7CFC00, 0.8);      // yellow-green sheen top
          this.limeGfx.fillCircle(limeX - LR * 0.25, limeY - LR * 0.25, LR * 0.5);
          
          // Lime skin dimples (pores)
          this.limeGfx.fillStyle(0x1e5c1e, 0.4);
          for(let i = 0; i < 12; i++) {
             const dx = Math.cos(i * 137.5) * LR * 0.6;
             const dy = Math.sin(i * 137.5) * LR * 0.6;
             this.limeGfx.fillCircle(limeX + dx, limeY + dy, 1.5);
          }

          // Specular glossy reflection
          this.limeGfx.fillStyle(0xffffff, 0.6);
          this.limeGfx.fillCircle(limeX - LR * 0.35, limeY - LR * 0.35, LR * 0.15);
          this.limeGfx.fillCircle(limeX - LR * 0.45, limeY - LR * 0.25, LR * 0.06);

          // Stem
          this.limeGfx.fillStyle(0x2d6a2d, 1);
          this.limeGfx.fillCircle(limeX + LR * 0.65, limeY - LR * 0.65, LR * 0.16);

          // Juice warning
          if (Math.abs(this.limeOffset) > 0.72) {
            const warningAlpha = (Math.abs(this.limeOffset) - 0.72) / 0.28;
            this.warningGfx.clear();
            this.warningGfx.fillStyle(0xff6600, warningAlpha * 0.3);
            this.warningGfx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            this.warningGfx.setAlpha(1);

            if (Math.random() > 0.72) {
              const side = this.limeOffset > 0 ? 1 : -1;
              this.spawnJuiceParticle(limeX + side * LR, limeY, 0x32CD32);
            }
          } else {
            this.warningGfx.clear();
            this.warningGfx.setAlpha(0);
          }
        }

        // ── Hands ─────────────────────────────────────────────────
        this.handsGfx.clear();
        const skinColor  = 0xf5cba7;
        const skinDark   = 0xd4956a;
        const sleeveCol  = 0xffffff;

        // Sleeves (Sri Lankan white Avurudu shirt cuffs)
        this.handsGfx.fillStyle(sleeveCol, 1);
        this.handsGfx.fillRoundedRect(pivotX - BW - 76, pivotY - 10, 96, 180, 14);
        this.handsGfx.fillRoundedRect(pivotX + BW - 20, pivotY - 10, 96, 180, 14);
        // Cuff borders
        this.handsGfx.lineStyle(3, 0xe0c8a0, 1);
        this.handsGfx.strokeRoundedRect(pivotX - BW - 76, pivotY - 10, 96, 180, 14);
        this.handsGfx.strokeRoundedRect(pivotX + BW - 20, pivotY - 10, 96, 180, 14);

        // Left hand
        this.handsGfx.fillStyle(skinColor, 1);
        this.handsGfx.fillCircle(pivotX - BW - 28, pivotY - 20, 54);
        this.handsGfx.lineStyle(3, skinDark, 1);
        this.handsGfx.strokeCircle(pivotX - BW - 28, pivotY - 20, 54);
        // Fingers
        for (let f = -1; f <= 3; f++) {
          this.handsGfx.fillStyle(skinColor, 1);
          this.handsGfx.fillRoundedRect(
            pivotX - BW * perpX - 28 + f * 15 - 6, pivotY - BW * perpY - 66, 10, 28, 5
          );
        }
        // Right hand
        this.handsGfx.fillStyle(skinColor, 1);
        this.handsGfx.fillCircle(pivotX + BW + 28, pivotY - 20, 54);
        this.handsGfx.lineStyle(3, skinDark, 1);
        this.handsGfx.strokeCircle(pivotX + BW + 28, pivotY - 20, 54);
        for (let f = -1; f <= 3; f++) {
          this.handsGfx.fillStyle(skinColor, 1);
          this.handsGfx.fillRoundedRect(
            pivotX + BW * perpX + 28 + f * 15 - 6, pivotY + BW * perpY - 66, 10, 28, 5
          );
        }
      }

      // ═══════════════════════════════════════════════════════════════
      //  DROP LIME
      // ═══════════════════════════════════════════════════════════════
      dropLime(direction: number) {
        if (this.droppingInProgress || this.isGameOver) return;
        this.droppingInProgress = true;
        this.canDrop = false;

        const rad   = Phaser.Math.DegToRad(this.spoonAngle);
        const perpX = Math.cos(rad);
        const perpY = Math.sin(rad);
        const pivotX = this.gameWidth / 2;
        const pivotY = this.gameHeight + 90;
        const tipX = pivotX + Math.sin(rad) * this.SPOON_LENGTH;
        const tipY = pivotY - Math.cos(rad) * this.SPOON_LENGTH;
        const offset = this.limeOffset * this.BOWL_R * 0.9;
        const startX = tipX + offset * perpX;
        const startY = tipY + offset * perpY - this.LIME_R * 0.5;

        // Juice splash burst
        for (let i = 0; i < 18; i++) this.spawnJuiceParticle(startX, startY, 0x32CD32);

        // Lime falls toward camera (scales up)
        const droppedLime = this.add.graphics().setDepth(26);
        droppedLime.fillStyle(0x32CD32, 1);
        droppedLime.fillCircle(0, 0, this.LIME_R);
        droppedLime.fillStyle(0x7CFC00, 0.7);
        droppedLime.fillCircle(-this.LIME_R * 0.3, -this.LIME_R * 0.3, this.LIME_R * 0.42);
        droppedLime.setPosition(startX, startY);

        this.tweens.add({
          targets: droppedLime,
          y: this.gameHeight + 250,
          x: startX + direction * 180,
          scale: 4,
          alpha: 0,
          duration: 550,
          ease: "Quad.easeIn",
          onComplete: () => {
            droppedLime.destroy();
            this.cameras.main.shake(300, 0.022);

            // Red flash
            this.warningGfx.clear();
            this.warningGfx.fillStyle(0xff0000, 0.5);
            this.warningGfx.fillRect(0, 0, this.gameWidth, this.gameHeight);
            this.warningGfx.setAlpha(1);
            this.tweens.add({ targets: this.warningGfx, alpha: 0, duration: 500 });

            this.lives--;
            this.updateLivesDisplay();
            this.comboMultiplier = 1;
            this.speedometerText.setText("1×");

            if (this.lives <= 0) {
              this.isGameOver = true;
              this.sound.stopAll();
              this.time.delayedCall(1200, () => onGameOver(Math.floor(this.score)));
            } else {
              // Brief pause before resetting
              this.time.delayedCall(700, () => {
                this.limeOffset  = 0;
                this.limeVelocity = 0;
                this.activePowerUp = null;
                this.BOWL_R = Math.min(this.gameWidth * 0.09, 64);
                this.droppingInProgress = false;
                this.canDrop = true;
                this.showFeedback("Drop!\n" + this.lives + " lime(s) left 🍋", "#ff6600");
              });
            }
          }
        });
      }

      // ═══════════════════════════════════════════════════════════════
      //  UPDATE (game loop)
      // ═══════════════════════════════════════════════════════════════
      update(time: number, delta: number) {
        const dt = delta / 1000;

        // ── Update juice particles ─────────────────────────────────
        for (let i = this.juiceParticles.length - 1; i >= 0; i--) {
          const p = this.juiceParticles[i];
          p.life -= dt * 1.8;
          p.vy   += 400 * dt; // gravity
          p.c.x  += p.vx * dt;
          p.c.y  += p.vy * dt;
          p.c.setAlpha(Math.max(0, p.life));
          if (p.life <= 0) {
            p.c.destroy();
            this.juiceParticles.splice(i, 1);
          }
        }

        if (this.isGameOver) {
          this.drawFirstPerson(0);
          return;
        }

        // ── Keyboard ──────────────────────────────────────────────
        if (this.input.keyboard) {
          const kb   = this.input.keyboard;
          const gL   = this.cursors?.left?.isDown  || kb.addKey("A").isDown;
          const gR   = this.cursors?.right?.isDown || kb.addKey("D").isDown;
          const spd  = 1400;
          if (gL) this.simulatedPointerX -= spd * dt;
          if (gR) this.simulatedPointerX += spd * dt;
          this.simulatedPointerX = Phaser.Math.Clamp(this.simulatedPointerX, 0, this.gameWidth);
        }

        // ── Target angle from pointer / keys ──────────────────────
        const cx   = this.gameWidth / 2;
        const dist = this.simulatedPointerX - cx;
        this.targetAngle = Phaser.Math.Clamp((dist / cx) * 42, -42, 42);

        // ── Difficulty ramp ───────────────────────────────────────
        this.difficultyMultiplier += dt * 0.018;
        let speed = 280 + (this.difficultyMultiplier - 1) * 22;
        if (this.activePowerUp === "boost") {
          speed *= 1.9;
          this.score += dt * 35;
        }
        this.zSpeed = speed;
        this.distanceRun += speed * dt;

        // ── Score & combo ─────────────────────────────────────────
        this.comboTimer += dt;
        if (this.comboTimer > 4.5) {
          this.comboMultiplier = Math.min(this.comboMultiplier + 1, 8);
          this.comboTimer = 0;
          const label = `${this.comboMultiplier}×`;
          this.speedometerText.setText(label);
          if (this.comboMultiplier > 1) {
            this.speedometerText.setScale(1.6);
            this.tweens.add({ targets: this.speedometerText, scale: 1, duration: 300, ease: "Back.easeOut" });
          }
        }
        this.score += ((speed * dt) / 22) * this.comboMultiplier;
        this.scoreText.setText("KP: " + Math.floor(this.score));
        this.distanceText.setText(Math.floor(this.distanceRun / 10) + " m");

        // ── Powerup countdown ─────────────────────────────────────
        if (this.activePowerUp) {
          this.powerupTimer -= dt;
          if (this.powerupTimer <= 0) {
            this.activePowerUp = null;
            this.BOWL_R = Math.min(this.gameWidth * 0.09, 64);
            this.showFeedback("Power-up gone!", "#888888");
          }
        }

        // ── Bob simulation ────────────────────────────────────────
        const bobFreq = 9 + Math.min(this.difficultyMultiplier * 1.5, 8);
        const bobAmp  = 14;
        const bobY    = Math.sin(time / 1000 * bobFreq) * bobAmp;

        // ── Wobble ────────────────────────────────────────────────
        this.wobblePhase += dt;
        let wobbleAmp   = 11 + (this.difficultyMultiplier - 1) * 3.5;
        let wobbleSpeed = 1.8 + (this.difficultyMultiplier - 1) * 0.55;
        if (this.activePowerUp === "steady") wobbleAmp *= 0.15;

        const wobbleDeg =
          Math.sin(this.wobblePhase * wobbleSpeed) * wobbleAmp +
          Math.cos(this.wobblePhase * wobbleSpeed * 1.7) * wobbleAmp * 0.45 +
          Math.sin(this.wobblePhase * wobbleSpeed * 3.1) * wobbleAmp * 0.18;

        // Lerp angle
        const totalTarget = this.targetAngle + wobbleDeg;
        this.spoonAngle = Phaser.Math.Linear(this.spoonAngle, totalTarget, Math.min(dt * 11, 0.5));

        // ── Lime physics ──────────────────────────────────────────
        if (this.canDrop && !this.droppingInProgress) {
          const gravityStrength = 9.2;
          const accel = gravityStrength * Math.sin(Phaser.Math.DegToRad(this.spoonAngle));

          this.limeVelocity += accel * dt;
          this.limeVelocity *= this.activePowerUp === "big" ? 0.90 : 0.95;
          this.limeOffset   += this.limeVelocity * dt;

          if (this.limeOffset < -1.0) this.dropLime(-1);
          else if (this.limeOffset > 1.0) this.dropLime(1);
        }

        // Calculate spoon tip X for item collision detection
        const rad = Phaser.Math.DegToRad(this.spoonAngle);
        const tipX = cx + Math.sin(rad) * this.SPOON_LENGTH;

        // ── 3-D scene objects ─────────────────────────────────────
        for (let i = this.sceneObjects.length - 1; i >= 0; i--) {
          const obj = this.sceneObjects[i];
          if (!obj.active) continue;

          obj.z -= this.zSpeed * dt;

          if (obj.z <= 1) {
            obj.gfx.destroy();
            this.sceneObjects.splice(i, 1);
            continue;
          }

          const sc  = this.FOCAL / obj.z;
          const sx  = cx + obj.x * sc;
          const sy  = this.HORIZON_Y + obj.y * sc + bobY * 0.4;

          obj.gfx.setPosition(sx, sy).setScale(sc);
          // depth: closer objects are drawn on top
          obj.gfx.setDepth(Math.max(2, 9 - obj.z / 180));

          // removed horizon culling so collectables always show

          // Power-up catch
          if (obj.type === "powerup" && obj.z < 160 && obj.z > 40) {
            // Check distance against the spoon tip X instead of the center
            if (Math.abs(sx - tipX) < 130) {
              this.activatePowerUp(obj.subType, obj.col);
              obj.gfx.destroy();
              this.sceneObjects.splice(i, 1);
            }
          }
        }

        // ── Draw everything ───────────────────────────────────────
        this.drawFirstPerson(bobY);
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      parent: gameRef.current,
      backgroundColor: "#d0e8ff",
      scene: MainScene,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    };

    phaserGame.current = new Phaser.Game(config);

    return () => {
      phaserGame.current?.destroy(true);
      phaserGame.current = null;
    };
  }, [onGameOver]);

  return <div ref={gameRef} className="w-full h-full" />;
}
