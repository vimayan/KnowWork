// ── Typed error class ─────────────────────────────────────────────────────
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(msg, code = 'BAD_REQUEST')  { return new AppError(msg, 400, code); }
  static unauthorized(msg = 'Unauthorized')       { return new AppError(msg, 401, 'UNAUTHORIZED'); }
  static forbidden(msg = 'Forbidden')             { return new AppError(msg, 403, 'FORBIDDEN'); }
  static notFound(msg = 'Not found')              { return new AppError(msg, 404, 'NOT_FOUND'); }
  static conflict(msg, code = 'CONFLICT')         { return new AppError(msg, 409, code); }
  static paymentRequired(msg = 'Upgrade required'){ return new AppError(msg, 402, 'PAYMENT_REQUIRED'); }
  static tooMany(msg = 'Too many requests')       { return new AppError(msg, 429, 'TOO_MANY_REQUESTS'); }
}

// ── Async route wrapper ───────────────────────────────────────────────────
export const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Standard JSON envelope ────────────────────────────────────────────────
export const ok = (res, data, { status = 200, message = 'OK', meta } = {}) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};

export const created = (res, data, message = 'Created') =>
  ok(res, data, { status: 201, message });

// ── Pagination ────────────────────────────────────────────────────────────
export const paginate = q => {
  const page  = Math.max(1, parseInt(q.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(q.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

export const pageInfo = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext:    page * limit < total,
  hasPrev:    page > 1,
});
