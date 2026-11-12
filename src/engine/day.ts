import { type CardId, cardId, cardLabel, parseCard } from "./cards";
import { type GameState, type PlayerId, cardsOf, handOf } from "./state";

export type DayEvent =
  | { type: "anarchista"; card: CardId; target: PlayerId }
  | { type: "astronom"; card: CardId }
  | { type: "execution"; target: PlayerId; voters: PlayerId[] };

export interface DayOutcome {
  spent: CardId[];
  deadPlayers: PlayerId[];
  gained: { card: CardId; player: PlayerId }[];
  lines: string[];
}

/** Whether a vote needs the voter list: the target holds Masový vrah, Kuskoňa or Gandalf. */
export function votersMatter(s: GameState, target: PlayerId): boolean {
  return handOf(s, target).some((c) => ["masovyVrah", "kuskona", "gandalf"].includes(parseCard(c).kind));
}

export function resolveDay(s: GameState, events: DayEvent[]): DayOutcome {
  const name = (p: PlayerId) => s.players[p]!.name;
  const has = (p: PlayerId, kind: string) => handOf(s, p).some((c) => parseCard(c).kind === kind);
  const lives = new Map(s.players.map((_, p) => [p, cardsOf(s, p, "mrakoslap")]));
  const dead = new Set<PlayerId>();
  const out: DayOutcome = { spent: [], deadPlayers: [], gained: [], lines: [] };

  /** Takes the lowest Mrakošlap, else the life. Returns false if the player was already dead. */
  const hit = (p: PlayerId): boolean => {
    if (dead.has(p)) return false;
    const life = lives.get(p)!.shift();
    if (life) {
      out.spent.push(life);
      out.lines.push(`Umírá ${cardLabel(life)} (${name(p)}).`);
    } else {
      dead.add(p);
      out.lines.push(`Umírá ${name(p)}.`);
    }
    return true;
  };

  for (const e of events) {
    if (e.type === "anarchista") {
      out.spent.push(e.card);
      out.lines.push(`Anarchista střílí na ${name(e.target)}.`);
      hit(e.target);
    } else if (e.type === "astronom") {
      out.spent.push(e.card);
      out.lines.push("NOC! (Astronom)");
    } else {
      const rope = cardsOf(s, e.target, "provazochodec")[0];
      if (rope) {
        out.spent.push(rope);
        out.lines.push(`${name(e.target)} utekl z provazu.`);
        continue;
      }
      if (!hit(e.target)) continue;
      for (const v of e.voters) {
        const pair = (has(v, "kuskona") && has(e.target, "gandalf")) || (has(v, "gandalf") && has(e.target, "kuskona"));
        if (!pair || dead.has(v)) continue;
        const card = cardId("mrakoslap", s.nextMrakoslap + out.gained.length);
        out.gained.push({ card, player: v });
        lives.get(v)!.push(card);
        out.lines.push(`${name(v)} získává ${cardLabel(card)}.`);
      }
      if (has(e.target, "masovyVrah")) {
        out.lines.push("Masový vrah střílí na všechny, kdo hlasovali pro jeho smrt.");
        for (const v of e.voters) if (v !== e.target) hit(v);
      }
    }
  }
  out.deadPlayers = [...dead];
  return out;
}
