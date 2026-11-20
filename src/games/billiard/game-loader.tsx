"use client";
import dynamic from "next/dynamic";
import "./billiard.css";
const BilliardGame = dynamic(() => import("./game"), {
  ssr: false,
  loading: () => (
    <div className="game-loading" role="status">
      Memuat meja 3D dan kontrol permainan…
    </div>
  ),
});
export function GameLoader() {
  return <BilliardGame />;
}
