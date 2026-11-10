import bcrypt      from 'bcryptjs';
import jwt         from 'jsonwebtoken';
import { createHash } from 'crypto';
import { q, withTx } from '../../db/postgres.js';
import { sessionSet, sessionDel, grantAccess } from '../../db/redis.js';
import { AppError } from '../../utils/response.js';
import { config }   from '../../config/index.js';

const sign = payload =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

export async function register({ email, name, password, role = 'user' }) {
  const { rows: ex } = await q('SELECT id FROM users WHERE email=$1', [email]);
  if (ex.length) throw AppError.conflict('Email already registered', 'EMAIL_TAKEN');

  const hash     = await bcrypt.hash(password, 12);
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const { rows } = await q(
    `INSERT INTO users (email,name,avatar_initials,password_hash,role)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id,email,name,avatar_initials,role,subscription_tier,created_at`,
    [email, name, initials, hash, role],
  );
  const user  = rows[0];
  const token = sign({ id: user.id, email: user.email, role: user.role });
  await sessionSet(token, { user_id: user.id, role: user.role });
  return { user, token };
}

export async function login({ email, password }) {
  const { rows } = await q(
    'SELECT id,email,name,avatar_initials,role,subscription_tier,password_hash FROM users WHERE email=$1',
    [email],
  );
  const hash = rows[0]?.password_hash ?? '';
  const valid = hash.startsWith('demo:')
    ? hash === `demo:${createHash('sha256').update(password).digest('hex')}`
    : await bcrypt.compare(password, hash);
  if (!rows[0] || !valid)
    throw AppError.unauthorized('Invalid credentials');

  const { password_hash, ...user } = rows[0];

  // Update last login
  await q('UPDATE users SET last_login_at=now(), login_count=login_count+1 WHERE id=$1', [user.id]);

  const token = sign({ id: user.id, email: user.email, role: user.role });
  await sessionSet(token, { user_id: user.id, role: user.role });
  return { user, token };
}

export const logout = token => sessionDel(token);

export async function me(userId) {
  const { rows } = await q(
    `SELECT u.id,u.email,u.name,u.avatar_initials,u.role,u.subscription_tier,
            u.free_areas_selected,u.paid_areas,u.free_natures_selected,
            u.email_verified,u.last_login_at,u.created_at,
            p.id AS profile_id, p.headline, p.current_title, p.job_card_id
     FROM users u
     LEFT JOIN profiles p ON p.id = u.profile_id
     WHERE u.id=$1`,
    [userId],
  );
  if (!rows[0]) throw AppError.notFound('User not found');
  return rows[0];
}

export async function updateMe(userId, body) {
  const allowed = ['name','preferred_location','newsletter_subscribed'];
  const sets = [], vals = [];
  let i = 1;
  for (const k of allowed) {
    if (body[k] !== undefined) { sets.push(`${k}=$${i++}`); vals.push(body[k]); }
  }
  if (!sets.length) throw AppError.badRequest('Nothing to update');
  sets.push('updated_at=now()');
  vals.push(userId);
  const { rows } = await q(
    `UPDATE users SET ${sets.join(',')} WHERE id=$${i} RETURNING id,name,email,preferred_location,newsletter_subscribed`,
    vals,
  );
  return rows[0];
}

/** Set user's free area selections (max 5). */
export async function selectFreeAreas(userId, fieldIds) {
  if (fieldIds.length > 5) throw AppError.badRequest('Maximum 5 free areas allowed');
  await q('UPDATE users SET free_areas_selected=$1 WHERE id=$2', [fieldIds, userId]);
  // Grant Redis access for each
  for (const fid of fieldIds) await grantAccess(userId, fid);
  return { selected: fieldIds };
}
