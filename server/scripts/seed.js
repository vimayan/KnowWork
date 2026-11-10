#!/usr/bin/env node
/**
 * KnowWork — Full Seed Script
 *
 * Seeds all 5 databases:
 *   PostgreSQL    — job_fields, job_cards + all sub-tables, users, profiles, mentors,
 *                   salary_index, career_nodes/edges, roadmaps, communities, employers
 *   MongoDB       — journey submissions, autosave drafts
 *   Redis         — counters, trending sorted set, mentor availability set, access grants
 *   Elasticsearch — job_cards index, profiles index
 *
 * Usage:
 *   node scripts/seed.js            (additive)
 *   node scripts/seed.js --reset    (wipes first)
 */
import 'dotenv/config';
import pg        from 'pg';
import mongoose  from 'mongoose';
import Redis     from 'ioredis';
import { Client as ES } from '@elastic/elasticsearch';
import bcrypt    from 'bcryptjs';

const pgc   = new pg.Client({ host: process.env.PG_HOST||'localhost', port: +process.env.PG_PORT||5432, database: process.env.PG_DB||'knowwork', user: process.env.PG_USER||'knowwork', password: process.env.PG_PASSWORD||'secret' });
const redis  = new Redis({ host: process.env.REDIS_HOST||'localhost', port: +process.env.REDIS_PORT||6379, lazyConnect: true });
const es     = new ES({ node: process.env.ES_NODE||'http://localhost:9200' });

const q = (sql, p) => pgc.query(sql, p);
const hsh = pw => bcrypt.hash(pw, 10);
const log = (...a) => console.log(...a);

// ── Sample data ────────────────────────────────────────────────────────────
const FIELDS = [
  { name: 'Web Development',       category: 'Technology',    discipline: 'Software Engineering',  industry: 'IT Services',       icon: '🌐' },
  { name: 'Mobile App Development',category: 'Technology',    discipline: 'Software Engineering',  industry: 'IT Services',       icon: '📱' },
  { name: 'UI/UX Design',          category: 'Design',        discipline: 'HCI',                   industry: 'Product Design',    icon: '🎨' },
  { name: 'Mould Design',          category: 'Manufacturing', discipline: 'Mechanical Engineering', industry: 'Plastics & Rubber', icon: '🔩' },
  { name: 'Tool Making',           category: 'Manufacturing', discipline: 'Precision Engineering',  industry: 'Automotive',        icon: '🔧' },
  { name: 'SPM Design',            category: 'Manufacturing', discipline: 'Mechanical Engineering', industry: 'Capital Goods',     icon: '⚙️' },
  { name: 'Data Science',          category: 'Data',          discipline: 'Analytics',              industry: 'Cross-sector',      icon: '📊' },
  { name: 'Cybersecurity',         category: 'Technology',    discipline: 'Information Security',   industry: 'IT Services',       icon: '🔐' },
  { name: 'Digital Marketing',     category: 'Marketing',     discipline: 'Growth',                 industry: 'Cross-sector',      icon: '📣' },
  { name: 'Civil Engineering',     category: 'Infrastructure',discipline: 'Structural',             industry: 'Construction',      icon: '🏗️' },
];

const USERS = [
  { email: 'admin@knowwork.com',  name: 'Admin',          password: 'password',    role: 'admin' },
  { email: 'ravi@example.com',       name: 'Ravi Kumar',     password: 'Password1!',  role: 'mentor' },
  { email: 'priya@example.com',      name: 'Priya Mehta',    password: 'Password1!',  role: 'mentor' },
  { email: 'arun@example.com',       name: 'Arun Sharma',    password: 'Password1!',  role: 'mentor' },
  { email: 'suresh@example.com',     name: 'Suresh Patil',   password: 'Password1!',  role: 'mentor' },
  { email: 'deepika@example.com',    name: 'Deepika Nair',   password: 'Password1!',  role: 'user' },
  { email: 'ramesh@example.com',     name: 'Ramesh Yadav',   password: 'Password1!',  role: 'user' },
  { email: 'kavya@example.com',      name: 'Kavya Reddy',    password: 'Password1!',  role: 'user' },
  { email: 'test@example.com',       name: 'Test User',      password: 'TestPass1!',  role: 'user' },
];

