import { Router } from 'express';
import { body }   from 'express-validator';
import { q, withTx } from '../../db/postgres.js';
import { cacheAside, cacheDel } from '../../db/redis.js';
import { indexDoc } from '../../db/elastic.js';
import { config }  from '../../config/index.js';
import { asyncHandler, ok, created, paginate, pageInfo, AppError } from '../../utils/response.js';
import { authenticate, optionalAuth, requireRole, validate } from '../../middleware/index.js';

const router = Router();

// GET /profiles?job_card_id=&city=&employer_type=&page=
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query);
  const conds = ["p.status != 'inactive'"], vals = [];
  let i = 1;
  if (req.query.job_card_id) { conds.push(`p.job_card_id=$${i++}`); vals.push(req.query.job_card_id); }
  if (req.query.city)        { conds.push(`p.city ILIKE $${i++}`); vals.push(`%${req.query.city}%`); }
  if (req.query.employer_type) { conds.push(`p.employer_type=$${i++}`); vals.push(req.query.employer_type); }
  if (req.query.verified)    { conds.push('p.is_verified=true'); }

  const where = 'WHERE ' + conds.join(' AND ');
  const sort = req.query.sort === 'followers' ? 'p.followers DESC' : 'p.profile_views DESC';

  const [data, cnt] = await Promise.all([
    q(`SELECT p.id,p.display_name,p.avatar_initials,p.headline,p.city,p.country,
              p.current_title,p.current_company,p.employer_type,p.years_experience,
              p.status,p.is_verified,p.profile_views,p.followers,
              jc.title AS job_card_title, jc.slug AS job_card_slug
       FROM profiles p LEFT JOIN job_cards jc ON jc.id=p.job_card_id
       ${where} ORDER BY ${sort} LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]),
    q(`SELECT COUNT(*) FROM profiles p ${where}`, vals),
  ]);
  ok(res, data.rows, { meta: pageInfo(parseInt(cnt.rows[0].count), page, limit) });
}));

// GET /profiles/:id  — full profile with skills + work history
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const cacheKey = `profile:${req.params.id}`;
  const data = await cacheAside(cacheKey, async () => {
    const { rows } = await q(
      `SELECT p.*,jc.title AS job_card_title,jc.slug AS job_card_slug,
              u.email, u.role
       FROM profiles p
       LEFT JOIN job_cards jc ON jc.id=p.job_card_id
       LEFT JOIN users u ON u.id=p.user_id
       WHERE p.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) throw AppError.notFound('Profile not found');
    const prof = rows[0];

    const [skills, history, learning] = await Promise.all([
      q('SELECT * FROM profile_skills WHERE profile_id=$1 ORDER BY proficiency DESC', [prof.id]),
      q('SELECT * FROM profile_work_history WHERE profile_id=$1 ORDER BY position', [prof.id]),
      q('SELECT * FROM profile_learning_path WHERE profile_id=$1 AND is_public=true ORDER BY position', [prof.id]),
    ]);

    // Increment view counter
    await q('UPDATE profiles SET profile_views=profile_views+1 WHERE id=$1', [prof.id]).catch(()=>{});

    return { ...prof, skills: skills.rows, work_history: history.rows, learning_path: learning.rows };
  }, 120);
  ok(res, data);
}));

