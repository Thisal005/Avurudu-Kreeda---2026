import { useEffect, useRef } from "react";
import Phaser from "phaser";

// Item configs with PNG image paths (served from /public)
const GOOD_ITEMS = [
  { label: "Kokis",    key: "kokis",    src: "/kavilis/kokis.png" },
  { label: "Kawum",    key: "kavum",    src: "/kavilis/kavum.png" },
  { label: "Thala",    key: "thala",    src: "/kavilis/thala.png" },
  { label: "Asmi",     key: "asmi",     src: "/kavilis/asmi.png" },
  { label: "Aluwa",    key: "aluwa",    src: "/kavilis/aluwa.png" },
];

const BONUS_ITEMS = [
  { label: "Ganudenu", key: "ganudenu", src: "/kavilis/ganudenu.png" },
  { label: "Bulath",   key: "bulath",   src: "/kavilis/bulath.png" },
];

const BAD_ITEMS = [
  { label: "Miris",  key: "miris", src: "/kavilis/miris.png" },
  { label: "Bomb",   key: "bomb",  src: "/kavilis/bomb.png" },
];

const ITEM_SIZE = 48;

interface CatchKaviliGameProps {
  onGameOver: (score: number) => void;
}

export default function CatchKaviliGame({ onGameOver }: CatchKaviliGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGame = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGame.current) return;

    class MainScene extends Phaser.Scene {
      private player!: Phaser.GameObjects.Rectangle;
      private basketGfx!: Phaser.GameObjects.Graphics;
      private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
      private score = 0;
      private scoreText!: Phaser.GameObjects.Text;
      private timerText!: Phaser.GameObjects.Text;
      private timeLeft = 90;
      private fallingItems: Phaser.GameObjects.GameObject[] = [];
      private gameTimer!: Phaser.Time.TimerEvent;
      private spawnTimer!: Phaser.Time.TimerEvent;
      private combo = 0;
      private comboText!: Phaser.GameObjects.Text;
      private comboTimer!: Phaser.Time.TimerEvent;
      private gameWidth = 0;
      private gameHeight = 0;

      constructor() {
        super("MainScene");
      }

      preload() {
        GOOD_ITEMS.forEach((it) => this.load.image(it.key, it.src));
        BONUS_ITEMS.forEach((it) => this.load.image(it.key, it.src));
        BAD_ITEMS.forEach((it) => this.load.image(it.key, it.src));

        // Load catch sounds
        this.load.audio("good_sound", "/kavilis/good.mp3");
        this.load.audio("bonus_sound", "/kavilis/bonus.mp3");
        this.load.audio("bad_sound", "/Dehi/bad.mp3");
        this.load.audio("win_sound", "/kavilis/win.mp3");
      }

      create() {
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        
        // ── Background ───────────────────────────────────────────
        this.cameras.main.setBackgroundColor("#FFFFFF");
        
        // Sky gradient
        const sky = this.add.graphics();
        sky.fillGradientStyle(0xfff7e6, 0xfff7e6, 0xffeedd, 0xffeedd, 1);
        sky.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Subtle pattern (dots)
        const pattern = this.add.graphics();
        pattern.fillStyle(0x000000, 0.03);
        for (let x = 0; x < this.gameWidth; x += 30) {
          for (let y = 0; y < this.gameHeight; y += 30) {
            pattern.fillCircle(x + (y % 60 ? 15 : 0), y, 2);
          }
        }

        // Ground decoration
        this.add.rectangle(this.gameWidth / 2, this.gameHeight - 30, this.gameWidth, 60, 0xa06040, 1);
        this.add.rectangle(this.gameWidth / 2, this.gameHeight - 57, this.gameWidth, 6, 0x8b5030, 1);

        // ── Player & Basket ──────────────────────────────────────
        // Invisible collision rect for basket
        this.player = this.add.rectangle(this.gameWidth / 2, this.gameHeight - 110, 76, 48, 0xffffff, 0);
        this.physics.add.existing(this.player, false);
        const pb = this.player.body as Phaser.Physics.Arcade.Body;
        pb.setCollideWorldBounds(true);

        // Basket graphics
        this.basketGfx = this.add.graphics();
        this.drawBasket(this.gameWidth / 2, this.gameHeight - 110);

        // ── UI ───────────────────────────────────────────────────
        this.buildUI();

        // Combo text
        this.comboText = this.add.text(this.gameWidth / 2, 160, "", {
          fontSize: "26px", 
          color: "#da291c", 
          fontStyle: "bold", 
          fontFamily: '"Arial Black", Impact, sans-serif',
          stroke: "#ffffff", 
          strokeThickness: 5
        }).setOrigin(0.5).setDepth(12).setAlpha(0);

        // ── Input ────────────────────────────────────────────────
        if (this.input.keyboard) {
          this.cursors = this.input.keyboard.createCursorKeys();
        }
        
        // Touch move
        this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
          if (pointer.isDown || pointer.wasTouch) {
            this.player.x = Phaser.Math.Clamp(pointer.x, 40, this.gameWidth - 40);
          }
        });

        // ── Timers ───────────────────────────────────────────────
        this.gameTimer = this.time.addEvent({ delay: 1000, callback: this.updateTimer, callbackScope: this, loop: true });
        this.spawnTimer = this.time.addEvent({ delay: 800, callback: this.spawnItem, callbackScope: this, loop: true });

        // Spawn first item immediately
        this.spawnItem();
      }

      buildUI() {
        const width = this.gameWidth;

        // === TOP HEADER STRIP ===
        this.add.rectangle(width / 2, 0, width, 52, 0xda291c, 0.95).setOrigin(0.5, 0).setDepth(20);
        this.add.text(width / 2, 26, "🍏 Catch the Kavilis!", {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: "18px",
          color: "#fcd116",
          stroke: "#7a0000",
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(21);

        // === SECOND ROW: info bar ===
        this.add.rectangle(width / 2, 52, width, 36, 0x000000, 0.07).setOrigin(0.5, 0).setDepth(20);

        // Left: Score
        this.scoreText = this.add.text(18, 70, "POINTS: 0", {
          fontSize: "14px",
          fontFamily: "system-ui, sans-serif",
          color: "#da291c",
          fontStyle: "bold",
        }).setOrigin(0, 0.5).setDepth(21);

        // Center: Timer Circle
        this.add.circle(width / 2, 70, 18, 0xffffff, 1).setStrokeStyle(3, 0xda291c).setDepth(21);
        this.timerText = this.add.text(width / 2, 70, "90", {
          fontSize: "18px",
          fontFamily: "system-ui, sans-serif",
          color: "#da291c",
          fontStyle: "bold",
        }).setOrigin(0.5).setDepth(21);

        // Right Label
        this.add.text(width - 18, 70, "COLLECT!", {
          fontSize: "14px",
          fontFamily: "system-ui, sans-serif",
          color: "#f58220",
          fontStyle: "bold",
        }).setOrigin(1, 0.5).setDepth(21);
      }

      drawBasket(cx: number, cy: number) {
        const g = this.basketGfx;
        g.clear();

        // Handle arc
        g.lineStyle(5, 0x7a4a1e, 1);
        g.beginPath();
        g.arc(cx, cy - 24, 22, Math.PI, 0, false);
        g.strokePath();
        g.fillStyle(0x6b3f18, 1);
        g.fillCircle(cx - 22, cy - 24, 4);
        g.fillCircle(cx + 22, cy - 24, 4);

        // Rim
        g.fillStyle(0x8b5e1a, 1);
        g.fillRoundedRect(cx - 42, cy - 26, 84, 10, 4);
        g.fillStyle(0xa67c52, 0.6);
        g.fillRect(cx - 38, cy - 25, 76, 3);

        // Body (trapezoid)
        const topW = 40, botW = 30, h = 38, topY = cy - 16;
        g.fillStyle(0xc97b2a, 1);
        g.fillPoints([
          new Phaser.Geom.Point(cx - topW, topY),
          new Phaser.Geom.Point(cx + topW, topY),
          new Phaser.Geom.Point(cx + botW, topY + h),
          new Phaser.Geom.Point(cx - botW, topY + h),
        ], true);

        // Bottom curve
        g.fillStyle(0xb06e24, 1);
        g.fillRoundedRect(cx - botW, topY + h - 6, botW * 2, 8, 4);

        // Weave horizontal
        g.lineStyle(1.5, 0xa06020, 0.55);
        for (let row = 0; row < 5; row++) {
          const ry = topY + 4 + row * 7;
          const frac = (ry - topY) / h;
          const wAtRow = topW - (topW - botW) * frac;
          g.lineBetween(cx - wAtRow + 2, ry, cx + wAtRow - 2, ry);
        }

        // Weave vertical
        g.lineStyle(1.5, 0x9a5a1a, 0.45);
        for (let col = -3; col <= 3; col++) {
          const topX = cx + col * (topW / 4);
          const botX = cx + col * (botW / 4);
          g.lineBetween(topX, topY + 2, botX, topY + h - 2);
        }

        // Shadow
        g.fillStyle(0x000000, 0.08);
        g.fillEllipse(cx, topY + h + 6, botW * 2 + 10, 8);
        g.setDepth(8);
      }

      update() {
        const speed = 450;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocityX(0);

        if (this.cursors?.left?.isDown || (this.input.keyboard && this.input.keyboard.addKey("A").isDown)) {
          body.setVelocityX(-speed);
        } else if (this.cursors?.right?.isDown || (this.input.keyboard && this.input.keyboard.addKey("D").isDown)) {
          body.setVelocityX(speed);
        }

        this.drawBasket(this.player.x, this.player.y);

        // Process falling items
        for (let i = this.fallingItems.length - 1; i >= 0; i--) {
          const item = this.fallingItems[i] as any;
          if (!item.active) { this.fallingItems.splice(i, 1); continue; }

          item.y += item.getData("speed") * (this.game.loop.delta / 1000);

          // Wobble
          const wobble = Math.sin(this.time.now / (item.getData("wobblePeriod") || 500)) * 12;
          item.setAngle(wobble);

          // Move label with item
          const labelText = item.getData("labelText") as Phaser.GameObjects.Text;
          if (labelText?.active) {
            labelText.x = item.x;
            labelText.y = item.y + ITEM_SIZE / 2 + 4;
          }

          // Catch check
          const dx = Math.abs(item.x - this.player.x);
          const dy = Math.abs(item.y - this.player.y);
          if (dx < 42 && dy < 30) { this.catchItem(item); continue; }

          // Off screen
          if (item.y > this.gameHeight + 50) {
            if (item.getData("type") === "GOOD" || item.getData("type") === "BONUS") this.resetCombo();
            if (labelText?.active) labelText.destroy();
            item.destroy();
            this.fallingItems.splice(i, 1);
          }
        }
      }

      spawnItem() {
        const x = Phaser.Math.Between(50, this.gameWidth - 50);
        const isHardMode = this.timeLeft <= 30;

        let type = "GOOD";
        const rand = Phaser.Math.Between(1, 100);
        if (isHardMode) {
          if (rand > 60) type = "BAD";
          else if (rand > 50) type = "BONUS";
        } else {
          if (rand > 85) type = "BAD";
          else if (rand > 75) type = "BONUS";
        }

        let textureKey = "";
        let label = "";
        let points = 0;
        const speedMult = isHardMode ? 1.6 : 1;
        let fallSpeed = Phaser.Math.Between(180, 320) * speedMult;

        if (type === "GOOD") {
          const idx = Phaser.Math.Between(0, GOOD_ITEMS.length - 1);
          textureKey = GOOD_ITEMS[idx].key;
          label = GOOD_ITEMS[idx].label;
          points = 10;
        } else if (type === "BONUS") {
          const idx = Phaser.Math.Between(0, BONUS_ITEMS.length - 1);
          textureKey = BONUS_ITEMS[idx].key;
          label = BONUS_ITEMS[idx].label;
          points = 50;
          fallSpeed = Phaser.Math.Between(250, 400) * speedMult;
        } else {
          const idx = Phaser.Math.Between(0, BAD_ITEMS.length - 1);
          textureKey = BAD_ITEMS[idx].key;
          label = BAD_ITEMS[idx].label;
          points = -20;
          fallSpeed = Phaser.Math.Between(150, 250) * speedMult;
        }

        // Create image sprite scaled to consistent size
        const item = this.add.image(x, -60, textureKey).setOrigin(0.5);
        const maxDim = Math.max(item.width, item.height);
        if (maxDim > 0) item.setScale(ITEM_SIZE / maxDim);
        item.setDepth(5);

        item.setData("points", points);
        item.setData("type", type);
        item.setData("label", label);
        item.setData("speed", fallSpeed);
        item.setData("wobblePeriod", Phaser.Math.Between(400, 900));

        // Label below item
        const txt = this.add.text(x, -30, label, {
          fontSize: "11px", color: "#5c2c16", fontFamily: "Arial, sans-serif", fontStyle: "bold",
        }).setOrigin(0.5).setDepth(6);
        item.setData("labelText", txt);

        this.fallingItems.push(item);
      }

      catchItem(item: any) {
        const type = item.getData("type") as string;
        const basePoints = item.getData("points") as number;
        const labelText = item.getData("labelText") as Phaser.GameObjects.Text;

        if (type === "GOOD" || type === "BONUS") {
          // Play correct sound
          if (type === "GOOD") this.sound.play("good_sound");
          else this.sound.play("bonus_sound");

          this.combo++;
          const multiplier = Math.min(this.combo, 5);
          const earned = basePoints * multiplier;
          this.score += earned;
          this.showFloatingText(item.x, item.y, `+${earned}`, "#2ecc71");

          if (this.combo > 1) {
            this.comboText.setText(`${this.combo}x COMBO!`);
            this.comboText.setAlpha(1);
            this.comboText.setScale(1.3);
            this.tweens.add({ targets: this.comboText, scale: 1, duration: 200, ease: "Back.easeOut" });
            if (this.comboTimer) this.comboTimer.remove();
            this.comboTimer = this.time.addEvent({
              delay: 2000,
              callback: () => this.tweens.add({ targets: this.comboText, alpha: 0, duration: 200 }),
            });
          }
          this.burstParticles(item.x, item.y, 0x2ecc71);
        } else {
          this.sound.play("bad_sound");
          this.score = Math.max(0, this.score + basePoints);
          this.resetCombo();
          this.cameras.main.shake(100, 0.008);
          this.showFloatingText(item.x, item.y, `${basePoints}`, "#da291c");
          this.burstParticles(item.x, item.y, 0xda291c);
        }

        this.scoreText.setText(`POINTS: ${this.score}`);
        if (labelText?.active) labelText.destroy();
        item.destroy();
        const idx = this.fallingItems.indexOf(item);
        if (idx > -1) this.fallingItems.splice(idx, 1);
      }

      burstParticles(x: number, y: number, color: number) {
        for (let i = 0; i < 8; i++) {
          const dot = this.add.circle(x, y, Phaser.Math.Between(3, 6), color, 0.9).setDepth(15);
          this.tweens.add({
            targets: dot,
            x: x + Phaser.Math.Between(-50, 50),
            y: y + Phaser.Math.Between(-50, 30),
            alpha: 0, scaleX: 0, scaleY: 0,
            duration: 350, ease: "Quad.easeOut",
            onComplete: () => dot.destroy(),
          });
        }
      }

      resetCombo() {
        this.combo = 0;
        if (this.comboText?.active) {
          this.tweens.add({ targets: this.comboText, alpha: 0, duration: 200 });
        }
      }

      showFloatingText(x: number, y: number, msg: string, color: string) {
        const txt = this.add.text(x, y - 20, msg, {
          fontSize: "28px", color, fontStyle: "bold", fontFamily: "Arial, sans-serif",
          stroke: "#ffffff", strokeThickness: 3
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
          targets: txt, y: y - 80, alpha: 0,
          duration: 700, ease: "Quad.easeOut",
          onComplete: () => txt.destroy()
        });
      }

      updateTimer() {
        this.timeLeft--;
        this.timerText.setText(this.timeLeft.toString());
        if (this.timeLeft <= 10) this.timerText.setColor("#ff0000");

        if (this.timeLeft <= 0) {
          this.gameTimer.remove();
          this.spawnTimer.remove();
          this.fallingItems.forEach((item: any) => item.setData("speed", 0));
          this.sound.play("win_sound");
          this.time.delayedCall(1500, () => { onGameOver(this.score); });
        }
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
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: MainScene,
      parent: container,
      transparent: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: w,
        height: h,
      },
    };

    phaserGame.current = new Phaser.Game(config);

    return () => {
      phaserGame.current?.destroy(true);
      phaserGame.current = null;
    };
  }, [onGameOver]);

  return (
    <div
      ref={gameRef}
      className="w-full h-full"
      style={{ touchAction: "none" }}
    />
  );
}

