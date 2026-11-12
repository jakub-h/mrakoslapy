import { type CardId, type Kind, parseCard, sortCards } from "./cards";
import type { DayEvent, DayOutcome } from "./day";
import type { NightActions, NightOutcome } from "./night";

export type PlayerId = number;

export interface Player {
  name: string;
  alive: boolean;
  /** Set while a Medik fakes death; they return at the end of this night. */
  fakeDeadUntilNight: number | null;
  diedInPhase: number | null;
}

export interface GameState {
  players: Player[];
  owner: Partial<Record<CardId, PlayerId>>;
  spent: CardId[];
  nextMrakoslap: number;
  /** 1 = night 1, 2 = day 1, 3 = night 2, ... */
  phase: number;
}

export type GameEvent =
  | { type: "setup"; players: string[]; hands: CardId[][] }
  | { type: "night"; actions: NightActions; outcome: NightOutcome; overridden: boolean }
  | { type: "day"; events: DayEvent[]; outcome: DayOutcome };

export const isNight = (phase: number): boolean => phase % 2 === 1;
export const phaseNo = (phase: number): number => Math.ceil(phase / 2);

export const isActive = (s: GameState, p: PlayerId): boolean =>
  s.players[p]!.alive && s.players[p]!.fakeDeadUntilNight === null;

export const ownerOf = (s: GameState, c: CardId): PlayerId | undefined => s.owner[c];

/** All cards a player was dealt or gained, spent or not. */
export const handOf = (s: GameState, p: PlayerId): CardId[] =>
  sortCards((Object.keys(s.owner) as CardId[]).filter((c) => s.owner[c] === p));

/** Unspent cards of a player, optionally of one kind, lowest number first. */
export const cardsOf = (s: GameState, p: PlayerId, kind?: Kind): CardId[] =>
  handOf(s, p).filter((c) => !s.spent.includes(c) && (!kind || parseCard(c).kind === kind));

export const holds = (s: GameState, p: PlayerId, kind: Kind): boolean => cardsOf(s, p, kind).length > 0;

/** Unspent cards of a kind whose holders are active, in card-number order. */
export const activeCards = (s: GameState, kind: Kind): CardId[] =>
  sortCards(
    (Object.keys(s.owner) as CardId[]).filter(
      (c) => parseCard(c).kind === kind && !s.spent.includes(c) && isActive(s, s.owner[c]!),
    ),
  );

export function setup(players: string[], hands: CardId[][]): GameState {
  const owner: Partial<Record<CardId, PlayerId>> = {};
  hands.forEach((hand, p) => hand.forEach((c) => (owner[c] = p)));
  return {
    players: players.map((name) => ({ name, alive: true, fakeDeadUntilNight: null, diedInPhase: null })),
    owner,
    spent: [],
    nextMrakoslap: 8,
    phase: 1,
  };
}

export function applyNight(s: GameState, o: NightOutcome): GameState {
  const n = phaseNo(s.phase);
  const players = s.players.map((pl, p) => ({
    ...pl,
    alive: pl.alive && !o.deadPlayers.includes(p),
    diedInPhase: o.deadPlayers.includes(p) ? s.phase : pl.diedInPhase,
    fakeDeadUntilNight: p === o.medik ? n + 1 : pl.fakeDeadUntilNight === n ? null : pl.fakeDeadUntilNight,
  }));
  return { ...s, players, spent: [...s.spent, ...o.spent], phase: s.phase + 1 };
}

export function applyDay(s: GameState, o: DayOutcome): GameState {
  const owner = { ...s.owner };
  for (const g of o.gained) owner[g.card] = g.player;
  const players = s.players.map((pl, p) => ({
    ...pl,
    alive: pl.alive && !o.deadPlayers.includes(p),
    diedInPhase: o.deadPlayers.includes(p) ? s.phase : pl.diedInPhase,
  }));
  return {
    ...s,
    owner,
    players,
    spent: [...s.spent, ...o.spent],
    nextMrakoslap: s.nextMrakoslap + o.gained.length,
    phase: s.phase + 1,
  };
}

export function replay(log: GameEvent[]): GameState | null {
  let s: GameState | null = null;
  for (const e of log) {
    if (e.type === "setup") s = setup(e.players, e.hands);
    else if (e.type === "night") s = applyNight(s!, e.outcome);
    else s = applyDay(s!, e.outcome);
  }
  return s;
}
