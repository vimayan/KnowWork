import { q } from '../../db/postgres.js';
import { AppError, paginate, pageInfo } from '../../utils/response.js';

export async function listStories(filters = {}) {
  const { page, limit, offset } = paginate(filters);
  const conds = ["ss.status='published'"], vals = [];
  let i = 1;

  if (filters.job_card_id) { conds.push(`ss.job_card_id=$${i++}`); vals.push(filters.job_card_id); }
  if (filters.featured)    { conds.push('ss.featured=true'); }

  const where = 'WHERE ' + conds.join(' AND ');

  const [data, cnt] = await Promise.all([
    q(`SELECT ss.id,ss.title,ss.from_background,ss.to_role,ss.quote,ss.timeframe,
              ss.key_turning_points,ss.featured,ss.likes,ss.views,ss.created_at,
              p.display_name,p.avatar_initials,p.city,p.country,
              jc.title AS job_card_title,jc.slug AS job_card_slug
       FROM success_stories ss
       LEFT JOIN profiles p ON p.id=ss.profile_id
       LEFT JOIN job_cards jc ON jc.id=ss.job_card_id
       ${where} ORDER BY ss.featured DESC,ss.likes DESC,ss.created_at DESC
       LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]),
    q(`SELECT COUNT(*) FROM success_stories ss ${where}`, vals),
  ]);

  return { data: data.rows, meta: pageInfo(parseInt(cnt.rows[0].count), page, limit) };
}

export async function getStory(id) {
  const { rows } = await q(
    `SELECT ss.*,
            p.display_name,p.avatar_initials,p.city,p.country,p.headline,
            jc.title AS job_card_title,jc.slug AS job_card_slug
     FROM success_stories ss
     LEFT JOIN profiles p ON p.id=ss.profile_id
     LEFT JOIN job_cards jc ON jc.id=ss.job_card_id
     WHERE ss.id=$1 AND ss.status='published'`,
    [id],
  );
  if (!rows[0]) throw AppError.notFound('Story not found');
  await q('UPDATE success_stories SET views=views+1 WHERE id=$1', [id]).catch(() => {});
  return rows[0];
}

export async function submitJourney(userId, body) {
  const {
    submitter_name, current_title, city, country = 'India',
    education, salary, steps = [], key_learnings = [],
    mistakes_made = [], advice_to_self, job_card_id,
  } = body;

  const title        = `${submitter_name} — ${current_title}`;
  const full_story   = JSON.stringify({ steps, key_learnings, mistakes_made, education, salary });
  const turning_pts  = key_learnings.filter(Boolean);
  const timeframe    = steps.map(s => s.duration).filter(Boolean).join(' → ') || null;

  const { rows: profRows } = await q(
    'SELECT id FROM profiles WHERE user_id=$1', [userId],
  );
  const profile_id = profRows[0]?.id || null;

  const { rows } = await q(
    `INSERT INTO success_stories
       (profile_id,job_card_id,title,from_background,to_role,quote,full_story,
        timeframe,key_turning_points,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
     RETURNING id,title,status,created_at`,
    [profile_id, job_card_id || null, title,
     education || 'Various backgrounds', current_title,
     advice_to_self || 'Keep going.',
     full_story, timeframe, turning_pts],
  );
  return rows[0];
}

export async function likeStory(id) {
  const { rows } = await q(
    'UPDATE success_stories SET likes=likes+1 WHERE id=$1 AND status=$2 RETURNING id,likes',
    [id, 'published'],
  );
  if (!rows[0]) throw AppError.notFound('Story not found');
  return rows[0];
}
