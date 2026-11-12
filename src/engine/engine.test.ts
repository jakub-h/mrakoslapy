import { describe, expect, it } from "vitest";
import { type CardId, deck } from "./cards";
import { resolveDay } from "./day";
import { type NightActions, resolveNight, wakeSteps } from "./night";
import { type GameState, applyDay, applyNight, isActive, replay, setup } from "./state";

/** Builds a game from `{ name: cards }`; player ids follow insertion order. */
function game(hands: Record<string, CardId[]>, phase = 1): GameState {
  return { ...setup(Object.keys(hands), Object.values(hands)), phase };
}

const NIGHT2 = 3;
const NIGHT3 = 5;

describe("deck", () => {
  it("has 40/35/36 cards for 8/7/6 players", () => {
    expect([8, 7, 6].map((n) => deck(n).length)).toEqual([40, 35, 36]);
    expect(deck(7)).not.toContain("provazochodec-3");
    expect(deck(6)).toContain("provazochodec-3");
  });
});

describe("shots", () => {
  it("fires one shot per living Mafián when all agree; spare fragments stop in the body", () => {
    const s = game({ A: ["mafian-1"], B: ["mafian-2"], C: ["mafian-3"], D: ["mrakoslap-1"] });
    const t = { target: 3 };
    const o = resolveNight(s, { "mafian-1": t, "mafian-2": t, "mafian-3": t });
    expect(o.shots).toBe(3);
    expect(o.spent).toEqual(["mrakoslap-1"]);
    expect(o.deadPlayers).toEqual([3]);
  });

  it("fires nothing when the Mafiáni disagree", () => {
    const s = game({ A: ["mafian-1"], B: ["mafian-2"], C: [] }, NIGHT2);
    const o = resolveNight(s, { "mafian-1": { target: 2 }, "mafian-2": { target: 0 } });
    expect(o.shots).toBe(0);
  });

  it("wakes Šílený střelec on even nights only", () => {
    const s = game({ A: ["strelec-1"], B: [] });
    expect(wakeSteps(s)).toEqual([]);
    expect(wakeSteps({ ...s, phase: NIGHT2 }).map((w) => w.card)).toEqual(["strelec-1"]);
    expect(wakeSteps({ ...s, phase: NIGHT3 })).toEqual([]);
  });
});

describe("tunnels and mirrors", () => {
  it("reflects back one hop: A shoots B, tunnel B→C, mirror on C reflects to B", () => {
    const s = game({ A: ["mafian-1"], B: ["mrakoslap-1"], C: ["zrcadlo-1", "mag-1"] });
    const o = resolveNight(s, { "mafian-1": { target: 1 }, "mag-1": { from: 1, target: 2 } });
    expect(o.spent).toEqual(["zrcadlo-1", "mrakoslap-1"]);
    expect(o.deadPlayers).toEqual([]);
  });

  it("splits a shot over two tunnels and counts both halves returning at once", () => {
    const s = game({
      A: ["mafian-1"],
      X: ["mrakoslap-1", "mrakoslap-2", "mag-1"],
      Y: ["zrcadlo-1", "mag-2"],
      Z: ["zrcadlo-2"],
    });
    const o = resolveNight(s, {
      "mafian-1": { target: 1 },
      "mag-1": { from: 1, target: 2 },
      "mag-2": { from: 1, target: 3 },
    });
    expect(o.spent).toEqual(["zrcadlo-1", "zrcadlo-2", "mrakoslap-1", "mrakoslap-2"]);
    expect(o.trace.some((l) => l.text.includes("1/2"))).toBe(true);
  });

  it("uses identical tunnels one at a time, keeping the second as a backup", () => {
    const s = game({ A: ["mafian-1"], X: ["mag-1", "mag-2"], Y: ["zrcadlo-1"] });
    const tunnel = { from: 1, target: 2 };
    const o = resolveNight(s, { "mafian-1": { target: 1 }, "mag-1": tunnel, "mag-2": tunnel });
    expect(o.spent).toEqual(["zrcadlo-1"]);
    expect(o.deadPlayers).toEqual([2]);
  });

  it("keeps a dead Mág's tunnel working", () => {
    const s = game({ A: ["mafian-1"], S: ["strelec-1"], M: ["mag-1"], N: ["mag-2"], X: [], C: [], D: [] }, NIGHT2);
    const o = resolveNight(s, {
      "mafian-1": { target: 2 },
      "strelec-1": { target: 4 },
      "mag-1": { from: 5, target: 6 },
      "mag-2": { from: 4, target: 5 },
    });
    expect(o.deadPlayers.sort()).toEqual([2, 6]);
  });

  it("reflects several simultaneous shots with one mirror", () => {
    const s = game({ A: ["mafian-1"], B: ["mafian-2"], T: ["zrcadlo-2", "zrcadlo-1"] });
    const t = { target: 2 };
    const o = resolveNight(s, { "mafian-1": t, "mafian-2": t });
    expect(o.spent).toEqual(["zrcadlo-1"]);
    expect(o.deadPlayers.sort()).toEqual([0, 1]);
  });
});

