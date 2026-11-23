import Image from "next/image";
import Link from "next/link";
import type { Game } from "@/data/games";
import { Arrow } from "./icons";
export function GameCard({
  game,
  index = 0,
  heading: Heading = "h3",
}: {
  game: Game;
  index?: number;
  heading?: "h3" | "h4";
}) {
  return (
    <Link
      href={`/games/${game.slug}`}
      className="game-card"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="card-art">
        <Image
          src={game.thumbnail}
          alt=""
          width={640}
          height={400}
          sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
        />
        <span className="dimension">{game.dimension}</span>
      </div>
      <div className="card-body">
        <Heading>
          {game.title}
          <Arrow />
        </Heading>
        <p>{game.topic}</p>
        <div className="card-bottom">
          <span
            className={`status ${game.status === "Playable" ? "development" : ""}`}
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
