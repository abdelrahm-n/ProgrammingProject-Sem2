/**
 * store.js — Globale applicatiestatus
 * Simpele key/value store met localStorage-persistentie.
 */
export const store = {
  get rol()   { return localStorage.getItem('rol'); },
  get token() { return localStorage.getItem('token'); },

  setRol(rol) {
    localStorage.setItem('rol', rol);
  },

  setToken(token) {
    localStorage.setItem('token', token);
  },

  clear() {
    localStorage.removeItem('rol');
    localStorage.removeItem('token');
  },
};
