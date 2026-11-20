import { expect, it } from "vitest";
import { BilliardSession } from "../../src/games/billiard/session";
import { DEFAULT_CONFIG, DT, speed } from "../../src/games/billiard/physics";
function finish(s:BilliardSession){for(let i=0;i<10000&&s.status==="moving";i++)s.tick();expect(s.status).not.toBe("moving");}
it("shot once, reject concurrent/zero shots, pause preserves ticks, restart clean",()=>{
  const s=new BilliardSession();s.power=0;expect(s.queueShot()).toBe(false);s.power=25;expect(s.queueShot()).toBe(true);expect(s.queueShot()).toBe(false);expect(s.strokes).toBe(0);s.tick();expect(s.strokes).toBe(1);const tick=s.world.tick;s.setPaused(true);s.advance(1);s.tick();expect(s.world.tick).toBe(tick);s.setPaused(false);finish(s);const fresh=new BilliardSession();expect(fresh.strokes).toBe(0);expect(fresh.world.tick).toBe(0);expect(fresh.lastShot).toBeNull();
});
it("First Shot is solvable with shipped initial aim/power and next level exists",()=>{const s=new BilliardSession();s.queueShot();finish(s);expect(s.status).toBe("won");expect(s.pocketCount).toBe(1);expect(s.strokes).toBe(1);expect(new BilliardSession("game",1).world.balls.length).toBe(3);});
it("loss only after last shot settles",()=>{const s=new BilliardSession();s.strokes=2;s.angle=0;s.power=5;s.queueShot();s.tick();expect(s.status).toBe("moving");finish(s);expect(s.status).toBe("lost");});
it("scratch penalizes once, safe respawn even if preferred spot blocked",()=>{const s=new BilliardSession();s.world.balls[0].x=0;s.world.balls[0].z=-0.6;s.world.balls[1].x=-0.7;s.world.balls[1].z=0;s.queueShot();finish(s);expect(s.penalties).toBe(1);expect(s.world.balls[0].active).toBe(true);expect(Math.hypot(s.world.balls[0].x+0.7,s.world.balls[0].z)).toBeGreaterThan(0.05715);});
it("scratch and final target on same tick count before win",()=>{const s=new BilliardSession();s.world.balls[0].x=0;s.world.balls[0].z=-0.6;s.world.balls[1].x=0;s.world.balls[1].z=0.6;s.queueShot();finish(s);expect(s.status).toBe("won");expect(s.penalties).toBe(1);expect(s.pocketCount).toBe(1);});
it("30/60/120 FPS produce same snapshot at same simulated tick",()=>{
  const states=[30,60,120].map(fps=>{const s=new BilliardSession("simulation");s.queueShot();for(let i=0;i<fps;i++)s.advance(1/fps);return s.world;});
  expect(states[0].tick).toBe(120);expect(states[0]).toEqual(states[1]);expect(states[1]).toEqual(states[2]);
});
it("game and simulation same config/input use identical kernel",()=>{const g=new BilliardSession(),s=new BilliardSession("simulation");s.world=structuredClone(g.world);s.angle=g.angle;s.initialSpeed=g.power*0.05;g.queueShot();s.queueShot();for(let i=0;i<120;i++){g.tick();s.tick();}expect(g.world).toEqual(s.world);});
it("simulation parameters affect actual velocity and energy, slower friction travels further",()=>{
  const a=new BilliardSession("simulation",0,{...DEFAULT_CONFIG,mass:0.3,friction:0.08},"Koefisien gesek");a.initialSpeed=0.5;a.queueShot();a.tick();expect(a.lastShot?.impulse).toBeCloseTo(0.15);expect(a.lastShot?.energy).toBeCloseTo(0.0375);finish(a);
  const b=new BilliardSession("simulation",0,{...DEFAULT_CONFIG,friction:0.02},"Koefisien gesek");b.initialSpeed=0.5;b.queueShot();finish(b);expect(b.world.balls[0].x).toBeGreaterThan(a.world.balls[0].x);expect(speed(a.world.balls[0])).toBe(0);
});
it("large frame discards backlog; no tick on pause or nonfinite time",()=>{const s=new BilliardSession();s.queueShot();s.advance(5);expect(s.world.tick).toBe(8);expect(s.droppedFrames).toBe(1);s.advance(NaN);s.setPaused(true);s.advance(DT);expect(s.world.tick).toBe(8);});
