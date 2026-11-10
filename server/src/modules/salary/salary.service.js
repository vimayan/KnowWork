import { q } from '../../db/postgres.js';
import { cacheAside, cacheDel } from '../../db/redis.js';
import { config } from '../../config/index.js';
import { AppError } from '../../utils/response.js';

const TTL = config.redis.ttl.salary;

/** Full salary matrix for a job card — filtered by zone/tier/exp. */
export async function getSalaryIndex(jobCardId, filters = {}) {
  const cacheKey = `sal:${jobCardId}:${JSON.stringify(filters)}`;
  return cacheAside(cacheKey, async () => {
    const conds = ['si.job_card_id=$1'];
    const vals  = [jobCardId];
    let i = 2;

    if (filters.zone)        { conds.push(`si.availability_zone=$${i++}`);  vals.push(filters.zone); }
    if (filters.employer)    { conds.push(`si.employer_type=$${i++}`);       vals.push(filters.employer); }
    if (filters.exp !== undefined) {
      conds.push(`si.experience_min_yr<=$${i} AND si.experience_max_yr>=$${i}`);
      vals.push(+filters.exp); i++;
    }
    if (filters.education)   { conds.push(`si.education_level=$${i++}`);     vals.push(filters.education); }
    if (filters.discipline)  { conds.push(`si.discipline_id=$${i++}`);       vals.push(filters.discipline); }

    conds.push(`(si.effective_to IS NULL OR si.effective_to >= CURRENT_DATE)`);

    const { rows } = await q(
      `SELECT si.*, d.name AS discipline_name
       FROM salary_index si
       LEFT JOIN job_disciplines d ON d.id=si.discipline_id
       WHERE ${conds.join(' AND ')}
       ORDER BY si.employer_type, si.experience_min_yr`,
      vals,
    );
    return rows;
  }, TTL);
}

/** Live percentiles from TimescaleDB salary_datapoints. */
export async function getSalaryPercentiles(jobCardId, country = 'India') {
  const cacheKey = `sal:pct:${jobCardId}:${country}`;
  return cacheAside(cacheKey, async () => {
    const { rows } = await q(
      `SELECT
         ROUND(percentile_cont(0.25) WITHIN GROUP (ORDER BY salary_inr)) AS p25,
         ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY salary_inr)) AS median,
         ROUND(percentile_cont(0.75) WITHIN GROUP (ORDER BY salary_inr)) AS p75,
         ROUND(percentile_cont(0.90) WITHIN GROUP (ORDER BY salary_inr)) AS p90,
         ROUND(AVG(salary_inr))                                           AS mean,
         COUNT(*)                                                          AS sample_count
       FROM salary_datapoints
       WHERE job_card_id=$1 AND country=$2
         AND time >= now() - INTERVAL '2 years'`,
      [jobCardId, country],
    );
    return rows[0];
  }, TTL);
}

/** Salary trend over time (monthly buckets). */
export async function getSalaryTrend(jobCardId, months = 24) {
  const { rows } = await q(
    `SELECT
       date_trunc('month', time)                AS month,
       ROUND(AVG(salary_inr))                   AS avg_salary,
       COUNT(*)                                  AS data_points
     FROM salary_datapoints
     WHERE job_card_id=$1 AND time >= now() - ($2 || ' months')::INTERVAL
     GROUP BY 1
     ORDER BY 1`,
    [jobCardId, months],
  );
  return rows;
}

/** Compare salary across job cards (for compare feature). */
export async function compareSalary(jobCardIds) {
  if (!jobCardIds?.length) throw AppError.badRequest('Provide job card IDs');
  const ph = jobCardIds.map((_, i) => `$${i+1}`).join(',');
  const { rows } = await q(
    `SELECT jc.id,jc.title,jc.slug,
            ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY sd.salary_inr)) AS median_inr,
            ROUND(AVG(sd.salary_inr))                                          AS mean_inr,
            COUNT(sd.*)                                                         AS samples
     FROM job_cards jc
     LEFT JOIN salary_datapoints sd ON sd.job_card_id=jc.id
       AND sd.time >= now() - INTERVAL '2 years'
     WHERE jc.id IN (${ph})
     GROUP BY jc.id`,
    jobCardIds,
  );
  return rows;
}

/** Insert a crowdsourced salary data point. */
export async function submitSalaryPoint(data) {
  await q(
    `INSERT INTO salary_datapoints
       (job_card_id,discipline_id,job_title,country,state,city,employer_type,
        experience_years,education,salary_inr,salary_usd,source,profile_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [data.job_card_id,data.discipline_id||null,data.job_title,
     data.country||'India',data.state||null,data.city||null,
     data.employer_type||null,data.experience_years||null,data.education||null,
     data.salary_inr,data.salary_usd||null,data.source||'user_profile',data.profile_id||null],
  );
  await cacheDel(`sal:pct:${data.job_card_id}:${data.country||'India'}`);
}
