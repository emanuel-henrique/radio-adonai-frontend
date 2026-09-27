import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { radioRoutes } from './radio.routes.js';
import {
  IShoutcastStreamProvider,
  UpstreamAudioStream,
} from '../../domain/providers/IShoutcastStreamProvider.js';
import { AppError } from '../../domain/errors/AppError.js';

/** Syncword real de um frame ADTS (0xFF 0xF1) seguido de um cabeçalho. */
const AUDIO_BYTES = new Uint8Array([
  0xff, 0xf1, 0x50, 0x80, 0x2d, 0x21, 0x84, 0x21,
]);

function createBody(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller): void {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

class FakeStreamProvider implements IShoutcastStreamProvider {
  public calls = 0;

  constructor(
    private readonly contentType = 'audio/aac',
    private readonly error?: Error,
  ) {}

  async open(): Promise<UpstreamAudioStream> {
    this.calls += 1;
    if (this.error) throw this.error;
    return {
      body: createBody(AUDIO_BYTES),
      contentType: this.contentType,
      stationName: 'Web Radio Adonay Gospel',
    };
  }
}

describe('GET /radio/stream', () => {
  let app: FastifyInstance;
  let provider: FakeStreamProvider;

  beforeEach(async () => {
    provider = new FakeStreamProvider();
    app = Fastify();
    app.register(radioRoutes(provider));
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('deve servir o áudio com um Content-Type aceito pelos navegadores', async () => {
    const response = await app.inject({ method: 'GET', url: '/radio/stream' });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toBe('audio/aac');
    expect(provider.calls).toBe(1);
  });

  it('deve repassar os bytes do áudio sem alterá-los', async () => {
    const response = await app.inject({ method: 'GET', url: '/radio/stream' });

    expect(
      Buffer.from(response.rawPayload).equals(Buffer.from(AUDIO_BYTES)),
    ).toBe(true);
  });

  it('deve enviar headers que evitam cache do stream', async () => {
    const response = await app.inject({ method: 'GET', url: '/radio/stream' });

    expect(response.headers['cache-control']).toContain('no-store');
    expect(response.headers['accept-ranges']).toBe('none');
  });

  it('deve responder 502 com mensagem do domínio quando o upstream falha', async () => {
    const failing = new FakeStreamProvider(
      'audio/aac',
      new AppError('Não foi possível conectar ao servidor da rádio.', 502),
    );
    const failingApp = Fastify();
    failingApp.register(radioRoutes(failing));
    await failingApp.ready();

    const response = await failingApp.inject({
      method: 'GET',
      url: '/radio/stream',
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: 'Não foi possível conectar ao servidor da rádio.',
    });

    await failingApp.close();
  });

  it('deve responder 502 quando o provider lança um erro inesperado', async () => {
    const failing = new FakeStreamProvider('audio/aac', new Error('boom'));
    const failingApp = Fastify();
    failingApp.register(radioRoutes(failing));
    await failingApp.ready();

    const response = await failingApp.inject({
      method: 'GET',
      url: '/radio/stream',
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      error: 'Erro ao abrir o stream da rádio.',
    });

    await failingApp.close();
  });
});
