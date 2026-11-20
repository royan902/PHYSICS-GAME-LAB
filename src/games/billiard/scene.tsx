"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, Group, Mesh, MOUSE, TOUCH } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  HALF_LENGTH,
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
  cameraControl: boolean;
  zoom: number;
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
function CameraRig({
  top,
  cameraControl,
  zoom,
}: Omit<SceneProps, "session" | "onFailure">) {
  const { camera, gl, size } = useThree();
  useEffect(() => {
    const distance = (size.width / size.height < 1 ? 4.6 : 3.1) / zoom;
    camera.position.set(
      0,
      top ? distance : distance * 0.78,
      top ? 0.001 : distance * 0.72,
    );
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableRotate = cameraControl && !top;
    controls.enableZoom = true;
    controls.minDistance = 1.6;
    controls.maxDistance = 6;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI * 0.44;
    controls.mouseButtons = {
      LEFT: cameraControl ? MOUSE.ROTATE : null,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: null,
    };
    controls.touches = {
      ONE: cameraControl ? TOUCH.ROTATE : null,
      TWO: TOUCH.DOLLY_PAN,
    };
    return () => controls.dispose();
  }, [camera, gl, top, cameraControl, zoom, size.width, size.height]);
  return null;
}
function NumberedBall({ b }: { b: Ball }) {
  const mesh = useRef<Mesh>(null);
  const label = useRef<Group>(null);
  const texture = useMemo(() => {
    if (b.id === 0) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(64, 64, 57, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#10141c";
    ctx.font = "bold 82px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(b.id), 64, 69);
    return new CanvasTexture(canvas);
  }, [b.id]);
  useEffect(() => () => texture?.dispose(), [texture]);
  useFrame(() => {
    if (mesh.current) {
      mesh.current.visible = b.active;
      mesh.current.position.set(b.x, RADIUS, b.z);
    }
    if (label.current) {
      label.current.visible = b.active;
      label.current.position.set(b.x, RADIUS * 2 + 0.012, b.z);
    }
  });
  return (
    <>
      <mesh ref={mesh} position={[b.x, RADIUS, b.z]}>
        <sphereGeometry args={[RADIUS, 24, 16]} />
        <meshStandardMaterial
          color={["#f8f6e9", "#ffc332", "#398bf4", "#ee514e"][b.id % 4]}
          roughness={0.23}
          metalness={0.05}
        />
      </mesh>
      {texture && (
        <group ref={label}>
          <sprite scale={[0.039, 0.039, 1]}>
            <spriteMaterial map={texture} depthTest={false} />
          </sprite>
        </group>
      )}
    </>
  );
}
function Table({
  session,
  cameraControl,
}: {
  session: BilliardSession;
  cameraControl: boolean;
}) {
  const aim = useRef<Group>(null),
    cue = useRef<Group>(null);
  const aimInput = useAimInput(session, cameraControl);
  const pocketRings = useRef<Group>(null);
  const previousCount = useRef(0),
    flash = useRef(0);
  useFrame((_, delta) => {
    session.advance(delta);
    const b = session.world.balls[0];
    for (const ref of [aim, cue])
      if (ref.current) {
        ref.current.visible = session.canShoot;
        ref.current.position.set(b.x, RADIUS + 0.005, b.z);
        ref.current.rotation.y = -session.angle;
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
      <ambientLight intensity={1.25} />
      <directionalLight position={[1.5, 4, 2]} intensity={2.1} />
      <pointLight position={[-2, 2, -1]} intensity={5} />
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[2.86, 0.2, 1.59]} />
        <meshStandardMaterial color="#302827" roughness={0.65} />
      </mesh>
      <mesh position={[0, -0.025, 0]}>
        <boxGeometry args={[HALF_LENGTH * 2, 0.05, HALF_WIDTH * 2]} />
        <meshStandardMaterial color="#107257" roughness={0.95} />
      </mesh>
      {RAILS.map((r, i) => (
        <mesh
          key={i}
          position={
            r.axis === "z"
              ? [(r.lo + r.hi) / 2, 0.023, r.side + Math.sign(r.side) * 0.0275]
              : [r.side + Math.sign(r.side) * 0.0275, 0.023, (r.lo + r.hi) / 2]
          }
        >
          <boxGeometry
            args={
              r.axis === "z"
                ? [r.hi - r.lo, 0.046, 0.055]
                : [0.055, 0.046, r.hi - r.lo]
            }
          />
          <meshStandardMaterial color="#124d3d" roughness={0.75} />
        </mesh>
      ))}
      {POCKETS.map((p, i) => (
        <group key={i} position={[p.x, 0.002, p.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[POCKET_RADIUS + 0.012, 32]} />
            <meshBasicMaterial color="#050a0a" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
            <torusGeometry args={[POCKET_RADIUS + 0.012, 0.008, 8, 32]} />
            <meshStandardMaterial color="#b29b72" />
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
            position={[x, 0.001, sign * 0.737]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.008, 8]} />
            <meshBasicMaterial color="#cbbd9c" />
          </mesh>
        )),
      )}
      {session.world.balls.map((b) => (
        <NumberedBall key={b.id} b={b} />
      ))}
      <group ref={aim}>
        <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.0018, 0.0018, 0.72, 6]} />
          <meshBasicMaterial color="#d4f4ad" transparent opacity={0.8} />
        </mesh>
        <mesh position={[0.78, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[RADIUS * 0.8, RADIUS, 24]} />
          <meshBasicMaterial color="#d4f4ad" />
        </mesh>
      </group>
      <group ref={cue}>
        <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.013, 0.65, 12]} />
          <meshStandardMaterial color="#dac196" />
        </mesh>
        <mesh position={[-0.068, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.006, 0.015, 12]} />
          <meshStandardMaterial color="#7dbfc4" />
        </mesh>
      </group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.12, 0]}
        visible={false}
        {...aimInput}
      >
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
export default function BilliardScene(props: SceneProps) {
  return (
    <Canvas
      dpr={[1, 1.5]}
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
      <CameraRig
        top={props.top}
        cameraControl={props.cameraControl}
        zoom={props.zoom}
      />
      <Table
        key={`${props.session.mode}-${props.session.level}-${props.session.experiment}`}
        session={props.session}
        cameraControl={props.cameraControl}
      />
    </Canvas>
  );
}
