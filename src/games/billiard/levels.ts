export type Level = {
  name: string;
  limit: number;
  cue: [number, number];
  targets: [number, number][];
  hint: string;
  angle: number;
  power: number;
};
export const LEVELS: Level[] = [
  {
    name: "First Shot",
    limit: 3,
    cue: [0, 0.28],
    targets: [[0, -0.28]],
    hint: "Bidik lurus ke bola 1 menuju pocket tengah. Mulai dengan power 25%.",
    angle: -90,
    power: 25,
  },
  {
    name: "Double Hit",
    limit: 6,
    cue: [-0.6, 0.08],
    targets: [
      [0, -0.4],
      [0.9, 0.43],
    ],
    hint: "Dua target, dua jalur. Utamakan bola yang dekat pocket.",
    angle: -39,
    power: 32,
  },
  {
    name: "Angle Master",
    limit: 5,
    cue: [0.18, 0.08],
    targets: [
      [0.88, -0.42],
      [0, -0.43],
    ],
    hint: "Sejajarkan pusat bola target dengan pocket sudut; bidik sedikit di belakang target.",
    angle: -36,
    power: 30,
  },
  {
    name: "Bank Shot",
    limit: 6,
    cue: [-0.8, 0.25],
    targets: [[0.42, 0.15]],
    hint: "Pantulkan bola putih ke bantalan atas. Coba sudut −57.5° dan power 45%. Restitusi mengubah sudut pantul.",
    angle: -57.5,
    power: 45,
  },
  {
    name: "Pocket Challenge",
    limit: 8,
    cue: [-0.65, 0.1],
    targets: [
      [0, -0.4],
      [0.92, -0.44],
      [0.92, 0.44],
    ],
    hint: "Tiga target. Rencanakan posisi bola putih, jangan selalu memakai power tinggi.",
    angle: -38,
    power: 30,
  },
];
