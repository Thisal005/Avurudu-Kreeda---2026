"use client";

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

interface KohaGameProps {
  onGameOver: (score: number) => void;
}

export default function KohaGame({ onGameOver }: KohaGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !gameRef.current) return;

    class ImposterGameScene extends Phaser.Scene {
      private timerText!: Phaser.GameObjects.Text;
      private roundText!: Phaser.GameObjects.Text;
      private pointsText!: Phaser.GameObjects.Text;
      private streakText!: Phaser.GameObjects.Text;
      private birds: Phaser.GameObjects.Image[] = [];
      private birdData: { isKoha: boolean; baseY: number; idleTween?: Phaser.Tweens.Tween }[] = [];

      private currentRound = 1;
      private currentPoints = 0;
      private streak = 0;

      private roundTimer!: Phaser.Time.TimerEvent;
      private timeLeft = 15;

      private isRoundActive = false;
      private kohaIndex = -1;
      private positions: { x: number; y: number }[] = [];

      // Crow texture keys (randomized per slot)
      private readonly CROW_KEYS = ['crow1', 'crow2', 'crow3'];

      constructor() {
        super('ImposterGameScene');
      }

      preload() {
        // Crow variants (sitting birds)
        this.load.image('crow1', '/koha/one.png');
        this.load.image('crow2', '/koha/two.png');
        this.load.image('crow3', '/koha/three.png');
        // Reaction images
        this.load.image('crowFly', '/koha/crow.png');  // wrong click – flies
        this.load.image('kohaReveal', '/koha/real.png'); // correct click – reveal 4s
        this.load.image('kohaFly', '/koha/koha.png');   // correct click – flies away

        // Particle dot
        const g = this.add.graphics();
        g.fillStyle(0xffffff);
        g.fillCircle(4, 4, 4);
        g.generateTexture('dot', 8, 8);
        g.destroy();
      }

      create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#FFFFFF');

        /* ── Sky gradient overlay ── */
        const sky = this.add.graphics();
        sky.fillGradientStyle(0xe8f4ff, 0xe8f4ff, 0xffffff, 0xffffff, 1);
        sky.fillRect(0, 0, width, height * 0.75);

        /* ── Ground strip ── */
        const ground = this.add.graphics();
        ground.fillStyle(0xf0ebe0);
        ground.fillRect(0, height * 0.85, width, height * 0.15);

        /* ── Wire & poles ── */
        const wireY = height * 0.62;
        const gfx = this.add.graphics();

        // Poles
        gfx.fillStyle(0x4a3728);
        gfx.fillRect(width * 0.06 - 6, wireY, 12, height - wireY);      // left
        gfx.fillRect(width * 0.94 - 6, wireY, 12, height - wireY);      // right
        // Insulator caps
        gfx.fillStyle(0x888888);
        gfx.fillCircle(width * 0.06, wireY, 9);
        gfx.fillCircle(width * 0.94, wireY, 9);
        // Wire (two parallel lines for depth)
        gfx.lineStyle(3, 0x222222, 1);
        gfx.beginPath();
        gfx.moveTo(width * 0.06, wireY - 2);
        gfx.lineTo(width * 0.94, wireY - 2);
        gfx.strokePath();
        gfx.lineStyle(1, 0x555555, 0.5);
        gfx.beginPath();
        gfx.moveTo(width * 0.06, wireY + 2);
        gfx.lineTo(width * 0.94, wireY + 2);
        gfx.strokePath();

        /* ── UI: Clean 2-row header ── */

        // Row 1 – Title strip (full width pill)
        this.add.rectangle(width / 2, 20, width - 20, 36, 0xda291c, 0.92)
          .setOrigin(0.5, 0);
        this.add.text(width / 2, 38, '🐦  Find the Imposter Koha!', {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: '18px',
          color: '#fcd116',
          stroke: '#7a0000',
          strokeThickness: 2,
        }).setOrigin(0.5, 0.5);

        // Row 2 – Info bar background
        this.add.rectangle(width / 2, 66, width - 20, 34, 0x000000, 0.08)
          .setOrigin(0.5, 0);

        // Left: Round badge
        this.add.rectangle(72, 85, 120, 26, 0xfcd116, 1).setOrigin(0.5);
        this.roundText = this.add.text(72, 85, 'Round 1 / 5', {
          fontSize: '13px',
          fontFamily: 'system-ui, sans-serif',
          color: '#5a2d00',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        // Center: Timer circle
        this.add.circle(width / 2, 85, 22, 0xffffff, 1).setStrokeStyle(3, 0xda291c);
        this.timerText = this.add.text(width / 2, 85, '15', {
          fontSize: '22px',
          fontFamily: 'system-ui, sans-serif',
          color: '#da291c',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        // Right: Points
        this.pointsText = this.add.text(width - 16, 85, 'PTS: 0', {
          fontSize: '14px',
          fontFamily: 'system-ui, sans-serif',
          color: '#f58220',
          fontStyle: 'bold',
        }).setOrigin(1, 0.5);

        // Streak (below info bar, left-aligned, hidden until streak > 1)
        this.streakText = this.add.text(16, 106, '🔥 ×1', {
          fontSize: '13px',
          fontFamily: 'system-ui, sans-serif',
          color: '#da291c',
          fontStyle: 'bold',
        }).setOrigin(0, 0).setAlpha(0);

        /* ── Positions ── */
        const totalBirds = 8;
        const usableWidth = width * 0.86;
        const spacing = usableWidth / (totalBirds - 1);
        const startX = width * 0.07;
        for (let i = 0; i < totalBirds; i++) {
          this.positions.push({ x: startX + i * spacing, y: wireY });
        }

        this.startRound();
      }

      /* ─────────────────── ROUND LIFECYCLE ─────────────────── */

      startRound() {
        this.isRoundActive = false;
        this.timeLeft = 15;
        this.timerText.setText('15');
        this.timerText.setColor('#333333');
        this.roundText.setText(`Round ${this.currentRound} / 5`);

        // Destroy old birds (kill tweens first)
        this.birds.forEach(b => b.destroy());
        this.birds = [];
        this.birdData = [];

        // Shuffle positions for this round
        Phaser.Utils.Array.Shuffle(this.positions);

        this.kohaIndex = Phaser.Math.Between(0, 7);

        for (let i = 0; i < 8; i++) {
          const isKoha = i === this.kohaIndex;
          const pos = this.positions[i];

          // Pick texture: Koha uses one of the crow variants too (imposter!)
          // All birds look like crows – Koha is identified only when you get it right
          const texKey = this.CROW_KEYS[Phaser.Math.Between(0, 2)];
          const bird = this.add.image(pos.x, -120 - Math.random() * 80, texKey);

          // Scale to a reasonable size
          const targetW = 58 + Phaser.Math.Between(-4, 4);
          bird.setDisplaySize(targetW, targetW * (bird.height / bird.width));
          bird.setOrigin(0.5, 1);
          bird.setInteractive({ useHandCursor: true });

          // Fly-in with stagger
          const delay = i * 90;
          this.tweens.add({
            targets: bird,
            y: pos.y,
            duration: 650 + Math.random() * 200,
            ease: 'Back.easeOut',
            delay,
            onComplete: () => {
              this.birdData[i].baseY = pos.y;
              this.startIdleBob(bird, i);
            }
          });

          // Wing-flap scale pulse during fly-in
          this.tweens.add({
            targets: bird,
            scaleX: { from: bird.scaleX * 1.15, to: bird.scaleX },
            duration: 200,
            yoyo: true,
            repeat: 3,
            delay
          });

          // Hover
          bird.on('pointerover', () => {
            if (!this.isRoundActive) return;
            this.tweens.killTweensOf(bird);
            this.tweens.add({
              targets: bird,
              y: pos.y - 14,
              scaleX: bird.scaleX * 1.12,
              scaleY: bird.scaleY * 1.12,
              duration: 120,
              ease: 'Sine.easeOut'
            });
            if (isKoha && this.streak >= 2) {
              this.floatText(bird.x, pos.y - 70, 'Koo-oo~', '#cc0000');
            }
          });

          bird.on('pointerout', () => {
            if (!this.isRoundActive) return;
            this.tweens.killTweensOf(bird);
            bird.setScale(bird.scaleX / 1.12); // reset hover scale
            this.startIdleBob(bird, i);
          });

          bird.on('pointerdown', () => {
            if (!this.isRoundActive) return;
            this.handleBirdClick(isKoha, bird, i);
          });

          this.birds.push(bird);
          this.birdData.push({ isKoha, baseY: pos.y });
        }

        // Activate round after fly-in
        this.time.delayedCall(1100, () => {
          this.isRoundActive = true;
          this.roundTimer = this.time.addEvent({
            delay: 1000,
            callback: this.tickTimer,
            callbackScope: this,
            loop: true
          });
        });
      }

      startIdleBob(bird: Phaser.GameObjects.Image, index: number) {
        const baseY = this.birdData[index]?.baseY ?? bird.y;
        const t = this.tweens.add({
          targets: bird,
          y: baseY - Phaser.Math.Between(3, 7),
          duration: Phaser.Math.Between(500, 900),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: Phaser.Math.Between(0, 400)
        });
        if (this.birdData[index]) this.birdData[index].idleTween = t;
      }

      /* ─────────────────── TIMER ─────────────────── */
      tickTimer() {
        this.timeLeft--;
        this.timerText.setText(this.timeLeft.toString());

        if (this.timeLeft <= 5) {
          this.timerText.setColor('#cc0000');
          this.tweens.add({
            targets: this.timerText,
            scale: { from: 1.3, to: 1 },
            duration: 200,
            ease: 'Back.easeOut'
          });
        }

        if (this.timeLeft <= 0) {
          this.handleRoundEnd(false, null, -1);
        }
      }

      handleBirdClick(isKoha: boolean, bird: Phaser.GameObjects.Image, index: number) {
        this.handleRoundEnd(isKoha, bird, index);
      }

      /* ─────────────────── ROUND END ─────────────────── */
      handleRoundEnd(
        isWin: boolean,
        selectedBird: Phaser.GameObjects.Image | null,
        clickedIndex: number
      ) {
        this.isRoundActive = false;
        if (this.roundTimer) this.roundTimer.remove();

        const { width, height } = this.scale;

        if (isWin && selectedBird) {
          /* ═══ WIN FLOW ═══ */
          this.streak++;
          const roundPoints = 1000;
          this.currentPoints += roundPoints;
          this.pointsText.setText(`PTS: ${this.currentPoints}`);

          // Update streak badge
          this.streakText.setAlpha(1);
          this.streakText.setText(`🔥 ×${this.streak}`);
          this.tweens.add({ targets: this.streakText, scale: { from: 1.5, to: 1 }, duration: 300 });

          // Freeze all other birds
          this.birds.forEach((b, i) => {
            if (i !== clickedIndex) {
              this.tweens.killTweensOf(b);
              b.setAlpha(0.3);
            }
          });

          // 1) Bounce the selected bird up
          this.tweens.add({
            targets: selectedBird,
            y: selectedBird.y - 40,
            duration: 180,
            ease: 'Sine.easeOut',
            yoyo: true,
            onComplete: () => {
              // 2) Reveal "real.png" image in center for 4 seconds
              this.showRevealImage(selectedBird.x, selectedBird.y, roundPoints);
            }
          });

        } else {
          /* ═══ LOSE FLOW ═══ */
          this.streak = 0;
          this.streakText.setAlpha(0);
          // No points for wrong selection
          this.pointsText.setText(`PTS: ${this.currentPoints}`);
          // Disable remaining birds
          this.birds.forEach(b => {
            b.disableInteractive();
            this.tweens.killTweensOf(b);
          });

          // Scatter birds with crow.png flying  
          this.animateCrowFlyAway(selectedBird, clickedIndex);
        }

        // Advance round or game over
        const delay = isWin ? 5500 : 3800;
        this.time.delayedCall(delay, () => {
          if (this.currentRound >= 5) {
            this.showFinalFact();
          } else {
            this.currentRound++;
            this.timerText.setColor('#333333');
            this.startRound();
          }
        });
      }

      /* ─────────────────── FINAL FACT SCREEN ─────────────────── */
      showFinalFact() {
        const { width, height } = this.scale;
        const pts = this.currentPoints;

        // Full-screen dark overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d0d, 0)
          .setDepth(50);
        this.tweens.add({ targets: overlay, fillAlpha: 0.96, duration: 500 });

        // Confetti celebration first
        this.time.delayedCall(250, () => this.spawnConfetti());

        // Crow emoji header
        const crowEmoji = this.add.text(width / 2, height * 0.08, '🐦⬛💀', {
          fontSize: '48px',
        }).setOrigin(0.5).setDepth(51).setAlpha(0).setScale(0);
        this.tweens.add({
          targets: crowEmoji, alpha: 1, scale: 1,
          duration: 500, delay: 300, ease: 'Back.easeOut'
        });

        // Main twist line
        const twist = this.add.text(width / 2, height * 0.2, 'Plot twist:', {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: '30px',
          color: '#fcd116',
          stroke: '#000000',
          strokeThickness: 4,
        }).setOrigin(0.5).setDepth(51).setAlpha(0);
        this.tweens.add({ targets: twist, alpha: 1, duration: 400, delay: 550 });

        const scam = this.add.text(width / 2, height * 0.28, 'Crows are getting scammed.', {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: '22px',
          color: '#da291c',
          stroke: '#000000',
          strokeThickness: 3,
          align: 'center',
          wordWrap: { width: width * 0.85 },
        }).setOrigin(0.5).setDepth(51).setAlpha(0).setScale(0.8);
        this.tweens.add({ targets: scam, alpha: 1, scale: 1, duration: 450, delay: 750, ease: 'Back.easeOut' });

        // Divider line
        const divider = this.add.rectangle(width / 2, height * 0.36, width * 0.7, 2, 0xfcd116, 0.6)
          .setDepth(51).setAlpha(0);
        this.tweens.add({ targets: divider, alpha: 1, duration: 300, delay: 950 });

        // Body fact
        const bodyText = [
          'The Koha (Asian Koel) is nature\'s',
          'ultimate imposter — sneaking into',
          'crow nests and fooling them completely.',
        ].join('\n');
        const body = this.add.text(width / 2, height * 0.5, bodyText, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          color: '#e0e0e0',
          align: 'center',
          lineSpacing: 8,
          wordWrap: { width: width * 0.85 },
        }).setOrigin(0.5).setDepth(51).setAlpha(0);
        this.tweens.add({ targets: body, alpha: 1, duration: 500, delay: 1100 });

        // Divider 2
        const divider2 = this.add.rectangle(width / 2, height * 0.63, width * 0.7, 2, 0xfcd116, 0.6)
          .setDepth(51).setAlpha(0);
        this.tweens.add({ targets: divider2, alpha: 1, duration: 300, delay: 1350 });

        // Inspired-by line
        const inspired = this.add.text(width / 2, height * 0.69,
          'This game is inspired by that\nreal-life \'sus\' moment 👀', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          color: '#aaaaaa',
          align: 'center',
          lineSpacing: 5,
        }).setOrigin(0.5).setDepth(51).setAlpha(0);
        this.tweens.add({ targets: inspired, alpha: 1, duration: 400, delay: 1550 });

        // Challenge closing line
        const challenge = this.add.text(width / 2, height * 0.78,
          'Think you can catch the imposter\nfaster than a crow? 😏', {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: '17px',
          color: '#fcd116',
          stroke: '#000000',
          strokeThickness: 2,
          align: 'center',
          lineSpacing: 4,
        }).setOrigin(0.5).setDepth(51).setAlpha(0).setScale(0.8);
        this.tweens.add({ targets: challenge, alpha: 1, scale: 1, duration: 500, delay: 1800, ease: 'Back.easeOut' });

        // Score pill at bottom
        const scorePill = this.add.rectangle(width / 2, height * 0.9, 220, 40, 0xf58220, 1)
          .setOrigin(0.5).setDepth(51).setAlpha(0);
        const scoreLabel = this.add.text(width / 2, height * 0.9, `🏆  Final Score: ${pts} pts`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(52).setAlpha(0);
        this.tweens.add({ targets: [scorePill, scoreLabel], alpha: 1, duration: 400, delay: 2100 });

        // After 6 seconds, fade out and call onGameOver
        this.time.delayedCall(6200, () => {
          this.tweens.add({
            targets: [
              overlay, crowEmoji, twist, scam, divider, body,
              divider2, inspired, challenge, scorePill, scoreLabel
            ],
            alpha: 0,
            duration: 600,
            onComplete: () => onGameOver(pts)
          });
        });
      }

      /* ─────────────────── WIN ANIMATION ─────────────────── */
      showRevealImage(birdX: number, birdY: number, pts: number) {
        const { width, height } = this.scale;

        // Dark semi-transparent overlay
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
          .setDepth(10);
        this.tweens.add({ targets: overlay, fillAlpha: 0.55, duration: 300 });

        // Show real.png (the reveal)
        const reveal = this.add.image(width / 2, height / 2, 'kohaReveal')
          .setOrigin(0.5)
          .setDepth(11)
          .setAlpha(0)
          .setScale(0.3);

        this.tweens.add({
          targets: reveal,
          alpha: 1,
          scale: Math.min(width * 0.65 / reveal.width, height * 0.45 / reveal.height),
          duration: 400,
          ease: 'Back.easeOut'
        });

        // Label
        const label = this.add.text(width / 2, height * 0.25, '🎉 CAUGHT THE IMPOSTER!', {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: '24px',
          color: '#fcd116',
          stroke: '#da291c',
          strokeThickness: 5,
        }).setOrigin(0.5).setDepth(12).setAlpha(0);
        this.tweens.add({ targets: label, alpha: 1, y: height * 0.24, duration: 400, delay: 200 });

        const subLabel = this.add.text(width / 2, height * 0.79, `+${pts} pts   Subha Avurudu! 🪅`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(12).setAlpha(0);
        this.tweens.add({ targets: subLabel, alpha: 1, duration: 400, delay: 400 });

        // Confetti particles
        this.spawnConfetti();

        // After 2.5s hide reveal and launch koha.png flying
        this.time.delayedCall(2500, () => {
          this.tweens.add({
            targets: [reveal, label, subLabel, overlay],
            alpha: 0,
            duration: 400,
            onComplete: () => {
              reveal.destroy();
              label.destroy();
              subLabel.destroy();
              overlay.destroy();
              this.animateKohaFlyAway(birdX, birdY);
            }
          });
        });

        // Fact card
        this.time.delayedCall(1000, () => {
          this.showFactCard();
        });
      }

      animateKohaFlyAway(startX: number, startY: number) {
        const { width } = this.scale;
        const koha = this.add.image(startX, startY, 'kohaFly')
          .setOrigin(0.5, 1)
          .setScale(0.18)
          .setDepth(15);

        // Arc flight upward-right
        const targetX = width * 0.85;
        const targetY = -120;
        const midX = (startX + targetX) / 2;
        const midY = startY - 200;

        this.tweens.add({
          targets: koha,
          x: targetX,
          y: targetY,
          scale: 0.28,
          duration: 1200,
          ease: 'Sine.easeIn',
          onUpdate: (tween) => {
            // Arc using quadratic bezier approximation via time progress
            const t = tween.progress;
            const bx = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * targetX;
            const by = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * targetY;
            koha.x = bx;
            koha.y = by;
            // Wing-flap via scaleX oscillation
            koha.scaleX = 0.18 + 0.08 * Math.sin(t * Math.PI * 8);
            // Rotate to follow path
            const angle = Math.atan2(by - koha.y, bx - koha.x) * 180 / Math.PI;
            koha.setAngle(-20 + t * -15);
          },
          onComplete: () => {
            this.spawnFeathers(targetX, 0);
            koha.destroy();
          }
        });
      }

      /* ─────────────────── LOSE ANIMATION ─────────────────── */
      animateCrowFlyAway(
        wrongBird: Phaser.GameObjects.Image | null,
        wrongIndex: number
      ) {
        const { width, height } = this.scale;

        // Shake screen
        this.cameras.main.shake(400, 0.012);

        // Red flash overlay
        const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xdd0000, 0)
          .setDepth(20);
        this.tweens.add({
          targets: flash,
          fillAlpha: 0.28,
          duration: 150,
          yoyo: true,
          repeat: 1,
          onComplete: () => flash.destroy()
        });

        // Show "crow.png" bursting out of the wrongly-clicked bird
        const startX = wrongBird ? wrongBird.x : width / 2;
        const startY = wrongBird ? wrongBird.y - 30 : height * 0.55;

        const crow = this.add.image(startX, startY, 'crowFly')
          .setOrigin(0.5, 1)
          .setScale(0.05)
          .setDepth(25)
          .setAlpha(0);

        // Burst in
        this.tweens.add({
          targets: crow,
          alpha: 1,
          scale: 0.22,
          duration: 250,
          ease: 'Back.easeOut',
          onComplete: () => {
            // Fly chaotically – zigzag upward
            let toggleDir = 1;
            const totalSteps = 6;
            let step = 0;
            const flyStep = () => {
              if (step >= totalSteps) {
                crow.destroy();
                return;
              }
              toggleDir *= -1;
              this.tweens.add({
                targets: crow,
                x: crow.x + toggleDir * Phaser.Math.Between(40, 80),
                y: crow.y - Phaser.Math.Between(40, 70),
                scaleX: crow.scaleX * (toggleDir > 0 ? 1 : -1) * 0.96, // flip
                duration: 180,
                ease: 'Sine.easeInOut',
                onComplete: () => { step++; flyStep(); }
              });
            };
            flyStep();
          }
        });

        // Scatter remaining birds
        this.birds.forEach((b, i) => {
          this.tweens.killTweensOf(b);
          const dirX = b.x < width / 2 ? -1 : 1;
          this.tweens.add({
            targets: b,
            x: b.x + dirX * Phaser.Math.Between(160, 320),
            y: b.y - Phaser.Math.Between(80, 200),
            angle: dirX * Phaser.Math.Between(30, 80),
            alpha: 0,
            duration: 550 + Math.random() * 250,
            ease: 'Power2',
            delay: Math.random() * 150
          });
        });

        // Message
        this.showPopup('Missed! 😱\nThe Koha is still hiding…', '#da291c');
      }

      /* ─────────────────── HELPERS ─────────────────── */

      showPopup(message: string, shadowColor: string) {
        const { width, height } = this.scale;
        const bg = this.add.rectangle(width / 2, height * 0.35, width * 0.85, 110, 0x1a1a1a, 0.88)
          .setOrigin(0.5).setDepth(30);
        const popup = this.add.text(width / 2, height * 0.35, message, {
          fontFamily: '"Arial Black", Impact, sans-serif',
          fontSize: '26px',
          color: '#ffffff',
          stroke: shadowColor,
          strokeThickness: 5,
          align: 'center',
          shadow: { blur: 12, fill: true, color: shadowColor }
        }).setOrigin(0.5).setDepth(31).setScale(0);

        this.tweens.add({
          targets: popup,
          scale: 1,
          duration: 450,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.time.delayedCall(2200, () => {
              this.tweens.add({
                targets: [popup, bg],
                alpha: 0,
                duration: 300,
                onComplete: () => { popup.destroy(); bg.destroy(); }
              });
            });
          }
        });
      }

      showFactCard() {
        const { width, height } = this.scale;
        const card = this.add.rectangle(width / 2, height * 0.88, width * 0.88, 68, 0xffffee, 0.96)
          .setOrigin(0.5).setDepth(30).setStrokeStyle(2, 0xf58220);
        const fact = this.add.text(width / 2, height * 0.88,
          '🪶 The female Koha sneaks her egg\ninto a crow\'s nest while the male distracts!',
          {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            color: '#333333',
            align: 'center',
          }).setOrigin(0.5).setDepth(31).setAlpha(0);

        this.tweens.add({ targets: [card, fact], alpha: 1, duration: 300, delay: 200 });
        this.time.delayedCall(3000, () => {
          this.tweens.add({
            targets: [card, fact], alpha: 0, duration: 300,
            onComplete: () => { card.destroy(); fact.destroy(); }
          });
        });
      }

      spawnConfetti() {
        const { width, height } = this.scale;
        const colors = [0xda291c, 0xfcd116, 0xf58220, 0x2ecc71, 0x3498db, 0xff69b4];
        for (let i = 0; i < 60; i++) {
          const c = this.add.rectangle(
            Phaser.Math.Between(width * 0.1, width * 0.9),
            Phaser.Math.Between(-30, 0),
            Phaser.Math.Between(5, 10),
            Phaser.Math.Between(8, 14),
            colors[Phaser.Math.Between(0, colors.length - 1)]
          ).setDepth(13);
          this.tweens.add({
            targets: c,
            y: height + 20,
            x: c.x + Phaser.Math.Between(-60, 60),
            angle: Phaser.Math.Between(-360, 360),
            duration: Phaser.Math.Between(1400, 2600),
            delay: Phaser.Math.Between(0, 600),
            ease: 'Linear',
            onComplete: () => c.destroy()
          });
        }
      }

      spawnFeathers(x: number, y: number) {
        const colors = [0xfcd116, 0xf58220, 0xda291c];
        for (let i = 0; i < 20; i++) {
          const f = this.add.ellipse(
            x + Phaser.Math.Between(-30, 30),
            y + Phaser.Math.Between(0, 40),
            5, 14,
            colors[Phaser.Math.Between(0, 2)]
          ).setDepth(16);
          this.tweens.add({
            targets: f,
            x: f.x + Phaser.Math.Between(-80, 80),
            y: f.y + Phaser.Math.Between(80, 200),
            angle: Phaser.Math.Between(-180, 180),
            alpha: 0,
            duration: Phaser.Math.Between(700, 1400),
            ease: 'Power2',
            onComplete: () => f.destroy()
          });
        }
      }

      floatText(x: number, y: number, text: string, color: string) {
        const t = this.add.text(x, y, text, {
          fontSize: '18px',
          fontFamily: 'system-ui, sans-serif',
          color,
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({
          targets: t,
          y: y - 35,
          alpha: { from: 1, to: 0 },
          duration: 900,
          ease: 'Power1',
          onComplete: () => t.destroy()
        });
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 600,
      height: 800,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      backgroundColor: '#FFFFFF',
      scene: ImposterGameScene,
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      }
    };

    const game = new Phaser.Game(config);
    setIsReady(true);

    return () => {
      game.destroy(true);
    };
  }, [onGameOver]);

  return (
    <div className="w-full h-full relative" style={{ minHeight: '400px' }}>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-3xl">
          <p className="font-bold text-xl text-avurudu-dark animate-pulse">Initializing Game...</p>
        </div>
      )}
      <div
        ref={gameRef}
        className="w-full h-full rounded-3xl overflow-hidden"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
