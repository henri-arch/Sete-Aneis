import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useCampaign } from "@/lib/hella/store";

type Props = {
  onSend: (text: string, ooc: boolean) => void;
  pending: boolean;
};

export function CreatorPanel({ onSend, pending }: Props) {
  const [cmd, setCmd] = useState("");
  const maturity = useCampaign((s) => s.maturity);
  const mode = useCampaign((s) => s.mode);
  const sheetStatus = useCampaign((s) => s.sheetStatus);

  if (maturity !== "creator") return null;

  function run(command: string) {
    if (!command.trim() || pending) return;
    onSend(command.trim(), true);
    setCmd("");
  }

  const quick = [
    { label: "Estado completo do mundo", text: "OOC: Me dê o estado completo e detalhado do Inferno, de todos os Anéis relevantes, NPCs ativos e pressões atuais. Seja extremamente detalhado." },
    { label: "Forçar cena", text: "OOC: Como Criador eu ordeno que você avance a cena imediatamente com consequências máximas e detalhes ricos." },
    { label: "Controlar NPC", text: "OOC: Eu assumo temporariamente o controle de um NPC. Me diga quais NPCs estão disponíveis e aguarde eu escolher." },
    { label: "Reescrever fato", text: "OOC: Como Criador eu altero um fato da continuidade. A partir de agora o seguinte é verdade: " },
    { label: "Modo Deus — liberdade total", text: "OOC: Ative modo Deus completo. Eu posso fazer qualquer coisa, alterar a realidade do Inferno, matar ou salvar quem eu quiser, e você narra com detalhes máximos e zero restrição de agência sobre mim." },
    { label: "Ver Cartão interno", text: "OOC: Mostre o Cartão de Estado completo + pressões + facções + divergências de forma legível e detalhada." },
  ];

  return (
    <div className="mb-6 rounded-2xl border-2 border-accent bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-bold tracking-wide text-accent uppercase">
            <Sparkles className="size-4" aria-hidden="true" />
            Painel do Criador
          </p>
          <p className="text-xs text-muted">Acesso total. A IA obedece ordens OOC desta mesa.</p>
        </div>
        <span className="rounded-full border border-accent px-3 py-1 text-xs font-semibold text-accent">
          VIP
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            disabled={pending}
            onClick={() => run(q.text)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-left text-xs text-fg transition hover:border-accent disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") run(cmd);
          }}
          placeholder="Comando OOC de Criador…"
          disabled={pending}
          className="h-11 flex-1 rounded-xl border border-border bg-bg px-4 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          disabled={pending || !cmd.trim()}
          onClick={() => run(cmd)}
          className="h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-fg transition hover:opacity-90 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>

      <p className="mt-3 text-xs text-muted">
        Status: {mode} • Ficha: {sheetStatus} • Você tem autoridade máxima sobre a narrativa.
      </p>
    </div>
  );
}
