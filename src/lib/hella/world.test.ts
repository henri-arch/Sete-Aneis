import { describe, it } from "node:test";
import assert from "node:assert/strict";

const PERIOD_IDS = ["dawn", "day", "dusk", "night"] as const;

function advanceClock(
  clock: { day: number; period: (typeof PERIOD_IDS)[number]; ticks: number },
  steps = 1,
) {
  let { day, period, ticks } = clock;
  let idx = PERIOD_IDS.indexOf(period);
  if (idx < 0) idx = 1;
  for (let i = 0; i < steps; i += 1) {
    ticks += 1;
    idx += 1;
    if (idx >= PERIOD_IDS.length) {
      idx = 0;
      day += 1;
    }
  }
  return { day: Math.max(1, day), period: PERIOD_IDS[idx]!, ticks };
}

function processWorldTick(
  state: {
    clock: { day: number; period: (typeof PERIOD_IDS)[number]; ticks: number };
    events: { id: string; status: string; startTick?: number; endTick?: number; sinceTick: number }[];
    consequences: { permanent: boolean; tick: number }[];
  },
  steps = 1,
) {
  let next = { ...state, clock: { ...state.clock }, events: state.events.map((e) => ({ ...e })) };
  for (let i = 0; i < steps; i += 1) {
    next.clock = advanceClock(next.clock, 1);
    const tick = next.clock.ticks;
    next.events = next.events.map((e) => {
      if (e.status === "scheduled" && typeof e.startTick === "number" && e.startTick <= tick) {
        return { ...e, status: "active", sinceTick: tick };
      }
      if (e.status === "active" && typeof e.endTick === "number" && e.endTick <= tick) {
        return { ...e, status: "resolved" };
      }
      return e;
    });
  }
  return next;
}

describe("world clock (unit)", () => {
  it("rolls night to next dawn and day+1", () => {
    const c = advanceClock({ day: 1, period: "night", ticks: 3 }, 1);
    assert.equal(c.period, "dawn");
    assert.equal(c.day, 2);
    assert.equal(c.ticks, 4);
  });

  it("advances multiple steps", () => {
    const c = advanceClock({ day: 1, period: "dawn", ticks: 0 }, 4);
    assert.equal(c.period, "dawn");
    assert.equal(c.day, 2);
    assert.equal(c.ticks, 4);
  });
});

describe("processWorldTick", () => {
  it("activates scheduled events and resolves by endTick", () => {
    const state = {
      clock: { day: 1, period: "day" as const, ticks: 4 },
      events: [
        { id: "a", status: "scheduled", startTick: 5, sinceTick: 0 },
        { id: "b", status: "active", endTick: 6, sinceTick: 1 },
      ],
      consequences: [],
    };
    const n = processWorldTick(state, 2);
    assert.equal(n.clock.ticks, 6);
    assert.equal(n.events.find((e) => e.id === "a")?.status, "active");
    assert.equal(n.events.find((e) => e.id === "b")?.status, "resolved");
  });
});
