/**
 * Ponto de entrada da Vercel.
 *
 * A Vercel só reconhece arquivos dentro de `api/` como funções. Este arquivo
 * existe para satisfazer esse requisito e repassa para a instância real, que
 * fica em `src/` para poder ser testada junto com o restante do backend.
 */
export { default } from '../src/vercel.js';