const JOB_CARDS_DATA = [
  {
    slug: 'web-developer', title: 'Web Developer', field: 'Web Development',
    alternate_titles: ['Frontend Developer','Full Stack Developer','UI Developer'],
    summary: 'Web developers design, build, and maintain websites and web applications across the entire stack.',
    what_you_do: 'Write code in JavaScript/TypeScript, collaborate in Figma, review PRs, fix bugs, integrate APIs, and deploy to cloud.',
    social_grade: 'B', industry_grade: 'core', is_remote_possible: true, is_freelance_viable: true,
    featured: true, views: 48200, saves: 3100,
    details: {
      india_market_share_pct: 8.4, global_market_share_pct: 5.2,
      india_demand_trend: 'growing', global_demand_trend: 'growing',
      year_of_origin: 1991, india_adoption_year: 1998,
      work_setting: 'hybrid', physical_demand: 'low', cognitive_demand: 'high',
      social_interaction: 'small-team', travel_required: false, typical_hours_per_week: 45,
      avg_time_to_first_job_months: 6, typical_career_span_years: 35,
      automation_risk: 'medium', competition_level: 'high', success_probability_pct: 72.5,
      advantages: ['High demand globally','Remote-friendly','Good pay growth','Freelance market'],
      disadvantages: ['Framework fatigue','Rapid tech churn','Sedentary work'],
      positions: [
        { level: 'intern',    title: 'Web Dev Intern',          avg_exp_years: 0 },
        { level: 'junior',    title: 'Junior Web Developer',    avg_exp_years: 1 },
        { level: 'mid',       title: 'Web Developer',           avg_exp_years: 3 },
        { level: 'senior',    title: 'Senior Web Developer',    avg_exp_years: 6 },
        { level: 'lead',      title: 'Tech Lead',               avg_exp_years: 10 },
        { level: 'principal', title: 'Principal Engineer / CTO', avg_exp_years: 15 },
      ],
    },
    skills: [
      { skill_name: 'HTML & CSS',   importance: 10, is_core: true,  learn_time_weeks: 4 },
      { skill_name: 'JavaScript',   importance: 10, is_core: true,  learn_time_weeks: 12 },
      { skill_name: 'React',        importance: 9,  is_core: true,  learn_time_weeks: 10 },
      { skill_name: 'Node.js',      importance: 7,  is_core: false, learn_time_weeks: 8 },
      { skill_name: 'Git',          importance: 9,  is_core: true,  learn_time_weeks: 2 },
      { skill_name: 'SQL',          importance: 7,  is_core: false, learn_time_weeks: 6 },
      { skill_name: 'TypeScript',   importance: 7,  is_core: false, learn_time_weeks: 4 },
    ],
    salary_bands: [
      { zone: 'metro', employer: 'msme', exp_min: 0, exp_max: 2, sal_min: 240000, sal_max: 480000,  sal_med: 350000, comp: 6, demand: 8 },
      { zone: 'metro', employer: 'mnc',  exp_min: 0, exp_max: 2, sal_min: 500000, sal_max: 1200000, sal_med: 750000, comp: 8, demand: 8 },
      { zone: 'metro', employer: 'mnc',  exp_min: 3, exp_max: 5, sal_min: 900000, sal_max: 2200000, sal_med: 1400000, comp: 8, demand: 9 },
      { zone: 'tier2', employer: 'msme', exp_min: 0, exp_max: 2, sal_min: 180000, sal_max: 360000,  sal_med: 260000, comp: 4, demand: 5 },
    ],
  },
  {
    slug: 'mould-designer', title: 'Mould Designer', field: 'Mould Design',
    alternate_titles: ['Tool Design Engineer','Die Design Engineer','Plastic Mould Designer'],
    summary: 'Mould designers create precision 3D CAD models for injection moulds used to mass-produce plastic and metal parts.',
    what_you_do: 'Design mould cavities, runners, gates, cooling channels in CAD. Run mould flow simulations. Liaise with toolroom and QA.',
    social_grade: 'C', industry_grade: 'core', is_field_work: true, featured: true, views: 18400, saves: 1200,
    details: {
      india_market_share_pct: 1.2, global_market_share_pct: 0.8,
      india_demand_trend: 'stable', global_demand_trend: 'stable',
      year_of_origin: 1851, india_adoption_year: 1940,
      work_setting: 'office', physical_demand: 'low', cognitive_demand: 'high',
      social_interaction: 'small-team', travel_required: true, typical_hours_per_week: 48,
      avg_time_to_first_job_months: 3, typical_career_span_years: 30,
      automation_risk: 'low', competition_level: 'low', success_probability_pct: 88.0,
      advantages: ['Low competition','Stable demand','High job security'],
      disadvantages: ['No remote work','Slow salary in MSME','Limited mobility'],
      positions: [
        { level: 'junior',    title: 'Junior Mould Design Engineer', avg_exp_years: 0 },
        { level: 'mid',       title: 'Mould Design Engineer',        avg_exp_years: 3 },
        { level: 'senior',    title: 'Senior Mould Design Engineer', avg_exp_years: 7 },
        { level: 'lead',      title: 'Lead Design Engineer',         avg_exp_years: 12 },
        { level: 'principal', title: 'Technical Director',           avg_exp_years: 18 },
      ],
    },
    skills: [
      { skill_name: 'SolidWorks',  importance: 10, is_core: true,  learn_time_weeks: 16 },
      { skill_name: 'AutoCAD 2D',  importance: 9,  is_core: true,  learn_time_weeks: 8 },
      { skill_name: 'GD&T',        importance: 9,  is_core: true,  learn_time_weeks: 6 },
      { skill_name: 'Moldflow',    importance: 7,  is_core: false, learn_time_weeks: 12 },
    ],
    salary_bands: [
      { zone: 'metro', employer: 'msme', exp_min: 0, exp_max: 2, sal_min: 200000, sal_max: 400000, sal_med: 280000, comp: 3, demand: 6 },
      { zone: 'metro', employer: 'mnc',  exp_min: 3, exp_max: 5, sal_min: 450000, sal_max: 900000, sal_med: 650000, comp: 5, demand: 6 },
      { zone: 'tier2', employer: 'msme', exp_min: 0, exp_max: 2, sal_min: 150000, sal_max: 300000, sal_med: 210000, comp: 2, demand: 5 },
    ],
  },
  {
    slug: 'spm-designer', title: 'SPM Design Engineer', field: 'SPM Design',
    alternate_titles: ['Special Purpose Machine Designer','Custom Machine Engineer','Automation Design Engineer'],
    summary: 'SPM designers engineer bespoke automated machines for single manufacturing operations — every project is unique.',
    what_you_do: 'Conceptualise machine layout, select pneumatic/hydraulic components, detail in CAD, coordinate fabrication, commission at customer site.',
    social_grade: 'B', industry_grade: 'emerging', is_field_work: true, featured: true, views: 12600, saves: 780,
    details: {
      india_market_share_pct: 0.3, global_market_share_pct: 0.2,
      india_demand_trend: 'growing', global_demand_trend: 'growing',
      year_of_origin: 1920, india_adoption_year: 1960,
      work_setting: 'office', physical_demand: 'medium', cognitive_demand: 'very_high',
      social_interaction: 'small-team', travel_required: true, typical_hours_per_week: 50,
      automation_risk: 'low', competition_level: 'very_low', success_probability_pct: 90.0,
      advantages: ['Every project different','Very low competition','High creative satisfaction'],
      disadvantages: ['Customer site travel','Long project cycles','MSME salary ceiling'],
      positions: [
        { level: 'junior',    title: 'Junior SPM Design Engineer',  avg_exp_years: 0 },
        { level: 'mid',       title: 'SPM Design Engineer',         avg_exp_years: 3 },
        { level: 'senior',    title: 'Senior SPM Design Engineer',  avg_exp_years: 7 },
        { level: 'lead',      title: 'Chief Design Engineer',       avg_exp_years: 12 },
      ],
    },
    skills: [
      { skill_name: 'SolidWorks',           importance: 10, is_core: true },
      { skill_name: 'Pneumatics',           importance: 10, is_core: true, learn_time_weeks: 8 },
      { skill_name: 'Jig & Fixture Design', importance: 9,  is_core: true },
      { skill_name: 'Cost Estimation',      importance: 8,  is_core: true },
    ],
    salary_bands: [
      { zone: 'metro', employer: 'msme', exp_min: 0, exp_max: 2, sal_min: 280000, sal_max: 500000, sal_med: 380000, comp: 2, demand: 7 },
      { zone: 'metro', employer: 'mnc',  exp_min: 3, exp_max: 5, sal_min: 600000, sal_max: 1200000, sal_med: 850000, comp: 4, demand: 7 },
    ],
  },
];

