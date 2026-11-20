export const EXPERIMENTS = [
  "Momentum",
  "Tumbukan dua bola",
  "Koefisien gesek",
  "Energi kinetik",
  "Koefisien restitusi",
] as const;
export type Experiment = (typeof EXPERIMENTS)[number];
export function experimentPositions(
  experiment: Experiment,
): [number, number][] {
  return ["Momentum", "Tumbukan dua bola", "Koefisien restitusi"].includes(
    experiment,
  )
    ? [
        [-0.65, 0.18],
        [0, 0.18],
      ]
    : [[-0.8, 0.18]];
}
