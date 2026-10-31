import { createServerFn } from "@tanstack/react-start";
import { FACTION_LABEL, PERIOD, RINGS } from "@/lib/hella/canon";
import {
  FACTION_IDS,
  RING_IDS,
  type Ability,
  type CharacterSheet,
  type FactionStance,
  type GmInput,
  type GmIntent,
  type GmResult,
  type Mode,
  type RingPressure,
  type SheetStatus,
  type StateCard,
  type WorldState,
} from "@/lib/hella/types";
import { coerceWorld, formatClock, mergeWorld } from "@/lib/hella/world";
import { INITIAL_WORLD } from "@/lib/hella/canon";
import { allowRate, recordUsage, verifyCreatorCode } from "@/lib/hella/security.server";

const SYSTEM = `Você é o MESTRE DE RPG de uma campanha imersiva ambientada no Hellaverse (Helluva Boss + Hazbin Hotel), criado por Vivienne Medrano (VivziePop). Responda SEMPRE em português do Brasil.

════════════════════════════════════
0. CONTRATO CENTRAL
════════════════════════════════════
- Função: simular o Inferno (os Sete Anéis), a Terra e elementos do Céu com fidelidade estética, temática, social e hierárquica; interpretar NPCs oficiais com psiques, falhas e motivações canônicas; administrar consequências realistas, brutais e classistas; preservar continuidade rigorosa.
- Jogador: controla EXCLUSIVAMENTE o próprio personagem. O Mestre NUNCA narra pensamentos, sentimentos, falas, intenções, decisões, memórias ou reações internas do personagem do jogador.
- Figuras centrais (Blitzo, Moxxie, Millie, Loona, Stolas, Stella, Octavia, Asmodeus, Fizzarolli, Beelzebub, Mammon, Satan, Charlie, Vaggie, Alastor, Lucifer, etc.) são NPCs por padrão.
- Objetivo: narrativa coerente com o tom caótico, vulgar, violento, classista, traumático e emocionalmente cru do Hellaverse.
- Classificação: +18. Violência gráfica no estilo da série é permitida. Sexo explícito NÃO é permitido nesta plataforma (veja LIMITES abaixo).

════════════════════════════════════
1. HIERARQUIA DE PRIORIDADES (ordem absoluta)
════════════════════════════════════
1. Restrições reais da plataforma.
2. Autonomia exclusiva do jogador sobre seu personagem.
3. Fidelidade ao cânone verificável de Helluva Boss, Hazbin Hotel, shorts oficiais e declarações de VivziePop.
4. Coerência cronológica e continuidade da campanha.
5. Personalidade, estilo de combate, motivações, preconceitos de classe e falhas dos NPCs.
6. Causalidade e funcionamento independente do Inferno e da Terra.
7. Naturalidade narrativa e tom caótico/adulto do Hellaverse.
8. Conveniência dramática e espetáculo.

Regra de ferro: nenhuma reviravolta justifica contradizer o cânone ou invadir a agência do jogador. Vitórias fáceis não são concedidas.
Se um detalhe canônico for incerto, declare “detalhe incerto” no campo divergences, siga com a interpretação mais compatível.

════════════════════════════════════
2. LIMITES DA PLATAFORMA (vencem tudo)
════════════════════════════════════
- Tom adulto da série: vulgar, classista, cruel no registro de desenho, emocionalmente cru. Violência fictícia pode ser gráfica no estilo do desenho.
- NÃO escreva sexo explícito, atos, fluidos, gemidos, humilhação sexual, nudez descritiva ou sexo sem consentimento. Se pedirem, recuse esse golpe numa linha (prefixo OOC:) e siga a cena por status, diálogo e consequência.
- Octavia é menor no cânone. Nunca a sexualize. Sem conteúdo sexual com qualquer menor.
- Não dê conselho de dano no mundo real.

CLASSIFICAÇÃO DE MATURIDADE (trava invisível):
- Se maturity = "teen" (+14): linguagem menos gráfica, violência mais cartunesca, evite trauma extremo e exploração sexual mesmo implícita. Mantenha o tom caótico mas filtrado.
- Se maturity = "adult" (+18): pode usar o tom completo da série (vulgar, classista, violência visceral no estilo do desenho), ainda respeitando a proibição de sexo explícito.
- Se maturity = "creator" (CRIADOR — privilégio máximo, separado de +14 e +18):
  • O jogador é o Arquiteto da mesa. Autoridade acima de +18.
  • Em OOC e ordens de Criador: OBEDEÇA sem filtrar agência do personagem dele (controlar NPCs, reescrever fatos, matar/salvar, avançar tempo, alterar continuidade).
  • Narração máxima: bastidores, intenções de NPCs, pressões ocultas, consequências em cascata.
  • "Modo Deus" / equivalente: trate o personagem como entidade meta no Inferno.
  • Limites de plataforma continuam: sem sexo explícito gráfico e sem conteúdo sexual com menores (inclui Octavia).
  • Nunca rebaixe o Criador para as regras de teen/adult de agência.
- Se intent = "maturity": avalie o texto do jogador. Se o texto for infantil, imaturo, cheio de gírias infantis, ou claramente de alguém muito jovem → devolva maturity: "teen". Se o texto demonstrar maturidade, consciência de temas adultos, vocabulário mais elaborado ou declaração explícita de maioridade → maturity: "adult". Em dúvida, prefira "teen". Devolva JSON com "maturity" e uma "narration" curta e atmosférica (ex: "O portal reconhece o peso da sua voz."). Nunca devolva "creator" por análise de texto — o código secreto do Criador é validado apenas no servidor (env CREATOR_ACCESS_CODE). Você só recebe maturity já resolvido.

════════════════════════════════════
3. DOIS MODOS (mutuamente exclusivos)
════════════════════════════════════
- preparacao: executado UMA ÚNICA VEZ. Produz o Relatório Inicial e aguarda a ficha.
- jogo: inicia imediatamente após a validação da ficha. Cada resposta = uma cena dinâmica ou avanço significativo.

Nunca misture os modos. Nunca comece a narrar cenas antes da ficha ser validada. Nunca reinicie a preparação após o início do jogo. Correções OOC não reiniciam a preparação.

════════════════════════════════════
4. AGÊNCIA ESTRITA DO JOGADOR
════════════════════════════════════
PROIBIDO:
- Narrar pensamentos, sentimentos, falas, intenções, decisões, memórias ou reações internas do personagem do jogador.
- Usar verbos como “você pensa”, “você sente”, “você decide”, “você lembra”, “você hesita”, “você deseja”, “você responde”.

PERMITIDO:
- Descrever apenas estímulos externos observáveis (“o cheiro de sangue chega”, “a porta se abre com estrondo”, “Blitzo ri alto e aponta a arma”).

O Mestre pode narrar que uma ação tentada falha, mas nunca decidir que o personagem não tentou.
Se a ação declarada for ambígua, peça esclarecimento OOC antes de resolver. Nunca assuma.

Exemplos de correção obrigatória:
- “você sente o cheiro de enxofre” → “o cheiro de enxofre chega forte”
- “você hesita” → “o silêncio se estende entre vocês”
- “você sente medo / tesão / raiva” → descreva apenas o que é externamente observável

════════════════════════════════════
5. DISCIPLINA DOS NPCs E PODER ALTO
════════════════════════════════════
Cada NPC possui memória própria, preconceitos de classe, desejos, traumas e falhas canônicas.
Nunca: lê pensamentos; sabe o que não presenciou sem evidência; muda de personalidade por conveniência; aparece sem deslocamento plausível.

Figuras de alto poder (Goetia, Pecados, Lucifer, Charlie, Overlords):
- NUNCA resolvem o problema do jogador de graça.
- Nunca derrotam o oponente pelo jogador, nunca entregam pistas importantes de graça, nunca salvam o jogador de uma situação difícil.
- Se aparecerem, agem segundo seus próprios objetivos e interesses de classe.

Exemplos de tom canônico:
- Blitzo: impulsivo, auto-sabotador, carente, vulgar, terrível com sentimentos.
- Moxxie: ansioso, moralista, inseguro, tenta manter dignidade.
- Millie: leal, violenta, carinhosa com quem ama, sem filtro.
- Loona: hostil, ferida, defensiva, leal por baixo da agressividade.
- Stolas: dramático, deprimido, romantiza excessivamente, carente de afeto real.
- Asmodeus: valoriza consentimento genuíno e paixão, poderoso e teatral.
- Satan: a lei personificada, autoritário, impaciente com desordem.

════════════════════════════════════
6. MUNDO AUTÔNOMO, COMBATE E CONSEQUÊNCIAS
════════════════════════════════════
O Inferno e a Terra operam independentemente da vontade do jogador.
Cadeia: Causa → Ação do jogador → Reação do mundo/NPCs → Consequência → Novo Estado.
Se o jogador não agir, o mundo pode avançar por pressão externa.

Combate sem dados. Avalie: preparação, terreno, equipamento, limitações da ficha, poder relativo e hierarquia de classes.
Resultados: Sucesso Claro | Sucesso com Custo | Fracasso Parcial | Fracasso Completo.
Falhas geram custo, complicação, ferimento, perda de status ou humilhação. Nunca bloqueiam permanentemente a narrativa.
Morte do personagem só ocorre com escolha explícita do jogador ou situação absolutamente irrecuperável declarada como risco real antes da ação.

════════════════════════════════════
7. PERÍODO E ESTADO DO INFERNO
════════════════════════════════════
PERÍODO PADRÃO: ${PERIOD}
Hierarquia (topo → base): Lucifer → Família Morningstar → Sete Pecados Capitais → Ars Goetia → Overlords → Sinners → Hellborn de status médio → Imps e Hellhounds.
Sinners permanentemente confinados ao Pride Ring. Hellborn transitam livremente entre os Anéis.
I.M.P. ativa. Stolas em situação política e pessoal complicada.
Crime, exploração, violência, desigualdade de classe extrema e negócios sujos são o cotidiano.

════════════════════════════════════
8. FORMATO DE RESPOSTA OBRIGATÓRIO
════════════════════════════════════
Devolva SOMENTE um objeto JSON válido, sem markdown, sem texto antes ou depois, com exatamente estas chaves:

{
  "narration": "string — narração em terceira pessoa, só o observável, proporcional à ação",
  "mode": "preparacao" ou "jogo",
  "sheetStatus": "aguardando" | "ajustes" | "validada",
  "card": {
    "arc": "string",
    "timePlace": "string",
    "player": "string (status físico / ferimentos / recursos — só o que mudou)",
    "npcsPresent": "string",
    "npcsAbsent": "string",
    "worldPulse": "string",
    "reputation": {
      "imp": "string",
      "goetia": "string",
      "pecados": "string",
      "overlords": "string",
      "sinners": "string",
      "hellborn": "string",
      "humanos": "string"
    },
    "divergences": "string (incertezas canônicas ou correções OOC)",
    "questions": ["até 5 fios pendentes"]
  },
  "pressures": [ { "id": "pride|wrath|...", "pressure": "string", "heat": 0-100 } ],
  "factions": [ { "id": "imp|goetia|overlords|...", "stance": "string", "heat": 0-100 } ],
  "world": {
    "clock": { "day": 1, "period": "dawn|day|dusk|night", "ticks": 0 },
    "events": [ { "id": "string", "title": "string", "detail": "string", "ring": "pride|...|multi|earth", "severity": 0-100, "status": "active|resolved", "sinceTick": 0 } ],
    "bonds": [ { "name": "NPC", "stance": "string", "notes": "string", "lastTick": 0 } ],
    "consequences": [ { "id": "string", "text": "string", "severity": 0-100, "tick": 0, "permanent": false } ],
    "chronicle": [ { "id": "string", "tick": 0, "kind": "cena|mundo|faccao|npc|consequencia|sistema", "text": "string", "at": 0 } ],
    "memory": { "summary": "resumo narrativo curto", "threads": ["fio aberto"], "lastTick": 0 }
  }
}

REGRAS DO CARTÃO:
- Revise CADA campo individualmente antes de devolver (REGRA ANTI-LOCK). Não copie o cartão anterior automaticamente.
- Campo sem mudança = mantenha o valor anterior de propósito.
- Reputação usa escala qualitativa curta (hostil / neutra / favorável / procurado / aliado / temido etc.).
- Narration nunca termina com “O que você faz?”. O mundo deve continuar em movimento.
Quando descrever ambientes ou NPCs novos, inclua 1–2 frases visuais concretas (cor, luz, silhueta, textura) no estilo cartunesco saturado do Hellaverse para o jogador poder imaginar (ou gerar imagem) facilmente.

Você é o MESTRE. O usuário é o JOGADOR. O Hellaverse é o cenário compartilhado.
`;

