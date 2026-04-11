"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

interface KottaPoraGameProps {
  onMatchEnd: (won: boolean, score: number) => void;
}

export default function KottaPoraGame({ onMatchEnd }: KottaPoraGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !gameRef.current) return;

    // ─────────────────────────────────────────────────────────────
    //  MAIN SCENE
    // ─────────────────────────────────────────────────────────────
    class KottaPoraScene extends Phaser.Scene {
      // ── Character state ─────────────────────────────────────
      private playerAngle = 0;       // -100 … 100  (negative = lean left)
      private aiAngle = 0;
      private playerFallen = false;
      private aiFallen = false;

      // ── Match state ──────────────────────────────────────────
      private playerWins = 0;
      private aiWins = 0;
      private currentRound = 1;
      private roundActive = false;
      private timeLeft = 60;
      private roundTimerEvent!: Phaser.Time.TimerEvent;
      private isChampionMode = false;
      private trashTalkEvent?: Phaser.Time.TimerEvent;

      // ── Swing & Charge state ──────────────────────────────────
      private playerSwinging = false;
      private aiSwinging = false;
      private playerCooldown = 0;
      private aiCooldown = 0;
      private readonly SWING_COOLDOWN = 900; // ms

      // Charge Mechanic
      private isCharging = false;
      private chargeValue = 0; // 0.0 to 1.0
      private chargeGfx!: Phaser.GameObjects.Graphics;

      // Hype Mechanic
      private playerHype = 0; // 0 to 100
      private hypeFill!: Phaser.GameObjects.Graphics;
      private isHypeSwing = false;

      // Impact & Crowd
      private impactTremor = 0; // decays to 0
      private crowdMembers: { gfx: Phaser.GameObjects.Graphics; baseX: number; baseY: number; offset: number }[] = [];

      // ── Graphics containers ──────────────────────────────────
      private poleGfx!: Phaser.GameObjects.Graphics;
      private playerContainer!: Phaser.GameObjects.Container;
      private aiContainer!: Phaser.GameObjects.Container;

      // Pillow graphics held by each character
      private playerPillow!: Phaser.GameObjects.Graphics;
      private aiPillow!: Phaser.GameObjects.Graphics;

      // Balance meter graphics
      private playerMeterBg!: Phaser.GameObjects.Graphics;
      private playerMeterFill!: Phaser.GameObjects.Graphics;
      private aiMeterBg!: Phaser.GameObjects.Graphics;
      private aiMeterFill!: Phaser.GameObjects.Graphics;

      // UI text
      private timerText!: Phaser.GameObjects.Text;
      private roundText!: Phaser.GameObjects.Text;
      private playerWinsText!: Phaser.GameObjects.Text;
      private aiWinsText!: Phaser.GameObjects.Text;
      private swingBtnBg!: Phaser.GameObjects.Graphics;
      private swingBtnLabel!: Phaser.GameObjects.Text;

      // Dust / confetti particles pool
      private dustPool: Phaser.GameObjects.Graphics[] = [];

      // Input
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private spaceKey!: Phaser.Input.Keyboard.Key;

      // Pole centre Y
      private poleY = 0;

      // ── Wobble animation ─────────────────────────────────────
      private poleWobble = 0; // small oscillation added to both characters

      constructor() {
        super("KottaPoraScene");
      }

      // ─── preload ───────────
      preload() {
        this.load.audio("challenge", "/kottapora/challenge.mp3");
        this.load.audio("accepted", "/kottapora/accepted.mp3");
        this.load.audio("challenge_sound", "/kottapora/jc.mp3");
        this.load.audio("punch_sound", "/kottapora/punch.mp3");
        this.load.audio("slap_sound", "/kottapora/slap.mp3");
        this.load.audio("won_sound", "/kottapora/won.mp3");
        this.load.audio("boo_sound", "/kottapora/boo.mp3");
        this.load.audio("hjc_sound", "/kottapora/hjc.mp3");
      }

      // ─── create ─────────────────────────────────────────────
      create() {
        const { width, height } = this.scale;
        this.poleY = height * 0.60;

        this.cameras.main.setBackgroundColor("#FFFFFF");

        this.buildBackground(width, height);
        this.buildPole(width);
        this.buildCharacters(width, height);
        this.buildUI(width, height);
        this.buildMobileControls(width, height);

        // Keyboard
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.spaceKey = this.input.keyboard!.addKey(
          Phaser.Input.Keyboard.KeyCodes.SPACE
        );

        // Track Spacebar hold for charging
        this.spaceKey.on("down", () => {
          if (this.roundActive && !this.playerFallen && !this.playerSwinging && this.playerCooldown <= 0) {
            this.isCharging = true;
          }
        });
        this.spaceKey.on("up", () => {
          if (this.isCharging) {
            this.isCharging = false;
            this.playerSwing(this.chargeValue);
          }
        });

        // Mobile touch regions (left / right half)
        this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
          if (!this.roundActive) return;
          if (p.x < width / 2) {
            this.leanPlayer(-1);
          } else if (p.x > width * 0.60 && p.y < height * 0.82) {
            this.leanPlayer(1);
          }
        });

        this.showRoundIntro();
      }

      // ─── update ─────────────────────────────────────────────
      update(time: number, delta: number) {
        if (!this.roundActive) return;

        const dt = delta / 1000;

        // ── Player controls ──────────────────────────────────
        if (
          Phaser.Input.Keyboard.JustDown(this.cursors.left!) &&
          !this.playerFallen
        ) {
          this.leanPlayer(-1);
        }
        if (
          Phaser.Input.Keyboard.JustDown(this.cursors.right!) &&
          !this.playerFallen
        ) {
          this.leanPlayer(1);
        }

        // Charging mechanic update
        if (this.isCharging) {
          this.chargeValue = Phaser.Math.Clamp(this.chargeValue + dt * 1.5, 0, 1); // Full charge in ~0.66s
          this.updateChargeVisuals();

          // Small continuous wobble while charging
          this.playerContainer.angle += (Math.random() - 0.5) * 4 * this.chargeValue;
        }

        // ── Gravity drift (slow drift toward zero, but lean persists) ─
        if (!this.playerFallen) {
          // Drift: small constant push toward a random side + restore
          this.playerAngle += (Math.random() - 0.51) * 2 * dt * 10;
          this.applyPoleWobble("player");
          this.updateCharacterVisuals("player");
          this.updateBalanceMeter("player");
          if (Math.abs(this.playerAngle) >= 100) this.triggerFall("player");
        }

        if (!this.aiFallen) {
          this.runAI(delta);
          this.aiAngle += (Math.random() - 0.49) * 2 * dt * 10;
          this.applyPoleWobble("ai");
          this.updateCharacterVisuals("ai");
          this.updateBalanceMeter("ai");
          if (Math.abs(this.aiAngle) >= 100) this.triggerFall("ai");
        }

        // ── Cooldown counters ────────────────────────────────
        if (this.playerCooldown > 0) this.playerCooldown -= delta;
        if (this.aiCooldown > 0) this.aiCooldown -= delta;

        // ── Tremor decay ──────────────────────────────────────────
        if (this.impactTremor > 0) {
          this.impactTremor -= dt * 60; // decays over time
          if (this.impactTremor < 0) this.impactTremor = 0;
          this.poleWobble = (Math.random() - 0.5) * this.impactTremor;
          // visually shake the pole graphics
          this.poleGfx.y = this.poleWobble * 2;
        } else {
          // Normal sway
          this.poleWobble = Math.sin(this.time.now / 600) * 0.5;
          this.poleGfx.y = 0;
        }

        // ── Crowd Animation ──────────────────────────────────────
        this.updateCrowd(time);
      }

      // ──────────────────────────────────────────────────────────
      //  BUILD HELPERS
      // ──────────────────────────────────────────────────────────

      buildBackground(width: number, height: number) {
        // Subtle festive gradient background
        const sky = this.add.graphics();
        sky.fillGradientStyle(0xfff7e6, 0xfff7e6, 0xffeedd, 0xffeedd, 1);
        sky.fillRect(0, 0, width, height);

        // Animated Crowd silhouettes (simple arcs)
        for (let i = 0; i < 18; i++) {
          const crowdGfx = this.add.graphics();
          crowdGfx.fillStyle(0xe8d4b8, 0.5);

          const cx = (i / 17) * width;
          const baseY = this.poleY + 80 + Math.sin(i * 1.7) * 15;
          const r = 14 + Math.sin(i * 2.3) * 5;

          crowdGfx.fillCircle(0, 0, r);
          crowdGfx.fillRect(-6, 0, 12, 30);

          crowdGfx.x = cx;
          crowdGfx.y = baseY;

          this.crowdMembers.push({ gfx: crowdGfx, baseX: cx, baseY, offset: Math.random() * Math.PI * 2 });
        }

        // Decorative banana-leaf bundles each side
        const deco = this.add.graphics();
        deco.fillStyle(0x4caf50, 0.7);
        // Left bundle
        for (let i = 0; i < 5; i++) {
          const angle = -60 + i * 20;
          const rad = (angle * Math.PI) / 180;
          deco.fillTriangle(
            30, this.poleY + 60,
            30 + Math.cos(rad) * 60, this.poleY + 60 + Math.sin(rad) * 50,
            30 + Math.cos(rad) * 10, this.poleY + 60 + Math.sin(rad) * 55
          );
        }
        // Right bundle
        for (let i = 0; i < 5; i++) {
          const angle = -120 + i * (-20);
          const rad = (angle * Math.PI) / 180;
          deco.fillTriangle(
            width - 30, this.poleY + 60,
            width - 30 + Math.cos(rad) * 60,
            this.poleY + 60 + Math.sin(rad) * 50,
            width - 30 + Math.cos(rad) * 10,
            this.poleY + 60 + Math.sin(rad) * 55
          );
        }

        // Ground
        const ground = this.add.graphics();
        ground.fillStyle(0xa06040, 1);
        ground.fillRect(0, this.poleY + 90, width, height - this.poleY - 90);
        ground.fillStyle(0x8b5030, 1);
        ground.fillRect(0, this.poleY + 90, width, 6);
      }

      buildPole(width: number) {
        this.poleGfx = this.add.graphics();
        this.drawPole(width);
      }

      drawPole(width: number) {
        this.poleGfx.clear();
        const poleW = width * 0.72;
        const poleH = 22;
        const poleX = width / 2 - poleW / 2;
        const poleY = this.poleY - poleH / 2;

        // Shadow
        this.poleGfx.fillStyle(0x000000, 0.15);
        this.poleGfx.fillRoundedRect(poleX + 4, poleY + 6, poleW, poleH, 11);

        // Main log – gradient-like layering
        this.poleGfx.fillStyle(0x8b4513, 1);
        this.poleGfx.fillRoundedRect(poleX, poleY, poleW, poleH, 11);
        this.poleGfx.fillStyle(0xa0522d, 1);
        this.poleGfx.fillRoundedRect(poleX, poleY, poleW, poleH * 0.4, 11);
        this.poleGfx.fillStyle(0xdeb887, 0.3);
        this.poleGfx.fillRoundedRect(poleX + 4, poleY + 2, poleW - 8, 4, 3);

        // Wood grain lines
        this.poleGfx.lineStyle(1, 0x6b3410, 0.4);
        for (let i = 0; i < 5; i++) {
          const gx = poleX + poleW * (0.15 + i * 0.15);
          this.poleGfx.beginPath();
          this.poleGfx.moveTo(gx, poleY + 4);
          this.poleGfx.lineTo(gx + 8, poleY + poleH - 4);
          this.poleGfx.strokePath();
        }

        // Support ropes from pole ends downward (decorative)
        this.poleGfx.lineStyle(3, 0x8b7355, 0.8);
        this.poleGfx.beginPath();
        this.poleGfx.moveTo(poleX, poleY);
        this.poleGfx.lineTo(poleX - 20, this.poleY + 80);
        this.poleGfx.strokePath();
        this.poleGfx.beginPath();
        this.poleGfx.moveTo(poleX + poleW, poleY);
        this.poleGfx.lineTo(poleX + poleW + 20, this.poleY + 80);
        this.poleGfx.strokePath();
      }

      buildCharacters(width: number, _height: number) {
        // Player (left) – blue/red Avurudu clothes
        this.playerContainer = this.add.container(width * 0.30, this.poleY);
        this.playerPillow = this.drawCharacter(
          this.playerContainer,
          true,
          0xe63946,  // shirt
          0xfcd116   // dhoti
        );

        // AI (right) – green/purple
        this.aiContainer = this.add.container(width * 0.70, this.poleY);
        this.aiPillow = this.drawCharacter(
          this.aiContainer,
          false,
          0x2a9d8f,  // shirt
          0x9b5de5   // dhoti
        );
      }

      /**
       * Draws a character into the given container.
       * Returns the pillow Graphics object so it can be tweened separately.
       */
      drawCharacter(
        container: Phaser.GameObjects.Container,
        facingRight: boolean,
        shirtColor: number,
        dhotColor: number
      ): Phaser.GameObjects.Graphics {
        const g = this.add.graphics();
        const dir = facingRight ? 1 : -1;

        // Dhoti (lower body – sits ON the pole)
        g.fillStyle(dhotColor, 1);
        g.fillRoundedRect(-12, 0, 24, 20, 4);

        // Body (shirt)
        g.fillStyle(shirtColor, 1);
        g.fillRoundedRect(-10, -30, 20, 30, 5);

        // Hand behind back (small fist on opposite side)
        g.fillStyle(0xf0c27f, 1);
        g.fillCircle(-dir * 12, -18, 5);

        // Head
        g.fillStyle(0xf0c27f, 1);
        g.fillCircle(0, -42, 12);

        // Eyes
        g.fillStyle(0x222222, 1);
        g.fillCircle(dir * 4, -44, 2);

        // Simple smile
        g.lineStyle(1.5, 0x222222, 1);
        g.beginPath();
        g.arc(dir * 2, -40, 4, 0.3, Math.PI - 0.3, false);
        g.strokePath();

        // Festive head accessory (small rectangle)
        g.fillStyle(0xfcd116, 1);
        g.fillRect(-5, -56, 10, 4);

        container.add(g);

        // Pillow arm (the one that swings)
        const pillow = this.add.graphics();
        this.drawPillow(pillow, dir, 0);
        container.add(pillow);

        return pillow;
      }

      drawPillow(
        g: Phaser.GameObjects.Graphics,
        dir: number,
        swingAngle: number
      ) {
        g.clear();
        g.save();

        // Arm line
        g.lineStyle(5, 0xf0c27f, 1);
        g.beginPath();
        const armEndX = dir * (18 + Math.cos((swingAngle * Math.PI) / 180) * 20);
        const armEndY = -20 + Math.sin((swingAngle * Math.PI) / 180) * 20;
        g.moveTo(dir * 8, -22);
        g.lineTo(armEndX, armEndY);
        g.strokePath();

        // Pillow rectangle
        g.fillStyle(0xffffff, 1);
        g.lineStyle(2, 0xdddddd, 1);
        const pw = 20, ph = 14;
        const pAngle = (swingAngle * Math.PI) / 180;
        // Draw rotated rectangle manually (simple approach: draw at offset)
        g.fillRoundedRect(armEndX - pw / 2, armEndY - ph / 2, pw, ph, 4);
        g.strokeRoundedRect(armEndX - pw / 2, armEndY - ph / 2, pw, ph, 4);

        // Pillow stripes (decorative)
        g.lineStyle(1.5, 0xfcd116, 0.8);
        for (let i = 1; i < 4; i++) {
          g.beginPath();
          g.moveTo(armEndX - pw / 2 + (pw / 4) * i, armEndY - ph / 2);
          g.lineTo(armEndX - pw / 2 + (pw / 4) * i, armEndY + ph / 2);
          g.strokePath();
        }

        g.restore();
      }

      buildUI(width: number, _height: number) {
        const { height } = this.scale;

        // === TOP HEADER STRIP ===
        // Background
        this.add
          .rectangle(width / 2, 0, width, 52, 0xda291c, 0.95)
          .setOrigin(0.5, 0);

        // Title
        this.add
          .text(width / 2, 26, "🛌 Kotta Pora – Pillow Fight!", {
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: "17px",
            color: "#fcd116",
            stroke: "#7a0000",
            strokeThickness: 2,
          })
          .setOrigin(0.5, 0.5);

        // === SECOND ROW: round info + timer ===
        this.add
          .rectangle(width / 2, 52, width, 36, 0x000000, 0.07)
          .setOrigin(0.5, 0);

        // Left: player wins indicator
        this.playerWinsText = this.add.text(18, 70, "😄 ★☆☆", {
          fontSize: "14px",
          fontFamily: "system-ui, sans-serif",
          color: "#da291c",
          fontStyle: "bold",
        }).setOrigin(0, 0.5);

        // Center: timer
        this.add.circle(width / 2, 70, 18, 0xffffff, 1).setStrokeStyle(
          3,
          0xda291c
        );
        this.timerText = this.add
          .text(width / 2, 70, "60", {
            fontSize: "20px",
            fontFamily: "system-ui, sans-serif",
            color: "#da291c",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        // Right: AI wins indicator
        this.aiWinsText = this.add
          .text(width - 18, 70, "☆☆☆ 🤖", {
            fontSize: "14px",
            fontFamily: "system-ui, sans-serif",
            color: "#2a9d8f",
            fontStyle: "bold",
          })
          .setOrigin(1, 0.5);

        // Label
        this.add.text(width / 2, 105, "HYPE", {
          fontSize: "10px",
          fontFamily: '"Arial Black", Impact, sans-serif',
          color: "#666666",
        }).setOrigin(0.5);

        // Hype Meter Background
        const hypeBg = this.add.graphics();
        hypeBg.fillStyle(0x000000, 0.1);
        hypeBg.fillRoundedRect(width / 2 - 40, 115, 80, 8, 4);
        this.hypeFill = this.add.graphics();

        // Round label
        this.roundText = this.add
          .text(width / 2, 138, "Round 1 of 3", {
            fontSize: "12px",
            fontFamily: "system-ui, sans-serif",
            color: "#555555",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        // === BALANCE METERS ===
        const meterW = 70, meterH = 10;
        const playerMX = this.playerContainer.x;
        const aiMX = this.aiContainer.x;
        const meterY = this.poleY - 90;

        // Player meter bg
        this.playerMeterBg = this.add.graphics();
        this.playerMeterBg.fillStyle(0xeeeeee, 1);
        this.playerMeterBg.fillRoundedRect(
          playerMX - meterW / 2,
          meterY,
          meterW,
          meterH,
          5
        );
        this.playerMeterBg.lineStyle(1.5, 0xcccccc, 1);
        this.playerMeterBg.strokeRoundedRect(
          playerMX - meterW / 2,
          meterY,
          meterW,
          meterH,
          5
        );

        this.playerMeterFill = this.add.graphics();

        // AI meter bg
        this.aiMeterBg = this.add.graphics();
        this.aiMeterBg.fillStyle(0xeeeeee, 1);
        this.aiMeterBg.fillRoundedRect(
          aiMX - meterW / 2,
          meterY,
          meterW,
          meterH,
          5
        );
        this.aiMeterBg.lineStyle(1.5, 0xcccccc, 1);
        this.aiMeterBg.strokeRoundedRect(
          aiMX - meterW / 2,
          meterY,
          meterW,
          meterH,
          5
        );

        this.aiMeterFill = this.add.graphics();

        // Labels under meters
        this.add
          .text(playerMX, meterY - 12, "YOU", {
            fontSize: "10px",
            fontFamily: "system-ui, sans-serif",
            color: "#da291c",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
        this.add
          .text(aiMX, meterY - 12, "AI-Opponent", {
            fontSize: "10px",
            fontFamily: "system-ui, sans-serif",
            color: "#2a9d8f",
            fontStyle: "bold",
          })
          .setOrigin(0.5);

        // Draw initial state
        this.updateBalanceMeter("player");
        this.updateBalanceMeter("ai");
        this.updateWinsDisplay();
        this.updateHypeMeter();

        // Charge visualization hook
        this.chargeGfx = this.add.graphics();
        this.chargeGfx.setDepth(20);
      }

      buildMobileControls(width: number, height: number) {
        const btnY = height * 0.88;
        const leanBtnW = 68;
        const leanBtnH = 56;
        const leanGap = 8;

        // ══════════════════════════════════════════════
        //  LEFT SIDE — Both Lean buttons (horizontal)
        // ══════════════════════════════════════════════

        // ← lean left
        const leftBg = this.add.graphics();
        leftBg.fillStyle(0xda291c, 0.9);
        leftBg.fillRoundedRect(12, btnY - leanBtnH / 2, leanBtnW, leanBtnH, 14);
        // Subtle inner highlight
        leftBg.fillStyle(0xff4444, 0.25);
        leftBg.fillRoundedRect(14, btnY - leanBtnH / 2 + 2, leanBtnW - 4, leanBtnH * 0.4, 12);
        this.add
          .text(12 + leanBtnW / 2, btnY, "◀ LEFT", {
            fontSize: "13px",
            fontFamily: '"Arial Black", Impact, sans-serif',
            color: "#ffffff",
            align: "center",
          })
          .setOrigin(0.5);
        leftBg.setInteractive(
          new Phaser.Geom.Rectangle(12, btnY - leanBtnH / 2, leanBtnW, leanBtnH),
          Phaser.Geom.Rectangle.Contains
        );
        leftBg.on("pointerdown", () => {
          if (this.roundActive && !this.playerFallen) this.leanPlayer(-1);
        });

        // → lean right (next to left button)
        const rightX = 12 + leanBtnW + leanGap;
        const rightBg = this.add.graphics();
        rightBg.fillStyle(0xda291c, 0.9);
        rightBg.fillRoundedRect(rightX, btnY - leanBtnH / 2, leanBtnW, leanBtnH, 14);
        rightBg.fillStyle(0xff4444, 0.25);
        rightBg.fillRoundedRect(rightX + 2, btnY - leanBtnH / 2 + 2, leanBtnW - 4, leanBtnH * 0.4, 12);
        this.add
          .text(rightX + leanBtnW / 2, btnY, "RIGHT ▶", {
            fontSize: "13px",
            fontFamily: '"Arial Black", Impact, sans-serif',
            color: "#ffffff",
            align: "center",
          })
          .setOrigin(0.5);
        rightBg.setInteractive(
          new Phaser.Geom.Rectangle(rightX, btnY - leanBtnH / 2, leanBtnW, leanBtnH),
          Phaser.Geom.Rectangle.Contains
        );
        rightBg.on("pointerdown", () => {
          if (this.roundActive && !this.playerFallen) this.leanPlayer(1);
        });

        // "BALANCE" label above lean buttons
        const leanCenterX = 12 + leanBtnW + leanGap / 2;
        this.add
          .text(leanCenterX, btnY - leanBtnH / 2 - 14, "BALANCE", {
            fontSize: "9px",
            fontFamily: '"Arial Black", Impact, sans-serif',
            color: "#999999",
            align: "center",
          })
          .setOrigin(0.5);

        // ══════════════════════════════════════════════
        //  RIGHT SIDE — Swing button (large circle)
        // ══════════════════════════════════════════════
        const swingRadius = 46;
        const swingCX = width - swingRadius - 16;
        const swingCY = btnY;

        // Outer glow ring
        const swingGlow = this.add.graphics();
        swingGlow.fillStyle(0xf58220, 0.2);
        swingGlow.fillCircle(swingCX, swingCY, swingRadius + 6);

        this.swingBtnBg = this.add.graphics();
        this.swingBtnBg.fillStyle(0xf58220, 1);
        this.swingBtnBg.fillCircle(swingCX, swingCY, swingRadius);
        // Inner highlight
        this.swingBtnBg.fillStyle(0xffaa44, 0.35);
        this.swingBtnBg.fillCircle(swingCX, swingCY - 8, swingRadius * 0.6);

        this.swingBtnLabel = this.add
          .text(swingCX, swingCY, "SWING\n🛌", {
            fontSize: "15px",
            fontFamily: '"Arial Black", Impact, sans-serif',
            color: "#ffffff",
            align: "center",
          })
          .setOrigin(0.5);

        // "ATTACK" label above swing button
        this.add
          .text(swingCX, swingCY - swingRadius - 14, "ATTACK", {
            fontSize: "9px",
            fontFamily: '"Arial Black", Impact, sans-serif',
            color: "#999999",
            align: "center",
          })
          .setOrigin(0.5);

        this.swingBtnBg.setInteractive(
          new Phaser.Geom.Circle(swingCX, swingCY, swingRadius),
          Phaser.Geom.Circle.Contains
        );
        this.swingBtnBg.on("pointerdown", () => {
          if (this.roundActive && !this.playerFallen && !this.playerSwinging && this.playerCooldown <= 0) {
            this.isCharging = true;
            // Visual press feedback
            this.tweens.add({ targets: this.swingBtnBg, scale: 0.9, duration: 100 });
          }
        });

        const releaseCharge = () => {
          if (this.isCharging) {
            this.isCharging = false;
            this.tweens.killTweensOf(this.swingBtnBg);
            this.swingBtnBg.setScale(1);
            this.playerSwing(this.chargeValue);
          }
        };

        this.swingBtnBg.on("pointerup", releaseCharge);
        this.swingBtnBg.on("pointerout", releaseCharge);
      }

      // ──────────────────────────────────────────────────────────
      //  GAME LOGIC
      // ──────────────────────────────────────────────────────────

      showRoundIntro() {
        const { width, height } = this.scale;
        this.roundActive = false;

        const overlay = this.add
          .rectangle(width / 2, height / 2, width, height, 0x000000, 0.55)
          .setDepth(40);

        const roundLabel = this.add
          .text(width / 2, height * 0.38, `Round ${this.currentRound}`, {
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: "42px",
            color: "#fcd116",
            stroke: "#000000",
            strokeThickness: 6,
          })
          .setOrigin(0.5)
          .setDepth(41)
          .setScale(0);

        const diffLabel = this.add
          .text(
            width / 2,
            height * 0.52,
            this.isChampionMode ? "Champion AI - Extreme! 💀" : "Easy AI",
            {
              fontFamily: "system-ui, sans-serif",
              fontSize: "18px",
              color: "#ffffff",
              stroke: "#000000",
              strokeThickness: 3,
            }
          )
          .setOrigin(0.5)
          .setDepth(41)
          .setAlpha(0);

        const hint = this.add
          .text(
            width / 2,
            height * 0.62,
            "← → to lean  |  SPACE to swing pillow",
            {
              fontFamily: "system-ui, sans-serif",
              fontSize: "13px",
              color: "#cccccc",
            }
          )
          .setOrigin(0.5)
          .setDepth(41)
          .setAlpha(0);

        this.tweens.add({
          targets: roundLabel,
          scale: 1,
          duration: 500,
          ease: "Back.easeOut",
        });
        this.tweens.add({
          targets: [diffLabel, hint],
          alpha: 1,
          duration: 400,
          delay: 400,
        });

        this.time.delayedCall(2200, () => {
          this.tweens.add({
            targets: [overlay, roundLabel, diffLabel, hint],
            alpha: 0,
            duration: 400,
            onComplete: () => {
              overlay.destroy();
              roundLabel.destroy();
              diffLabel.destroy();
              hint.destroy();
              this.startRound();
            },
          });
        });
      }

      startRound() {
        this.playerAngle = 0;
        this.aiAngle = 0;
        this.playerFallen = false;
        this.aiFallen = false;
        this.playerSwinging = false;
        this.aiSwinging = false;
        this.playerCooldown = 0;
        this.aiCooldown = 0;
        this.timeLeft = 60;

        this.isCharging = false;
        this.chargeValue = 0;
        this.isHypeSwing = false;
        this.playerHype = 0;
        if (this.chargeGfx) this.chargeGfx.clear();

        this.timerText.setText("60");
        this.timerText.setColor("#da291c");
        this.roundText.setText(`Round ${this.currentRound} of 3`);

        // Reset character visuals
        this.playerContainer.setAngle(0);
        this.aiContainer.setAngle(0);
        this.playerContainer.y = this.poleY;
        this.aiContainer.y = this.poleY;
        this.playerContainer.setAlpha(1);
        this.aiContainer.setAlpha(1);
        this.updateBalanceMeter("player");
        this.updateBalanceMeter("ai");
        this.updateHypeMeter();

        // Start timer
        if (this.roundTimerEvent) this.roundTimerEvent.remove();
        this.roundTimerEvent = this.time.addEvent({
          delay: 1000,
          callback: this.tickTimer,
          callbackScope: this,
          loop: true,
        });

        // Champion trash talk
        if (this.trashTalkEvent) this.trashTalkEvent.remove();
        if (this.isChampionMode) {
          this.trashTalkEvent = this.time.addEvent({
             delay: 4000,
             callback: this.triggerTrashTalk,
             callbackScope: this,
             loop: true
          });
        }

        this.roundActive = true;
      }

      triggerTrashTalk() {
        if (!this.roundActive || this.aiFallen) return;
        if (Math.random() > 0.4) return; // 40% chance per 4 secs
        const phrases = [
          "You think you can beat me?",
          "This pole is mine!",
          "Too weak!",
          "Avurudu Champion never loses!",
          "Give up!"
        ];
        const phrase = phrases[Phaser.Math.Between(0, phrases.length - 1)];
        
        const bubble = this.add.container(this.aiContainer.x, this.aiContainer.y - 120).setDepth(35);
        
        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 0.95);
        bg.lineStyle(2, 0x000000, 1);
        bg.fillRoundedRect(-65, -25, 130, 50, 8);
        bg.strokeRoundedRect(-65, -25, 130, 50, 8);
        
        // Triangle pointer
        bg.fillStyle(0xffffff, 0.95);
        bg.fillTriangle(-10, 24, 10, 24, 0, 36);
        bg.lineStyle(2, 0x000000, 1);
        bg.beginPath();
        bg.moveTo(-10, 24);
        bg.lineTo(0, 36);
        bg.lineTo(10, 24);
        bg.strokePath();
        
        const text = this.add.text(0, 0, phrase, {
           fontFamily: "system-ui, sans-serif",
           fontSize: "12px",
           color: "#000000",
           align: "center",
           wordWrap: { width: 120 },
           fontStyle: "bold"
        }).setOrigin(0.5);
        
        bubble.add(bg);
        bubble.add(text);
        
        this.tweens.add({
           targets: bubble,
           y: bubble.y - 20,
           alpha: {from: 1, to: 0},
           duration: 2500,
           delay: 1000,
           onComplete: () => bubble.destroy()
        });
      }

      tickTimer() {
        this.timeLeft--;
        this.timerText.setText(this.timeLeft.toString());
        if (this.timeLeft <= 10) this.timerText.setColor("#cc0000");

        if (this.timeLeft <= 0) {
          // Timeout → whoever is more balanced wins
          const playerAbs = Math.abs(this.playerAngle);
          const aiAbs = Math.abs(this.aiAngle);
          if (playerAbs <= aiAbs) {
            this.endRound("player");
          } else {
            this.endRound("ai");
          }
        }
      }

      leanPlayer(dir: number) {
        if (this.playerFallen) return;
        // Corrective lean – shifts balance back toward center
        this.playerAngle -= dir * 12;
        this.playerAngle = Phaser.Math.Clamp(this.playerAngle, -100, 100);
        // Visual snap
        this.tweens.add({
          targets: this.playerContainer,
          angle: this.playerAngle * 0.45,
          duration: 100,
          ease: "Sine.easeOut",
        });
        this.updateBalanceMeter("player");
      }

      playerSwing(charge: number = 0) {
        if (this.playerSwinging || this.playerCooldown > 0) return;
        this.playerSwinging = true;
        this.playerCooldown = this.SWING_COOLDOWN;
        this.chargeValue = Math.max(0.1, charge);

        if (this.playerHype >= 100) {
          this.isHypeSwing = true;
          this.playerHype = 0;
          this.updateHypeMeter();
          this.floatText(this.playerContainer.x, this.playerContainer.y - 70, "HYPE SWING!", "#2ecc71", 20);
        }

        if (this.chargeGfx) this.chargeGfx.clear();

        this.animateSwing("player", this.chargeValue, this.isHypeSwing, () => {
          this.playerSwinging = false;
          this.checkHit("player", this.chargeValue, this.isHypeSwing);
          this.isHypeSwing = false;
          this.chargeValue = 0;
        });
      }

      // ── AI Logic ─────────────────────────────────────────────
      runAI(delta: number) {
        const isEasy = !this.isChampionMode; // All normal rounds use the same easy difficulty
        
        const balanceThreshold = this.isChampionMode ? 15 : (isEasy ? 65 : 45);
        const attackRange = this.isChampionMode ? 55 : (isEasy ? 25 : 35);
        const attackChance = this.isChampionMode ? 0.015 : (isEasy ? 0.002 : 0.006); // per frame

        // Balance self
        if (Math.abs(this.aiAngle) > balanceThreshold) {
          const correction = -Math.sign(this.aiAngle) * 8;
          const champMult = this.isChampionMode ? 2.8 : 1;
          this.aiAngle += correction * (delta / 1000) * (isEasy ? 0.7 : 1.3) * champMult;
        }

        // Attack
        const distToPlayer = Math.abs(this.playerAngle);
        if (
          !this.aiSwinging &&
          this.aiCooldown <= 0 &&
          (distToPlayer < attackRange || Math.random() < attackChance)
        ) {
          this.aiSwinging = true;
          this.aiCooldown = this.isChampionMode ? this.SWING_COOLDOWN * 0.7 : (isEasy ? this.SWING_COOLDOWN * 2.2 : this.SWING_COOLDOWN * 1.5);
          const aiCharge = this.isChampionMode ? Math.random() * 0.5 + 0.5 : Math.random() * 0.5 + 0.2;
          this.animateSwing("ai", aiCharge, false, () => {
            this.aiSwinging = false;
            this.checkHit("ai", aiCharge, false);
          });
        }
      }

      // ── Swing animation ───────────────────────────────────────
      animateSwing(
        who: "player" | "ai",
        charge: number,
        isHype: boolean,
        onComplete: () => void
      ) {
        const { width } = this.scale;
        const container =
          who === "player" ? this.playerContainer : this.aiContainer;
        const pillow = who === "player" ? this.playerPillow : this.aiPillow;
        const dir = who === "player" ? 1 : -1;

        // Flash button for player
        if (who === "player" && this.swingBtnBg) {
          this.tweens.add({
            targets: this.swingBtnBg,
            scaleX: { from: 1.15, to: 1 },
            scaleY: { from: 1.15, to: 1 },
            duration: 200,
            ease: "Back.easeOut",
          });
        }

        // Build swing via a timeline-like sequence using tweens
        // Phase 1 – wind up
        this.tweens.add({
          targets: pillow,
          angle: dir * -40,
          duration: 150,
          ease: "Sine.easeOut",
          onComplete: () => {
            // Phase 2 – slam forward
            this.tweens.add({
              targets: pillow,
              angle: dir * 60,
              duration: 200,
              ease: "Power3",
              onUpdate: () => {
                // Spawn motion trail particles
                this.spawnTrail(
                  container.x + dir * 40,
                  container.y - 20,
                  0xffffff
                );
              },
              onComplete: () => {
                // Phase 3 – return
                this.tweens.add({
                  targets: pillow,
                  angle: 0,
                  duration: 200,
                  ease: "Sine.easeInOut",
                  onComplete: () => {
                    onComplete();
                  },
                });
              },
            });
          },
        });

        // Body lean into swing
        this.tweens.add({
          targets: container,
          angle: dir === 1 ? 8 * (1 + charge) : -8 * (1 + charge),
          duration: 200,
          yoyo: true,
          ease: "Sine.easeInOut",
        });

        // Whoosh text
        const { height } = this.scale;

        if (isHype) {
          // Hype visual FX on swing
          const hypeRing = this.add.circle(container.x, container.y - 20, 20, 0x2ecc71, 0.6).setDepth(20);
          this.tweens.add({
            targets: hypeRing,
            scale: 6,
            alpha: 0,
            duration: 300,
            ease: "Power3",
            onComplete: () => hypeRing.destroy()
          });
        }

        this.floatText(
          container.x + dir * 50,
          container.y - 30,
          "WHOOSH!",
          "#f58220",
          16
        );
      }

      checkHit(attacker: "player" | "ai", charge: number, isHype: boolean) {
        const { width } = this.scale;
        const attackerX =
          attacker === "player"
            ? this.playerContainer.x
            : this.aiContainer.x;
        const defenderX =
          attacker === "player"
            ? this.aiContainer.x
            : this.playerContainer.x;
        const defenderFallen =
          attacker === "player" ? this.aiFallen : this.playerFallen;

        if (defenderFallen) return;

        // Hit if within range
        const dist = Math.abs(attackerX - defenderX);
        const hitRange = width * 0.52;

        if (dist < hitRange) {
          // Apply force to defender
          const pushDir = Math.sign(defenderX - attackerX);

          let forceFactor = 1 + (charge * 1.5);
          if (isHype) forceFactor = 3.5;
          const force = (18 + (this.currentRound - 1) * 4) * forceFactor;

          if (attacker === "player") {
            this.aiAngle += pushDir * force;
            this.aiAngle = Phaser.Math.Clamp(this.aiAngle, -100, 100);
            this.hitFeedback(this.aiContainer);
            this.playerHype = Math.min(100, this.playerHype + 15 + Math.floor(charge * 15));
            this.updateHypeMeter();
            this.sound.play("punch_sound", { volume: 0.8 });
          } else {
            this.playerAngle += pushDir * force;
            this.playerAngle = Phaser.Math.Clamp(this.playerAngle, -100, 100);
            this.hitFeedback(this.playerContainer);
            this.sound.play("slap_sound", { volume: 0.8 });
          }

          this.impactTremor = force * 0.4;

          // Screen shake
          this.cameras.main.shake(120, 0.005 * forceFactor);

          // Hit sparks & POW!
          const hitX =
            attacker === "player"
              ? this.aiContainer.x - 20
              : this.playerContainer.x + 20;

          if (forceFactor >= 2.0) {
            this.spawnPOW(hitX, this.poleY - 30);
          } else {
            this.spawnHitSparks(hitX, this.poleY - 20);
          }

          // Float text
          this.floatText(
            defenderX,
            this.poleY - 55,
            isHype ? "💥 SUPER HIT!" : "💥 HIT!",
            "#da291c",
            isHype ? 24 : 20
          );
        }
      }

      hitFeedback(container: Phaser.GameObjects.Container) {
        const originalAngle = container.angle;
        this.tweens.add({
          targets: container,
          angle: originalAngle + (Math.random() > 0.5 ? 20 : -20),
          duration: 100,
          ease: "Power2",
          yoyo: true,
        });
      }

      // ── Update character visual angle based on balance ────────
      updateCharacterVisuals(who: "player" | "ai") {
        const angle = who === "player" ? this.playerAngle : this.aiAngle;
        const container =
          who === "player" ? this.playerContainer : this.aiContainer;
        // Map angle (-100…100) to visual tilt degrees (-45…45)
        const visualAngle = (angle / 100) * 45 + this.poleWobble;
        container.setAngle(visualAngle);
      }

      // ── Balance meter update ──────────────────────────────────
      updateBalanceMeter(who: "player" | "ai") {
        const meterW = 70, meterH = 10;
        const angle = who === "player" ? this.playerAngle : this.aiAngle;
        const fill = who === "player" ? this.playerMeterFill : this.aiMeterFill;
        const cx =
          who === "player" ? this.playerContainer.x : this.aiContainer.x;
        const meterY = this.poleY - 90;

        const normalized = (angle + 100) / 200; // 0…1 (0.5 = center)
        const fillW = Math.abs(normalized - 0.5) * meterW;
        const fillX =
          normalized < 0.5
            ? cx - fillW // Changed from meterW/2 logic to center origin properly
            : cx;

        // Color: green near center → red at edges
        const danger = Math.abs(angle) / 100;
        const r = Math.round(46 + 196 * danger);
        const g2 = Math.round(196 - 196 * danger);
        const color = Phaser.Display.Color.GetColor(r, g2, 30);

        fill.clear();
        fill.fillStyle(color, 1);
        if (fillW > 0.5) {
          fill.fillRoundedRect(fillX, meterY, fillW, meterH, 3);
        }

        // Center marker
        fill.fillStyle(0x333333, 0.6);
        fill.fillRect(cx - 1, meterY, 2, meterH);
      }

      updateHypeMeter() {
        if (!this.hypeFill) return;
        const { width } = this.scale;
        const hypeW = 80;
        const hypeH = 8;
        const cx = width / 2;
        const cy = 115;

        this.hypeFill.clear();
        if (this.playerHype >= 100) {
          this.hypeFill.fillStyle(0x2ecc71, 1); // bright green
          this.hypeFill.fillRoundedRect(cx - hypeW / 2, cy, hypeW, hypeH, 4);
          // Flash effect done via update generally, but here it's static
        } else if (this.playerHype > 0) {
          this.hypeFill.fillStyle(0xf58220, 1); // orange
          this.hypeFill.fillRoundedRect(cx - hypeW / 2, cy, (this.playerHype / 100) * hypeW, hypeH, 4);
        }
      }

      updateChargeVisuals() {
        if (!this.chargeGfx) return;
        this.chargeGfx.clear();
        const cx = this.playerContainer.x;
        const cy = this.playerContainer.y - 70;
        const w = 40;
        this.chargeGfx.fillStyle(0x000000, 0.2);
        this.chargeGfx.fillRoundedRect(cx - w / 2, cy, w, 6, 2);

        this.chargeGfx.fillStyle(0xfcd116, 1);
        this.chargeGfx.fillRoundedRect(cx - w / 2, cy, w * this.chargeValue, 6, 2);
      }

      updateCrowd(time: number) {
        for (let i = 0; i < this.crowdMembers.length; i++) {
          const m = this.crowdMembers[i];
          // Base wobble
          const jumpOffset = Math.sin((time * 0.003) + m.offset) * 3;
          // Tremor jump (if impactTremor is high, they jump)
          const tremorJump = this.impactTremor > 5 ? -this.impactTremor * 0.8 : 0;
          m.gfx.y = m.baseY + jumpOffset + tremorJump;
        }
      }

      applyPoleWobble(_who: "player" | "ai") {
        // Wobble is factored into updateCharacterVisuals via poleWobble
      }

      // ── Round / match end logic ───────────────────────────────
      triggerFall(who: "player" | "ai") {
        if (this.trashTalkEvent) this.trashTalkEvent.remove();
        if (who === "player") {
          if (this.playerFallen) return;
          this.playerFallen = true;
        } else {
          if (this.aiFallen) return;
          this.aiFallen = true;
        }

        this.roundActive = false;
        if (this.roundTimerEvent) this.roundTimerEvent.remove();

        const container =
          who === "player" ? this.playerContainer : this.aiContainer;
        const fallDir = who === "player" ? -1 : 1;

        // Dramatic fall tween
        this.tweens.add({
          targets: container,
          angle: fallDir * 90,
          y: container.y + 120,
          alpha: 0,
          duration: 700,
          ease: "Power2",
          onComplete: () => {
            this.spawnDust(container.x, this.poleY + 80);
            this.floatText(
              container.x,
              this.poleY + 60,
              "💨 THUD!",
              "#8b4513",
              22
            );
            this.time.delayedCall(900, () => {
              this.endRound(who === "player" ? "ai" : "player");
            });
          },
        });

        this.cameras.main.shake(300, 0.012);
      }

      endRound(winner: "player" | "ai") {
        const { width, height } = this.scale;

        if (winner === "player") {
          this.playerWins++;
        } else {
          this.aiWins++;
        }

        this.updateWinsDisplay();

        const msg =
          winner === "player"
            ? "🎉 You Win the Round!"
            : "😅 AI-Opponent Wins the Round!";
        const color = winner === "player" ? "#2ecc71" : "#e74c3c";

        this.showOverlayMessage(msg, color, () => {
          // Check match end
          if (this.playerWins === 2 || this.aiWins === 2) {
            this.endMatch(this.playerWins === 2);
          } else {
            this.currentRound++;
            this.roundText.setText(`Round ${this.currentRound} of 3`);
            this.showRoundIntro();
          }
        });
      }

      endMatch(playerWon: boolean) {
        const { width, height } = this.scale;
        this.roundActive = false;

        // Dark overlay
        const overlay = this.add
          .rectangle(width / 2, height / 2, width, height, 0x0d0d0d, 0)
          .setDepth(50);
        this.tweens.add({ targets: overlay, fillAlpha: 0.92, duration: 500 });

        // Confetti if player won
        if (playerWon) {
          this.spawnConfetti();
          this.sound.play("won_sound", { volume: 0.8 });
        } else {
          // If in champion mode (John Cena) and AI wins, play John Cena sound
          if (this.isChampionMode) {
            this.sound.play("hjc_sound", { volume: 0.8 });
          } else {
            this.sound.play("boo_sound", { volume: 0.8 });
          }
        }

        const titleText = playerWon
          ? (this.isChampionMode ? "👑 You Defeated\nThe World Champion!" : "🏆 Kotta Pora\nChampion!")
          : "😢 Better luck\nnext time!";
        const titleColor = playerWon ? "#fcd116" : "#ff6b6b";

        const title = this.add
          .text(width / 2, height * 0.28, titleText, {
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: "36px",
            color: titleColor,
            stroke: "#000000",
            strokeThickness: 5,
            align: "center",
          })
          .setOrigin(0.5)
          .setDepth(51)
          .setScale(0);
        this.tweens.add({
          targets: title,
          scale: 1,
          duration: 600,
          ease: "Back.easeOut",
          delay: 300,
        });

        let score = 0;
        if (playerWon) {
          score = 8000;
        } else if (this.playerWins === 1) {
          score = 1000;
        }

        const subText = playerWon
          ? (this.isChampionMode 
              ? `Avurudu Legend! 🎊\n+300 Bonus Points!` 
              : `Subha Avurudu! 🎊\n+${score} Kreeda Points!`)
          : (this.playerWins === 1
              ? `You won 1 round!\n+${score} Kreeda Points!`
              : `No points this time!\nBetter luck next match!`);

        const sub = this.add
          .text(
            width / 2,
            height * 0.52,
            subText,
            {
              fontFamily: "system-ui, sans-serif",
              fontSize: "20px",
              color: "#ffffff",
              align: "center",
              lineSpacing: 6,
            }
          )
          .setOrigin(0.5)
          .setDepth(51)
          .setAlpha(0);
        this.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 700 });

        // Score badge
        const badgeColor = this.isChampionMode ? 0xcc0000 : 0xf58220;
        const displayScore = (this.isChampionMode && playerWon) ? 300 : score;
        const badge = this.add
          .rectangle(width / 2, height * 0.67, 200, 44, badgeColor, 1)
          .setOrigin(0.5)
          .setDepth(51)
          .setAlpha(0);
        const badgeText = this.add
          .text(width / 2, height * 0.67, `🏅 +${displayScore} KP`, {
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: "22px",
            color: "#ffffff",
          })
          .setOrigin(0.5)
          .setDepth(52)
          .setAlpha(0);
        this.tweens.add({
          targets: [badge, badgeText],
          alpha: 1,
          duration: 400,
          delay: 1000,
        });

        // After 4 seconds trigger game over
        this.time.delayedCall(4200, () => {
          this.tweens.add({
            targets: [overlay, title, sub, badge, badgeText],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              overlay.destroy();
              title.destroy();
              sub.destroy();
              badge.destroy();
              badgeText.destroy();

              if (playerWon && !this.isChampionMode) {
                this.showChampionChallenge(score);
              } else {
                let finalScore = score;
                if (this.isChampionMode && playerWon) finalScore += 300;
                // Even if lost champ mode, they won regular match initially. Passes true if effectively won match.
                const effectivelyWon = this.isChampionMode || playerWon;
                onMatchEnd(effectivelyWon, finalScore);
              }
            },
          });
        });
      }

      showChampionChallenge(prevScore: number) {
        if (this.cache.audio.exists("challenge")) {
           this.sound.play("challenge", { volume: 0.8 });
        }
        const { width, height } = this.scale;
        
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.8).setDepth(60);
        
        const btnBg = this.add.graphics().setDepth(61);
        btnBg.fillStyle(0xda291c, 1);
        const btnW = 280, btnH = 65;
        const btnX = width/2 - btnW/2;
        const btnY = height/2 - btnH/2 - 20;
        btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
        
        const btnText = this.add.text(width/2, btnY + btnH/2, "ACCEPT CHAMPION\nCHALLENGE", {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: "18px",
          color: "#ffffff",
          align: "center",
          stroke: "#000000",
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(62);
        
        // Skip for now button
        const skipText = this.add.text(width/2, height/2 + 50, "No thanks, claim points", {
           fontFamily: "system-ui, sans-serif",
           fontSize: "16px",
           color: "#cccccc",
           align: "center",
           fontStyle: "underline"
        }).setOrigin(0.5).setDepth(62).setInteractive();
        
        skipText.on('pointerdown', () => {
           onMatchEnd(true, prevScore);
        });

        // Interactive Area
        const btnArea = this.add.zone(width/2, btnY + btnH/2, btnW, btnH).setOrigin(0.5).setInteractive().setDepth(63);
        
        // Pulse effect
        this.tweens.add({
          targets: [btnBg, btnText],
          alpha: {from: 0.8, to: 1},
          scaleX: 1.05,
          scaleY: 1.05,
          yoyo: true,
          repeat: -1,
          duration: 600,
        });
        
        btnArea.once('pointerdown', () => {
          if (this.cache.audio.exists("accepted")) {
             this.sound.play("accepted", { volume: 0.8 });
          }
          this.tweens.killTweensOf([btnBg, btnText]);
          btnBg.destroy();
          btnText.destroy();
          skipText.destroy();
          btnArea.destroy();
          overlay.destroy(); // Fix: Destroy the dark background overlay!
          
          this.playCinematicEntrance();
        });
      }

      playCinematicEntrance() {
        const { width, height } = this.scale;
        
        if (this.cache.audio.exists("challenge_sound")) {
           this.sound.play("challenge_sound", { volume: 0.8 });
        }
        
        // Flash white
        const flash = this.add.rectangle(width/2, height/2, width, height, 0xffffff, 1).setDepth(70);
        this.tweens.add({ targets: flash, alpha: 0, duration: 800, onComplete: () => flash.destroy() });
        
        // Screen Shake
        this.cameras.main.shake(1500, 0.015);
        
        // Darkened bg
        const darkBg = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.75).setDepth(60);
        
        // WWE Entrance Text
        const nameText = this.add.text(width/2, height * 0.4, "Jhon\nCena", {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: "48px",
          color: "#cc0000",
          align: "center",
          stroke: "#ffffff",
          strokeThickness: 5,
          shadow: { offsetX: 0, offsetY: 0, color: '#cc0000', blur: 20, fill: true }
        }).setOrigin(0.5).setDepth(65).setScale(0);

        const subText = this.add.text(width/2, height * 0.6, "The Undisputed World Kottapora Champion", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "15px",
          color: "#fcd116",
          align: "center",
          fontStyle: "italic",
          stroke: "#000000",
          strokeThickness: 3,
        }).setOrigin(0.5).setDepth(65).setAlpha(0);

        this.tweens.add({
          targets: nameText,
          scale: 1,
          duration: 500,
          ease: "Back.easeOut",
        });

        this.tweens.add({
          targets: subText,
          alpha: 1,
          duration: 800,
          delay: 400,
        });

        // After cinematic, start the champion match
        this.time.delayedCall(4000, () => {
          this.tweens.add({
            targets: [nameText, subText, darkBg],
            alpha: 0,
            duration: 500,
            onComplete: () => {
               nameText.destroy();
               subText.destroy();
               darkBg.destroy();
               this.startChampionMode();
            }
          });
        });
      }

      startChampionMode() {
        this.isChampionMode = true;
        this.playerWins = 0;
        this.aiWins = 0;
        this.currentRound = 1;
        
        // Rebuild AI with Ranjan visuals
        if (this.aiContainer) this.aiContainer.destroy();
        const { width } = this.scale;
        
        this.aiContainer = this.add.container(width * 0.70, this.poleY);
        this.aiPillow = this.drawChampionCharacter(this.aiContainer);
        
        this.updateBalanceMeter("ai");
        this.updateWinsDisplay();
        
        this.aiFallen = false;
        this.playerFallen = false;
        
        this.showRoundIntro();
      }

      drawChampionCharacter(container: Phaser.GameObjects.Container): Phaser.GameObjects.Graphics {
        const g = this.add.graphics();
        const dir = -1;

        // Dhoti (lower body)
        g.fillStyle(0xcc0000, 1);
        g.fillRoundedRect(-16, -5, 32, 22, 4);

        // Body (shirt) - Muscular
        g.fillStyle(0x111111, 1);
        g.fillRoundedRect(-14, -38, 28, 38, 5);

        // Gold Champion Belt
        g.fillStyle(0xfcd116, 1);
        g.fillRoundedRect(-16, -10, 32, 8, 2);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, -6, 4);

        // Hand behind back
        g.fillStyle(0xdba15e, 1);
        g.fillCircle(-dir * 14, -22, 6);

        // Head (Bigger)
        g.fillStyle(0xdba15e, 1);
        g.fillCircle(0, -54, 16);

        // Angry Eyes
        g.fillStyle(0x000000, 1);
        g.lineStyle(2, 0x000000, 1);
        g.beginPath();
        g.moveTo(dir * 2 - 4, -62);
        g.lineTo(dir * 6 + 4, -58);
        g.strokePath();

        g.fillCircle(dir * 6, -56, 3);

        // Frown
        g.lineStyle(1.5, 0x000000, 1);
        g.beginPath();
        g.arc(dir * 2, -44, 4, Math.PI + 0.3, 2 * Math.PI - 0.3, false);
        g.strokePath();

        // Champion Headband
        g.fillStyle(0xcc0000, 1);
        g.fillRect(-8, -70, 16, 6);

        container.add(g);

        // Pillow arm (reuse normal style but positioned properly)
        const pillow = this.add.graphics();
        this.drawPillow(pillow, dir, 0); 
        container.add(pillow);

        return pillow;
      }

      showOverlayMessage(
        msg: string,
        color: string,
        onDone: () => void
      ) {
        const { width, height } = this.scale;
        const overlay = this.add
          .rectangle(width / 2, height / 2, width, height, 0x000000, 0)
          .setDepth(30);
        this.tweens.add({ targets: overlay, fillAlpha: 0.5, duration: 250 });

        const t = this.add
          .text(width / 2, height * 0.40, msg, {
            fontFamily: '"Arial Black", Impact, sans-serif',
            fontSize: "28px",
            color: "#ffffff",
            stroke: color,
            strokeThickness: 5,
            align: "center",
          })
          .setOrigin(0.5)
          .setDepth(31)
          .setScale(0);
        this.tweens.add({
          targets: t,
          scale: 1,
          duration: 400,
          ease: "Back.easeOut",
        });

        this.time.delayedCall(1800, () => {
          this.tweens.add({
            targets: [overlay, t],
            alpha: 0,
            duration: 350,
            onComplete: () => {
              overlay.destroy();
              t.destroy();
              onDone();
            },
          });
        });
      }

      updateWinsDisplay() {
        const stars = (n: number) =>
          "★".repeat(Math.max(0, n)) + "☆".repeat(Math.max(0, 2 - n));
        this.playerWinsText.setText(`😄 ${stars(this.playerWins)}`);
        this.aiWinsText.setText(`${stars(this.aiWins)} 🤖`);
      }

      // ──────────────────────────────────────────────────────────
      //  PARTICLES & EFFECTS
      // ──────────────────────────────────────────────────────────

      spawnTrail(x: number, y: number, color: number) {
        const g = this.add.graphics().setDepth(18);
        g.fillStyle(color, 0.55);
        g.fillCircle(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-8, 8), Phaser.Math.Between(3, 7));
        this.tweens.add({
          targets: g,
          alpha: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          duration: 280,
          onComplete: () => g.destroy(),
        });
      }

      spawnPOW(x: number, y: number) {
        const g = this.add.graphics().setDepth(20);
        g.fillStyle(0xfcd116, 1);
        g.lineStyle(2, 0xda291c, 1);
        g.beginPath();

        const pts = 10;
        for (let i = 0; i < pts * 2; i++) {
          const rad = (i * Math.PI) / pts;
          const dist = i % 2 === 0 ? 30 : 15;
          if (i === 0) g.moveTo(Math.cos(rad) * dist, Math.sin(rad) * dist);
          else g.lineTo(Math.cos(rad) * dist, Math.sin(rad) * dist);
        }
        g.closePath();
        g.fillPath();
        g.strokePath();

        g.x = x;
        g.y = y;
        g.setScale(0);

        const txt = this.add.text(x, y, "POW!", {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: "20px",
          color: "#da291c",
          stroke: "#ffffff",
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(21).setScale(0);

        this.tweens.add({
          targets: [g, txt],
          scale: 1,
          angle: Phaser.Math.Between(-15, 15),
          duration: 150,
          ease: "Back.easeOut",
          onComplete: () => {
            this.time.delayedCall(400, () => {
              this.tweens.add({
                targets: [g, txt],
                alpha: 0,
                scale: 1.5,
                duration: 250,
                onComplete: () => { g.destroy(); txt.destroy(); }
              });
            });
          }
        });
      }

      spawnHitSparks(x: number, y: number) {
        const colors = [0xfcd116, 0xf58220, 0xda291c, 0xffffff];
        for (let i = 0; i < 14; i++) {
          const g = this.add.graphics().setDepth(20);
          const c = colors[Phaser.Math.Between(0, colors.length - 1)];
          g.fillStyle(c, 1);
          g.fillCircle(0, 0, Phaser.Math.Between(2, 6));
          g.x = x;
          g.y = y;
          const angle = Phaser.Math.Between(0, 360) * (Math.PI / 180);
          const speed = Phaser.Math.Between(40, 110);
          this.tweens.add({
            targets: g,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            scaleX: 0.1,
            scaleY: 0.1,
            duration: Phaser.Math.Between(350, 600),
            ease: "Power2",
            onComplete: () => g.destroy(),
          });
        }
      }

      spawnDust(x: number, y: number) {
        for (let i = 0; i < 20; i++) {
          const g = this.add.graphics().setDepth(15);
          g.fillStyle(0xa0806060, 0.7);
          g.fillCircle(0, 0, Phaser.Math.Between(4, 12));
          g.x = x + Phaser.Math.Between(-30, 30);
          g.y = y;
          this.tweens.add({
            targets: g,
            x: g.x + Phaser.Math.Between(-50, 50),
            y: g.y - Phaser.Math.Between(10, 50),
            alpha: 0,
            scaleX: 2.5,
            scaleY: 2.5,
            duration: Phaser.Math.Between(600, 1000),
            ease: "Power1",
            onComplete: () => g.destroy(),
          });
        }
      }

      spawnConfetti() {
        const { width, height } = this.scale;
        const colors = [
          0xda291c, 0xfcd116, 0xf58220, 0x2ecc71, 0x3498db, 0xff69b4,
        ];
        for (let i = 0; i < 70; i++) {
          const g = this.add
            .rectangle(
              Phaser.Math.Between(width * 0.1, width * 0.9),
              Phaser.Math.Between(-40, 0),
              Phaser.Math.Between(5, 11),
              Phaser.Math.Between(8, 16),
              colors[Phaser.Math.Between(0, colors.length - 1)]
            )
            .setDepth(52);
          this.tweens.add({
            targets: g,
            y: height + 30,
            x: g.x + Phaser.Math.Between(-70, 70),
            angle: Phaser.Math.Between(-360, 360),
            duration: Phaser.Math.Between(1500, 2800),
            delay: Phaser.Math.Between(0, 700),
            ease: "Linear",
            onComplete: () => g.destroy(),
          });
        }
      }

      floatText(
        x: number,
        y: number,
        text: string,
        color: string,
        size: number = 16
      ) {
        const t = this.add
          .text(x, y, text, {
            fontSize: `${size}px`,
            fontFamily: '"Arial Black", Impact, sans-serif',
            color,
            stroke: "#000000",
            strokeThickness: 3,
          })
          .setOrigin(0.5)
          .setDepth(25);
        this.tweens.add({
          targets: t,
          y: y - 45,
          alpha: { from: 1, to: 0 },
          duration: 1100,
          ease: "Power1",
          onComplete: () => t.destroy(),
        });
      }
    }

    // ─────────────────────────────────────────────────────────────
    //  PHASER GAME INSTANCE
    // ─────────────────────────────────────────────────────────────
    const container = gameRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: w,
      height: h,
      backgroundColor: "#FFFFFF",
      scene: KottaPoraScene,
      parent: container,
      transparent: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: w,
        height: h,
      },
    };

    const phaserGame = new Phaser.Game(config);

    return () => {
      phaserGame.destroy(true);
    };
  }, []);

  return (
    <div
      ref={gameRef}
      className="w-full h-full"
      style={{ touchAction: "none" }}
    />
  );
}
