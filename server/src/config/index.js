/**
 * config/index.js — KnowWork
 * Portfolio deployment: all external DB config is optional (in-memory store is used).
 */
import 'dotenv/config';

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function opt(key, fallback) {
  return process.env[key] ?? fallback;
}

export const config = {
  // ── Server ────────────────────────────────────────────────────────────────
  env:    opt('NODE_ENV', 'development'),
  port:   parseInt(opt('PORT', '4000')),
  isDev:  opt('NODE_ENV', 'development') === 'development',
  isProd: opt('NODE_ENV', 'development') === 'production',
  apiVersion: opt('API_VERSION', 'v1'),
  corsOrigins: opt('CORS_ORIGINS', 'http://localhost:3000').split(','),

  // ── PostgreSQL ─────────────────────────────────────────────────────────────
  pg: {
    host:     opt('PG_HOST', 'localhost'),
    port:     parseInt(opt('PG_PORT', '5432')),
    database: opt('PG_DB', 'knowwork'),
    user:     opt('PG_USER', 'knowwork'),
    password: opt('PG_PASSWORD', 'secret'),
    min:      parseInt(opt('PG_POOL_MIN', '2')),
    max:      parseInt(opt('PG_POOL_MAX', '20')),
    ssl:      opt('PG_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
    statement_timeout: parseInt(opt('PG_STATEMENT_TIMEOUT', '30000')),
  },

  // ── MongoDB ────────────────────────────────────────────────────────────────
  mongo: {
    uri:      opt('MONGO_URI', 'mongodb://localhost:27017/knowwork'),
    poolSize: parseInt(opt('MONGO_POOL_SIZE', '10')),
  },

  // ── Redis ──────────────────────────────────────────────────────────────────
  redis: {
    host:     opt('REDIS_HOST', 'localhost'),
    port:     parseInt(opt('REDIS_PORT', '6379')),
    password: opt('REDIS_PASSWORD', '') || undefined,
    db:       parseInt(opt('REDIS_DB', '0')),
    ttl: {
      default:    parseInt(opt('REDIS_TTL_DEFAULT', '300')),
      session:    parseInt(opt('REDIS_TTL_SESSION', '604800')),
      jobCard:    parseInt(opt('REDIS_TTL_JOB_CARD', '3600')),
      trajectory: parseInt(opt('REDIS_TTL_TRAJECTORY', '1800')),
      salary:     parseInt(opt('REDIS_TTL_SALARY', '3600')),
      feed:       parseInt(opt('REDIS_TTL_FEED', '120')),
    },
  },

  // ── Elasticsearch ──────────────────────────────────────────────────────────
  elastic: {
    node:     opt('ES_NODE', 'http://localhost:9200'),
    username: opt('ES_USERNAME', ''),
    password: opt('ES_PASSWORD', ''),
    indexes: {
      jobCards:  opt('ES_INDEX_JOB_CARDS', 'job_cards'),
      profiles:  opt('ES_INDEX_PROFILES', 'profiles'),
      content:   opt('ES_INDEX_CONTENT', 'creator_content'),
      posts:     opt('ES_INDEX_POSTS', 'community_posts'),
    },
  },

  // ── JWT ────────────────────────────────────────────────────────────────────
  jwt: {
    secret:          opt('JWT_SECRET', 'dev-secret-change-in-production'),
    expiresIn:       opt('JWT_EXPIRES_IN', '7d'),
    refreshExpiresIn: opt('JWT_REFRESH_EXPIRES_IN', '30d'),
  },

  // ── Rate limits ────────────────────────────────────────────────────────────
  rateLimit: {
    windowMs:   parseInt(opt('RATE_LIMIT_WINDOW_MS', '60000')),
    max:        parseInt(opt('RATE_LIMIT_MAX', '100')),
    authMax:    parseInt(opt('RATE_LIMIT_AUTH_MAX', '10')),
    uploadMax:  parseInt(opt('RATE_LIMIT_UPLOAD_MAX', '20')),
  },

  // ── Cron ──────────────────────────────────────────────────────────────────
  cron: {
    counterFlush:    opt('CRON_COUNTER_FLUSH', '*/5 * * * *'),
    feedRebuild:     opt('CRON_FEED_REBUILD', '*/15 * * * *'),
    trendingRebuild: opt('CRON_TRENDING_REBUILD', '0 * * * *'),
    salaryAggregate: opt('CRON_SALARY_AGGREGATE', '0 2 * * *'),
  },

  // ── Uploads ────────────────────────────────────────────────────────────────
  upload: {
    maxMb:  parseInt(opt('UPLOAD_MAX_MB', '10')),
    dir:    opt('UPLOAD_DIR', './uploads'),
  },
};