// POST /profiles  — create own profile
router.post('/', authenticate,
  body('job_card_id').isUUID(),
  body('display_name').trim().isLength({ min: 2, max: 100 }),
  body('current_title').trim().isLength({ min: 2, max: 120 }),
  validate,
  asyncHandler(async (req, res) => {
    const { rows: ex } = await q('SELECT id FROM profiles WHERE user_id=$1', [req.user.id]);
    if (ex.length) throw AppError.conflict('Profile already exists');

    const b = req.body;
    const initials = b.display_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const { rows } = await q(
      `INSERT INTO profiles (user_id,job_card_id,discipline_id,display_name,avatar_initials,headline,bio,
         city,state,country,current_title,current_company,employer_type,years_experience,
         current_salary_inr,highest_education,graduation_year,linkedin_url,github_url,portfolio_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
      [req.user.id,b.job_card_id,b.discipline_id||null,b.display_name,initials,
       b.headline||null,b.bio||null,b.city||null,b.state||null,b.country||'India',
       b.current_title,b.current_company||null,b.employer_type||null,b.years_experience||null,
       b.current_salary_inr||null,b.highest_education||null,b.graduation_year||null,
       b.linkedin_url||null,b.github_url||null,b.portfolio_url||null]
    );
    const profile = rows[0];
    await q('UPDATE users SET profile_id=$1 WHERE id=$2', [profile.id, req.user.id]);

    // Sync to ES
    indexDoc(config.elastic.indexes.profiles, profile.id, {
      id: profile.id, display_name: profile.display_name, headline: profile.headline,
      job_card_id: profile.job_card_id, current_title: profile.current_title,
      current_company: profile.current_company, employer_type: profile.employer_type,
      city: profile.city, country: profile.country, is_verified: false, years_experience: profile.years_experience,
    }).catch(()=>{});

    created(res, profile, 'Profile created');
  })
);

// PATCH /profiles/:id
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
  const { rows: own } = await q('SELECT id FROM profiles WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  if (!own.length && req.user.role !== 'admin') throw AppError.forbidden();

  const allowed = ['headline','bio','city','state','current_title','current_company','employer_type',
                   'years_experience','current_salary_inr','highest_education','linkedin_url','github_url','portfolio_url','status'];
  const sets = [], vals = [];
  let i = 1;
  for (const k of allowed) {
    if (req.body[k] !== undefined) { sets.push(`${k}=$${i++}`); vals.push(req.body[k]); }
  }
  if (!sets.length) throw AppError.badRequest('Nothing to update');
  sets.push('updated_at=now()');
  vals.push(req.params.id);

  const { rows } = await q(`UPDATE profiles SET ${sets.join(',')} WHERE id=$${i} RETURNING *`, vals);
  await cacheDel(`profile:${req.params.id}`);
  ok(res, rows[0], { message: 'Profile updated' });
}));

// POST /profiles/:id/skills
router.post('/:id/skills', authenticate,
  body('skill_name').trim().isLength({ min: 1, max: 100 }),
  body('proficiency').isInt({ min: 1, max: 5 }),
  validate,
  asyncHandler(async (req, res) => {
    await q(
      `INSERT INTO profile_skills (profile_id,skill_name,proficiency,years_used)
       VALUES ($1,$2,$3,$4) ON CONFLICT (profile_id,skill_name) DO UPDATE SET proficiency=EXCLUDED.proficiency`,
      [req.params.id, req.body.skill_name, req.body.proficiency, req.body.years_used||null]
    );
    await cacheDel(`profile:${req.params.id}`);
    ok(res, null, { message: 'Skill saved' });
  })
);

// POST /profiles/:id/work-history
router.post('/:id/work-history', authenticate,
  body('company_name').trim().isLength({ min: 2 }),
  body('job_title').trim().isLength({ min: 2 }),
  body('start_year').isInt({ min: 1950, max: 2100 }),
  validate,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const { rows: last } = await q('SELECT COALESCE(MAX(position),0) AS pos FROM profile_work_history WHERE profile_id=$1', [req.params.id]);
    const { rows } = await q(
      `INSERT INTO profile_work_history (profile_id,position,company_name,job_title,employer_type,city,country,start_year,end_year,is_current,salary_inr,description,skills_used)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.params.id, last[0].pos+1, b.company_name, b.job_title, b.employer_type||null,
       b.city||null, b.country||'India', b.start_year, b.end_year||null, b.is_current||false,
       b.salary_inr||null, b.description||null, b.skills_used||[]]
    );
    await cacheDel(`profile:${req.params.id}`);
    created(res, rows[0], 'Work history added');
  })
);

// POST /profiles/:id/learning-path
router.post('/:id/learning-path', authenticate,
  body('item_type').isIn(['degree','certification','course','project','internship','achievement','habit']),
  body('title').trim().isLength({ min: 2, max: 200 }),
  validate,
  asyncHandler(async (req, res) => {
    const b = req.body;
    const { rows: last } = await q('SELECT COALESCE(MAX(position),0) AS pos FROM profile_learning_path WHERE profile_id=$1', [req.params.id]);
    const { rows } = await q(
      `INSERT INTO profile_learning_path (profile_id,position,item_type,title,provider,year_completed,duration_months,skills_gained,description,is_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.params.id, last[0].pos+1, b.item_type, b.title, b.provider||null,
       b.year_completed||null, b.duration_months||null, b.skills_gained||[], b.description||null, b.is_public!==false]
    );
    await cacheDel(`profile:${req.params.id}`);
    created(res, rows[0], 'Learning path item added');
  })
);

export default router;
