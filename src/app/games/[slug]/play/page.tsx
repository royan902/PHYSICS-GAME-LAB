import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { games, getGame } from "@/data/games";
import { GamePlayer } from "@/components/game-player/game-player";

export function generateStaticParams() {
  return games
    .filter((game) => game.status === "Playable")
    .map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const game = getGame((await params).slug);
  return {
    title: game ? `Play ${game.title}` : "Game tidak ditemukan",
    robots: { index: false },
  };
}
export default async function Play({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const game = getGame((await params).slug);
  if (!game || game.status !== "Playable") notFound();
  return <GamePlayer game={game} />;
}
