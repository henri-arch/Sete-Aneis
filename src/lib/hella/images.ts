import { createServerFn } from "@tanstack/react-start";

/** Visual identity of each Ring for consistent illustration style */
export const RING_VISUAL: Record<string, { color: string; gradient: string; mood: string; prompt: string }> = {
  pride: {
    color: "#c41e3a",
    gradient: "from-[#2b0a14] via-[#5c0a1f] to-[#1a050c]",
    mood: "céu vermelho-sangue, neon rosa e preto, Imp City",
    prompt:
      "Helluva Boss / Hazbin Hotel inspired digital illustration of the Pride Ring: blood-red sky, dark rocky ground, neon signs of Imp City and Pentagram City, towering gothic-infernal architecture, saturated colors, exaggerated cartoon style, dramatic lighting, no text, no watermark",
  },
  wrath: {
    color: "#e85d04",
    gradient: "from-[#2a1505] via-[#7c2d12] to-[#1a0c04]",
    mood: "deserto ocre, céu em brasa, ranches e penhascos",
    prompt:
      "Helluva Boss style illustration of the Wrath Ring: ochre desert, blazing orange sky, rocky cliffs, rural imp farms and ranches, heat haze, bold saturated colors, exaggerated cartoon dark fantasy, dramatic atmosphere, no text",
  },
  gluttony: {
    color: "#f4a261",
    gradient: "from-[#1f1408] via-[#9a3412] to-[#120c05]",
    mood: "oásis dourado, festa, mel e algodão-doce",
    prompt:
      "Helluva Boss style illustration of the Gluttony Ring: golden oasis, party lights, honey and cotton-candy atmosphere, hellhound festival grounds, warm saturated colors, exaggerated cartoon style, joyful yet infernal, no text",
  },
  greed: {
    color: "#2a9d8f",
    gradient: "from-[#041a18] via-[#0f4c45] to-[#020f0e]",
    mood: "fábricas, sucata, canais verdes, céu esverdeado",
    prompt:
      "Helluva Boss style illustration of the Greed Ring: industrial scrapyard, green stagnant canals, polluted greenish sky, Mammon factories and neon, dirty neon lights, bold cartoon dark fantasy, saturated toxic colors, no text",
  },
  lust: {
    color: "#e63980",
    gradient: "from-[#1a0512] via-[#6b0f3a] to-[#0f030a]",
    mood: "neon rosa e roxo, clubes, névoa sensual",
    prompt:
      "Helluva Boss / Hazbin style illustration of the Lust Ring: pink and purple neon clubs, sensual mist, Asmodean architecture, glowing signs, saturated neon colors, exaggerated cartoon style, atmospheric night, no explicit content, no text",
  },
  envy: {
    color: "#4cc9f0",
    gradient: "from-[#04121a] via-[#0c4a6e] to-[#020a12]",
    mood: "águas frias, azul elétrico, torres afiadas",
    prompt:
      "Helluva Boss style illustration of the Envy Ring: cold electric-blue waters, sharp towers, icy atmosphere, envious neon, bold saturated cyan and black, exaggerated cartoon dark fantasy, dramatic reflections, no text",
  },
  sloth: {
    color: "#7b2cbf",
    gradient: "from-[#0f0618] via-[#3b0764] to-[#080310]",
    mood: "névoa roxa, sonolência, arquitetura onírica",
    prompt:
      "Helluva Boss style illustration of the Sloth Ring: purple dreamy fog, sleepy architecture, floating structures, soft yet ominous lighting, saturated violet tones, exaggerated cartoon style, dreamlike hellish atmosphere, no text",
  },
};

/**
 * Tries to generate an image via xAI API.
 * Falls back gracefully if the endpoint is unavailable.
 */
export const generateRingImage = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const row =
      input && typeof input === "object"
        ? (input as { ringId?: string; customPrompt?: string })
        : {};
    return {
      ringId: typeof row.ringId === "string" ? row.ringId : "pride",
      customPrompt: typeof row.customPrompt === "string" ? row.customPrompt.slice(0, 800) : "",
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Ilustração por IA indisponível neste ambiente. O anel continua descrito no atlas.",
        url: null,
      };
    }

    const visual = RING_VISUAL[data.ringId] ?? RING_VISUAL.pride;
    const prompt = data.customPrompt || visual.prompt;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40_000);
      let res: Response;
      try {
        res = await fetch("https://api.x.ai/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "grok-imagine-image",
            prompt,
            n: 1,
            response_format: "url",
          }),
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        return { ok: false as const, error: `A ilustração não saiu (${res.status}).`, url: null };
      }

      const body = (await res.json()) as { data?: { url?: string }[] };
      const url = body.data?.[0]?.url ?? null;
      if (!url) return { ok: false as const, error: "sem url", url: null };
      return { ok: true as const, url, error: null };
    } catch (e) {
      const aborted = e instanceof Error && e.name === "AbortError";
      return {
        ok: false as const,
        error: aborted ? "A ilustração demorou demais." : "Falha ao pedir a ilustração.",
        url: null,
      };
    }
  });
