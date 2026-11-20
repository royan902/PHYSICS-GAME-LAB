import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/data/games";
import { Arrow } from "./icons";
export function GameCard({ game }: { game: Game }) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="game-card"
      aria-label={`Lihat detail ${game.title}`}
    >
      <div className="card-art">
        <Image
          src={`/images/${game.slug}.svg`}
          alt={`Ilustrasi ${game.title}`}
          width={640}
          height={400}
          sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
        />
        <span className="dimension">{game.dimension}</span>
      </div>
      <div className="card-body">
        <h3>
          {game.title}
          <Arrow />
        </h3>
        <p>{game.topic}</p>
        <div className="card-bottom">
          <span
            className={`status ${game.status !== "Coming Soon" ? "development" : ""}`}
          >
            <span aria-hidden="true" />
            {game.status}
          </span>
          <span className="detail-label">
            View details <Arrow />
          </span>
        </div>
      </div>
    </Link>
  );
}
