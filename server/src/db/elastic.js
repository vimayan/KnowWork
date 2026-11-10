/**
 * In-memory Elasticsearch replacement.
 * Exposes the same API so service files work without modification.
 */
import { logger } from '../utils/logger.js';
import { tables } from './memory-store.js';

export function esClient() { return {}; }

export async function connectElastic() {
  logger.info('In-memory search ready (Elasticsearch replacement)');
}

export async function indexDoc() {}
export async function removeDoc() {}

export async function esSearch(index, body) {
  const text = body?.query?.multi_match?.query
    || body?.query?.bool?.must?.multi_match?.query
    || '';

  const q = text.toLowerCase();

  const hits = tables.job_cards
    .filter(jc => jc.published && (!q || jc.title.toLowerCase().includes(q) || (jc.summary || '').toLowerCase().includes(q)))
    .slice(0, body?.size || 10)
    .map(jc => ({ _id: jc.id, _source: jc, _score: q ? (jc.title.toLowerCase().includes(q) ? 2 : 1) : 1 }));

  return {
    hits: { hits, total: { value: hits.length } },
    aggregations: {
      categories:    { buckets: [] },
      disciplines:   { buckets: [] },
      demand_trends: { buckets: [] },
      employer_types:{ buckets: [] },
      cities:        { buckets: [] },
    },
  };
}

export const MAPPINGS = {};
