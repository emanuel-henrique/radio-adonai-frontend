import {
  IShoutcastStreamProvider,
  UpstreamAudioStream,
} from '../../domain/providers/IShoutcastStreamProvider.js';
import { AppError } from '../../domain/errors/AppError.js';

const DEFAULT_UPSTREAM_URL = 'https://stm.voxhd.com.br:7290';

/**
 * O Shoutcast DNAS anuncia AAC como `audio/aacp`, tipo que nenhum navegador
 * reproduz (resulta em MEDIA_ERR_SRC_NOT_SUPPORTED). Traduzimos para o tipo
 * padrão da RFC 6381 (`audio/aac`), que é o ADTS dos mesmos bytes.
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

export function normalizeAudioContentType(
  value: string | null | undefined,
): string {
  if (!value) return 'audio/mpeg';
  const base = value.split(';')[0].trim().toLowerCase();
  return CONTENT_TYPE_MAP[base] ?? 'audio/mpeg';
}

export class ShoutcastStreamProvider implements IShoutcastStreamProvider {
  private readonly upstreamUrl: string;

  constructor(upstreamUrl?: string) {
    this.upstreamUrl =
      upstreamUrl || process.env.RADIO_UPSTREAM_URL || DEFAULT_UPSTREAM_URL;
  }

  async open(signal?: AbortSignal): Promise<UpstreamAudioStream> {
    let response: Response;

    try {
      response = await fetch(this.upstreamUrl, {
        signal,
        headers: { Accept: '*/*' },
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err;
      throw new AppError(
        'Não foi possível conectar ao servidor da rádio.',
        502,
      );
    }

    if (!response.ok || !response.body) {
      throw new AppError('O servidor da rádio recusou a conexão.', 502);
    }

    return {
      body: response.body,
      contentType: normalizeAudioContentType(
        response.headers.get('content-type'),
      ),
      stationName: response.headers.get('icy-name') ?? undefined,
    };
  }
}
