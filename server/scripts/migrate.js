#!/usr/bin/env node
/**
 * KnowWork v3 — Full PostgreSQL Migration
 * 32 tables across 15 domains.
 *
 * Usage:
 *   node scripts/migrate.js            (additive — safe to re-run)
 *   node scripts/migrate.js --reset    (drops everything first)
 */
import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({
  host:     process.env.PG_HOST     || 'localhost',
  port:     parseInt(process.env.PG_PORT) || 5432,
  database: process.env.PG_DB       || 'knowwork',
  user:     process.env.PG_USER     || 'knowwork',
  password: process.env.PG_PASSWORD || 'secret',
});

const DROP_ALL = `
  DROP TABLE IF EXISTS
    session_reviews, mentor_sessions, mentor_expertise, mentors,
    employer_reviews, job_employers,
    user_feed_items, user_subscriptions, user_saved_jobs,
    creator_courses, creator_content, creator_profiles,
    study_rooms, community_events, community_members, community_posts, communities,
    profile_learning_path, profile_work_history, profile_skills, profiles,
    success_stories,
    user_personal_agenda, roadmap_resources, roadmap_steps, roadmaps,
    survival_paths, social_obstacles, failure_maps,
    daily_life_scenarios, industry_society_links,
    salary_datapoints, salary_index,
    institute_job_links, institutes, subject_skill_map, job_education_links,
    outcome_probabilities, trajectory_scenarios, career_edges, career_nodes,
    job_problems, job_market_history, job_work_env, job_skills, job_details, job_cards,
    job_disciplines, job_fields,
    users
  CASCADE;
  DROP TYPE IF EXISTS
    employer_type, availability_zone, social_grade, industry_grade,
    session_status, risk_level, market_tier, profile_status,
    roadmap_status, subscription_tier, institute_type,
    content_type, post_type, event_type, edge_type, failure_type, item_type
  CASCADE;
`;

