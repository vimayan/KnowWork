// ─── SERVICE ──────────────────────────────────────────────────────────────
import { q, withTx } from '../../db/postgres.js';
import { cacheAside, cacheDel, setAdd, setRem } from '../../db/redis.js';
import { AppError, paginate, pageInfo } from '../../utils/response.js';

export async function listMentors(filters = {}) {
  const { page, limit, offset } = paginate(filters);
  const conds = [], vals = [];
  let i = 1;

  if (filters.available === 'true') conds.push('m.available=true');
  if (filters.job_card_id) { conds.push(`m.job_card_id=$${i++}`); vals.push(filters.job_card_id); }
  if (filters.maxRate)     { conds.push(`m.hourly_rate_inr<=$${i++}`); vals.push(+filters.maxRate); }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const sort  = { rating: 'm.rating DESC NULLS LAST', sessions: 'm.total_sessions DESC' }[filters.sort] || 'm.rating DESC NULLS LAST';

  const [data, cnt] = await Promise.all([
    q(`SELECT m.id,m.title,m.company,m.bio,m.hourly_rate_inr,m.available,
              m.rating,m.total_sessions,m.total_reviews,m.languages,
              u.name,u.avatar_initials,
              jc.title AS job_card_title,jc.slug AS job_card_slug,
              COALESCE(ARRAY_AGG(DISTINCT me.skill) FILTER (WHERE me.skill IS NOT NULL),'{}') AS expertise
       FROM mentors m
       JOIN users u ON u.id=m.user_id
       LEFT JOIN job_cards jc ON jc.id=m.job_card_id
       LEFT JOIN mentor_expertise me ON me.mentor_id=m.id
       ${where} GROUP BY m.id,u.name,u.avatar_initials,jc.title,jc.slug
       ORDER BY ${sort} LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]),
    q(`SELECT COUNT(DISTINCT m.id) FROM mentors m ${where}`, vals),
  ]);

  return { data: data.rows, meta: pageInfo(parseInt(cnt.rows[0].count), page, limit) };
}

export async function getMentor(id) {
  return cacheAside(`mentor:${id}`, async () => {
    const { rows } = await q(
      `SELECT m.*,u.name,u.avatar_initials,u.email,
              jc.title AS job_card_title,jc.slug AS job_card_slug,
              COALESCE(ARRAY_AGG(row_to_json(me)) FILTER (WHERE me.skill IS NOT NULL),'{}') AS expertise
       FROM mentors m
       JOIN users u ON u.id=m.user_id
       LEFT JOIN job_cards jc ON jc.id=m.job_card_id
       LEFT JOIN mentor_expertise me ON me.mentor_id=m.id
       WHERE m.id=$1 GROUP BY m.id,u.name,u.avatar_initials,u.email,jc.title,jc.slug`,
      [id],
    );
    if (!rows[0]) throw AppError.notFound('Mentor not found');
    return rows[0];
  }, 120);
}

export async function createMentorProfile(userId, body) {
  const { rows: ex } = await q('SELECT id FROM mentors WHERE user_id=$1', [userId]);
  if (ex.length) throw AppError.conflict('Mentor profile already exists');

  return withTx(async client => {
    await client.query("UPDATE users SET role='mentor' WHERE id=$1", [userId]);
    const { rows } = await client.query(
      `INSERT INTO mentors (user_id,profile_id,job_card_id,title,company,bio,languages,hourly_rate_inr,session_duration_min)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, body.profile_id||null, body.job_card_id||null, body.title,
       body.company||null, body.bio||null, body.languages||['English'],
       body.hourly_rate_inr||null, body.session_duration_min||60],
    );
    const mentor = rows[0];
    for (const { skill, level } of (body.expertise || [])) {
      await client.query(
        'INSERT INTO mentor_expertise (mentor_id,skill,level) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [mentor.id, skill, level || 4],
      );
    }
    if (body.available !== false) await setAdd('mentors:available', mentor.id);
    return mentor;
  });
}

export async function setAvailability(mentorId, userId, available) {
  const { rows } = await q(
    'UPDATE mentors SET available=$1 WHERE id=$2 AND user_id=$3 RETURNING id,available',
    [available, mentorId, userId],
  );
  if (!rows[0]) throw AppError.notFound('Mentor not found or not yours');
  available ? await setAdd('mentors:available', mentorId) : await setRem('mentors:available', mentorId);
  await cacheDel(`mentor:${mentorId}`);
  return rows[0];
}

export async function bookSession(mentorId, studentId, body) {
  const { rows: m } = await q('SELECT id,available FROM mentors WHERE id=$1', [mentorId]);
  if (!m[0]) throw AppError.notFound('Mentor not found');
  if (!m[0].available) throw AppError.conflict('Mentor is not available right now');

  const { rows } = await q(
    `INSERT INTO mentor_sessions (mentor_id,student_id,topic,student_goal,pre_session_note,duration_min,amount_inr,payment_status,scheduled_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8) RETURNING *`,
    [mentorId, studentId, body.topic||null, body.student_goal||null,
     body.pre_session_note||null, body.duration_min||60, body.amount_inr||null,
     body.scheduled_at||null],
  );
  return rows[0];
}

export async function listSessions(filters) {
  const conds = [], vals = [];
  let i = 1;
  if (filters.mentorId)  { conds.push(`ms.mentor_id=$${i++}`);  vals.push(filters.mentorId); }
  if (filters.studentId) { conds.push(`ms.student_id=$${i++}`); vals.push(filters.studentId); }
  if (filters.status)    { conds.push(`ms.status=$${i++}`);      vals.push(filters.status); }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const { rows } = await q(
    `SELECT ms.*,
            u.name AS student_name, u.avatar_initials AS student_avatar,
            mu.name AS mentor_name
     FROM mentor_sessions ms
     JOIN users u ON u.id=ms.student_id
     JOIN mentors m ON m.id=ms.mentor_id
     JOIN users mu ON mu.id=m.user_id
     ${where} ORDER BY ms.created_at DESC`,
    vals,
  );
  return rows;
}

export async function reviewSession(sessionId, reviewerId, body) {
  const { rows: s } = await q('SELECT mentor_id FROM mentor_sessions WHERE id=$1 AND student_id=$2 AND status=$3', [sessionId, reviewerId, 'completed']);
  if (!s[0]) throw AppError.notFound('Session not found or not completed');

  const { rows } = await q(
    `INSERT INTO session_reviews (session_id,reviewer_id,mentor_id,overall_rating,clarity_rating,knowledge_rating,helpfulness_rating,review_text,would_recommend)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (session_id) DO NOTHING RETURNING *`,
    [sessionId, reviewerId, s[0].mentor_id, body.overall_rating, body.clarity_rating||null,
     body.knowledge_rating||null, body.helpfulness_rating||null, body.review_text||null, body.would_recommend||null],
  );
  await cacheDel(`mentor:${s[0].mentor_id}`);
  return rows[0];
}
