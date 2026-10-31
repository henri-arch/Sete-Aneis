export const RING_IDS = [
  "pride",
  "wrath",
  "gluttony",
  "greed",
  "lust",
  "envy",
  "sloth",
] as const;

export type RingId = (typeof RING_IDS)[number];

export const FACTION_IDS = [
  "imp",
  "goetia",
  "pecados",
  "overlords",
  "sinners",
  "hellborn",
  "humanos",
] as const;

export type FactionId = (typeof FACTION_IDS)[number];

export type Mode = "preparacao" | "jogo";
export type SheetStatus = "aguardando" | "ajustes" | "validada";
export type GmIntent = "report" | "validate" | "scene" | "pressure" | "maturity" | "tick";
export type MaturityRating = "pending" | "teen" | "adult" | "creator";

export const PERIOD_IDS = ["dawn", "day", "dusk", "night"] as const;
export type PeriodId = (typeof PERIOD_IDS)[number];

export type Ability = {
  name: string;
  limit: string;
  cost: string;
};

export type CharacterSheet = {
  name: string;
  identity: string;
  age: string;
  species: string;
  power: string;
  look: string;
  abilities: Ability[];
  weaknesses: string[];
  gear: string;
  goal: string;
  knowledge: string;
  relations: string;
  trait: string;
};

export type Reputation = {
  imp: string;
  goetia: string;
  pecados: string;
  overlords: string;
  sinners: string;
  hellborn: string;
  humanos: string;
};

export type StateCard = {
  arc: string;
  timePlace: string;
  player: string;
  npcsPresent: string;
  npcsAbsent: string;
  worldPulse: string;
  reputation: Reputation;
  divergences: string;
  questions: string[];
};

export type RingPressure = {
  id: RingId;
  pressure: string;
  heat: number;
};

export type FactionStance = {
  id: FactionId;
  stance: string;
  heat: number;
  goal?: string;
  goalProgress?: number;
};

export type GameClock = {
  day: number;
  period: PeriodId;
  ticks: number;
};

export type WorldEvent = {
  id: string;
  title: string;
  detail: string;
  ring: RingId | "multi" | "earth";
  severity: number;
  status: "scheduled" | "active" | "resolved";
  sinceTick: number;
  startTick?: number;
  endTick?: number;
  factions?: FactionId[];
  priority?: number;
};

export type NpcBond = {
  name: string;
  stance: string;
  notes: string;
  lastTick: number;
};

export type Consequence = {
  id: string;
  text: string;
  severity: number;
  tick: number;
  permanent: boolean;
};

export type ChronicleEntry = {
  id: string;
  tick: number;
  kind: "cena" | "mundo" | "faccao" | "npc" | "consequencia" | "sistema";
  text: string;
  at: number;
};

export type NarrativeMemory = {
  /** Resumo de longo prazo da campanha */
  summary: string;
  threads: string[];
  lastTick: number;
  /** Memória de médio prazo (últimos arcos) */
  midSummary?: string;
  /** Buffer de curto prazo (últimas batidas) */
  shortBuffer?: string[];
};

export type LogKind = "mestre" | "jogador" | "ooc" | "sistema";

export type LogEntry = {
  id: string;
  kind: LogKind;
  text: string;
  at: number;
};

export type WorldState = {
  clock: GameClock;
  events: WorldEvent[];
  bonds: NpcBond[];
  consequences: Consequence[];
  chronicle: ChronicleEntry[];
  memory: NarrativeMemory;
};

export type GmInput = {
  intent: GmIntent;
  ooc: boolean;
  playerText: string;
  mode: Mode;
  sheetStatus: SheetStatus;
  sheet: CharacterSheet;
  history: { kind: "mestre" | "jogador" | "ooc"; text: string }[];
  card: StateCard;
  pressures: RingPressure[];
  factions: FactionStance[];
  maturity: MaturityRating;
  world: WorldState;
};

export type GmOk = {
  ok: true;
  narration: string;
  mode: Mode;
  sheetStatus: SheetStatus;
  card: StateCard;
  pressures: RingPressure[];
  factions: FactionStance[];
  maturity?: MaturityRating;
  world: WorldState;
};

export type GmResult = GmOk | { ok: false; error: string };

export type CampaignSnapshot = {
  version: number;
  name: string;
  updatedAt: number;
  tab: string;
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
};
