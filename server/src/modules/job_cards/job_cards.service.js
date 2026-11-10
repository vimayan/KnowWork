import { q, withTx, buildWhere } from '../../db/postgres.js';
import { cacheAside, cacheDel, incr, zAdd } from '../../db/redis.js';
import { indexDoc, removeDoc, esSearch } from '../../db/elastic.js';
import { AppError, paginate, pageInfo } from '../../utils/response.js';
import { config } from '../../config/index.js';

const TTL = config.redis.ttl.jobCard;

// ── List job cards (filtered, paginated) ──────────────────────────────────
export async function listJobCards(query) {
  const { page, limit, offset } = paginate(query);
  const conds = ['jc.published = true'], vals = [];
  let i = 1;

  if (query.field)     { conds.push(`jf.name = $${i++}`);            vals.push(query.field); }
  if (query.category)  { conds.push(`jf.category = $${i++}`);        vals.push(query.category); }
  if (query.remote)    { conds.push(`jc.is_remote_possible = true`); }
  if (query.freelance) { conds.push(`jc.is_freelance_viable = true`); }
  if (query.grade)     { conds.push(`jc.social_grade = $${i++}`);    vals.push(query.grade); }
  if (query.featured)  { conds.push(`jc.featured = true`); }

  const where = 'WHERE ' + conds.join(' AND ');
  const sort  = { views: 'jc.views DESC', saves: 'jc.saves DESC', title: 'jc.title ASC' }[query.sort] || 'jc.created_at DESC';

  const [data, count] = await Promise.all([
    q(`SELECT jc.id,jc.slug,jc.title,jc.alternate_titles,jc.summary,
              jc.social_grade,jc.industry_grade,jc.is_remote_possible,
              jc.is_freelance_viable,jc.featured,jc.views,jc.saves,
              jf.name AS field, jf.category, jf.discipline, jf.industry, jf.icon
       FROM job_cards jc JOIN job_fields jf ON jf.id=jc.field_id
       ${where} ORDER BY ${sort} LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]),
    q(`SELECT COUNT(*) FROM job_cards jc JOIN job_fields jf ON jf.id=jc.field_id ${where}`, vals),
  ]);

  return { data: data.rows, meta: pageInfo(parseInt(count.rows[0].count), page, limit) };
}

// ── Get full job card (all sub-tables joined) ─────────────────────────────
export async function getJobCard(slug) {
  return cacheAside(`jc:${slug}`, async () => {
    const { rows } = await q(
      `SELECT jc.*,jf.name AS field,jf.category,jf.discipline,jf.industry,jf.icon
       FROM job_cards jc JOIN job_fields jf ON jf.id=jc.field_id
       WHERE jc.slug=$1 AND jc.published=true`,
      [slug],
    );
    if (!rows[0]) throw AppError.notFound('Job card not found');
    const card = rows[0];

    // Load all sub-tables in parallel
    const [details, workEnv, skills, disciplines] = await Promise.all([
      q('SELECT * FROM job_details WHERE job_card_id=$1', [card.id]),
      q('SELECT * FROM job_work_env WHERE job_card_id=$1', [card.id]),
      q('SELECT skill_name,skill_type,importance,is_core,learn_time_weeks FROM job_skills WHERE job_card_id=$1 ORDER BY importance DESC', [card.id]),
      q('SELECT id,name,slug,description,tools_specific,skill_delta FROM job_disciplines WHERE job_card_id=$1', [card.id]),
    ]);

    return {
      ...card,
      details:     details.rows[0] || null,
      work_env:    workEnv.rows[0] || null,
      skills:      skills.rows,
      disciplines: disciplines.rows,
    };
  }, TTL);
}

// ── Get job card rich details (for detail page sections) ──────────────────
export async function getJobCardSection(id, section) {
  const sectionMap = {
    problems:    `SELECT * FROM job_problems WHERE job_card_id=$1 ORDER BY severity DESC`,
    history:     `SELECT * FROM job_market_history WHERE job_card_id=$1 ORDER BY year ASC`,
    employers:   `SELECT * FROM job_employers WHERE job_card_id=$1 ORDER BY employer_type,avg_salary_inr DESC NULLS LAST`,
    education:   `SELECT * FROM job_education_links WHERE job_card_id=$1 ORDER BY relevance_score DESC`,
    subjects:    `SELECT * FROM subject_skill_map WHERE job_card_id=$1 ORDER BY importance DESC`,
    society:     `SELECT * FROM daily_life_scenarios WHERE job_card_id=$1`,
    failures:    `SELECT fm.*,ARRAY(SELECT json_build_object('route',sp.survival_route,'outcome',sp.outcome) FROM survival_paths sp WHERE sp.failure_map_id=fm.id) AS survival_paths FROM failure_maps fm WHERE fm.job_card_id=$1`,
    obstacles:   `SELECT * FROM social_obstacles WHERE job_card_id=$1 ORDER BY severity DESC`,
  };
  if (!sectionMap[section]) throw AppError.badRequest(`Unknown section: ${section}`);
  const { rows } = await q(sectionMap[section], [id]);
  return rows;
}

// ── Record view (fire-and-forget to Redis) ────────────────────────────────
export async function recordView(id) {
  await incr(`job:views:${id}`);
}

// ── Create job card (admin) ───────────────────────────────────────────────
export async function createJobCard(body) {
  return withTx(async client => {
    const { rows } = await client.query(
      `INSERT INTO job_cards (slug,title,alternate_titles,field_id,summary,what_you_do,
        social_grade,industry_grade,is_remote_possible,is_field_work,is_shift_based,is_freelance_viable,featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [body.slug,body.title,body.alternate_titles||[],body.field_id,body.summary,
       body.what_you_do,body.social_grade||'B',body.industry_grade||'core',
       body.is_remote_possible||false,body.is_field_work||false,
       body.is_shift_based||false,body.is_freelance_viable!==false,body.featured||false],
    );
    const card = rows[0];

    // Seed empty details row
    await client.query('INSERT INTO job_details (job_card_id) VALUES ($1)', [card.id]);
    await client.query('INSERT INTO job_work_env (job_card_id) VALUES ($1)', [card.id]);

    return card;
  });
}

export async function updateJobCard(id, body) {
  const allowed = ['title','summary','what_you_do','social_grade','industry_grade',
                   'is_remote_possible','is_field_work','is_shift_based','is_freelance_viable','featured','published'];
  const sets = [], vals = [];
  let i = 1;
  for (const k of allowed) {
    if (body[k] !== undefined) { sets.push(`${k}=$${i++}`); vals.push(body[k]); }
  }
  if (!sets.length) throw AppError.badRequest('Nothing to update');
  sets.push('updated_at=now()');
  vals.push(id);
  const { rows } = await q(`UPDATE job_cards SET ${sets.join(',')} WHERE id=$${i} RETURNING slug`, vals);
  if (!rows[0]) throw AppError.notFound('Job card not found');
  await cacheDel(`jc:${rows[0].slug}`);
  return rows[0];
}

export async function deleteJobCard(id) {
  const { rows } = await q('DELETE FROM job_cards WHERE id=$1 RETURNING slug', [id]);
  if (!rows[0]) throw AppError.notFound('Job card not found');
  await cacheDel(`jc:${rows[0].slug}`);
  return { deleted: id };
}
