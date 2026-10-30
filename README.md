# Hellaverse RPG — Mestre de IA Online (v2.7.2)

> Campanha imersiva no universo **Helluva Boss + Hazbin Hotel** com Mestre de IA online 24h.
> Funciona **sem xAI**: use chave **gratuita do Groq** (ou OpenRouter).

---

## Ligar a IA Mestre (gratuito — recomendado)

1. Crie conta em **[https://console.groq.com](https://console.groq.com)** (login Google, sem cartão)
2. **API Keys** → **Create API Key** → copie a chave (`gsk_...`)
3. Na Vercel → **Settings** → **Environment Variables**:
   - Key: `GROQ_API_KEY`
   - Value: sua chave
   - Environments: Production + Preview + Development
4. **Redeploy** o projeto

Prioridade automática das chaves:
1. `XAI_API_KEY` (se tiver)
2. `GROQ_API_KEY` (gratuita — recomendada)
3. `OPENROUTER_API_KEY` (modelos `:free`)

Modelo Groq padrão: `openai/gpt-oss-120b` (o `llama-3.3-70b-versatile` saiu do plano gratuito em agosto de 2026). Sobrescreva com `GROQ_MODEL` se precisar.

Veja também `.env.example` na raiz do repositório.

Modo Criador: defina `CREATOR_ACCESS_CODE` **só no servidor** (Vercel env). O código não fica mais no JavaScript do cliente.

`npm run build` não roda migração de banco; use `npm run db:migrate` à parte.

### Campanhas na nuvem (Fase 3)
- Tabela `hella_campaigns` (migração `0002_campaigns.sql`)
- Aba Campanhas → Salvar / Carregar / Apagar na nuvem (por `user_id`)
- Requer sessão (auth) ou modo dev sem `DATABASE_URL` (PGLite + dev-user)
- Com `DATABASE_URL` em produção, ative auth (`VITE_AUTH_ENABLED`)

---

## Deploy autônomo no GitHub + Vercel

1. Crie repositório no GitHub e faça upload deste código (ou `git push`)
2. Importe na Vercel (login com GitHub)
3. Coloque `GROQ_API_KEY` nas Environment Variables
4. Deploy / Redeploy

O app **não roda 100% só no GitHub Pages** (precisa de server functions para a IA). Use **Vercel** (plano gratuito) ligado ao GitHub.

O repositório inclui `.gitignore` (secrets, `node_modules`, `.grok/`, artefatos de build).

### Checklist pós-deploy
- [ ] `GROQ_API_KEY` (ou outra) configurada
- [ ] Redeploy após adicionar a variável
- [ ] Abrir a URL e passar pelo portal de maturidade
- [ ] No Atlas → pedir relatório inicial
- [ ] Preencher ficha → validar → jogar na Mesa

### Mundo vivo (v2.5)

Aba **Mundo**: relógio interno, eventos, vínculos NPC, consequências, memória e crônica. Aba **Campanhas**: várias mesas no mesmo navegador.

### Exportar / importar campanha
Na barra lateral (desktop) use **Exportar** / **Importar** para salvar a mesa em JSON e restaurar em outro dispositivo ou após limpar o navegador.

---

# Hellaverse RPG — Mestre de IA Online (v2.1)

> **Ligar o prompt no app** e **Deploy autônomo no GitHub** estão no topo.
> Nova trava de maturidade (+14 / +18) invisível + tela de carregamento + animações suaves no menu.

> **Ligar o prompt no app** e **Deploy autônomo no GitHub** estão no topo deste documento.

Campanha imersiva de RPG ambientada em **Helluva Boss + Hazbin Hotel**, com IA Mestre (Grok) rodando online 24h.

Este repositório contém o app completo (frontend + backend serverless) que usa o **Master Prompt v2.0** (versão blindada e reforçada) para dirigir a campanha.

---

## 1. Ligar o prompt no app (já feito)

O Master Prompt v2.0 completo e blindado está **embutido** dentro do arquivo:

```
src/lib/hella/gm.ts
```

na constante `SYSTEM`.

### O que foi reforçado nesta versão:

- Hierarquia de prioridades absoluta (plataforma > agência > cânone > continuidade…)
- Agência estrita do jogador (zero narração de pensamentos/sentimentos)
- Figuras de alto poder nunca resolvem o problema do jogador
- Cartão de Estado com REGRA ANTI-LOCK (revisão campo a campo)
- Limites de plataforma (sem sexo explícito, proteção de menores)
- Formato JSON rígido com retry automático se a IA devolver texto inválido
- Validação de idade (recusa personagem com aparência < 18)
- Continuidade por Anel + reputação por facção

Você **não precisa** colar o prompt manualmente. Ele já está ligado e ativo assim que qualquer chave de IA (`GROQ_API_KEY`, `XAI_API_KEY` ou `OPENROUTER_API_KEY`) estiver configurada.

O prompt original completo também está em `docs/MASTER_PROMPT_v2.txt` para referência.

---

## 2. Deploy autônomo no GitHub + Vercel (IA Mestre online)

O app precisa de backend para a chave da API ficar segura.  
Caminho recomendado e 100% gratuito:

**GitHub (código) + Vercel (hospedagem + secrets)**

### Passo a passo rápido

1. **Crie o repositório no GitHub**
   - Acesse https://github.com/new
   - Nome: `hellaverse-rpg`
   - Public
   - **Não** marque “Add a README file”
   - Create repository

2. **Envie os arquivos**
   - Descompacte este projeto
   - No repositório → **Add file** → **Upload files**
   - Arraste **tudo** (ou use `git push`)
   - Commit changes

3. **Importe na Vercel**
   - Acesse https://vercel.com e faça login com a conta do GitHub
   - **Add New Project** → selecione `hellaverse-rpg`
   - Clique em **Deploy** (a primeira vez pode falhar sem a chave — normal)

4. **Adicione a chave da IA Mestre (obrigatório)**
   - No projeto da Vercel → **Settings** → **Environment Variables**
   - Key: `GROQ_API_KEY` (recomendado) ou `XAI_API_KEY`
   - Value: sua chave (`gsk_...` ou `xai-...`)
   - Marque **Production + Preview + Development**
   - **Save**

5. **Redeploy (obrigatório)**
   - Vá em **Deployments**
   - Clique nos **⋯** do último deploy → **Redeploy**
   - Sem o Redeploy a chave não entra em vigor

6. **Pronto**
   - URL exemplo: `https://hellaverse-rpg.vercel.app`
   - A IA Mestre está online e responde usando o Master Prompt v2.0

### Como obter a chave
1. Acesse https://console.x.ai
2. Crie uma API Key
3. Cole no Environment Variable da Vercel

---

## O que o app faz

- Interface web completa (Atlas, Ficha, Mesa, Cartão de Estado)
- IA Mestre online (via API xAI / Grok)
- Modo Preparação → Validação de ficha → Modo Jogo
- Cartão de Estado automático com anti-lock
- Continuidade, reputação por facção, pressão por Anel
- Respeita agência total do jogador e cânone do Hellaverse
- Limites de segurança já aplicados

---

## Estrutura importante

```
src/
  components/hella/     → Interface (ficha, mesa, cartão, atlas)
  lib/hella/
    gm.ts               → O Mestre (SYSTEM prompt + chamada à API)
    canon.ts            → Dados canônicos (Anéis, período, etc.)
    types.ts            → Tipos TypeScript
    store.ts            → Estado do cliente (persistido)
docs/
  MASTER_PROMPT_v2.txt  → Prompt original completo
```

---

## Comandos locais

```bash
npm install
export XAI_API_KEY=sua_chave_aqui
npm run dev          # http://0.0.0.0:8080
```

---

## Segurança e limites

- A chave `XAI_API_KEY` fica **apenas no servidor** (Vercel). Nunca no frontend.
- O prompt bloqueia sexo explícito e qualquer conteúdo com menores.
- Validação de idade aparente < 18 rejeita a ficha.
- Código público no GitHub, chave privada na Vercel.

---

## Licença / Uso

Projeto de fã. Helluva Boss e Hazbin Hotel pertencem a VivziePop / SpindleHorse.  
Este app é não-oficial e não afiliado.

---

Feito para rodar de forma **autônoma**: uma vez deployado e com a chave configurada, a IA Mestre fica online 24h.

### Código do Criador

Padrão do servidor (quando `CREATOR_ACCESS_CODE` não está definido): digite `1@+#` no portal. Em produção, defina sua própria variável de ambiente.
