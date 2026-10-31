import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptySheet,
  INITIAL_CARD,
  INITIAL_FACTIONS,
  INITIAL_PRESSURES,
  INITIAL_WORLD,
} from "@/lib/hella/canon";
import {
  FACTION_IDS,
  RING_IDS,
  type CampaignSnapshot,
  type CharacterSheet,
  type FactionStance,
  type LogEntry,
  type MaturityRating,
  type Mode,
  type RingId,
  type RingPressure,
  type SheetStatus,
  type StateCard,
  type WorldState,
} from "@/lib/hella/types";
import { coerceWorld, emptyWorld } from "@/lib/hella/world";

export type TabId = "atlas" | "ficha" | "mesa" | "cartao" | "mundo" | "campanhas";

/** Bump when persisted shape changes so old localStorage can be migrated or reset. */
export const STORE_VERSION = 4;

export type CampaignMeta = {
  id: string;
  name: string;
  updatedAt: number;
};

type CampaignState = {
  version: number;
  activeId: string;
  slots: Record<string, CampaignSnapshot>;
  tab: TabId;
  mode: Mode;
  sheetStatus: SheetStatus;
  sheet: CharacterSheet;
  log: LogEntry[];
  card: StateCard;
  pressures: RingPressure[];
  factions: FactionStance[];
  selectedRing: RingId;
  pending: boolean;
  error: string;
  maturity: MaturityRating;
  world: WorldState;
  setTab: (tab: TabId) => void;
  setRing: (id: RingId) => void;
  setSheet: (sheet: CharacterSheet) => void;
  setPending: (pending: boolean) => void;
  setError: (error: string) => void;
  setMaturity: (maturity: MaturityRating) => void;
  pushLog: (entry: LogEntry) => void;
  applyTurn: (patch: {
    narration: string;
    kind: LogEntry["kind"];
    mode: Mode;
    sheetStatus: SheetStatus;
    card: StateCard;
    pressures: RingPressure[];
    factions: FactionStance[];
    maturity?: MaturityRating;
    world: WorldState;
  }) => void;
  resetCampaign: () => void;
  exportCampaign: () => string;
  importCampaign: (raw: string) => { ok: true } | { ok: false; error: string };
  listCampaigns: () => CampaignMeta[];
  createCampaign: (name: string) => void;
  switchCampaign: (id: string) => void;
  renameCampaign: (id: string, name: string) => void;
  deleteCampaign: (id: string) => void;
  saveActiveToSlots: () => void;
  hydrateFromSnapshot: (id: string, snap: CampaignSnapshot) => void;
};

function newId(): string {
  return crypto.randomUUID();
}

const freshPlay = () => ({
  mode: "preparacao" as Mode,
  sheetStatus: "aguardando" as SheetStatus,
  sheet: emptySheet(),
  log: [] as LogEntry[],
  card: structuredClone(INITIAL_CARD),
  pressures: structuredClone(INITIAL_PRESSURES),
  factions: structuredClone(INITIAL_FACTIONS),
  selectedRing: "pride" as RingId,
  maturity: "pending" as MaturityRating,
  world: structuredClone(INITIAL_WORLD) as WorldState,
});

function snapshotFrom(state: {
  mode: Mode;
  sheetStatus: SheetStatus;
  sheet: CharacterSheet;
  log: LogEntry[];
  card: StateCard;
  pressures: RingPressure[];
  factions: FactionStance[];
  selectedRing: RingId;
  maturity: MaturityRating;
  world: WorldState;
  tab: TabId;
  name?: string;
}): CampaignSnapshot {
  return {
    version: STORE_VERSION,
    name: state.name || "Campanha",
    updatedAt: Date.now(),
    tab: state.tab,
    mode: state.mode,
    sheetStatus: state.sheetStatus,
    sheet: state.sheet,
    log: state.log,
    card: state.card,
    pressures: state.pressures,
    factions: state.factions,
    selectedRing: state.selectedRing,
    maturity: state.maturity,
    world: state.world,
  };
}

