/**
 * Background jobs — no-op stubs for in-memory / portfolio deployment.
 */
import { logger } from '../utils/logger.js';

export function startJobs() {
  logger.info('Background jobs skipped (in-memory mode)');
}
