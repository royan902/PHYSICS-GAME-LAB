export type Group = "solid" | "stripe";
export const groupOf = (id: number): Group | null =>
  id >= 1 && id <= 7 ? "solid" : id >= 9 && id <= 15 ? "stripe" : null;
export type ShotRecord = {
  call: { ball: number; pocket: number } | null;
  destinations: Record<number, number>;
  break: boolean;
  first: number | null;
  pocketed: number[];
  off: number[];
  rails: number[];
  railAfterContact: boolean;
  illegalHeadContact?: boolean;
  group: Group | null;
  remaining: number;
};
// WPA section 4: the declaration is frozen before the stroke.
export function resolveShot(shot: ShotRecord) {
  const { first, group, pocketed, off } = shot;
  const called =
    !!shot.call &&
    pocketed.includes(shot.call.ball) &&
    shot.destinations[shot.call.ball] === shot.call.pocket;
  let foul = "";
  const wrongFirst = group
    ? shot.remaining === 0
      ? first !== 8
      : groupOf(first ?? 0) !== group
    : first === 8;
  if (pocketed.includes(0)) foul = "Scratch";
  else if (off.length) foul = "Bola keluar meja";
  else if (first === null) foul = "Tidak menyentuh bola";
  else if (shot.illegalHeadContact)
    foul = "Bola putih harus melintasi head string lebih dahulu";
  else if (!shot.break && wrongFirst) foul = "First contact tidak legal";
  else if (
    shot.break &&
    !pocketed.some((id) => id > 0) &&
    new Set(shot.rails.filter((id) => id > 0)).size < 4
  )
    foul = "Break: masukkan bola atau 4 bola objek menyentuh bantalan";
  else if (!shot.break && !pocketed.length && !shot.railAfterContact)
    foul = "Tidak ada bola ke bantalan setelah kontak";
  if (!shot.break && (pocketed.includes(8) || off.includes(8))) {
    const win =
      !foul &&
      !!group &&
      shot.remaining === 0 &&
      called &&
      shot.call?.ball === 8;
    if (!win && !foul)
      foul = shot.remaining
        ? "Bola 8 masuk terlalu awal"
        : "Pocket bola 8 tidak sesuai call";
    return {
      foul,
      result: win ? ("win" as const) : ("loss" as const),
      assigned: null,
      keepTurn: false,
      respotEight: false,
    };
  }
  const assigned =
    !foul && !shot.break && !group && called ? groupOf(shot.call!.ball) : null;
  const own = group ?? assigned;
  const keepTurn =
    !foul &&
    (shot.break
      ? pocketed.some((id) => id > 0)
      : called && groupOf(shot.call!.ball) === own);
  return {
    foul,
    result: null,
    assigned,
    keepTurn,
    respotEight: shot.break && (pocketed.includes(8) || off.includes(8)),
  };
}
