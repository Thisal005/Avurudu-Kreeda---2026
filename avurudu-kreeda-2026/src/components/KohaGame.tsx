"use client";

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface KohaGameProps {
  onGameOver: (score: number) => void;
}

export default function KohaGame({ onGameOver }: KohaGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !gameRef.current) return;

    class ImposterGameScene extends Phaser.Scene {
      private timerText!: Phaser.GameObjects.Text;
      private roundText!: Phaser.GameObjects.Text;
      private pointsText!: Phaser.GameObjects.Text;
      private streakText!: Phaser.GameObjects.Text;
      private birds: Phaser.GameObjects.Image[] = [];
      private birdData: { isKoha: boolean; baseY: number; idleTween?: Phaser.Tweens.Tween; isSwapping?: boolean }[] = [];
      private sky!: Phaser.GameObjects.Graphics;
      private parallaxClouds: Phaser.GameObjects.Ellipse[] = [];
      private wireGraphics!: Phaser.GameObjects.Graphics;

      private currentRound = 1;
      private currentPoints = 0;
      private streak = 0;

      private roundTimer!: Phaser.Time.TimerEvent;
      private swapTimer?: Phaser.Time.TimerEvent;
      private expressionTimer?: Phaser.Time.TimerEvent;
      private timeLeft = 15;

      private isRoundActive = false;
      private kohaIndex = -1;
      private positions: { x: number; y: number }[] = [];
      
      private wireY = 0;
      private wireSag = 2;

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
        this.wireY = height * 0.62;

        this.cameras.main.setBackgroundColor('#FFFFFF');

        /* ── Sky gradient overlay ── */
        this.sky = this.add.graphics();
        
        // Clouds
        for(let i=0; i<6; i++) {
            const cloud = this.add.ellipse(Phaser.Math.Between(0, width), Phaser.Math.Between(height*0.05, height*0.45), Phaser.Math.Between(60, 140), Phaser.Math.Between(20, 40), 0xffffff, 0.6);
            this.parallaxClouds.push(cloud);
        }

        /* ── Ground strip ── */
        const ground = this.add.graphics();
        ground.fillStyle(0xf0ebe0);
        ground.fillRect(0, height * 0.85, width, height * 0.15);

        /* ── Wire & poles ── */
        const gfx = this.add.graphics();

        // Poles
        gfx.fillStyle(0x4a3728);
        gfx.fillRect(width * 0.06 - 6, this.wireY, 12, height - this.wireY);      // left
        gfx.fillRect(width * 0.94 - 6, this.wireY, 12, height - this.wireY);      // right
        // Insulator caps
        gfx.fillStyle(0x888888);
        gfx.fillCircle(width * 0.06, this.wireY, 9);
        gfx.fillCircle(width * 0.94, this.wireY, 9);
        
        // Interactive Wire
        this.wireGraphics = this.add.graphics();
        this.drawWire();

        // Wire hit area (taps on wire vibrate birds)
        const wireHitZone = this.add.zone(width / 2, this.wireY, width * 0.88, 50).setInteractive();
        wireHitZone.on('pointerdown', () => this.pluckWire());

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

        this.startRound();
      }

      updateSky() {
         const { width, height } = this.scale;
         this.sky.clear();
         if (this.currentRound <= 2) {
             // Morning blue
             this.sky.fillGradientStyle(0x87CEEB, 0x87CEEB, 0xe8f4ff, 0xe8f4ff, 1);
         } else if (this.currentRound <= 4) {
             // Golden hour
             this.sky.fillGradientStyle(0xFF7E5F, 0xFF7E5F, 0xFEB47B, 0xFEB47B, 1);
         } else {
             // Dusk
             this.sky.fillGradientStyle(0x2C3E50, 0x2C3E50, 0xFD746C, 0xFD746C, 1);
         }
         this.sky.fillRect(0, 0, width, height * 0.75);
         // Tint clouds based on time
         const cloudTint = this.currentRound <= 2 ? 0xffffff : (this.currentRound <= 4 ? 0xffddcc : 0xaa8899);
         this.parallaxClouds.forEach(c => c.setFillStyle(cloudTint, 0.6));
      }

      drawWire() {
         const { width } = this.scale;
         this.wireGraphics.clear();
         this.wireGraphics.lineStyle(3, 0x222222, 1);
         this.wireGraphics.beginPath();
         this.wireGraphics.moveTo(width * 0.06, this.wireY - 2);
         this.wireGraphics.lineTo(width / 2, this.wireY - 2 + this.wireSag);
         this.wireGraphics.lineTo(width * 0.94, this.wireY - 2);
         this.wireGraphics.strokePath();
         this.wireGraphics.lineStyle(1, 0x555555, 0.5);
         this.wireGraphics.beginPath();
         this.wireGraphics.moveTo(width * 0.06, this.wireY + 2);
         this.wireGraphics.lineTo(width / 2, this.wireY + 2 + this.wireSag);
         this.wireGraphics.lineTo(width * 0.94, this.wireY + 2);
         this.wireGraphics.strokePath();
      }

      pluckWire() {
         if (!this.isRoundActive) return;
         this.tweens.add({
             targets: this,
             wireSag: { from: 40, to: 2 },
             duration: 600,
             ease: 'Elastic.easeOut',
             onUpdate: () => {
                 this.drawWire();
                 this.birds.forEach((b, i) => {
                     if (!this.birdData[i].isSwapping) {
                         b.y = this.birdData[i].baseY + this.wireSag - 2 - Phaser.Math.Between(0, 3);
                     }
                 });
             }
         });
      }

      update(time: number, delta: number) {
         // Scroll clouds
         const { width } = this.scale;
         this.parallaxClouds.forEach(c => {
             c.x += 0.02 * delta;
             if (c.x > width + 100) c.x = -100;
         });
      }

      /* ─────────────────── ROUND LIFECYCLE ─────────────────── */

      startRound() {
        this.updateSky();
        this.isRoundActive = false;
        // dynamic difficulty
        const difficultyMap = [
            { birds: 5, time: 15 },
            { birds: 6, time: 14 },
            { birds: 7, time: 12 },
            { birds: 8, time: 11 },
            { birds: 9, time: 10 }
        ];
        const diff = difficultyMap[Math.min(this.currentRound - 1, 4)];
        this.timeLeft = diff.time;
        const totalBirds = diff.birds;

        this.timerText.setText(this.timeLeft.toString());
        this.timerText.setColor('#333333');
        this.roundText.setText(`Round ${this.currentRound} / 5`);

        // Destroy old birds (kill tweens first)
        this.birds.forEach(b => b.destroy());
        this.birds = [];
        this.birdData = [];

        this.positions = [];
        const { width } = this.scale;
        const usableWidth = width * 0.86;
        const spacing = usableWidth / (totalBirds - 1);
        const startX = width * 0.07;
        for (let i = 0; i < totalBirds; i++) {
          this.positions.push({ x: startX + i * spacing, y: this.wireY });
        }

        // Shuffle positions for this round
        Phaser.Utils.Array.Shuffle(this.positions);

        this.kohaIndex = Phaser.Math.Between(0, totalBirds - 1);

        for (let i = 0; i < totalBirds; i++) {
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
          
          if (this.currentRound > 1) {
             this.swapTimer = this.time.addEvent({
                 delay: 2600 - this.currentRound * 300,
                 callback: this.executeSwap,
                 callbackScope: this,
                 loop: true
             });
          }
          
          this.expressionTimer = this.time.addEvent({
             delay: 4500,
             callback: this.executeMicroExpression,
             callbackScope: this,
             loop: true
          });
        });
      }

      executeMicroExpression() {
         if (!this.isRoundActive || this.kohaIndex === -1) return;
         const kohaBird = this.birds[this.kohaIndex];
         if (this.birdData[this.kohaIndex]?.isSwapping) return;
         
         // Subtle tell: Quick red tint or scale jump
         this.tweens.add({
             targets: kohaBird,
             scaleX: kohaBird.scaleX * 1.15,
             scaleY: kohaBird.scaleY * 0.85,
             tint: 0xffaaaa,
             duration: 150,
             yoyo: true,
             onComplete: () => kohaBird.clearTint()
         });
      }

      executeSwap() {
         if (!this.isRoundActive) return;
         const available = this.birds.map((b, i) => i).filter(i => !this.birdData[i].isSwapping);
         if (available.length < 2) return;
         
         Phaser.Utils.Array.Shuffle(available);
         const i1 = available[0];
         const i2 = available[1];
         
         const b1 = this.birds[i1];
         const b2 = this.birds[i2];
         
         this.birdData[i1].isSwapping = true;
         this.birdData[i2].isSwapping = true;
         
         const targetX1 = b2.x;
         const targetX2 = b1.x;
         const targetBaseY1 = this.birdData[i2].baseY;
         const targetBaseY2 = this.birdData[i1].baseY;
         
         this.tweens.add({
             targets: b1,
             x: targetX1,
             y: b1.y - 65,
             duration: 380,
             yoyo: true,
             ease: 'Sine.easeOut',
             onComplete: () => { 
                b1.x = targetX1; 
                this.birdData[i1].isSwapping = false; 
                this.birdData[i1].baseY = targetBaseY1;
             }
         });
         this.tweens.add({
             targets: b2,
             x: targetX2,
             y: b2.y - 45, // lower arc
             duration: 380,
             yoyo: true,
             ease: 'Sine.easeOut',
             onComplete: () => { 
                b2.x = targetX2; 
                this.birdData[i2].isSwapping = false; 
                this.birdData[i2].baseY = targetBaseY2;
             }
         });
         
         // Logical array swap
         this.birds[i1] = b2;
         this.birds[i2] = b1;
         
         const d1 = this.birdData[i1];
         this.birdData[i1] = this.birdData[i2];
         this.birdData[i2] = d1;
         
         if (i1 === this.kohaIndex) this.kohaIndex = i2;
         else if (i2 === this.kohaIndex) this.kohaIndex = i1;
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
        if (this.swapTimer) this.swapTimer.remove();
        if (this.expressionTimer) this.expressionTimer.remove();

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
      backgroundColor: '#FFFFFF',
      scene: ImposterGameScene,
      parent: container,
      transparent: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: w,
        height: h,
      },
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, [onGameOver]);

  return (
    <div
      ref={gameRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