const MIGRATIONS = [

`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`,
`CREATE EXTENSION IF NOT EXISTS "btree_gist"`,

// ENUMs
...[
  `employer_type     AS ENUM ('msme','mnc','startup','government','ngo','freelance','self_employed')`,
  `availability_zone AS ENUM ('metro','tier1','tier2','tier3','rural','remote','global')`,
  `social_grade      AS ENUM ('A','B','C','D','E')`,
  `industry_grade    AS ENUM ('core','emerging','declining','niche','seasonal')`,
  `risk_level        AS ENUM ('very_low','low','medium','high','very_high')`,
  `market_tier       AS ENUM ('tier1','tier2','tier3','tier4','all')`,
  `session_status    AS ENUM ('pending','confirmed','in_progress','completed','cancelled','no_show')`,
  `profile_status    AS ENUM ('active','inactive','looking','open_to_mentor')`,
  `roadmap_status    AS ENUM ('draft','published','archived','under_review')`,
  `subscription_tier AS ENUM ('free','basic','pro','enterprise')`,
  `institute_type    AS ENUM ('university','polytechnic','iti','private_institute','online','government_ctr')`,
  `content_type      AS ENUM ('short','video','note','course','live_class','article')`,
  `post_type         AS ENUM ('question','answer','post','poll','announcement','resource')`,
  `event_type        AS ENUM ('masterclass','study_room','q_and_a','workshop','hackathon','career_fair')`,
  `edge_type         AS ENUM ('promotion','lateral','career_change','dropout','freelance','startup_exit')`,
  `failure_type      AS ENUM ('stagnation','dropout','displacement','burnout','skill_obsolescence','market_collapse')`,
  `item_type         AS ENUM ('post','video','short','job_card','roadmap','event','creator_profile')`,
].map(t => `DO $$ BEGIN CREATE TYPE ${t}; EXCEPTION WHEN duplicate_object THEN NULL; END $$`),

// ── TAXONOMY ──────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS job_fields (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) UNIQUE NOT NULL,
  category        VARCHAR(80) NOT NULL,
  discipline      VARCHAR(80),
  industry        VARCHAR(80),
  parent_field_id UUID REFERENCES job_fields(id),
  icon            VARCHAR(10),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS job_disciplines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id   UUID NOT NULL,
  name          VARCHAR(120) NOT NULL,
  slug          VARCHAR(120) UNIQUE NOT NULL,
  description   TEXT,
  tools_specific TEXT[],
  skill_delta   TEXT[],
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

// ── JOB CARDS ─────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS job_cards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                VARCHAR(120) UNIQUE NOT NULL,
  title               VARCHAR(120) NOT NULL,
  alternate_titles    TEXT[],
  field_id            UUID NOT NULL REFERENCES job_fields(id),
  summary             TEXT,
  what_you_do         TEXT,
  social_grade        social_grade NOT NULL DEFAULT 'B',
  industry_grade      industry_grade NOT NULL DEFAULT 'core',
  is_remote_possible  BOOLEAN NOT NULL DEFAULT false,
  is_field_work       BOOLEAN NOT NULL DEFAULT false,
  is_shift_based      BOOLEAN NOT NULL DEFAULT false,
  is_freelance_viable BOOLEAN NOT NULL DEFAULT true,
  featured            BOOLEAN NOT NULL DEFAULT false,
  published           BOOLEAN NOT NULL DEFAULT true,
  views               INTEGER NOT NULL DEFAULT 0,
  saves               INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`ALTER TABLE job_disciplines ADD CONSTRAINT fk_disc_card
 FOREIGN KEY (job_card_id) REFERENCES job_cards(id) ON DELETE CASCADE`,

`CREATE TABLE IF NOT EXISTS job_details (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id                  UUID UNIQUE NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  responsibilities             TEXT[],
  daily_tasks                  TEXT[],
  deliverables                 TEXT[],
  tasks_by_tier                JSONB,
  work_setting                 VARCHAR(40),
  physical_demand              VARCHAR(20),
  cognitive_demand             VARCHAR(20),
  creativity_demand            VARCHAR(20),
  social_interaction           VARCHAR(30),
  travel_required              BOOLEAN NOT NULL DEFAULT false,
  typical_hours_per_week       SMALLINT,
  avg_time_to_first_job_months SMALLINT,
  typical_career_span_years    SMALLINT,
  succession_roles             TEXT[],
  lateral_move_roles           TEXT[],
  india_market_share_pct       NUMERIC(5,2),
  global_market_share_pct      NUMERIC(5,2),
  india_demand_trend           VARCHAR(20),
  global_demand_trend          VARCHAR(20),
  year_of_origin               SMALLINT,
  india_adoption_year          SMALLINT,
  job_evolution_summary        TEXT,
  automation_risk              risk_level NOT NULL DEFAULT 'medium',
  outsourcing_risk             risk_level NOT NULL DEFAULT 'medium',
  job_security                 risk_level NOT NULL DEFAULT 'medium',
  growth_potential             risk_level NOT NULL DEFAULT 'medium',
  competition_level            risk_level NOT NULL DEFAULT 'medium',
  success_probability_pct      NUMERIC(5,2),
  avg_job_search_weeks         SMALLINT,
  required_education           TEXT[],
  preferred_education          TEXT[],
  self_taught_viable           BOOLEAN NOT NULL DEFAULT false,
  bootcamp_viable              BOOLEAN NOT NULL DEFAULT false,
  education_connection         TEXT,
  advantages                   TEXT[],
  disadvantages                TEXT[],
  positions                    JSONB,
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS job_work_env (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id         UUID UNIQUE NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  team_size_typical   VARCHAR(30),
  collaboration_style VARCHAR(30),
  client_facing       BOOLEAN DEFAULT false,
  stakeholder_types   TEXT[],
  dress_code          VARCHAR(30),
  noise_level         VARCHAR(20),
  tools_used          TEXT[],
  certifications_req  TEXT[],
  health_risks        TEXT[],
  typical_perks       TEXT[],
  characteristics     JSONB
)`,

`CREATE TABLE IF NOT EXISTS job_skills (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id      UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  skill_name       VARCHAR(100) NOT NULL,
  skill_type       VARCHAR(30) NOT NULL DEFAULT 'technical'
                   CHECK (skill_type IN ('technical','soft','tool','certification','domain')),
  importance       SMALLINT NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  is_core          BOOLEAN NOT NULL DEFAULT false,
  learn_time_weeks SMALLINT,
  UNIQUE (job_card_id, skill_name)
)`,

`CREATE TABLE IF NOT EXISTS job_market_history (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id             UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  year                    SMALLINT NOT NULL CHECK (year BETWEEN 1800 AND 2100),
  context                 TEXT,
  india_jobs_est          INTEGER,
  global_jobs_est         INTEGER,
  key_event               VARCHAR(200),
  india_demand_pct_change NUMERIC(6,2),
  UNIQUE (job_card_id, year)
)`,

`CREATE TABLE IF NOT EXISTS job_problems (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id    UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  problem        TEXT NOT NULL,
  severity       risk_level NOT NULL DEFAULT 'medium',
  category       VARCHAR(60),
  mitigation     TEXT,
  real_scenarios TEXT[],
  is_featured    BOOLEAN NOT NULL DEFAULT false
)`,

// ── TRAJECTORY GRAPH ──────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS career_nodes (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id                UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  label                      VARCHAR(150) NOT NULL,
  level                      VARCHAR(30) NOT NULL,
  employer_type              employer_type,
  typical_exp_years          SMALLINT,
  salary_min_inr             INTEGER,
  salary_max_inr             INTEGER,
  reach_probability_pct      NUMERIC(5,2),
  avg_time_from_start_months SMALLINT,
  x_position                 NUMERIC,
  y_position                 NUMERIC,
  node_color                 VARCHAR(20),
  is_entry_point             BOOLEAN NOT NULL DEFAULT false,
  is_terminal                BOOLEAN NOT NULL DEFAULT false
)`,

`CREATE TABLE IF NOT EXISTS career_edges (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id               UUID NOT NULL REFERENCES career_nodes(id) ON DELETE CASCADE,
  to_node_id                 UUID NOT NULL REFERENCES career_nodes(id) ON DELETE CASCADE,
  transition_probability_pct NUMERIC(5,2) NOT NULL,
  avg_time_months            SMALLINT,
  required_skills            TEXT[],
  edge_type                  edge_type NOT NULL DEFAULT 'promotion',
  salary_delta_pct           NUMERIC(6,2),
  is_common_path             BOOLEAN NOT NULL DEFAULT false,
  notes                      TEXT
)`,

`CREATE TABLE IF NOT EXISTS trajectory_scenarios (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id               UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  name                      VARCHAR(120) NOT NULL,
  description               TEXT,
  node_sequence             UUID[],
  total_months              SMALLINT,
  final_salary_estimate_inr INTEGER,
  success_probability_pct   NUMERIC(5,2),
  trajectory_type           VARCHAR(40) NOT NULL DEFAULT 'balanced'
                            CHECK (trajectory_type IN ('fastest','balanced','academic','self_taught','lateral'))
)`,

`CREATE TABLE IF NOT EXISTS outcome_probabilities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id             UUID NOT NULL REFERENCES career_nodes(id) ON DELETE CASCADE,
  outcome_label       VARCHAR(150) NOT NULL,
  probability_pct     NUMERIC(5,2) NOT NULL,
  time_horizon_months SMALLINT,
  key_driver          TEXT,
  outcome_type        VARCHAR(40)
  CHECK (outcome_type IN ('promotion','lateral','dropout','freelance','startup','retirement','burnout'))
)`,

// ── EDUCATION ─────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS job_education_links (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id           UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  degree_name           VARCHAR(120) NOT NULL,
  stream                VARCHAR(80),
  relevance_score       SMALLINT NOT NULL DEFAULT 5 CHECK (relevance_score BETWEEN 1 AND 10),
  connection_note       TEXT,
  is_mandatory          BOOLEAN NOT NULL DEFAULT false,
  is_self_taught_viable BOOLEAN NOT NULL DEFAULT false,
  is_bootcamp_viable    BOOLEAN NOT NULL DEFAULT false
)`,

