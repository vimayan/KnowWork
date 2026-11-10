/**
 * KnowWork — Monolith API Server
 * Portfolio deployment: uses in-memory store in place of external databases.
 */
import { config }       from './config/index.js';
import { logger }       from './utils/logger.js';
import { connectPg }    from './db/postgres.js';
import { connectMongo } from './db/mongo.js';
import { connectRedis } from './db/redis.js';
import { connectElastic } from './db/elastic.js';
import app, { API }     from './app.js';

async function start() {
  logger.info('Starting KnowWork API...');

  await connectPg();
  await connectMongo();
  await connectRedis();
  await connectElastic();

  const server = app.listen(config.port, () => {
    logger.info(`\n🚀  KnowWork API  →  http://localhost:${config.port}${API}`);
    logger.info(`    env=${config.env}  node=${process.version}\n`);
  });

  const shutdown = signal => {
    logger.info(`${signal} → shutting down`);
    server.close(() => { logger.info('Server closed'); process.exit(0); });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', reason => logger.error('Unhandled rejection', { reason: String(reason) }));
  process.on('uncaughtException',  err    => { logger.error('Uncaught exception', { err: err.message }); process.exit(1); });
}

start().catch(err => { logger.error('Startup failed', { err: err.message }); process.exit(1); });

export default app;
