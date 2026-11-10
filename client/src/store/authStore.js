import { create } from 'zustand';
import { authApi }  from '../api/index.js';
import { setToken } from '../api/client.js';

export const useAuthStore = create((set, get) => ({
  user:        null,
  initialized: false,
  loading:     false,

  /** Called once on app mount — restores session from JWT in localStorage */
  init: async () => {
    try {
      const res = await authApi.me();
      set({ user: res?.data || null, initialized: true });
    } catch {
      set(s => s.user ? { initialized: true } : { user: null, initialized: true });
      if (!get().user) setToken(null);
    }
  },

  login: async (credentials) => {
    set({ loading: true });
    try {
      const res = await authApi.login(credentials);
      const { user, token } = res.data;
      setToken(token);
      set({ user, loading: false });
      return { ok: true };
    } catch (err) {
      set({ loading: false });
      return { ok: false, error: err.message };
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const res = await authApi.register(data);
      const { user, token } = res.data;
      setToken(token);
      set({ user, loading: false });
      return { ok: true };
    } catch (err) {
      set({ loading: false });
      return { ok: false, error: err.message };
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    setToken(null);
    set({ user: null });
  },

  updateUser: (patch) => set(s => ({ user: { ...s.user, ...patch } })),
}));
