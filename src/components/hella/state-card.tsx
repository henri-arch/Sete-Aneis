import { FACTION_LABEL } from "@/lib/hella/canon";
import { useCampaign } from "@/lib/hella/store";

const REP_KEYS = [
  ["imp", "I.M.P."],
  ["goetia", "Goetia"],
  ["pecados", "Pecados"],
  ["overlords", "Overlords"],
  ["sinners", "Sinners"],
  ["hellborn", "Hellborn"],
  ["humanos", "Humanos"],
] as const;

export function StateCardView() {
  const card = useCampaign((s) => s.card);
  const mode = useCampaign((s) => s.mode);
  const rows = [
    ["Tempo / local", card.timePlace || "sem alteração"],
    ["Jogador", card.player || "sem alteração"],
    ["NPCs presentes", card.npcsPresent || "sem alteração"],
    ["NPCs ausentes ativos", card.npcsAbsent || "sem alteração"],
    ["Inferno / Terra", card.worldPulse || "sem alteração"],
    ["Divergências", card.divergences || "sem alteração"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="font-display text-sm tracking-[0.28em] text-accent uppercase">Cartão de estado</p>
        <h1 className="font-display text-5xl leading-none font-extrabold text-balance text-fg">{card.arc}</h1>
        <p className="mt-2 text-sm text-muted">Modo {mode === "jogo" ? "jogo" : "preparação"}.</p>
      </header>
      <article className="rounded-card border border-accent bg-surface p-5">
        <dl className="flex flex-col gap-4">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="font-display text-sm tracking-[0.18em] text-accent uppercase">{label}</dt>
              <dd className="mt-1 text-sm text-pretty text-fg">{value}</dd>
            </div>
          ))}
          <div>
            <dt className="font-display text-sm tracking-[0.18em] text-accent uppercase">Reputação</dt>
            <dd className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REP_KEYS.map(([key, label]) => (
                <p key={key} className="rounded-card border border-border bg-bg px-3 py-2 text-sm">
                  <span className="block text-xs tracking-wider text-muted uppercase">{label}</span>
                  <span className="text-fg">{card.reputation[key] || "desconhecida"}</span>
                </p>
              ))}
            </dd>
          </div>
          <div>
            <dt className="font-display text-sm tracking-[0.18em] text-accent uppercase">Questões abertas</dt>
            <dd>
              <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-sm text-pretty text-fg">
                {card.questions.length === 0 ? <li>sem alteração</li> : null}
                {card.questions.map((question, index) => (
                  <li key={`${index}-${question}`}>{question}</li>
                ))}
              </ol>
            </dd>
          </div>
        </dl>
      </article>
      <p className="text-xs text-muted">
        Facções no atlas: {Object.values(FACTION_LABEL).join(" · ")}. O cartão muda quando a IA devolve uma
        leitura — relatório, ficha, cena ou tensão.
      </p>
    </div>
  );
}
