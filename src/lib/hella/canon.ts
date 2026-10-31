import type {
  CharacterSheet,
  FactionId,
  FactionStance,
  RingId,
  RingPressure,
  StateCard,
} from "@/lib/hella/types";

export type RingDossier = {
  id: RingId;
  name: string;
  sin: string;
  ruler: string;
  depth: string;
  confirmed: string;
  uncertain: string;
  denizens: string;
  travel: string;
};

export const PERIOD =
  "Porta da 3ª temporada de Helluva Boss: depois do julgamento que destituiu Stolas, com a I.M.P. no ar e o cristal asmodeano como porta para a Terra. O bloco 1 da 3ª temporada (outubro de 2026) não entra nesta mesa salvo pedido OOC.";

export const RINGS: RingDossier[] = [
  {
    id: "pride",
    name: "Orgulho",
    sin: "Pride",
    ruler: "Lúcifer Morningstar",
    depth: "Topo",
    confirmed:
      "Céu vermelho, chão de rocha escura, Imp City e Pentagram City. Sinners nascem aqui e a barreira os prende neste anel. Overlords mandam em distritos. O Hazbin Hotel existe como projeto público da princesa Charlie. A I.M.P. opera a partir daqui. Palácios Goetia — o antigo de Stolas agora sob Stella e Andrealphus.",
    uncertain:
      "Onde fica cada palácio Goetia, o paradeiro de Lilith e o quanto a política de Hazbin Hotel temporada 2 vale nesta continuidade. Detalhe incerto.",
    denizens:
      "Imps urbanos, Goetia, Sinners, Overlords. Hellhounds e succubi de passagem. Lúcifer recluso na própria oficina.",
    travel:
      "Hellborn sobe e desce os anéis. Sinner não sai. Terra só com grimório ou cristal asmodeano — a I.M.P. usa o cristal, não mais o livro de Stolas.",
  },
  {
    id: "wrath",
    name: "Ira",
    sin: "Wrath",
    ruler: "Satan",
    depth: "2º",
    confirmed:
      "Deserto ocre, céu em brasa, fazendas e ranchos que alimentam o Inferno. Imps rurais, festivais de força, ferrovias e penhascos. Satan é a lei em pessoa: julgou o caso do grimório e não tolera desordem.",
    uncertain:
      "A afirmação de Satan de que os Pecados já estavam aqui antes de Lúcifer. Tratar como fala dele, não como fato. Detalhe incerto.",
    denizens: "Imps de sangue agrícola. A família de Millie é daqui. Forasteiro de cidade é olhado como intruso.",
    travel: "Hellborn entra livre. Sinner não chega. Colheita e estações ainda ecoam os deveres que eram de Stolas — agora em mãos de Andrealphus.",
  },
  {
    id: "gluttony",
    name: "Gula",
    sin: "Gluttony",
    ruler: "Beelzebub",
    depth: "3º",
    confirmed:
      "Oásis quente, ouro e festa. Hellhounds são o povo da casa. Beelzejuice, mel, algodão-doce e uma câmara de fogo tipo lava-lamp. Bee cobra consentimento real na própria festa e ainda assim o anel é excesso.",
    uncertain: "Nada fino além do que a festa mostra. Economia fora do export de hellhounds e bebida: detalhe incerto.",
    denizens: "Hellhounds. Seguranças e músculo alugados para outros anéis saem daqui.",
    travel: "Hellborn passa. Sinner não. Droga de festa às vezes vem do estoque de Belphegor — Bee já foi pega nisso.",
  },
  {
    id: "greed",
    name: "Ganância",
    sin: "Greed",
    ruler: "Mammon",
    depth: "4º",
    confirmed:
      "Fábricas, sucata, canais de água parada verde, céu esverdeado. Máfia de imps, tubarões como músculo de aluguel, marca Mammon em tudo. Loo Loo Land é o parque temático seboso com Robo Fizz.",
    uncertain: "Se ainda existe algum negócio 'legítimo' fora do parque e da marca. Detalhe incerto.",
    denizens: "Imps de chão de fábrica e crime, demonios-tubarão contratados. Lealdade acaba quando o pagamento acaba.",
    travel: "Hellborn desce para negócio sujo. Sinner não. Outros anéis visitam o parque.",
  },
  {
    id: "lust",
    name: "Luxúria",
    sin: "Lust",
    ruler: "Asmodeus",
    depth: "5º",
    confirmed:
      "Metrópole néon sob céu índigo e chuva. Ozzie's é o palco. Succubi e incubi usam cristais asmodeanos para ir à Terra. Asmodeus trata paixão genuína como a única coisa que presta — o caso com Fizzarolli é estável e politicamente incômodo. Tecnologia de prótese e animatrônico também é daqui.",
    uncertain: "O tamanho real da indústria fora do clube. Pouca dúvida de tom: o anel vende desejo e também ferro.",
    denizens: "Succubi, incubi, Fizzarolli, Verosika Mayday quando a turnê passa.",
    travel: "Cristal asmodeano é a via legal de hellborn até a Terra. Sinner continua preso no Orgulho.",
  },
  {
    id: "envy",
    name: "Inveja",
    sin: "Envy",
    ruler: "Leviatã",
    depth: "6º",
    confirmed:
      "Povo com cara de peixe aparece fora do anel (as gêmeas Glitz e Glam, entre outros). Há um governante Sin e menção à família. O anel existe e funciona.",
    uncertain:
      "Geografia submarina, economia e o nome completo Von Eldritch vêm de material lateral e de trailer — não tratar planta baixa como fato de tela. Detalhe incerto.",
    denizens: "Demonios aquáticos. Nobreza do anel pouco vista na série principal até aqui.",
    travel: "Hellborn pode descer. O que se exporta, e se corrompe humano como a Luxúria, é detalhe incerto.",
  },
  {
    id: "sloth",
    name: "Preguiça",
    sin: "Sloth",
    ruler: "Belphegor",
    depth: "Fundo",
    confirmed:
      "Capital médica e farmacêutica. Remédios com o nome de Belphegor, efeitos colaterais anunciados sem vergonha. Clima lento, nuvens, cor lavada. Povo com vela na cabeça, espécie sem nome oficial.",
    uncertain:
      "Quase tudo fora de hospital e droga. Layout do anel: detalhe incerto. Não inventar cidade.",
    denizens: "Funcionários de hospital, viciados em receita, a própria Belphegor quando aparece.",
    travel: "Hellborn busca tratamento ou entorpecente. Sinner não desce.",
  },
];