function loadSnapshot(snap: CampaignSnapshot, tab?: TabId) {
  return {
    mode: snap.mode === "jogo" ? ("jogo" as Mode) : ("preparacao" as Mode),
    sheetStatus:
      snap.sheetStatus === "validada" || snap.sheetStatus === "ajustes"
        ? snap.sheetStatus
        : ("aguardando" as SheetStatus),
    sheet: snap.sheet || emptySheet(),
    log: Array.isArray(snap.log) ? snap.log.slice(-100) : [],
    card: snap.card || structuredClone(INITIAL_CARD),
    pressures: Array.isArray(snap.pressures) ? snap.pressures : structuredClone(INITIAL_PRESSURES),
    factions: Array.isArray(snap.factions) ? snap.factions : structuredClone(INITIAL_FACTIONS),
    selectedRing: (snap.selectedRing as RingId) || "pride",
    maturity:
      snap.maturity === "adult" || snap.maturity === "teen" || snap.maturity === "creator"
        ? snap.maturity
        : ("pending" as MaturityRating),
    world: coerceWorld(snap.world),
    tab: (tab || (snap.tab as TabId) || "atlas") as TabId,
  };
}

export function textIsOoc(text: string, flagged: boolean): boolean {
  return flagged || /^\s*(?:ooc\s*:|\/ooc\b)/i.test(text);
}

const TAB_IDS = new Set<TabId>(["atlas", "ficha", "mesa", "cartao", "mundo", "campanhas"]);
const LOG_KINDS = new Set<LogEntry["kind"]>(["mestre", "jogador", "ooc", "sistema"]);

function clipStr(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\u0000/g, "").slice(0, max) : "";
}

function isSheetStatus(v: unknown): v is SheetStatus {
  return v === "aguardando" || v === "ajustes" || v === "validada";
}
function isRing(v: unknown): v is RingId {
  return typeof v === "string" && (RING_IDS as readonly string[]).includes(v);
}
function isMaturity(v: unknown): v is MaturityRating {
  return v === "pending" || v === "teen" || v === "adult" || v === "creator";
}

function coerceSheet(raw: unknown): CharacterSheet {
  const base = emptySheet();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  const abilities = Array.isArray(row.abilities)
    ? row.abilities.slice(0, 6).map((item) => {
        const a = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        return {
          name: clipStr(a.name, 80),
          limit: clipStr(a.limit, 160),
          cost: clipStr(a.cost, 160),
        };
      })
    : base.abilities;
  while (abilities.length < 3) abilities.push({ name: "", limit: "", cost: "" });
  const weaknesses = Array.isArray(row.weaknesses)
    ? row.weaknesses.map((w) => clipStr(w, 160)).filter(Boolean).slice(0, 6)
    : base.weaknesses;
  return {
    name: clipStr(row.name, 80),
    identity: clipStr(row.identity, 160),
    age: clipStr(row.age, 40),
    species: clipStr(row.species, 80),
    power: clipStr(row.power, 400),
    look: clipStr(row.look, 400),
    abilities,
    weaknesses: weaknesses.length ? weaknesses : ["", ""],
    gear: clipStr(row.gear, 400),
    goal: clipStr(row.goal, 400),
    knowledge: clipStr(row.knowledge, 400),
    relations: clipStr(row.relations, 400),
    trait: clipStr(row.trait, 200),
  };
}

function coerceCard(raw: unknown): StateCard {
  const base = structuredClone(INITIAL_CARD);
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  const rep =
    row.reputation && typeof row.reputation === "object"
      ? (row.reputation as Record<string, unknown>)
      : {};
  const questions = Array.isArray(row.questions)
    ? row.questions.map((q) => clipStr(q, 140)).filter(Boolean).slice(0, 5)
    : base.questions;
  return {
    arc: clipStr(row.arc, 80) || base.arc,
    timePlace: clipStr(row.timePlace, 180) || base.timePlace,
    player: clipStr(row.player, 240) || base.player,
    npcsPresent: clipStr(row.npcsPresent, 240) || base.npcsPresent,
    npcsAbsent: clipStr(row.npcsAbsent, 240) || base.npcsAbsent,
    worldPulse: clipStr(row.worldPulse, 320) || base.worldPulse,
    reputation: {
      imp: clipStr(rep.imp, 40) || base.reputation.imp,
      goetia: clipStr(rep.goetia, 40) || base.reputation.goetia,
      pecados: clipStr(rep.pecados, 40) || base.reputation.pecados,
      overlords: clipStr(rep.overlords, 40) || base.reputation.overlords,
      sinners: clipStr(rep.sinners, 40) || base.reputation.sinners,
      hellborn: clipStr(rep.hellborn, 40) || base.reputation.hellborn,
      humanos: clipStr(rep.humanos, 40) || base.reputation.humanos,
    },
    divergences: clipStr(row.divergences, 500) || base.divergences,
    questions,
  };
}

