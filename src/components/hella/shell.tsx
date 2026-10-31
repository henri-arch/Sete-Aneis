import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Flame, IdCard, ScrollText, UserRound, Download, Upload, Globe, FolderOpen } from "lucide-react";
import { gmTurn } from "@/lib/hella/gm";
import { textIsOoc, useCampaign, type TabId } from "@/lib/hella/store";
import type { GmIntent, GmResult, MaturityRating } from "@/lib/hella/types";
import { Atlas } from "@/components/hella/atlas";
import { SheetForm } from "@/components/hella/sheet-form";
import { StateCardView } from "@/components/hella/state-card";
import { Table } from "@/components/hella/table";
import { MaturityGate } from "@/components/hella/maturity-gate";
import { CreatorPanel } from "@/components/hella/creator-panel";
import { WorldPanel } from "@/components/hella/world-panel";
import { CampaignsPanel } from "@/components/hella/campaigns-panel";
import { formatClock } from "@/lib/hella/world";

const TABS: { id: TabId; label: string; icon: typeof Flame }[] = [
  { id: "atlas", label: "Atlas", icon: Flame },
  { id: "ficha", label: "Ficha", icon: UserRound },
  { id: "mesa", label: "Mesa", icon: ScrollText },
  { id: "cartao", label: "Cartão", icon: IdCard },
  { id: "mundo", label: "Mundo", icon: Globe },
  { id: "campanhas", label: "Campanhas", icon: FolderOpen },
];