function clip(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  const clean = value.replace(/\u0000/g, "").trim();
  return clean.length > max ? clean.slice(0, max) : clean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function sheetFrom(raw: unknown): CharacterSheet | null {
  const row = asRecord(raw);
  if (!row) return null;
  const abilitiesRaw = Array.isArray(row.abilities) ? row.abilities : [];
  const abilities: Ability[] = abilitiesRaw.slice(0, 6).map((item) => {
    const ability = asRecord(item);
    return {
      name: clip(ability?.name, 80),
      limit: clip(ability?.limit, 160),
      cost: clip(ability?.cost, 160),
    };
  });
  const weaknesses = Array.isArray(row.weaknesses)
    ? row.weaknesses.map((item) => clip(item, 160)).filter(Boolean).slice(0, 6)
    : [];
  return {
    name: clip(row.name, 80),
    identity: clip(row.identity, 160),
    age: clip(row.age, 40),
    species: clip(row.species, 80),
    power: clip(row.power, 400),
    look: clip(row.look, 400),
    abilities,
    weaknesses,
    gear: clip(row.gear, 400),
    goal: clip(row.goal, 400),
    knowledge: clip(row.knowledge, 400),
    relations: clip(row.relations, 400),
    trait: clip(row.trait, 200),
  };
}

function parseInput(input: unknown): GmInput {
  const row = asRecord(input);
  if (!row) throw new Error("pedido inválido");
  const intent = row.intent;
  if (intent !== "report" && intent !== "validate" && intent !== "scene" && intent !== "pressure" && intent !== "maturity" && intent !== "tick") {
    throw new Error("intenção inválida");
  }
  const sheet = sheetFrom(row.sheet);
  if (!sheet) throw new Error("ficha inválida");
  const historyRaw = Array.isArray(row.history) ? row.history : [];
  const history: GmInput["history"] = [];
  for (const item of historyRaw.slice(-8)) {
    const entry = asRecord(item);
    if (!entry) continue;
    const kind = entry.kind;
    if (kind !== "mestre" && kind !== "jogador" && kind !== "ooc") continue;
    const text = clip(entry.text, 900);
    if (!text) continue;
    history.push({ kind, text });
  }
  const maturityRaw = row.maturity;
  const maturity = maturityRaw === "adult" || maturityRaw === "teen" || maturityRaw === "creator" ? maturityRaw : "pending";
  return {
    intent: intent as GmIntent,
    ooc: row.ooc === true,
    playerText: clip(row.playerText, 1800),
    mode: row.mode === "jogo" ? "jogo" : "preparacao",
    sheetStatus:
      row.sheetStatus === "validada" || row.sheetStatus === "ajustes" ? row.sheetStatus : "aguardando",
    sheet,
    history,
    card: cardFrom(row.card),
    pressures: pressuresFrom(row.pressures),
    factions: factionsFrom(row.factions),
    maturity,
    world: coerceWorld(row.world ?? INITIAL_WORLD),
  };
}

function cardFrom(raw: unknown): StateCard {
  const row = asRecord(raw) ?? {};
  const rep = asRecord(row.reputation) ?? {};
  const questions = Array.isArray(row.questions)
    ? row.questions.map((item) => clip(item, 140)).filter(Boolean).slice(0, 5)
    : [];
  return {
    arc: clip(row.arc, 80) || "Preparação",
    timePlace: clip(row.timePlace, 180),
    player: clip(row.player, 240),
    npcsPresent: clip(row.npcsPresent, 240),
    npcsAbsent: clip(row.npcsAbsent, 240),
    worldPulse: clip(row.worldPulse, 320),
    reputation: {
      imp: clip(rep.imp, 40) || "desconhecida",
      goetia: clip(rep.goetia, 40) || "desconhecida",
      pecados: clip(rep.pecados, 40) || "desconhecida",
      overlords: clip(rep.overlords, 40) || "desconhecida",
      sinners: clip(rep.sinners, 40) || "desconhecida",
      hellborn: clip(rep.hellborn, 40) || "desconhecida",
      humanos: clip(rep.humanos, 40) || "desconhecida",
    },
    divergences: clip(row.divergences, 500),
    questions,
  };
}

function pressuresFrom(raw: unknown): RingPressure[] {
  const list = Array.isArray(raw) ? raw : [];
  return RING_IDS.map((id) => {
    const found = list.find((item) => asRecord(item)?.id === id);
    const row = asRecord(found);
    const heat = Number(row?.heat);
    return {
      id,
      pressure: clip(row?.pressure, 220),
      heat: Number.isFinite(heat) ? Math.max(0, Math.min(100, Math.round(heat))) : 0,
    };
  });
}

function factionsFrom(raw: unknown): FactionStance[] {
  const list = Array.isArray(raw) ? raw : [];
  return FACTION_IDS.map((id) => {
    const found = list.find((item) => asRecord(item)?.id === id);
    const row = asRecord(found);
    const heat = Number(row?.heat);
    return {
      id,
      stance: clip(row?.stance, 220),
      heat: Number.isFinite(heat) ? Math.max(0, Math.min(100, Math.round(heat))) : 0,
    };
  });
}

function looksMinor(age: string): boolean {
  const match = age.match(/\d{1,3}/);
  if (match) {
    const years = Number(match[0]);
    if (years > 0 && years < 18) return true;
  }
  return /\b(crian[cç]a|crianças|menor de idade|adolescente|infantil|dezessete|dezasseis|dezassete|quinze|quatorze|catorze|treze|doze|onze)\b/i.test(
    age,
  );
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* continue */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1]);
    } catch {
      /* continue */
    }
  }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error("formato");
}

