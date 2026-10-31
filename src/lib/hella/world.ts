import type {
  ChronicleEntry,
  Consequence,
  GameClock,
  NpcBond,
  PeriodId,
  WorldEvent,
  WorldState,
} from "./types";
import { PERIOD_IDS } from "./types";
import { INITIAL_WORLD } from "./canon";

const PERIOD_LABEL: Record<PeriodId, string> = {
  dawn: "amanhecer",
  day: "dia",
  dusk: "crepúsculo",
  night: "noite",
};

export function periodLabel(period: PeriodId): string {
  return PERIOD_LABEL[period] ?? period;
}

export function formatClock(clock: GameClock): string {
  return `Dia ${clock.day} · ${periodLabel(clock.period)} · tick ${clock.ticks}`;
}

export function advanceClock(clock: GameClock, steps = 1): GameClock {
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

export function emptyWorld(): WorldState {
  return structuredClone(INITIAL_WORLD);
}

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\u0000/g, "").slice(0, max).trim() : "";
}

export function coerceWorld(raw: unknown): WorldState {
  const base = emptyWorld();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  const clockRaw = row.clock && typeof row.clock === "object" ? (row.clock as Record<string, unknown>) : {};
  const period = PERIOD_IDS.includes(clockRaw.period as PeriodId)
    ? (clockRaw.period as PeriodId)
    : "day";
  const day = Number(clockRaw.day);
  const ticks = Number(clockRaw.ticks);
  const clock: GameClock = {
    day: Number.isFinite(day) && day > 0 ? Math.min(9999, Math.round(day)) : 1,
    period,
    ticks: Number.isFinite(ticks) && ticks >= 0 ? Math.min(100_000, Math.round(ticks)) : 0,
  };

  const events: WorldEvent[] = [];
  if (Array.isArray(row.events)) {
    for (const item of row.events.slice(0, 24)) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      const title = clip(e.title, 120);
      if (!title) continue;
      const sev = Number(e.severity);
      events.push({
        id: clip(e.id, 40) || crypto.randomUUID(),
        title,
        detail: clip(e.detail, 400),
        ring: (clip(e.ring, 20) as WorldEvent["ring"]) || "multi",
        severity: Number.isFinite(sev) ? Math.max(0, Math.min(100, Math.round(sev))) : 20,
        status: e.status === "resolved" ? "resolved" : e.status === "scheduled" ? "scheduled" : "active",
        sinceTick: Number.isFinite(Number(e.sinceTick)) ? Math.round(Number(e.sinceTick)) : clock.ticks,
      });
    }
  }

  const bonds: NpcBond[] = [];
  if (Array.isArray(row.bonds)) {
    for (const item of row.bonds.slice(0, 40)) {
      if (!item || typeof item !== "object") continue;
      const b = item as Record<string, unknown>;
      const name = clip(b.name, 80);
      if (!name) continue;
      bonds.push({
        name,
        stance: clip(b.stance, 120) || "neutro",
        notes: clip(b.notes, 300),
        lastTick: Number.isFinite(Number(b.lastTick)) ? Math.round(Number(b.lastTick)) : clock.ticks,
      });
    }
  }

  const consequences: Consequence[] = [];
  if (Array.isArray(row.consequences)) {
    for (const item of row.consequences.slice(0, 40)) {
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      const text = clip(c.text, 300);
      if (!text) continue;
      const sev = Number(c.severity);
      consequences.push({
        id: clip(c.id, 40) || crypto.randomUUID(),
        text,
        severity: Number.isFinite(sev) ? Math.max(0, Math.min(100, Math.round(sev))) : 30,
        tick: Number.isFinite(Number(c.tick)) ? Math.round(Number(c.tick)) : clock.ticks,
        permanent: c.permanent === true,
      });
    }
  }

  const chronicle: ChronicleEntry[] = [];
  if (Array.isArray(row.chronicle)) {
    for (const item of row.chronicle.slice(-80)) {
      if (!item || typeof item !== "object") continue;
      const c = item as Record<string, unknown>;
      const text = clip(c.text, 500);
      if (!text) continue;
      const kind = c.kind;
      const allowed = ["cena", "mundo", "faccao", "npc", "consequencia", "sistema"] as const;
      chronicle.push({
        id: clip(c.id, 40) || crypto.randomUUID(),
        tick: Number.isFinite(Number(c.tick)) ? Math.round(Number(c.tick)) : clock.ticks,
        kind: allowed.includes(kind as (typeof allowed)[number])
          ? (kind as ChronicleEntry["kind"])
          : "sistema",
        text,
        at: typeof c.at === "number" && Number.isFinite(c.at) ? c.at : Date.now(),
      });
    }
  }

  const mem = row.memory && typeof row.memory === "object" ? (row.memory as Record<string, unknown>) : {};
  const threads = Array.isArray(mem.threads)
    ? mem.threads.map((t) => clip(t, 160)).filter(Boolean).slice(0, 12)
    : [];

  const shortBuffer = Array.isArray(mem.shortBuffer)
    ? mem.shortBuffer.map((s) => clip(s, 240)).filter(Boolean).slice(-12)
    : [];
  return {
    clock,
    events,
    bonds,
    consequences,
    chronicle,
    memory: {
      summary: clip(mem.summary, 1200),
      threads,
      lastTick: Number.isFinite(Number(mem.lastTick)) ? Math.round(Number(mem.lastTick)) : clock.ticks,
      midSummary: clip(mem.midSummary, 800) || undefined,
      shortBuffer: shortBuffer.length ? shortBuffer : undefined,
    },
  };
}

