import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useCampaign } from "@/lib/hella/store";
import {
  deleteServerCampaign,
  listServerCampaigns,
  loadServerCampaign,
  saveServerCampaign,
  type CampaignListItem,
} from "@/lib/hella/campaigns.server";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function CampaignsPanel() {
  const list = useCampaign((s) => s.listCampaigns);
  const activeId = useCampaign((s) => s.activeId);
  const createCampaign = useCampaign((s) => s.createCampaign);
  const switchCampaign = useCampaign((s) => s.switchCampaign);
  const renameCampaign = useCampaign((s) => s.renameCampaign);
  const deleteCampaign = useCampaign((s) => s.deleteCampaign);
  const exportCampaign = useCampaign((s) => s.exportCampaign);
  const importCampaign = useCampaign((s) => s.importCampaign);
  const hydrateFromSnapshot = useCampaign((s) => s.hydrateFromSnapshot);
  const setError = useCampaign((s) => s.setError);
  const slots = useCampaign((s) => s.slots);
  const [name, setName] = useState("");
  const campaigns = list();

  const callList = useServerFn(listServerCampaigns);
  const callSave = useServerFn(saveServerCampaign);
  const callLoad = useServerFn(loadServerCampaign);
  const callDelete = useServerFn(deleteServerCampaign);
  const { user, isPending: userPending } = useCurrentUserState();

  const [cloud, setCloud] = useState<CampaignListItem[]>([]);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudMsg, setCloudMsg] = useState("");
  const [cloudOk, setCloudOk] = useState(false);

  const refreshCloud = useCallback(async () => {
    setCloudBusy(true);
    setCloudMsg("");
    try {
      const rows = await callList({ data: {} });
      setCloud(rows);
      setCloudOk(true);
    } catch (e) {
      setCloudOk(false);
      const msg = e instanceof Error ? e.message : "falha";
      setCloudMsg(
        msg === "Unauthorized"
          ? "Entre na conta para sincronizar na nuvem."
          : `Nuvem indisponível (${msg}). Campanhas locais continuam ok.`,
      );
    } finally {
      setCloudBusy(false);
    }
  }, [callList]);

  useEffect(() => {
    void refreshCloud();
  }, [refreshCloud]);

  function doExport() {
    const json = exportCampaign();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sete-aneis-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function doImport(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      const result = importCampaign(raw);
      if (!result.ok) setError(result.error);
    };
    reader.onerror = () => setError("Não foi possível ler o arquivo.");
    reader.readAsText(file);
  }

  async function pushActiveToCloud() {
    setCloudBusy(true);
    setCloudMsg("");
    try {
      useCampaign.getState().saveActiveToSlots();
      const s = useCampaign.getState();
      const snap = s.slots[s.activeId];
      if (!snap) throw new Error("sem snapshot");
      const result = await callSave({
        data: {
          id: s.activeId,
          name: snap.name || "Campanha",
          snapshot: snap,
        },
      });
      if (!result.ok) {
        setCloudMsg(result.error);
      } else {
        setCloudMsg("Campanha ativa salva na nuvem.");
        await refreshCloud();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "falha";
      setCloudMsg(msg === "Unauthorized" ? "Faça login para salvar na nuvem." : msg);
    } finally {
      setCloudBusy(false);
    }
  }

  async function pullFromCloud(id: string) {
    setCloudBusy(true);
    setCloudMsg("");
    try {
      const result = await callLoad({ data: { id } });
      if (!result.ok) {
        setCloudMsg(result.error);
        return;
      }
      hydrateFromSnapshot(id, result.snapshot);
      setCloudMsg("Campanha carregada da nuvem neste navegador.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "falha";
      setCloudMsg(msg === "Unauthorized" ? "Faça login para carregar." : msg);
    } finally {
      setCloudBusy(false);
    }
  }

  async function removeFromCloud(id: string) {
    if (!window.confirm("Apagar esta campanha na nuvem?")) return;
    setCloudBusy(true);
    try {
      await callDelete({ data: { id } });
      await refreshCloud();
      setCloudMsg("Removida da nuvem.");
    } catch (e) {
      setCloudMsg(e instanceof Error ? e.message : "falha");
    } finally {
      setCloudBusy(false);
    }
  }

  const signedIn = Boolean(user && !user.isDevFallback);
  const canCloud = authEnabled || cloudOk; // dev user on PGLite also works via authMiddleware

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-display text-sm tracking-[0.28em] text-accent uppercase">Campanhas</p>
        <h1 className="font-display text-5xl leading-none font-extrabold text-fg">Mesas salvas</h1>
        <p className="mt-2 max-w-xl text-sm text-pretty text-muted">
          Locais neste navegador + sincronização no servidor (por usuário). Export JSON continua sendo
          backup portátil.
        </p>
      </header>

      {/* Cloud strip */}
      <section className="rounded-card border border-accent/40 bg-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-display text-sm tracking-wide text-accent uppercase">Nuvem</p>
            <p className="text-xs text-muted">
              {userPending
                ? "Verificando sessão…"
                : signedIn
                  ? `Conta: ${user?.displayName || user?.primaryEmail || user?.id}`
                  : authEnabled
                    ? "Não autenticado — login necessário para sync multi-dispositivo."
                    : "Modo local/dev — salvamento no banco embutido (PGLite) ou DATABASE_URL."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={cloudBusy}
              onClick={() => void refreshCloud()}
              className="h-9 rounded-card border border-border px-3 text-xs text-muted hover:text-fg disabled:opacity-40"
            >
              Atualizar lista
            </button>
            <button
              type="button"
              disabled={cloudBusy}
              onClick={() => void pushActiveToCloud()}
              className="h-9 rounded-card bg-primary px-3 text-xs text-primary-fg disabled:opacity-40"
            >
              Salvar ativa na nuvem
            </button>
          </div>
        </div>
        {cloudMsg ? <p className="mt-2 text-sm text-pretty text-muted">{cloudMsg}</p> : null}
        {cloud.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-2">
            {cloud.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-bg px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-semibold text-fg">{c.name}</span>
                  <span className="ml-2 text-xs text-muted">
                    {c.updatedAt ? new Date(c.updatedAt).toLocaleString("pt-BR") : ""}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={cloudBusy}
                    onClick={() => void pullFromCloud(c.id)}
                    className="h-8 rounded-card border border-border px-2 text-xs text-muted hover:text-fg"
                  >
                    Carregar
                  </button>
                  <button
                    type="button"
                    disabled={cloudBusy}
                    onClick={() => void removeFromCloud(c.id)}
                    className="h-8 rounded-card border border-border px-2 text-xs text-muted hover:text-fg"
                  >
                    Apagar nuvem
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted">
            {canCloud ? "Nenhuma campanha na nuvem ainda." : "Conecte auth/banco para listar a nuvem."}
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da nova campanha"
          className="h-11 min-w-[12rem] flex-1 rounded-card border border-border bg-bg px-3 text-sm text-fg outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => {
            createCampaign(name);
            setName("");
          }}
          className="h-11 rounded-card bg-primary px-4 text-sm text-primary-fg"
        >
          Nova campanha
        </button>
        <button
          type="button"
          onClick={doExport}
          className="h-11 rounded-card border border-border px-4 text-sm text-muted hover:border-primary hover:text-fg"
        >
          Exportar ativa
        </button>
        <label className="flex h-11 cursor-pointer items-center rounded-card border border-border px-4 text-sm text-muted hover:border-primary hover:text-fg">
          Importar JSON
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              doImport(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <ul className="flex flex-col gap-3">
        {campaigns.map((c) => (
          <li
            key={c.id}
            className={`rounded-card border p-4 ${
              c.id === activeId ? "border-primary bg-elevated" : "border-border bg-surface"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-bold text-fg">
                  {c.name}
                  {c.id === activeId ? (
                    <span className="ml-2 text-xs font-normal tracking-wider text-accent uppercase">
                      ativa
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted">
                  Local · {c.updatedAt ? new Date(c.updatedAt).toLocaleString("pt-BR") : "—"}
                  {slots[c.id]?.sheet?.name ? ` · ${slots[c.id]?.sheet?.name}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.id !== activeId ? (
                  <button
                    type="button"
                    onClick={() => switchCampaign(c.id)}
                    className="h-9 rounded-card bg-primary px-3 text-xs text-primary-fg"
                  >
                    Abrir
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const next = window.prompt("Novo nome", c.name);
                    if (next) renameCampaign(c.id, next);
                  }}
                  className="h-9 rounded-card border border-border px-3 text-xs text-muted hover:text-fg"
                >
                  Renomear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Apagar localmente "${c.name}"?`)) deleteCampaign(c.id);
                  }}
                  className="h-9 rounded-card border border-border px-3 text-xs text-muted hover:border-primary hover:text-fg"
                >
                  Apagar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-pretty text-muted">
        Limpar dados do navegador apaga só o local. Cópias na nuvem permanecem se você salvou. Em
        produção, defina DATABASE_URL (Neon) e autenticação real (VITE_AUTH_ENABLED).
      </p>
    </div>
  );
}
