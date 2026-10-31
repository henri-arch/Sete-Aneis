import type { ReactNode } from "react";
import { useCampaign } from "@/lib/hella/store";
import type { Ability, CharacterSheet } from "@/lib/hella/types";

type Props = {
  onValidate: () => void;
};

type TextKey = {
  [K in keyof CharacterSheet]: CharacterSheet[K] extends string ? K : never;
}[keyof CharacterSheet];

const FIELDS: { key: TextKey; label: string; hint: string; long?: boolean }[] = [
  { key: "name", label: "Nome / alcunha", hint: "Como o Inferno vai gritar." },
  { key: "identity", label: "Identidade / origem", hint: "Hellborn, Sinner, híbrido, humano envolvido." },
  { key: "age", label: "Idade aparente", hint: "Adulto. Abaixo de 18 a mesa recusa." },
  { key: "species", label: "Espécie / subtipo", hint: "Imp, hellhound, succubus, sinner…" },
  { key: "power", label: "Nível de poder", hint: "Justifique. Não ultrapassa um Pecado.", long: true },
  { key: "look", label: "Estilo visual", hint: "O que um estranho vê. Sem interior.", long: true },
  { key: "gear", label: "Equipamento / recursos", hint: "O que está no corpo agora.", long: true },
  { key: "goal", label: "Objetivo pessoal", hint: "Uma frase que dói.", long: true },
  { key: "knowledge", label: "O que sabe do Inferno e da Terra", hint: "Só o que a vida ensinou.", long: true },
  { key: "relations", label: "Relações prévias", hint: "Quem já deve, quem já odeia. Pode ficar vazio.", long: true },
  { key: "trait", label: "Traço definidor", hint: "Um hábito que não sai.", long: true },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-display text-lg tracking-wide text-fg uppercase">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
      {children}
    </label>
  );
}

const inputClass =
  "min-h-11 rounded-card border border-border bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-primary";

export function SheetForm({ onValidate }: Props) {
  const sheet = useCampaign((s) => s.sheet);
  const setSheet = useCampaign((s) => s.setSheet);
  const pending = useCampaign((s) => s.pending);
  const sheetStatus = useCampaign((s) => s.sheetStatus);

  function patch(partial: Partial<CharacterSheet>) {
    setSheet({ ...sheet, ...partial });
  }

  function patchAbility(index: number, partial: Partial<Ability>) {
    const abilities = sheet.abilities.map((item, i) => (i === index ? { ...item, ...partial } : item));
    patch({ abilities });
  }

  const filledAbilities = sheet.abilities.filter((item) => item.name && item.limit && item.cost).length;
  const filledWeak = sheet.weaknesses.filter((item) => item.trim()).length;
  const ready =
    sheet.name.trim() &&
    sheet.identity.trim() &&
    sheet.age.trim() &&
    sheet.species.trim() &&
    sheet.power.trim() &&
    sheet.look.trim() &&
    sheet.trait.trim() &&
    filledAbilities >= 3 &&
    filledWeak >= 2;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (ready) onValidate();
      }}
    >
      <header>
        <p className="font-display text-sm tracking-[0.28em] text-accent uppercase">Ficha</p>
        <h1 className="font-display text-5xl leading-none font-extrabold text-fg">Quem desce.</h1>
        <p className="mt-2 max-w-xl text-sm text-pretty text-muted">
          Campo vazio que não é obrigatório fica desconhecido — o mestre não inventa sua vida. Status:{" "}
          <span className="text-fg">{sheetStatus}</span>.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <Field key={field.key} label={field.label} hint={field.hint}>
            {field.long ? (
              <textarea
                value={sheet[field.key]}
                onChange={(event) => patch({ [field.key]: event.target.value })}
                rows={3}
                className={inputClass}
              />
            ) : (
              <input
                value={sheet[field.key]}
                onChange={(event) => patch({ [field.key]: event.target.value })}
                className={inputClass}
              />
            )}
          </Field>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl tracking-wide text-fg uppercase">Habilidades</h2>
          <span className="text-xs text-muted">3 a 6, cada uma com limite e custo</span>
        </div>
        {sheet.abilities.map((ability, index) => (
          <div key={index} className="grid gap-2 rounded-card border border-border bg-surface p-3 sm:grid-cols-3">
            <input
              aria-label={`Habilidade ${index + 1}`}
              placeholder="Nome"
              value={ability.name}
              onChange={(event) => patchAbility(index, { name: event.target.value })}
              className={inputClass}
            />
            <input
              aria-label={`Limite ${index + 1}`}
              placeholder="Limite"
              value={ability.limit}
              onChange={(event) => patchAbility(index, { limit: event.target.value })}
              className={inputClass}
            />
            <input
              aria-label={`Custo ${index + 1}`}
              placeholder="Custo"
              value={ability.cost}
              onChange={(event) => patchAbility(index, { cost: event.target.value })}
              className={inputClass}
            />
          </div>
        ))}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={sheet.abilities.length >= 6}
            onClick={() => patch({ abilities: [...sheet.abilities, { name: "", limit: "", cost: "" }] })}
            className="h-11 rounded-card border border-border px-4 text-sm text-fg disabled:opacity-40"
          >
            Mais uma
          </button>
          <button
            type="button"
            disabled={sheet.abilities.length <= 3}
            onClick={() => patch({ abilities: sheet.abilities.slice(0, -1) })}
            className="h-11 rounded-card border border-border px-4 text-sm text-muted disabled:opacity-40"
          >
            Tirar a última
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl tracking-wide text-fg uppercase">Limitações</h2>
        {sheet.weaknesses.map((weakness, index) => (
          <input
            key={index}
            aria-label={`Fraqueza ${index + 1}`}
            value={weakness}
            onChange={(event) => {
              const weaknesses = sheet.weaknesses.map((item, i) => (i === index ? event.target.value : item));
              patch({ weaknesses });
            }}
            className={inputClass}
          />
        ))}
        <button
          type="button"
          disabled={sheet.weaknesses.length >= 5}
          onClick={() => patch({ weaknesses: [...sheet.weaknesses, ""] })}
          className="h-11 self-start rounded-card border border-border px-4 text-sm text-fg disabled:opacity-40"
        >
          Outra fraqueza
        </button>
      </section>

      <button
        type="submit"
        disabled={!ready || pending}
        className="h-12 rounded-card bg-primary font-display text-lg tracking-wide text-primary-fg uppercase disabled:opacity-40"
      >
        {pending ? "O mestre lê a ficha…" : "Validar com a IA"}
      </button>
      {!ready ? (
        <p className="text-sm text-muted">
          Faltam nome, origem, idade, espécie, poder justificado, visual, traço, 3 habilidades completas e 2 fraquezas.
        </p>
      ) : null}
    </form>
  );
}
