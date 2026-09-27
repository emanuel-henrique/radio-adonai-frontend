import { API_URL } from './api';

/**
 * URL direta do Shoutcast. Servida como `audio/aacp`, tipo que os navegadores
 * rejeitam — por isso ela é apenas o segundo recurso, atrás do proxy.
 */
export const RADIO_STREAM_URL =
  process.env.NEXT_PUBLIC_RADIO_STREAM_URL || 'https://stm.voxhd.com.br:7290';

/**
 * Proxy do backend que repassa os bytes e corrige o Content-Type para
 * `audio/aac`. É a fonte principal justamente por isso.
 */
export const RADIO_PROXY_URL =
  process.env.NEXT_PUBLIC_RADIO_PROXY_URL || `${API_URL}/radio/stream`;

/** Ordem de tentativa: primeiro o proxy, depois a URL direta. */
export const RADIO_AUDIO_SOURCES = [RADIO_PROXY_URL, RADIO_STREAM_URL];

export const RADIO_METADATA_URL =
  process.env.NEXT_PUBLIC_RADIO_METADATA_URL ||
  'https://voxhd.com.br/api-json/NzI5MCsx';

export class RadioMetadataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RadioMetadataError';
  }
}

interface RawRadioPayload {
  status?: unknown;
  porta?: unknown;
  porta_dj?: unknown;
  ip?: unknown;
  ouvintes_conectados?: unknown;
  titulo?: unknown;
  plano_bitrate?: unknown;
  musica_atual?: unknown;
  genero?: unknown;
  streaming?: unknown;
  shoutcast?: unknown;
  capa_musica?: unknown;
}

export interface RadioMetadata {
  isOnline: boolean;
  status: string | undefined;
  title: string | undefined;
  genre: string | undefined;
  currentTrack: string | undefined;
  artwork: string | undefined;
  listeners: number | undefined;
  bitrate: string | undefined;
  serverIp: string | undefined;
  listenerPort: string | undefined;
  djPort: string | undefined;
  streamUrl: string | undefined;
}

const ONLINE_STATUSES = new Set([
  'ligado',
  'ligada',
  'on',
  'online',
  'ativo',
  'ativa',
  '1',
  'true',
]);

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

export function isOnlineStatus(value: unknown): boolean {
  const raw = asString(value);
  return raw ? ONLINE_STATUSES.has(raw.toLowerCase()) : false;
}

export function parseListeners(value: unknown): number | undefined {
  const raw = asString(value);
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function formatTrackName(value: unknown): string | undefined {
  const raw = asString(value);
  if (!raw) return undefined;

  if (raw.includes(' - ')) {
    return raw.replace(/\s+/g, ' ').trim();
  }

  const cleaned = raw
    .replace(/\.(mp3|ogg|oga|aac|m4a|wav|flac)$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .split(' ')
    .map((word) => (word ? word[0].toLocaleUpperCase() + word.slice(1) : word))
    .join(' ');
}

export function normalizeRadioPayload(payload: unknown): RadioMetadata {
  const raw = (payload ?? {}) as RawRadioPayload;

  return {
    isOnline: isOnlineStatus(raw.status),
    status: asString(raw.status),
    title: asString(raw.titulo),
    genre: asString(raw.genero),
    currentTrack: formatTrackName(raw.musica_atual),
    artwork: asString(raw.capa_musica),
    listeners: parseListeners(raw.ouvintes_conectados),
    bitrate: asString(raw.plano_bitrate),
    serverIp: asString(raw.ip),
    listenerPort: asString(raw.porta),
    djPort: asString(raw.porta_dj),
    streamUrl: asString(raw.streaming) ?? asString(raw.shoutcast),
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export async function fetchRadioMetadata(signal?: AbortSignal): Promise<RadioMetadata> {
  let response: Response;

  try {
    response = await fetch(RADIO_METADATA_URL, { signal, cache: 'no-store' });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new RadioMetadataError('Não foi possível consultar os dados da rádio.');
  }

  if (!response.ok) {
    throw new RadioMetadataError('A API da rádio respondeu com erro.');
  }

  const payload = await response.json().catch(() => null);

  if (!payload || typeof payload !== 'object') {
    throw new RadioMetadataError('Resposta inválida da API da rádio.');
  }

  return normalizeRadioPayload(payload);
}