`CREATE TABLE IF NOT EXISTS subject_skill_map (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id     UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  subject_name    VARCHAR(150) NOT NULL,
  degree_stream   VARCHAR(80),
  chapters_relevant TEXT[],
  maps_to_skill   VARCHAR(100) NOT NULL,
  used_when       TEXT,
  used_where      TEXT,
  importance      SMALLINT NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10)
)`,

`CREATE TABLE IF NOT EXISTS institutes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(200) NOT NULL,
  type                  institute_type NOT NULL DEFAULT 'private_institute',
  city                  VARCHAR(80),
  state                 VARCHAR(80),
  country               VARCHAR(80) NOT NULL DEFAULT 'India',
  fields_offered        UUID[],
  skill_benchmark_score NUMERIC(4,2),
  placement_pct         NUMERIC(5,2),
  avg_fee_inr           INTEGER,
  duration_months       SMALLINT,
  website               TEXT,
  verified              BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS institute_job_links (
  institute_id            UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  job_card_id             UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  skill_coverage_score    SMALLINT CHECK (skill_coverage_score BETWEEN 1 AND 10),
  placement_count_last_yr INTEGER,
  avg_starting_salary_inr INTEGER,
  course_name             VARCHAR(150),
  PRIMARY KEY (institute_id, job_card_id)
)`,

// ── SALARY ────────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS salary_index (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id       UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  discipline_id     UUID REFERENCES job_disciplines(id),
  country           VARCHAR(80) NOT NULL DEFAULT 'India',
  state             VARCHAR(80),
  city              VARCHAR(80),
  availability_zone availability_zone NOT NULL DEFAULT 'metro',
  employer_type     employer_type NOT NULL DEFAULT 'msme',
  experience_min_yr SMALLINT NOT NULL DEFAULT 0,
  experience_max_yr SMALLINT NOT NULL DEFAULT 2,
  education_level   VARCHAR(80),
  skill_tag         VARCHAR(80),
  salary_min_inr    INTEGER NOT NULL,
  salary_max_inr    INTEGER NOT NULL,
  salary_median_inr INTEGER,
  salary_p25_inr    INTEGER,
  salary_p75_inr    INTEGER,
  salary_usd_equiv  INTEGER,
  competition_score SMALLINT CHECK (competition_score BETWEEN 1 AND 10),
  demand_score      SMALLINT CHECK (demand_score BETWEEN 1 AND 10),
  success_ratio_pct NUMERIC(5,2),
  time_to_hire_days SMALLINT,
  business_range    VARCHAR(60),
  data_source       VARCHAR(60) NOT NULL DEFAULT 'platform',
  sample_size       INTEGER NOT NULL DEFAULT 0,
  effective_from    DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to      DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS salary_datapoints (
  time             TIMESTAMPTZ NOT NULL DEFAULT now(),
  job_card_id      UUID REFERENCES job_cards(id),
  discipline_id    UUID REFERENCES job_disciplines(id),
  job_title        VARCHAR(120) NOT NULL,
  country          VARCHAR(80) NOT NULL DEFAULT 'India',
  state            VARCHAR(80),
  city             VARCHAR(80),
  employer_type    employer_type,
  experience_years SMALLINT,
  education        VARCHAR(80),
  salary_inr       INTEGER NOT NULL,
  salary_usd       INTEGER,
  source           VARCHAR(30) NOT NULL DEFAULT 'user_profile',
  profile_id       UUID,
  verified         BOOLEAN NOT NULL DEFAULT false
)`,

// ── SOCIETY ───────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS industry_society_links (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id                  UUID NOT NULL REFERENCES job_fields(id) ON DELETE CASCADE,
  society_system            VARCHAR(120) NOT NULL,
  influence_description     TEXT,
  real_world_examples       TEXT[],
  risk_if_removed           TEXT,
  interdependent_industries TEXT[]
)`,