describe("defense order", () => {
  it("sends a slimed player's shot through their tunnel first", () => {
    const s = game({ A: ["mafian-1"], X: ["slina-1", "mag-1"], Y: [] });
    const o = resolveNight(s, { "mafian-1": { target: 1 }, "slina-1": { target: 1 }, "mag-1": { from: 1, target: 2 } });
    expect(o.deadPlayers).toEqual([2]);
    expect(o.slimed).toEqual([1]);
  });

  it("keeps the mirror when slimed, and the Mrakošlap while a mirror is left", () => {
    const s = game({ A: ["mafian-1"], X: ["slina-1", "zrcadlo-1"], Y: ["zrcadlo-2", "mrakoslap-3"], B: ["mafian-2"] });
    const o = resolveNight(s, {
      "mafian-1": { target: 1 },
      "mafian-2": { target: 1 },
      "slina-1": { target: 1 },
    });
    expect(o.spent).toEqual([]);
    const o2 = resolveNight({ ...s, phase: NIGHT2 }, { "mafian-1": { target: 2 }, "mafian-2": { target: 2 } });
    expect(o2.spent).toEqual(["zrcadlo-2"]);
  });

  it("uses the lowest-numbered Mrakošlap first", () => {
    const s = game({ A: ["mafian-1"], X: ["mrakoslap-5", "mrakoslap-2"] });
    expect(resolveNight(s, { "mafian-1": { target: 1 } }).spent).toEqual(["mrakoslap-2"]);
  });
});

describe("Ateista", () => {
  it("drops tunnels and slinas aimed at the Ateista and blocks their own Mág", () => {
    const s = game({ A: ["mafian-1"], X: ["mag-1", "slina-1"], T: ["ateista-1", "mag-2"] });
    expect(wakeSteps(s).find((w) => w.card === "mag-2")!.blocked).toBe(true);
    const o = resolveNight(s, {
      "mafian-1": { target: 1 },
      "mag-1": { from: 1, target: 2 },
      "slina-1": { target: 2 },
      "mag-2": { from: 1, target: 0 },
    });
    expect(o.slimed).toEqual([]);
    expect(o.deadPlayers).toEqual([1]);
  });

  it("drops tunnels leading out of the Ateista", () => {
    const s = game({ A: ["mafian-1"], X: ["mag-1"], T: ["ateista-1"], Y: [] });
    const o = resolveNight(s, { "mafian-1": { target: 2 }, "mag-1": { from: 2, target: 3 } });
    expect(o.deadPlayers).toEqual([2]);
  });
});

describe("Exhibicionista", () => {
  it("announces the exhibition even when the target dies that night", () => {
    const s = game({ A: ["mafian-1"], E: ["exhibicionista-1"], B: [] });
    const o = resolveNight(s, { "mafian-1": { target: 2 }, "exhibicionista-1": { target: 2 } });
    expect(o.deadPlayers).toEqual([2]);
    expect(o.exhibited).toEqual([2]);
  });
});

