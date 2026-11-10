import { Router } from 'express';
import { esSearch } from '../../db/elastic.js';
import { q }       from '../../db/postgres.js';
import { config }  from '../../config/index.js';
import { asyncHandler, ok, paginate } from '../../utils/response.js';
import { optionalAuth } from '../../middleware/index.js';

const router = Router();

// ── Global search (used by the frontend search bar) ───────────────────────
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q: text } = req.query;
  const result = await esSearch(config.elastic.indexes.jobCards, {
    query: text
      ? { multi_match: { query: text, fields: ['title', 'summary'] } }
      : { match_all: {} },
    size: 20,
  });
  ok(res, {
    results: result.hits.hits.map(h => h._source),
    meta: { total: result.hits.total.value, source: 'in_memory' },
  });
}));

// ── Job card search with facets ───────────────────────────────────────────
router.get('/job-cards', optionalAuth, asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const { q: text, category, remote, freelance, demand } = req.query;
  const filters = [];

  if (category)  filters.push({ term: { category } });
  if (remote)    filters.push({ term: { is_remote_possible: true } });
  if (freelance) filters.push({ term: { is_freelance_viable: true } });
  if (demand)    filters.push({ term: { india_demand_trend: demand } });
  filters.push({ term: { featured: undefined } }); // no featured filter by default

  const esBody = {
    from: (page - 1) * limit,
    size: limit,
    query: text
      ? {
          bool: {
            must: {
              multi_match: {
                query: text,
                fields: ['title^4','alternate_titles^3','summary^2','what_you_do','skills'],
                fuzziness: 'AUTO',
              },
            },
            filter: filters.filter(f => f.term !== undefined),
          },
        }
      : { bool: { filter: filters.filter(f => f.term !== undefined) } },
    aggs: {
      categories:    { terms: { field: 'category', size: 20 } },
      disciplines:   { terms: { field: 'discipline', size: 20 } },
      demand_trends: { terms: { field: 'india_demand_trend', size: 5 } },
    },
  };

  const esResult = await esSearch(config.elastic.indexes.jobCards, esBody);

  if (esResult) {
    const hits  = esResult.hits.hits.map(h => ({ ...h._source, score: h._score }));
    const total = esResult.hits.total.value;
    const aggs  = esResult.aggregations;
    return ok(res, { results: hits, facets: {
      categories:  aggs.categories.buckets,
      disciplines: aggs.disciplines.buckets,
      demand:      aggs.demand_trends.buckets,
    }, meta: { total, page, limit, totalPages: Math.ceil(total / limit), source: 'elasticsearch' } });
  }

  // ── PG fallback (trigram) ────────────────────────────────────────────────
  const pgQ = text
    ? await q(
        `SELECT jc.id,jc.slug,jc.title,jc.summary,jf.category,jf.discipline,
                similarity(jc.title,$1) AS score
         FROM job_cards jc JOIN job_fields jf ON jf.id=jc.field_id
         WHERE jc.published=true AND jc.title % $1
         ORDER BY score DESC LIMIT $2 OFFSET $3`,
        [text, limit, (page - 1) * limit],
      )
    : await q(
        `SELECT jc.id,jc.slug,jc.title,jc.summary,jf.category,jf.discipline
         FROM job_cards jc JOIN job_fields jf ON jf.id=jc.field_id
         WHERE jc.published=true
         LIMIT $1 OFFSET $2`,
        [limit, (page - 1) * limit],
      );

  ok(res, { results: pgQ.rows, facets: null, meta: { source: 'postgres_fallback' } });
}));

// ── Profile search ─────────────────────────────────────────────────────────
router.get('/profiles', optionalAuth, asyncHandler(async (req, res) => {
  const { page, limit } = paginate(req.query);
  const { q: text, job_card_id, city, employer_type } = req.query;
  const filters = [];
  if (job_card_id)   filters.push({ term: { job_card_id } });
  if (city)          filters.push({ term: { city } });
  if (employer_type) filters.push({ term: { employer_type } });

  const esResult = await esSearch(config.elastic.indexes.profiles, {
    from: (page - 1) * limit, size: limit,
    query: text
      ? { bool: { must: { multi_match: { query: text, fields: ['display_name^3','headline^2','bio','skills','current_title'], fuzziness: 'AUTO' } }, filter: filters } }
      : { bool: { filter: filters.length ? filters : [{ match_all: {} }] } },
    aggs: {
      employer_types: { terms: { field: 'employer_type', size: 10 } },
      cities:         { terms: { field: 'city', size: 20 } },
    },
  });

  if (esResult) {
    return ok(res, {
      results: esResult.hits.hits.map(h => h._source),
      facets: { employer_types: esResult.aggregations.employer_types.buckets, cities: esResult.aggregations.cities.buckets },
      meta: { total: esResult.hits.total.value, page, limit },
    });
  }

  // PG fallback
  const { rows } = await q(
    `SELECT p.id,p.display_name,p.headline,p.city,p.employer_type,p.years_experience,
            jc.title AS job_card_title
     FROM profiles p LEFT JOIN job_cards jc ON jc.id=p.job_card_id
     WHERE p.status='active' ${job_card_id ? 'AND p.job_card_id=$1' : ''}
     LIMIT $${job_card_id ? 2 : 1} OFFSET $${job_card_id ? 3 : 2}`,
    [...(job_card_id ? [job_card_id] : []), limit, (page - 1) * limit],
  );
  ok(res, { results: rows, meta: { source: 'postgres_fallback' } });
}));

export default router;