function coercePressures(raw: unknown): RingPressure[] {
  const list = Array.isArray(raw) ? raw : [];
  return RING_IDS.map((id) => {
    const found = list.find((item) => item && typeof item === "object" && (item as RingPressure).id === id) as
      | RingPressure
      | undefined;
    const heat = Number(found?.heat);
    const fallback = INITIAL_PRESSURES.find((item) => item.id === id);
    return {
      id,
      pressure: clipStr(found?.pressure, 220) || fallback?.pressure || "",
      heat: Number.isFinite(heat) ? Math.max(0, Math.min(100, Math.round(heat))) : (fallback?.heat ?? 0),
    };
  });
}

function liftLegacyHeat(list: RingPressure[], version: unknown): RingPressure[] {
  const stored = typeof version === "number" ? version : 0;
  if (stored >= 3) return list;
  const max = Math.max(0, ...list.map((item) => item.heat));
  if (max > 0 && max <= 10) {
    return list.map((item) => ({ ...item, heat: Math.min(100, item.heat * 10) }));
  }
  return list;
}

function coerceFactions(raw: unknown): FactionStance[] {
  const list = Array.isArray(raw) ? raw : [];
  return FACTION_IDS.map((id) => {
    const found = list.find((item) => item && typeof item === "object" && (item as FactionStance).id === id) as
      | FactionStance
      | undefined;
    const fallback = INITIAL_FACTIONS.find((item) => item.id === id);
    const heat = Number(found?.heat);
    const progress = Number(found?.goalProgress ?? fallback?.goalProgress);
    return {
      id,
      stance: clipStr(found?.stance, 220) || fallback?.stance || "",
      heat: Number.isFinite(heat) ? Math.max(0, Math.min(100, Math.round(heat))) : (fallback?.heat ?? 0),
      goal: clipStr(found?.goal, 160) || fallback?.goal,
      goalProgress: Number.isFinite(progress) ? Math.max(0, Math.min(100, Math.round(progress))) : undefined,
    };
  });
}

function coerceLog(raw: unknown): LogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: LogEntry[] = [];
  for (const item of raw.slice(-100)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const text = clipStr(row.text, 4000).trim();
    if (!text) continue;
    const kind = LOG_KINDS.has(row.kind as LogEntry["kind"]) ? (row.kind as LogEntry["kind"]) : "sistema";
    out.push({
      id: clipStr(row.id, 80) || crypto.randomUUID(),
      kind,
      text,
      at: typeof row.at === "number" && Number.isFinite(row.at) ? row.at : Date.now(),
    });
  }
  return out;
}