describe("Medik", () => {
  const s = game({ A: ["mafian-1"], M: ["medik-1", "mag-1"], B: [] });

  it("fakes death through the next day and night, then returns", () => {
    const o = resolveNight(s, { "mafian-1": { target: 2 }, "medik-1": { target: 1 } });
    expect(o.medik).toBe(1);
    const day = applyNight(s, o);
    expect(isActive(day, 1)).toBe(false);
    const night2 = applyDay(day, resolveDay(day, []));
    expect(wakeSteps(night2).map((w) => w.card)).toEqual(["mafian-1"]);
    const o2 = resolveNight(night2, { "mafian-1": { target: 1 } });
    expect(o2.shots).toBe(0);
    expect(o2.returning).toEqual([1]);
    expect(isActive(applyNight(night2, o2), 1)).toBe(true);
  });

  it("still takes tonight's shots", () => {
    const o = resolveNight(s, { "mafian-1": { target: 1 }, "medik-1": { target: 1 } });
    expect(o.medik).toBeNull();
    expect(o.deadPlayers).toEqual([1]);
  });
});

describe("Duch Bobo", () => {
  it("wakes only the night after the holder's death", () => {
    const s = game({ A: ["mafian-1"], B: ["bobo-1"], C: [] });
    const day1 = applyNight(s, resolveNight(s, { "mafian-1": { target: 1 } }));
    const night2 = applyDay(day1, resolveDay(day1, []));
    expect(wakeSteps(night2).map((w) => w.card)).toContain("bobo-1");
    const o = resolveNight(night2, { "bobo-1": { target: 2 } });
    expect(o.exhibited).toEqual([2]);
    const night3 = applyDay(applyNight(night2, o), { spent: [], deadPlayers: [], gained: [], lines: [] });
    expect(wakeSteps(night3).map((w) => w.card)).not.toContain("bobo-1");
  });
});

describe("day", () => {
  const s = game(
    {
      A: ["provazochodec-1", "mrakoslap-1"],
      V: ["masovyVrah-1", "mrakoslap-2"],
      K: ["kuskona-1"],
      G: ["gandalf-1", "mrakoslap-3"],
      X: ["anarchista-1", "astronom-1"],
    },
    2,
  );

  it("lets Provazochodec escape the rope", () => {
    const o = resolveDay(s, [{ type: "execution", target: 0, voters: [1, 2] }]);
    expect(o.spent).toEqual(["provazochodec-1"]);
  });

  it("makes Masový vrah shoot every other voter", () => {
    const o = resolveDay(s, [{ type: "execution", target: 1, voters: [1, 0, 2] }]);
    expect(o.spent).toEqual(["mrakoslap-2", "mrakoslap-1"]);
    expect(o.deadPlayers).toEqual([2]);
  });

  it("gives Kuskoňa a new Mrakošlap for voting Gandalf to a death", () => {
    const o = resolveDay(s, [{ type: "execution", target: 3, voters: [2, 4] }]);
    expect(o.gained).toEqual([{ card: "mrakoslap-8", player: 2 }]);
    expect(applyDay(s, o).nextMrakoslap).toBe(9);
  });

  it("spends Anarchista and Astronom", () => {
    const o = resolveDay(s, [{ type: "anarchista", card: "anarchista-1", target: 2 }, { type: "astronom", card: "astronom-1" }]);
    expect(o.spent).toEqual(["anarchista-1", "astronom-1"]);
    expect(o.deadPlayers).toEqual([2]);
  });
});

describe("replay", () => {
  it("folds the event log into the same state", () => {
    const s = game({ A: ["mafian-1"], B: ["mrakoslap-1"] });
    const actions: NightActions = { "mafian-1": { target: 1 } };
    const outcome = resolveNight(s, actions);
    const r = replay([
      { type: "setup", players: ["A", "B"], hands: [["mafian-1"], ["mrakoslap-1"]] },
      { type: "night", actions, outcome, overridden: false },
    ]);
    expect(r).toEqual(applyNight(s, outcome));
  });
});
