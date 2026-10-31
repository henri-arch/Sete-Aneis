import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { CampaignSnapshot } from "@/lib/hella/types";

export type CampaignListItem = {
  id: string;
  name: string;
  updatedAt: number;
};

function asSnapshot(raw: unknown): CampaignSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as CampaignSnapshot;
}

/** List campaigns for the authenticated (or dev) user. */
export const listServerCampaigns = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<CampaignListItem[]> => {
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      name: string;
      updated_at: string | Date;
    }>(
      `select id, name, updated_at from hella_campaigns where user_id = $1 order by updated_at desc limit 50`,
      [context.userId],
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name || "Campanha",
      updatedAt:
        r.updated_at instanceof Date
          ? r.updated_at.getTime()
          : new Date(r.updated_at).getTime() || 0,
    }));
  });

/** Load one campaign payload owned by the user. */
export const loadServerCampaign = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const row = input as { id?: string };
    const id = typeof row?.id === "string" ? row.id.slice(0, 80) : "";
    if (!id) throw new Error("id inválido");
    return { id };
  })
  .handler(async ({ context, data }): Promise<{ ok: true; snapshot: CampaignSnapshot } | { ok: false; error: string }> => {
    const sql = await getSql();
    const rows = await sql.query<{ payload: unknown; name: string }>(
      `select payload, name from hella_campaigns where id = $1 and user_id = $2 limit 1`,
      [data.id, context.userId],
    );
    const row = rows[0];
    if (!row) return { ok: false, error: "Campanha não encontrada." };
    const snap = asSnapshot(row.payload);
    if (!snap) return { ok: false, error: "Payload inválido." };
    return {
      ok: true,
      snapshot: {
        ...snap,
        name: row.name || snap.name || "Campanha",
      },
    };
  });

/** Upsert campaign snapshot for the user. */
export const saveServerCampaign = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const row = input as { id?: string; name?: string; snapshot?: unknown };
    const id = typeof row?.id === "string" ? row.id.slice(0, 80) : "";
    const name = typeof row?.name === "string" ? row.name.slice(0, 80) : "Campanha";
    if (!id) throw new Error("id inválido");
    if (!row?.snapshot || typeof row.snapshot !== "object") throw new Error("snapshot inválido");
    const payload = JSON.stringify(row.snapshot);
    if (payload.length > 1_500_000) throw new Error("Campanha grande demais.");
    return { id, name, snapshot: row.snapshot };
  })
  .handler(async ({ context, data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const sql = await getSql();
      const existing = await sql.query<{ user_id: string }>(
        `select user_id from hella_campaigns where id = $1 limit 1`,
        [data.id],
      );
      if (existing[0] && existing[0].user_id !== context.userId) {
        return { ok: false, error: "Esta campanha pertence a outro usuário." };
      }
      if (existing[0]) {
        await sql.query(
          `update hella_campaigns set name = $3, payload = $4::jsonb, updated_at = NOW()
           where id = $1 and user_id = $2`,
          [data.id, context.userId, data.name, JSON.stringify(data.snapshot)],
        );
      } else {
        await sql.query(
          `insert into hella_campaigns (id, user_id, name, payload, created_at, updated_at)
           values ($1, $2, $3, $4::jsonb, NOW(), NOW())`,
          [data.id, context.userId, data.name, JSON.stringify(data.snapshot)],
        );
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "falha";
      return { ok: false, error: `Não foi possível salvar (${msg}).` };
    }
  });

/** Delete campaign owned by the user. */
export const deleteServerCampaign = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const row = input as { id?: string };
    const id = typeof row?.id === "string" ? row.id.slice(0, 80) : "";
    if (!id) throw new Error("id inválido");
    return { id };
  })
  .handler(async ({ context, data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const sql = await getSql();
    await sql.query(`delete from hella_campaigns where id = $1 and user_id = $2`, [
      data.id,
      context.userId,
    ]);
    return { ok: true };
  });
