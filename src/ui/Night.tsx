import { type CardId, type Kind, cardLabel, parseCard } from "../engine/cards";
import { type NightActions, type NightOutcome, resolveNight, wakeSteps } from "../engine/night";
import { type GameEvent, type GameState, type PlayerId, cardsOf, isActive, phaseNo } from "../engine/state";
import { Chip, PlayerButtons, announceNight } from "./common";

export interface NightDraft {
  step: number;
  actions: NightActions;
  /** Šéf hry's corrections to the engine's result; null keeps the engine's. */
  override: { lives: CardId[]; dead: PlayerId[] } | null;
}

export const newNight = (): NightDraft => ({ step: 0, actions: {}, override: null });

interface Step {
  cards: CardId[];
  kind: Kind;
  holder: PlayerId | null;
  blocked: boolean;
}

/** Wake steps, with night 1's Mafiáni merged into one joint step. */
function steps(s: GameState): Step[] {
  const raw = wakeSteps(s).map((w) => ({ cards: [w.card], kind: parseCard(w.card).kind, holder: w.holder, blocked: w.blocked }));
  const mafia = raw.filter((w) => w.kind === "mafian");
  if (phaseNo(s.phase) > 1 || mafia.length < 2) return raw;
  return [{ cards: mafia.flatMap((m) => m.cards), kind: "mafian", holder: null, blocked: false }, ...raw.filter((w) => w.kind !== "mafian")];
}

export function Night(props: { s: GameState; draft: NightDraft; onDraft: (d: NightDraft) => void; onCommit: (e: GameEvent) => void }) {
  const { s, draft } = props;
  const list = steps(s);
  const name = (p: PlayerId) => s.players[p]!.name;
  const targets = s.players.flatMap((_, p) => (isActive(s, p) ? [p] : []));
  const set = (d: Partial<NightDraft>) => props.onDraft({ ...draft, override: null, ...d });

  if (draft.step < list.length) {
    const st = list[draft.step]!;
    const act = draft.actions[st.cards[0]!];
    const write = (a: { target?: PlayerId; from?: PlayerId } | undefined, advance: boolean) => {
      const actions = { ...draft.actions };
      for (const c of st.cards) actions[c] = a;
      set({ actions, step: draft.step + (advance ? 1 : 0) });
    };
    const title =
      st.holder === null ? "Probouzí se Mafiáni (všichni zaráz)" : `Probouzí se ${cardLabel(st.cards[0]!)} – ${name(st.holder)}`;

    return (
      <section>
        <p class="hint">
          Krok {draft.step + 1} / {list.length}
        </p>
        <h2>{title}</h2>
        {st.blocked ? (
          <p>Kývá hlavou: má Ateistu, funkci nepoužije.</p>
        ) : st.kind === "mag" ? (
          <>
            <h3>Tunel z koho</h3>
            <PlayerButtons s={s} options={targets} selected={act?.from === undefined ? [] : [act.from]} onPick={(p) => write({ ...act, from: p }, act?.target !== undefined)} />
            <h3>Na koho</h3>
            <PlayerButtons s={s} options={targets} selected={act?.target === undefined ? [] : [act.target]} onPick={(p) => write({ ...act, target: p }, act?.from !== undefined)} />
          </>
        ) : st.kind === "medik" ? (
          <div class="row">
            <button class={act ? "on" : ""} onClick={() => write({ target: st.holder! }, true)}>
              Použije (fingovaná smrt)
            </button>
          </div>
        ) : (
          <PlayerButtons s={s} options={targets} selected={act?.target === undefined ? [] : [act.target]} onPick={(p) => write({ target: p }, true)} />
        )}
        <div class="row">
          <button disabled={draft.step === 0} onClick={() => set({ step: draft.step - 1 })}>
            ← Zpět
          </button>
          <button onClick={() => write(st.blocked ? undefined : act, true)}>{act || st.blocked ? "Další →" : "Nepoužije →"}</button>
          {act && !st.blocked && <button onClick={() => write(undefined, false)}>Zrušit volbu</button>}
        </div>
      </section>
    );
  }

  const engine = resolveNight(s, draft.actions);
  const isLife = (c: CardId) => ["zrcadlo", "mrakoslap"].includes(parseCard(c).kind);
  const lives = draft.override?.lives ?? engine.spent.filter(isLife);
  const dead = draft.override?.dead ?? engine.deadPlayers;
  const outcome: NightOutcome = { ...engine, spent: [...engine.spent.filter((c) => !isLife(c)), ...lives], deadPlayers: dead };
  const edit = (o: { lives?: CardId[]; dead?: PlayerId[] }) => props.onDraft({ ...draft, override: { lives, dead, ...o } });
  const flip = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  const candidates = targets.flatMap((p) => [...cardsOf(s, p, "zrcadlo"), ...cardsOf(s, p, "mrakoslap")]);
  const ownerName = (c: CardId) => name(s.owner[c]!);

  return (
    <section>
      <h2>Výsledek noci</h2>
      <div class="announce">
        {announceNight(s, outcome).map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>
      {outcome.medik !== null && <p class="hint">Jen pro šéfa: {name(outcome.medik)} žije (Medik), vrátí se na konci příští noci.</p>}
      <details>
        <summary>Upravit výsledek {draft.override && "(upraveno)"}</summary>
        <p class="hint">Ťuknutím přepneš, co praská a co umírá. Oprava vstupů (← Zpět) úpravy zruší.</p>
        <div class="chips">
          {candidates.map((c) => (
            <Chip key={c} card={c} on={lives.includes(c)} note={`(${ownerName(c)})`} onClick={() => edit({ lives: flip(lives, c) })} />
          ))}
        </div>
        <h3>Umírají</h3>
        <PlayerButtons s={s} options={targets} selected={dead} onPick={(p) => edit({ dead: flip(dead, p) })} />
      </details>
      <details>
        <summary>Cesty střel</summary>
        <Trace lines={outcome.trace} />
      </details>
      <div class="row">
        <button onClick={() => set({ step: list.length - 1 })} disabled={!list.length}>
          ← Zpět
        </button>
        <button class="primary" onClick={() => props.onCommit({ type: "night", actions: draft.actions, outcome, overridden: draft.override !== null })}>
          Oznámit DEN
        </button>
      </div>
    </section>
  );
}

export function Trace(props: { lines: NightOutcome["trace"] }) {
  if (!props.lines.length) return <p class="hint">Žádné střely.</p>;
  return (
    <ol class="trace">
      {props.lines.map((l, i) => (
        <li key={i}>
          <b>t{l.t}</b> {l.text}
        </li>
      ))}
    </ol>
  );
}