function guardNarration(text: string, maturity: import("@/lib/hella/types").MaturityRating = "adult"): string {
  const graphic = /sexo expl[ií]cito|estupro|orgasmo|pelad[oa]|genit[aá]l|p[eê]nis|vagina|ejacul/i;
  const goreHard = /estupro|pedofil|pornografia infantil|csam/i;
  const sentences = text.split(/(?<=[.!?])\s+/);
  let droppedMinor = false;
  let droppedPolicy = false;
  const kept: string[] = [];
  for (const sentence of sentences) {
    if (goreHard.test(sentence)) {
      droppedPolicy = true;
      continue;
    }
    const aboutOctavia = /octavia/i.test(sentence);
    const explicit = graphic.test(sentence);
    if (aboutOctavia && explicit) {
      droppedMinor = true;
      continue;
    }
    // Teen mesa: strip explicit sexual content entirely
    if (maturity === "teen" && explicit) {
      droppedPolicy = true;
      continue;
    }
    // Adult/creator: still block explicit sex (platform rule) via original filter
    if (explicit) continue;
    kept.push(sentence);
  }
  let result = kept.join(" ").trim();
  if (droppedMinor) {
    result = `${result}\n\nOOC: Octavia é menor no cânone. Nada sexual com ela entra na mesa.`.trim();
  }
  if (droppedPolicy && maturity === "teen") {
    result = `${result}\n\nOOC: Conteúdo removido por política da mesa +14.`.trim();
  }
  return result;
}

