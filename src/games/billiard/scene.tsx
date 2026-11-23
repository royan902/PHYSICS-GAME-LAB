"use client";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  Group,
  Shape,
  Mesh,
  Vector3,
  SRGBColorSpace,
  RepeatWrapping,
  SphereGeometry,
  Line,
  LineBasicMaterial,
  BufferGeometry,
  MeshBasicMaterial,
  PerspectiveCamera,
} from "three";
import {
  HALF_LENGTH,
  applyShot,
  createWorld,
  stepWorld,
  HALF_WIDTH,
  POCKETS,
  POCKET_RADIUS,
  RADIUS,
  RAILS,
  type Ball,
} from "./physics";
import { BilliardSession } from "./session";
import { useAimInput } from "./input";
type SceneProps = {
  session: BilliardSession;
  top: boolean;
  assist: boolean;
  zoom: number;
  pitch: number;
  low: boolean;
  onFailure: () => void;
};
function ContextLifecycle({ onFailure }: { onFailure: () => void }) {
  const { gl } = useThree();
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < 1) return;
    elapsed.current = 0;
    gl.domElement.setAttribute(
      "data-geometries",
      String(gl.info.memory.geometries),
    );
    gl.domElement.setAttribute(
      "data-textures",
      String(gl.info.memory.textures),
    );
    gl.domElement.setAttribute("data-draw-calls", String(gl.info.render.calls));
    gl.domElement.setAttribute(
      "data-triangles",
      String(gl.info.render.triangles),
    );
  });
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return null;
}
const panMin = new Vector3(-1.25, 0, -0.62);
const panMax = new Vector3(1.25, 0, 0.62);
function CameraRig({
  session,
  top,
  zoom,
  pitch,
}: Pick<SceneProps, "session" | "top" | "zoom" | "pitch">) {
  const { camera, size, gl } = useThree();
  const look = useRef(new Vector3());
  const orbit = useRef<OrbitControls | null>(null);
  useEffect(() => {
    if (!top) return;
    const origin = camera.position.clone();
    const rotation = camera.quaternion.clone();
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enableDamping = true;
    controls.minDistance = 0.75;
    controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minPolarAngle = 0.1;
    controls.screenSpacePanning = false;
    camera.position.copy(origin);
    camera.quaternion.copy(rotation);
    controls.target.copy(look.current);
    controls.update();
    orbit.current = controls;
    return () => {
      controls.dispose();
      orbit.current = null;
    };
  }, [top, camera, gl]);

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      const fov = size.width / size.height > 1.85 ? 32 : 44;
      camera.setFocalLength(
        camera.getFilmHeight() / (2 * Math.tan((fov * Math.PI) / 360)),
      );
    }
  }, [camera, size.width, size.height]);
  const target = useRef(new Vector3());
  const desired = useRef(new Vector3());
  const initialized = useRef(false);
  useFrame((_, delta) => {
    if (orbit.current) {
      const controls = orbit.current;
      controls.enabled = !session.paused && session.placing === null;
      controls.target.clamp(panMin, panMax);
      controls.update();
      look.current.copy(controls.target);
      return;
    }
    const cue = session.world.balls[0],
      aim = session.status === "ready" && session.placing === null && !top;
    const portrait = size.width / size.height < 1;
    if (aim) {
      const distance = (portrait ? 2.5 : 1.65) / zoom;
      desired.current.set(
        cue.x - Math.cos(session.angle) * distance,
        ((portrait ? 1.8 : size.width / size.height > 1.85 ? 1.2 : 1.05) *
          pitch) /
          zoom,
        cue.z - Math.sin(session.angle) * distance,
      );
      target.current
        .set(
          cue.x + Math.cos(session.angle) * 0.62,
          0,
          cue.z + Math.sin(session.angle) * 0.62,
        )
        .clamp(panMin, panMax);
    } else {
      desired.current.set(0, portrait ? 8 : 3.05, top ? 0.001 : 1.7);
      target.current.set(0, 0, 0);
    }
    const blend = initialized.current
      ? 1 - Math.exp(-7 * Math.min(delta, 0.1))
      : 1;
    camera.position.lerp(desired.current, blend);
    look.current.lerp(target.current, blend);
    camera.lookAt(look.current);
    initialized.current = true;
  });
  return null;
}
function NumberedBall({ b, session }: { b: Ball; session: BilliardSession }) {
  const mesh = useRef<Mesh>(null);
  const fall = useRef(0);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const colors = [
      "#faf8ed",
      "#f4bf16",
      "#225dcc",
      "#c82327",
      "#713f9f",
      "#e56f17",
      "#147952",
      "#8f2027",
      "#101216",
    ];
    ctx.fillStyle = b.id > 8 ? "#faf8ed" : colors[b.id];
    ctx.fillRect(0, 0, 512, 256);
    if (b.id > 8) {
      ctx.fillStyle = colors[b.id - 8];
      ctx.fillRect(0, 76, 512, 104);
    }
    if (b.id)
      for (const x of [128, 384]) {
        ctx.fillStyle = "#fff9e9";
        ctx.beginPath();
        ctx.arc(x, 128, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#12151a";
        ctx.font = "bold 34px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(b.id), x, 130);
      }
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [b.id]);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame((_, delta) => {
    if (mesh.current) {
      if (!b.active && b.exit) {
        if (!session.paused) fall.current += Math.min(0.05, delta);
        const t = fall.current,
          pocket = POCKETS[b.exit.pocket];
        mesh.current.visible = t < 0.4;
        if (pocket) {
          const k = Math.min(1, t * 8);
          mesh.current.position.set(
            b.x + (pocket.x - b.x) * k,
            b.y - 4.905 * t * t,
            b.z + (pocket.z - b.z) * k,
          );
          mesh.current.scale.setScalar(Math.max(0.1, 1 - t * 2.5));
        } else
          mesh.current.position.set(
            b.x + b.exit.vx * t,
            b.y + b.exit.vy * t - 4.905 * t * t,
            b.z + b.exit.vz * t,
          );
        return;
      }
      fall.current = 0;
      mesh.current.scale.setScalar(1);
      mesh.current.visible = b.active;
      mesh.current.position.set(b.x, b.y, b.z);
      mesh.current.quaternion.set(b.qx, b.qy, b.qz, b.qw);
    }
  });
  return (
    <>
      <mesh ref={mesh} castShadow position={[b.x, b.y, b.z]}>
        <sphereGeometry args={[RADIUS, 32, 24]} />
        <meshStandardMaterial map={texture} roughness={0.17} metalness={0.08} />
      </mesh>
    </>
  );
}
function PocketMark({ index, selected }: { index: number; selected: boolean }) {
  const label = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "white";
    g.font = "bold 52px Arial";
    g.textAlign = "center";
    g.fillText("ABCDEF"[index], 32, 51);
    return new CanvasTexture(c);
  }, [index]);
  useEffect(() => () => label.dispose(), [label]);
  return (
    <sprite position={[0, 0.085, 0]} scale={[0.042, 0.042, 1]}>
      <spriteMaterial
        map={label}
        color={selected ? "#ffe963" : "#accabb"}
        depthTest={false}
      />
    </sprite>
  );
}
function surfaceTexture(wood: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  let seed = 37;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (wood) {
    ctx.fillStyle = "#433024";
    ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 16; row++) {
      const y = row * 32;
      ctx.fillStyle = `hsl(25 25% ${20 + random() * 6}%)`;
      ctx.fillRect(0, y, 512, 31);
      ctx.fillStyle = "#1c1814";
      ctx.fillRect(0, y, 512, 1);
      for (
        let x = Math.floor(random() * 100);
        x < 512;
        x += 100 + random() * 70
      )
        ctx.fillRect(x, y, 1, 32);
      for (let grain = 0; grain < 30; grain++) {
        const gy = y + random() * 30;
        ctx.strokeStyle = `rgba(10,5,0,${0.04 + random() * 0.1})`;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(
          160,
          gy + random() * 6,
          320,
          gy - random() * 6,
          512,
          gy,
        );
        ctx.stroke();
      }
    }
  } else {
    const pixels = ctx.createImageData(512, 512);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = 205 + random() * 40;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(wood ? 3 : 8, wood ? 3 : 4);
  return texture;
}
// Replay only the opening part of a stroke in an isolated copy of the real solver.
function Guide({ session }: { session: BilliardSession }) {
  const state = session.world,
    angle = session.angle,
    power = session.power,
    spin = session.spin;
  const guide = useMemo(() => {
    const w = createWorld(state.balls, state.config),
      group = new Group();
    if (!applyShot(w.balls[0], angle, power, spin)) return group;
    const paths: Vector3[][] = [[], [], []];
    let hit = false,
      target = -1,
      after = 0,
      marker: Vector3 | undefined;
    const at = (id: number) =>
      new Vector3(w.balls[id].x, w.balls[id].y, w.balls[id].z);
    paths[0].push(at(0));
    for (let tick = 0; tick < 90; tick++) {
      stepWorld(w);
      for (const event of w.events) {
        if (event.kind !== "rail" && event.kind !== "contact") continue;
        if (hit) {
          after = 18;
          break;
        }
        if (!event.cueAt) continue;
        const { x, y, z } = event.cueAt;
        marker = new Vector3(x, y, z);
        paths[0].push(marker);
        paths[1].push(marker);
        hit = true;
        if (event.kind === "contact") {
          target = event.a === 0 ? event.b : event.a;
          const original = state.balls[target];
          paths[2].push(new Vector3(original.x, original.y, original.z));
        }
      }
      if (w.balls[0].active) paths[hit ? 1 : 0].push(at(0));
      if (target >= 0 && w.balls[target].active) paths[2].push(at(target));
      if (!w.balls[0].active) break;
      if (hit && ++after >= 18) break;
    }
    for (let i = 0; i < paths.length; i++)
      if (paths[i].length > 1)
        group.add(
          new Line(
            new BufferGeometry().setFromPoints(paths[i]),
            new LineBasicMaterial({
              color: i === 2 ? "#ffc36b" : "#cfefdf",
              transparent: true,
              opacity: 0.72,
            }),
          ),
        );
    if (marker) {
      const mesh = new Mesh(
        new SphereGeometry(RADIUS, 16, 10),
        new MeshBasicMaterial({
          color: "#e4fff0",
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        }),
      );
      mesh.position.copy(marker);
      group.add(mesh);
    }
    return group;
  }, [state, angle, power, spin]);
  useEffect(
    () => () => {
      guide.children.forEach((child) => {
        const obj = child as Line<BufferGeometry, LineBasicMaterial>;
        obj.geometry.dispose();
        obj.material.dispose();
      });
    },
    [guide],
  );
  return <primitive object={guide} />;
}
// The cushion nose matches the collision plane; its back widens toward the wood rail.
const cushionProfile = new Shape();
cushionProfile.moveTo(0, RADIUS);
cushionProfile.lineTo(0.052, 0.05);
cushionProfile.lineTo(0.058, 0.004);
cushionProfile.lineTo(0.012, 0.004);
cushionProfile.closePath();
const cushionSections = RAILS.map((r) => ({
  depth: r.hi - r.lo,
  bevelEnabled: false,
}));

