import rateLimit      from 'express-rate-limit';
import jwt            from 'jsonwebtoken';
import multer         from 'multer';
import path           from 'path';
import { validationResult } from 'express-validator';
import { config }     from '../config/index.js';
import { logger }     from '../utils/logger.js';
import { AppError }   from '../utils/response.js';
import { sessionGet, hasFieldAccess } from '../db/redis.js';
import { q }          from '../db/postgres.js';

// ════════════════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ════════════════════════════════════════════════════════════════════════════

/** Map library errors → HTTP status + code. Terminal error handler. */
export function errorHandler(err, req, res, next) {
  let { statusCode = 500, message, code = 'INTERNAL_ERROR', isOperational } = err;

  // PostgreSQL errors
  if (err.code === '23505') { statusCode = 409; code = 'DUPLICATE';    message = 'Already exists'; }
  if (err.code === '23503') { statusCode = 400; code = 'FK_VIOLATION'; message = 'Referenced resource not found'; }
  if (err.code === '23514') { statusCode = 400; code = 'CHECK_FAIL';   message = 'Value out of allowed range'; }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; code = 'INVALID_TOKEN'; message = 'Invalid token'; }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; code = 'TOKEN_EXPIRED'; message = 'Token expired'; }

  // Mongoose errors
  if (err.name === 'ValidationError')   { statusCode = 400; code = 'VALIDATION_ERROR'; }
  if (err.name === 'CastError')         { statusCode = 400; code = 'INVALID_ID'; message = 'Invalid ID format'; }

  if (statusCode === 500 && !isOperational) {
    logger.error('Unhandled server error', { err: err.message, stack: err.stack, path: req.path });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: statusCode === 500 && !isOperational ? 'Internal server error' : message,
    },
    ...(config.isDev && err.stack ? { stack: err.stack } : {}),
  });
}

export const notFound = (req, res, next) =>
  next(AppError.notFound(`${req.method} ${req.path} not found`));

// ════════════════════════════════════════════════════════════════════════════
// RATE LIMITERS
// ════════════════════════════════════════════════════════════════════════════

const limiterBase = {
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (req, res) => res.status(429).json({
    success: false,
    error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests — slow down' },
  }),
};

export const globalLimiter = rateLimit({
  ...limiterBase,
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
});

export const authLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  max:      config.rateLimit.authMax,
  message:  { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many auth attempts' } },
});

export const uploadLimiter = rateLimit({
  ...limiterBase,
  windowMs: 60 * 1000,
  max:      config.rateLimit.uploadMax,
});

// ════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ════════════════════════════════════════════════════════════════════════════

/** Hard auth — rejects request if no valid token. */
export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw AppError.unauthorized('No token provided');

    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwt.secret);

    // Check Redis session for instant revocation in production
    if (config.isProd) {
      const session = await sessionGet(token).catch(() => null);
      if (!session) throw AppError.unauthorized('Session expired or revoked');
    }

    req.user  = payload;
    req.token = token;
    next();
  } catch (err) {
    next(err.isOperational ? err : AppError.unauthorized(err.message));
  }
}

/** Soft auth — attaches user if token present, continues otherwise. */
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      req.user  = jwt.verify(header.slice(7), config.jwt.secret);
      req.token = header.slice(7);
    }
  } catch {}
  next();
}

/** Role guard — call after authenticate(). */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user)               return next(AppError.unauthorized());
  if (!roles.includes(req.user.role)) return next(AppError.forbidden(`Requires role: ${roles.join(' or ')}`));
  next();
};

// ════════════════════════════════════════════════════════════════════════════
// ACCESS CONTROL  (free tier vs paid fields)
// ════════════════════════════════════════════════════════════════════════════

/**
 * requireFieldAccess(paramName)
 * Checks that the authenticated user can see content for a given job field.
 * First checks Redis (fast). Falls back to PG user_subscriptions on cache miss.
 *
 * Usage: router.get('/job-cards/:fieldId/salary', authenticate, requireFieldAccess('fieldId'), handler)
 */
export const requireFieldAccess = (paramName = 'fieldId') => async (req, res, next) => {
  try {
    const fieldId = req.params[paramName] || req.query[paramName];
    if (!fieldId) return next();                               // no field → let route decide
    if (!req.user) return next(AppError.unauthorized());

    // Admin always has access
    if (req.user.role === 'admin') return next();

    // Check Redis O(1)
    const cached = await hasFieldAccess(req.user.id, fieldId);
    if (cached) return next();

    // Cache miss → check PG free_areas + subscriptions
    const { rows } = await q(
      `SELECT 1 FROM users WHERE id = $1 AND (
         $2 = ANY(free_areas_selected) OR $2 = ANY(paid_areas)
       )`,
      [req.user.id, fieldId]
    );
    if (!rows.length) {
      // Check active subscription
      const { rows: sub } = await q(
        `SELECT 1 FROM user_subscriptions WHERE user_id=$1 AND job_field_id=$2 AND is_active=true AND (expires_at IS NULL OR expires_at > now())`,
        [req.user.id, fieldId]
      );
      if (!sub.length) return next(AppError.paymentRequired('Subscribe to access this field'));
    }

    next();
  } catch (err) { next(err); }
};

// ════════════════════════════════════════════════════════════════════════════
// VALIDATION
// ════════════════════════════════════════════════════════════════════════════

/** After express-validator rules — collect errors and return 400 if any. */
export function validate(req, res, next) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    const details = errs.array().map(e => ({ field: e.path, message: e.msg }));
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } });
  }
  next();
}

// ════════════════════════════════════════════════════════════════════════════
// FILE UPLOAD  (multer)
// ════════════════════════════════════════════════════════════════════════════

const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|mp4|mov/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.upload.dir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = allowedTypes.test(path.extname(file.originalname).toLowerCase())
            && allowedTypes.test(file.mimetype);
    ok ? cb(null, true) : cb(new AppError('Unsupported file type', 400, 'INVALID_FILE_TYPE'));
  },
});

// ════════════════════════════════════════════════════════════════════════════
// REQUEST LOGGING
// ════════════════════════════════════════════════════════════════════════════

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const ms   = Date.now() - start;
    const lvl  = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[lvl](`${req.method} ${req.path} ${res.statusCode} ${ms}ms`, {
      ip: req.ip, userId: req.user?.id,
    });
  });
  next();
}

// ════════════════════════════════════════════════════════════════════════════
// SECURITY HEADERS (supplement to helmet)
// ════════════════════════════════════════════════════════════════════════════

export function securityHeaders(req, res, next) {
  res.setHeader('X-API-Version', config.apiVersion);
  res.setHeader('X-Request-Id', crypto.randomUUID?.() || Date.now().toString());
  next();
}