`CREATE TABLE IF NOT EXISTS daily_life_scenarios (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id           UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  scenario_title        VARCHAR(150) NOT NULL,
  scenario_body         TEXT NOT NULL,
  people_impacted_daily INTEGER,
  impact_type           VARCHAR(20) CHECK (impact_type IN ('direct','indirect','systemic'))
)`,

// ── FAILURE MAPS ──────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS failure_maps (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id        UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  career_node_id     UUID REFERENCES career_nodes(id),
  failure_type       failure_type NOT NULL DEFAULT 'stagnation',
  description        TEXT NOT NULL,
  probability_pct    NUMERIC(5,2),
  time_lost_months   SMALLINT,
  market_years_lost  SMALLINT,
  critical_factors   TEXT[],
  recovery_path      TEXT,
  real_scenarios     TEXT[]
)`,

`CREATE TABLE IF NOT EXISTS social_obstacles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id           UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  career_node_id        UUID REFERENCES career_nodes(id),
  obstacle_type         VARCHAR(40) CHECK (obstacle_type IN ('bias','gatekeeping','network','language','credential','financial')),
  description           TEXT NOT NULL,
  severity              risk_level NOT NULL DEFAULT 'medium',
  mitigation_strategies TEXT[],
  real_accounts         TEXT[]
)`,

`CREATE TABLE IF NOT EXISTS survival_paths (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  failure_map_id          UUID NOT NULL REFERENCES failure_maps(id) ON DELETE CASCADE,
  survival_route          TEXT NOT NULL,
  time_to_recovery_months SMALLINT,
  outcome                 TEXT,
  key_lesson              TEXT,
  profile_id              UUID
)`,

// ── ROADMAPS ─────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS roadmaps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id      UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  target_node_id   UUID REFERENCES career_nodes(id),
  created_by       UUID,
  title            VARCHAR(180) NOT NULL,
  description      TEXT,
  trajectory_type  VARCHAR(40) NOT NULL DEFAULT 'balanced',
  target_audience  TEXT,
  estimated_months SMALLINT,
  difficulty       VARCHAR(20) NOT NULL DEFAULT 'medium'
                   CHECK (difficulty IN ('beginner','easy','medium','hard','expert')),
  status           roadmap_status NOT NULL DEFAULT 'published',
  is_official      BOOLEAN NOT NULL DEFAULT false,
  likes            INTEGER NOT NULL DEFAULT 0,
  views            INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS roadmap_steps (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id           UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  position             SMALLINT NOT NULL,
  phase                VARCHAR(40),
  title                VARCHAR(150) NOT NULL,
  description          TEXT,
  duration_weeks       SMALLINT,
  is_milestone         BOOLEAN NOT NULL DEFAULT false,
  skills_gained        TEXT[],
  skill_hours_required JSONB,
  UNIQUE (roadmap_id, position)
)`,

`CREATE TABLE IF NOT EXISTS roadmap_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id       UUID NOT NULL REFERENCES roadmap_steps(id) ON DELETE CASCADE,
  resource_type VARCHAR(20) NOT NULL DEFAULT 'course'
                CHECK (resource_type IN ('course','book','video','certification','project','article')),
  title         VARCHAR(200) NOT NULL,
  url           TEXT,
  provider      VARCHAR(100),
  is_free       BOOLEAN NOT NULL DEFAULT false,
  cost_inr      INTEGER,
  duration_hours SMALLINT,
  skill_covered VARCHAR(100)
)`,

// ── USERS ─────────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) UNIQUE NOT NULL,
  phone                 VARCHAR(20),
  name                  VARCHAR(100) NOT NULL,
  avatar_initials       CHAR(2),
  password_hash         TEXT NOT NULL,
  role                  VARCHAR(20) NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user','mentor','creator','admin','moderator')),
  profile_id            UUID,
  subscription_tier     subscription_tier NOT NULL DEFAULT 'free',
  free_areas_selected   UUID[],
  paid_areas            UUID[],
  free_natures_selected TEXT[],
  preferred_location    VARCHAR(80),
  interested_fields     TEXT[],
  target_job_card_id    UUID REFERENCES job_cards(id),
  newsletter_subscribed BOOLEAN NOT NULL DEFAULT false,
  email_verified        BOOLEAN NOT NULL DEFAULT false,
  last_login_at         TIMESTAMPTZ,
  login_count           INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