function Table({
  session,
  top,
  assist,
}: Pick<SceneProps, "session" | "top" | "assist">) {
  const cue = useRef<Group>(null);
  const ghost = useRef<Mesh>(null);
  const strike = useRef(0);
  const origin = useRef(new Vector3());
  const placementRing = useRef<Mesh>(null);
  const lastPlacement = useRef(session.lastPlacement);
  const pulse = useRef(0);
  const aimInput = useAimInput(session, top);
  const wood = useMemo(() => surfaceTexture(true), []),
    felt = useMemo(() => surfaceTexture(false), []);
  useEffect(
    () => () => {
      wood.dispose();
      felt.dispose();
    },
    [wood, felt],
  );
  const pocketRings = useRef<Group>(null);
  const previousCount = useRef(0),
    flash = useRef(0);
  useFrame((_, delta) => {
    if (session.canShoot || session.pending)
      origin.current.set(
        session.world.balls[0].x,
        RADIUS,
        session.world.balls[0].z,
      );
    if (session.canShoot) strike.current = 0;
    if (session.status === "moving" && !session.paused) strike.current += delta;
    // Finish the forward stroke before delivering the queued impulse to the solver.
    const impactTime = 0.065;
    if (!session.pending || strike.current >= impactTime)
      session.advance(delta);
    if (cue.current) {
      cue.current.rotation.order = "YXZ";
      cue.current.rotation.y = -session.angle;
      cue.current.rotation.z = (-session.spin.elevation * Math.PI) / 180;
      const side = session.spin.side * RADIUS * 0.65;
      cue.current.position.set(
        origin.current.x - Math.sin(session.angle) * side,
        RADIUS + session.spin.top * RADIUS * 0.65,
        origin.current.z + Math.cos(session.angle) * side,
      );
    }
    if (ghost.current) {
      const p = session.preview ?? session.world.balls[session.placing ?? 0];
      ghost.current.visible = session.placing !== null;
      ghost.current.position.set(p.x, RADIUS, p.z);
      (ghost.current.material as MeshBasicMaterial).color.set(
        session.validPosition(session.placing ?? 0, p.x, p.z)
          ? "#88ffba"
          : "#ff453c",
      );
    }
    if (cue.current) {
      const firing = session.status === "moving" && strike.current < 0.12;
      cue.current.visible = session.canShoot || !!firing;
      const fraction = firing
        ? Math.max(0, 1 - strike.current / impactTime)
        : 1;
      const reach =
        Math.sqrt(
          1 - 0.65 ** 2 * (session.spin.side ** 2 + session.spin.top ** 2),
        ) * RADIUS;
      cue.current.translateX(
        0.0605 - reach - (0.012 + session.power * 0.0017) * fraction,
      );
    }
    if (lastPlacement.current !== session.lastPlacement) {
      lastPlacement.current = session.lastPlacement;
      pulse.current = session.lastPlacement ? 0.26 : 0;
    }
    if (placementRing.current && session.lastPlacement) {
      const placed = session.world.balls[session.lastPlacement.id];
      placementRing.current.visible = pulse.current > 0 && session.canShoot;
      placementRing.current.position.set(placed.x, 0.002, placed.z);
      placementRing.current.scale.setScalar(1 + (0.26 - pulse.current) * 4);
      (placementRing.current.material as MeshBasicMaterial).opacity =
        pulse.current * 3;
      if (!session.paused) pulse.current = Math.max(0, pulse.current - delta);
    }
    if (previousCount.current !== session.pocketCount + session.penalties) {
      flash.current = 0.6;
      previousCount.current = session.pocketCount + session.penalties;
    }
    flash.current = Math.max(0, flash.current - delta);
    if (pocketRings.current) pocketRings.current.visible = flash.current > 0;
  });
  return (
    <group>
      <color attach="background" args={["#080d0d"]} />
      <fog attach="fog" args={["#080d0d", 3.4, 9]} />
      <hemisphereLight args={["#fff4d8", "#464339", 0.8]} />
      <spotLight
        position={[0, 2.6, 0]}
        angle={1}
        penumbra={0.85}
        intensity={7}
        color="#fff0d6"
      />
      <directionalLight
        castShadow
        position={[0, 3, 0.5]}
        intensity={2.5}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0002}
      />
      <pointLight position={[-2, 2, -1]} intensity={5} />
      <mesh castShadow position={[0, -0.12, 0]}>
        <boxGeometry args={[2.86, 0.2, 1.59]} />
        <meshStandardMaterial map={wood} roughness={0.3} />
      </mesh>
      <mesh receiveShadow position={[0, -0.025, 0]}>
        <boxGeometry args={[HALF_LENGTH * 2, 0.05, HALF_WIDTH * 2]} />
        <meshStandardMaterial
          map={felt}
          bumpMap={felt}
          bumpScale={0.0004}
          color="#0b854c"
          roughness={0.92}
        />
      </mesh>
      <mesh
        receiveShadow
        position={[0, -0.86, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial map={wood} roughness={0.6} />
      </mesh>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh
            key={`leg-${x}-${z}`}
            castShadow
            position={[x * 1.1, -0.5, z * 0.5]}
          >
            <cylinderGeometry args={[0.07, 0.055, 0.65, 12]} />
            <meshStandardMaterial color="#30231c" roughness={0.4} />
          </mesh>
        )),
      )}
      {RAILS.map((r, i) => {
        const sign = Math.sign(r.side);
        const start =
          r.axis === "x" ? (sign > 0 ? r.lo : r.hi) : sign > 0 ? r.hi : r.lo;
        const rotation =
          r.axis === "x" ? (sign > 0 ? 0 : Math.PI) : (-sign * Math.PI) / 2;
        const length = r.hi - r.lo;
        return (
          <group
            key={i}
            rotation={[0, rotation, 0]}
            position={r.axis === "x" ? [r.side, 0, start] : [start, 0, r.side]}
          >
            <mesh castShadow receiveShadow>
              <extrudeGeometry args={[cushionProfile, cushionSections[i]]} />
              <meshStandardMaterial color="#146543" roughness={0.85} />
            </mesh>
            <mesh position={[0.098, 0.019, length / 2]} receiveShadow>
              <boxGeometry args={[0.089, 0.061, length]} />
              <meshStandardMaterial
                map={wood}
                color="#c9926e"
                roughness={0.36}
              />
            </mesh>
          </group>
        );
      })}
      {POCKETS.map((p, i) => (
        <group key={i} position={[p.x, 0.002, p.z]}>
          {session.mode === "classic" && !session.breaking && (
            <PocketMark index={i} selected={session.callPocket === i} />
          )}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[POCKET_RADIUS + 0.012, 32]} />
            <meshBasicMaterial color="#050a0a" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
            <torusGeometry args={[POCKET_RADIUS + 0.012, 0.008, 8, 32]} />
            <meshStandardMaterial
              color="#856e49"
              roughness={0.42}
              metalness={0.32}
            />
          </mesh>
        </group>
      ))}
      <group ref={pocketRings} visible={false}>
        {POCKETS.map((p, i) => (
          <mesh
            key={i}
            position={[p.x, 0.008, p.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.079, 0.091, 32]} />
            <meshBasicMaterial color="#76ffd6" />
          </mesh>
        ))}
      </group>
      {[-1, -0.5, 0.5, 1].flatMap((x) =>
        [-1, 1].map((sign) => (
          <mesh
            key={`${x}-${sign}`}
            position={[x, 0.051, sign * 0.737]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.009, 4]} />
            <meshBasicMaterial color="#cbbd9c" />
          </mesh>
        )),
      )}
      {session.world.balls.map((b) => (
        <NumberedBall key={b.id} b={b} session={session} />
      ))}
      <mesh ref={ghost} visible={false}>
        <sphereGeometry args={[RADIUS * 1.04, 24, 16]} />
        <meshBasicMaterial transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh ref={placementRing} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[RADIUS * 1.1, RADIUS * 1.22, 36]} />
        <meshBasicMaterial color="#a6ffcb" transparent depthWrite={false} />
      </mesh>
      {assist && session.canShoot && <Guide session={session} />}
      <group ref={cue}>
        <mesh position={[-1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.011, 0.35, 12]} />
          <meshStandardMaterial color="#37241d" roughness={0.3} />
        </mesh>
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.011, 0.006, 0.85, 12]} />
          <meshStandardMaterial color="#dac196" />
        </mesh>
        <mesh position={[-0.086, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0064, 0.0063, 0.022, 12]} />
          <meshStandardMaterial color="#e6e1ca" roughness={0.32} />
        </mesh>
        <mesh position={[-0.068, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.006, 0.015, 12]} />
          <meshStandardMaterial color="#7dbfc4" />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} {...aimInput}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
export default function BilliardScene(props: SceneProps) {
  return (
    <Canvas
      shadows={!props.low}
      dpr={[1, props.low ? 1 : 1.5]}
      camera={{ position: [0, 2.7, 2.5], fov: 44, near: 0.05, far: 30 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      fallback={
        <p>WebGL tidak tersedia. Aktifkan akselerasi grafis lalu muat ulang.</p>
      }
      onCreated={({ gl }) => {
        gl.domElement.setAttribute("aria-label", "Meja biliar 3D interaktif");
      }}
    >
      <ContextLifecycle onFailure={props.onFailure} />
      <CameraRig {...props} />
      <Table {...props} />
    </Canvas>
  );
}
