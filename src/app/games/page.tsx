import type { Metadata } from "next";
import { GameLibrary } from "@/components/game-library";
export const metadata: Metadata = { title: "Games" };
export default function Games() {
  return (
    <>
      <div className="page-intro">
        <span className="small-label">PHYSICS GAME LAB</span>
        <h1>Find your next experiment.</h1>
        <p>
          Lima dunia untuk menjelajahi gaya, gerak, dan energi. Mulai dari rasa
          ingin tahu.
        </p>
      </div>
      <GameLibrary />
    </>
  );
}