// ── PROFILES ──────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS profiles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  job_card_id        UUID NOT NULL REFERENCES job_cards(id),
  discipline_id      UUID REFERENCES job_disciplines(id),
  display_name       VARCHAR(100) NOT NULL,
  avatar_url         TEXT,
  avatar_initials    CHAR(2),
  headline           VARCHAR(200),
  bio                TEXT,
  country            VARCHAR(80) NOT NULL DEFAULT 'India',
  state              VARCHAR(80),
  city               VARCHAR(80),
  current_title      VARCHAR(120),
  current_company    VARCHAR(120),
  employer_type      employer_type,
  years_experience   SMALLINT,
  current_salary_inr INTEGER,
  highest_education  VARCHAR(80),
  institution        VARCHAR(150),
  graduation_year    SMALLINT,
  status             profile_status NOT NULL DEFAULT 'active',
  is_verified        BOOLEAN NOT NULL DEFAULT false,
  linkedin_url       TEXT,
  github_url         TEXT,
  portfolio_url      TEXT,
  profile_views      INTEGER NOT NULL DEFAULT 0,
  followers          INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`ALTER TABLE users ADD CONSTRAINT fk_user_profile
 FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE SET NULL`,

`CREATE TABLE IF NOT EXISTS profile_skills (
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name  VARCHAR(100) NOT NULL,
  proficiency SMALLINT NOT NULL DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  years_used  SMALLINT,
  PRIMARY KEY (profile_id, skill_name)
)`,

`CREATE TABLE IF NOT EXISTS profile_work_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position      SMALLINT NOT NULL,
  company_name  VARCHAR(150) NOT NULL,
  job_title     VARCHAR(120) NOT NULL,
  employer_type employer_type,
  city          VARCHAR(80),
  country       VARCHAR(80) NOT NULL DEFAULT 'India',
  start_year    SMALLINT NOT NULL,
  end_year      SMALLINT,
  is_current    BOOLEAN NOT NULL DEFAULT false,
  salary_inr    INTEGER,
  description   TEXT,
  skills_used   TEXT[]
)`,

`CREATE TABLE IF NOT EXISTS profile_learning_path (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position     SMALLINT NOT NULL,
  item_type    VARCHAR(30) NOT NULL
               CHECK (item_type IN ('degree','certification','course','project','internship','achievement','habit')),
  title        VARCHAR(200) NOT NULL,
  provider     VARCHAR(150),
  year_completed SMALLINT,
  duration_months SMALLINT,
  skills_gained TEXT[],
  description  TEXT,
  is_public    BOOLEAN NOT NULL DEFAULT true
)`,

`CREATE TABLE IF NOT EXISTS success_stories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID REFERENCES profiles(id),
  job_card_id       UUID REFERENCES job_cards(id),
  roadmap_id        UUID REFERENCES roadmaps(id),
  title             VARCHAR(200) NOT NULL,
  from_background   TEXT NOT NULL,
  to_role           VARCHAR(150) NOT NULL,
  quote             TEXT NOT NULL,
  full_story        TEXT,
  timeframe         VARCHAR(40),
  key_turning_points TEXT[],
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','published','rejected')),
  featured          BOOLEAN NOT NULL DEFAULT false,
  likes             INTEGER NOT NULL DEFAULT 0,
  views             INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS user_personal_agenda (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  roadmap_id       UUID NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  target_completion DATE,
  current_step_id  UUID REFERENCES roadmap_steps(id),
  week_targets     JSONB,
  hours_spent      JSONB,
  certainty_score  NUMERIC(5,2),
  last_checkin_at  TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  UNIQUE (user_id, roadmap_id)
)`,

`CREATE TABLE IF NOT EXISTS user_subscriptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_field_id  UUID NOT NULL REFERENCES job_fields(id),
  plan          VARCHAR(20) NOT NULL CHECK (plan IN ('monthly','annual','lifetime')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ,
  amount_paid_inr INTEGER,
  payment_ref   VARCHAR(100),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (user_id, job_field_id)
)`,

`CREATE TABLE IF NOT EXISTS user_saved_jobs (
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_card_id UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  saved_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, job_card_id)
)`,

`CREATE TABLE IF NOT EXISTS user_feed_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type    item_type NOT NULL,
  item_id      UUID NOT NULL,
  job_field_id UUID REFERENCES job_fields(id),
  score        NUMERIC(10,4) NOT NULL DEFAULT 0,
  is_locked    BOOLEAN NOT NULL DEFAULT false,
  shown_at     TIMESTAMPTZ,
  interacted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

// ── COMMUNITY ─────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS communities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id   UUID REFERENCES job_cards(id),
  discipline_id UUID REFERENCES job_disciplines(id),
  job_field_id  UUID REFERENCES job_fields(id),
  name          VARCHAR(120) NOT NULL,
  description   TEXT,
  member_count  INTEGER NOT NULL DEFAULT 0,
  is_public     BOOLEAN NOT NULL DEFAULT true,
  is_pro_required BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL DEFAULT 'member'
               CHECK (role IN ('member','moderator','creator','admin')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
)`,

