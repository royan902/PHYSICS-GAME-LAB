"use client";
import { useState } from "react";
import { games } from "@/data/games";
import { GameCard } from "./game-card";

const filters = [
  "All games",
  "2D games",
  "3D games",
  "Playable",
  "Coming Soon",
] as const;
export function GameLibrary() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All games");
  const [query, setQuery] = useState("");
  const search = query.trim().toLocaleLowerCase("id");
  const shown = games.filter(
    (game) =>
      (filter === "All games" ||
        filter === `${game.dimension} games` ||
        filter === game.status) &&
      [game.title, game.topic, game.description, ...game.concepts]
        .join(" ")
        .toLocaleLowerCase("id")
        .includes(search),
  );
  return (
    <section
      className="library-layout"
      id="library"
      aria-labelledby="library-title"
    >
      <label className="search-field">
        <span className="sr-only">Cari game atau konsep fisika</span>
        <svg
          aria-hidden="true"
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <circle cx="10" cy="10" r="6" />
          <path d="m15 15 6 6" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari game atau konsep fisika…"
        />
      </label>
      <div className="filters" role="group" aria-label="Filter game">
        {filters.map((name) => (
          <button
            type="button"
            key={name}
            aria-pressed={filter === name}
            onClick={() => setFilter(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="section-heading">
        <h2 id="library-title">Game Library</h2>
        <span aria-live="polite" aria-atomic="true">
          {shown.length} game ditemukan
        </span>
      </div>
      {shown.length ? (
        <div className="game-grid">
          {shown.map((game, index) => (
            <GameCard key={game.slug} game={game} index={index} />
          ))}
        </div>
      ) : (
        <div className="empty-results">
          <h3>Belum ada game yang cocok.</h3>
          <p>Coba kata kunci lain atau jelajahi semua game.</p>
          <button
            className="button secondary"
            onClick={() => {
              setQuery("");
              setFilter("All games");
            }}
          >
            Reset pencarian
          </button>
        </div>
      )}
      <p className="catalog-note">
        Dibangun untuk rasa ingin tahu. Game baru hadir secara bertahap.
      </p>
    </section>
  );
}