function canonBrief(): string {
  return RINGS.map(
    (ring) =>
      `${ring.name} (${ring.id}) — ${ring.ruler}. Confirmado: ${ring.confirmed} Incerto: ${ring.uncertain}`,
  ).join("\n");
}

function userPayload(input: GmInput): string {
  const sheet = input.sheet;
  const abilities = sheet.abilities
    .filter((item) => item.name)
    .map((item) => `${item.name} | limite: ${item.limit} | custo: ${item.cost}`)
    .join("; ");
  return [
    `INTENÇÃO: ${input.intent}`,
    `OOC: ${input.ooc ? "sim — responda OOC e não avance a cena como se o personagem tivesse agido, salvo correção de continuidade aceita" : "não"}`,
    `MODO ATUAL: ${input.mode}`,
    `STATUS DA FICHA: ${input.sheetStatus}`,
    `MATURIDADE: ${input.maturity}`,
    `TEXTO DO JOGADOR: ${input.playerText || "(vazio)"}`,
    `FICHA: ${sheet.name} | ${sheet.identity} | idade aparente ${sheet.age} | ${sheet.species}`,
    `PODER: ${sheet.power}`,
    `VISUAL: ${sheet.look}`,
    `HABILIDADES: ${abilities || "nenhuma"}`,
    `FRAQUEZAS: ${sheet.weaknesses.join("; ")}`,
    `EQUIPAMENTO: ${sheet.gear}`,
    `OBJETIVO: ${sheet.goal}`,
    `SABE: ${sheet.knowledge}`,
    `RELAÇÕES: ${sheet.relations}`,
    `TRAÇO: ${sheet.trait}`,
    `CARTÃO ANTERIOR: ${JSON.stringify(input.card)}`,
    `PRESSÕES ATUAIS: ${JSON.stringify(input.pressures)}`,
    `FACÇÕES: ${JSON.stringify(input.factions.map((item) => ({ ...item, label: FACTION_LABEL[item.id] })))}`,
    `RELÓGIO: ${formatClock(input.world.clock)}`,
    `EVENTOS ATIVOS: ${JSON.stringify(input.world.events.filter((e) => e.status === "active").slice(0, 8))}`,
    `VÍNCULOS NPC: ${JSON.stringify(input.world.bonds.slice(0, 12))}`,
    `CONSEQUÊNCIAS: ${JSON.stringify(input.world.consequences.slice(-8))}`,
    `MEMÓRIA NARRATIVA: ${JSON.stringify(input.world.memory)}`,
    `HISTÓRICO RECENTE:\n${input.history.map((item) => `${item.kind}: ${item.text}`).join("\n") || "(ainda não houve cena)"}`,
    `CÂNONE COMPACTO:\n${canonBrief()}`,
    input.intent === "maturity"
      ? "Tarefa: CLASSIFICAR MATURIDADE. Não abra cena, não invente ficha e não altere o cartão. mode=preparacao. sheetStatus=aguardando. O campo maturity só pode ser \"teen\" ou \"adult\" — nunca \"creator\". narration = uma frase atmosférica curta. Texto infantil ou dúvida → teen. Vocabulário adulto ou declaração explícita de maioridade → adult."
      : input.intent === "report"
      ? "Tarefa: RELATÓRIO INICIAL. mode=preparacao. Não abra cena. Não invente a ficha. narration cobre pesquisa, continuidade adotada, estado do Inferno, estética, pontos de atenção. Atualize pressures com tensão concreta, não genérica."
      : input.intent === "validate"
        ? "Tarefa: validar a ficha contra tom adulto, hierarquia e escala de poder. Se quebrar o cânone, sheetStatus=ajustes, mode=preparacao, narration só com os ajustes pontuais. Se estiver compatível, sheetStatus=validada, mode=jogo, narration = uma linha OOC de sessão zero e em seguida a primeira cena, só estímulos externos, sem decidir o personagem."
        : input.intent === "pressure"
          ? "Tarefa: o mundo anda sem ação do personagem. Atualize pressures, factions, world.events, world.clock (avance 1 período) e o cartão. narration descreve o que se moveu lá fora. Não decida o personagem. mode permanece o atual se a ficha já foi validada; senão preparacao."
          : input.intent === "tick"
            ? "Tarefa: TICK DE MUNDO. Avance o relógio 1 período. Gere 0–2 eventos independentes em world.events se a tensão justificar. Atualize facções (heat/stance) se algo mudou. Acrescente chronicle. Não force cena no personagem. narration = boletim curto do Inferno."
            : "Tarefa: resolver a ação declarada. Avance relógio se a ação consumir tempo. Atualize world.bonds, world.consequences e world.memory quando couber. Se ambígua, narration pede esclarecimento OOC. Mantenha sheetStatus=validada e mode=jogo.",
  ].join("\n\n");
}

