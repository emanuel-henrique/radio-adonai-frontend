export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

interface GoogleGlobal {
  accounts: { id: GoogleAccountsId };
}

declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

let loader: Promise<GoogleAccountsId> | null = null;

export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity exige o navegador.'));
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }

  if (loader) return loader;

  loader = new Promise<GoogleAccountsId>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    );
    const script = existing ?? document.createElement('script');

    script.addEventListener('load', () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        reject(new Error('Falha ao carregar o Google Identity Services.'));
      }
    });

    script.addEventListener('error', () => {
      reject(new Error('Falha ao carregar o Google Identity Services.'));
    });

    if (!existing) {
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });

  return loader;
}
