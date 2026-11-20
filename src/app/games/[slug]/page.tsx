import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { games, getGame } from "@/data/games";
import { Arrow } from "@/components/icons";
import { GameLoader } from "@/games/billiard/game-loader";
export function generateStaticParams() {
  return games.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const game = getGame((await params).slug);
  return { title: game?.title ?? "Game tidak ditemukan" };
}
export default async function GameDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const game = getGame((await params).slug);
  if (!game) notFound();
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
        <span
          className={`status ${game.status !== "Coming Soon" ? "development" : ""}`}
        >
          <span />
          {game.status}
        </span>
      </div>
      {game.slug === "billiard" ? (
        <>
          <GameLoader />
          <section className="billiard-about">
            <h2>Tentang game</h2>
            <p>
              {game.description} Lima level Pocket Challenge dan lima eksperimen
              memakai model fisika yang sama.
            </p>
          </section>
        </>
      ) : (
        <>
          <div className="detail-layout">
            <div className="detail-preview">
              <Image
                src={`/images/${game.slug}.svg`}
                alt={`Preview ilustrasi ${game.title}`}
                width={640}
                height={400}
                priority
              />
              <div className="preview-caption">
                Concept preview · Gameplay belum tersedia
              </div>
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
              <p className="availability">
                {game.slug === "billiard"
                  ? "Billiard 3D akan dikembangkan pada Fase 3."
                  : "Game ini direncanakan untuk fase pengembangan berikutnya."}{" "}
                Belum dapat dimainkan.
              </p>
            </section>
          </div>
          <section className="mode-section" aria-labelledby="modes-title">
            <h2 id="modes-title">Dua cara untuk menjelajah</h2>
            <div className="mode-grid">
              <section className="mode-card">
                <span className="small-label">01 / PLAY</span>
                <h3>Game Mode</h3>
                <p>{game.gameMode}</p>
                <span className="muted">Direncanakan</span>
              </section>
              <section className="mode-card">
                <span className="small-label">02 / EXPERIMENT</span>
                <h3>Simulation Mode</h3>
                <p>{game.simulationMode}</p>
                <span className="muted">Direncanakan</span>
              </section>
            </div>
          </section>
        </>
      )}
    </article>
  );
}
