import { describe, it, expect } from 'vitest';
import { normalizeAudioContentType } from './ShoutcastStreamProvider.js';

describe('normalizeAudioContentType', () => {
  it('deve converter o audio/aacp do Shoutcast para audio/aac', () => {
    expect(normalizeAudioContentType('audio/aacp')).toBe('audio/aac');
  });

  it('deve converter tipos com maiúsculas ou espaços', () => {
    expect(normalizeAudioContentType('  AUDIO/AACP ')).toBe('audio/aac');
  });

  it('deve ignorar parâmetros do Content-Type', () => {
    expect(normalizeAudioContentType('audio/aacp; charset=utf-8')).toBe(
      'audio/aac',
    );
  });

  it.each([
    ['audio/aac', 'audio/aac'],
    ['audio/mpeg', 'audio/mpeg'],
    ['audio/mp3', 'audio/mpeg'],
    ['application/ogg', 'audio/ogg'],
    ['audio/opus', 'audio/ogg'],
    ['audio/flac', 'audio/flac'],
    ['audio/mp4', 'audio/mp4'],
  ])('deve manter/traduzir %s para %s', (entrada, esperado) => {
    expect(normalizeAudioContentType(entrada)).toBe(esperado);
  });

  it('deve cair para audio/mpeg quando o tipo é desconhecido ou ausente', () => {
    expect(normalizeAudioContentType('application/octet-stream')).toBe(
      'audio/mpeg',
    );
    expect(normalizeAudioContentType(null)).toBe('audio/mpeg');
    expect(normalizeAudioContentType(undefined)).toBe('audio/mpeg');
    expect(normalizeAudioContentType('')).toBe('audio/mpeg');
  });

  it('nunca deve devolver audio/aacp, que os navegadores rejeitam', () => {
    const entradas = ['audio/aacp', 'audio/aacp;charset=utf-8', 'AUDIO/AACP'];

    entradas.forEach((entrada) => {
      expect(normalizeAudioContentType(entrada)).not.toBe('audio/aacp');
    });
  });
});
