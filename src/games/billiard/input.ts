import { useEffect, useRef, type KeyboardEvent } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { BilliardSession } from "./session";
export function useAimInput(session: BilliardSession, top: boolean) {
  const drag = useRef<{ id: number; x: number; angle: number } | null>(null);
  const captured = useRef<Element | null>(null);
  useEffect(() => {
    const clear = () => {
      if (drag.current && captured.current?.hasPointerCapture(drag.current.id))
        captured.current.releasePointerCapture(drag.current.id);
      drag.current = null;
    };
    window.addEventListener("blur", clear);
    return () => {
      clear();
      window.removeEventListener("blur", clear);
    };
  }, []);
  function point(e: ThreeEvent<PointerEvent>) {
    if (session.placing !== null) return;

    if (!top && drag.current)
      session.setAngle(
        drag.current.angle + (e.clientX - drag.current.x) * 0.005,
      );
  }
  function release(e: ThreeEvent<PointerEvent>) {
    if (drag.current?.id !== e.pointerId) return;
    if (captured.current?.hasPointerCapture(e.pointerId))
      captured.current.releasePointerCapture(e.pointerId);
    drag.current = null;
  }
  return {
    onPointerDown(e: ThreeEvent<PointerEvent>) {
      if (session.placing !== null) {
        session.previewPlacement(e.point.x, e.point.z);
        (e.target as Element).setPointerCapture(e.pointerId);
        return;
      }
      if (top || !session.canShoot || drag.current) return;
      e.stopPropagation();
      drag.current = { id: e.pointerId, x: e.clientX, angle: session.angle };
      captured.current = e.target as Element;
      captured.current.setPointerCapture(e.pointerId);
      point(e);
    },
    onPointerMove(e: ThreeEvent<PointerEvent>) {
      if (session.placing !== null)
        session.previewPlacement(e.point.x, e.point.z);
      if (drag.current?.id === e.pointerId) point(e);
    },
    onPointerUp(e: ThreeEvent<PointerEvent>) {
      if (
        session.placing !== null &&
        (e.target as Element).hasPointerCapture(e.pointerId)
      ) {
        (e.target as Element).releasePointerCapture(e.pointerId);
        session.placeBall(session.placing, e.point.x, e.point.z);
      }
      release(e);
    },
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
  if (e.key.toLowerCase() === "p" || e.key === "Escape") {
    e.preventDefault();
    session.setPaused(!session.paused);
  }
}
