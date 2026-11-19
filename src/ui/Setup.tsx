import { type CardId, deck, handSize, sortCards } from "../engine/cards";
import { Chip } from "./common";

export interface SetupDraft {
  names: string[];
  hands: CardId[][];
  selected: number;
  naming: boolean;
}

export const newSetup = (count: number): SetupDraft => ({
  names: Array.from({ length: count }, () => ""),
  hands: Array.from({ length: count }, () => []),
  selected: 0,
  naming: true,
});

export function Setup(props: {
  draft: SetupDraft;
  onDraft: (d: SetupDraft) => void;
  onStart: (names: string[], hands: CardId[][]) => void;
}) {
  const { names, hands, selected, naming } = props.draft;
  const count = names.length;
  const size = handSize(count);
  const ownerOf = (c: CardId) => hands.findIndex((h) => h.includes(c));
  const set = (d: Partial<SetupDraft>) => props.onDraft({ ...props.draft, ...d });

  const namesOk = names.every((n) => n.trim()) && new Set(names.map((n) => n.trim())).size === count;
  const handsOk = hands.every((h) => h.length === size);

  const toggle = (c: CardId) => {
    const owner = ownerOf(c);
    const next = hands.map((h) => h.filter((x) => x !== c));
    if (owner !== selected) {
      if (next[selected]!.length >= size) return;
      next[selected] = sortCards([...next[selected]!, c]);
    }
    const full = next[selected]!.length === size;
    const after = full ? next.findIndex((h) => h.length < size) : -1;
    set({ hands: next, selected: after >= 0 ? after : selected });
  };

  if (naming) {
    return (
      <section>
        <h2>Hráči</h2>
        <div class="row">
          {[6, 7, 8].map((n) => (
            <button key={n} class={n === count ? "on" : ""} onClick={() => props.onDraft(resize(props.draft, n))}>
              {n} hráčů
            </button>
          ))}
        </div>
        <p class="hint">Dvojici zadej jako jednoho hráče. Pořadí jmen je pořadí tlačítek po celou hru.</p>
        {names.map((n, i) => (
          <input
            key={i}
            value={n}
            placeholder={`Hráč ${i + 1}`}
            onInput={(e) => set({ names: names.map((x, j) => (j === i ? e.currentTarget.value : x)) })}
          />
        ))}
        <button class="primary" disabled={!namesOk} onClick={() => set({ naming: false })}>
          Zadat karty
        </button>
      </section>
    );
  }

  return (
    <section>
      <h2>Karty</h2>
      <p class="hint">
        Vyber hráče a ťukni na jeho karty ({size} na hráče). Ťuknutí na přidělenou kartu ji vrátí nebo přesune.
      </p>
      <div class="grid">
        {names.map((n, i) => (
          <button key={i} class={i === selected ? "on" : ""} onClick={() => set({ selected: i })}>
            {n} <small>{hands[i]!.length}/{size}</small>
          </button>
        ))}
      </div>
      <div class="chips">
        {deck(count).map((c) => {
          const owner = ownerOf(c);
          return (
            <Chip
              key={c}
              card={c}
              on={owner === selected}
              muted={owner >= 0 && owner !== selected}
              note={owner >= 0 && owner !== selected ? `(${names[owner]})` : undefined}
              onClick={() => toggle(c)}
            />
          );
        })}
      </div>
      <div class="row">
        <button onClick={() => set({ naming: true })}>Zpět ke jménům</button>
        <button class="primary" disabled={!handsOk} onClick={() => props.onStart(names.map((n) => n.trim()), hands)}>
          Začít hru (NOC 1)
        </button>
      </div>
    </section>
  );
}

function resize(d: SetupDraft, count: number): SetupDraft {
  const fresh = newSetup(count);
  return { ...fresh, names: fresh.names.map((_, i) => d.names[i] ?? "") };
}