const PROFILES_DATA = [
  {
    userEmail: 'ravi@example.com', jobSlug: 'web-developer',
    display_name: 'Ravi Kumar', headline: 'Senior Full Stack Dev @ Infosys | 9yr | Pune',
    bio: 'Shipped 40+ production features. Love React, PostgreSQL, clean architecture.',
    city: 'Pune', state: 'Maharashtra', country: 'India',
    current_title: 'Senior Software Engineer', current_company: 'Infosys',
    employer_type: 'mnc', years_experience: 9, current_salary_inr: 1800000,
    highest_education: 'B.Tech CSE', graduation_year: 2015,
    is_verified: true, status: 'open_to_mentor',
  },
  {
    userEmail: 'priya@example.com', jobSlug: 'mould-designer',
    display_name: 'Priya Mehta', headline: 'Lead Mould Design Engineer | 12yr | Pune | Automotive',
    bio: 'Designed 200+ injection moulds. Expert in SolidWorks and Moldflow.',
    city: 'Pune', state: 'Maharashtra', country: 'India',
    current_title: 'Lead Mould Design Engineer', current_company: 'Bharat Forge',
    employer_type: 'mnc', years_experience: 12, current_salary_inr: 950000,
    highest_education: 'Diploma Mechanical Engineering', graduation_year: 2012,
    is_verified: true, status: 'open_to_mentor',
  },
  {
    userEmail: 'arun@example.com', jobSlug: 'spm-designer',
    display_name: 'Arun Sharma', headline: 'Chief SPM Design Engineer | 15yr | Pune | Automation',
    bio: 'Designed 60+ special purpose machines. Every project is a puzzle I love to solve.',
    city: 'Pune', state: 'Maharashtra', country: 'India',
    current_title: 'Chief Design Engineer', current_company: 'Electronica Machine Tools',
    employer_type: 'msme', years_experience: 15, current_salary_inr: 1200000,
    highest_education: 'B.Tech Mechanical Engineering', graduation_year: 2009,
    is_verified: true, status: 'open_to_mentor',
  },
];

