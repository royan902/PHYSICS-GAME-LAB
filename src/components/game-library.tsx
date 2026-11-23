"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { games, newtonCollection } from "@/data/games";
import { GameCard } from "./game-card";

const filters = [
  {
    key: "dimension",
    label: "Dimensi",
    options: [
      ["", "Semua dimensi"],
      ["2d", "2D games"],
      ["3d", "3D games"],
    ],
  },
  {
    key: "status",
    label: "Status",
    options: [
      ["", "Semua status"],
      ["playable", "Playable"],
      ["in-development", "In Development"],
      ["coming-soon", "Coming Soon"],
    ],
  },
] as const;

export function GameLibrary() {
  const params = useSearchParams();
  const [draft, setDraft] = useState<string | null>(null);
  const query = draft ?? params.get("q") ?? "";
  const [dimension, status] = filters.map(({ key, options }) => {
    const value = params.get(key);
    return options.find(([option]) => option === value)?.[0] ?? "";
  });

  useEffect(() => {
    const restoreSearch = () => setDraft(null);
    window.addEventListener("popstate", restoreSearch);
    return () => window.removeEventListener("popstate", restoreSearch);
  }, []);

  function updateQuery(changes: Record<string, string>, replace = false) {
    const url = new URL(window.location.href);
    const previous = url.href;
    for (const [key, value] of Object.entries(changes)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href === previous) return;

    if (replace) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
  }

  const search = query.trim().toLocaleLowerCase("id");
  const shown = games.filter(
    (game) =>
      (!dimension || dimension === game.dimension.toLowerCase()) &&
      (!status || status === game.status.toLowerCase().replaceAll(" ", "-")) &&
      [
        game.title,
        game.collection,
        game.topic,
        game.description,
        ...game.concepts,
      ]
        .join(" ")
        .toLocaleLowerCase("id")
        .includes(search),
  );
  const groups = [
    {
      title: newtonCollection,
      entries: shown.filter((game) => game.collection),
    },
    {
      title: "Game lainnya",
      entries: shown.filter((game) => !game.collection),
    },
  ];
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
          onChange={(event) => {
            const value = event.target.value;
            setDraft(value);
            // Pertahankan ketikan saat router memproses URL dan simpan satu entri per sesi.
            updateQuery({ q: value }, draft !== null);
          }}
          onBlur={() => setDraft(null)}
          placeholder="Cari game atau konsep fisika…"
        />
      </label>
      <div className="catalog-filters">
        {filters.map(({ key, label, options }) => (
          <div className="filters" role="group" aria-label={label} key={key}>
            <span>{label}</span>
            {options.map(([value, name]) => (
              <button
                type="button"
                key={value}
                aria-pressed={
                  (key === "dimension" ? dimension : status) === value
                }
                onClick={() => updateQuery({ [key]: value })}
              >
                {name}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2 id="library-title">Game Library</h2>
        <span aria-live="polite" aria-atomic="true">
          {shown.length} game ditemukan
        </span>
      </div>
      {shown.length ? (
        groups.map(({ title, entries }) =>
          entries.length ? (
            <div className="catalog-group" key={title}>
              <h3>{title}</h3>
              <div className="game-grid">
                {entries.map((game, index) => (
                  <GameCard
                    key={game.slug}
                    game={game}
                    index={index}
                    heading="h4"
                  />
                ))}
              </div>
            </div>
          ) : null,
        )
      ) : (
        <div className="empty-results">
          <h3>Belum ada game yang cocok.</h3>
          <p>Coba kata kunci lain atau jelajahi semua game.</p>
          <button
            className="button secondary"
            onClick={() => {
              setDraft(null);
              updateQuery({ q: "", dimension: "", status: "" });
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
