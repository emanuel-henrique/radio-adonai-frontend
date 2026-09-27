/**
 * Proxy de áudio da Rádio Adonai.
 *
 * Por que existe: o Shoutcast DNAS do VoxHD anuncia AAC com o Content-Type
 * `audio/aacp`, tipo que nenhum navegador reproduz — o `<audio>` rejeita antes
 * de decodificar e emite MEDIA_ERR_SRC_NOT_SUPPORTED. Os bytes são ADTS válido
 * (verificado: começam com `FF F1`); o defeito está apenas no rótulo.
 *
 * Por que roda aqui e não na Vercel: o repasse é um stream que permanece aberto
 * enquanto alguém ouve, ou seja, horas. Funções serverless têm duração máxima
 * (300 s no plano Hobby, 800 s no Pro) e a Vercel encerra a resposta com 504 ao
 * ultrapassar isso, cortando a música no meio. Workers acionados por HTTP não
 * têm limite de duração enquanto o cliente estiver conectado.
 */

const DEFAULT_UPSTREAM_URL = 'https://stm.voxhd.com.br:7290';

/**
 * Traduz os tipos que hosts de Shoutcast usam para os tipos padrão da
 * RFC 6381 que os navegadores aceitam. `audio/aacp` é o caso que motivou tudo.
 */
const CONTENT_TYPE_MAP: Record<string, string> = {
  'audio/aacp': 'audio/aac',
  'audio/aac': 'audio/aac',
  'audio/x-aac': 'audio/aac',
  'audio/mpeg': 'audio/mpeg',
  'audio/mp3': 'audio/mpeg',
  'application/ogg': 'audio/ogg',
  'audio/ogg': 'audio/ogg',
  'audio/opus': 'audio/ogg',
  'audio/flac': 'audio/flac',
  'audio/x-flac': 'audio/flac',
  'audio/mp4': 'audio/mp4',
  'audio/m4a': 'audio/mp4',
  'audio/x-mpegurl': 'audio/mpegurl',
};

export interface Env {
  /** Permite apontar para outro host sem alterar o código. */
  RADIO_UPSTREAM_URL?: string;
}

export function normalizeAudioContentType(
  value: string | null | undefined,
): string {
  if (!value) return 'audio/mpeg';
  const base = (value.split(';')[0] ?? '').trim().toLowerCase();
  return CONTENT_TYPE_MAP[base] ?? 'audio/mpeg';
}

function resolveUpstreamUrl(env: Env): string {
  return env.RADIO_UPSTREAM_URL || DEFAULT_UPSTREAM_URL;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    // Usado para confirmar que o Worker está no ar e qual upstream ele usa.
    if (pathname === '/health') {
      return json({ ok: true, upstream: resolveUpstreamUrl(env) });
    }

    const upstreamUrl = resolveUpstreamUrl(env);

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, { headers: { Accept: '*/*' } });
    } catch (err) {
      console.error('Falha ao conectar ao upstream', upstreamUrl, err);
      return json(
        { error: 'Não foi possível conectar ao servidor da rádio.' },
        502,
      );
    }

    if (!upstream.ok || !upstream.body) {
      console.error('Upstream recusou a conexão', upstream.status);
      return json({ error: 'O servidor da rádio recusou a conexão.' }, 502);
    }

    // Passar o body direto, sem ler antes, é o que mantém o repasse em fluxo:
    // nada é acumulado em memória e o áudio começa a tocar nos primeiros bytes.
    // Se o ouvinte fechar a página, o runtime cancela a subrequisição sozinho.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': normalizeAudioContentType(
          upstream.headers.get('content-type'),
        ),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
} satisfies ExportedHandler<Env>;
