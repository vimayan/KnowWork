import { notFound } from 'next/navigation';
import {
  decodeRoadmapSlug, BASE_EDU, TRAINING_TYPES, EXPERIENCE_OPTIONS,
  buildRoadmapData, months2str,
  TOP_CAREER_SLUGS, TOP_EDU_IDS, TOP_EXPERIENCE_IDS, DEFAULT_TRAINING,
} from '../../../src/lib/roadmapBuilder.js';
import RoadmapShareActions from './RoadmapShareActions.jsx';

// Allow on-demand SSR for slugs not pre-rendered
export const dynamicParams = true;

// ─── Pre-render top combinations at build time ────────────────────────────────
export function generateStaticParams() {
  const slugs = [];
  for (const career of TOP_CAREER_SLUGS) {
    for (const edu of TOP_EDU_IDS) {
      for (const exp of TOP_EXPERIENCE_IDS) {
        slugs.push({ slug: `${career}--${edu}--${DEFAULT_TRAINING}--${exp}` });
      }
    }
  }
  return slugs; // 10 × 4 × 3 = 120 pages
}

// ─── Server-side data fetch ───────────────────────────────────────────────────
async function fetchJob(careerSlug) {
  try {
    const res = await fetch(`http://localhost:4000/api/v1/job-cards/${careerSlug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data ?? null;
  } catch {
    return null;
  }
}

async function fetchMentors(jobSlug, limit = 3) {
  try {
    const res = await fetch(
      `http://localhost:4000/api/v1/mentors?job_slug=${jobSlug}&available=true&sort=rating&limit=${limit}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return [];
    return (await res.json())?.data ?? [];
  } catch {
    return [];
  }
}

async function fetchStories(jobSlug, limit = 4) {
  try {
    const res = await fetch(
      `http://localhost:4000/api/v1/stories?job_slug=${jobSlug}&limit=${limit}`,
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return [];
    return (await res.json())?.data ?? [];
  } catch {
    return [];
  }
}

// ─── SEO metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const decoded = decodeRoadmapSlug(params.slug);
  if (!decoded) return { title: 'Career Roadmap' };

  const job = await fetchJob(decoded.careerSlug);
  const edu = BASE_EDU.find(e => e.id === decoded.eduId);
  const exp = EXPERIENCE_OPTIONS.find(e => e.id === decoded.experienceId);

  if (!job || !edu || !exp) return { title: 'Career Roadmap' };

  const training = { methods: decoded.trainingIds, skills: [] };
  const { totalMonths } = buildRoadmapData(job, edu, training, exp);

  const title       = `${job.title} Roadmap via ${edu.label} → ${exp.label}`;
  const description = `Complete ${months2str(totalMonths)} roadmap to become a ${job.title}. `
    + `Education: ${edu.label}. Training: ${decoded.trainingIds.map(id => TRAINING_TYPES.find(t => t.id === id)?.label ?? id).join(', ')}. `
    + `Experience: ${exp.label}. Built on KnowWork.`;

  return {
    title,
    description,
    keywords: [
      job.title, 'career roadmap', edu.label, exp.label,
      'how to become', job.field ?? '', 'India career path',
    ].filter(Boolean),
    openGraph: {
      title: `${title} | KnowWork`,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// ─── Timeline colour helpers (server-safe, no Tailwind dynamic classes) ───────
const PHASE_COLORS = [
  { bar: '#4f7dff', border: 'rgba(79,125,255,0.3)',  bg: 'rgba(79,125,255,0.05)',   dot: '#4f7dff'  },
  { bar: '#f59e0b', border: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.05)',   dot: '#f59e0b'  },
  { bar: '#22c55e', border: 'rgba(34,197,94,0.3)',   bg: 'rgba(34,197,94,0.05)',    dot: '#22c55e'  },
  { bar: '#8b5cf6', border: 'rgba(139,92,246,0.3)',  bg: 'rgba(139,92,246,0.05)',   dot: '#8b5cf6'  },
];

// ─── Page component (Server Component) ───────────────────────────────────────
export default async function RoadmapSharePage({ params }) {
  const decoded = decodeRoadmapSlug(params.slug);
  if (!decoded) notFound();

  const [job, stories, mentors] = await Promise.all([
    fetchJob(decoded.careerSlug),
    fetchStories(decoded.careerSlug),
    fetchMentors(decoded.careerSlug),
  ]);
  const edu = BASE_EDU.find(e => e.id === decoded.eduId);
  const exp = EXPERIENCE_OPTIONS.find(e => e.id === decoded.experienceId);

  if (!job || !edu || !exp) notFound();

  const training = { methods: decoded.trainingIds, skills: [] };
  const { timeline, totalMonths, educationMonths, trainingMonths, experienceMonths } =
    buildRoadmapData(job, edu, training, exp);

  const trainingLabels = decoded.trainingIds
    .map(id => TRAINING_TYPES.find(t => t.id === id)?.label ?? id)
    .join(' + ');

  const shareUrl = `https://knowwork.app/roadmap/${params.slug}`;

  return (
    <div className="max-w-screen-lg mx-auto px-4 lg:px-6 py-10 animate-fade-in">

      {/* ── Hero ── */}
      <div className="card p-8 mb-6 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none"/>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-brand-purple/20 border border-accent/20 flex items-center justify-center text-3xl flex-shrink-0">
            {job.icon ?? '💼'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="badge-gray text-[10px] capitalize">{job.field ?? job.category}</span>
              {job.is_remote_possible && <span className="badge-blue text-[10px]">Remote</span>}
              {job.details?.india_demand_trend === 'growing' && <span className="badge-green text-[10px]">Growing in India</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">
              {job.title} Career Roadmap
            </h1>
            <p className="text-text-muted text-sm">
              via {edu.label}
              {trainingLabels && ` · ${trainingLabels}`}
              {` · ${exp.label}`}
            </p>
          </div>

          {/* Share / Customise buttons (client island) */}
          <RoadmapShareActions shareUrl={shareUrl} params={params.slug} job={job} />
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Time',   value: months2str(totalMonths),    emoji: '⏱️', color: '#4f7dff' },
          { label: 'Education',    value: months2str(educationMonths), emoji: edu.icon, color: '#f59e0b' },
          { label: 'Training',     value: months2str(trainingMonths),  emoji: '⚡',  color: '#22c55e' },
          { label: 'Experience',   value: months2str(experienceMonths),emoji: exp.icon, color: '#8b5cf6' },
        ].map(({ label, value, emoji, color }) => (
          <div key={label} className="card p-5 text-center">
            <div className="text-2xl mb-2">{emoji}</div>
            <p className="text-text-primary font-bold text-base" style={{ color }}>{value}</p>
            <p className="text-text-muted text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Visual timeline bar ── */}
      <div className="card p-5 mb-6">
        <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">Timeline Overview</p>
        <div className="flex h-8 rounded-xl overflow-hidden gap-px mb-2">
          {timeline.map((phase, i) => {
            const width = Math.max(((phase.duration || 2) / (totalMonths || 1)) * 100, 5);
            const color = PHASE_COLORS[i % PHASE_COLORS.length];
            return (
              <div
                key={i}
                style={{ width: `${width}%`, backgroundColor: color.bar }}
                className="flex items-center justify-center text-white text-xs font-semibold px-1"
                title={`${phase.phase} · ${months2str(phase.duration)}`}
              >
                <span className="hidden sm:inline truncate text-[10px]">{phase.icon} {phase.phase}</span>
                <span className="sm:hidden">{phase.icon}</span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-text-muted">
          <span>Month 0</span>
          <span>Month {totalMonths}</span>
        </div>

        {/* Phase legend */}
        <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-bg-border">
          {timeline.map((phase, i) => {
            const color = PHASE_COLORS[i % PHASE_COLORS.length];
            return (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color.bar }}/>
                <span className="text-text-muted text-[11px]">{phase.phase}</span>
                <span className="text-text-dim text-[10px]">({months2str(phase.duration)})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Phase breakdown ── */}
      <div className="space-y-4 mb-8">
        {timeline.map((phase, pi) => {
          const color = PHASE_COLORS[pi % PHASE_COLORS.length];
          return (
            <div
              key={pi}
              className="card p-5"
              style={{
                borderColor: color.border,
                backgroundColor: color.bg,
              }}
            >
              {/* Phase header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{phase.icon}</span>
                  <div>
                    <p className="text-text-primary font-semibold">{phase.phase}</p>
                    <p className="text-text-muted text-xs">Month {phase.start}–{phase.end}</p>
                  </div>
                </div>
                {phase.duration > 0 && (
                  <span className="badge-gray text-xs">
                    ⏱ {months2str(phase.duration)}
                  </span>
                )}
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {phase.steps.map((step, si) => (
                  <div key={si} className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color.dot }}/>
                      {si < phase.steps.length - 1 && (
                        <div className="w-px flex-1 bg-bg-border min-h-[16px]"/>
                      )}
                    </div>
                    <div className="pb-2 min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-text-primary text-sm font-medium leading-snug">{step.title}</p>
                        {step.time && (
                          <span className="text-text-muted text-[10px] flex-shrink-0 whitespace-nowrap">
                            ⏱ {step.time}
                          </span>
                        )}
                      </div>
                      {step.desc && (
                        <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Key skills from the job card ── */}
      {job.skills?.length > 0 && (
        <div className="card p-6 mb-6">
          <p className="text-text-primary font-semibold mb-3 flex items-center gap-2">
            <span>⚡</span>Key Skills to Master
          </p>
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 16).map(s => (
              <span
                key={s.skill_name}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
                  s.is_core
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-bg-card border-bg-border text-text-secondary'
                }`}
              >
                {s.is_core && <span className="mr-1 text-brand-green text-[10px]">●</span>}
                {s.skill_name}
                {s.learn_time_weeks && <span className="ml-1.5 opacity-50 text-[10px]">{s.learn_time_weeks}w</span>}
              </span>
            ))}
          </div>
          <p className="text-text-muted text-[10px] mt-2">● = Core skill</p>
        </div>
      )}

      {/* ── People who took this path ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-text-primary font-bold text-lg flex items-center gap-2">
              <span>👥</span> People who took this path
            </h2>
            <p className="text-text-muted text-xs mt-0.5">
              Real journeys from professionals who became a {job.title}
            </p>
          </div>
          {stories.length > 0 && (
            <a href={`/journey/new?job=${job.slug}`} className="btn-secondary text-xs">
              + Share yours
            </a>
          )}
        </div>

        {stories.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {stories.map(story => (
              <div key={story.id} className="card p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent/20 to-brand-purple/20 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
                    {story.avatar_initials || story.display_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-semibold text-sm truncate">
                      {story.display_name || 'Anonymous'}
                    </p>
                    <p className="text-text-muted text-[10px]">
                      {story.from_background && `From ${story.from_background} → `}{story.to_role}
                      {story.city && ` · ${story.city}`}
                    </p>
                  </div>
                  {story.featured && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-amber/15 text-brand-amber border border-brand-amber/30 flex-shrink-0">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                {/* Quote */}
                {story.quote && (
                  <blockquote className="text-text-secondary text-xs leading-relaxed italic border-l-2 border-accent/30 pl-3">
                    "{story.quote}"
                  </blockquote>
                )}

                {/* Timeframe + turning points */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {story.timeframe && (
                    <span className="flex items-center gap-1 bg-bg-secondary border border-bg-border px-2 py-1 rounded-lg text-text-muted">
                      ⏱ {story.timeframe}
                    </span>
                  )}
                  {story.key_turning_points?.slice(0, 2).map((pt, i) => (
                    <span key={i} className="bg-accent/8 border border-accent/20 text-accent px-2 py-1 rounded-lg">
                      ✦ {pt}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-bg-border">
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span>❤️ {story.likes ?? 0}</span>
                    <span>👁 {story.views ?? 0}</span>
                  </div>
                  <a href={`/stories/${story.id}`} className="text-accent text-[10px] font-medium hover:underline flex items-center gap-0.5">
                    Read story →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="card p-8 text-center border-dashed border-2 border-bg-border">
            <div className="text-4xl mb-3">🌱</div>
            <p className="text-text-primary font-semibold mb-1">No stories yet for this exact path</p>
            <p className="text-text-muted text-sm mb-5 max-w-md mx-auto">
              Be the first to share your journey as a <strong className="text-text-primary">{job.title}</strong>.
              Your story could help hundreds of people who are exactly where you once were.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href={`/journey/new?job=${job.slug}&edu=${edu.id}&exp=${exp.id}`}
                className="btn-primary text-sm flex items-center gap-2"
              >
                ✍️ Share my journey
              </a>
              <a
                href={`/roadmaps?job=${job.slug}`}
                className="btn-secondary text-sm"
              >
                Browse all {job.title} stories
              </a>
            </div>
            <p className="text-text-muted text-[10px] mt-4">
              Stories are reviewed before publishing. Usually live within 24 hours.
            </p>
          </div>
        )}
      </div>

      {/* ── Mentor match ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-text-primary font-bold text-lg flex items-center gap-2">
              <span>🎯</span>
              {mentors.length > 0
                ? `${mentors.length} mentor${mentors.length > 1 ? 's' : ''} who became a ${job.title}`
                : `Find a ${job.title} mentor`}
            </h2>
            <p className="text-text-muted text-xs mt-0.5">
              {mentors.length > 0
                ? 'Book a 1-on-1 session — get personalised guidance, not a generic roadmap.'
                : 'Exact-path matching coming soon. Browse all available mentors below.'}
            </p>
          </div>
          {mentors.length > 0 && (
            <a href={`/mentors?job=${job.slug}`} className="btn-secondary text-xs">
              View all →
            </a>
          )}
        </div>

        {mentors.length > 0 ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {mentors.map(mentor => (
              <div key={mentor.id} className="card p-5 flex flex-col gap-3 hover:border-accent/30 transition-all">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-purple/20 to-accent/20 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent flex-shrink-0">
                    {mentor.avatar_initials || mentor.name?.[0] || 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-semibold text-sm truncate">{mentor.name}</p>
                    <p className="text-text-muted text-[10px] truncate">
                      {mentor.title}{mentor.company ? ` · ${mentor.company}` : ''}
                    </p>
                  </div>
                  {mentor.available && (
                    <span className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0 mt-1" title="Available"/>
                  )}
                </div>

                {/* Bio */}
                {mentor.bio && (
                  <p className="text-text-secondary text-[11px] leading-relaxed line-clamp-2">{mentor.bio}</p>
                )}

                {/* Expertise chips */}
                {mentor.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {mentor.expertise.slice(0, 3).map(skill => (
                      <span key={skill} className="text-[9px] px-2 py-0.5 rounded-full bg-accent/8 border border-accent/20 text-accent">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats + rate */}
                <div className="flex items-center justify-between text-[10px] text-text-muted pt-1 border-t border-bg-border">
                  <div className="flex items-center gap-2">
                    {mentor.rating && <span>⭐ {parseFloat(mentor.rating).toFixed(1)}</span>}
                    {mentor.total_sessions > 0 && <span>· {mentor.total_sessions} sessions</span>}
                  </div>
                  <span className="text-text-primary font-semibold">
                    {mentor.hourly_rate_inr ? `₹${mentor.hourly_rate_inr}/hr` : 'Free'}
                  </span>
                </div>

                {/* Book CTA */}
                <a
                  href={`/mentors/${mentor.id}`}
                  className="btn-primary text-xs text-center mt-auto"
                >
                  Book a session
                </a>
              </div>
            ))}
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="card p-6 flex flex-col sm:flex-row items-center gap-5 border-dashed border-2 border-bg-border">
            <div className="text-4xl flex-shrink-0">🎓</div>
            <div className="flex-1">
              <p className="text-text-primary font-semibold mb-1">No mentors matched for this career yet</p>
              <p className="text-text-muted text-sm">
                Are you a {job.title}? Share your journey and toggle "I want to mentor" — you'll show up here for the next person who builds this roadmap.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
              <a href={`/mentors?job=${job.slug}`} className="btn-secondary text-xs text-center">
                Browse all mentors
              </a>
              <a href={`/journey/new?job=${job.slug}&wants_to_mentor=true`} className="btn-primary text-xs text-center">
                Become a mentor
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── CTA bar ── */}
      <div className="card p-6 flex flex-col sm:flex-row items-center gap-5 bg-accent/5 border-accent/20">
        <div className="flex-1 text-center sm:text-left">
          <p className="text-text-primary font-semibold">Want a different path?</p>
          <p className="text-text-muted text-xs mt-0.5">
            Customize education, training or experience and generate your own version.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
          <a
            href={`/career/${job.slug}`}
            className="btn-secondary text-xs"
          >
            📋 Full Career Guide
          </a>
          <a
            href={`/build-roadmap?career=${job.slug}&edu=${edu.id}&exp=${exp.id}`}
            className="btn-primary text-xs"
          >
            🛠️ Customise Roadmap
          </a>
        </div>
      </div>

      {/* ── SEO content block (hidden visually, crawlable) ── */}
      <div className="mt-8 card p-6">
        <h2 className="text-text-primary font-semibold text-lg mb-3">
          How to become a {job.title} in India
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-3">
          This roadmap shows one of the most effective paths to becoming a {job.title} —
          through {edu.label} ({months2str(educationMonths)}), hands-on training
          ({trainingLabels}), and gaining real-world experience via {exp.label}.
          The total estimated timeline is <strong className="text-text-primary">{months2str(totalMonths)}</strong>.
        </p>
        <p className="text-text-secondary text-sm leading-relaxed">
          {job.description ?? `The ${job.title} role is one of the most sought-after careers in the industry.`}
          {' '}KnowWork's roadmaps are built from real data — salary bands, employer demand, and skill trends —
          so you can plan with confidence.
        </p>
      </div>

    </div>
  );
}