`CREATE TABLE IF NOT EXISTS community_posts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id      UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users(id),
  post_type         post_type NOT NULL DEFAULT 'post',
  title             VARCHAR(200),
  body              TEXT NOT NULL,
  parent_id         UUID REFERENCES community_posts(id),
  upvotes           INTEGER NOT NULL DEFAULT 0,
  views             INTEGER NOT NULL DEFAULT 0,
  is_expert_answer  BOOLEAN NOT NULL DEFAULT false,
  is_accepted_answer BOOLEAN NOT NULL DEFAULT false,
  job_card_id       UUID REFERENCES job_cards(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS community_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id     UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  host_id          UUID NOT NULL REFERENCES users(id),
  event_type       event_type NOT NULL DEFAULT 'masterclass',
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  starts_at        TIMESTAMPTZ,
  duration_min     SMALLINT,
  platform         VARCHAR(40),
  meeting_link     TEXT,
  max_attendees    INTEGER,
  registered_count INTEGER NOT NULL DEFAULT 0,
  is_paid          BOOLEAN NOT NULL DEFAULT false,
  price_inr        INTEGER,
  recording_url    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS study_rooms (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id   UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name           VARCHAR(120) NOT NULL,
  roadmap_id     UUID REFERENCES roadmaps(id),
  current_step_id UUID REFERENCES roadmap_steps(id),
  max_members    SMALLINT NOT NULL DEFAULT 10,
  member_count   SMALLINT NOT NULL DEFAULT 0,
  is_open        BOOLEAN NOT NULL DEFAULT true,
  meeting_link   TEXT,
  schedule       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

// ── CREATOR ───────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS creator_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id           UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_name         VARCHAR(100) NOT NULL,
  bio_creator          TEXT,
  subscribers          INTEGER NOT NULL DEFAULT 0,
  total_content_pieces INTEGER NOT NULL DEFAULT 0,
  is_monetised         BOOLEAN NOT NULL DEFAULT false,
  revenue_share_pct    NUMERIC(4,2) NOT NULL DEFAULT 70.00,
  verified_creator     BOOLEAN NOT NULL DEFAULT false,
  speciality_job_cards UUID[],
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS creator_content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id    UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  job_card_id   UUID NOT NULL REFERENCES job_cards(id),
  discipline_id UUID REFERENCES job_disciplines(id),
  content_type  content_type NOT NULL DEFAULT 'video',
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  url           TEXT,
  thumbnail_url TEXT,
  duration_sec  INTEGER,
  views         INTEGER NOT NULL DEFAULT 0,
  likes         INTEGER NOT NULL DEFAULT 0,
  is_free       BOOLEAN NOT NULL DEFAULT true,
  price_inr     INTEGER,
  is_pro_content BOOLEAN NOT NULL DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS creator_courses (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id               UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  job_card_id              UUID NOT NULL REFERENCES job_cards(id),
  title                    VARCHAR(200) NOT NULL,
  description              TEXT,
  price_inr                INTEGER NOT NULL DEFAULT 0,
  module_count             SMALLINT,
  total_hours              NUMERIC(6,2),
  enrolment_count          INTEGER NOT NULL DEFAULT 0,
  avg_rating               NUMERIC(3,2),
  certificate_on_completion BOOLEAN NOT NULL DEFAULT false,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

// ── MENTORS ───────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS mentors (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id          UUID UNIQUE REFERENCES profiles(id),
  job_card_id         UUID REFERENCES job_cards(id),
  title               VARCHAR(120) NOT NULL,
  company             VARCHAR(120),
  employer_type       employer_type,
  bio                 TEXT,
  languages           TEXT[] NOT NULL DEFAULT ARRAY['English'],
  hourly_rate_inr     INTEGER,
  session_duration_min SMALLINT NOT NULL DEFAULT 60,
  available           BOOLEAN NOT NULL DEFAULT true,
  max_mentees         SMALLINT NOT NULL DEFAULT 5,
  current_mentees     SMALLINT NOT NULL DEFAULT 0,
  rating              NUMERIC(3,2),
  total_reviews       INTEGER NOT NULL DEFAULT 0,
  total_sessions      INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS mentor_expertise (
  mentor_id UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  skill     VARCHAR(100) NOT NULL,
  level     SMALLINT NOT NULL DEFAULT 4 CHECK (level BETWEEN 1 AND 5),
  PRIMARY KEY (mentor_id, skill)
)`,

