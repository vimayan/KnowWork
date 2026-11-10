/**
 * In-memory PostgreSQL replacement.
 * Exposes the same API (q, withTx, buildWhere, getPool, connectPg) so all
 * service files work without modification.
 */
const uuid = () => crypto.randomUUID();
import { tables, seedMemoryStore } from './memory-store.js';
import { logger } from '../utils/logger.js';

export async function connectPg() {
  await seedMemoryStore();
  logger.info('In-memory store ready (PostgreSQL replacement)');
}

export function getPool() {
  return { query: (sql, params) => q(sql, params) };
}

// ─── Simple parameterised query executor ─────────────────────────────────────
export async function q(sql, params = []) {
  const s = sql.trim().replace(/\s+/g, ' ');
  const upper = s.toUpperCase();

  // ── SELECT 1 (health check) ──────────────────────────────────────────────
  if (upper === 'SELECT 1') return { rows: [{ '?column?': 1 }] };

  // ── Dispatch by statement type ───────────────────────────────────────────
  if (upper.startsWith('SELECT COUNT(*)')) return handleCount(s, params);
  if (upper.startsWith('SELECT'))          return handleSelect(s, params);
  if (upper.startsWith('INSERT'))          return handleInsert(s, params);
  if (upper.startsWith('UPDATE'))          return handleUpdate(s, params);
  if (upper.startsWith('DELETE'))          return handleDelete(s, params);

  logger.warn('Unhandled SQL (returning empty)', { sql: s.slice(0, 80) });
  return { rows: [] };
}

/** Run fn(client) in a fake transaction (no real rollback needed for in-memory). */
export async function withTx(fn) {
  const fakeClient = {
    query: (sql, params) => q(sql, params),
    release: () => {},
  };
  return fn(fakeClient);
}

export function buildWhere(filters = {}) {
  const conds = [], vals = [];
  let i = 1;
  for (const [col, val] of Object.entries(filters)) {
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val)) conds.push(`${col} = ANY($${i++})`);
    else conds.push(`${col} = $${i++}`);
    vals.push(val);
  }
  return { where: conds.length ? 'WHERE ' + conds.join(' AND ') : '', vals, next: i };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveTable(sql) {
  // Strip subqueries (content inside parens) so we match the main FROM, not a nested one
  let s = sql;
  for (let i = 0; i < 5; i++) s = s.replace(/\([^()]*\)/g, '');
  const m = s.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
  return m ? m[1].toLowerCase() : null;
}

function extractCols(sql) {
  // Strip subqueries before parsing the SELECT list
  let s = sql;
  for (let i = 0; i < 5; i++) s = s.replace(/\([^()]*\)/g, '');
  const m = s.match(/SELECT\s+(.*?)\s+FROM/is);
  if (!m) return null;
  const cols = m[1].trim();
  if (cols === '*' || cols === 'COUNT(*)') return cols;
  return cols.split(',').map(c => {
    c = c.trim();
    const alias = c.match(/\bAS\s+(\w+)\s*$/i);
    const tableCol = c.match(/(\w+)\.(\w+)\s*(?:\bAS\b|$)/i);
    const bareCol  = c.match(/^(\w+)\s*(?:\bAS\b|$)/i);
    const tableAlias = tableCol ? tableCol[1].toLowerCase() : null;
    const col        = tableCol ? tableCol[2].toLowerCase() : (bareCol ? bareCol[1].toLowerCase() : null);
    return { tableAlias, col, alias: alias ? alias[1].toLowerCase() : null };
  });
}

function applyWhere(rows, sql, params) {
  // Strip subqueries so nested FROM/WHERE don't confuse parsing
  let s = sql;
  for (let i = 0; i < 5; i++) s = s.replace(/\([^()]*\)/g, '');
  const whereM = s.match(/WHERE\s+(.*?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|$)/is);
  if (!whereM) return rows;
  return rows.filter(row => matchWhere(whereM[1], row, params));
}

function matchWhere(clause, row, params) {
  // Handle simple AND-chained equalities like col=$1 AND col2=$2
  const conditions = splitConditions(clause);
  return conditions.every(cond => evalCondition(cond.trim(), row, params));
}

