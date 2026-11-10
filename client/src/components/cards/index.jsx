import { Link } from '../../lib/router.jsx';
import {
  TrendingUp, Globe, Bookmark, Eye, ArrowRight,
  Star, IndianRupee, Clock, MessageSquare,
  Heart, BarChart3, CheckCircle2, MapPin, Briefcase,
  BadgeCheck
} from 'lucide-react';
import { StarRating } from '../ui/index.jsx';

/* ── JobCard ─────────────────────────────────────── */
export function JobCard({ job, onSave, saved }) {
  if (!job) return null;
  const demandCls = { growing: 'badge-green', stable: 'badge-blue', declining: 'badge-red' }[job.india_demand_trend] || 'badge-gray';

  return (
    <div className="card-hover group flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl flex-shrink-0">
          {job.icon || '💼'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-sm leading-snug group-hover:text-accent transition-colors">
            {job.title}
          </h3>
          <p className="text-text-muted text-xs mt-0.5 truncate">{job.category} · {job.discipline}</p>
        </div>
        {onSave && (
          <button onClick={() => onSave(job)}
            className={`flex-shrink-0 p-1 rounded-lg transition-all ${saved ? 'text-accent' : 'text-text-muted hover:text-accent hover:bg-accent/10'}`}>
            <Bookmark size={15} className={saved ? 'fill-current' : ''} />
          </button>
        )}
      </div>

      {job.summary && (
        <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{job.summary}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {job.india_demand_trend && <span className={demandCls}><TrendingUp size={10} />{job.india_demand_trend}</span>}
        {job.is_remote_possible  && <span className="badge-blue"><Globe size={10} />Remote</span>}
        {job.is_freelance_viable && <span className="badge-purple">Freelance</span>}
        {job.social_grade        && <span className="badge-gray">Grade {job.social_grade}</span>}
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted border-t border-bg-border pt-3 mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Eye size={11} />{(job.views || 0).toLocaleString('en-IN')}</span>
          <span className="flex items-center gap-1"><Bookmark size={11} />{(job.saves || 0).toLocaleString('en-IN')}</span>
        </div>
        <Link to={`/career/${job.slug}`}
          className="flex items-center gap-1 text-accent hover:text-accent-hover font-semibold transition-colors">
          Explore <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

/* ── MentorCard ──────────────────────────────────── */
export function MentorCard({ mentor }) {
  if (!mentor) return null;
  return (
    <div className="card-hover flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-brand-purple flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {mentor.avatar_initials || mentor.name?.[0] || 'M'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-sm truncate">{mentor.name}</h3>
          <p className="text-text-muted text-xs truncate mt-0.5">{mentor.title}</p>
          <p className="text-accent text-xs truncate">{mentor.company}</p>
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${mentor.available ? 'bg-brand-green' : 'bg-bg-border'}`} />
      </div>

      {mentor.bio && <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{mentor.bio}</p>}

      {mentor.expertise?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mentor.expertise.slice(0, 4).map((e, i) => (
            <span key={i} className="badge-blue text-[10px]">
              {typeof e === 'object' ? e.skill : e}
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 py-3 border-y border-bg-border text-center">
        <div>
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <Star size={11} className="fill-brand-amber text-brand-amber" />
            <span className="text-text-primary text-xs font-bold">{mentor.rating || '—'}</span>
          </div>
          <p className="text-text-muted text-[10px]">Rating</p>
        </div>
        <div>
          <p className="text-text-primary text-xs font-bold mb-0.5">{mentor.total_sessions || 0}</p>
          <p className="text-text-muted text-[10px]">Sessions</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-0.5 mb-0.5">
            <IndianRupee size={10} className="text-brand-green" />
            <span className="text-text-primary text-xs font-bold">
              {mentor.hourly_rate_inr ? `${mentor.hourly_rate_inr}` : 'Free'}
            </span>
          </div>
          <p className="text-text-muted text-[10px]">/hour</p>
        </div>
      </div>

      {mentor.languages?.length > 0 && (
        <p className="text-text-muted text-[10px]">Speaks: {mentor.languages.join(', ')}</p>
      )}

      <Link to={`/mentors/${mentor.id}`} className="btn-primary justify-center text-xs py-2 mt-auto">
        <MessageSquare size={13} /> Book Session
      </Link>
    </div>
  );
}

/* ── RoadmapCard ─────────────────────────────────── */
const trajColors = {
  fastest: 'badge-green', balanced: 'badge-blue',
  academic: 'badge-purple', self_taught: 'badge-amber', lateral: 'badge-gray',
};
const diffColors = {
  beginner: 'text-brand-green', easy: 'text-brand-teal',
  medium: 'text-brand-amber', hard: 'text-orange-400', expert: 'text-brand-rose',
};

export function RoadmapCard({ roadmap }) {
  if (!roadmap) return null;
  return (
    <div className="card-hover group flex flex-col gap-3.5 p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {roadmap.is_official && (
            <div className="flex items-center gap-1 mb-1.5">
              <CheckCircle2 size={12} className="text-accent" />
              <span className="text-accent text-[10px] font-semibold">Official</span>
            </div>
          )}
          <h3 className="text-text-primary font-semibold text-sm leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {roadmap.title}
          </h3>
          {roadmap.job_card_title && (
            <p className="text-text-muted text-xs mt-1">{roadmap.job_card_title}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {roadmap.trajectory_type && (
          <span className={trajColors[roadmap.trajectory_type] || 'badge-gray'}>
            {roadmap.trajectory_type.replace('_', ' ')}
          </span>
        )}
        {roadmap.difficulty && (
          <span className={`badge badge-gray ${diffColors[roadmap.difficulty] || ''}`}>
            <BarChart3 size={10} />{roadmap.difficulty}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        {roadmap.estimated_months && (
          <span className="flex items-center gap-1"><Clock size={11} />{roadmap.estimated_months}mo</span>
        )}
        <span className="flex items-center gap-1"><Heart size={11} />{(roadmap.likes || 0).toLocaleString('en-IN')}</span>
      </div>

      {roadmap.target_audience && (
        <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{roadmap.target_audience}</p>
      )}

      <Link to={`/roadmaps/${roadmap.id}`}
        className="flex items-center justify-between text-xs text-accent hover:text-accent-hover font-semibold border-t border-bg-border pt-3 mt-auto transition-colors">
        View Roadmap <ArrowRight size={12} />
      </Link>
    </div>
  );
}

/* ── ProfileCard ─────────────────────────────────── */
export function ProfileCard({ profile }) {
  if (!profile) return null;
  return (
    <div className="card-hover group flex flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/40 to-brand-purple/30 border border-accent/20 flex items-center justify-center text-white font-bold flex-shrink-0">
          {profile.avatar_initials || profile.display_name?.[0] || 'P'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="text-text-primary font-semibold text-sm truncate group-hover:text-accent transition-colors">
              {profile.display_name}
            </h3>
            {profile.is_verified && <BadgeCheck size={13} className="text-accent flex-shrink-0" />}
          </div>
          <p className="text-text-muted text-xs truncate">{profile.headline}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {profile.current_title && (
          <p className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Briefcase size={11} className="text-text-muted flex-shrink-0" />
            {profile.current_title}{profile.current_company ? ` @ ${profile.current_company}` : ''}
          </p>
        )}
        {profile.city && (
          <p className="flex items-center gap-1.5 text-xs text-text-secondary">
            <MapPin size={11} className="text-text-muted flex-shrink-0" />
            {profile.city}, {profile.country}
          </p>
        )}
      </div>

      {profile.years_experience !== undefined && (
        <div className="flex gap-1.5 flex-wrap">
          <span className="badge-gray">{profile.years_experience}yr exp</span>
          {profile.employer_type && <span className="badge-gray uppercase">{profile.employer_type}</span>}
        </div>
      )}

      <Link to={`/profile?id=${profile.id}`}
        className="btn-outline justify-center text-xs py-1.5 mt-auto">
        View Profile
      </Link>
    </div>
  );
}
