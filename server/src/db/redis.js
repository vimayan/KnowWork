/**
 * In-memory Redis replacement.
 * Exposes the same API so all service files work without modification.
 */
import { logger } from '../utils/logger.js';

const store = new Map();
const sets  = new Map(); // key → Set
const zsets = new Map(); // key → Map<member, score>

export function redis() {
  return {
    get:      async k => store.get(k) ?? null,
    set:      async (k, v) => { store.set(k, v); return 'OK'; },
    setex:    async (k, ttl, v) => { store.set(k, v); return 'OK'; },
    del:      async (...keys) => { keys.forEach(k => store.delete(k)); return keys.length; },
    incr:     async k => { const v = parseInt(store.get(k) || '0') + 1; store.set(k, String(v)); return v; },
    incrby:   async (k, n) => { const v = parseInt(store.get(k) || '0') + n; store.set(k, String(v)); return v; },
    sadd:     async (k, ...members) => { if (!sets.has(k)) sets.set(k, new Set()); members.forEach(m => sets.get(k).add(m)); return members.length; },
    srem:     async (k, ...members) => { const s = sets.get(k); if (s) members.forEach(m => s.delete(m)); return members.length; },
    sismember:async (k, m) => (sets.get(k)?.has(m) ? 1 : 0),
    zadd:     async (k, score, member) => { if (!zsets.has(k)) zsets.set(k, new Map()); zsets.get(k).set(member, score); return 1; },
    zrevrange:async (k, start, stop) => {
      const zm = zsets.get(k);
      if (!zm) return [];
      const sorted = [...zm.entries()].sort((a,b) => b[1]-a[1]);
      return sorted.slice(start, stop+1).flatMap(([m, s]) => [m, String(s)]);
    },
    connect:  async () => { logger.info('In-memory cache ready (Redis replacement)'); },
    on:       () => {},
    pipeline: () => ({ exec: async () => [] }),
  };
}

export const connectRedis = () => redis().connect();

// ─── Generic cache ────────────────────────────────────────────────────────────
export async function cacheGet(key) {
  try { const v = store.get(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
export async function cacheSet(key, val) {
  try { store.set(key, JSON.stringify(val)); } catch {}
}
export async function cacheDel(...keys) {
  keys.forEach(k => store.delete(k));
}
export async function cacheAside(key, fn) {
  const hit = await cacheGet(key);
  if (hit !== null) return hit;
  const fresh = await fn();
  await cacheSet(key, fresh);
  return fresh;
}

// ─── Session store ─────────────────────────────────────────────────────────────
const sessions = new Map();
export const sessionSet = async (tok, payload) => { sessions.set(tok, payload); };
export const sessionGet = async tok => sessions.get(tok) ?? null;
export const sessionDel = async tok => { sessions.delete(tok); };

// ─── Counters ──────────────────────────────────────────────────────────────────
export const incr     = async key => { const v = parseInt(store.get(key) || '0') + 1; store.set(key, String(v)); return v; };
export const incrBy   = async (key, n) => { const v = parseInt(store.get(key) || '0') + n; store.set(key, String(v)); return v; };
export const getCount = async key => parseInt(store.get(key) || '0');
export const resetKey = async key => { store.delete(key); };

// ─── Access control ────────────────────────────────────────────────────────────
const accessGrants = new Set();
export async function hasFieldAccess() { return true; } // open for demo
export const grantAccess = async (userId, fieldId) => { accessGrants.add(`${userId}:${fieldId}`); };

// ─── Sets ───────────────────────────────────────────────────────────────────────
export const setAdd = async (key, ...members) => { if (!sets.has(key)) sets.set(key, new Set()); members.forEach(m => sets.get(key).add(m)); };
export const setRem = async (key, ...members) => { const s = sets.get(key); if (s) members.forEach(m => s.delete(m)); };
export const setHas = async (key, member) => sets.get(key)?.has(member) ? 1 : 0;

// ─── Sorted sets ───────────────────────────────────────────────────────────────
export const zAdd   = async (key, score, member) => { if (!zsets.has(key)) zsets.set(key, new Map()); zsets.get(key).set(member, score); };
export const zRange = async (key, start, stop) => {
  const zm = zsets.get(key);
  if (!zm) return [];
  const sorted = [...zm.entries()].sort((a,b) => b[1]-a[1]);
  return sorted.slice(start, stop+1).flatMap(([m, s]) => [m, String(s)]);
};

// ─── Pipeline helper ────────────────────────────────────────────────────────────
export const pipeline = () => ({ exec: async () => [] });
