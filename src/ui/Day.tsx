import type { CardId } from "../engine/cards";
import { type DayEvent, resolveDay, votersMatter } from "../engine/day";
import { type GameEvent, type GameState, type PlayerId, activeCards, isActive } from "../engine/state";
import { Hands, PlayerButtons, announceNight, dayLines } from "./common";
import type { NightOutcome } from "../engine/night";

export interface DayDraft {
  anarchista: { card: CardId; target: PlayerId } | null;
  verdict: { type: "none" } | { type: "execution"; target: PlayerId; voters: PlayerId[] } | { type: "astronom"; card: CardId };
}

export const newDay = (): DayDraft => ({ anarchista: null, verdict: { type: "none" } });

export function toEvents(d: DayDraft): DayEvent[] {
  const events: DayEvent[] = d.anarchista ? [{ type: "anarchista", ...d.anarchista }] : [];
  return d.verdict.type === "none" ? events : [...events, d.verdict];
}

export function reopenDay(events: DayEvent[]): DayDraft {
  const a = events.find((e) => e.type === "anarchista");
  const verdict = events.find((e) => e.type !== "anarchista");
  return { anarchista: a ? { card: a.card, target: a.target } : null, verdict: verdict ?? { type: "none" } };
}

export function Day(props: {
  s: GameState;
  lastNight: NightOutcome | null;
  draft: DayDraft;
  onDraft: (d: DayDraft) => void;
  onCommit: (e: GameEvent) => void;
}) {
  const { s, draft } = props;
  const name = (p: PlayerId) => s.players[p]!.name;
  const living = s.players.flatMap((_, p) => (isActive(s, p) ? [p] : []));
  const set = (d: Partial<DayDraft>) => props.onDraft({ ...draft, ...d });
  const anarchista = activeCards(s, "anarchista")[0];
  const astronoms = activeCards(s, "astronom");
  const v = draft.verdict;
  const outcome = resolveDay(s, toEvents(draft));

  return (
    <section>
      {props.lastNight && (
        <>
          <h2>Oznámení noci</h2>
          <div class="announce">
            {announceNight(s, props.lastNight).map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
        </>
      )}
      <h2>Karty hráčů</h2>
      <Hands s={s} exhibited={props.lastNight?.exhibited ?? []} onlyActive />

      <h2>Konec dne</h2>
      {anarchista && (
        <>
          <h3>Anarchista ({name(s.owner[anarchista]!)}) vystřelil na</h3>
          <PlayerButtons
            s={s}
            options={living}
            selected={draft.anarchista ? [draft.anarchista.target] : []}
            onPick={(p) => set({ anarchista: draft.anarchista?.target === p ? null : { card: anarchista, target: p } })}
          />
        </>
      )}
      <h3>Hlasování</h3>
      <div class="row">
        <button class={v.type === "none" ? "on" : ""} onClick={() => set({ verdict: { type: "none" } })}>
          Nikdo nepopraven
        </button>
        {astronoms.map((c) => (
          <button key={c} class={v.type === "astronom" && v.card === c ? "on" : ""} onClick={() => set({ verdict: { type: "astronom", card: c } })}>
            NOC! – {name(s.owner[c]!)} (Astronom)
          </button>
        ))}
      </div>
      <h3>Odhlasován k popravě</h3>
      <PlayerButtons
        s={s}
        options={living}
        selected={v.type === "execution" ? [v.target] : []}
        onPick={(p) => set({ verdict: { type: "execution", target: p, voters: [] } })}
      />
      {v.type === "execution" && votersMatter(s, v.target) && (
        <>
          <h3>Kdo hlasoval pro smrt {name(v.target)}</h3>
          <PlayerButtons
            s={s}
            options={living}
            selected={v.voters}
            onPick={(p) => set({ verdict: { ...v, voters: v.voters.includes(p) ? v.voters.filter((x) => x !== p) : [...v.voters, p] } })}
          />
        </>
      )}
      <div class="announce">
        {dayLines(outcome).map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      <button class="primary" onClick={() => props.onCommit({ type: "day", events: toEvents(draft), outcome })}>
        Oznámit NOC
      </button>
    </section>
  );
}
