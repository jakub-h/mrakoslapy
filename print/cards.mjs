// Usage: node cards.mjs sample|all > out.html (see README)
const TITLE = "Mrakošlapy";

// 24×24 icons as SVG markup; class "f" = filled.
const P = (d) => `<path d="${d}"/>`;
const C = (x, y, r, cls = "") => `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;
const cross = (x, y) => P(`M${x} ${y - 2.3}v4.8M${x - 1.5} ${y - 0.8}h3`);
const orthodox = (x, y) => P(`M${x} ${y - 2.6}v5.4M${x - 0.8} ${y - 1.8}h1.6M${x - 1.6} ${y - 0.6}h3.2M${x - 1} ${y + 1.6}l2 -0.8`);
const david = (x, y, r = 2.3) =>
  P(`M${x} ${y - r}L${x + 0.87 * r} ${y + r / 2}H${x - 0.87 * r}z`) + P(`M${x} ${y + r}L${x + 0.87 * r} ${y - r / 2}H${x - 0.87 * r}z`);
const crescent = (x, y) => P(`M${x + 1} ${y - 2.2}A2.3 2.3 0 1 0 ${x + 1} ${y + 2.2}A1.9 1.9 0 1 1 ${x + 1} ${y - 2.2}z`);
const ICONS = {
  cloud: P("M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 9.5 4.25 4.25 0 0 0 7 18z"),
  fedora: P("M2 16.5c4 2.5 16 2.5 20 0") + P("M5.2 15.6 7 7.5c1.5-1.2 3.5 0 5 1 1.5-1 3.5-2.2 5-1l1.8 8.1") + P("M5.9 12.8c4 1.2 8.2 1.2 12.2 0"),
  crosshair: P("M12 2v5M12 17v5M2 12h5M17 12h5") + C(12, 12, 7) + C(12, 12, 1.3, "f"),
  portal:
    `<ellipse class="blue" cx="5" cy="12" rx="2.6" ry="7.5"/><ellipse class="orange" cx="19" cy="12" rx="2.6" ry="7.5"/>` +
    P("M8.5 12h6.5M13 9.8l2.2 2.2-2.2 2.2"),
  drop: P("M12 3c4 5 6 8.5 6 11a6 6 0 0 1-12 0c0-2.5 2-6 6-11z") + P("M9 14.5a3 3 0 0 0 2 2.6"),
  mirror: `<ellipse cx="12" cy="10" rx="6" ry="8"/>` + P("M12 18v4M9 22h6") + P("M9 6.5 7.5 9.5M11.5 5.5 7.8 12.5"),
  flasher:
    C(12, 4, 2) + P("M10.3 7h3.4M12 7v7") + P("M10.3 7 6 10.5l.4 10 3.4-1") + P("M13.7 7l4.3 3.5-.4 10-3.4-1") +
    C(6, 10.5, 1, "f") + C(18, 10.5, 1, "f") +
    P("M11.2 18l-.8 4.8M12.8 18l.8 4.8") + `<rect class="patch" x="10.7" y="13.6" width="2.6" height="5"/>`,
  none: `<g class="thin">${cross(14.5, 6.8)}${david(17.6, 10.6)}${crescent(6.6, 13.6)}${orthodox(10.2, 17.4)}</g>` + C(12, 12, 10) + P("M4.9 4.9l14.2 14.2"),
  cross: P("M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"),
  ghost: P("M5 21V11a7 7 0 0 1 14 0v10l-2.33-2-2.33 2L12 19l-2.33 2-2.33-2z") + C(9.5, 11, 1.2, "f") + C(14.5, 11, 1.2, "f"),
  stamp: C(12, 4.8, 2.6) + P("M10.6 7.2v3.3h2.8V7.2") + P("M5 10.5h14v4.5H5z") + P("M3.5 19h17") + P("M6.5 17h11"),
  anvil: P("M3 7.5h13.5c.5 2.3 2.4 3.4 4.5 3.4v1.3h-5c-1.3 0-2 .8-2 2v1.8h2.5V19h-9v-3h2.5v-1.8c0-1.2-.7-2-2-2H6C4 12.2 3 10 3 7.5z"),
  knight: P("M6.5 20.5h11l-.8-3.8c-.2-3.4 1.2-6.6-.5-9.6-1.4-2.4-3.8-3.4-6-3.4l-.6 2-1.8 1.5-3 5.3 1.6 1.6 3-1.4 2.1-.2c-2.4 1.8-4.6 4-5 8z") + C(11.3, 8, 0.9, "f") + P("M5 20.5h14"),
  staff: P("M6.5 21.5 15.2 7.5") + P("M15.2 7.5c-1.8-.8-1.9-3.4-.2-4.3 1.6-.8 3.6.2 3.5 2-.1 1.4-1.4 2.2-2.4 1.5") + P("M20.5 2.5l-1 1M21.6 6.5h-1.4M19.6 10l-.8-1.2M11 2.4l.6 1.2"),
  tightrope: P("M2 19h20") + P("M8.5 10.5l3.5-1.2 3.5 1.2") + P("M12 8.5v6M12 14.5 10 19M12 14.5 14 19") + C(12, 6, 2),
  telescope: P("M3.5 13.5 17 7l1.7 3.6-13.5 6.5z") + P("M18.5 6.2l2 4.2") + P("M11.5 14l-3 7.5M11.5 14l3 7.5"),
  skull: P("M5 11.5a7 7 0 0 1 14 0c0 2.5-1 3.8-2 4.5v3.5H7V16c-1-.7-2-2-2-4.5z") + P("M10 19.5v-2M12 19.5v-2M14 19.5v-2") + C(9.3, 12, 1.7, "f") + C(14.7, 12, 1.7, "f"),
  anarchy: `<g class="punk"><ellipse cx="12" cy="12.6" rx="8.8" ry="8.1" transform="rotate(-14 12 12.6)"/>${P("M5.2 22.8 12.3 2.6 18.6 22.6")}${P("M1.8 15.9 22.4 13")}</g>`,
  sun: P("M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8") + C(12, 12, 4.2),
  moon: P("M19.5 14.5A8 8 0 1 1 9.5 4.5a6.3 6.3 0 0 0 10 10z"),
};

const svg = (name, cls) => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[name]}</svg>`;

