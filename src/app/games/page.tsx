import type { Metadata } from "next";
import { GameLibrary } from "@/components/game-library";
export const metadata: Metadata = { title: "Games" };
export default function Games() {
  return (
    <>
      <div className="page-intro">
        <h1>
          Find your next <span>experiment.</span>
        </h1>
        <p>
          Delapan dunia untuk menjelajahi gaya, gerak, dan energi. Mulai dari
          rasa ingin tahu.
        </p>
      </div>
      <GameLibrary />
    </>
  );
}