export const HIERARCHY: { rank: string; note: string }[] = [
  { rank: "Lúcifer Morningstar", note: "Rei. Quase nunca resolve a vida de ninguém." },
  { rank: "Família Morningstar", note: "Lilith ausente. Charlie é princesa idealista, sem poder de apagar o classismo." },
  { rank: "Sete Pecados", note: "Cada um é o clima do próprio anel. Agenda própria." },
  { rank: "Ars Goetia", note: "Nobreza mágica, quase toda aviária. Status compra impunidade — até não comprar." },
  { rank: "Overlords", note: "Sinners que compraram território no Orgulho. Não saem do anel." },
  { rank: "Sinners", note: "Almas humanas. Imortais no sentido chato: regeneram, não vão embora." },
  { rank: "Hellborn de meio", note: "Succubi, incubi e afins. Trabalho, contrato, desprezo para baixo." },
  { rank: "Imps e hellhounds", note: "Chão. A lei lembra deles na hora de cobrar, some na hora de proteger." },
];

export const FACTION_LABEL: Record<FactionId, string> = {
  imp: "I.M.P.",
  goetia: "Goetia",
  pecados: "Pecados",
  overlords: "Overlords",
  sinners: "Sinners",
  hellborn: "Hellborn",
  humanos: "Humanos",
};

export const INITIAL_PRESSURES: RingPressure[] = [
  {
    id: "pride",
    pressure:
      "Imp City fofoca o pássaro nobre quebrado na recepção da I.M.P. Overlords seguem cobrando aluguel de alma. A barreira dos Sinners não afrouxou.",
    heat: 62,
  },
  {
    id: "wrath",
    pressure:
      "Colheita inquieta: os deveres sazonais de Stolas trocaram de mão. Satan não quer ouvir desculpa de imp.",
    heat: 54,
  },
  {
    id: "gluttony",
    pressure: "A festa não parou. Hellhound que volta do Orgulho chega com história de cidade e conta no copo.",
    heat: 40,
  },
  {
    id: "greed",
    pressure:
      "Mammon segue espremendo marca e parque. Loo Loo Land ainda é destino de quem tem pouco e vergonha nenhuma.",
    heat: 48,
  },
  {
    id: "lust",
    pressure:
      "Asmodeus protege o que é dele. Cristal asmodeano continua sendo a licença que separa assassinato na Terra de suicídio político.",
    heat: 44,
  },
  {
    id: "envy",
    pressure: "O anel murmura mais do que mostra. Quem sobe de lá traz olho grande e pouca explicação.",
    heat: 28,
  },
  {
    id: "sloth",
    pressure: "Fila de hospital e receita fácil. O fundo do Inferno está acordado o bastante para cobrar.",
    heat: 33,
  },
];

