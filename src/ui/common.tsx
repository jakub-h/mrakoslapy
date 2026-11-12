import { type CardId, cardLabel, parseCard } from "../engine/cards";
import type { DayOutcome } from "../engine/day";
import type { NightOutcome } from "../engine/night";
import type { GameState, PlayerId } from "../engine/state";

export function PlayerButtons(props: {
  s: GameState;
  options: PlayerId[];
  selected?: PlayerId[];
  onPick: (p: PlayerId) => void;
}) {
  return (
    <div class="grid">
      {props.options.map((p) => (
        <button key={p} class={props.selected?.includes(p) ? "on" : ""} onClick={() => props.onPick(p)}>
          {props.s.players[p]!.name}
        </button>
      ))}
    </div>
  );
}

export function Chip(props: { card: CardId; on?: boolean; muted?: boolean; onClick?: () => void; note?: string }) {
  const night = ["mrakoslap", "zrcadlo"].includes(parseCard(props.card).kind) ? "life" : "";
  const cls = ["chip", night, props.on ? "on" : "", props.muted ? "muted" : ""].join(" ");
  return (
    <button class={cls} onClick={props.onClick} disabled={!props.onClick}>
      {cardLabel(props.card)}
      {props.note && <small> {props.note}</small>}
    </button>
  );
}

function numbers(cards: CardId[], kind: string): string {
  const ns = cards.filter((c) => parseCard(c).kind === kind).map((c) => parseCard(c).n);
  return ns.length > 1 ? `${ns.slice(0, -1).join(", ")} a ${ns.at(-1)}` : ns.join("");
}

/** The DEN announcement lines, in the order the rules list them. */
export function announceNight(s: GameState, o: NightOutcome): string[] {
  const name = (p: PlayerId) => s.players[p]!.name;
  const lines = [`Padlo výstřelů: ${o.shots}.`];
  if (o.slimed.length) lines.push(`Poslintaní: ${o.slimed.map(name).join(", ")}.`);
  if (o.exhibited.length) lines.push(`Exhibovaní: ${o.exhibited.map(name).join(", ")}.`);
  const mirrors = numbers(o.spent, "zrcadlo");
  if (mirrors) lines.push(`Praská Zrcadlo číslo ${mirrors}.`);
  const lives = numbers(o.spent, "mrakoslap");
  if (lives) lines.push(`Umírá Mrakošlap číslo ${lives}.`);
  const dead = [...o.deadPlayers, ...(o.medik === null ? [] : [o.medik])];
  if (dead.length) lines.push(`Umřel: ${dead.map(name).join(", ")}.`);
  if (o.returning.length) lines.push(`Vrací se do hry: ${o.returning.map(name).join(", ")}.`);
  return lines;
}

export const dayLines = (o: DayOutcome): string[] => (o.lines.length ? o.lines : ["Nic se nestalo."]);