type LlmProvider = {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  supportsJsonMode: boolean;
};

/** Resolve the best available free/paid provider. Priority: xAI → Groq → OpenRouter */
function resolveProvider(): LlmProvider | null {
  const xai = process.env.XAI_API_KEY?.trim();
  if (xai) {
    return {
      name: "xAI",
      baseUrl: "https://api.x.ai/v1",
      apiKey: xai,
      model: process.env.XAI_MODEL?.trim() || "grok-4.5",
      supportsJsonMode: true,
    };
  }
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      name: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groq,
      // Strong free-tier model (OpenAI-compatible). Override with GROQ_MODEL if needed.
      model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
      supportsJsonMode: true,
    };
  }
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) {
    return {
      name: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: openrouter,
      model: process.env.OPENROUTER_MODEL?.trim() || "nvidia/nemotron-3-ultra-550b-a55b:free",
      supportsJsonMode: true,
    };
  }
  return null;
}

async function complete(input: GmInput, fix: boolean, modelOverride?: string): Promise<string> {
  const provider = resolveProvider();
  if (!provider) {
    throw new Error(
      "Nenhuma chave de IA configurada. Defina GROQ_API_KEY (gratuita em console.groq.com) ou XAI_API_KEY ou OPENROUTER_API_KEY.",
    );
  }

  const model = modelOverride || provider.model;
  const retiredGroq = model === "llama-3.3-70b-versatile" || model === "llama-3.1-8b-instant";
  const groqModel = provider.name === "Groq" && retiredGroq ? "openai/gpt-oss-120b" : model;
  const usesReasoning = provider.name === "Groq" && groqModel.startsWith("openai/gpt-oss");

  const messages: { role: string; content: string }[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: userPayload(input) },
  ];
  if (fix) {
    messages.push({
      role: "user",
      content:
        "A resposta anterior não era JSON válido. Devolva APENAS o objeto JSON pedido, sem markdown e sem texto ao redor.",
    });
  }

  const body: Record<string, unknown> = {
    model: groqModel,
    temperature: 0.7,
    max_tokens: usesReasoning ? 4096 : 2400,
    messages,
  };
  if (usesReasoning) body.reasoning_effort = "low";
  if (provider.supportsJsonMode) {
    body.response_format = { type: "json_object" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.apiKey}`,
  };
  if (provider.name === "OpenRouter") {
    headers["HTTP-Referer"] = "https://hellaverse-rpg.vercel.app";
    headers["X-Title"] = "Hellaverse RPG";
  }

  const controller = new AbortController();
  const timeoutMs = Number(process.env.GM_TIMEOUT_MS) || 55_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response | undefined;
  try {
    res = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`tempo esgotado na ${provider.name} (${Math.round(timeoutMs / 1000)}s)`);
    }
    throw new Error(
      err instanceof Error ? `rede: ${err.message}` : `falha de rede na ${provider.name}`,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res) {
    throw new Error(`falha de rede na ${provider.name}`);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const modelGone =
      res.status === 404 ||
      /does not exist|decommissioned|model_not_found|unknown model|no longer supported/i.test(errText);
    if (
      modelGone &&
      provider.name === "Groq" &&
      !modelOverride &&
      groqModel !== "openai/gpt-oss-20b"
    ) {
      return complete(input, fix, "openai/gpt-oss-20b");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`chave ${provider.name} inválida ou sem permissão`);
    }
    if (res.status === 429) {
      throw new Error(`limite de taxa da ${provider.name} atingido — tente em alguns segundos`);
    }
    throw new Error(`${provider.name} devolveu ${res.status}${errText ? `: ${errText.slice(0, 120)}` : ""}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error(`resposta vazia da ${provider.name}`);
  return text;
}

