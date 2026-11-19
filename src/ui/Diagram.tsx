import { cardLabel, parseCard } from "../engine/cards";
import type { Edge, NightOutcome } from "../engine/night";
import type { GameState, PlayerId } from "../engine/state";

const W = 520;
const H = 440;
const CX = W / 2;
const CY = H / 2;
const R = 150;
const NODE = 9;
const KINDS = { shot: "střela", tunnel: "tunel", reflect: "odraz" } as const;

type P = { x: number; y: number };
const add = (a: P, b: P, k = 1): P => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const unit = (a: P, b: P): P => {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
};

/** One night's shots on a circle of players: arrows for shots, tunnels and reflections, labelled with arrival time. */
export function Diagram(props: { s: GameState; o: NightOutcome }) {
  const { s, o } = props;
  const n = s.players.length;
  const pos = (p: PlayerId): P => ({ x: CX + R * Math.sin((2 * Math.PI * p) / n), y: CY - R * Math.cos((2 * Math.PI * p) / n) });
  const out = (p: PlayerId): P => unit({ x: CX, y: CY }, pos(p));

  const edges = new Map<string, Omit<Edge, "t"> & { ts: number[] }>();
  for (const e of o.trace.flatMap((l) => l.edges ?? [])) {
    const key = `${e.kind}-${e.from}-${e.to}`;
    edges.set(key, { ...e, ts: [...(edges.get(key)?.ts ?? []), e.t] });
  }
  for (const { from, to } of o.idleTunnels) {
    if (!edges.has(`tunnel-${from}-${to}`)) edges.set(`tunnel-${from}-${to}`, { kind: "tunnel", from, to, ts: [] });
  }
  const times = (ts: number[]) =>
    [...new Set(ts)].map((t) => {
      const count = ts.filter((x) => x === t).length;
      return count > 1 ? `t${t} ×${count}` : `t${t}`;
    });
  const perPair = new Map<string, number>();

  const marks = (p: PlayerId) => [
    ...(o.slimed.includes(p) ? ["slina"] : []),
    ...o.spent.filter((c) => s.owner[c] === p && ["zrcadlo", "mrakoslap"].includes(parseCard(c).kind)).map((c) => `✕ ${cardLabel(c)}`),
    ...(o.deadPlayers.includes(p) ? ["† umřel"] : []),
  ];

  return (
    <svg class="diagram" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Diagram střel">
      <defs>
        {Object.keys(KINDS).map((k) => (
          <marker key={k} id={`arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" class={`edge-${k}`} />
          </marker>
        ))}
      </defs>
      {[...edges.values()].map((e) => {
        const pair = `${e.from}-${e.to}`;
        const i = perPair.get(pair) ?? 0;
        perPair.set(pair, i + 1);
        const a = pos(e.from);
        let d: string;
        let label: P;
        if (e.from === e.to) {
          const u = out(e.from);
          const v = { x: -u.y, y: u.x };
          const k = 3 + i;
          const at = (along: number, side: number) => add(add(a, u, NODE * along), v, NODE * side);
          const [p1, c1, c2, p2] = [at(0.7, 0.7), at(k, 2), at(k, -2), at(0.7, -0.7)];
          d = `M${p1.x},${p1.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
          label = add(a, u, NODE * (k - 0.5));
        } else {
          const b = pos(e.to);
          const u = unit(a, b);
          const bend = 18 + 26 * i;
          const c = add({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, { x: u.y, y: -u.x }, bend);
          const start = add(a, unit(a, c), NODE + 2);
          const end = add(b, unit(b, c), NODE + 3);
          d = `M${start.x},${start.y} Q${c.x},${c.y} ${end.x},${end.y}`;
          label = { x: 0.25 * start.x + 0.5 * c.x + 0.25 * end.x, y: 0.25 * start.y + 0.5 * c.y + 0.25 * end.y };
        }
        return (
          <g key={`${e.kind}-${e.from}-${e.to}`} class={`edge-${e.kind}${e.ts.length ? "" : " idle"}`}>
            <path d={d} fill="none" marker-end={`url(#arrow-${e.kind})`} />
            <text x={label.x} y={label.y + 4} text-anchor="middle">
              {times(e.ts).join(", ")}
            </text>
          </g>
        );
      })}
      {s.players.map((pl, p) => {
        const u = out(p);
        const lines = [pl.name, ...marks(p)];
        const base = add(pos(p), u, NODE + 12);
        const anchor = u.x > 0.3 ? "start" : u.x < -0.3 ? "end" : "middle";
        const first = u.y < -0.3 ? -(lines.length - 1) : u.y > 0.3 ? 0 : -(lines.length - 1) / 2;
        return (
          <g key={p} class={o.deadPlayers.includes(p) ? "node dead" : "node"}>
            <circle cx={pos(p).x} cy={pos(p).y} r={NODE} />
            {lines.map((l, i) => (
              <text key={l} x={base.x} y={base.y + 5 + (first + i) * 15} text-anchor={anchor} class={i ? "mark" : "name"}>
                {l}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function Legend() {
  return (
    <p class="legend">
      {Object.entries(KINDS).map(([k, label]) => (
        <span key={k} class={`edge-${k}`}>
          <svg width="28" height="10">
            <line x1="0" y1="5" x2="28" y2="5" />
          </svg>{" "}
          {label}
        </span>
      ))}
      <span class="edge-tunnel idle">
        <svg width="28" height="10">
          <line x1="0" y1="5" x2="28" y2="5" />
        </svg>{" "}
        tunel bez střely
      </span>
      <span>tN = časová jednotka příletu</span>
    </p>
  );
}
