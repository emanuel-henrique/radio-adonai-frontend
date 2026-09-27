import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  RADIO_AUDIO_SOURCES,
  RADIO_METADATA_URL,
  RADIO_PROXY_URL,
  RADIO_STREAM_URL,
  RadioMetadataError,
  fetchRadioMetadata,
  formatTrackName,
  isOnlineStatus,
  normalizeRadioPayload,
  parseListeners,
} from './radio';

const voxhdPayload = {
  status: 'Ligado',
  porta: '7290',
  porta_dj: '35290',
  ip: 'stm.voxhd.com.br',
  ouvintes_conectados: '4',
  titulo: 'Web Radio Adonay Gospel',
  plano_ouvintes: '999999',
  plano_ftp: '10 GB',
  plano_bitrate: '128Kbps',
  musica_atual: 'paradao_gospel_fds_bloco01',
  proxima_musica: 'modelo_3_7290_feminino',
  genero: {},
  streaming: 'https://stm.voxhd.com.br:7290',
  capa_musica: 'https://player.voxhd.com.br/img/img-capa-artista-padrao.png',
};

describe('configuração da rádio', () => {
  it('deve usar o stream e a API reais da Rádio Adonai por padrão', () => {
    expect(RADIO_STREAM_URL).toBe('https://stm.voxhd.com.br:7290');
    expect(RADIO_METADATA_URL).toBe('https://voxhd.com.br/api-json/NzI5MCsx');
  });

  it('deve usar URLs em HTTPS para evitar mixed content', () => {
    expect(RADIO_STREAM_URL.startsWith('https://')).toBe(true);
    expect(RADIO_METADATA_URL.startsWith('https://')).toBe(true);
  });

  it('deve tentar o proxy do backend antes da URL direta do Shoutcast', () => {
    expect(RADIO_AUDIO_SOURCES[0]).toBe(RADIO_PROXY_URL);
    expect(RADIO_AUDIO_SOURCES[1]).toBe(RADIO_STREAM_URL);
    expect(RADIO_PROXY_URL.endsWith('/radio/stream')).toBe(true);
  });
});

describe('isOnlineStatus', () => {
  it.each(['Ligado', 'ligado', 'ON', 'online', '1', 'true'])(
    'deve considerar "%s" como transmissão no ar',
    (status) => {
      expect(isOnlineStatus(status)).toBe(true);
    },
  );

  it.each(['Desligado', 'off', '0', '', undefined, null])(
    'deve considerar "%s" como transmissão fora do ar',
    (status) => {
      expect(isOnlineStatus(status)).toBe(false);
    },
  );
});

describe('parseListeners', () => {
  it('deve converter a contagem textual em número', () => {
    expect(parseListeners('4')).toBe(4);
  });

  it('deve aceitar zero como ouvintes válidos', () => {
    expect(parseListeners('0')).toBe(0);
  });

  it('deve retornar undefined para valores ausentes ou inválidos', () => {
    expect(parseListeners(undefined)).toBeUndefined();
    expect(parseListeners('')).toBeUndefined();
    expect(parseListeners('muitos')).toBeUndefined();
    expect(parseListeners({})).toBeUndefined();
  });
});

describe('formatTrackName', () => {
  it('deve deixar o nome intacto quando já vier como "Artista - Título"', () => {
    expect(formatTrackName('Ao Único  -  Aline Barros')).toBe('Ao Único - Aline Barros');
  });

  it('deve transformar o slug do Auto-DJ em um nome legível', () => {
    expect(formatTrackName('paradao_gospel_fds_bloco01')).toBe('Paradao Gospel Fds Bloco01');
  });

  it('deve remover a extensão do arquivo', () => {
    expect(formatTrackName('adelino_freitas_o_fiel.mp3')).toBe('Adelino Freitas O Fiel');
  });

  it('deve retornar undefined quando não há música tocando', () => {
    expect(formatTrackName(undefined)).toBeUndefined();
    expect(formatTrackName('   ')).toBeUndefined();
    expect(formatTrackName({})).toBeUndefined();
  });
});

describe('normalizeRadioPayload', () => {
  it('deve normalizar a resposta real da API', () => {
    expect(normalizeRadioPayload(voxhdPayload)).toEqual({
      isOnline: true,
      status: 'Ligado',
      title: 'Web Radio Adonay Gospel',
      genre: undefined,
      currentTrack: 'Paradao Gospel Fds Bloco01',
      artwork: 'https://player.voxhd.com.br/img/img-capa-artista-padrao.png',
      listeners: 4,
      bitrate: '128Kbps',
      serverIp: 'stm.voxhd.com.br',
      listenerPort: '7290',
      djPort: '35290',
      streamUrl: 'https://stm.voxhd.com.br:7290',
    });
  });

  it('deve tratar o gênero que a API envia como objeto vazio', () => {
    expect(normalizeRadioPayload({ genero: {} }).genre).toBeUndefined();
  });

  it('deve usar o campo shoutcast quando o streaming estiver ausente', () => {
    const result = normalizeRadioPayload({ shoutcast: 'https://stm.voxhd.com.br:7290' });
    expect(result.streamUrl).toBe('https://stm.voxhd.com.br:7290');
  });

  it('deve sinalizar a rádio como fora do ar quando o status indicar', () => {
    expect(normalizeRadioPayload({ status: 'Desligado' }).isOnline).toBe(false);
  });

  it('deve retornar campos vazios sem quebrar quando a resposta vier incompleta', () => {
    const result = normalizeRadioPayload({});
    expect(result.isOnline).toBe(false);
    expect(result.listeners).toBeUndefined();
    expect(result.currentTrack).toBeUndefined();
  });
});

describe('fetchRadioMetadata', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('deve buscar os dados e devolvê-los já normalizados', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => voxhdPayload,
    } as Response);

    const metadata = await fetchRadioMetadata();

    expect(metadata.listeners).toBe(4);
    expect(metadata.currentTrack).toBe('Paradao Gospel Fds Bloco01');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(RADIO_METADATA_URL);
    expect(options.cache).toBe('no-store');
  });

  it('deve lançar RadioMetadataError quando a API estiver inacessível', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchRadioMetadata()).rejects.toBeInstanceOf(RadioMetadataError);
  });

  it('deve lançar RadioMetadataError quando a API responder com erro', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);

    await expect(fetchRadioMetadata()).rejects.toBeInstanceOf(RadioMetadataError);
  });

  it('deve lançar RadioMetadataError quando a resposta não for JSON válido', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response);

    await expect(fetchRadioMetadata()).rejects.toBeInstanceOf(RadioMetadataError);
  });

  it('deve propagar o AbortError sem tratá-lo como falha da rádio', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(fetchRadioMetadata()).rejects.toThrow(/Aborted/);
  });
});
