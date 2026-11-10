/**
 * In-memory MongoDB replacement.
 * Exposes the same Journey, Draft, LongStory models with a minimal API.
 */
const uuid = () => crypto.randomUUID();
import { logger } from '../utils/logger.js';

export async function connectMongo() {
  logger.info('In-memory document store ready (MongoDB replacement)');
}

function makeCollection(name) {
  const store = [];

  return {
    async create(data) {
      const doc = { _id: uuid(), createdAt: new Date(), updatedAt: new Date(), ...data };
      store.push(doc);
      return doc;
    },
    async findById(id) {
      return store.find(d => d._id === id) ?? null;
    },
    async findOne(filter) {
      return store.find(d => matchFilter(d, filter)) ?? null;
    },
    async find(filter = {}) {
      const matched = store.filter(d => matchFilter(d, filter));
      return {
        sort: (s) => ({ limit: (n) => ({ exec: async () => matched.slice(0,n) }),
                        exec: async () => matched }),
        exec: async () => matched,
        limit: (n) => ({ exec: async () => matched.slice(0, n) }),
        [Symbol.asyncIterator]: async function*() { for (const d of matched) yield d; },
      };
    },
    async countDocuments(filter = {}) {
      return store.filter(d => matchFilter(d, filter)).length;
    },
    async findByIdAndUpdate(id, update) {
      const idx = store.findIndex(d => d._id === id);
      if (idx < 0) return null;
      Object.assign(store[idx], update.$set || update);
      store[idx].updatedAt = new Date();
      return store[idx];
    },
    async findOneAndUpdate(filter, update, opts = {}) {
      let idx = store.findIndex(d => matchFilter(d, filter));
      if (idx < 0 && opts.upsert) {
        const doc = { _id: uuid(), createdAt: new Date(), updatedAt: new Date(), ...filter };
        Object.assign(doc, update.$set || update);
        store.push(doc);
        return doc;
      }
      if (idx < 0) return null;
      Object.assign(store[idx], update.$set || update);
      store[idx].updatedAt = new Date();
      return store[idx];
    },
    async deleteOne(filter) {
      const idx = store.findIndex(d => matchFilter(d, filter));
      if (idx >= 0) store.splice(idx, 1);
      return { deletedCount: idx >= 0 ? 1 : 0 };
    },
    // Allow .save() on returned docs
    _store: store,
    name,
  };
}

function matchFilter(doc, filter) {
  if (!filter || !Object.keys(filter).length) return true;
  return Object.entries(filter).every(([k, v]) => {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      // Handle $in, $gte etc.
      if (v.$in) return v.$in.includes(doc[k]);
      return true;
    }
    return doc[k] == v;
  });
}

export const Journey   = makeCollection('Journey');
export const Draft     = makeCollection('Draft');
export const LongStory = makeCollection('LongStory');
