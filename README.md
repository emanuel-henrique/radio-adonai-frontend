# Radio Adonai

Aplicativo de rádio para a Igreja Adonai.

## Estrutura do Projeto

```
├── frontend/    # Next.js 14 (App Router) — deploy na Vercel
└── backend/     # Fastify — API (deploy separado)
```

## Pré-requisitos

- Node.js 20+
- npm

## Início Rápido

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
npm run build     # build de produção
npm test          # testes
```

### Backend

```bash
cd backend
npm install
npm run dev       # http://localhost:3001
npm test          # testes
```

## Deploy na Vercel (Frontend)

O frontend é compatível com a Vercel out of the box. Siga estes passos:

### 1. Enviar o repositório para o GitHub

```bash
git remote add origin https://github.com/SEU_USUARIO/radio-adonai.git
git push -u origin main
```

### 2. Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório do GitHub
3. Configure o projeto:

| Campo | Valor |
|-------|-------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Next.js (detectado automaticamente) |
| **Node.js Version** | `20` (via `.nvmrc`) |
| **Build Command** | `npm run build` (padrão do `vercel.json`) |
| **Install Command** | `npm ci` (padrão do `vercel.json`) |
| **Output Directory** | _(deixe em branco — padrão do Next.js)_ |

> O arquivo `frontend/vercel.json` já define install/build e ignora deploys quando só o backend muda.

4. Clique em **Deploy**

### Checklist antes do deploy

- [ ] Root Directory = `frontend`
- [ ] Node 20+ (`.nvmrc` na pasta `frontend`)
- [ ] `npm ci && npm run build` passando localmente na pasta `frontend`
- [ ] Variáveis em **Project → Settings → Environment Variables** (se usar API)

### 3. Variáveis de ambiente

Nenhuma variável é obrigatória no momento. Quando a API backend estiver em produção, adicione:

```
NEXT_PUBLIC_API_URL=https://sua-api.exemplo.com
```

### 4. Deploy via CLI (opcional)

```bash
npm i -g vercel
cd frontend
vercel
```

## Git — Fluxo de branches

```bash
# criar branch de feature
git checkout -b feat/minha-feature

# commit com Conventional Commits
git commit -m "feat(frontend): descrição da mudança"

# merge na main
git checkout main
git merge feat/minha-feature
```

Comandos de build/start:

```bash
npm run build
npm start
```