function CampaignTools() {
  function handleExport() {
    const json = useCampaign.getState().exportCampaign();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sete-aneis-campanha-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function handleImport(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      const result = useCampaign.getState().importCampaign(raw);
      if (!result.ok) useCampaign.getState().setError(result.error);
    };
    reader.onerror = () => useCampaign.getState().setError("Não foi possível ler o arquivo.");
    reader.readAsText(file);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handleExport}
        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-card border border-border text-xs text-muted transition hover:border-primary hover:text-fg"
        title="Exportar campanha"
      >
        <Download className="size-3.5" />
        Exportar
      </button>
      <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-card border border-border text-xs text-muted transition hover:border-primary hover:text-fg">
        <Upload className="size-3.5" />
        Importar
        <input
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(e) => {
            handleImport(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}

export function Shell() {
  const tab = useCampaign((s) => s.tab);
  const setTab = useCampaign((s) => s.setTab);
  const pending = useCampaign((s) => s.pending);
  const error = useCampaign((s) => s.error);
  const maturity = useCampaign((s) => s.maturity);
  const worldClock = useCampaign((s) => s.world.clock);
  const [armedReset, setArmedReset] = useState(false);
  const [booted, setBooted] = useState(false);
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [showGate, setShowGate] = useState(false);
  const callGm = useServerFn(gmTurn);

  useEffect(() => {
    const boot = async () => {
      await useCampaign.persist.rehydrate();
      setBooted(true);
      // Short cinematic loading
      setTimeout(() => {
        setLoadingScreen(false);
        if (useCampaign.getState().maturity === "pending") {
          setShowGate(true);
        }
      }, 1800);
    };
    void boot();
  }, []);

  useEffect(() => {
    if (!armedReset) return;
    const id = window.setTimeout(() => setArmedReset(false), 4000);
    return () => window.clearTimeout(id);
  }, [armedReset]);

  function handleGateDone(rating: MaturityRating) {
    setShowGate(false);
    useCampaign.getState().setMaturity(rating);
  }

  async function run(intent: GmIntent, playerText: string, ooc: boolean) {
    const state = useCampaign.getState();
    if (state.pending) return;
    state.setPending(true);
    state.setError("");
    const oocTurn = textIsOoc(playerText, ooc);
    const history = state.log
      .filter((entry) => entry.kind === "mestre" || entry.kind === "jogador" || entry.kind === "ooc")
      .slice(-8)
      .map((entry) => ({ kind: entry.kind as "mestre" | "jogador" | "ooc", text: entry.text }));
    if (intent === "scene" && playerText) {
      state.pushLog({
        id: crypto.randomUUID(),
        kind: oocTurn ? "ooc" : "jogador",
        text: playerText,
        at: Date.now(),
      });
    }

    let result: GmResult;
    try {
      result = await callGm({
        data: {
          intent,
          ooc: oocTurn,
          playerText,
          mode: state.mode,
          sheetStatus: state.sheetStatus,
          sheet: state.sheet,
          history,
          card: state.card,
          pressures: state.pressures,
          factions: state.factions,
          maturity: state.maturity,
          world: state.world,
        },
      });
    } catch {
      result = { ok: false, error: "A mesa não alcançou o mestre." };
    }

    if (!result.ok) {
      state.setError(result.error);
      state.setPending(false);
      return;
    }

    state.applyTurn({
      narration: result.narration,
      kind: "mestre",
      mode: result.mode,
      sheetStatus: result.sheetStatus,
      card: result.card,
      pressures: result.pressures,
      factions: result.factions,
      maturity: result.maturity,
      world: result.world,
    });
  }

  // ========== LOADING SCREEN ==========
  if (loadingScreen || !booted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg">
        <div className="loading-pulse mb-6 h-16 w-16 rounded-full border-4 border-primary border-t-transparent" />
        <p className="font-display text-2xl font-bold tracking-widest text-fg uppercase">
          Sete Anéis
        </p>
        <p className="mt-2 text-sm text-muted">Abrindo o grimório…</p>
      </div>
    );
  }

  // ========== MATURITY GATE ==========
  if (showGate || maturity === "pending") {
    return <MaturityGate onDone={handleGateDone} />;
  }

  // ========== MAIN APP ==========
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <aside className="menu-slide fixed top-0 left-0 z-40 hidden h-full w-60 flex-col border-r border-border bg-elevated lg:flex">
        <div className="px-5 pt-8 pb-6">
          <p className="font-display text-2xl leading-none font-bold tracking-wide uppercase">Sete Anéis</p>
          <p className="mt-1 text-xs tracking-wide text-muted uppercase">
            {maturity === "creator" ? "✦ CRIADOR" : maturity === "adult" ? "Mesa +18" : "Mesa +14"}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`menu-item flex h-11 items-center gap-3 rounded-card px-3 text-sm transition-all duration-300 ${
                  active ? "bg-primary text-primary-fg" : "text-muted hover:bg-elevated hover:text-fg"
                }`}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="hidden space-y-2 px-4 pb-4 lg:block">
          <CampaignTools />
          <button
            type="button"
            onClick={() => {
              if (!armedReset) {
                setArmedReset(true);
                return;
              }
              useCampaign.getState().resetCampaign();
              setArmedReset(false);
              setShowGate(true);
            }}
            className="h-11 w-full rounded-card border border-border text-sm text-muted transition hover:border-primary"
          >
            {armedReset ? "Confirmar nova mesa" : "Nova campanha"}
          </button>
        </div>
      </aside>

      <main className="content-fade mx-auto w-full max-w-5xl px-4 pt-6 pb-28 lg:py-8 lg:pr-8 lg:pl-64">
        <div className="mb-6 flex flex-col gap-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-3xl leading-none font-bold tracking-wide uppercase">Sete Anéis</p>
              <p className="text-xs text-muted">{maturity === "creator" ? "✦ Criador" : maturity === "adult" ? "+18" : "+14"}</p>
              <p className="text-[10px] tracking-wide text-accent">{formatClock(worldClock)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!armedReset) {
                  setArmedReset(true);
                  return;
                }
                useCampaign.getState().resetCampaign();
                setArmedReset(false);
                setShowGate(true);
              }}
              className="h-11 rounded-card border border-border px-3 text-xs tracking-wide text-muted uppercase"
            >
              {armedReset ? "Confirmar" : "Nova mesa"}
            </button>
          </div>
          <CampaignTools />
        </div>

        {pending ? <p className="mb-4 text-sm text-accent">O Inferno está pensando…</p> : null}

        {error ? (
          <div className="mb-4 rounded-card border border-primary bg-elevated px-4 py-3 text-sm text-pretty text-fg" role="alert">
            <p className="mb-1 font-display text-xs tracking-wider text-primary uppercase">Erro da mesa</p>
            <p className="break-words">{error}</p>
            <button
              type="button"
              className="mt-2 text-xs text-muted underline hover:text-fg"
              onClick={() => useCampaign.getState().setError("")}
            >
              Dispensar
            </button>
          </div>
        ) : null}

        {maturity === "creator" ? (
          <CreatorPanel
            pending={pending}
            onSend={(text, ooc) => void run("scene", text, ooc)}
          />
        ) : null}

        <div key={tab} className="tab-enter">
          {tab === "atlas" ? (
            <Atlas
              onReport={() => void run("report", "Peço o relatório inicial da campanha.", false)}
              onPressure={() => void run("pressure", "O mundo anda sem o meu personagem.", false)}
            />
          ) : null}
          {tab === "ficha" ? (
            <SheetForm onValidate={() => void run("validate", "Submeto a ficha para validação.", false)} />
          ) : null}
          {tab === "mesa" ? (
            <Table onSend={(text, ooc) => void run("scene", text, ooc)} />
          ) : null}
          {tab === "cartao" ? <StateCardView /> : null}
          {tab === "mundo" ? (
            <WorldPanel
              onTick={() => void run("tick", "O Inferno avança um período sem a minha ação.", false)}
              onPressure={() => void run("pressure", "O mundo anda sem o meu personagem.", false)}
            />
          ) : null}
          {tab === "campanhas" ? <CampaignsPanel /> : null}
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-elevated lg:hidden"
        aria-label="Seções da mesa"
      >
        <div className="grid grid-cols-4">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-xs tracking-wide uppercase ${
                  active ? "bg-primary text-primary-fg" : "text-muted"
                }`}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