export const INITIAL_FACTIONS: FactionStance[] = [
  { id: "imp", stance: "Operacional. Escritório pequeno, reputação de bagunça, porta da Terra aberta pelo cristal.", heat: 35, goal: "Manter o cristal e os contratos na Terra", goalProgress: 20 },
  { id: "goetia", stance: "Stolas caiu. Andrealphus e Stella ocupam o vazio. O resto da nobreza observa e não ajuda.", heat: 55, goal: "Reordenar a nobreza após a queda de Stolas", goalProgress: 35 },
  { id: "pecados", stance: "Ativos. Nenhum deles deve favor a um desconhecido.", heat: 40, goal: "Manter o equilíbrio de poder entre os Anéis", goalProgress: 50 },
  { id: "overlords", stance: "Mandam no Orgulho urbano. Indiferentes a hellborn sem território.", heat: 50, goal: "Expandir território e almas no Orgulho", goalProgress: 45 },
  { id: "sinners", stance: "Presos no Orgulho. Perigosos no varejo, irrelevantes na política dos anéis.", heat: 30, goal: "Subir na hierarquia urbana do Orgulho", goalProgress: 15 },
  { id: "hellborn", stance: "Classe manda mais que talento. Imp e hellhound começam no negativo.", heat: 25, goal: "Sobreviver e ser respeitado fora da própria casta", goalProgress: 10 },
  { id: "humanos", stance: "A Terra não sabe que a I.M.P. existe — até a alma errada contratar.", heat: 15, goal: "Ignorar o Inferno até não poder mais", goalProgress: 5 },
];

export const INITIAL_WORLD = {
  clock: { day: 1, period: "day", ticks: 0 },
  events: [],
  bonds: [],
  consequences: [],
  chronicle: [],
  memory: { summary: "", threads: [], lastTick: 0 },
};

export const INITIAL_CARD: StateCard = {
  arc: "Preparação",
  timePlace: "Orgulho, Imp City — porta da 3ª temporada",
  player: "sem ficha validada",
  npcsPresent: "nenhum em cena",
  npcsAbsent:
    "I.M.P. em serviço; Stolas destituído e por perto do escritório; Pecados nos próprios anéis",
  worldPulse: PERIOD,
  reputation: {
    imp: "desconhecida",
    goetia: "desconhecida",
    pecados: "desconhecida",
    overlords: "desconhecida",
    sinners: "desconhecida",
    hellborn: "desconhecida",
    humanos: "desconhecida",
  },
  divergences:
    "Hazbin Hotel temporada 2 não está sincronizada oficialmente com Helluva Boss — detalhe incerto, não usar como fato. Geografia fina de Inveja e Preguiça: detalhe incerto. Bloco 1 da 3ª temporada fica fora até OOC pedir.",
  questions: [
    "Ficha do jogador",
    "Anel ou cidade de partida",
    "O que o personagem já deve a alguém",
  ],
};

export function emptySheet(): CharacterSheet {
  return {
    name: "",
    identity: "",
    age: "",
    species: "",
    power: "",
    look: "",
    abilities: [
      { name: "", limit: "", cost: "" },
      { name: "", limit: "", cost: "" },
      { name: "", limit: "", cost: "" },
    ],
    weaknesses: ["", ""],
    gear: "",
    goal: "",
    knowledge: "",
    relations: "",
    trait: "",
  };
}

export const CONTRACT = [
  "Você joga só o seu personagem. O mestre não narra pensamento, sentimento, fala, memória ou decisão sua.",
  "Cânone verificável vence invenção. O que não está confirmado entra como detalhe incerto, não como fato.",
  "Pecado, Goetia, Lúcifer e Overlord não resolvem o seu problema. Eles têm agenda e classe.",
  "Imp contra Goetia começa perdendo. A hierarquia não é cenário, é física social.",
  "Sem dados. Preparação, terreno, equipamento, limite da ficha e poder relativo decidem o golpe.",
  "Morte só em risco declarado antes da ação, ou se você escolher. Falha cobra preço, não apaga a mesa.",
  "OOC começa com o interruptor ou com o prefixo OOC:. Correção de cânone não reinicia a campanha.",
  "Tom da série: vulgar, classista, violento no registro de desenho adulto, emocionalmente cru.",
  "Sexo explícito, humilhação sexual e qualquer cena sexual com menor — Octavia inclusa — não são gerados.",
];
