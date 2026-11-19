import { type CardId, type Kind, cardLabel, parseCard } from "./cards";
import { type GameState, type PlayerId, activeCards, cardsOf, holds, isActive, ownerOf, phaseNo } from "./state";

/** A card's night action: a target, plus `from` for a Mág's tunnel. A missing entry means unused. */
export interface Action {
  target?: PlayerId;
  from?: PlayerId;
}
export type NightActions = Partial<Record<CardId, Action>>;

export interface Edge {
  kind: "shot" | "tunnel" | "reflect";
  from: PlayerId;
  to: PlayerId;
  /** Time unit in which the shot arrives at `to`. */
  t: number;
}

export interface TraceLine {
  t: number;
  text: string;
  edges?: Edge[];
}

export interface NightOutcome {
  shots: number;
  slimed: PlayerId[];
  exhibited: PlayerId[];
  /** Cards used up tonight: broken mirrors, dead Mrakošlapi, and one-use action cards. */
  spent: CardId[];
  deadPlayers: PlayerId[];
  /** The Medik announced dead, who is actually alive. */
  medik: PlayerId | null;
  returning: PlayerId[];
  /** Tunnels made tonight that no shot went through. */
  idleTunnels: { from: PlayerId; to: PlayerId }[];
  trace: TraceLine[];
}

export interface WakeStep {
  card: CardId;
  holder: PlayerId;
  /** True when an Ateista holder only nods: their Mág or Slina does nothing. */
  blocked: boolean;
}

const ATEISTA_BLOCKS: Kind[] = ["mag", "slina"];

/** Bobo cards whose holder died in the previous night or the day after it. */
function boboCards(s: GameState): CardId[] {
  return (Object.keys(s.owner) as CardId[]).filter((c) => {
    if (parseCard(c).kind !== "bobo" || s.spent.includes(c)) return false;
    const died = s.players[s.owner[c]!]!.diedInPhase;
    return died !== null && died >= s.phase - 2;
  });
}

export function wakeSteps(s: GameState): WakeStep[] {
  const n = phaseNo(s.phase);
  const kinds: Kind[] = ["mafian", ...(n % 2 === 0 ? (["strelec"] as const) : []), "mag", "slina", "exhibicionista", "medik"];
  const steps: WakeStep[] = kinds.flatMap((k) =>
    activeCards(s, k).map((card) => {
      const holder = ownerOf(s, card)!;
      return { card, holder, blocked: ATEISTA_BLOCKS.includes(k) && holds(s, holder, "ateista") };
    }),
  );
  return [...steps, ...boboCards(s).map((card) => ({ card, holder: ownerOf(s, card)!, blocked: false }))];
}

interface Fragment {
  shot: number;
  den: number;
  at: PlayerId;
  from: PlayerId;
}