function splitConditions(clause) {
  // Simple split on AND (avoid splitting inside parens)
  return clause.split(/\bAND\b/i);
}

function evalCondition(cond, row, params) {
  // col = $n
  let m = cond.match(/^(\w+(?:\.\w+)?)\s*=\s*\$(\d+)$/i);
  if (m) {
    const col = m[1].split('.').pop().toLowerCase();
    const val = params[parseInt(m[2]) - 1];
    return String(row[col]) === String(val);
  }
  // col = ANY($n)
  m = cond.match(/(\w+)\s*=\s*ANY\(\$(\d+)\)/i);
  if (m) {
    const col = m[1].toLowerCase();
    const arr = params[parseInt(m[2]) - 1] || [];
    return arr.map(String).includes(String(row[col]));
  }
  // col = 'literal'
  m = cond.match(/(\w+(?:\.\w+)?)\s*=\s*'([^']*)'/i);
  if (m) {
    const col = m[1].split('.').pop().toLowerCase();
    return row[col] === m[2];
  }
  // col = true/false
  m = cond.match(/(\w+)\s*=\s*(true|false)/i);
  if (m) {
    const col = m[1].toLowerCase();
    return row[col] === (m[2].toLowerCase() === 'true');
  }
  // status='published' shorthand handled above, but catch col IS NULL
  m = cond.match(/(\w+)\s+IS\s+NULL/i);
  if (m) return row[m[1].toLowerCase()] == null;
  // Ignore complex conditions (aggregate functions, INTERVAL, etc.)
  return true;
}

function applyLimit(rows, sql, params) {
  const lm = sql.match(/LIMIT\s+\$(\d+)/i);
  const om = sql.match(/OFFSET\s+\$(\d+)/i);
  const start = om ? parseInt(params[parseInt(om[1]) - 1]) || 0 : 0;
  const limit = lm ? parseInt(params[parseInt(lm[1]) - 1]) || 20 : rows.length;
  return rows.slice(start, start + limit);
}

function applyOrderBy(rows, sql) {
  const m = sql.match(/ORDER\s+BY\s+(.*?)(?:\s+LIMIT|\s+OFFSET|$)/i);
  if (!m) return rows;
  const parts = m[1].split(',').map(p => {
    const desc = /DESC/i.test(p);
    const col  = p.trim().split(/\s+/)[0].split('.').pop().toLowerCase();
    return { col, desc };
  });
  return [...rows].sort((a, b) => {
    for (const { col, desc } of parts) {
      const av = a[col] ?? 0, bv = b[col] ?? 0;
      if (av < bv) return desc ? 1 : -1;
      if (av > bv) return desc ? -1 : 1;
    }
    return 0;
  });
}

// Fields on the main row that must never be overwritten by joined tables
const PROTECTED = new Set([
  'id', 'title', 'slug', 'status', 'description',
  'created_at', 'updated_at',
  'views', 'saves', 'likes',
  'password_hash', 'email', 'role',
]);

function joinRow(row, sql) {
  // Also strip subqueries from the SQL before parsing JOINs
  let s = sql;
  for (let i = 0; i < 5; i++) s = s.replace(/\([^()]*\)/g, '');
  const joins = [...s.matchAll(/(?:LEFT\s+)?JOIN\s+(\w+)\s+(\w+)\s+ON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/gi)];
  let r = { ...row };
  for (const [, tbl, tblAlias, leftCol, rightCol] of joins) {
    const tableRows = tables[tbl.toLowerCase()] || [];
    const related = tableRows.find(tr =>
      String(tr[rightCol.toLowerCase()]) === String(r[leftCol.toLowerCase()]) ||
      String(tr[leftCol.toLowerCase()]) === String(r[rightCol.toLowerCase()])
    );
    if (related) {
      for (const [k, v] of Object.entries(related)) {
        if (!PROTECTED.has(k)) {
          r[k] = v; // safe field — merge directly
        } else {
          // Protected field: stash under "alias__col" so applyAliases can resolve it
          r[`${tblAlias}__${k}`] = v;
        }
      }
    }
  }
  return r;
}

