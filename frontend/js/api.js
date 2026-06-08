/**
 * api.js — Fetch-wrapper voor de backend API
 */
import { store } from './store.js';

const BASE = '/api';

/**
 * Voer een fetch-request uit naar de API.
 * @param {string} path  - bijv. '/stages/mijn'
 * @param {object} opts  - standaard fetch-opties
 * @returns {Promise<any>} geparsede JSON
 * @throws  {object}      fout-body als response niet OK is
 */
export async function apiFetch(path, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(store.token ? { Authorization: `Bearer ${store.token}` } : {}),
    ...(opts.headers || {}),
  };

  const res = await fetch(BASE + path, { ...opts, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ fout: `HTTP ${res.status}` }));
    throw err;
  }

  return res.json();
}
