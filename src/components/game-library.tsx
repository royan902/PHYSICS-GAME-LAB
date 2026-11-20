"use client";
import { useState } from "react";
import { games } from "@/data/games";
import { GameCard } from "./game-card";
export function GameLibrary() {
  const [filter, setFilter] = useState("All games");
  const shown = games.filter(
    (game) => filter === "All games" || filter.startsWith(game.dimension),
  );
  return (
    <section
      className="library-layout"
      id="library"
      aria-labelledby="library-title"
    >
      <aside className="library-sidebar">
        <h2>Explore the lab</h2>
        <div className="filters" role="group" aria-label="Filter dimensi game">
          {["All games", "3D games", "2D games"].map((name, i) => (
            <button
              type="button"
              key={name}
              aria-pressed={filter === name}
              onClick={() => setFilter(name)}
            >
              <span aria-hidden="true" className="filter-symbol">
                {["▦", "◇", "▱"][i]}
              </span>
              {name}
            </button>
          ))}
        </div>
        <div className="sidebar-note">
          <span className="small-label">LEARN BY EXPLORING</span>
          <p>Satu lab. Banyak cara untuk memahami fisika.</p>
          <span className="note-rule" />
        </div>
      </aside>
      <div className="library-main">
        <div className="section-heading">
          <h2 id="library-title">Game Library</h2>
          <span aria-live="polite">{shown.length} {shown.length === 1 ? "game" : "games"} to explore</span>
        </div>
        <div className="game-grid">
          {shown.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
        <p className="catalog-note">
          Dibangun untuk rasa ingin tahu. Game akan tersedia secara bertahap.
        </p>
      </div>
    </section>
  );
}
