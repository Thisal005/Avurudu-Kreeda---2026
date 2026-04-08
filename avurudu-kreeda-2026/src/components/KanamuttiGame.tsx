"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";

// result: 'win' = treasure pot, 'bonus' = bonus pot (500 flat), 'miss' = wrong pot
interface KanamuttiGameProps {
  onGameOver: (result: 'win' | 'bonus' | 'miss') => void;
}

export default function KanamuttiGame({ onGameOver }: KanamuttiGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGame = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGame.current) return;

    class MainScene extends Phaser.Scene {
      private gameWidth = 0;
      private gameHeight = 0;
      private pots: Phaser.GameObjects.Image[] = [];
      private winningPotIndex = 0;
      private bonusPotIndex = 1;
      private isSpinning = false;
      private isGameOver = false;

      constructor() {
        super("MainScene");
      }

      preload() {
        this.load.image('muttiya', '/Kanamutti/muttiya.png');
        this.load.audio('winnerSound', '/Kanamutti/winner.mp3');
        this.load.audio('metalSound', '/Kanamutti/metal.mp3');
        this.load.audio('bonkSound', '/Kanamutti/bonk.mp3');
        this.load.audio('ewwwSound', '/Kanamutti/ewww.mp3');
      }

      create() {
        this.gameWidth = this.scale.width;
        this.gameHeight = this.scale.height;
        this.cameras.main.setBackgroundColor("#0a0a0a"); // Black background

        // Dramatic lighting effect placeholder (a subtle gradient or overlay)
        const bgVisual = this.add.rectangle(this.gameWidth / 2, this.gameHeight / 2, this.gameWidth, this.gameHeight, 0x1f1f1f);
        bgVisual.setAlpha(0.3);

        this.startNewRound();
      }

      startNewRound() {
        this.isGameOver = false;
        
        // Pick new winner and bonus (must be different)
        this.winningPotIndex = Phaser.Math.Between(0, 6);
        do {
          this.bonusPotIndex = Phaser.Math.Between(0, 6);
        } while (this.bonusPotIndex === this.winningPotIndex);
        
        // Remove old pots if they exist
        this.pots.forEach(p => p.destroy());
        this.pots = [];

        this.drawPots();

        // Dramatic blindfold spin
        this.playSpinAnimation();
      }

      drawPots() {
        const totalPots = 7;
        const isMobile = this.gameWidth <= 500;

        if (isMobile) {
          // Two-row layout on mobile: row1 = 4 pots, row2 = 3 pots
          const row1Count = 4;
          const row2Count = 3;
          const maxPotArea = (this.gameWidth - 20) / row1Count;
          const potSize = Math.min(72, maxPotArea * 0.72);
          const spacing1 = (this.gameWidth - 20) / row1Count;
          const spacing2 = (this.gameWidth - 20) / row2Count;

          const row1Y = this.gameHeight * 0.30;
          const row2Y = this.gameHeight * 0.58;

          const row1StartX = this.gameWidth / 2 - (spacing1 * (row1Count - 1)) / 2;
          const row2StartX = this.gameWidth / 2 - (spacing2 * (row2Count - 1)) / 2;

          // Rope for row 1
          const string1Y = row1Y - potSize * 0.55;
          this.add.rectangle(this.gameWidth / 2, string1Y, this.gameWidth * 0.9, 5, 0x5c4033).setDepth(-1);
          // Rope for row 2
          const string2Y = row2Y - potSize * 0.55;
          this.add.rectangle(this.gameWidth / 2, string2Y, this.gameWidth * 0.75, 5, 0x5c4033).setDepth(-1);

          const addPot = (i: number, x: number, y: number, stringY: number) => {
            const tempPot = this.add.image(0, 0, 'muttiya');
            const scale = potSize / Math.max(tempPot.width, tempPot.height);
            tempPot.destroy();

            const pot = this.add.image(x, y, 'muttiya');
            pot.setScale(scale);
            pot.setInteractive({ useHandCursor: true });
            pot.setData("index", i);
            pot.setData("originalX", x);

            pot.on('pointerover', () => pot.setScale(scale * 1.12));
            pot.on('pointerout', () => pot.setScale(scale));
            pot.on('pointerdown', () => {
              if (this.isSpinning || this.isGameOver) return;
              this.handlePotClick(pot, i);
            });

            this.tweens.add({
              targets: pot,
              x: x + Phaser.Math.Between(-3, 3),
              y: y + Phaser.Math.Between(-3, 3),
              duration: Phaser.Math.Between(1500, 2500),
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });

            // String drop
            this.add.rectangle(x, stringY + 3, 2, Math.abs(y - stringY) - potSize * 0.4, 0xe1c699).setDepth(-1);

            this.pots.push(pot);
          };

          for (let i = 0; i < row1Count; i++) {
            addPot(i, row1StartX + i * spacing1, row1Y, string1Y);
          }
          for (let i = 0; i < row2Count; i++) {
            addPot(row1Count + i, row2StartX + i * spacing2, row2Y, string2Y);
          }
        } else {
          // Single-row layout for desktop/tablet
          const potSize = Math.min(110, (this.gameWidth - 60) / (totalPots * 1.2));
          const spacing = Math.min(130, (this.gameWidth - 40) / totalPots);
          const startX = this.gameWidth / 2 - (spacing * (totalPots - 1)) / 2;

          for (let i = 0; i < totalPots; i++) {
            const x = startX + (i * spacing);
            const y = this.gameHeight * 0.42;

            const pot = this.add.image(x, y, 'muttiya');
            const scale = potSize / Math.max(pot.width, pot.height);
            pot.setScale(scale);
            pot.setInteractive({ useHandCursor: true });
            pot.setData("index", i);
            pot.setData("originalX", x);

            pot.on('pointerover', () => pot.setScale(scale * 1.15));
            pot.on('pointerout', () => pot.setScale(scale));
            pot.on('pointerdown', () => {
              if (this.isSpinning || this.isGameOver) return;
              this.handlePotClick(pot, i);
            });

            this.tweens.add({
              targets: pot,
              x: x + Phaser.Math.Between(-4, 4),
              y: y + Phaser.Math.Between(-4, 4),
              duration: Phaser.Math.Between(1500, 2500),
              yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });

            this.pots.push(pot);
          }

          // Draw rope
          const stringY = this.gameHeight * 0.42 - 55;
          this.add.rectangle(this.gameWidth / 2, stringY - 10, this.gameWidth * 0.9, 8, 0x5c4033).setDepth(-1);

          this.pots.forEach(pot => {
            this.add.rectangle(pot.x, stringY + 5, 2, 35, 0xe1c699).setDepth(-1);
          });
        }
      }

      playSpinAnimation() {
        this.isSpinning = true;
        const isMobile = this.gameWidth <= 500;
        const blindfoldFontSize = isMobile ? '18px' : '28px';

        // Spin the camera
        this.tweens.add({
          targets: this.cameras.main,
          angle: 1080,
          duration: 3000,
          ease: 'Cubic.easeInOut',
          onComplete: () => {
             (this.cameras.main as any).setAngle(0);
          }
        });

        // Red blindfold cloth slides in from both sides
        const clothHalf = this.gameWidth / 2 + 40;
        const clothHeight = this.gameHeight * 0.4;
        const clothY = this.gameHeight / 2;

        const clothLeft = this.add.rectangle(
          -clothHalf, clothY, clothHalf, clothHeight, 0xcc1111
        ).setDepth(50).setAlpha(0.92);

        for (let i = 0; i < 6; i++) {
          const lineY = clothY - clothHeight/2 + (i * clothHeight/6) + clothHeight/12;
          const line = this.add.rectangle(-clothHalf, lineY, clothHalf, 2, 0xaa0000, 0.4).setDepth(51);
          this.tweens.add({ targets: line, x: this.gameWidth / 4, duration: 800, ease: 'Power2', delay: 200 });
          this.time.delayedCall(3500, () => {
            this.tweens.add({ targets: line, x: -clothHalf, duration: 600, ease: 'Power2', onComplete: () => line.destroy() });
          });
        }

        const clothRight = this.add.rectangle(
          this.gameWidth + clothHalf, clothY, clothHalf, clothHeight, 0xcc1111
        ).setDepth(50).setAlpha(0.92);

        this.tweens.add({ targets: clothLeft, x: this.gameWidth / 4, duration: 800, ease: 'Power2', delay: 200 });
        this.tweens.add({ targets: clothRight, x: this.gameWidth * 3 / 4, duration: 800, ease: 'Power2', delay: 200 });

        const blindfoldText = this.add.text(this.gameWidth / 2, clothY, '👁️ Blindfolded!', {
          fontSize: blindfoldFontSize,
          color: '#ffd700',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5).setDepth(52).setAlpha(0);

        this.time.delayedCall(1000, () => {
          this.tweens.add({ targets: blindfoldText, alpha: 1, duration: 300 });
        });

        this.time.delayedCall(3500, () => {
          this.tweens.add({ targets: blindfoldText, alpha: 0, duration: 200, onComplete: () => blindfoldText.destroy() });
          this.tweens.add({
            targets: clothLeft, x: -clothHalf, duration: 600, ease: 'Power2', onComplete: () => clothLeft.destroy()
          });
          this.tweens.add({
            targets: clothRight, x: this.gameWidth + clothHalf, duration: 600, ease: 'Power2', onComplete: () => clothRight.destroy()
          });
        });

        this.time.delayedCall(1500, () => {
           this.cameras.main.fade(1500, 0, 0, 0, false, (camera: any, progress: number) => {
             if (progress === 1) {
                this.time.delayedCall(500, () => {
                  this.cameras.main.fadeIn(1000, 0, 0, 0, (cam: any, innerProgress: number) => {
                    if (innerProgress === 1) {
                      this.isSpinning = false;
                    }
                  });
                });
             }
           });
        });
      }

      handlePotClick(pot: Phaser.GameObjects.Image, index: number) {
        this.isGameOver = true;
        const isWin = index === this.winningPotIndex;
        const isBonus = index === this.bonusPotIndex;

        // Stick starts from bottom of screen, swings to pot
        const stickLength = Math.min(200, this.gameHeight * 0.28);
        const stick = this.add.rectangle(pot.x, this.gameHeight + stickLength, 12, stickLength, 0x8b5a2b);
        stick.setOrigin(0.5, 1);
        stick.setAngle(pot.x < this.gameWidth / 2 ? -50 : 50);

        this.tweens.add({
          targets: stick,
          x: pot.x,
          y: pot.y + 30,
          angle: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            this.createHitImpact(pot.x, pot.y);
            this.sound.play('bonkSound', { volume: 1.0 });

            // Delay outcome sound so it plays after bonk finishes (~400ms)
            this.time.delayedCall(400, () => {
              if (isWin) {
                this.playWinEffect(pot);
              } else if (isBonus) {
                this.playBonusEffect(pot);
              } else {
                this.playMissEffect(pot);
              }
            });

            this.tweens.add({
              targets: stick,
              y: this.gameHeight + stickLength + 100,
              angle: stick.angle + 45,
              duration: 500,
              ease: 'Power2',
              onComplete: () => stick.destroy()
            });
          }
        });
      }

      createHitImpact(x: number, y: number) {
        // Flash effect
        const flash = this.add.circle(x, y, 60, 0xffffff, 0.8);
        this.tweens.add({
          targets: flash,
          scale: 1.5,
          alpha: 0,
          duration: 200,
          onComplete: () => flash.destroy()
        });
      }

      playWinEffect(pot: Phaser.GameObjects.Image) {
        this.sound.play('winnerSound', { volume: 0.8 }); // plays after bonk
        
        const x = pot.x;
        const y = pot.y;

        // Hide original pot
        pot.setVisible(false);

        // Pot breaks (shards flying)
        for (let i = 0; i < 15; i++) {
          const shard = this.add.circle(x, y, Phaser.Math.Between(5, 12), 0xb85d19);
          this.physics.add.existing(shard);
          const body = shard.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(Phaser.Math.Between(-300, 300), Phaser.Math.Between(-400, -100));
          body.setGravityY(800);
          
          this.tweens.add({
            targets: shard,
            alpha: 0,
            duration: 1500,
            delay: 500,
            onComplete: () => shard.destroy()
          });
        }

        // Coins popping out
        for (let i = 0; i < 10; i++) {
          const coin = this.add.circle(x, y, 8, 0xffd700);
          this.physics.add.existing(coin);
          const body = coin.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-500, -200));
          body.setGravityY(600);
          
          this.tweens.add({
             targets: coin,
             y: this.gameHeight + 50,
             duration: 1500,
             onComplete: () => coin.destroy()
          });
        }

        // Giant Winner Text — responsive font size
        const isMobileW = this.gameWidth <= 500;
        const winFontSize = isMobileW ? '36px' : '56px';
        const winTextY = isMobileW ? this.gameHeight * 0.78 : this.gameHeight * 0.65;

        const winText = this.add.text(this.gameWidth / 2, winTextY, "WINNER!", {
          fontSize: winFontSize,
          color: "#ffd700",
          fontFamily: "Arial, sans-serif",
          fontStyle: "bold",
          stroke: "#da291c",
          strokeThickness: isMobileW ? 5 : 8
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);

        this.tweens.add({
          targets: winText,
          alpha: 1,
          scale: 1,
          duration: 500,
          ease: 'Back.easeOut'
        });

        // Massive Confetti Explosion
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff8800];
        for (let i = 0; i < 80; i++) {
          const color = colors[Phaser.Math.Between(0, colors.length - 1)];
          const confetti = this.add.rectangle(this.gameWidth / 2, this.gameHeight, 8, 8, color);
          this.physics.add.existing(confetti);
          const body = confetti.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(Phaser.Math.Between(-400, 400), Phaser.Math.Between(-800, -300));
          body.setGravityY(400);
          body.setAngularVelocity(Phaser.Math.Between(-400, 400));

          this.tweens.add({
             targets: confetti,
             alpha: 0,
             duration: 2000,
             delay: 1000,
             onComplete: () => confetti.destroy()
          });
        }

        this.time.delayedCall(2500, () => onGameOver('win'));
      }

      playBonusEffect(pot: Phaser.GameObjects.Image) {
        this.sound.play('metalSound', { volume: 0.8 }); // plays after bonk

        const x = pot.x;
        const y = pot.y;
        pot.setVisible(false);

        // Silver shards
        for (let i = 0; i < 10; i++) {
          const shard = this.add.circle(x, y, Phaser.Math.Between(4, 10), 0xc0c0c0);
          this.physics.add.existing(shard);
          const body = shard.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(Phaser.Math.Between(-250, 250), Phaser.Math.Between(-350, -80));
          body.setGravityY(700);
          this.tweens.add({ targets: shard, alpha: 0, duration: 1200, delay: 400, onComplete: () => shard.destroy() });
        }

        // Silver coins
        for (let i = 0; i < 6; i++) {
          const coin = this.add.circle(x, y, 7, 0xc0c0c0);
          this.physics.add.existing(coin);
          const body = coin.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(Phaser.Math.Between(-180, 180), Phaser.Math.Between(-400, -150));
          body.setGravityY(500);
          this.tweens.add({ targets: coin, y: this.gameHeight + 50, duration: 1300, onComplete: () => coin.destroy() });
        }

        const isMobileB = this.gameWidth <= 500;
        const bonusFontSize = isMobileB ? '30px' : '48px';
        const bonusTextY = isMobileB ? this.gameHeight * 0.78 : this.gameHeight * 0.65;

        const bonusText = this.add.text(this.gameWidth / 2, bonusTextY, "+500 BONUS!", {
          fontSize: bonusFontSize, color: "#c0c0c0", fontFamily: "Arial, sans-serif", fontStyle: "bold",
          stroke: "#333333", strokeThickness: isMobileB ? 4 : 6
        }).setOrigin(0.5).setAlpha(0).setScale(0.5);
        this.tweens.add({ targets: bonusText, alpha: 1, scale: 1, duration: 500, ease: 'Back.easeOut' });

        // Small confetti
        const colors = [0xffd700, 0xc0c0c0, 0xff8800, 0xffff00];
        for (let i = 0; i < 30; i++) {
          const color = colors[Phaser.Math.Between(0, colors.length - 1)];
          const c = this.add.rectangle(x, y, 6, 6, color);
          this.physics.add.existing(c);
          const body = c.body as Phaser.Physics.Arcade.Body;
          body.setVelocity(Phaser.Math.Between(-300, 300), Phaser.Math.Between(-600, -200));
          body.setGravityY(350);
          this.tweens.add({ targets: c, alpha: 0, duration: 1500, delay: 800, onComplete: () => c.destroy() });
        }

        this.time.delayedCall(2500, () => onGameOver('bonus'));
      }

      playMissEffect(pot: Phaser.GameObjects.Image) {
        this.sound.play('ewwwSound', { volume: 0.8 }); // plays after bonk

        // Shake the pot heavily
        this.tweens.add({
          targets: pot,
          x: pot.x + Phaser.Math.Between(-15, 15),
          duration: 50,
          yoyo: true,
          repeat: 5,
          onComplete: () => {
            pot.x = pot.getData("originalX") || pot.x;
          }
        });

        // Dust falling down
        for(let i=0; i<5; i++){
            const dust = this.add.circle(pot.x + Phaser.Math.Between(-20, 20), pot.y + 40, 4, 0x8b5a2b, 0.6);
            this.tweens.add({
                targets: dust,
                y: pot.y + 150,
                alpha: 0,
                duration: 800,
                ease: 'Quad.easeIn',
                onComplete: () => dust.destroy()
            });
        }

        const isMobileM = this.gameWidth <= 500;
        const missFontSize = isMobileM ? '32px' : '48px';
        const missTextY = isMobileM ? this.gameHeight * 0.78 : this.gameHeight * 0.65;

        const missText = this.add.text(this.gameWidth / 2, missTextY, "MISSED!", {
          fontSize: missFontSize,
          color: "#dddddd",
          fontFamily: "Arial, sans-serif",
          fontStyle: "bold",
        }).setOrigin(0.5).setAlpha(0).setScale(0.8);

        this.tweens.add({
          targets: missText,
          alpha: 1,
          scale: 1,
          duration: 400,
          ease: 'Back.easeOut'
        });

        this.time.delayedCall(2000, () => onGameOver('miss'));
      }

    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.CANVAS,
      parent: gameRef.current,
      backgroundColor: "#0a0a0a",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
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
