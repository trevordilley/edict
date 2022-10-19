import { edict } from '@edict/core';
import * as Phaser from 'phaser';
import { useLayoutEffect } from 'react';
import {deepEqual} from "assert";

const WIDTH = 800
const HEIGHT = 600
const newDest = () => ({
  destX: Math.floor(Math.random() * WIDTH),
  destY: Math.floor(Math.random() * HEIGHT)
})
// Start an edict session
const { insert, rule, fire, retract, debug } = edict<{
  speed: number;
  dt: number;
  destX: number;
  destY: number;
  circle: Phaser.GameObjects.Arc;
}>();


// Enact the rules for this session
rule(
  'Circles with a destination move to destination',
  ({  circle, speed , dt, destX, destY }) => ({
    $npc: { circle, speed, destX, destY },
    time: { dt },
  })
).enact({
  then: ({ $npc, time }) => {
    const pos = new Phaser.Math.Vector2($npc.circle.x, $npc.circle.y);
    const dest = new Phaser.Math.Vector2($npc.destX, $npc.destY);
    const dir = dest.subtract(pos).normalize();

    $npc.circle.x = $npc.circle.x + dir.x * $npc.speed * time.dt;
    $npc.circle.y = $npc.circle.y + dir.y * $npc.speed * time.dt;
  },
});

rule(
  'Arriving at their destination sets a new destination',
  ({ circle, destX, destY, dt }) => ({
    $npc: {
      destX: {then: false},
      destY: {then: false},
      circle
    },
    time: { dt }
  })
).enact({
  then: ({ $npc }) => {
    const pos = new Phaser.Math.Vector2($npc.circle.x, $npc.circle.y);
    const dest = new Phaser.Math.Vector2($npc.destX, $npc.destY);
    const distance = dest.distance(pos);
    if (distance < 20) {
      insert({
          [$npc.id]: newDest()
      }
      );
    }
  },
});


// Setup initial facts and input handlers
const create = (scene: Phaser.Scene) => {

  const colors = [
    0x6666ff,
    0x9966ff,
    0xff6699,
    0xaaff22,
    0xfcdd11,
    0x00ff00,
    0xff0000,
    0x0000ff
  ]
  for(let i = 0; i < 500; i++) {
    const cIdx = i % colors.length
    const circle = scene.add.circle(0, 0, 50, colors[cIdx])
    insert({
      [`c${i}`]: {
        speed: Math.random() * 2,
        ...newDest(),
        circle
      }
    })
  }
};

const {frames, capture} = debug.perf()

const update = (scene: Phaser.Scene, time: number, deltaTime: number) => {
  // Continuously update the dt fact (delta time)
  insert({
    time: { dt: deltaTime },
  });
  fire();
  const frame = capture()
  console.log(frames)
};
// Phaser and React tom-foolerly
const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    create: function () {
      create(this as unknown as Phaser.Scene);
    },
    update: function (time: number, deltaTime: number) {
      update(this as unknown as Phaser.Scene, time, deltaTime);
    },
  },
} as any;

export const GamePage = () => {
  useLayoutEffect(() => {
    const game = new Phaser.Game(config);
    return () => {
      game.destroy(true);
    };
  }, []);

  return <span id={'game'} />;
};
