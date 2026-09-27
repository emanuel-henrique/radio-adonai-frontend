import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import worker, { normalizeAudioContentType } from './index';

const UPSTREAM = 'https://stm.voxhd.com.br:7290';

/**
 * Stream que emite um chunk e permanece aberto, como uma rádio no ar. Permite
 * verificar que o repasse entrega o primeiro chunk antes de o upstream fechar —
 * se houvesse buffer, a leitura ficaria pendurada.
 */
function openEndedStream(firstChunk: Uint8Array) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(firstChunk);
    },
  });
}

function upstreamResponse(headers: Record<string, string>, body: BodyInit | null) {
  return new Response(body, { status: 200, headers });
}

function callWorker(path = '/', method = 'GET') {
  return worker.fetch(
    new Request(`https://radio-proxy.test${path}`, { method }),
    {},
  );
}

describe('normalizeAudioContentType', () => {
  it('traduz o audio/aacp do Shoutcast para audio/aac', () => {
    expect(normalizeAudioContentType('audio/aacp')).toBe('audio/aac');
  });

  it('remove parâmetros e normaliza a caixa', () => {
    expect(normalizeAudioContentType('  AUDIO/AACP; charset=binary ')).toBe(
      'audio/aac',
    );
  });

  it('mantém os tipos que já são padrão', () => {
    expect(normalizeAudioContentType('audio/mpeg')).toBe('audio/mpeg');
    expect(normalizeAudioContentType('audio/mp4')).toBe('audio/mp4');
  });

  it('cai para audio/mpeg quando o tipo é ausente ou desconhecido', () => {
    expect(normalizeAudioContentType(null)).toBe('audio/mpeg');
    expect(normalizeAudioContentType('application/octet-stream')).toBe(
      'audio/mpeg',
    );
  });
});

describe('proxy do stream', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('repassa o corpo corrigindo apenas o Content-Type', async () => {
    const upstream = openEndedStream(new Uint8Array([0xff, 0xf1, 0x50, 0x80]));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        upstreamResponse({ 'content-type': 'audio/aacp' }, upstream),
      ),
    );

    const response = await callWorker();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('audio/aac');
    expect(response.headers.get('cache-control')).toBe(
      'no-store, no-cache, must-revalidate',
    );
    expect(fetch).toHaveBeenCalledWith(UPSTREAM, {
      headers: { Accept: '*/*' },
    });

    const reader = response.body!.getReader();
    const first = await reader.read();

    // Chegou sem esperar o upstream terminar: o corpo flui em tempo real.
    expect(Array.from(first.value!)).toEqual([0xff, 0xf1, 0x50, 0x80]);

    await reader.cancel();
  });

  it('respeita o upstream definido no ambiente', async () => {
    const upstream = openEndedStream(new Uint8Array([1]));
    const custom = 'https://outro.exemplo.com:8000/stream';

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        upstreamResponse({ 'content-type': 'audio/aacp' }, upstream),
      ),
    );

    const response = await worker.fetch(
      new Request('https://radio-proxy.test/'),
      { RADIO_UPSTREAM_URL: custom },
    );

    expect(fetch).toHaveBeenCalledWith(custom, { headers: { Accept: '*/*' } });
    expect(response.status).toBe(200);

    await response.body!.cancel();
  });

  it('devolve 502 quando o upstream recusa a conexão', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('nope', { status: 403, headers: { 'content-type': 'text/plain' } }),
      ),
    );

    const response = await callWorker();

    expect(response.status).toBe(502);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({
      error: 'O servidor da rádio recusou a conexão.',
    });
  });

  it('devolve 502 quando o upstream não responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const response = await callWorker();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'Não foi possível conectar ao servidor da rádio.',
    });
  });
});

describe('rotas auxiliares', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('responde ao health check com o upstream em uso', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const response = await callWorker('/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      upstream: UPSTREAM,
    });
  });

  it('não consulta o upstream no health check', async () => {
    vi.stubGlobal('fetch', vi.fn());

    await callWorker('/health');

    expect(fetch).not.toHaveBeenCalled();
  });

  it('responde 204 ao preflight sem consultar o upstream', async () => {
    vi.stubGlobal('fetch', vi.fn());

    const response = await callWorker('/', 'OPTIONS');

    expect(response.status).toBe(204);
    expect(fetch).not.toHaveBeenCalled();
  });
});
