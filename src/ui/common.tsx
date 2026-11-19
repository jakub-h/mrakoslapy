import { type CardId, type Kind, cardLabel, parseCard } from "../engine/cards";
import type { DayOutcome } from "../engine/day";
import type { NightOutcome } from "../engine/night";
import { type GameState, type PlayerId, handOf, isActive } from "../engine/state";

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

const GROUP: Partial<Record<Kind, string>> = {
  mrakoslap: "life",
  zrcadlo: "life",
  mafian: "attack",
  strelec: "attack",
  masovyVrah: "attack",
  anarchista: "attack",
  ateista: "special",
};

export function Chip(props: { card: CardId; on?: boolean; muted?: boolean; spent?: boolean; onClick?: () => void; note?: string }) {
  const group = GROUP[parseCard(props.card).kind] ?? "";
  const cls = ["chip", group, props.on ? "on" : "", props.muted ? "muted" : "", props.spent ? "spent" : ""].join(" ");
  return (
    <button class={cls} onClick={props.onClick} disabled={!props.onClick}>
      {cardLabel(props.card)}
      {props.note && <small> {props.note}</small>}
    </button>
  );
}

/** Every player's hand; used cards are struck through. `onlyActive` hides dead and fake-dead players. */
export function Hands(props: { s: GameState; exhibited: PlayerId[]; onlyActive?: boolean }) {
  const { s } = props;
  const players = s.players.flatMap((_, p) => (!props.onlyActive || isActive(s, p) ? [p] : []));
  const status = (p: PlayerId) => {
    const pl = s.players[p]!;
    if (!pl.alive) return "mrtvý";
    if (pl.fakeDeadUntilNight !== null) return "Medik, fingovaně mrtvý";
    return props.exhibited.includes(p) ? "exhibován" : "";
  };
  return (
    <table class="hands">
      <tbody>
        {players.map((p) => (
          <tr key={p} class={s.players[p]!.alive ? "" : "dead"}>
            <th>
              {s.players[p]!.name}
              {status(p) && <small> ({status(p)})</small>}
            </th>
            <td class="chips">
              {handOf(s, p).map((c) => (
                <Chip key={c} card={c} spent={s.spent.includes(c)} />
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
