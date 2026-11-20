import { useEffect, useRef, type KeyboardEvent } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { BilliardSession } from "./session";

// Input sends commands to the session; it never changes body positions.
export function useAimInput(session: BilliardSession, cameraControl: boolean) {
  const dragging = useRef<number | null>(null);
  const pointers = useRef(new Set<number>());
  const captured = useRef<Element | null>(null);
  useEffect(() => {
    const clear = () => {
      if (
        dragging.current !== null &&
        captured.current?.hasPointerCapture(dragging.current)
      )
        captured.current.releasePointerCapture(dragging.current);
      dragging.current = null;
      pointers.current.clear();
    };
    window.addEventListener("blur", clear);
    return () => window.removeEventListener("blur", clear);
  }, []);
  function point(e: ThreeEvent<PointerEvent>) {
    if (cameraControl || !session.canShoot) return;
    const cue = session.world.balls[0];
    session.setAngle(Math.atan2(e.point.z - cue.z, e.point.x - cue.x));
  }
  function release(e: ThreeEvent<PointerEvent>) {
    pointers.current.delete(e.pointerId);
    if (dragging.current === e.pointerId) {
      dragging.current = null;
      if (captured.current?.hasPointerCapture(e.pointerId))
        captured.current.releasePointerCapture(e.pointerId);
    }
  }
  return {
    onPointerDown(e: ThreeEvent<PointerEvent>) {
      if (cameraControl || !session.canShoot) return;
      pointers.current.add(e.pointerId);
      if (pointers.current.size > 1) {
        dragging.current = null;
        return;
      }
      e.stopPropagation();
      dragging.current = e.pointerId;
      captured.current = e.target as Element;
      (e.target as Element).setPointerCapture(e.pointerId);
      point(e);
    },
    onPointerMove(e: ThreeEvent<PointerEvent>) {
      if (dragging.current === e.pointerId) point(e);
    },
    onPointerUp: release,
    onPointerCancel: release,
  };
}
export function keyboardInput(session: BilliardSession, e: KeyboardEvent) {
  if (e.target !== e.currentTarget) return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    session.setAngle(
      session.angle + ((e.key === "ArrowLeft" ? -1 : 1) * Math.PI) / 180,
    );
  }
  if (e.code === "Space") {
    e.preventDefault();
    session.queueShot();
  }
  if (e.key.toLowerCase() === "p") session.setPaused(!session.paused);
}
