export interface UpstreamAudioStream {
  body: ReadableStream<Uint8Array>;
  /**
   * Content-Type já normalizado para um tipo aceito pelos navegadores.
   * O Shoutcast serve AAC como `audio/aacp`, que nenhum browser reproduz.
   */
  contentType: string;
  stationName: string | undefined;
}

/**
 * Contrato para abrir o stream de áudio do Shoutcast.
 * DIP: a rota depende desta interface, permitindo fake nos testes.
 */
export interface IShoutcastStreamProvider {
  open(signal?: AbortSignal): Promise<UpstreamAudioStream>;
}