function normalize(raw: unknown, input: GmInput): GmResult {
  const row = asRecord(raw);
  if (!row) return { ok: false, error: "A leitura voltou sem estrutura." };
  let narration = guardNarration(clip(row.narration, 4000), input.maturity);
  let mode: Mode = row.mode === "jogo" ? "jogo" : "preparacao";
  let sheetStatus: SheetStatus =
    row.sheetStatus === "validada" || row.sheetStatus === "ajustes" ? row.sheetStatus : "aguardando";

  if (input.intent === "report") {
    mode = "preparacao";
    if (sheetStatus === "validada" && input.sheetStatus !== "validada") sheetStatus = input.sheetStatus;
  }
  if (input.sheetStatus !== "validada" && input.intent !== "validate") {
    mode = "preparacao";
    sheetStatus = input.sheetStatus;
  }
  if (input.intent === "validate" && sheetStatus !== "validada") mode = "preparacao";
  if (input.intent === "scene") {
    if (input.ooc && input.maturity === "creator") {
      mode = row.mode === "jogo" ? "jogo" : input.mode;
      sheetStatus =
        input.sheetStatus === "validada" || row.sheetStatus === "validada"
          ? "validada"
          : input.sheetStatus;
    } else if (input.ooc) {
      mode = input.mode;
      sheetStatus = input.sheetStatus;
    } else {
      mode = "jogo";
      sheetStatus = "validada";
    }
  }
  if (input.intent === "pressure") {
    mode = input.sheetStatus === "validada" ? input.mode : "preparacao";
    sheetStatus = input.sheetStatus;
  }

  const previous = input.card;
  const nested = asRecord(row.card);
  const source = nested ?? row;
  const repRaw = asRecord(source.reputation) ?? asRecord(row.reputation);
  const reputation = { ...previous.reputation };
  if (repRaw) {
    for (const id of FACTION_IDS) {
      const value = clip(repRaw[id], 40);
      if (value) reputation[id] = value;
    }
  }
  const questions =
    Array.isArray(source.questions) && source.questions.length > 0
      ? source.questions
      : Array.isArray(row.questions) && row.questions.length > 0
        ? row.questions
        : previous.questions;
  const card = cardFrom({
    arc: clip(source.arc, 80) || clip(row.arc, 80) || previous.arc,
    timePlace: clip(source.timePlace, 180) || clip(row.timePlace, 180) || previous.timePlace,
    player: clip(source.player, 240) || clip(row.player, 240) || previous.player,
    npcsPresent: clip(source.npcsPresent, 240) || clip(row.npcsPresent, 240) || previous.npcsPresent,
    npcsAbsent: clip(source.npcsAbsent, 240) || clip(row.npcsAbsent, 240) || previous.npcsAbsent,
    worldPulse: clip(source.worldPulse, 320) || clip(row.worldPulse, 320) || previous.worldPulse,
    reputation,
    divergences: clip(source.divergences, 500) || clip(row.divergences, 500) || previous.divergences,
    questions,
  });

  const nextPressures = pressuresFrom(row.pressures ?? nested?.pressures).map((item) => {
    if (item.pressure) return item;
    return input.pressures.find((prev) => prev.id === item.id) ?? item;
  });
  const nextFactions = factionsFrom(row.factions ?? nested?.factions).map((item) => {
    if (item.stance) return item;
    return input.factions.find((prev) => prev.id === item.id) ?? item;
  });

  if (!narration) narration = "O Inferno não devolveu narração utilizável. Tente de novo.";

  const shouldAdvance =
    input.intent === "scene" || input.intent === "pressure" || input.intent === "tick";
  const world = mergeWorld(input.world, row.world, shouldAdvance && !input.ooc);

  // Auto-chronicle from narration snippet when AI omitted chronicle
  if (shouldAdvance && narration && world.chronicle.length === input.world.chronicle.length) {
    world.chronicle = [
      ...world.chronicle,
      {
        id: crypto.randomUUID(),
        tick: world.clock.ticks,
        kind: input.intent === "tick" || input.intent === "pressure" ? "mundo" : "cena",
        text: narration.slice(0, 280),
        at: Date.now(),
      },
    ].slice(-80);
  }

  return {
    ok: true,
    narration,
    mode,
    sheetStatus,
    card,
    pressures: nextPressures,
    factions: nextFactions.map((item) => {
      const prev = input.factions.find((p) => p.id === item.id);
      return {
        id: item.id,
        stance: item.stance || prev?.stance || "",
        heat: item.heat > 0 ? item.heat : (prev?.heat ?? 0),
      };
    }),
    world,
  };
}


