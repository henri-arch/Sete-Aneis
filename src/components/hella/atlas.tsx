import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Flame, ScrollText, Image as ImageIcon, Loader2 } from "lucide-react";
import { CONTRACT, FACTION_LABEL, HIERARCHY, PERIOD, RINGS } from "@/lib/hella/canon";
import { useCampaign } from "@/lib/hella/store";
import type { RingId } from "@/lib/hella/types";
import { generateRingImage, RING_VISUAL } from "@/lib/hella/images";

type Props = {
  onReport: () => void;
  onPressure: () => void;
};

export function Atlas({ onReport, onPressure }: Props) {
  const selectedRing = useCampaign((s) => s.selectedRing);
  const setRing = useCampaign((s) => s.setRing);
  const pressures = useCampaign((s) => s.pressures);
  const factions = useCampaign((s) => s.factions);
  const pending = useCampaign((s) => s.pending);
  const log = useCampaign((s) => s.log);
  const ring = RINGS.find((item) => item.id === selectedRing) ?? RINGS[0];
  const pressure = pressures.find((item) => item.id === ring.id);
  const lastMaster = [...log].reverse().find((entry) => entry.kind === "mestre");
  const visual = RING_VISUAL[ring.id] ?? RING_VISUAL.pride;

  const [art, setArt] = useState<Partial<Record<string, string>>>({});
  const [imgLoading, setImgLoading] = useState(false);
  const [imgError, setImgError] = useState("");
  const callImage = useServerFn(generateRingImage);
  const imgUrl = art[ring.id] ?? null;

  async function requestImage() {
    setImgLoading(true);
    setImgError("");
    try {
      const result = await callImage({ data: { ringId: ring.id } });
      if (result.ok && result.url) {
        setArt((current) => ({ ...current, [ring.id]: result.url as string }));
      } else {
        setImgError(result.error || "Não foi possível gerar a ilustração agora.");
      }
    } catch {
      setImgError("Falha na geração de imagem.");
    }
    setImgLoading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <p className="font-display text-sm tracking-[0.28em] text-accent uppercase">Bíblia do Inferno</p>
        <h1 className="font-display text-5xl leading-none font-extrabold text-balance text-fg sm:text-6xl">
          Sete anéis, uma mesa.
        </h1>
        <p className="max-w-2xl text-pretty text-muted">{PERIOD}</p>
      </header>

      {/* Visual Ring Selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {RINGS.map((item) => {
          const v = RING_VISUAL[item.id] ?? RING_VISUAL.pride;
          const active = item.id === ring.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setRing(item.id as RingId);
                setImgError("");
              }}
              className={`ring-card relative overflow-hidden rounded-xl border p-3 text-left transition duration-300 ${
                active ? "border-accent shadow-lg" : "border-border hover:border-accent"
              }`}
              style={{ background: `linear-gradient(145deg, ${v.color}33, var(--color-bg))` }}
            >
              <div
                className="mb-2 h-2 w-full rounded-full"
                style={{ backgroundColor: v.color }}
              />
              <p className="font-display text-sm font-bold tracking-wide text-fg uppercase">{item.name}</p>
              <p className="text-xs text-muted">{item.ruler}</p>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        {/* Selected Ring detail + image */}
        <div className="flex flex-col gap-4">
          <div
            className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${visual.gradient} p-5`}
          >
            <div className="relative z-10">
              <p className="font-display text-3xl font-bold tracking-wide text-fg uppercase">{ring.name}</p>
              <p className="mt-1 text-sm text-fg/70">{ring.ruler} • {ring.sin}</p>
              <p className="mt-3 text-sm text-pretty text-fg/85">{ring.confirmed}</p>
              {ring.uncertain ? (
                <p className="mt-2 text-xs text-fg/50">Incerto: {ring.uncertain}</p>
              ) : null}
              <p className="mt-3 text-xs text-fg/60">{visual.mood}</p>
            </div>

            {/* Image area */}
            <div className="mt-4">
              {imgUrl ? (
                <img
                  src={imgUrl}
                  alt={`Ilustração do Anel ${ring.name}`}
                  className="w-full rounded-xl border border-border object-cover"
                  style={{ maxHeight: 280 }}
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-black/20">
                  <button
                    type="button"
                    disabled={imgLoading}
                    onClick={() => void requestImage()}
                    className="inline-flex items-center gap-2 rounded-lg bg-bg/40 px-4 py-2 text-sm text-fg transition hover:bg-elevated disabled:opacity-50"
                  >
                    {imgLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                    {imgLoading ? "Gerando ilustração…" : "Gerar ilustração do Anel"}
                  </button>
                </div>
              )}
              {imgError ? <p className="mt-2 text-xs text-primary">{imgError}</p> : null}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="font-display text-xl tracking-wide text-fg uppercase">Habitantes & Viagem</h2>
            <p className="mt-2 text-sm text-pretty text-muted">{ring.denizens}</p>
            <p className="mt-2 text-sm text-pretty text-muted">{ring.travel}</p>
            {pressure ? (
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-accent">Pressão atual</span>
                  <span className="text-muted">calor {pressure.heat}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg" aria-hidden="true">
                  <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, pressure.heat))}%` }} />
                </div>
                <p className="mt-2 text-sm text-pretty text-muted">{pressure.pressure}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Hierarchy + Factions + Actions */}
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="font-display text-2xl tracking-wide text-fg uppercase">Hierarquia</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {HIERARCHY.map((step) => (
                <li key={step.rank} className="text-sm">
                  <span className="font-semibold text-accent">{step.rank}</span>
                  <p className="text-pretty text-muted">{step.note}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-card border border-border bg-surface p-5">
            <h2 className="font-display text-2xl tracking-wide text-fg uppercase">Como o Inferno olha</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {factions.map((item) => (
                <li key={item.id} className="text-sm text-pretty">
                  <span className="text-accent">{FACTION_LABEL[item.id]}. </span>
                  <span className="text-muted">{item.stance}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={pending}
              onClick={onReport}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-card bg-primary px-4 font-display text-lg tracking-wide text-primary-fg uppercase disabled:opacity-50"
            >
              <ScrollText className="size-5" aria-hidden="true" />
              Relatório da IA
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onPressure}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-card border border-border bg-elevated px-4 font-display text-lg tracking-wide text-fg uppercase disabled:opacity-50"
            >
              <Flame className="size-5 text-primary" aria-hidden="true" />
              Tensionar anéis
            </button>
          </div>
        </div>
      </div>

      {lastMaster ? (
        <section className="rounded-card border border-border bg-elevated p-5">
          <h2 className="font-display text-xl tracking-wide text-fg uppercase">Última leitura</h2>
          <p className="mt-2 line-clamp-6 text-sm text-pretty text-muted">{lastMaster.text}</p>
        </section>
      ) : null}

      <details className="rounded-card border border-border bg-surface p-5">
        <summary className="font-display text-xl tracking-wide text-fg uppercase">Contrato da mesa</summary>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-sm text-pretty text-muted">
          {CONTRACT.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