function migratePersisted(persisted: unknown): Partial<CampaignState> {
  const play = freshPlay();
  if (!persisted || typeof persisted !== "object") {
    const id = newId();
    const snap = snapshotFrom({ ...play, tab: "atlas", name: "Campanha 1" });
    return {
      version: STORE_VERSION,
      activeId: id,
      slots: { [id]: snap },
      tab: "atlas",
      ...play,
      pending: false,
      error: "",
    };
  }
  const row = persisted as Record<string, unknown>;

  // Already multi-slot shape
  if (row.slots && typeof row.slots === "object") {
    const slots = row.slots as Record<string, CampaignSnapshot>;
    const activeId =
      typeof row.activeId === "string" && slots[row.activeId] ? row.activeId : Object.keys(slots)[0];
    if (!activeId) {
      const id = newId();
      const snap = snapshotFrom({ ...play, tab: "atlas", name: "Campanha 1" });
      return {
        version: STORE_VERSION,
        activeId: id,
        slots: { [id]: snap },
        tab: "atlas",
        ...play,
        pending: false,
        error: "",
      };
    }
    const loaded = loadSnapshot(slots[activeId]!);
    return {
      version: STORE_VERSION,
      activeId,
      slots,
      ...loaded,
      pending: false,
      error: "",
    };
  }

  // Legacy single-campaign → one slot
  const id = newId();
  const legacySnap: CampaignSnapshot = {
    version: STORE_VERSION,
    name: "Campanha 1",
    updatedAt: Date.now(),
    tab: typeof row.tab === "string" ? row.tab : "atlas",
    mode: row.mode === "jogo" ? "jogo" : "preparacao",
    sheetStatus: isSheetStatus(row.sheetStatus) ? row.sheetStatus : "aguardando",
    sheet: coerceSheet(row.sheet),
    log: coerceLog(row.log),
    card: coerceCard(row.card),
    pressures: liftLegacyHeat(coercePressures(row.pressures), row.version),
    factions: coerceFactions(row.factions),
    selectedRing: isRing(row.selectedRing) ? row.selectedRing : "pride",
    maturity: isMaturity(row.maturity) ? row.maturity : "pending",
    world: coerceWorld(row.world),
  };
  const loaded = loadSnapshot(legacySnap);
  return {
    version: STORE_VERSION,
    activeId: id,
    slots: { [id]: legacySnap },
    ...loaded,
    pending: false,
    error: "",
  };
}

const initialId = "boot";
const bootSnap = snapshotFrom({ ...freshPlay(), tab: "atlas", name: "Campanha 1" });

