import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  decodeRoadmapSlug, BASE_EDU, TRAINING_TYPES, EXPERIENCE_OPTIONS,
  buildRoadmapData, months2str,
} from '../../../src/lib/roadmapBuilder.js';

export const dynamicParams = true;

// ─── Fetch job from API ───────────────────────────────────────────────────────
async function fetchJob(careerSlug) {
  try {
    const res = await fetch(`http://localhost:4000/api/v1/job-cards/${careerSlug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json())?.data ?? null;
  } catch { return null; }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const COLORS = [
  { bar: '#4f7dff', light: 'rgba(79,125,255,0.08)',  border: 'rgba(79,125,255,0.25)',  text: '#4f7dff',  label: 'Path A' },
  { bar: '#f59e0b', light: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  text: '#f59e0b',  label: 'Path B' },
];

const PHASE_COLORS = [
  '#4f7dff', '#f59e0b', '#22c55e', '#8b5cf6',
];

function winner(a, b, lowerIsBetter = false) {
  if (a === b) return null;
  return lowerIsBetter ? (a < b ? 0 : 1) : (a > b ? 0 : 1);
}

function WinnerBadge({ idx }) {
  return (
    <span
      className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: COLORS[idx].bar, color: '#fff' }}
    >
      ✓ Better
    </span>
  );
}

function StatCard({ label, valA, valB, winIdx, emoji }) {
  return (
    <div className="card p-4">
      <p className="text-text-muted text-[10px] uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span>{emoji}</span>{label}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {[valA, valB].map((val, i) => (
          <div
            key={i}
            className="rounded-xl p-3 text-center"
            style={{ background: COLORS[i].light, border: `1px solid ${COLORS[i].border}` }}
          >
            <p className="text-[10px] font-semibold mb-1" style={{ color: COLORS[i].text }}>{COLORS[i].label}</p>
            <p className="font-bold text-sm text-text-primary">
              {val}
              {winIdx === i && <WinnerBadge idx={i}/>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Single-slug picker page ──────────────────────────────────────────────────
function PickSecondPath({ slug1 }) {
  return (
    <div className="max-w-screen-md mx-auto px-4 py-16 text-center animate-fade-in">
      <div className="text-5xl mb-4">⚖️</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Compare Roadmaps</h1>
      <p className="text-text-muted text-sm mb-8">
        You've loaded Path A. Now build a second path to compare it against.
      </p>
      <div
        className="card p-5 mb-6 text-left"
        style={{ borderColor: COLORS[0].border, background: COLORS[0].light }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: COLORS[0].text }}>Path A (loaded)</p>
        <p className="text-text-secondary text-xs font-mono break-all">{slug1}</p>
      </div>
      <Link
        href={`/build-roadmap?compare=${slug1}`}
        className="btn-primary inline-flex items-center gap-2"
      >
        🛠️ Build Path B in the Wizard
      </Link>
      <p className="text-text-muted text-xs mt-4">
        Complete the wizard and we'll show both paths side by side.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default async function CompareSlugsPage({ params }) {
  const slugs = params.slugs ?? [];

  if (slugs.length === 0) notFound();

  // Single slug → show "pick second path" UI
  if (slugs.length === 1) {
    return <PickSecondPath slug1={slugs[0]} />;
  }

  const [slug1, slug2] = slugs;

  const dec1 = decodeRoadmapSlug(slug1);
  const dec2 = decodeRoadmapSlug(slug2);
  if (!dec1 || !dec2) notFound();

  const [job1, job2] = await Promise.all([
    fetchJob(dec1.careerSlug),
    fetchJob(dec2.careerSlug),
  ]);
  if (!job1 || !job2) notFound();

  const edu1 = BASE_EDU.find(e => e.id === dec1.eduId);
  const edu2 = BASE_EDU.find(e => e.id === dec2.eduId);
  const exp1 = EXPERIENCE_OPTIONS.find(e => e.id === dec1.experienceId);
  const exp2 = EXPERIENCE_OPTIONS.find(e => e.id === dec2.experienceId);
  if (!edu1 || !edu2 || !exp1 || !exp2) notFound();

  const training1 = { methods: dec1.trainingIds, skills: [] };
  const training2 = { methods: dec2.trainingIds, skills: [] };

  const r1 = buildRoadmapData(job1, edu1, training1, exp1);
  const r2 = buildRoadmapData(job2, edu2, training2, exp2);

  const sal1 = job1.salary_bands?.[0];
  const sal2 = job2.salary_bands?.[0];
  const med1 = sal1 ? Math.round((sal1.sal_min + sal1.sal_max) / 2) : null;
  const med2 = sal2 ? Math.round((sal2.sal_min + sal2.sal_max) / 2) : null;

  const timeWinner = winner(r1.totalMonths, r2.totalMonths, true);
  const salWinner  = (med1 && med2) ? winner(med1, med2) : null;

  const paths = [
    { dec: dec1, job: job1, edu: edu1, exp: exp1, training: training1, r: r1 },
    { dec: dec2, job: job2, edu: edu2, exp: exp2, training: training2, r: r2 },
  ];

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">⚖️</span>
          <h1 className="text-2xl font-bold text-text-primary">Roadmap Comparison</h1>
        </div>
        <p className="text-text-muted text-sm">Side-by-side breakdown of two career paths</p>
      </div>

      {/* ── Path headers ── */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {paths.map(({ job, edu, exp, dec }, i) => {
          const trainingLabels = dec.trainingIds
            .map(id => TRAINING_TYPES.find(t => t.id === id)?.label ?? id)
            .join(' + ');
          return (
            <div
              key={i}
              className="card p-5"
              style={{ borderColor: COLORS[i].border, background: COLORS[i].light }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: COLORS[i].text }}>
                {COLORS[i].label}
              </p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{job.icon || '💼'}</span>
                <div>
                  <p className="text-text-primary font-bold">{job.title}</p>
                  <p className="text-text-muted text-xs">{job.field} · {job.category}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-text-secondary">
                <p>🎓 {edu.label}</p>
                {trainingLabels && <p>⚡ {trainingLabels}</p>}
                <p>💼 {exp.label}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/roadmap/${slug1}`} className="text-[10px] text-accent hover:underline">
                  View full roadmap →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Key stats comparison ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Time"
          emoji="⏱️"
          valA={months2str(r1.totalMonths)}
          valB={months2str(r2.totalMonths)}
          winIdx={timeWinner}
        />
        <StatCard
          label="Education"
          emoji="🎓"
          valA={months2str(r1.educationMonths)}
          valB={months2str(r2.educationMonths)}
          winIdx={winner(r1.educationMonths, r2.educationMonths, true)}
        />
        <StatCard
          label="Training"
          emoji="⚡"
          valA={months2str(r1.trainingMonths)}
          valB={months2str(r2.trainingMonths)}
          winIdx={winner(r1.trainingMonths, r2.trainingMonths, true)}
        />
        <StatCard
          label="Experience"
          emoji="💼"
          valA={months2str(r1.experienceMonths)}
          valB={months2str(r2.experienceMonths)}
          winIdx={winner(r1.experienceMonths, r2.experienceMonths, true)}
        />
      </div>

      {/* ── Salary comparison ── */}
      {(med1 || med2) && (
        <div className="card p-5 mb-6">
          <h3 className="text-text-primary font-semibold text-sm mb-4">💰 Starting Salary (Entry Band)</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {paths.map(({ job, r }, i) => {
              const band = job.salary_bands?.[0];
              const med  = band ? Math.round((band.sal_min + band.sal_max) / 2 / 100000 * 10) / 10 : null;
              return (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: COLORS[i].light, border: `1px solid ${COLORS[i].border}` }}
                >
                  <p className="text-[10px] font-bold uppercase mb-2" style={{ color: COLORS[i].text }}>{COLORS[i].label} · {job.title}</p>
                  {med ? (
                    <>
                      <p className="text-xl font-bold text-text-primary">
                        ₹{med}L / yr
                        {salWinner === i && <WinnerBadge idx={i}/>}
                      </p>
                      <p className="text-text-muted text-[10px] mt-0.5">
                        ₹{(band.sal_min / 100000).toFixed(1)}L – ₹{(band.sal_max / 100000).toFixed(1)}L range
                      </p>
                      <div className="mt-3 h-1.5 rounded-full bg-bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((med / 30) * 100, 100)}%`,
                            backgroundColor: COLORS[i].bar,
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-text-muted text-sm">Data not available</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Timeline bars side-by-side ── */}
      <div className="card p-5 mb-6">
        <h3 className="text-text-primary font-semibold text-sm mb-4">📅 Timeline Comparison</h3>
        <div className="space-y-5">
          {paths.map(({ r, job }, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS[i].text }}>
                  {COLORS[i].label} · {job.title}
                </p>
                <p className="text-text-muted text-xs">{months2str(r.totalMonths)} total</p>
              </div>
              <div className="flex h-7 rounded-xl overflow-hidden gap-px">
                {r.timeline.map((phase, pi) => {
                  const width = Math.max(((phase.duration || 2) / (r.totalMonths || 1)) * 100, 5);
                  return (
                    <div
                      key={pi}
                      style={{ width: `${width}%`, backgroundColor: PHASE_COLORS[pi % PHASE_COLORS.length] }}
                      className="flex items-center justify-center text-white text-[9px] font-semibold px-1"
                      title={`${phase.phase} · ${months2str(phase.duration)}`}
                    >
                      <span className="hidden sm:inline truncate">{phase.icon}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-text-muted mt-1">
                <span>Month 0</span><span>Month {r.totalMonths}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Shared phase legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-bg-border">
          {['Education 🎓', 'Training ⚡', 'Experience 💼', 'Job Hunt 🚀'].map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: PHASE_COLORS[i] }}/>
              <span className="text-text-muted text-[10px]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Phase-by-phase side-by-side ── */}
      <div className="mb-6">
        <h3 className="text-text-primary font-semibold text-sm mb-4">🗺️ Phase Breakdown</h3>
        <div className="space-y-4">
          {Array.from({ length: Math.max(r1.timeline.length, r2.timeline.length) }).map((_, pi) => {
            const ph1 = r1.timeline[pi];
            const ph2 = r2.timeline[pi];
            return (
              <div key={pi} className="grid sm:grid-cols-2 gap-3">
                {[ph1, ph2].map((phase, i) => (
                  <div
                    key={i}
                    className="card p-4"
                    style={phase
                      ? { borderColor: COLORS[i].border, background: COLORS[i].light }
                      : { opacity: 0.3 }}
                  >
                    {phase ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{phase.icon}</span>
                            <p className="text-text-primary font-semibold text-xs">{phase.phase}</p>
                          </div>
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: COLORS[i].bar + '22', color: COLORS[i].bar, border: `1px solid ${COLORS[i].border}` }}
                          >
                            {months2str(phase.duration || phase.remaining || 2)}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {phase.steps.slice(0, 2).map((step, si) => (
                            <p key={si} className="text-text-secondary text-[11px] truncate">
                              · {step.title}
                            </p>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-text-muted text-xs text-center py-4">— No phase —</p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Verdict ── */}
      <div className="card p-6 bg-accent/5 border-accent/20">
        <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          🏆 Quick Verdict
        </h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 rounded-xl bg-bg-secondary border border-bg-border">
            <p className="text-text-muted text-xs mb-1">Fastest Path</p>
            <p className="font-bold" style={{ color: timeWinner !== null ? COLORS[timeWinner].text : '#888' }}>
              {timeWinner !== null ? `${COLORS[timeWinner].label} — ${months2str(timeWinner === 0 ? r1.totalMonths : r2.totalMonths)}` : 'Equal'}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-bg-secondary border border-bg-border">
            <p className="text-text-muted text-xs mb-1">Higher Starting Pay</p>
            <p className="font-bold" style={{ color: salWinner !== null ? COLORS[salWinner].text : '#888' }}>
              {salWinner !== null
                ? `${COLORS[salWinner].label} — ₹${((salWinner === 0 ? med1 : med2) / 100000).toFixed(1)}L`
                : (med1 && med2 ? 'Equal' : 'No data')}
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-bg-secondary border border-bg-border">
            <p className="text-text-muted text-xs mb-1">Time Saved</p>
            <p className="font-bold text-text-primary">
              {Math.abs(r1.totalMonths - r2.totalMonths) > 0
                ? months2str(Math.abs(r1.totalMonths - r2.totalMonths))
                : 'Same duration'}
            </p>
          </div>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Link href={`/roadmap/${slug1}`} className="btn-secondary text-xs">View Path A in full</Link>
        <Link href={`/roadmap/${slug2}`} className="btn-secondary text-xs">View Path B in full</Link>
        <Link href="/build-roadmap" className="btn-primary text-xs">Build a new path</Link>
      </div>

    </div>
  );
}