`CREATE TABLE IF NOT EXISTS mentor_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id         UUID NOT NULL REFERENCES mentors(id),
  student_id        UUID NOT NULL REFERENCES users(id),
  scheduled_at      TIMESTAMPTZ,
  duration_min      SMALLINT NOT NULL DEFAULT 60,
  platform          VARCHAR(40) DEFAULT 'google_meet',
  meeting_link      TEXT,
  topic             VARCHAR(200),
  student_goal      TEXT,
  pre_session_note  TEXT,
  post_session_note TEXT,
  status            session_status NOT NULL DEFAULT 'pending',
  cancelled_by      UUID REFERENCES users(id),
  cancel_reason     TEXT,
  amount_inr        INTEGER,
  payment_status    VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (payment_status IN ('pending','paid','refunded','waived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

`CREATE TABLE IF NOT EXISTS session_reviews (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID UNIQUE NOT NULL REFERENCES mentor_sessions(id),
  reviewer_id        UUID NOT NULL REFERENCES users(id),
  mentor_id          UUID NOT NULL REFERENCES mentors(id),
  overall_rating     SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  clarity_rating     SMALLINT CHECK (clarity_rating BETWEEN 1 AND 5),
  knowledge_rating   SMALLINT CHECK (knowledge_rating BETWEEN 1 AND 5),
  helpfulness_rating SMALLINT CHECK (helpfulness_rating BETWEEN 1 AND 5),
  review_text        TEXT,
  would_recommend    BOOLEAN,
  is_featured        BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

// ── EMPLOYERS ─────────────────────────────────────────────────────────────
`CREATE TABLE IF NOT EXISTS job_employers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_card_id           UUID NOT NULL REFERENCES job_cards(id) ON DELETE CASCADE,
  company_name          VARCHAR(150) NOT NULL,
  employer_type         employer_type NOT NULL DEFAULT 'mnc',
  city                  VARCHAR(80),
  state                 VARCHAR(80),
  country               VARCHAR(80) NOT NULL DEFAULT 'India',
  is_remote             BOOLEAN NOT NULL DEFAULT false,
  careers_url           TEXT,
  avg_salary_inr        INTEGER,
  openings_est          INTEGER,
  avg_career_growth_pct NUMERIC(5,2),
  verified              BOOLEAN NOT NULL DEFAULT false
)`,

`CREATE TABLE IF NOT EXISTS employer_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id         UUID NOT NULL REFERENCES job_employers(id) ON DELETE CASCADE,
  reviewer_id         UUID REFERENCES profiles(id),
  overall_rating      SMALLINT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  culture_rating      SMALLINT CHECK (culture_rating BETWEEN 1 AND 5),
  growth_rating       SMALLINT CHECK (growth_rating BETWEEN 1 AND 5),
  wlb_rating          SMALLINT CHECK (wlb_rating BETWEEN 1 AND 5),
  salary_transparency SMALLINT CHECK (salary_transparency BETWEEN 1 AND 5),
  review_text         TEXT,
  interview_experience TEXT,
  is_anonymous        BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
)`,

// ── INDEXES ───────────────────────────────────────────────────────────────
`CREATE INDEX IF NOT EXISTS idx_jf_category       ON job_fields (category, is_active)`,
`CREATE INDEX IF NOT EXISTS idx_jc_field_pub       ON job_cards (field_id, published)`,
`CREATE INDEX IF NOT EXISTS idx_jc_featured        ON job_cards (featured, published) WHERE featured = true`,
`CREATE INDEX IF NOT EXISTS idx_jc_slug            ON job_cards (slug)`,
`CREATE INDEX IF NOT EXISTS idx_jc_trgm            ON job_cards USING GIN (title gin_trgm_ops)`,
`CREATE INDEX IF NOT EXISTS idx_jd_card            ON job_details (job_card_id)`,
`CREATE INDEX IF NOT EXISTS idx_jmh_year           ON job_market_history (job_card_id, year)`,
`CREATE INDEX IF NOT EXISTS idx_cn_card_level      ON career_nodes (job_card_id, level)`,
`CREATE INDEX IF NOT EXISTS idx_ce_from            ON career_edges (from_node_id, transition_probability_pct DESC)`,
`CREATE INDEX IF NOT EXISTS idx_ce_to              ON career_edges (to_node_id)`,
`CREATE INDEX IF NOT EXISTS idx_op_node            ON outcome_probabilities (node_id, probability_pct DESC)`,
`CREATE INDEX IF NOT EXISTS idx_sal_card_zone      ON salary_index (job_card_id, country, availability_zone)`,
`CREATE INDEX IF NOT EXISTS idx_sal_exp            ON salary_index (job_card_id, experience_min_yr, experience_max_yr)`,
`CREATE INDEX IF NOT EXISTS idx_sal_employer       ON salary_index (job_card_id, employer_type)`,
`CREATE INDEX IF NOT EXISTS idx_sdp_card           ON salary_datapoints (job_card_id, time DESC)`,
`CREATE INDEX IF NOT EXISTS idx_sdp_country        ON salary_datapoints (country, state, time DESC)`,
`CREATE INDEX IF NOT EXISTS idx_ssm_card           ON subject_skill_map (job_card_id, maps_to_skill)`,
`CREATE INDEX IF NOT EXISTS idx_rm_card            ON roadmaps (job_card_id, status)`,
`CREATE INDEX IF NOT EXISTS idx_rs_roadmap         ON roadmap_steps (roadmap_id, position)`,
`CREATE INDEX IF NOT EXISTS idx_fm_card            ON failure_maps (job_card_id, failure_type)`,
`CREATE INDEX IF NOT EXISTS idx_prof_card          ON profiles (job_card_id, status)`,
`CREATE INDEX IF NOT EXISTS idx_prof_loc           ON profiles (country, state, city)`,
`CREATE INDEX IF NOT EXISTS idx_prof_user          ON profiles (user_id)`,
`CREATE INDEX IF NOT EXISTS idx_plp_profile        ON profile_learning_path (profile_id, position)`,
`CREATE INDEX IF NOT EXISTS idx_pwh_profile        ON profile_work_history (profile_id, position)`,
`CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email)`,
`CREATE INDEX IF NOT EXISTS idx_ufi_user_score     ON user_feed_items (user_id, score DESC, created_at DESC)`,
`CREATE INDEX IF NOT EXISTS idx_ufi_locked         ON user_feed_items (user_id, is_locked) WHERE is_locked = true`,
`CREATE INDEX IF NOT EXISTS idx_cp_community       ON community_posts (community_id, created_at DESC)`,
`CREATE INDEX IF NOT EXISTS idx_cp_parent          ON community_posts (parent_id) WHERE parent_id IS NOT NULL`,
`CREATE INDEX IF NOT EXISTS idx_cc_creator         ON creator_content (creator_id, published_at DESC)`,
`CREATE INDEX IF NOT EXISTS idx_cc_card            ON creator_content (job_card_id, content_type)`,
`CREATE INDEX IF NOT EXISTS idx_mentors_card       ON mentors (job_card_id, available)`,
`CREATE INDEX IF NOT EXISTS idx_mentors_rating     ON mentors (rating DESC NULLS LAST, available)`,
`CREATE INDEX IF NOT EXISTS idx_ms_mentor          ON mentor_sessions (mentor_id, status, scheduled_at)`,
`CREATE INDEX IF NOT EXISTS idx_ms_student         ON mentor_sessions (student_id, status)`,
`CREATE INDEX IF NOT EXISTS idx_ms_scheduled       ON mentor_sessions (scheduled_at) WHERE status IN ('confirmed','in_progress')`,
`CREATE INDEX IF NOT EXISTS idx_sr_mentor          ON session_reviews (mentor_id, created_at DESC)`,
`CREATE INDEX IF NOT EXISTS idx_je_card            ON job_employers (job_card_id, employer_type)`,

// ── TRIGGERS ──────────────────────────────────────────────────────────────
`CREATE OR REPLACE FUNCTION set_updated_at()
 RETURNS TRIGGER LANGUAGE plpgsql AS $$
 BEGIN NEW.updated_at = now(); RETURN NEW; END; $$`,

...[
  ['job_cards','trg_jc'],['job_details','trg_jd'],['salary_index','trg_si'],
  ['roadmaps','trg_rm'],['profiles','trg_pr'],['mentors','trg_me'],
  ['mentor_sessions','trg_ms'],['users','trg_us'],['community_posts','trg_cposts'],
].map(([tbl, name]) => `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='${name}_upd') THEN
    CREATE TRIGGER ${name}_upd BEFORE UPDATE ON ${tbl}
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF; END $$`),

`CREATE OR REPLACE FUNCTION refresh_mentor_rating()
 RETURNS TRIGGER LANGUAGE plpgsql AS $$
 BEGIN
   UPDATE mentors SET
     rating        = (SELECT ROUND(AVG(overall_rating)::NUMERIC,2) FROM session_reviews WHERE mentor_id=NEW.mentor_id),
     total_reviews = (SELECT COUNT(*)                               FROM session_reviews WHERE mentor_id=NEW.mentor_id),
     total_sessions= (SELECT COUNT(*) FROM mentor_sessions WHERE mentor_id=NEW.mentor_id AND status='completed')
   WHERE id=NEW.mentor_id;
   RETURN NEW;
 END; $$`,

`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_mentor_rating') THEN
    CREATE TRIGGER trg_mentor_rating AFTER INSERT OR UPDATE ON session_reviews
    FOR EACH ROW EXECUTE FUNCTION refresh_mentor_rating();
  END IF; END $$`,

`CREATE OR REPLACE FUNCTION update_community_count()
 RETURNS TRIGGER LANGUAGE plpgsql AS $$
 BEGIN
   IF TG_OP='INSERT' THEN
     UPDATE communities SET member_count=member_count+1 WHERE id=NEW.community_id;
   ELSIF TG_OP='DELETE' THEN
     UPDATE communities SET member_count=GREATEST(0,member_count-1) WHERE id=OLD.community_id;
   END IF; RETURN NULL;
 END; $$`,

`DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_community_count') THEN
    CREATE TRIGGER trg_community_count AFTER INSERT OR DELETE ON community_members
    FOR EACH ROW EXECUTE FUNCTION update_community_count();
  END IF; END $$`,
];

async function migrate() {
  const reset = process.argv.includes('--reset');
  await client.connect();
  console.log('Connected to PostgreSQL');

  if (reset) {
    console.log('Resetting all tables...');
    await client.query(DROP_ALL).catch(e => console.warn('Partial drop:', e.message));
    console.log('Done resetting.');
  }

  let ok = 0, skip = 0;
  for (const sql of MIGRATIONS) {
    if (!sql?.trim()) continue;
    try { await client.query(sql); ok++; }
    catch (err) { console.warn(`  Skipped: ${err.message.slice(0,100)}`); skip++; }
  }

  const { rows } = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`
  );
  console.log(`\nMigration complete — ${ok} ok, ${skip} skipped`);
  console.log(`Tables (${rows.length}): ${rows.map(r=>r.tablename).join(', ')}`);
  await client.end();
}

migrate().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
