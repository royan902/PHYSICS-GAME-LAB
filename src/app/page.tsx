import Link from "next/link";
import { Arrow } from "@/components/icons";
import { GameLibrary } from "@/components/game-library";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Discover Physics
            <br />
            Through Play<span>.</span>
          </h1>
          <p>
            Play games, explore motion, and discover the science behind every
            move.
          </p>
          <Link href="/games" className="button primary">
            Explore Games <Arrow />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 600 360" fill="none">
            <g stroke="#294c76" opacity=".5">
              <path d="M0 300h600M0 260h600M0 220h600M0 180h600M100 360l160-220M250 360l60-220M400 360l-40-220M550 360L410 140" />
            </g>
            <path d="M90 270l180-120 50 22-180 120z" fill="#5b9fe2" />
            <path d="M140 291l180-119v75L140 312z" fill="#28538a" />
            <path d="M90 270l50 21v21l-50-20z" fill="#8cbcf0" />
            <path
              d="M245 139Q380-50 510 210"
              stroke="#b1d8ff"
              strokeWidth="3"
              strokeDasharray="9 12"
            />
            <circle cx="386" cy="76" r="29" fill="#3a85cf" />
            <circle cx="377" cy="67" r="14" fill="#77b7f3" />
            <path d="M453 245l40-23 43 22-40 24z" fill="#79b4ed" />
            <path d="M453 245v46l43 24v-47z" fill="#3779ba" />
            <path d="M496 268l40-24v47l-40 24z" fill="#28538a" />
          </svg>
        </div>
      </section>
      <GameLibrary />
    </>
  );
}