export const useCampaign = create<CampaignState>()(
  persist(
    (set, get) => ({
      version: STORE_VERSION,
      activeId: initialId,
      slots: { [initialId]: bootSnap },
      tab: "atlas" as TabId,
      ...freshPlay(),
      pending: false,
      error: "",
      setTab: (tab) => set({ tab }),
      setRing: (selectedRing) => set({ selectedRing }),
      setSheet: (sheet) => set({ sheet }),
      setPending: (pending) => set({ pending }),
      setError: (error) => set({ error }),
      setMaturity: (maturity) => set({ maturity }),
      pushLog: (entry) => set((s) => ({ log: [...s.log, entry].slice(-100) })),
      applyTurn: (patch) =>
        set((s) => {
          const next = {
            mode: patch.mode,
            sheetStatus: patch.sheetStatus,
            card: patch.card,
            pressures: patch.pressures,
            factions: patch.factions,
            maturity: patch.maturity ?? s.maturity,
            world: patch.world,
            error: "",
            log: patch.narration
              ? [
                  ...s.log,
                  {
                    id: crypto.randomUUID(),
                    kind: patch.kind,
                    text: patch.narration,
                    at: Date.now(),
                  },
                ].slice(-100)
              : s.log,
          };
          const snap = snapshotFrom({
            ...s,
            ...next,
            tab: s.tab,
            name: s.slots[s.activeId]?.name || "Campanha",
          });
          return {
            ...next,
            slots: { ...s.slots, [s.activeId]: snap },
          };
        }),
      resetCampaign: () => {
        const s = get();
        const play = freshPlay();
        const snap = snapshotFrom({
          ...play,
          tab: "atlas",
          name: s.slots[s.activeId]?.name || "Campanha",
        });
        set({
          ...play,
          tab: "atlas",
          pending: false,
          error: "",
          slots: { ...s.slots, [s.activeId]: snap },
        });
      },
      saveActiveToSlots: () => {
        const s = get();
        const snap = snapshotFrom({
          ...s,
          name: s.slots[s.activeId]?.name || "Campanha",
        });
        set({ slots: { ...s.slots, [s.activeId]: snap } });
      },
      listCampaigns: () => {
        const s = get();
        return Object.entries(s.slots)
          .map(([id, snap]) => ({
            id,
            name: snap.name || "Campanha",
            updatedAt: snap.updatedAt || 0,
          }))
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },
      createCampaign: (name: string) => {
        const s = get();
        s.saveActiveToSlots();
        const id = newId();
        const play = freshPlay();
        const snap = snapshotFrom({
          ...play,
          tab: "atlas",
          name: name.trim().slice(0, 60) || `Campanha ${Object.keys(s.slots).length + 1}`,
        });
        set({
          activeId: id,
          slots: { ...s.slots, [id]: snap },
          tab: "atlas",
          ...play,
          pending: false,
          error: "",
        });
      },
      switchCampaign: (id: string) => {
        const s = get();
        if (!s.slots[id] || id === s.activeId) return;
        s.saveActiveToSlots();
        const loaded = loadSnapshot(s.slots[id]!);
        set({
          activeId: id,
          ...loaded,
          pending: false,
          error: "",
        });
      },
      renameCampaign: (id: string, name: string) => {
        const s = get();
        const snap = s.slots[id];
        if (!snap) return;
        const next = {
          ...snap,
          name: name.trim().slice(0, 60) || snap.name,
          updatedAt: Date.now(),
        };
        set({ slots: { ...s.slots, [id]: next } });
      },
      deleteCampaign: (id: string) => {
        const s = get();
        const ids = Object.keys(s.slots);
        if (ids.length <= 1) {
          s.resetCampaign();
          return;
        }
        const { [id]: _, ...rest } = s.slots;
        if (s.activeId === id) {
          const nextId = Object.keys(rest)[0]!;
          const loaded = loadSnapshot(rest[nextId]!);
          set({ activeId: nextId, slots: rest, ...loaded, pending: false, error: "" });
        } else {
          set({ slots: rest });
        }
      },

      hydrateFromSnapshot: (id: string, snap: CampaignSnapshot) => {
        const s = get();
        s.saveActiveToSlots();
        const loaded = loadSnapshot(snap);
        set({
          activeId: id,
          slots: { ...s.slots, [id]: { ...snap, updatedAt: Date.now() } },
          ...loaded,
          pending: false,
          error: "",
        });
      },
      exportCampaign: () => {
        const s = get();
        s.saveActiveToSlots();
        const snap = s.slots[s.activeId] || snapshotFrom({ ...s, name: "Campanha" });
        return JSON.stringify({ ...snap, exportedAt: new Date().toISOString() }, null, 2);
      },
      importCampaign: (raw: string) => {
        try {
          if (raw.length > 1_500_000) {
            return { ok: false as const, error: "Arquivo grande demais para esta mesa." };
          }
          const data = JSON.parse(raw) as unknown;
          if (!data || typeof data !== "object" || Array.isArray(data)) {
            return { ok: false as const, error: "JSON inválido." };
          }
          const row = data as Record<string, unknown>;
          const s = get();
          s.saveActiveToSlots();
          const id = newId();
          const snap: CampaignSnapshot = {
            version: STORE_VERSION,
            name: clipStr(row.name, 60) || `Importada ${new Date().toLocaleDateString("pt-BR")}`,
            updatedAt: Date.now(),
            tab: TAB_IDS.has(row.tab as TabId) ? (row.tab as TabId) : "atlas",
            mode: row.mode === "jogo" ? "jogo" : "preparacao",
            sheetStatus: isSheetStatus(row.sheetStatus) ? row.sheetStatus : "aguardando",
            sheet: coerceSheet(row.sheet),
            log: coerceLog(row.log),
            card: coerceCard(row.card),
            pressures: liftLegacyHeat(coercePressures(row.pressures), row.version),
            factions: coerceFactions(row.factions),
            selectedRing: isRing(row.selectedRing) ? row.selectedRing : "pride",
            maturity: isMaturity(row.maturity) ? row.maturity : "pending",
            world: coerceWorld(row.world),
          };
          const loaded = loadSnapshot(snap);
          set({
            activeId: id,
            slots: { ...s.slots, [id]: snap },
            ...loaded,
            pending: false,
            error: "",
          });
          return { ok: true as const };
        } catch {
          return { ok: false as const, error: "Não foi possível importar o arquivo." };
        }
      },
    }),
    {
      name: "sete-aneis-campanha-v2",
      skipHydration: true,
      version: STORE_VERSION,
      migrate: (persisted) => migratePersisted(persisted) as CampaignState,
      partialize: (s) => {
        // Always persist slots with current active state folded in
        const snap = snapshotFrom({
          ...s,
          name: s.slots[s.activeId]?.name || "Campanha",
        });
        return {
          version: s.version,
          activeId: s.activeId,
          slots: { ...s.slots, [s.activeId]: snap },
        };
      },
    },
  ),
);
