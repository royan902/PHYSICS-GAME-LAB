import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/icons";
import { GameCard } from "@/components/game-card";
import { Reveal } from "@/components/reveal";
import { games } from "@/data/games";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Discover Physics
            <br />
            Through <span>Play.</span>
          </h1>
          <p>Mainkan. Eksperimen. Temukan fisika di setiap gerakan.</p>
          <div className="hero-actions">
            <Link href="/games" className="button primary">
              Explore Games <Arrow />
            </Link>
            <Link
              href="/games/billiard/play"
              prefetch={false}
              className="button secondary"
            >
              Main Billiard
            </Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 560 310" fill="none">
            <defs>
              <radialGradient id="sphere" cx="30%" cy="25%">
                <stop stopColor="#c9f9ff" />
                <stop offset=".35" stopColor="#68d9ed" />
                <stop offset="1" stopColor="#187893" />
              </radialGradient>
            </defs>
            <g stroke="#223348" strokeWidth="1">
              <path d="M40 270H530M40 210H530M40 150H530M40 90H530M100 40V280M200 40V280M300 40V280M400 40V280M500 40V280" />
            </g>
            <path d="M40 45V270H530" stroke="#7892aa" strokeWidth="1.5" />
            <path
              d="m35 55 5-10 5 10m475 210 10 5-10 5"
              stroke="#7892aa"
              strokeWidth="1.5"
            />
            <path
              d="M75 255Q275-115 495 255"
              stroke="#7fa8bd"
              strokeWidth="2"
              strokeDasharray="7 10"
            />
            <g fill="url(#sphere)">
              <circle cx="75" cy="255" r="14" />
              <circle cx="175" cy="119" r="16" />
              <circle cx="280" cy="72" r="23" />
              <circle cx="390" cy="120" r="16" />
              <circle cx="495" cy="255" r="14" />
            </g>
          </svg>
        </div>
      </section>
      <Reveal>
        <section className="featured-game" aria-labelledby="featured-title">
          <div className="featured-copy">
            <span className="small-label">Featured Game</span>
            <h2 id="featured-title">Billiard Physics 3D</h2>
            <p>Classic 8-ball atau bereksperimen dalam Simulation Mode.</p>
            <Link
              href="/games/billiard/play"
              prefetch={false}
              className="button primary"
            >
              <span aria-hidden="true">▶</span> Play Now
            </Link>
            <Link className="text-link" href="/games/billiard">
              Tentang game <Arrow />
            </Link>
          </div>
          <div className="featured-art">
            <Image
              src="/images/billiard.svg"
              alt="Ilustrasi meja Billiard Physics 3D"
              width={640}
              height={400}
              sizes="(max-width: 700px) 100vw, 50vw"
            />
          </div>
        </section>
      </Reveal>
      <Reveal>
        <section className="home-library" aria-labelledby="preview-title">
          <div className="section-heading">
            <div>
              <h2 id="preview-title">Game Library</h2>
              <p>Pilih duniamu. Ikuti rasa ingin tahumu.</p>
            </div>
            <Link className="text-link" href="/games">
              Lihat semua game <Arrow />
            </Link>
          </div>
          <div className="game-grid">
            {games.slice(0, 3).map((game, index) => (
              <GameCard key={game.slug} game={game} index={index} />
            ))}
          </div>
        </section>
      </Reveal>
    </>
  );
}
