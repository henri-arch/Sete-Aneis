import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { gmTurn } from "@/lib/hella/gm";
import { useCampaign } from "@/lib/hella/store";
import type { GmResult, MaturityRating } from "@/lib/hella/types";

type Props = {
  onDone: (rating: MaturityRating) => void;
};

export function MaturityGate({ onDone }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const callGm = useServerFn(gmTurn);

  async function submit() {
    const cleaned = text.trim();
    if (cleaned.length < 5) {
      setError("Escreva um pouco mais sobre você (pelo menos algumas palavras).");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result: GmResult = await callGm({
        data: {
          intent: "maturity",
          ooc: true,
          playerText: cleaned,
          mode: "preparacao",
          sheetStatus: "aguardando",
          sheet: useCampaign.getState().sheet,
          history: [],
          card: useCampaign.getState().card,
          pressures: useCampaign.getState().pressures,
          factions: useCampaign.getState().factions,
          maturity: "pending",
          world: useCampaign.getState().world,
        },
      });
      if (!result.ok) {
        setError(result.error || "Não foi possível avaliar. Tente de novo.");
        setLoading(false);
        return;
      }
      // Preserve the three tiers: teen (+14), adult (+18), creator (privileged)
      const rating: MaturityRating =
        result.maturity === "creator"
          ? "creator"
          : result.maturity === "adult"
            ? "adult"
            : "teen";
      useCampaign.getState().setMaturity(rating);
      onDone(rating);
    } catch {
      setError("A conexão falhou. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg px-4">
      <div className="gate-enter w-full max-w-lg rounded-2xl border border-border bg-surface p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="font-display text-3xl font-bold tracking-wide text-fg uppercase">
            Sete Anéis
          </p>
          <p className="mt-2 text-sm text-muted">
            Antes de descer, o portal precisa saber quem você é.
          </p>
        </div>

        <label className="mb-2 block text-sm text-fg">
          Em poucas palavras, fale um pouco sobre você.
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Ex: gosto de histórias adultas, trabalho com X, prefiro tom sério..."
          className="mb-3 w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none"
          disabled={loading}
        />

        {error ? (
          <p className="mb-3 text-sm text-primary">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading}
          className="h-12 w-full rounded-xl bg-primary text-sm font-semibold tracking-wide text-primary-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "O portal está ouvindo…" : "Entrar no Inferno"}
        </button>

        {error ? (
          <button
            type="button"
            className="mt-3 h-11 w-full rounded-xl border border-border text-xs text-muted transition hover:border-primary hover:text-fg"
            onClick={() => {
              // Fallback local: heurística simples sem IA
              const t = text.toLowerCase();
              const adultHints = ["adulto", "18", "maior", "trabalho", "sex", "violência", "violencia", "explícit", "explicit"];
              const rating: MaturityRating = adultHints.some((h) => t.includes(h)) ? "adult" : "teen";
              useCampaign.getState().setMaturity(rating);
              onDone(rating);
            }}
          >
            Continuar sem IA (tom estimado localmente)
          </button>
        ) : null}

        <p className="mt-4 text-center text-xs text-muted">
          O texto ajusta o tom (+14 ou +18). Quem tem a chave de arquiteto (servidor) entra como Criador.
        </p>
      </div>
    </div>
  );
}