// ══════════════════════════════════════════════════════════════════════════
async function seed() {
  const reset = process.argv.includes('--reset');
  await pgc.connect(); log('✓ PostgreSQL');

  await mongoose.connect(process.env.MONGO_URI||'mongodb://localhost:27017/knowwork', { serverSelectionTimeoutMS: 3000 })
    .then(() => log('✓ MongoDB')).catch(e => log('⚠ MongoDB skipped:', e.message));

  await redis.connect().then(() => log('✓ Redis')).catch(e => log('⚠ Redis skipped:', e.message));

  let esOk = true;
  await es.info().catch(() => { esOk = false; log('⚠ Elasticsearch skipped'); });

  if (reset) {
    log('\nResetting...');
    await pgc.query(`TRUNCATE session_reviews,mentor_sessions,mentor_expertise,mentors,
      employer_reviews,job_employers,user_feed_items,user_subscriptions,user_saved_jobs,
      creator_courses,creator_content,creator_profiles,study_rooms,community_events,
      community_members,community_posts,communities,profile_learning_path,profile_work_history,
      profile_skills,profiles,success_stories,user_personal_agenda,roadmap_resources,
      roadmap_steps,roadmaps,survival_paths,social_obstacles,failure_maps,daily_life_scenarios,
      industry_society_links,salary_datapoints,salary_index,institute_job_links,institutes,
      subject_skill_map,job_education_links,outcome_probabilities,trajectory_scenarios,
      career_edges,career_nodes,job_problems,job_market_history,job_work_env,job_skills,
      job_details,job_cards,job_disciplines,job_fields,users RESTART IDENTITY CASCADE`
    ).catch(e => log('Truncate partial:', e.message));
    if (mongoose.connection.readyState===1) await mongoose.connection.dropDatabase();
    if (redis.status==='ready') await redis.flushdb();
    if (esOk) {
      await es.indices.delete({ index: 'job_cards', ignore_unavailable: true }).catch(()=>{});
      await es.indices.delete({ index: 'profiles',  ignore_unavailable: true }).catch(()=>{});
    }
    log('Reset done.\n');
  }

  // ── job_fields ───────────────────────────────────────────────────────────
  const fieldIds = {};
  for (const f of FIELDS) {
    const { rows } = await q(
      `INSERT INTO job_fields (name,category,discipline,industry,icon) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (name) DO UPDATE SET icon=EXCLUDED.icon RETURNING id,name`,
      [f.name,f.category,f.discipline,f.industry,f.icon]
    );
    fieldIds[rows[0].name] = rows[0].id;
  }
  log(`✓ ${FIELDS.length} job_fields`);

  // ── job_cards + sub-tables ────────────────────────────────────────────────
  const cardIds = {};
  for (const jc of JOB_CARDS_DATA) {
    const fid = fieldIds[jc.field];
    const { rows: cr } = await q(
      `INSERT INTO job_cards (slug,title,alternate_titles,field_id,summary,what_you_do,social_grade,industry_grade,
         is_remote_possible,is_field_work,is_freelance_viable,featured,views,saves)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title RETURNING id`,
      [jc.slug,jc.title,jc.alternate_titles||[],fid,jc.summary,jc.what_you_do,
       jc.social_grade||'B',jc.industry_grade||'core',jc.is_remote_possible||false,
       jc.is_field_work||false,jc.is_freelance_viable!==false,jc.featured||false,
       jc.views||0,jc.saves||0]
    );
    const cid = cr[0].id;
    cardIds[jc.slug] = cid;

    const d = jc.details;
    await q(
      `INSERT INTO job_details (job_card_id,india_market_share_pct,global_market_share_pct,
         india_demand_trend,global_demand_trend,year_of_origin,india_adoption_year,
         work_setting,physical_demand,cognitive_demand,social_interaction,travel_required,
         typical_hours_per_week,avg_time_to_first_job_months,typical_career_span_years,
         automation_risk,competition_level,success_probability_pct,advantages,disadvantages,positions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       ON CONFLICT (job_card_id) DO NOTHING`,
      [cid,d.india_market_share_pct||null,d.global_market_share_pct||null,
       d.india_demand_trend||null,d.global_demand_trend||null,d.year_of_origin||null,d.india_adoption_year||null,
       d.work_setting||null,d.physical_demand||null,d.cognitive_demand||null,d.social_interaction||null,
       d.travel_required||false,d.typical_hours_per_week||null,d.avg_time_to_first_job_months||null,
       d.typical_career_span_years||null,d.automation_risk||'medium',d.competition_level||'medium',
       d.success_probability_pct||null,d.advantages||[],d.disadvantages||[],JSON.stringify(d.positions||[])]
    );

    await q(`INSERT INTO job_work_env (job_card_id) VALUES ($1) ON CONFLICT (job_card_id) DO NOTHING`, [cid]);

    for (const s of jc.skills||[]) {
      await q(
        `INSERT INTO job_skills (job_card_id,skill_name,importance,is_core,learn_time_weeks)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (job_card_id,skill_name) DO NOTHING`,
        [cid,s.skill_name,s.importance,s.is_core||false,s.learn_time_weeks||null]
      );
    }

    for (const b of jc.salary_bands||[]) {
      await q(
        `INSERT INTO salary_index (job_card_id,availability_zone,employer_type,experience_min_yr,experience_max_yr,
           salary_min_inr,salary_max_inr,salary_median_inr,competition_score,demand_score,sample_size)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,10) ON CONFLICT DO NOTHING`,
        [cid,b.zone,b.employer,b.exp_min,b.exp_max,b.sal_min,b.sal_max,b.sal_med,b.comp,b.demand]
      );
    }
  }
  log(`✓ ${JOB_CARDS_DATA.length} job_cards + details, skills, salary_index`);

  // ── users ────────────────────────────────────────────────────────────────
  const userIds = {};
  for (const u of USERS) {
    const h = await hsh(u.password);
    const initials = u.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const { rows } = await q(
      `INSERT INTO users (email,name,avatar_initials,password_hash,role,newsletter_subscribed)
       VALUES ($1,$2,$3,$4,$5,true) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id,email`,
      [u.email,u.name,initials,h,u.role]
    );
    userIds[rows[0].email] = rows[0].id;
  }
  log(`✓ ${USERS.length} users`);

  // ── profiles ─────────────────────────────────────────────────────────────
  const profileIds = {};
  for (const p of PROFILES_DATA) {
    const uid = userIds[p.userEmail];
    const cid = cardIds[p.jobSlug];
    const initials = p.display_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const { rows } = await q(
      `INSERT INTO profiles (user_id,job_card_id,display_name,avatar_initials,headline,bio,
         city,state,country,current_title,current_company,employer_type,years_experience,
         current_salary_inr,highest_education,graduation_year,status,is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (user_id) DO UPDATE SET current_title=EXCLUDED.current_title RETURNING id`,
      [uid,cid,p.display_name,initials,p.headline,p.bio,p.city,p.state||null,p.country,
       p.current_title,p.current_company,p.employer_type,p.years_experience,p.current_salary_inr,
       p.highest_education,p.graduation_year||null,p.status,p.is_verified]
    );
    const pid = rows[0].id;
    profileIds[p.userEmail] = pid;
    await q('UPDATE users SET profile_id=$1 WHERE id=$2', [pid, uid]);

    if (p.current_salary_inr) {
      await q(
        `INSERT INTO salary_datapoints (job_card_id,job_title,country,state,city,employer_type,experience_years,education,salary_inr,source,profile_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'user_profile',$10)`,
        [cid,p.current_title,p.country,p.state||null,p.city||null,p.employer_type,p.years_experience,p.highest_education,p.current_salary_inr,pid]
      );
    }
  }
  log(`✓ ${PROFILES_DATA.length} profiles`);

  // ── mentors ──────────────────────────────────────────────────────────────
  const mentorData = [
    { email: 'ravi@example.com',   slug: 'web-developer',  title: 'Senior Software Engineer', company: 'Infosys',          rate: 800,  rating: 4.9, sessions: 142, skills: ['React','Node.js','System Design'] },
    { email: 'priya@example.com',  slug: 'mould-designer', title: 'Lead Mould Design Engineer', company: 'Bharat Forge',    rate: 600,  rating: 4.8, sessions: 78,  skills: ['SolidWorks','Moldflow','GD&T'] },
    { email: 'arun@example.com',   slug: 'spm-designer',   title: 'Chief Design Engineer',    company: 'Electronica',       rate: 700,  rating: 4.7, sessions: 56,  skills: ['SolidWorks','Pneumatics','Cost Estimation'] },
    { email: 'suresh@example.com', slug: 'web-developer',  title: 'Full Stack Developer',     company: 'Wipro',             rate: 500,  rating: 4.5, sessions: 34,  skills: ['React','Node.js','PostgreSQL'] },
  ];
  const mentorIds = {};
  for (const m of mentorData) {
    const uid = userIds[m.email];
    const pid = profileIds[m.email];
    const cid = cardIds[m.slug];
    const { rows } = await q(
      `INSERT INTO mentors (user_id,profile_id,job_card_id,title,company,hourly_rate_inr,rating,total_sessions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (user_id) DO UPDATE SET rating=EXCLUDED.rating RETURNING id`,
      [uid,pid||null,cid||null,m.title,m.company,m.rate,m.rating,m.sessions]
    );
    const mid = rows[0].id;
    mentorIds[m.email] = mid;
    for (const skill of m.skills) {
      await q('INSERT INTO mentor_expertise (mentor_id,skill) VALUES ($1,$2) ON CONFLICT DO NOTHING',[mid,skill]);
    }
  }
  log(`✓ ${mentorData.length} mentors`);

  // ── community ────────────────────────────────────────────────────────────
  const webFieldId = fieldIds['Web Development'];
  if (webFieldId) {
    const { rows: comm } = await q(
      `INSERT INTO communities (job_card_id,job_field_id,name,description) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING id`,
      [cardIds['web-developer'],webFieldId,'Web Developers India','Community for web developers across India']
    );
    if (comm[0]) {
      for (const email of ['ravi@example.com','deepika@example.com','test@example.com']) {
        const uid = userIds[email];
        if (uid) await q('INSERT INTO community_members (community_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[comm[0].id,uid]);
      }
    }
  }
  log('✓ communities seeded');

  // ── MongoDB journeys ──────────────────────────────────────────────────────
  if (mongoose.connection.readyState===1) {
    const jSchema = new mongoose.Schema({
      pg_user_id:String, pg_job_card_id:String, submitter_name:String,
      current_title:String, country:String, city:String, education:String,
      salary:String, status:String, steps:mongoose.Schema.Types.Mixed,
      key_learnings:[String], mistakes_made:[String], advice_to_self:String,
    },{ timestamps:true });
    const Journey = mongoose.models.Journey||mongoose.model('Journey',jSchema);
    await Journey.findOneAndUpdate(
      { submitter_name:'Sandeep Thorat' },
      {
        pg_user_id: userIds['test@example.com'],
        pg_job_card_id: cardIds['web-developer'],
        submitter_name:'Sandeep Thorat', current_title:'Frontend Developer',
        country:'India', city:'Aurangabad', education:'B.Sc Computer Science',
        salary:'₹7.2 LPA', status:'published',
        steps:[
          { position:1, title:'B.Sc CS — no campus placements', duration:'3 years', description:'Rural college, downloaded YouTube tutorials.', skills:['HTML','CSS'] },
          { position:2, title:'Moved to Pune — CDAC web dev course', duration:'6 months', description:'₹40k savings. Intensive training.', skills:['React','Node.js'] },
          { position:3, title:'First internship ₹8k/month', duration:'3 months', description:'Learnt Git, Jira, real codebase.', skills:['React','Git'] },
          { position:4, title:'Frontend Developer ₹7.2 LPA', duration:'current', description:'Remote-friendly Aurangabad startup.', skills:['React','TypeScript'] },
        ],
        key_learnings:['Move to a city if your college has no placements','Build real projects, not tutorials'],
        mistakes_made:['Spent 6 months on theory without building anything'],
        advice_to_self:'Start building from day 1. Ship something ugly early.',
      },
      { upsert:true }
    );
    log('✓ MongoDB journey seeded');
  }

  // ── Redis ─────────────────────────────────────────────────────────────────
  if (redis.status==='ready') {
    const pipe = redis.pipeline();
    for (const [slug, cid] of Object.entries(cardIds)) {
      const jc = JOB_CARDS_DATA.find(j=>j.slug===slug);
      if (jc) {
        pipe.set(`job:views:${cid}`, jc.views||0);
        pipe.set(`job:saves:${cid}`, jc.saves||0);
        pipe.zadd('trending:job_cards', (jc.views||0)+(jc.saves||0)*3, cid);
      }
    }
    for (const [email, mid] of Object.entries(mentorIds)) {
      pipe.sadd('mentors:available', mid);
    }
    // Grant free areas for test user
    const testUid = userIds['test@example.com'];
    if (testUid) {
      for (const fid of Object.values(fieldIds).slice(0,5)) {
        pipe.setex(`access:${testUid}:${fid}`, 2592000, '1');
      }
    }
    await pipe.exec();
    log('✓ Redis counters, trending, access grants');
  }

  // ── Elasticsearch ─────────────────────────────────────────────────────────
  if (esOk) {
    for (const idx of ['job_cards','profiles']) {
      const exists = await es.indices.exists({index:idx}).catch(()=>false);
      if (!exists) await es.indices.create({index:idx}).catch(()=>{});
    }
    for (const jc of JOB_CARDS_DATA) {
      const cid = cardIds[jc.slug];
      if (!cid) continue;
      await es.index({ index:'job_cards', id:cid, document:{
        id:cid, slug:jc.slug, title:jc.title, alternate_titles:jc.alternate_titles||[],
        category:FIELDS.find(f=>f.name===jc.field)?.category, summary:jc.summary,
        is_remote_possible:jc.is_remote_possible||false, featured:jc.featured||false,
        views:jc.views||0, india_demand_trend:jc.details?.india_demand_trend,
        skills:jc.skills?.map(s=>s.skill_name)||[],
      }}).catch(()=>{});
    }
    for (const p of PROFILES_DATA) {
      const pid = profileIds[p.userEmail];
      if (!pid) continue;
      await es.index({ index:'profiles', id:pid, document:{
        id:pid, display_name:p.display_name, headline:p.headline, bio:p.bio,
        job_card_id:cardIds[p.jobSlug], current_title:p.current_title,
        current_company:p.current_company, employer_type:p.employer_type,
        city:p.city, country:p.country, is_verified:p.is_verified, years_experience:p.years_experience,
      }}).catch(()=>{});
    }
    await es.indices.refresh({ index:['job_cards','profiles'] }).catch(()=>{});
    log(`✓ Elasticsearch indexed`);
  }

  log('\n✅ Seed complete!\n');
  log('Credentials:');
  log('  Admin:  admin@knowwork.com  / password');
  log('  Mentor: ravi@example.com       / Password1!  (Web Dev)');
  log('  Mentor: priya@example.com      / Password1!  (Mould Design)');
  log('  User:   deepika@example.com    / Password1!');
  log('  Test:   test@example.com       / TestPass1!');
  log('');

  await pgc.end();
  if (mongoose.connection.readyState===1) await mongoose.disconnect();
  if (redis.status==='ready') await redis.quit();
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err.message, err.stack); process.exit(1); });
