import { describe, it, expect, beforeEach, vi } from 'vitest';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

async function importFreshModule() {
  vi.resetModules();
  return import('./googleIdentity');
}

describe('googleIdentity', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete (window as { google?: unknown }).google;
  });

  it('deve injetar o script do Google Identity Services uma única vez', async () => {
    const { loadGoogleIdentity } = await importFreshModule();
    const first = loadGoogleIdentity();
    const second = loadGoogleIdentity();

    const scripts = document.querySelectorAll(`script[src="${GSI_SRC}"]`);
    expect(scripts).toHaveLength(1);

    (window as { google?: unknown }).google = { accounts: { id: {} } };
    scripts[0].dispatchEvent(new Event('load'));

    await expect(first).resolves.toBe(
      (window as unknown as { google: { accounts: { id: object } } }).google.accounts.id,
    );
    await expect(second).resolves.toBeDefined();
  });

  it('deve reutilizar a instância já carregada do Google', async () => {
    const id = { initialize: vi.fn(), renderButton: vi.fn() };
    (window as { google?: unknown }).google = { accounts: { id } };

    const { loadGoogleIdentity } = await importFreshModule();

    await expect(loadGoogleIdentity()).resolves.toBe(id);
    expect(document.querySelector(`script[src="${GSI_SRC}"]`)).toBeNull();
  });

  it('deve rejeitar quando o script falha ao carregar', async () => {
    const { loadGoogleIdentity } = await importFreshModule();
    const promise = loadGoogleIdentity();

    document
      .querySelector(`script[src="${GSI_SRC}"]`)!
      .dispatchEvent(new Event('error'));

    await expect(promise).rejects.toThrow(
      'Falha ao carregar o Google Identity Services.',
    );
  });
});
