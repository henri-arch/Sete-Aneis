import { useEffect, useRef, useState } from "react";
import { Send, Volume2 } from "lucide-react";
import { useCampaign, textIsOoc } from "@/lib/hella/store";

function speak(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.slice(0, 600));
  u.lang = "pt-BR";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

type Props = {
  onSend: (text: string, ooc: boolean) => void;
};

export function Table({ onSend }: Props) {
  const log = useCampaign((s) => s.log);
  const mode = useCampaign((s) => s.mode);
  const sheetStatus = useCampaign((s) => s.sheetStatus);
  const pending = useCampaign((s) => s.pending);
  const [text, setText] = useState("");
  const [ooc, setOoc] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [log.length, pending]);

  const oocTurn = textIsOoc(text, ooc);
  const sceneLocked = mode !== "jogo" && !oocTurn;
  const canSend = Boolean(text.trim()) && !pending && !sceneLocked;

  return (
    <div className="flex min-h-[70dvh] flex-col gap-4">
      <header>
        <p className="font-display text-sm tracking-[0.28em] text-accent uppercase">Mesa</p>
        <h1 className="font-display text-5xl leading-none font-extrabold text-fg">
          {mode === "jogo" ? "Em cena" : "Preparação"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-pretty text-muted">
          {sheetStatus === "validada"
            ? "Declare a ação. O mestre não escolhe por você."
            : "Sem ficha validada não há cena. Peça o relatório no atlas ou valide a ficha. OOC ainda passa."}
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {log.length === 0 ? (
          <p className="rounded-card border border-dashed border-border px-4 py-8 text-sm text-pretty text-muted">
            O Inferno ainda não falou nesta campanha. No atlas, peça o relatório inicial — a estrutura dos anéis
            já está de pé sem isso.
          </p>
        ) : null}
        {log.map((entry) => (
          <article
            key={entry.id}
            className={
              "max-w-[42rem] rounded-card border px-4 py-3 text-sm text-pretty " +
              (entry.kind === "jogador"
                ? "ml-auto border-primary bg-elevated text-fg"
                : entry.kind === "ooc"
                  ? "border-accent bg-bg text-accent"
                  : entry.kind === "sistema"
                    ? "border-border bg-bg text-muted"
                    : "border-border bg-surface text-fg")
            }
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="font-display text-xs tracking-[0.2em] uppercase text-muted">
                {entry.kind === "mestre" ? "Mestre" : entry.kind === "jogador" ? "Você" : entry.kind}
              </p>
              {entry.kind === "mestre" ? (
                <button
                  type="button"
                  onClick={() => speak(entry.text)}
                  className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-muted transition hover:bg-elevated hover:text-fg"
                  title="Ouvir fala"
                >
                  <Volume2 className="size-3.5" />
                  Ouvir
                </button>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap">{entry.text}</p>
          </article>
        ))}
        {pending ? <p className="text-sm text-accent">O Inferno está pensando…</p> : null}
        <div ref={endRef} />
      </div>

      <form
        className="sticky bottom-20 z-10 flex flex-col gap-2 rounded-card border border-border bg-surface p-3 lg:bottom-4"
        onSubmit={(event) => {
          event.preventDefault();
          const value = text.trim();
          if (!value || pending || (mode !== "jogo" && !textIsOoc(value, ooc))) return;
          onSend(value, textIsOoc(value, ooc));
          setText("");
        }}
      >
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={ooc}
            onChange={(event) => setOoc(event.target.checked)}
            className="size-4 accent-primary"
          />
          OOC — fora da cena
        </label>
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) {
                  onSend(text.trim(), textIsOoc(text, ooc));
                  setText("");
                }
              }
            }}
            rows={2}
            placeholder={sceneLocked ? "Ligue OOC ou valide a ficha" : "A ação, em uma frase (Enter envia · Shift+Enter nova linha)"}
            className="min-h-11 flex-1 resize-none rounded-card border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-primary"
            aria-label="Texto da ação ou OOC"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Enviar ação"
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-card bg-primary text-primary-fg disabled:opacity-40"
          >
            <Send className="size-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
