'use client';
import { X, ChevronLeft, ChevronRight, SearchX, Star } from 'lucide-react';
import { useEffect } from 'react';

/* ── Spinner ──────────────────────────────────────── */
export function Spinner({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      className={`animate-spin ${className}`}>
      <circle cx="12" cy="12" r="10" stroke="#1e2a3d" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#4f7dff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ── EmptyState ───────────────────────────────────── */
export function EmptyState({ icon: Icon = SearchX, title = 'Nothing here', desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-border flex items-center justify-center mb-4">
        <Icon size={28} className="text-text-muted" />
      </div>
      <h3 className="text-text-primary font-semibold text-lg mb-2">{title}</h3>
      {desc && <p className="text-text-muted text-sm max-w-xs mb-6">{desc}</p>}
      {action}
    </div>
  );
}

/* ── Pagination ───────────────────────────────────── */
export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const pages = [];
  const delta = 2;
  const range = { start: Math.max(2, page - delta), end: Math.min(totalPages - 1, page + delta) };

  pages.push(1);
  if (range.start > 2) pages.push('…');
  for (let p = range.start; p <= range.end; p++) pages.push(p);
  if (range.end < totalPages - 1) pages.push('…');
  if (totalPages > 1) pages.push(totalPages);

  return (
    <div className="flex items-center gap-1 justify-center mt-10">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted
                   hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronLeft size={16} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={i} className="w-8 h-8 flex items-center justify-center text-text-muted text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
              p === page ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted
                   hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ── Modal ────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md', hideHeader = false }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`w-full ${maxW} card shadow-card overflow-hidden animate-slide-up`}>
        {!hideHeader && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
            <h2 className="text-text-primary font-semibold text-base">{title}</h2>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
}

/* ── StarRating ───────────────────────────────────── */
export function StarRating({ rating = 0, max = 5, size = 14, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button key={i} type="button"
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          onClick={() => interactive && onChange?.(i + 1)}>
          <Star size={size}
            className={i < Math.round(rating) ? 'fill-brand-amber text-brand-amber' : 'text-bg-border'} />
        </button>
      ))}
    </div>
  );
}

/* ── SkeletonCard ─────────────────────────────────── */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card p-5 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}

/* ── RiskBadge ────────────────────────────────────── */
const riskMap = {
  very_low:  'badge-green', low:    'badge-teal',
  medium:    'badge-amber', high:   'badge-red', very_high: 'badge-red',
};
export function RiskBadge({ level }) {
  return (
    <span className={riskMap[level] || 'badge-gray'}>
      {(level || '—').replace(/_/g, ' ')}
    </span>
  );
}

/* ── ProgressBar ──────────────────────────────────── */
export function ProgressBar({ value = 0, max = 100, color = 'bg-accent', label }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div>
      {label && <div className="flex justify-between text-xs text-text-muted mb-1"><span>{label}</span><span>{value}/{max}</span></div>}
      <div className="h-1.5 rounded-full bg-bg-border overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