export function resolveNight(s: GameState, actions: NightActions): NightOutcome {
  const name = (p: PlayerId) => s.players[p]!.name;
  const steps = wakeSteps(s);
  const stepsOf = (kind: string) => steps.filter((st) => parseCard(st.card).kind === kind && !st.blocked);
  const target = (c: CardId) => actions[c]?.target;
  const ateista = s.players.findIndex((_, p) => isActive(s, p) && holds(s, p, "ateista"));
  const reachable = (p: PlayerId | undefined): p is PlayerId => p !== undefined && isActive(s, p);
  const trace: TraceLine[] = [];
  const spent: CardId[] = [];

  const shots: { card: CardId; from: PlayerId; at: PlayerId }[] = [];
  const mafia = stepsOf("mafian");
  const mafiaTarget = target(mafia[0]?.card ?? "mafian-0");
  if (mafia.length && reachable(mafiaTarget) && mafia.every((m) => target(m.card) === mafiaTarget)) {
    for (const m of mafia) shots.push({ card: m.card, from: m.holder, at: mafiaTarget });
  } else if (mafia.length) {
    trace.push({ t: 0, text: "Mafiáni se neshodli, nepadne výstřel." });
  }
  for (const st of stepsOf("strelec")) {
    const at = target(st.card);
    if (reachable(at)) shots.push({ card: st.card, from: st.holder, at });
  }

  const tunnels = stepsOf("mag").flatMap((st) => {
    const { from, target: to } = actions[st.card] ?? {};
    if (!reachable(from) || !reachable(to)) return [];
    const why = from === to ? "tunel na sebe" : [from, to].includes(ateista) ? "Ateista" : null;
    if (!why) return [{ from, to, used: false }];
    trace.push({ t: 0, text: `Tunel ${name(from)} → ${name(to)} zmizel (${why}).` });
    return [];
  });
  const slimed = new Set<PlayerId>();
  for (const st of stepsOf("slina")) {
    const p = target(st.card);
    if (!reachable(p)) continue;
    if (p === ateista) trace.push({ t: 0, text: `Slina na ${name(p)} zmizela (Ateista).` });
    else slimed.add(p);
  }

  const mirrors = new Map(s.players.map((_, p) => [p, cardsOf(s, p, "zrcadlo")]));
  const lives = new Map(s.players.map((_, p) => [p, cardsOf(s, p, "mrakoslap")]));
  const dead = new Set<PlayerId>();
  const label = (f: Fragment) => `střela ${f.shot + 1}${f.den > 1 ? ` (1/${f.den})` : ""}`;

  shots.forEach((sh, i) =>
    trace.push({ t: 1, text: `${label({ shot: i, den: 1, at: sh.at, from: sh.from })}: ${cardLabel(sh.card)} (${name(sh.from)}) → ${name(sh.at)}`, edges: [{ kind: "shot", from: sh.from, to: sh.at, t: 1 }] }),
  );

  let pending: Fragment[] = shots.map((sh, i) => ({ shot: i, den: 1, at: sh.at, from: sh.from }));
  for (let t = 1; pending.length; t++) {
    const next: Fragment[] = [];
    const groups = new Map<PlayerId, Fragment[]>();
    for (const f of pending) groups.set(f.at, [...(groups.get(f.at) ?? []), f]);

    for (const [p, frags] of groups) {
      const what = frags.map(label).join(", ");
      if (dead.has(p)) {
        trace.push({ t, text: `${what} končí v mrtvém hráči ${name(p)}.` });
        continue;
      }
      const dests = [...new Set(tunnels.filter((tn) => tn.from === p && !tn.used).map((tn) => tn.to))];
      if (dests.length) {
        for (const d of dests) tunnels.find((tn) => tn.from === p && tn.to === d && !tn.used)!.used = true;
        for (const f of frags) for (const d of dests) next.push({ shot: f.shot, den: f.den * dests.length, at: d, from: p });
        const edges = dests.map((d): Edge => ({ kind: "tunnel", from: p, to: d, t: t + 1 }));
        trace.push({ t, text: `${what} u ${name(p)}: tunel → ${dests.map(name).join(", ")}`, edges });
        continue;
      }
      if (slimed.has(p)) {
        trace.push({ t, text: `${what} u ${name(p)}: sklouzne po slině.` });
        continue;
      }
      const mirror = mirrors.get(p)!.shift();
      if (mirror) {
        spent.push(mirror);
        for (const f of frags) next.push({ ...f, at: f.from, from: p });
        const back = [...new Set(frags.map((f) => f.from))];
        const edges = back.map((to): Edge => ({ kind: "reflect", from: p, to, t: t + 1 }));
        trace.push({ t, text: `${what} u ${name(p)}: praská ${cardLabel(mirror)}, odraz → ${back.map(name).join(", ")}`, edges });
        continue;
      }
      for (const f of frags) {
        if (dead.has(p)) {
          trace.push({ t, text: `${label(f)} končí v mrtvém hráči ${name(p)}.` });
          continue;
        }
        const life = lives.get(p)!.shift();
        if (life) spent.push(life);
        else dead.add(p);
        trace.push({ t, text: `${label(f)} u ${name(p)}: ${life ? `umírá ${cardLabel(life)}` : "umírá hráč"}` });
      }
    }
    pending = next;
  }

  const exhibited: PlayerId[] = [];
  for (const st of [...stepsOf("exhibicionista"), ...stepsOf("bobo")]) {
    const at = target(st.card);
    if (!reachable(at)) continue;
    spent.push(st.card);
    if (!exhibited.includes(at)) exhibited.push(at);
  }

  let medik: PlayerId | null = null;
  const med = stepsOf("medik")[0];
  if (med && actions[med.card] && !dead.has(med.holder)) {
    medik = med.holder;
    spent.push(med.card);
  }

  const n = phaseNo(s.phase);
  return {
    shots: shots.length,
    slimed: [...slimed],
    exhibited,
    spent,
    deadPlayers: [...dead],
    medik,
    returning: s.players.flatMap((pl, p) => (pl.fakeDeadUntilNight === n ? [p] : [])),
    idleTunnels: tunnels.filter((tn) => !tn.used).map(({ from, to }) => ({ from, to })),
    trace,
  };
}
