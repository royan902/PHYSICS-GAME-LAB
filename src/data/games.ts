import type { GameRuntime } from "@/games/runtime";

export type Game = {
  slug: string;
  title: string;
  dimension: "2D" | "3D";
  topic: string;
  thumbnail: string;
  description: string;
  concepts: readonly string[];
  gameMode: string;
  simulationMode?: string;
} & (
  | { status: "Playable"; runtime: GameRuntime }
  | { status: "In Development" | "Coming Soon"; runtime?: never }
);
export const games: readonly Game[] = [
  {
    slug: "billiard",
    thumbnail: "/images/billiard.svg",
    title: "Billiard Physics",
    dimension: "3D",
    topic: "Momentum & Collision",
    status: "Playable",
    runtime: { kind: "native", id: "billiard" },
    description:
      "Bidik, atur kekuatan, dan pelajari bagaimana tumbukan memindahkan momentum di atas meja biliar.",
    concepts: [
      "Momentum linear",
      "Tumbukan dan restitusi",
      "Energi kinetik",
      "Hambatan gerak",
    ],
    gameMode:
      "Classic 8-ball lokal: solid dan stripe, bergantian dua pemain pada satu perangkat.",
    simulationMode:
      "Eksperimen dengan massa, restitusi, dan hambatan; amati kecepatan serta energi bola.",
  },

  {
    slug: "newton-first-law",
    title: "Newton's First Law — Bus Inertia",
    topic: "Inertia · Newton's First Law",
    description:
      "Amati penumpang bus saat gas, rem halus, dan rem mendadak. Bandingkan reaksi tubuh dengan dan tanpa sabuk pengaman.",
    concepts: [
      "Inersia",
      "Hukum I Newton",
      "Kecepatan dan percepatan",
      "Gaya luar dari sabuk pengaman",
    ],
    gameMode:
      "Kendalikan pedal bus dan sabuk, atur kekuatan gas/rem, lalu amati indikator inersia.",
    dimension: "3D",
    thumbnail: "/images/newton-first-law.png",
    status: "Playable",
    runtime: {
      kind: "html5",
      layout: "immersive",
      src: "/embedded-games/newton-first-law/index.html",
      aspectRatio: "16/9",
    },
  },
  {
    slug: "newton-second-law",
    title: "Newton's Second Law — Gravity Gun",
    topic: "Force · Mass · Acceleration",
    description:
      "Tembakkan gaya yang sama pada kayu, kargo, dan brankas. Bandingkan percepatan serta jarak benda dengan massa berbeda.",
    concepts: [
      "Gaya",
      "Massa",
      "Percepatan a = F/m",
      "Impuls dan hambatan gerak",
    ],
    gameMode:
      "Atur gaya Gravity Gun, tembak semua atau satu beban, lalu bandingkan hasil dan reset posisi.",
    dimension: "3D",
    thumbnail: "/images/newton-second-law.png",
    status: "Playable",
    runtime: {
      kind: "html5",
      layout: "immersive",
      src: "/embedded-games/newton-second-law/index.html",
      aspectRatio: "16/9",
    },
  },
  {
    slug: "newton-third-law",
    title: "Newton's Third Law — Action & Reaction",
    topic: "Action–Reaction · Recoil · Impulse",
    description:
      "Tembakkan meriam tank dan lompatkan karakter untuk melihat pasangan gaya aksi–reaksi serta efek kekuatan yang berbeda.",
    concepts: ["Hukum III Newton", "Gaya aksi–reaksi", "Recoil", "Impuls"],
    gameMode:
      "Pilih Peluru Ringan, Meriam Tank, atau Mega Plasma; uji recoil dan lompatan karakter.",
    dimension: "3D",
    thumbnail: "/images/newton-third-law.png",
    status: "Playable",
    runtime: {
      kind: "html5",
      layout: "immersive",
      src: "/embedded-games/newton-third-law/index.html",
      aspectRatio: "16/9",
    },
  },
  {
    slug: "golf",
    thumbnail: "/images/golf.svg",
    title: "Golf Physics",
    dimension: "3D",
    topic: "Force & Friction",
    status: "Coming Soon",
    description:
      "Temukan pukulan yang tepat dan jelajahi hubungan antara gaya, gesekan, dan jarak tempuh bola golf.",
    concepts: [
      "Gaya dan impuls",
      "Gesekan",
      "Jarak berhenti",
      "Energi kinetik",
    ],
    gameMode: "Selesaikan tantangan satu hole dengan pukulan yang efisien.",
    simulationMode:
      "Ubah kekuatan pukulan, massa, dan hambatan untuk membandingkan jarak berhenti.",
  },
  {
    slug: "rocket-landing",
    thumbnail: "/images/rocket-landing.svg",
    title: "Rocket Landing",
    dimension: "2D",
    topic: "Thrust & Gravity",
    status: "Coming Soon",
    description:
      "Seimbangkan dorongan dan gravitasi untuk membawa roket menuju pendaratan yang terkendali.",
    concepts: [
      "Hukum Newton",
      "Gaya dorong",
      "Gravitasi",
      "Massa dan bahan bakar",
    ],
    gameMode:
      "Daratkan roket di landasan dengan persediaan bahan bakar terbatas.",
    simulationMode:
      "Atur gravitasi, dorongan, dan bahan bakar; amati gaya serta kecepatan pendaratan.",
  },
  {
    slug: "cannon",
    thumbnail: "/images/cannon.svg",
    title: "Cannon Physics",
    dimension: "3D",
    topic: "Projectile Motion",
    status: "Coming Soon",
    description:
      "Jelajahi lintasan parabola dan hubungan sudut peluncuran dengan jangkauan sebuah proyektil.",
    concepts: [
      "Gerak parabola",
      "Komponen kecepatan",
      "Sudut peluncuran",
      "Gravitasi",
    ],
    gameMode: "Pilih sudut dan kekuatan tembakan untuk mengenai target.",
    simulationMode:
      "Bandingkan lintasan dengan mengubah kecepatan awal, sudut, dan gravitasi.",
  },
  {
    slug: "ramp-race",
    thumbnail: "/images/ramp-race.svg",
    title: "Ramp Race",
    dimension: "3D",
    topic: "Energy & Motion",
    status: "Coming Soon",
    description:
      "Lepaskan bola di lintasan miring dan lihat bagaimana energi potensial berubah menjadi gerak.",
    concepts: [
      "Energi potensial",
      "Gerak menggelinding",
      "Momen inersia",
      "Bidang miring",
    ],
    gameMode: "Bandingkan dua bola dalam perlombaan menuruni lintasan.",
    simulationMode:
      "Ubah massa, radius, kemiringan, dan gesekan untuk mengamati waktu tempuh.",
  },
];
export function getGame(slug: string) {
  return games.find((game) => game.slug === slug);
}