/** Merge AI world delta onto previous state with safe caps. */
export function mergeWorld(prev: WorldState, delta: unknown, advance: boolean): WorldState {
  const incoming = coerceWorld(delta ?? prev);
  let clock = advance ? advanceClock(prev.clock, 1) : { ...prev.clock };
  if (delta && typeof delta === "object" && (delta as Record<string, unknown>).clock) {
    const forced = coerceWorld(delta).clock;
    clock = {
      day: Math.max(clock.day, forced.day),
      period: forced.period || clock.period,
      ticks: Math.max(clock.ticks, forced.ticks, advance ? prev.clock.ticks + 1 : prev.clock.ticks),
    };
  }

  const byId = new Map(prev.events.map((e) => [e.id, e]));
  for (const e of incoming.events) byId.set(e.id, e);
  const events = [...byId.values()]
    .filter((e) => e.status === "active" || e.sinceTick >= clock.ticks - 20)
    .slice(0, 24);

  const bondMap = new Map(prev.bonds.map((b) => [b.name.toLowerCase(), b]));
  for (const b of incoming.bonds) bondMap.set(b.name.toLowerCase(), b);
  const bonds = [...bondMap.values()].slice(0, 40);

  const cons = [
    ...prev.consequences,
    ...incoming.consequences.filter((c) => !prev.consequences.some((p) => p.id === c.id)),
  ]
    .filter((c) => c.permanent || c.tick >= clock.ticks - 40)
    .slice(-40);

  const chronicle = [
    ...prev.chronicle,
    ...incoming.chronicle.filter((c) => !prev.chronicle.some((p) => p.id === c.id)),
  ].slice(-80);

  const memory =
    incoming.memory.summary || incoming.memory.threads.length
      ? {
          summary: incoming.memory.summary || prev.memory.summary,
          threads: incoming.memory.threads.length ? incoming.memory.threads : prev.memory.threads,
          lastTick: clock.ticks,
        }
      : { ...prev.memory, lastTick: clock.ticks };

  return { clock, events, bonds, consequences: cons, chronicle, memory };
}

/** Deterministic world tick: clock, scheduled→active, expire events, decay non-permanent consequences. */
export function processWorldTick(state: WorldState, steps = 1): WorldState {
  let next = { ...state, clock: { ...state.clock } };
  for (let i = 0; i < steps; i += 1) {
    next = {
      ...next,
      clock: advanceClock(next.clock, 1),
    };
    const tick = next.clock.ticks;
    const events = next.events.map((e) => {
      if (e.status === "scheduled" && typeof e.startTick === "number" && e.startTick <= tick) {
        return { ...e, status: "active" as const, sinceTick: tick };
      }
      if (e.status === "active" && typeof e.endTick === "number" && e.endTick <= tick) {
        return { ...e, status: "resolved" as const };
      }
      return e;
    });
    const consequences = next.consequences
      .filter((c) => c.permanent || c.tick >= tick - 40)
      .map((c) => c);
    next = { ...next, events, consequences };
  }
  return next;
}

export function searchChronicle(
  chronicle: WorldState["chronicle"],
  query: string,
  limit = 20,
): WorldState["chronicle"] {
  const q = query.trim().toLowerCase();
  if (!q) return chronicle.slice(-limit);
  return chronicle.filter((c) => c.text.toLowerCase().includes(q) || c.kind.includes(q)).slice(-limit);
}
