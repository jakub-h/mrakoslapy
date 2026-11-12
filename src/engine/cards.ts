export const KINDS = {
  mrakoslap: { label: "Mrakošlap", count: 7, night: true },
  mafian: { label: "Mafián", count: 3, night: true },
  strelec: { label: "Šílený střelec", count: 2, night: true },
  mag: { label: "Mág", count: 3, night: true },
  slina: { label: "Slina", count: 3, night: true },
  zrcadlo: { label: "Zrcadlo", count: 5, night: true },
  exhibicionista: { label: "Exhibicionista", count: 2, night: true },
  ateista: { label: "Ateista", count: 1, night: true },
  medik: { label: "Medik", count: 1, night: true },
  bobo: { label: "Duch Bobo", count: 1, night: true },
  meciar: { label: "Mečiar", count: 1, night: false },
  kovac: { label: "Kováč", count: 1, night: false },
  kuskona: { label: "Kuskoňa", count: 1, night: false },
  gandalf: { label: "Gandalf", count: 1, night: false },
  provazochodec: { label: "Provazochodec", count: 3, night: false },
  astronom: { label: "Astronom", count: 3, night: false },
  masovyVrah: { label: "Masový vrah", count: 1, night: false },
  anarchista: { label: "Anarchista", count: 1, night: false },
} as const;

export type Kind = keyof typeof KINDS;
export type CardId = `${Kind}-${number}`;

export const cardId = (kind: Kind, n: number): CardId => `${kind}-${n}`;

export function parseCard(id: CardId): { kind: Kind; n: number } {
  const i = id.lastIndexOf("-");
  return { kind: id.slice(0, i) as Kind, n: Number(id.slice(i + 1)) };
}

export function cardLabel(id: CardId): string {
  const { kind, n } = parseCard(id);
  return KINDS[kind].count > 1 || kind === "mrakoslap" ? `${KINDS[kind].label} ${n}` : KINDS[kind].label;
}

const REMOVED: Record<number, CardId[]> = {
  8: [],
  7: ["bobo-1", "exhibicionista-2", "zrcadlo-5", "astronom-3", "provazochodec-3"],
  6: ["bobo-1", "exhibicionista-2", "zrcadlo-5", "astronom-3"],
};

export const handSize = (players: number): number => (players === 6 ? 6 : 5);

export function deck(players: number): CardId[] {
  const removed = REMOVED[players];
  if (!removed) throw new Error(`Unsupported player count: ${players}`);
  const all = (Object.keys(KINDS) as Kind[]).flatMap((k) =>
    Array.from({ length: KINDS[k].count }, (_, i) => cardId(k, i + 1)),
  );
  return all.filter((c) => !removed.includes(c));
}

/** Sorts by kind order, then number, so the lowest-numbered card is used first. */
export function sortCards(cards: CardId[]): CardId[] {
  const order = Object.keys(KINDS);
  return [...cards].sort((a, b) => {
    const pa = parseCard(a);
    const pb = parseCard(b);
    return order.indexOf(pa.kind) - order.indexOf(pb.kind) || pa.n - pb.n;
  });
}
