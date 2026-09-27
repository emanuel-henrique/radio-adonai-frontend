# radio-proxy

Proxy de áudio da Rádio Adonai, feito para rodar como Cloudflare Worker.

## Por que este componente existe

O Shoutcast do VoxHD serve AAC com o cabeçalho `Content-Type: audio/aacp`. Esse
tipo não está na lista de MIME types que os navegadores aceitam em `<audio>`, e
o resultado é `MEDIA_ERR_SRC_NOT_SUPPORTED` — a rádio simplesmente não toca.

Os bytes são válidos (ADTS, começando com `FF F1`); o defeito é só o rótulo. Por
isso o Worker repassa o corpo **sem alterar um byte** e troca apenas o
`Content-Type` por `audio/aac`.

## Por que não pode ser uma função na Vercel

O repasse é um stream que fica aberto enquanto alguém ouve — horas. Funções
serverless têm duração máxima (300 s no plano Hobby da Vercel, 800 s no Pro) e a
plataforma encerra a resposta com 504 ao ultrapassar, cortando o áudio no meio da
faixa. Workers acionados por HTTP não têm limite de duração enquanto o cliente
estiver conectado, e o plano free não cobra por duração — só por CPU, que um
repasse de bytes praticamente não consome.

O resto do backend (login, pedidos, orações) pode e deve continuar na Vercel,
porque são requisições curtas.

## Deploy

```bash
npm install
npx wrangler login
npm run deploy
```

O `wrangler` publica em `https://radio-adonai-proxy.<seu-subdomain>.workers.dev`
com HTTPS automático.

Para trocar o host de origem, defina `RADIO_UPSTREAM_URL` como variable no
dashboard do Cloudflare (ou em `[vars]` no `wrangler.toml`).

## Verificação

```bash
# 1. o Worker está no ar e sabe qual upstream usa
curl https://radio-adonai-proxy.<seu-subdomain>.workers.dev/health

# 2. o áudio vem com o tipo correto
curl -sD - -o sample.bin --max-time 5 https://radio-adonai-proxy.<seu-subdomain>.workers.dev/
```

O segundo comando precisa mostrar `Content-Type: audio/aac`,
`Transfer-Encoding: chunked` e um `sample.bin` de algumas centenas de KB. Para
conferir os bytes:

```bash
xxd -l 4 sample.bin   # esperado: fff1 (syncword ADTS)
```

## Conectar no frontend

No projeto da Vercel, em Settings → Environment Variables:

```
NEXT_PUBLIC_RADIO_PROXY_URL=https://radio-adonai-proxy.<seu-subdomain>.workers.dev
```

Variáveis `NEXT_PUBLIC_*` são lidas em **tempo de build**. Depois de alterar, é
preciso fazer um novo deploy — só reiniciar o deployment não basta.

## Desenvolvimento local

```bash
npm run dev          # sobe o Worker localmente
npm test             # testes
npm run typecheck    # tsc --noEmit
```

## Fallback atual

O frontend ainda mantém `https://stm.voxhd.com.br:7290` como segunda opção.
Enquanto o host responder `audio/aacp`, essa URL **sempre falha** — o navegador
recusa. Vale a pena pedir ao VoxHD um mount em MP3 para que o fallback passe a
funcionar de verdade; nesse caso este Worker pode até ser removido.
