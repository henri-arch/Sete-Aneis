import { useCampaign } from "@/lib/hella/store";
import { formatClock, periodLabel, processWorldTick, searchChronicle } from "@/lib/hella/world";
import { useState } from "react";
import { FACTION_LABEL } from "@/lib/hella/canon";

type Props = {
  onTick: () => void;
  onPressure: () => void;
};

export function WorldPanel({ onTick, onPressure }: Props) {
  const world = useCampaign((s) => s.world);
  const factions = useCampaign((s) => s.factions);
  const pending = useCampaign((s) => s.pending);
  const mode = useCampaign((s) => s.mode);
  const sheetStatus = useCampaign((s) => s.sheetStatus);

  const canTick = sheetStatus === "validada" && !pending;
  const [query, setQuery] = useState("");
  function localTick() {
    const s = useCampaign.getState();
    const world = processWorldTick(s.world, 1);
    s.applyTurn({
      narration: `O Inferno avança. ${world.clock.day} · tick ${world.clock.ticks}.`,
      kind: "sistema",
      mode: s.mode,
      sheetStatus: s.sheetStatus,
      card: s.card,
      pressures: s.pressures,
      factions: s.factions,
      world,
    });
  }
  const filteredChronicle = searchChronicle(world.chronicle, query, 30);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-display text-sm tracking-[0.28em] text-accent uppercase">Mundo</p>
        <h1 className="font-display text-5xl leading-none font-extrabold text-fg">Estado vivo</h1>
        <p className="mt-2 max-w-xl text-sm text-pretty text-muted">
          Relógio interno, eventos independentes, vínculos com NPCs e consequências que não somem quando a
          cena muda.
        </p>
      </header>

      <section className="rounded-card border border-border bg-surface p-5">
        <p className="font-display text-sm tracking-[0.18em] text-accent uppercase">Relógio</p>
        <p className="mt-2 font-display text-3xl font-bold text-fg">{formatClock(world.clock)}</p>
        <p className="mt-1 text-sm text-muted">
          Período atual: {periodLabel(world.clock.period)}. Cada cena ou tick avança o Inferno.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canTick}
            onClick={onTick}
            className="h-11 rounded-card bg-primary px-4 text-sm text-primary-fg disabled:opacity-40"
          >
            Tick narrado (IA)
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={localTick}
            className="h-11 rounded-card border border-border px-4 text-sm text-muted hover:border-primary hover:text-fg disabled:opacity-40"
          >
            Tick motor (regras)
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onPressure}
            className="h-11 rounded-card border border-border px-4 text-sm text-muted hover:border-primary hover:text-fg disabled:opacity-40"
          >
            Pressão (mundo anda)
          </button>
        </div>
        {mode !== "jogo" ? (
          <p className="mt-3 text-xs text-muted">Valide a ficha para liberar o tick.</p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="font-display text-sm tracking-[0.18em] text-accent uppercase">Eventos ativos</p>
          <ul className="mt-3 flex flex-col gap-2">
            {world.events.filter((e) => e.status === "active").length === 0 ? (
              <li className="text-sm text-muted">Nenhum evento aberto.</li>
            ) : (
              world.events
                .filter((e) => e.status === "active")
                .map((e) => (
                  <li key={e.id} className="rounded-card border border-border bg-bg px-3 py-2 text-sm">
                    <span className="font-semibold text-fg">{e.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {e.ring} · severidade {e.severity} · desde tick {e.sinceTick}
                    </span>
                    {e.detail ? <span className="mt-1 block text-pretty text-muted">{e.detail}</span> : null}
                  </li>
                ))
            )}
          </ul>
        </div>

        <div className="rounded-card border border-border bg-surface p-4">
          <p className="font-display text-sm tracking-[0.18em] text-accent uppercase">Facções</p>
          <ul className="mt-3 flex flex-col gap-2">
            {factions.map((f) => (
              <li key={f.id} className="rounded-card border border-border bg-bg px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-fg">{FACTION_LABEL[f.id] ?? f.id}</span>
                  <span className="text-xs text-accent">heat {f.heat}</span>
                </div>
                <p className="mt-1 text-pretty text-muted">{f.stance}</p>
                {f.goal ? (
                  <p className="mt-1 text-xs text-accent">
                    Objetivo: {f.goal}
                    {typeof f.goalProgress === "number" ? ` (${f.goalProgress}%)` : ""}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-4">
          <p className="font-display text-sm tracking-[0.18em] text-accent uppercase">Vínculos com NPCs</p>
          <ul className="mt-3 flex flex-col gap-2">
            {world.bonds.length === 0 ? (
              <li className="text-sm text-muted">Ainda sem relações individuais registradas.</li>
            ) : (
              world.bonds.map((b) => (
                <li key={b.name} className="rounded-card border border-border bg-bg px-3 py-2 text-sm">
                  <span className="font-semibold text-fg">{b.name}</span>
                  <span className="text-accent"> — {b.stance}</span>
                  {b.notes ? <p className="mt-1 text-pretty text-muted">{b.notes}</p> : null}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-card border border-border bg-surface p-4">
          <p className="font-display text-sm tracking-[0.18em] text-accent uppercase">Consequências</p>
          <ul className="mt-3 flex flex-col gap-2">
            {world.consequences.length === 0 ? (
              <li className="text-sm text-muted">Nenhuma consequência persistente ainda.</li>
            ) : (
              world.consequences
                .slice()
                .reverse()
                .map((c) => (
                  <li key={c.id} className="rounded-card border border-border bg-bg px-3 py-2 text-sm">
                    <span className="text-fg">{c.text}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      tick {c.tick} · sev {c.severity}
                      {c.permanent ? " · permanente" : ""}
                    </span>
                  </li>
                ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-card border border-border bg-surface p-4">
        <p className="font-display text-sm tracking-[0.18em] text-accent uppercase">Memória narrativa</p>
        <p className="mt-2 text-sm text-pretty text-fg">
          <span className="text-xs text-muted uppercase">Longo prazo — </span>
          {world.memory.summary || "O mestre ainda não consolidou um resumo."}
        </p>
        {world.memory.midSummary ? (
          <p className="mt-2 text-sm text-pretty text-muted">
            <span className="text-xs uppercase">Médio — </span>
            {world.memory.midSummary}
          </p>
        ) : null}
        {world.memory.shortBuffer?.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
            {world.memory.shortBuffer.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : null}
        {world.memory.threads.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {world.memory.threads.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-card border border-border bg-surface p-4">
        <p className="font-display text-sm tracking-[0.18em] text-accent uppercase">Crônica</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar na crônica…"
          className="mt-2 h-10 w-full rounded-card border border-border bg-bg px-3 text-sm text-fg outline-none focus:border-primary"
        />
        <ol className="mt-3 flex flex-col gap-2">
          {filteredChronicle.length === 0 ? (
            <li className="text-sm text-muted">Histórico vazio.</li>
          ) : (
            filteredChronicle
              .slice()
              .reverse()
              .map((c) => (
                <li key={c.id} className="border-b border-border pb-2 text-sm last:border-0">
                  <span className="text-xs tracking-wider text-muted uppercase">
                    tick {c.tick} · {c.kind}
                  </span>
                  <p className="text-pretty text-fg">{c.text}</p>
                </li>
              ))
          )}
        </ol>
      </section>
    </div>
  );
}