function applyAliases(rows, sql) {
  const cols = extractCols(sql);
  if (!cols || cols === '*' || cols === 'COUNT(*)') return rows;
  return rows.map(row => {
    const out = { ...row };
    for (const { tableAlias, col, alias } of cols) {
      if (!alias || !col) continue;
      // For protected fields from joins, check the prefixed key first: "jc__title"
      const prefixedKey = tableAlias ? `${tableAlias}__${col}` : null;
      if (prefixedKey && prefixedKey in row) {
        out[alias] = row[prefixedKey];
      } else if (col !== 'id' && col in row) {
        // Safe field — apply alias directly (skip bare 'id' to avoid false mapping)
        out[alias] = row[col];
      }
    }
    return out;
  });
}

function handleSelect(sql, params) {
  const upper = sql.toUpperCase();

  // Special: salary percentiles
  if (/percentile_cont.*salary_datapoints/i.test(sql)) {
    const jcId = params[0];
    const pts  = tables.salary_datapoints.filter(r => r.job_card_id === jcId);
    if (!pts.length) return { rows: [{ p25: 900000, median: 1500000, p75: 2500000, p90: 4000000, mean: 1800000, sample_count: 0 }] };
    const sorted = pts.map(p => p.salary_inr).sort((a,b) => a-b);
    const pct = p => sorted[Math.floor(sorted.length * p)];
    const mean = sorted.reduce((a,b)=>a+b,0) / sorted.length;
    return { rows: [{ p25: Math.round(pct(0.25)), median: Math.round(pct(0.5)), p75: Math.round(pct(0.75)), p90: Math.round(pct(0.9)), mean: Math.round(mean), sample_count: sorted.length }] };
  }

  // Special: salary trend
  if (/date_trunc.*salary_datapoints/i.test(sql)) {
    const jcId = params[0];
    const pts = tables.salary_datapoints.filter(r => r.job_card_id === jcId);
    const byMonth = {};
    for (const p of pts) {
      const m = new Date(p.time).toISOString().slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { sum: 0, count: 0 };
      byMonth[m].sum += p.salary_inr; byMonth[m].count++;
    }
    return { rows: Object.entries(byMonth).sort().map(([month, d]) => ({ month, avg_salary: Math.round(d.sum/d.count), data_points: d.count })) };
  }

  // Special: compare salary
  if (/compareSalary|job_cards jc.*salary_datapoints sd/i.test(sql) || (upper.includes('SALARY_DATAPOINTS') && upper.includes('GROUP BY JC.ID'))) {
    const ids = params;
    return { rows: ids.map(id => {
      const jc = tables.job_cards.find(c => c.id === id);
      const pts = tables.salary_datapoints.filter(p => p.job_card_id === id).map(p => p.salary_inr).sort((a,b)=>a-b);
      const median = pts.length ? pts[Math.floor(pts.length/2)] : 1500000;
      const mean   = pts.length ? Math.round(pts.reduce((a,b)=>a+b,0)/pts.length) : 1500000;
      return { id, title: jc?.title, slug: jc?.slug, median_inr: median, mean_inr: mean, samples: pts.length };
    }) };
  }

  const tblName = resolveTable(sql);
  if (!tblName || !tables[tblName]) {
    // Try to find in joined tables
    const fromM = sql.match(/FROM\s+(\w+)\s+\w+/i);
    if (fromM) {
      const t = fromM[1].toLowerCase();
      if (tables[t]) return queryTable(t, sql, params);
    }
    return { rows: [] };
  }
  return queryTable(tblName, sql, params);
}

function queryTable(tblName, sql, params) {
  let rows = (tables[tblName] || []).map(r => joinRow(r, sql));
  rows = applyWhere(rows, sql, params);
  rows = applyOrderBy(rows, sql);
  rows = applyLimit(rows, sql, params);
  rows = applyAliases(rows, sql);
  return { rows };
}

