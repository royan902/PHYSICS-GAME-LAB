import type { Metadata } from "next";
import { connection } from "next/server";
import { GameLibrary } from "@/components/game-library";
export const metadata: Metadata = { title: "Games" };
export default async function Games() {
  await connection();
  return (
    <>
      <div className="page-intro">
        <h1>
          Find your next <span>experiment.</span>
        </h1>
        <p>Jelajahi gaya, gerak, dan energi lewat koleksi game fisika.</p>
      </div>
      <GameLibrary />
    </>
  );
}
