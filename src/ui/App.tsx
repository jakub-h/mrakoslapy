import { useState } from "preact/hooks";
import { type GameEvent, type GameState, isNight, phaseNo, replay } from "../engine/state";
import { Hands, announceNight, dayLines } from "./common";
import { Day, type DayDraft, newDay, reopenDay } from "./Day";
import { Night, type NightDraft, Trace, newNight, reopenNight } from "./Night";
import { Setup, type SetupDraft, newSetup } from "./Setup";

type Draft = { setup: SetupDraft } | { night: NightDraft } | { day: DayDraft };

interface Saved {
  log: GameEvent[];
  draft: Draft;
}

const KEY = "mrakoslapy";
const fresh = (): Saved => ({ log: [], draft: { setup: newSetup(8) } });

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : fresh();
  } catch {
    return fresh();
  }
}

function store(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {
    // Storage can be unavailable (private mode); the game still runs in memory.
  }
}

export function App() {
  const [saved, setState] = useState(load);
  const [view, setView] = useState<"game" | "cards" | "log">("game");
  const { log, draft } = saved;
  const s = replay(log);
  const setSaved = (next: Saved) => {
    store(next);
    setState(next);
  };

  const commit = (e: GameEvent) => {
    setSaved({ log: [...log, e], draft: e.type === "day" || e.type === "setup" ? { night: newNight() } : { day: newDay() } });
    window.scrollTo(0, 0);
  };
  const restart = () => confirm("Smazat rozehranou hru a začít novou?") && setSaved(fresh());

  const back = () => {
    const last = log.at(-1);
    if (!last || !confirm("Vrátit se zpět před poslední oznámení?")) return;
    const before = log.slice(0, -1);
    const draft: Draft =
      last.type === "setup"
        ? { setup: { names: last.players, hands: last.hands, selected: 0, naming: false } }
        : last.type === "night"
          ? { night: reopenNight(replay(before)!, last) }
          : { day: reopenDay(last.events) };
    setSaved({ log: before, draft });
    setView("game");
  };

  const lastNight = [...log].reverse().find((e) => e.type === "night");
  const alive = s ? s.players.filter((p) => p.alive).length : 0;
  const exhibited = s && !isNight(s.phase) && lastNight?.type === "night" ? lastNight.outcome.exhibited : [];

  return (
    <main>
      <header>
        <h1>{!s ? "Nová hra" : alive <= 1 ? "Konec hry" : `${isNight(s.phase) ? "NOC" : "DEN"} ${phaseNo(s.phase)}`}</h1>
        {s && (
          <>
            {(["game", "cards", "log"] as const).map((v) => (
              <button key={v} class={view === v ? "on" : ""} onClick={() => setView(v)}>
                {{ game: "Hra", cards: "Karty", log: "Záznam" }[v]}
              </button>
            ))}
            <button onClick={() => exportLog(log)}>Export</button>
          </>
        )}
        {log.length > 0 && <button onClick={back}>↶ Zpět</button>}
        <button onClick={restart}>Nová hra</button>
      </header>

      {!s || "setup" in draft ? (
        <Setup
          draft={"setup" in draft ? draft.setup : newSetup(8)}
          onDraft={(d) => setSaved({ log, draft: { setup: d } })}
          onStart={(players, hands) => commit({ type: "setup", players, hands })}
        />
      ) : view === "cards" ? (
        <Hands s={s} exhibited={exhibited} />
      ) : view === "log" || alive <= 1 ? (
        <Log s={s} log={log} />
      ) : "night" in draft ? (
        <Night s={s} draft={draft.night} onDraft={(d) => setSaved({ log, draft: { night: d } })} onCommit={commit} />
      ) : (
        <Day
          s={s}
          lastNight={lastNight?.type === "night" ? lastNight.outcome : null}
          draft={draft.day}
          onDraft={(d) => setSaved({ log, draft: { day: d } })}
          onCommit={commit}
        />
      )}
    </main>
  );
}

function Log(props: { s: GameState; log: GameEvent[] }) {
  const { s } = props;
  const survivors = s.players.filter((p) => p.alive).map((p) => p.name);
  let night = 0;
  let day = 0;
  return (
    <section>
      {survivors.length <= 1 && <h2>Přežil: {survivors.join(", ") || "nikdo"}</h2>}
      {props.log.map((e, i) =>
        e.type === "setup" ? null : e.type === "night" ? (
          <article key={i}>
            <h3>
              NOC {++night} {e.overridden && <small>(upraveno šéfem)</small>}
            </h3>
            {announceNight(s, e.outcome).map((l) => (
              <p key={l}>{l}</p>
            ))}
            <Trace s={s} o={e.outcome} />
          </article>
        ) : (
          <article key={i}>
            <h3>DEN {++day}</h3>
            {dayLines(e.outcome).map((l) => (
              <p key={l}>{l}</p>
            ))}
          </article>
        ),
      )}
    </section>
  );
}

function exportLog(log: GameEvent[]) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(log, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `mrakoslapi-${new Date().toISOString().slice(0, 16).replace(":", "")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