function handleCount(sql, params) {
  const tblName = resolveTable(sql);
  if (!tblName || !tables[tblName]) return { rows: [{ count: '0' }] };
  let rows = (tables[tblName] || []).map(r => joinRow(r, sql));
  rows = applyWhere(rows, sql, params);
  return { rows: [{ count: String(rows.length) }] };
}

function handleInsert(sql, params) {
  const tblMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
  if (!tblMatch) return { rows: [] };
  const tbl = tblMatch[1].toLowerCase();
  if (!tables[tbl]) tables[tbl] = [];

  // Extract column names
  const colMatch = sql.match(/\(([^)]+)\)\s+VALUES/i);
  if (!colMatch) return { rows: [] };
  const cols = colMatch[1].split(',').map(c => c.trim());

  const row = { id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  cols.forEach((col, i) => { row[col.toLowerCase()] = params[i] ?? null; });

  // ON CONFLICT … DO UPDATE
  if (/ON\s+CONFLICT/i.test(sql)) {
    const conflict = tables[tbl].findIndex(r => {
      // Try matching by user_id + roadmap_id or user_id alone
      if (row.user_id && row.roadmap_id) return r.user_id === row.user_id && r.roadmap_id === row.roadmap_id;
      if (row.pg_user_id) return r.pg_user_id === row.pg_user_id;
      return false;
    });
    if (conflict >= 0) {
      Object.assign(tables[tbl][conflict], row);
      return { rows: [tables[tbl][conflict]] };
    }
  }

  tables[tbl].push(row);
  if (sql.toUpperCase().includes('RETURNING')) return { rows: [row] };
  return { rows: [] };
}

function handleUpdate(sql, params) {
  const tblMatch = sql.match(/UPDATE\s+(\w+)/i);
  if (!tblMatch) return { rows: [] };
  const tbl = tblMatch[1].toLowerCase();
  if (!tables[tbl]) return { rows: [] };

  // Find the WHERE id=$n parameter
  const whereM = sql.match(/WHERE\s+id\s*=\s*\$(\d+)/i);
  const emailM = sql.match(/WHERE\s+email\s*=\s*\$(\d+)/i);
  const userM  = sql.match(/WHERE\s+(?:\w+\.)?id\s*=\s*\$(\d+)/i);

  let targetId;
  if (whereM)  targetId = params[parseInt(whereM[1]) - 1];
  else if (emailM) {
    const email = params[parseInt(emailM[1]) - 1];
    const found = tables[tbl].find(r => r.email === email);
    targetId = found?.id;
  } else if (userM) targetId = params[parseInt(userM[1]) - 1];

  if (!targetId) return { rows: [] };

  const idx = tables[tbl].findIndex(r => r.id === targetId);
  if (idx < 0) return { rows: [] };

  // Parse SET clause
  const setM = sql.match(/SET\s+(.*?)\s+WHERE/is);
  if (setM) {
    const setParts = setM[1].split(',');
    for (const part of setParts) {
      const kv = part.match(/(\w+)\s*=\s*\$(\d+)/);
      if (kv) tables[tbl][idx][kv[1].toLowerCase()] = params[parseInt(kv[2]) - 1];
    }
    tables[tbl][idx].updated_at = new Date().toISOString();
  }

  if (sql.toUpperCase().includes('RETURNING')) return { rows: [tables[tbl][idx]] };
  return { rows: [] };
}

function handleDelete(sql, params) {
  const tblMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
  if (!tblMatch) return { rows: [] };
  const tbl = tblMatch[1].toLowerCase();
  if (!tables[tbl]) return { rows: [] };

  const whereM = sql.match(/WHERE\s+id\s*=\s*\$(\d+)/i);
  if (!whereM) return { rows: [] };
  const targetId = params[parseInt(whereM[1]) - 1];
  const idx = tables[tbl].findIndex(r => r.id === targetId);
  if (idx < 0) return { rows: [] };

  const [deleted] = tables[tbl].splice(idx, 1);
  if (sql.toUpperCase().includes('RETURNING')) return { rows: [deleted] };
  return { rows: [] };
}
