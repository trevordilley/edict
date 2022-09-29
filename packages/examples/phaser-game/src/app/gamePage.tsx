import { edict } from '@edict/core';
import * as Phaser from 'phaser';
import { useLayoutEffect } from 'react';
const { insert, rule, fire, retract } = edict<{
  speed: number;
  dt: number;
  destX: number;
  destY: number;
  circle: Phaser.GameObjects.Arc;
}>();

rule(
  'Circles with a destination move to destination',
  ({ circle, speed, dt, destX, destY }) => ({
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
  'When a new destination is set, add the destination to the circles',
  ({ circle, destX, destY }) => ({
    $npc: { circle },
    newDestination: { destX, destY },
  })
).enact({
  then: ({ newDestination, $npc }) => {
    insert({
      [$npc.id]: { destX: newDestination.destX, destY: newDestination.destY },
    });
  },
  thenFinally: () => {
    retract('newDestination', 'destX', 'destY');
  },
});

rule(
  'Arriving at their destination stops them',
  ({ circle, destX, destY }) => ({
    $npc: { destX, destY, circle },
  })
).enact({
  then: ({ $npc }) => {
    const pos = new Phaser.Math.Vector2($npc.circle.x, $npc.circle.y);
    const dest = new Phaser.Math.Vector2($npc.destX, $npc.destY);
    const distance = dest.distance(pos);
    if (distance < 100) {
      retract($npc.id, 'destX', 'destY');
    }
  },
});

const create = (scene: Phaser.Scene) => {
  scene.input.on('pointerdown', (pointer: MouseEvent) => {
    const { x, y } = pointer;
    insert({ newDestination: { destX: x, destY: y } });
  });
  const playerCircle = scene.add.circle(0, 0, 50, 0x6666ff);
  const enemy1Circle = scene.add.circle(100, 100, 100, 0x9966ff);
  const enemy2Circle = scene.add.circle(200, 200, 20, 0xff6699);
  insert({
    player: {
      speed: 1,
      circle: playerCircle,
    },
    enemy1: {
      speed: 0.2,
      circle: enemy1Circle,
    },
    enemy2: {
      speed: 0.5,
      circle: enemy2Circle,
    },
  });
};

const update = (scene: Phaser.Scene, time: number, deltaTime: number) => {
  insert({
    time: { dt: deltaTime },
  });
  fire();
};

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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
