export type Game = {
  slug: string;
  title: string;
  dimension: "2D" | "3D";
  topic: string;
  status: "Playable" | "In Development" | "Coming Soon";
  description: string;
  concepts: readonly string[];
  gameMode: string;
  simulationMode: string;
};
export const games: readonly Game[] = [
  {
    slug: "billiard",
    title: "Billiard Physics",
    dimension: "3D",
    topic: "Momentum & Collision",
    status: "Playable",
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
    slug: "golf",
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