const KINDS = [
  ["Mrakošlap", 7, "life", "nd", "cloud", "Náhradní život na 1 použití. Umře místo tebe, v noci i ve dne."],
  ["Mafián", 3, "attack", "n", "fedora", "Každou noc střílí. Mafiáni se musí na cíli shodnout, jinak nestřílí nikdo."],
  ["Šílený střelec", 2, "attack", "n", "crosshair", "Každou sudou noc vystřelí. Nemusí se s nikým shodovat."],
  ["Mág", 3, "night", "n", "portal", "Každou noc udělá tunel z hráče na hráče. Střela tunelem proletí dál."],
  ["Slina", 3, "night", "n", "drop", "Každou noc někoho poslintá. Poslintaného tu noc žádná střela nezasáhne."],
  ["Zrcadlo", 5, "life", "n", "mirror", "Na 1 použití. Střela se odrazí a letí tam, odkud přiletěla."],
  ["Exhibicionista", 2, "night", "n", "flasher", "Na 1 použití. V noci exhibne hráče, ten celý další den nesmí mluvit."],
  ["Ateista", 1, "special", "n", "none", "Nelze ho poslintat ani na něj udělat tunel. Jeho Mág a Slina nefungují."],
  ["Medik", 1, "night", "n", "cross", "Na 1 použití. Fingovaně zemře na další den a noc, pak se vrátí do hry."],
  ["Duch Bobo", 1, "night", "n", "ghost", "Noc po tvé smrti můžeš posmrtně exhibnout jednoho živého hráče."],
  ["Mečiar", 1, "day", "d", "stamp", "Při každém hlasování má automaticky dva hlasy."],
  ["Kováč", 1, "day", "d", "anvil", "Při hlasování má 1 hlas, při hlasování o smrti Mečiara 2 hlasy."],
  ["Kuskoňa", 1, "day", "d", "knight", "Hlasuje-li pro smrt Gandalfa, dostane Mrakošlap navíc."],
  ["Gandalf", 1, "day", "d", "staff", "Hlasuje-li pro smrt Kuskoni, dostane Mrakošlap navíc."],
  ["Provazochodec", 3, "life", "d", "tightrope", "Na 1 použití. Odsouzen k popravě se vysmekne z oprátky a přežije."],
  ["Astronom", 3, "day", "d", "telescope", "Na 1 použití. Kdykoliv ve dne řekne „NOC!“ a den končí bez popravy."],
  ["Masový vrah", 1, "attack", "d", "skull", "Je-li popraven, zastřelí všechny, kdo hlasovali pro jeho smrt."],
  ["Anarchista", 1, "attack", "d", "anarchy", "Na 1 použití. Ve dne ukáže na hráče: „I shoot you, baby!!!“ a zastřelí ho."],
];