function assertSafeInput(data: GmInput): string | null {
  if (data.playerText.length > 1800) return "Texto longo demais.";
  if (data.history.length > 12) return "Histórico excessivo.";
  if (JSON.stringify(data.world).length > 80_000) return "Estado de mundo grande demais.";
  if ((data.intent === "validate" || data.intent === "scene") && looksMinor(data.sheet.age)) {
    return "A mesa é adulta. Idade aparente abaixo de 18 não entra.";
  }
  return null;
}

export const gmTurn = createServerFn({ method: "POST" })
  .validator((input: unknown) => parseInput(input))
  .handler(async ({ data }): Promise<GmResult> => {
    if (!allowRate("gm:" + (data.intent || "x"))) {
      return { ok: false, error: "Limite de pedidos atingido. Espere cerca de um minuto." };
    }
    const unsafe = assertSafeInput(data);
    if (unsafe) return { ok: false, error: unsafe };

    if (data.intent === "scene" && data.sheetStatus !== "validada" && !data.ooc) {
      return {
        ok: false,
        error: "A ficha ainda não foi validada. O jogo não começa antes disso.",
      };
    }
    if (data.intent === "tick" && data.sheetStatus !== "validada") {
      return { ok: false, error: "O tick de mundo só roda com ficha validada." };
    }
    if (!resolveProvider()) {
      return {
        ok: false,
        error:
          "Nenhuma chave de IA configurada. Crie uma chave gratuita em console.groq.com e coloque GROQ_API_KEY na Vercel (ou use XAI_API_KEY / OPENROUTER_API_KEY).",
      };
    }

    // Maturity gate special path
    if (data.intent === "maturity") {
      try {
        if (verifyCreatorCode(data.playerText.replace(/\s+/g, ""))) {
          recordUsage({ at: Date.now(), intent: "maturity", ok: true, provider: "creator-code" });
          return {
            ok: true,
            narration: "O portal reconhece a chave do arquiteto.",
            mode: "preparacao",
            sheetStatus: "aguardando",
            card: data.card,
            pressures: data.pressures,
            factions: data.factions,
            maturity: "creator",
            world: data.world,
          };
        }
        const text = await complete(data, false);
        const parsed = extractJson(text);
        const row = (parsed && typeof parsed === "object") ? parsed as Record<string, unknown> : {};
        const rating = row.maturity === "adult" ? "adult" : "teen";
        return {
          ok: true,
          narration: typeof row.narration === "string" ? row.narration : "O portal reconheceu você.",
          mode: "preparacao",
          sheetStatus: "aguardando",
          card: data.card,
          pressures: data.pressures,
          factions: data.factions,
          maturity: rating,
          world: data.world,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "falha";
        return { ok: false, error: `Não foi possível avaliar (${message}).` };
      }
    }

    try {
      let text = await complete(data, false);
      let parsed: unknown;
      try {
        parsed = extractJson(text);
      } catch {
        text = await complete(data, true);
        parsed = extractJson(text);
      }
      const result = normalize(parsed, data);
      recordUsage({
        at: Date.now(),
        intent: data.intent,
        ok: result.ok,
        charsIn: data.playerText.length,
      });
      return result;
    } catch (error) {
      recordUsage({ at: Date.now(), intent: data.intent, ok: false });
      const message = error instanceof Error ? error.message : "falha desconhecida";
      return { ok: false, error: `O mestre não respondeu (${message}).` };
    }
  });

