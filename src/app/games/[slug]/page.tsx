import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { games, getGame } from "@/data/games";
import { Arrow } from "@/components/icons";

export function generateStaticParams() {
  return games.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const game = getGame((await params).slug);
  return {
    title: game?.title ?? "Game tidak ditemukan",
    description: game?.description,
  };
}
export default async function GameDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const game = getGame((await params).slug);
  if (!game) notFound();
  const playable = game.status === "Playable";
  return (
    <article className="detail-page">
      <Link className="back-link" href="/games">
        <Arrow back />
        Kembali ke katalog
      </Link>
      <div className="detail-heading">
        <div>
          <span className="small-label">
            {game.dimension} · {game.topic}
          </span>
          <h1>{game.title}</h1>
        </div>
        <span className={`status ${playable ? "development" : ""}`}>
          <span />
          {game.status}
        </span>
      </div>
      <div className="detail-layout">
        <div>
          <div className="detail-preview">
            <Image
              src={game.thumbnail}
              alt={`Preview ilustrasi ${game.title}`}
              width={640}
              height={400}
              sizes="(max-width: 700px) 100vw, 55vw"
              preload
            />
            <div className="preview-caption">
              {playable
                ? `Preview game · ${game.title}`
                : "Concept preview · Gameplay belum tersedia"}
            </div>
          </div>
          {playable ? (
            <Link
              className="button primary detail-play"
              href={`/games/${game.slug}/play`}
              prefetch={false}
            >
              <span aria-hidden="true">▶</span> Play Now <Arrow />
            </Link>
          ) : (
            <p className="availability">
              Coming Soon — game ini belum dapat dimainkan.
            </p>
          )}
        </div>
        <section className="detail-description">
          <h2>Tentang game</h2>
          <p>{game.description}</p>
          <h2>Fisika yang dijelajahi</h2>
          <ul>
            {game.concepts.map((concept) => (
              <li key={concept}>{concept}</li>
            ))}
          </ul>
          {playable && (
            <p className="availability">
              {game.slug === "billiard"
                ? "Langsung main di browser. Pilih Classic atau Simulation saat permainan dibuka."
                : "Buka player untuk mulai bermain dan melihat pilihan yang tersedia."}
            </p>
          )}
        </section>
      </div>
      <section className="mode-section" aria-labelledby="modes-title">
        <h2 id="modes-title">
          {game.simulationMode ? "Dua cara untuk menjelajah" : "Mode permainan"}
        </h2>
        <div className="mode-grid">
          <section className="mode-card">
            <span className="small-label">01 / PLAY</span>
            <h3>{game.slug === "billiard" ? "Classic Mode" : "Game Mode"}</h3>
            <p>{game.gameMode}</p>
            <span className="muted">
              {playable ? "Tersedia" : "Direncanakan"}
            </span>
          </section>
          {game.simulationMode && (
            <section className="mode-card">
              <span className="small-label">02 / EXPERIMENT</span>
              <h3>Simulation Mode</h3>
              <p>{game.simulationMode}</p>
              <span className="muted">
                {playable ? "Tersedia" : "Direncanakan"}
              </span>
            </section>
          )}
        </div>
      </section>
    </article>
  );
}