const all = KINDS.flatMap(([name, count, group, when, icon, text]) =>
  Array.from({ length: count }, (_, i) => ({ name, n: count > 1 || name === "Mrakošlap" ? i + 1 : null, group, when, icon, text })),
);

const card = (c) => `
<div class="card ${c.group}">
  <div class="head"><span>${c.name}</span><span class="when">${c.when.includes("n") ? svg("moon", "w") : ""}${c.when.includes("d") ? svg("sun", "w") : ""}</span></div>
  <div class="art">${svg(c.icon, "big")}${c.n ? `<span class="num">${c.n}</span>` : ""}</div>
  <div class="text">${c.text}</div>
  <div class="foot">${TITLE}</div>
</div>`;

const cards = process.argv[2] === "sample" ? KINDS.map(([name]) => all.find((c) => c.name === name)).map(card) : all.map(card);
const pages = [];
for (let i = 0; i < cards.length; i += 9) pages.push(`<div class="page">${cards.slice(i, i + 9).join("")}</div>`);

process.stdout.write(`<!doctype html><meta charset="utf-8"><style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "DejaVu Sans", "Noto Sans", sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; padding: 16.5mm 10.5mm; display: grid; grid-template-columns: repeat(3, 63mm); grid-auto-rows: 88mm; break-after: page; }
.card { border: 0.2mm solid #999; padding: 0 5mm 4mm; display: flex; flex-direction: column; overflow: hidden; --c: #555; --bg: #eee; }
.life { --c: #2e7d5b; --bg: #e3f3eb; }
.attack { --c: #b23a48; --bg: #f9e3e6; }
.night { --c: #3b5ba9; --bg: #e3e9f8; }
.day { --c: #7a4fb0; --bg: #efe6f8; }
.special { --c: #a07a12; --bg: #f7efd2; }
.head { display: flex; justify-content: space-between; align-items: center; margin: 0 -5mm; padding: 3.5mm 5mm; background: var(--c); color: #fff; font-weight: 700; font-size: 5mm; }
.when { display: flex; gap: 1mm; }
svg { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
svg .f { fill: currentColor; stroke: none; }
.thin { stroke-width: 1; }
.patch { fill: #111; stroke: none; }
.punk { stroke-width: 2.4; stroke-linejoin: miter; stroke-miterlimit: 2.5; stroke-linecap: butt; }
.big { overflow: visible; }
.blue { stroke: #2a7de1; stroke-width: 2.2; }
.orange { stroke: #f08c1a; stroke-width: 2.2; }
.w { width: 5mm; height: 5mm; stroke-width: 2; }
.art { position: relative; flex: 1; display: flex; align-items: center; justify-content: center; color: var(--c); }
.big { width: 30mm; height: 30mm; padding: 4mm; border-radius: 50%; background: var(--bg); box-sizing: content-box; stroke-width: 1.4; }
.num { position: absolute; right: 0; bottom: 3mm; width: 9mm; height: 9mm; border-radius: 50%; border: 0.5mm solid var(--c); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 4.5mm; background: #fff; }
.text { font-size: 3.4mm; line-height: 1.35; border-top: 0.4mm solid var(--c); padding-top: 2.5mm; min-height: 17mm; }
.foot { margin-top: 2mm; font-size: 2.5mm; color: #888; text-align: center; letter-spacing: 0.3mm; text-transform: uppercase; }
</style>${pages.join("")}`);
