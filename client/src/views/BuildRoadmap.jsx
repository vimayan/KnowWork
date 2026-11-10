import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from '../lib/router.jsx';
import {
  ChevronRight, ChevronLeft, Search, CheckCircle2, Clock, BookOpen,
  GraduationCap, Briefcase, Zap, Target, ArrowRight, Star,
  Code, Users, TrendingUp, RotateCcw, Share2, Layers, Check,
  UserCheck, Sparkles, GitCompare,
} from 'lucide-react';
import { jobCardsApi, educationApi, goalsApi, roadmapProgressApi } from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { Spinner } from '../components/ui/index.jsx';
import {
  encodeRoadmapSlug,
  BASE_EDU, TRAINING_TYPES, EXPERIENCE_OPTIONS,
  months2str as _months2str,
} from '../lib/roadmapBuilder.js';

const EXP_OPTS  = EXPERIENCE_OPTIONS;
const months2str = _months2str;

// ─── Domain browse config ──────────────────────────────────────────────────────
const DOMAINS = [
  { id: 'all',        label: 'All',         emoji: '🌐' },
  { id: 'technology', label: 'Technology',  emoji: '💻', match: ['technology','software','it','computer','data','cyber','ai','cloud','devops','engineering'] },
  { id: 'healthcare', label: 'Healthcare',  emoji: '🏥', match: ['health','medical','medicine','pharma','biotech','clinical','nursing'] },
  { id: 'finance',    label: 'Finance',     emoji: '📈', match: ['finance','banking','investment','accounting','insurance','fintech'] },
  { id: 'creative',   label: 'Creative',    emoji: '🎨', match: ['design','creative','art','media','ux','marketing','content','film'] },
  { id: 'science',    label: 'Science',     emoji: '🔬', match: ['science','research','physics','chemistry','biology','environment'] },
  { id: 'business',   label: 'Business',    emoji: '💼', match: ['business','management','hr','operations','consulting','sales'] },
  { id: 'law',        label: 'Law',         emoji: '⚖️', match: ['law','legal','policy','compliance','judicial'] },
];

function matchesDomain(job, domainId) {
  if (domainId === 'all') return true;
  const dom = DOMAINS.find(d => d.id === domainId);
  if (!dom?.match) return true;
  const hay = `${job.field || ''} ${job.category || ''} ${job.title || ''}`.toLowerCase();
  return dom.match.some(kw => hay.includes(kw));
}

// ─── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Your Background',  icon: UserCheck     },
  { id: 2, label: 'Choose Career',    icon: Target        },
  { id: 3, label: 'Education',        icon: GraduationCap },
  { id: 4, label: 'Training',         icon: Code          },
  { id: 5, label: 'Experience',       icon: Briefcase     },
  { id: 6, label: 'Your Roadmap',     icon: Layers        },
];

// Life-stage types (matches AddJourney background field)
const LS_STUDENT  = 'student';
const LS_FRESHER  = 'fresher';
const LS_WORKING  = 'working';
const LS_SWITCHER = 'career-switcher';

const LIFE_STAGES = [
  {
    id: LS_STUDENT,
    emoji: '🎓',
    label: 'Still studying',
    desc: 'Currently in school, college, or university.',
    color: 'accent',
  },
  {
    id: LS_FRESHER,
    emoji: '🌱',
    label: 'Just graduated',
    desc: 'Finished education, looking for my first job.',
    color: 'brand-green',
  },
  {
    id: LS_WORKING,
    emoji: '💼',
    label: 'Currently working',
    desc: 'Employed and want to grow or explore new paths.',
    color: 'brand-amber',
  },
  {
    id: LS_SWITCHER,
    emoji: '🔄',
    label: 'Switching careers',
    desc: 'I have experience in another field and want to transition.',
    color: 'brand-purple',
  },
];


// ─── StepBar ───────────────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const done   = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex items-center flex-1 min-w-0">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all
              ${active ? 'bg-accent text-white' : done ? 'text-brand-green' : 'text-text-muted'}`}>
              {done ? <CheckCircle2 size={13}/> : <s.icon size={13}/>}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${done ? 'bg-brand-green/50' : 'bg-bg-border'}`}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SelectionCard ─────────────────────────────────────────────────────────────
function SelectionCard({ selected, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-100
        ${selected
          ? 'border-accent/70 bg-accent/8 shadow-[0_0_0_1px_rgba(99,102,241,0.3)]'
          : 'border-bg-border bg-bg-card hover:border-accent/30 hover:bg-bg-hover'
        } ${className}`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
          <CheckCircle2 size={12} className="text-white"/>
        </div>
      )}
      {children}
    </button>
  );
}

// ─── Share button ──────────────────────────────────────────────────────────────
function ShareButton({ slug }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const url = `${window.location.origin}/roadmap/${slug}`;
    try { await navigator.clipboard.writeText(url); }
    catch {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el);
      el.select(); document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <button onClick={handleCopy}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
        copied
          ? 'bg-brand-green/10 border-brand-green/40 text-brand-green'
          : 'bg-bg-card border-bg-border text-text-secondary hover:border-accent/50 hover:text-accent'
      }`}>
      {copied ? <Check size={12}/> : <Share2 size={12}/>}
      {copied ? 'Link copied!' : 'Share roadmap'}
    </button>
  );
}

// ─── Step 1: Choose Career ─────────────────────────────────────────────────────
function StepCareer({ selected, onSelect }) {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [q,       setQ]       = useState('');
  const [domain,  setDomain]  = useState('all');

  useEffect(() => {
    jobCardsApi.list({ limit: 60 })
      .then(r => setJobs(r?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const dm = matchesDomain(j, domain);
    const sm = !q || j.title.toLowerCase().includes(q.toLowerCase()) || j.category?.toLowerCase().includes(q.toLowerCase());
    return dm && sm;
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">What career do you want to build?</h2>
      <p className="text-text-muted text-sm mb-4">
        Browse by domain below — or search if you already know what you're looking for.
      </p>

      {/* Domain pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
        {DOMAINS.map(d => (
          <button
            key={d.id}
            onClick={() => { setDomain(d.id); setQ(''); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium flex-shrink-0 border transition-all
              ${domain === d.id
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-bg-card border-bg-border text-text-secondary hover:border-accent/40 hover:text-accent'}`}
          >
            <span>{d.emoji}</span>{d.label}
          </button>
        ))}
      </div>

      {/* Search (secondary) */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"/>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); if (e.target.value) setDomain('all'); }}
          placeholder="Or search any career (e.g. software, doctor, architect...)"
          className="input-field pl-9 w-full"
        />
      </div>

      {/* Domain result count */}
      {!loading && domain !== 'all' && !q && (
        <p className="text-text-muted text-xs mb-3 flex items-center gap-1.5">
          <span>{DOMAINS.find(d => d.id === domain)?.emoji}</span>
          {filtered.length} {DOMAINS.find(d => d.id === domain)?.label} careers
        </p>
      )}

      {loading
        ? <div className="flex justify-center py-16"><Spinner size={28}/></div>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
            {filtered.map(job => (
              <SelectionCard key={job.id} selected={selected?.id === job.id} onClick={() => onSelect(job)}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{job.icon || '💼'}</span>
                  <div className="min-w-0">
                    <p className="text-text-primary font-semibold text-sm truncate">{job.title}</p>
                    <p className="text-text-muted text-xs">{job.category} · {job.field}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap mt-1">
                  {job.is_remote_possible  && <span className="badge-blue text-[9px]">Remote</span>}
                  {job.is_freelance_viable && <span className="badge-purple text-[9px]">Freelance</span>}
                  {job.details?.india_demand_trend === 'growing' && <span className="badge-green text-[9px]">Growing</span>}
                </div>
                {job.details?.avg_time_to_first_job_months && (
                  <p className="text-text-muted text-[10px] mt-2 flex items-center gap-1">
                    <Clock size={9}/>{job.details.avg_time_to_first_job_months} months to first job
                  </p>
                )}
              </SelectionCard>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-10 text-text-muted text-sm">
                No careers found{domain !== 'all' ? ` in ${DOMAINS.find(d => d.id === domain)?.label}` : ` for "${q}"`}
              </div>
            )}
          </div>
        )
      }
    </div>
  );
}

// ─── Step 1: Your Background ───────────────────────────────────────────────────
function StepBackground({ background, onChange }) {
  const isSwitcher  = background.lifeStage === LS_SWITCHER;
  const isWorking   = background.lifeStage === LS_WORKING;
  const showExpPanel = isSwitcher || isWorking;
  const expMonths   = background.existingExpMonths || 0;

  const selectStage = (id) => {
    if (id === LS_SWITCHER || id === LS_WORKING) {
      onChange({ ...background, lifeStage: id });
    } else {
      onChange({ lifeStage: id, existingEduId: null, existingExpMonths: 0 });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">Where are you right now?</h2>
      <p className="text-text-muted text-sm mb-6">
        This helps us personalise your roadmap — timeline, context, and what you can skip.
      </p>

      {/* 4-option grid */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {LIFE_STAGES.map(stage => {
          const active = background.lifeStage === stage.id;
          return (
            <button
              key={stage.id}
              onClick={() => selectStage(stage.id)}
              className={`relative text-left p-5 rounded-2xl border transition-all hover:scale-[1.01]
                ${active
                  ? `border-${stage.color}/70 bg-${stage.color}/8 shadow-[0_0_0_1px_rgba(99,102,241,0.15)]`
                  : 'border-bg-border bg-bg-card hover:border-accent/30 hover:bg-bg-hover'
                }`}
            >
              {active && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                  <CheckCircle2 size={12} className="text-white"/>
                </div>
              )}
              <div className="text-3xl mb-2">{stage.emoji}</div>
              <p className="text-text-primary font-semibold text-sm mb-1">{stage.label}</p>
              <p className="text-text-secondary text-xs leading-relaxed">{stage.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Detail panel — shown for Switching careers OR Currently working */}
      {showExpPanel && (
        <div className="space-y-6 p-5 rounded-2xl border border-brand-purple/20 bg-brand-purple/5">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-brand-purple"/>
            <p className="text-text-primary font-semibold text-sm">Tell us what you already have</p>
            <span className="text-text-muted text-xs">— we'll only show what's left</span>
          </div>

          {/* Education picker — switcher only */}
          {isSwitcher && (
            <div>
              <p className="text-text-secondary text-xs font-medium mb-3">
                Do you already hold any of these qualifications?
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                <button
                  onClick={() => onChange({ ...background, existingEduId: null })}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all
                    ${!background.existingEduId
                      ? 'border-brand-purple/50 bg-brand-purple/10 text-brand-purple font-medium'
                      : 'border-bg-border bg-bg-card text-text-secondary hover:border-brand-purple/30'}`}
                >
                  ❌ None / Not relevant
                </button>
                {BASE_EDU.map(edu => (
                  <button
                    key={edu.id}
                    onClick={() => onChange({ ...background, existingEduId: edu.id })}
                    className={`text-left px-3 py-2.5 rounded-xl border text-xs transition-all
                      ${background.existingEduId === edu.id
                        ? 'border-brand-purple/50 bg-brand-purple/10 text-brand-purple font-medium'
                        : 'border-bg-border bg-bg-card text-text-secondary hover:border-brand-purple/30'}`}
                  >
                    {edu.icon} {edu.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Experience slider — switcher + working */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-xs font-medium">
                {isWorking
                  ? 'How many years of relevant work experience do you have?'
                  : 'How much relevant work experience do you have?'}
              </p>
              <span className="text-brand-purple font-bold text-sm tabular-nums">
                {expMonths === 0 ? 'None' : months2str(expMonths)}
              </span>
            </div>
            <input
              type="range" min={0} max={60} step={3}
              value={expMonths}
              onChange={e => onChange({ ...background, existingExpMonths: +e.target.value })}
              className="w-full accent-brand-purple"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>None</span><span>1 yr</span><span>2 yrs</span>
              <span>3 yrs</span><span>4 yrs</span><span>5 yrs</span>
            </div>
          </div>

          {/* Credit preview */}
          {(background.existingEduId || expMonths > 0) && (
            <div className="pt-2 border-t border-brand-purple/20">
              <p className="text-brand-purple text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 size={12}/>
                We'll credit: {[
                  background.existingEduId ? BASE_EDU.find(e => e.id === background.existingEduId)?.label : null,
                  expMonths > 0 ? `${months2str(expMonths)} of experience` : null,
                ].filter(Boolean).join(' + ')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Education ─────────────────────────────────────────────────────────
function StepEducation({ job, selected, onSelect, background }) {
  const [apiDegrees, setApiDegrees] = useState([]);

  useEffect(() => {
    if (!job?.id) return;
    educationApi.degrees(job.id)
      .then(r => setApiDegrees(r?.data || []))
      .catch(() => {});
  }, [job?.id]);

  const cards = BASE_EDU.map(e => {
    const apiMatch = apiDegrees.find(d =>
      d.degree_type?.toLowerCase().includes(e.id) ||
      (e.id === 'btech' && d.degree_type?.includes('B.Tech')) ||
      (e.id === 'mtech' && d.degree_type?.includes('M.Tech'))
    );
    return {
      ...e,
      relevance: apiMatch?.relevance_score || null,
      avg_salary: apiMatch?.avg_starting_salary_inr || null,
    };
  }).sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

  const alreadyHas = background?.lifeStage === LS_SWITCHER && background?.existingEduId;

  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">What's your education path?</h2>
      <p className="text-text-muted text-sm mb-2">
        Choose how you'll build your academic foundation for <span className="text-accent">{job?.title}</span>.
      </p>

      {alreadyHas && (
        <div className="mb-4 px-4 py-2.5 rounded-xl border border-brand-amber/30 bg-brand-amber/5 text-xs text-brand-amber flex items-center gap-2">
          <CheckCircle2 size={12}/>
          You said you already have <strong>{BASE_EDU.find(e => e.id === background.existingEduId)?.label}</strong>.
          If you pick the same path, we'll mark it as complete in your roadmap.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-hide">
        {cards.map(edu => {
          const alreadyComplete = alreadyHas && background.existingEduId === edu.id;
          return (
            <SelectionCard key={edu.id} selected={selected?.id === edu.id} onClick={() => onSelect(edu)}>
              <div className="flex items-start justify-between">
                <div className="text-3xl mb-2">{edu.icon}</div>
                {alreadyComplete && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/30">
                    ✓ You have this
                  </span>
                )}
              </div>
              <p className="text-text-primary font-semibold text-sm mb-0.5">{edu.label}</p>
              <p className="text-text-muted text-xs mb-2">{edu.subtitle}</p>
              <p className="text-text-secondary text-xs leading-relaxed mb-3">{edu.desc}</p>
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-text-muted">
                  <Clock size={9}/>
                  {alreadyComplete ? <s className="opacity-50">{months2str(edu.duration_months)}</s> : months2str(edu.duration_months)}
                  {alreadyComplete && <span className="ml-1 text-brand-green font-medium">Already done</span>}
                </span>
                <span className={`font-semibold ${edu.skill_coverage >= 80 ? 'text-brand-green' : edu.skill_coverage >= 65 ? 'text-brand-amber' : 'text-text-muted'}`}>
                  {edu.skill_coverage}% coverage
                </span>
              </div>
              {edu.relevance && (
                <div className="mt-2 h-1.5 bg-bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${Math.min(edu.relevance * 10, 100)}%` }}/>
                </div>
              )}
              {edu.avg_salary && (
                <p className="text-brand-green text-[10px] mt-1.5 font-medium">
                  Avg starting: ₹{(edu.avg_salary / 100000).toFixed(1)}L
                </p>
              )}
            </SelectionCard>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 4: Training ──────────────────────────────────────────────────────────
function StepTraining({ job, selected, onToggle }) {
  const skills = job?.skills || [];
  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">How will you train?</h2>
      <p className="text-text-muted text-sm mb-5">
        Pick all training methods you'll use to build skills for <span className="text-accent">{job?.title}</span>. Select as many as you like.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {TRAINING_TYPES.map(t => (
          <SelectionCard key={t.id} selected={selected.methods?.includes(t.id)} onClick={() => onToggle('method', t.id)}>
            <div className="text-2xl mb-2">{t.icon}</div>
            <p className="text-text-primary font-semibold text-sm mb-1">{t.label}</p>
            <p className="text-text-secondary text-xs leading-relaxed mb-2">{t.desc}</p>
            <span className="text-text-muted text-[10px] flex items-center gap-1"><Clock size={9}/>~{t.weeks} weeks</span>
          </SelectionCard>
        ))}
      </div>
      {skills.length > 0 && (
        <div>
          <p className="text-text-primary font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap size={14} className="text-accent"/>Skills to prioritise for {job?.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <button key={s.skill_name}
                onClick={() => onToggle('skill', s.skill_name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                  ${selected.skills?.includes(s.skill_name)
                    ? 'bg-accent/15 border-accent/50 text-accent'
                    : 'bg-bg-card border-bg-border text-text-secondary hover:border-accent/30'}`}>
                {s.is_core && <span className="mr-1 text-brand-green">●</span>}
                {s.skill_name}
                {s.learn_time_weeks && <span className="ml-1.5 opacity-60">{s.learn_time_weeks}w</span>}
              </button>
            ))}
          </div>
          <p className="text-text-muted text-[10px] mt-2">● Core skill</p>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Experience ────────────────────────────────────────────────────────
function StepExperience({ selected, onSelect }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-text-primary mb-1">How will you gain experience?</h2>
      <p className="text-text-muted text-sm mb-5">
        Pick your primary experience path. This is what bridges training to your first real job.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EXPERIENCE_OPTIONS.map(exp => (
          <SelectionCard key={exp.id} selected={selected?.id === exp.id} onClick={() => onSelect(exp)}>
            <div className="text-3xl mb-2">{exp.icon}</div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-text-primary font-semibold text-sm">{exp.label}</p>
            </div>
            {exp.badge && (
              <span className={`${exp.badgeColor} text-[9px] mb-2 inline-block`}>{exp.badge}</span>
            )}
            <p className="text-text-secondary text-xs leading-relaxed mb-3">{exp.desc}</p>
            {exp.months > 0 && (
              <span className="text-text-muted text-[10px] flex items-center gap-1">
                <Clock size={9}/>{months2str(exp.months)} typical duration
              </span>
            )}
          </SelectionCard>
        ))}
      </div>
    </div>
  );
}

// ─── Step 6: Final Roadmap ─────────────────────────────────────────────────────
function StepRoadmap({ job, education, training, experience, background, user, onSave, saved, shareSlug, compareSlug }) {

  // ── Progress tracking state ────────────────────────────────────────────────
  const [completedSteps, setCompletedSteps] = useState({});  // { "p0s0": true, ... }
  const [streak, setStreak] = useState(0);
  const [lastCheckin, setLastCheckin] = useState(null);
  const [savingProgress, setSavingProgress] = useState(false);

  // Load saved progress when slug is available
  useEffect(() => {
    if (!shareSlug || !user) return;
    roadmapProgressApi.get(shareSlug).then(res => {
      if (res.data) {
        const data = res.data;
        const map = {};
        (data.completed_steps || []).forEach(k => { map[k] = true; });
        setCompletedSteps(map);
        setStreak(data.streak_days || 0);
        setLastCheckin(data.last_checkin_at);
      }
    }).catch(() => {});
  }, [shareSlug, user]);

  const toggleStep = useCallback(async (key) => {
    if (!shareSlug || !user) return;
    const next = { ...completedSteps, [key]: !completedSteps[key] };
    if (!next[key]) delete next[key];
    setCompletedSteps(next);
    setSavingProgress(true);
    try {
      const res = await roadmapProgressApi.update(shareSlug, { completed_steps: Object.keys(next) });
      if (res.data) { setStreak(res.data.streak_days || 0); setLastCheckin(res.data.last_checkin_at); }
    } catch(e) { /* silent */ }
    setSavingProgress(false);
  }, [completedSteps, shareSlug, user]);

  const checkinToday = useCallback(async () => {
    if (!shareSlug || !user) return;
    setSavingProgress(true);
    try {
      const res = await roadmapProgressApi.update(shareSlug, { completed_steps: Object.keys(completedSteps) });
      if (res.data) { setStreak(res.data.streak_days || 0); setLastCheckin(res.data.last_checkin_at); }
    } catch(e) { /* silent */ }
    setSavingProgress(false);
  }, [completedSteps, shareSlug, user]);

  const totalStepCount   = useCallback(() => {
    // Count after phases are built — computed inline below
    return 0;
  }, []);

  // ── Raw durations ──────────────────────────────────────────────────────────
  const trainingWeeks = (training.methods || []).reduce((sum, mid) => {
    const t = TRAINING_TYPES.find(t => t.id === mid);
    return sum + (t?.weeks || 0);
  }, 0);
  const extraSkillWeeks = (training.skills || []).reduce((sum, sn) => {
    const s = job?.skills?.find(sk => sk.skill_name === sn);
    return sum + (s?.learn_time_weeks || 4);
  }, 0);
  const trainingMonths   = Math.ceil((trainingWeeks + extraSkillWeeks) / 4);
  const educationMonths  = education?.duration_months || 0;
  const experienceMonths = experience?.months || 0;
  const totalMonths      = educationMonths + trainingMonths + experienceMonths;

  // ── Gap analysis (career-switcher + working professionals) ────────────────
  const isSwitcher     = background?.lifeStage === LS_SWITCHER;
  const isWorking      = background?.lifeStage === LS_WORKING;
  const hasExisting    = isSwitcher || isWorking;
  const eduMatch       = isSwitcher && background?.existingEduId === education?.id;
  const creditedEdu    = eduMatch ? educationMonths : 0;
  const creditedExp    = hasExisting
    ? Math.min(background?.existingExpMonths || 0, experienceMonths)
    : 0;
  const creditedTotal  = creditedEdu + creditedExp;
  const remainingMonths = totalMonths - creditedTotal;
  const percentDone    = totalMonths > 0 ? Math.round((creditedTotal / totalMonths) * 100) : 0;
  const hasCredited    = creditedTotal > 0;

  // ── Phase definitions ──────────────────────────────────────────────────────
  const phases = [
    {
      phase: 'Education',
      icon: '🎓',
      duration: educationMonths,
      credited: creditedEdu,
      remaining: Math.max(0, educationMonths - creditedEdu),
      color: 'border-accent/40 bg-accent/5',
      dot: 'bg-accent',
      colorKey: 'accent',
      steps: [
        {
          title: education?.label || 'Degree / Qualification',
          desc: education?.desc || '',
          time: creditedEdu > 0
            ? `${months2str(creditedEdu)} credited · ${months2str(Math.max(0, educationMonths - creditedEdu))} remaining`
            : months2str(educationMonths),
        },
        { title: `Study core subjects for ${job?.title}`, desc: `Focus on curriculum relevant to ${job?.field}. Maintain 7.5+ CGPA for top placements.`, time: '' },
      ],
    },
    {
      phase: 'Training & Skills',
      icon: '⚡',
      duration: trainingMonths,
      credited: 0,
      remaining: trainingMonths,
      color: 'border-brand-amber/40 bg-brand-amber/5',
      dot: 'bg-brand-amber',
      colorKey: 'amber',
      steps: [
        ...(training.methods || []).map(mid => {
          const t = TRAINING_TYPES.find(t => t.id === mid);
          return { title: t?.label || mid, desc: t?.desc || '', time: `~${t?.weeks} weeks` };
        }),
        ...(training.skills || []).length > 0
          ? [{ title: 'Skill deep-dives', desc: `Focus: ${(training.skills || []).slice(0, 5).join(', ')}`, time: `${extraSkillWeeks} weeks total` }]
          : [],
      ],
    },
    {
      phase: 'Experience',
      icon: '💼',
      duration: experienceMonths,
      credited: creditedExp,
      remaining: Math.max(0, experienceMonths - creditedExp),
      color: 'border-brand-green/40 bg-brand-green/5',
      dot: 'bg-brand-green',
      colorKey: 'green',
      steps: [
        {
          title: experience?.label || 'Work Experience',
          desc: experience?.desc || '',
          time: creditedExp > 0
            ? `${months2str(creditedExp)} credited · ${months2str(Math.max(0, experienceMonths - creditedExp))} remaining`
            : months2str(experienceMonths),
        },
        { title: 'Build portfolio / GitHub / LinkedIn', desc: 'Document every project and result. Recruiters will evaluate this before your resume.', time: '' },
      ],
    },
    {
      phase: `First ${job?.title} Role`,
      icon: '🚀',
      duration: 2,
      credited: 0,
      remaining: 2,
      color: 'border-brand-purple/40 bg-brand-purple/5',
      dot: 'bg-brand-purple',
      colorKey: 'purple',
      steps: [
        { title: 'Job applications & networking', desc: 'Apply to 50+ companies. LinkedIn, Naukri, Referrals. Target MSMEs first for speed.', time: '4–8 weeks' },
        { title: 'Interview prep', desc: `Study ${job?.title}-specific interview questions. Practice DSA / domain-specific rounds.`, time: '2–4 weeks' },
        { title: `Land your first ${job?.title} offer`, desc: `Negotiate salary based on the ₹${job?.salary_bands?.[0] ? `${(job.salary_bands[0].sal_min/100000).toFixed(0)}L–${(job.salary_bands[0].sal_max/100000).toFixed(0)}L` : 'market'} band.`, time: '' },
      ],
    },
  ].filter(p => p.steps.length > 0);

  // Compute timeline offsets based on *remaining* durations
  let cumulative = 0;
  const timeline = phases.map(p => {
    const start = cumulative;
    cumulative += p.remaining || (p.credited > 0 ? 0 : 2);
    return { ...p, start, end: cumulative };
  });

  const colorsBar = ['bg-accent', 'bg-brand-amber', 'bg-brand-green', 'bg-brand-purple'];

  // ── Salary projections for parent view ──────────────────────────────────────
  const d = job?.details || {};
  const topBand = job?.salary_bands?.[0];
  const startSalL  = topBand ? (topBand.sal_min / 100000).toFixed(1) : null;
  const midSalL    = topBand ? ((topBand.sal_max * 1.8) / 100000).toFixed(0) : null;
  const seniorSalL = topBand ? ((topBand.sal_max * 3.2) / 100000).toFixed(0) : null;

  // ── Summary stat cards (pre-computed to avoid inline ternary+map in JSX) ───
  const statItems = hasCredited
    ? [
        { label: 'Time Remaining', val: months2str(remainingMonths), icon: Clock,        color: 'text-brand-amber', highlight: true },
        { label: 'Already Done',   val: months2str(creditedTotal),   icon: CheckCircle2,  color: 'text-brand-green'                },
        { label: 'Training',       val: months2str(trainingMonths),  icon: Zap,           color: 'text-accent'                     },
        { label: 'Full Timeline',  val: months2str(totalMonths),     icon: TrendingUp,    color: 'text-text-muted'                 },
      ]
    : [
        { label: 'Total Time',  val: months2str(totalMonths),     icon: Clock,         color: 'text-accent'        },
        { label: 'Education',   val: months2str(educationMonths), icon: GraduationCap, color: 'text-brand-amber'   },
        { label: 'Training',    val: months2str(trainingMonths),  icon: Zap,           color: 'text-brand-green'   },
        { label: 'Experience',  val: months2str(experienceMonths),icon: Briefcase,     color: 'text-brand-purple'  },
      ];

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Your personalised roadmap</h2>
          <p className="text-text-muted text-sm mt-0.5">
            {job?.title} · via {education?.label} + {(training.methods || []).length} training methods
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {shareSlug && <ShareButton slug={shareSlug}/>}
          {!saved
            ? <button onClick={onSave} className="btn-primary text-xs flex items-center gap-1.5">
                <Star size={13}/>{user ? 'Save to Goals' : 'Sign in to Save'}
              </button>
            : <span className="flex items-center gap-1.5 text-brand-green text-xs font-medium px-3 py-2 rounded-xl bg-brand-green/10 border border-brand-green/30">
                <CheckCircle2 size={13}/>Saved to Goals
              </span>
          }
        </div>
      </div>

      {/* ── ROADMAP ─────────────────────────────────────────────────────────── */}
      {(<>

      {/* ── Compare mode banner ── */}
      {compareSlug && shareSlug && (
        <div className="mb-5 p-4 rounded-2xl border border-brand-purple/40 bg-brand-purple/8 flex flex-col sm:flex-row items-center gap-4">
          <div className="text-2xl flex-shrink-0">⚖️</div>
          <div className="flex-1">
            <p className="text-text-primary font-semibold text-sm">Path B ready — see comparison now</p>
            <p className="text-text-muted text-xs mt-0.5">
              You built this as a comparison path. Click to view both roadmaps side by side.
            </p>
          </div>
          <Link
            to={`/compare/${compareSlug}/${shareSlug}`}
            className="btn-primary text-xs flex-shrink-0 flex items-center gap-1.5"
          >
            <GitCompare size={13}/>View Comparison
          </Link>
        </div>
      )}

      {/* ── Career Switcher Advantage Banner ── */}
      {hasCredited && (
        <div className="mb-5 p-4 rounded-2xl border border-brand-amber/40 bg-brand-amber/8 flex items-center gap-4">
          {/* Progress ring */}
          <div className="relative flex-shrink-0 w-16 h-16">
            <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f59e0b" strokeWidth="3"
                strokeDasharray={`${(percentDone / 100) * 97.4} 97.4`}
                strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-brand-amber font-bold text-sm">{percentDone}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text-primary font-semibold text-sm">You're already {percentDone}% there! 🎯</p>
            <p className="text-text-muted text-xs mt-0.5 leading-relaxed">
              We've credited your{' '}
              {[
                creditedEdu > 0 ? `${education?.label} (${months2str(creditedEdu)})` : null,
                creditedExp > 0 ? `${months2str(creditedExp)} of experience` : null,
              ].filter(Boolean).join(' + ')}.
              {' '}You only need <strong className="text-brand-amber">{months2str(remainingMonths)} more</strong> instead of {months2str(totalMonths)}.
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {statItems.map(({ label, val, icon: Icon, color, highlight }) => (
          <div key={label} className={`card p-4 text-center ${highlight ? 'border-brand-amber/30 bg-brand-amber/5' : ''}`}>
            <Icon size={18} className={`${color} mx-auto mb-2`}/>
            <p className={`font-bold text-sm ${highlight ? 'text-brand-amber' : 'text-text-primary'}`}>{val}</p>
            <p className="text-text-muted text-[10px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Visual timeline bar */}
      <div className="relative mb-6">
        {hasCredited && (
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-sm bg-bg-border border border-bg-border opacity-50"/>
            <span className="text-text-muted text-[10px]">Already completed</span>
            <div className="w-3 h-3 rounded-sm bg-accent ml-3"/>
            <span className="text-text-muted text-[10px]">Remaining</span>
          </div>
        )}
        <div className="flex h-6 rounded-xl overflow-hidden gap-px">
          {phases.map((p, i) => {
            const totalW = Math.max(((p.duration || 2) / (totalMonths || 1)) * 100, 5);
            const creditW = p.duration > 0 ? (p.credited / p.duration) * totalW : 0;
            const remW    = totalW - creditW;
            return (
              <div key={i} style={{ width: `${totalW}%` }} className="flex flex-shrink-0">
                {creditW > 0 && (
                  <div style={{ width: `${creditW / totalW * 100}%` }}
                    className="bg-bg-border opacity-60 flex items-center justify-center text-[8px] text-text-muted"
                    title={`${p.phase} · Already done`}>
                    ✓
                  </div>
                )}
                {remW > 0 && (
                  <div style={{ width: `${remW / totalW * 100}%` }}
                    className={`${colorsBar[i]} flex items-center justify-center text-white text-[9px] font-semibold`}
                    title={`${p.phase} · ${months2str(p.remaining)}`}>
                    {p.icon}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-text-muted mt-1">
          <span>Month 0</span>
          {hasCredited && creditedTotal > 0 && (
            <span className="text-brand-amber">↑ {months2str(creditedTotal)} credited</span>
          )}
          <span>Month {remainingMonths}</span>
        </div>
      </div>

      {/* ── Living document: streak + progress bar ──────────────────────────── */}
      {user && shareSlug && (() => {
        const allKeys = timeline.flatMap((ph, pi) => ph.steps.map((_, si) => `p${pi}s${si}`));
        const doneCount = allKeys.filter(k => completedSteps[k]).length;
        const pct = allKeys.length > 0 ? Math.round((doneCount / allKeys.length) * 100) : 0;
        const todayCheckedIn = lastCheckin && new Date(lastCheckin).toDateString() === new Date().toDateString();
        return (
          <div className="card p-4 border border-brand-purple/30 bg-brand-purple/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {streak > 0 ? `${streak}-day streak` : 'Start your streak'}
                  </p>
                  <p className="text-xs text-text-muted">
                    {doneCount} of {allKeys.length} steps done · {pct}% complete
                  </p>
                </div>
              </div>
              {!todayCheckedIn && (
                <button
                  onClick={checkinToday}
                  disabled={savingProgress}
                  className="btn-sm bg-brand-purple/15 hover:bg-brand-purple/25 text-brand-purple border border-brand-purple/30 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {savingProgress ? '…' : '✓ Check in today'}
                </button>
              )}
              {todayCheckedIn && (
                <span className="text-xs text-brand-green font-medium flex items-center gap-1">
                  <CheckCircle2 size={13}/> Checked in
                </span>
              )}
            </div>
            {/* overall progress bar */}
            <div className="h-1.5 bg-bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-purple rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })()}

      {/* Phase-by-phase breakdown */}
      <div className="space-y-4">
        {timeline.map((phase, pi) => {
          const isFullyDone = phase.credited === phase.duration && phase.duration > 0;
          return (
            <div key={pi} className={`card p-5 border transition-all ${
              isFullyDone ? 'border-brand-green/30 bg-brand-green/5 opacity-80' : phase.color
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{phase.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-text-primary font-semibold text-sm">{phase.phase}</p>
                      {isFullyDone && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/30">
                          ✓ Already complete
                        </span>
                      )}
                      {!isFullyDone && phase.credited > 0 && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-brand-amber/15 text-brand-amber border border-brand-amber/30">
                          {months2str(phase.credited)} credited
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs">
                      {isFullyDone
                        ? `Completed · ${months2str(phase.duration)} credited`
                        : phase.credited > 0
                          ? `${months2str(phase.remaining)} remaining (of ${months2str(phase.duration)})`
                          : `Month ${phase.start}–${phase.end}`
                      }
                    </p>
                  </div>
                </div>
                <span className={`badge-gray text-xs flex items-center gap-1 ${isFullyDone ? 'text-brand-green' : ''}`}>
                  <Clock size={10}/>{isFullyDone ? months2str(phase.duration) : months2str(phase.remaining || 2)}
                </span>
              </div>

              {/* Progress bar for partial credit */}
              {phase.credited > 0 && phase.duration > 0 && (
                <div className="mb-4">
                  <div className="h-1.5 bg-bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-green rounded-full transition-all"
                      style={{ width: `${Math.min((phase.credited / phase.duration) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-brand-green mt-1">
                    {Math.round((phase.credited / phase.duration) * 100)}% complete
                  </p>
                </div>
              )}

              <div className={`space-y-3 ${isFullyDone ? 'opacity-60' : ''}`}>
                {phase.steps.map((step, si) => {
                  const stepKey = `p${pi}s${si}`;
                  const isDone = isFullyDone || !!completedSteps[stepKey];
                  return (
                    <div key={si} className="flex gap-3">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                        {user && shareSlug ? (
                          <button
                            onClick={() => toggleStep(stepKey)}
                            className={`w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all cursor-pointer ${
                              isDone
                                ? 'border-brand-green bg-brand-green'
                                : 'border-text-muted hover:border-brand-purple bg-transparent'
                            }`}
                            title={isDone ? 'Mark incomplete' : 'Mark done'}
                          >
                            {isDone && <Check size={9} className="text-white stroke-[3]"/>}
                          </button>
                        ) : (
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDone ? 'bg-brand-green' : phase.dot}`}/>
                        )}
                        {si < phase.steps.length - 1 && <div className="w-px flex-1 bg-bg-border"/>}
                      </div>
                      <div className="pb-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium transition-all ${isDone ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                            {step.title}
                          </p>
                          {step.time && (
                            <span className="text-text-muted text-[10px] flex-shrink-0 flex items-center gap-0.5">
                              <Clock size={9}/>{step.time}
                            </span>
                          )}
                        </div>
                        {step.desc && <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">{step.desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Salary & Market snapshot — always shown ──────────────────────── */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">

        {/* Earning trajectory — experience-wise salary ladder */}
        <div className="card p-5">
          <h3 className="text-text-primary font-semibold text-sm mb-1 flex items-center gap-2">
            <TrendingUp size={15} className="text-brand-green"/>Earning Potential
          </h3>
          <p className="text-text-muted text-[10px] mb-4">Typical salary at each career stage for {job?.title}</p>

          <div className="space-y-3">
            {[
              {
                stage: 'Entry Level',
                exp: '0–2 yrs',
                icon: '🌱',
                val: startSalL ? `₹${startSalL}L / yr` : 'Data coming soon',
                bar: 25,
                color: 'bg-accent',
                textColor: 'text-accent',
              },
              {
                stage: 'Mid Level',
                exp: '3–6 yrs',
                icon: '📈',
                val: midSalL ? `₹${midSalL}L+ / yr` : '—',
                bar: 55,
                color: 'bg-brand-green',
                textColor: 'text-brand-green',
              },
              {
                stage: 'Senior / Lead',
                exp: '7–12 yrs',
                icon: '🚀',
                val: seniorSalL ? `₹${seniorSalL}L+ / yr` : '—',
                bar: 85,
                color: 'bg-brand-amber',
                textColor: 'text-brand-amber',
              },
            ].map(({ stage, exp, icon, val, bar, color, textColor }) => (
              <div key={stage}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-text-secondary text-xs flex items-center gap-1.5">
                    {icon} <span className="font-medium text-text-primary">{stage}</span>
                    <span className="text-text-muted">· {exp}</span>
                  </span>
                  <span className={`font-bold text-xs ${textColor}`}>{val}</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-border overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${bar}%` }}/>
                </div>
              </div>
            ))}
          </div>
          <p className="text-text-muted text-[9px] mt-3">* Based on market data. Varies by city, company &amp; performance.</p>
        </div>

        {/* Market outlook + job context */}
        <div className="card p-5">
          <h3 className="text-text-primary font-semibold text-sm mb-4">Market Outlook</h3>
          <div className="space-y-2.5 text-xs">
            {[
              { label: 'India Demand',     val: d.india_demand_trend || 'N/A', icon: '📈' },
              { label: 'Job Security',     val: d.job_security       || 'N/A', icon: '🛡️' },
              { label: 'Growth Potential', val: d.growth_potential   || 'N/A', icon: '🚀' },
              { label: 'Automation Risk',  val: d.automation_risk    || 'N/A', icon: '🤖' },
            ].map(({ label, val, icon }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-1.5">{icon} {label}</span>
                <span className={`font-semibold capitalize px-2 py-0.5 rounded-lg text-[10px]
                  ${val === 'N/A'
                    ? 'bg-bg-border text-text-muted'
                    : val === 'low' || val === 'growing' || val === 'high'
                      ? 'bg-brand-green/15 text-brand-green'
                      : val === 'medium' || val === 'stable'
                        ? 'bg-brand-amber/15 text-brand-amber'
                        : 'bg-brand-rose/15 text-brand-rose'}`}>
                  {val}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <span className="text-text-muted flex items-center gap-1.5">🌐 Remote Work</span>
              <span className={`font-semibold text-[10px] px-2 py-0.5 rounded-lg
                ${job?.is_remote_possible
                  ? 'bg-brand-green/15 text-brand-green'
                  : 'bg-bg-border text-text-muted'}`}>
                {job?.is_remote_possible ? 'Available' : 'Typically on-site'}
              </span>
            </div>
            {d.avg_time_to_first_job_months && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-1.5">⏱️ Avg. time to first job</span>
                <span className="font-semibold text-text-secondary text-[10px]">{d.avg_time_to_first_job_months} months</span>
              </div>
            )}
            {job?.is_freelance_viable && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-1.5">💼 Freelance</span>
                <span className="font-semibold text-brand-green text-[10px] bg-brand-green/15 px-2 py-0.5 rounded-lg">Viable</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mentor booking CTA — prominent */}
      <div className="mt-6 p-5 rounded-2xl border border-brand-purple/30 bg-brand-purple/5 flex flex-col sm:flex-row items-center gap-4">
        <div className="text-3xl flex-shrink-0">🎯</div>
        <div className="flex-1">
          <p className="text-text-primary font-semibold">Want a mentor who took this exact path?</p>
          <p className="text-text-muted text-xs mt-0.5">
            Book a 30-min career clarity call. Get personalised advice, not a generic roadmap.
          </p>
        </div>
        <Link to={`/mentors?job=${job?.slug}`} className="btn-primary text-xs flex-shrink-0 flex items-center gap-1.5">
          <Users size={13}/>Book a Clarity Call <ArrowRight size={11}/>
        </Link>
      </div>

      {/* Secondary CTA */}
      <div className="mt-3 card p-4 flex flex-col sm:flex-row items-center gap-3 bg-accent/5 border-accent/20">
        <div className="flex-1">
          <p className="text-text-muted text-xs">Explore career details, salary data, and employer list</p>
        </div>
        <Link to={`/career/${job?.slug}`} className="btn-secondary text-xs flex items-center gap-1.5">
          <BookOpen size={13}/>View Full Career Page
        </Link>
      </div>

      {/* Compare + Shareable link */}
      {shareSlug && (
        <>
          {/* Compare banner */}
          <div className="mt-4 p-4 rounded-2xl border border-brand-purple/30 bg-brand-purple/5 flex flex-col sm:flex-row items-center gap-4">
            <div className="text-2xl flex-shrink-0">⚖️</div>
            <div className="flex-1">
              <p className="text-text-primary font-semibold text-sm">Compare with another path</p>
              <p className="text-text-muted text-xs mt-0.5">
                Build a second roadmap and see them side by side — time, salary, and phases.
              </p>
            </div>
            <Link
              to={`/build-roadmap?compare=${shareSlug}`}
              className="btn-secondary text-xs flex-shrink-0 flex items-center gap-1.5"
            >
              <GitCompare size={13}/>Compare paths
            </Link>
          </div>

          {/* Shareable link pill */}
          <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-bg-border">
            <Share2 size={13} className="text-accent flex-shrink-0"/>
            <p className="text-text-muted text-xs flex-1 truncate">
              Shareable link: <span className="text-accent font-mono">/roadmap/{shareSlug}</span>
            </p>
            <Link to={`/roadmap/${shareSlug}`}
              className="text-accent text-xs font-medium hover:underline flex-shrink-0 flex items-center gap-1">
              Open <ArrowRight size={11}/>
            </Link>
          </div>
        </>
      )}

      {/* Re-engagement nudge for logged-in users away too long */}
      {user && shareSlug && lastCheckin && (() => {
        const daysSince = Math.round((Date.now() - new Date(lastCheckin).getTime()) / 86400000);
        if (daysSince < 2) return null;
        return (
          <div className="mt-4 p-4 rounded-2xl border border-brand-amber/30 bg-brand-amber/5 flex flex-col sm:flex-row items-center gap-4">
            <div className="text-2xl flex-shrink-0">⏰</div>
            <div className="flex-1">
              <p className="text-text-primary font-semibold text-sm">
                {daysSince === 1 ? 'You checked in yesterday' : `Last visit ${daysSince} days ago`}
              </p>
              <p className="text-text-muted text-xs mt-0.5">
                {streak > 0 ? `Your ${streak}-day streak is at risk.` : 'Pick up where you left off.'} Check off a step to get back on track.
              </p>
            </div>
            <button
              onClick={checkinToday}
              disabled={savingProgress}
              className="btn-primary text-xs flex-shrink-0 flex items-center gap-1.5 disabled:opacity-50"
            >
              🔥 Resume streak
            </button>
          </div>
        );
      })()}

      {/* Guest conversion nudge */}
      {!user && (
        <div className="mt-4 p-4 rounded-2xl border border-brand-amber/30 bg-brand-amber/5 flex flex-col sm:flex-row items-center gap-4">
          <div className="text-2xl flex-shrink-0">🔓</div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-text-primary font-semibold text-sm">Save this roadmap + track your progress</p>
            <p className="text-text-muted text-xs mt-0.5">
              Create a free account to check off steps, build a streak, and get reminders when you're falling behind.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link to="/register" className="btn-primary text-xs">Create free account</Link>
            <Link to="/login" className="btn-ghost text-xs">Sign in</Link>
          </div>
        </div>
      )}
      </>)}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function BuildRoadmap() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();

  const [step,       setStep]       = useState(1);
  const [job,        setJob]        = useState(null);
  const [background, setBackground] = useState({ lifeStage: LS_FRESHER, existingEduId: null, existingExpMonths: 0 });
  const [education,  setEducation]  = useState(null);
  const [training,   setTraining]   = useState({ methods: [], skills: [] });
  const [experience, setExperience] = useState(null);
  const [saved,      setSaved]      = useState(false);
  const [saving,     setSaving]     = useState(false);

  // Read ?compare=slug1 from query params — if set, after finishing we go to compare page
  const [compareSlug, setCompareSlug] = useState(null);

  // Pre-fill from query params (?edu=btech&exp=internship&compare=slug1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const eduId = p.get('edu');
    const expId = p.get('exp');
    const cmp   = p.get('compare');
    if (eduId)  { const e = BASE_EDU.find(x => x.id === eduId); if (e) setEducation(e); }
    if (expId)  { const e = EXP_OPTS.find(x => x.id === expId); if (e) setExperience(e); }
    if (cmp)    setCompareSlug(cmp);
  }, []);

  // Shareable slug (steps 1–5 complete)
  const shareSlug = (job && education && training.methods.length > 0 && experience)
    ? encodeRoadmapSlug(job, education, training, experience)
    : null;

  const canNext = () => {
    if (step === 1) return !!background.lifeStage; // always true — has default
    if (step === 2) return !!job;
    if (step === 3) return !!education;
    if (step === 4) return training.methods.length > 0;
    if (step === 5) return !!experience;
    return false;
  };

  const handleTrainingToggle = useCallback((type, value) => {
    if (type === 'method') {
      setTraining(t => ({
        ...t,
        methods: t.methods.includes(value) ? t.methods.filter(m => m !== value) : [...t.methods, value],
      }));
    } else {
      setTraining(t => ({
        ...t,
        skills: t.skills.includes(value) ? t.skills.filter(s => s !== value) : [...t.skills, value],
      }));
    }
  }, []);

  const handleSaveToGoals = async () => {
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    const trainingWeeks = (training.methods || []).reduce((s, mid) => {
      const t = TRAINING_TYPES.find(t => t.id === mid);
      return s + (t?.weeks || 0);
    }, 0);
    const total = (education?.duration_months || 0) +
                  Math.ceil(trainingWeeks / 4) +
                  (experience?.months || 0);
    try {
      await goalsApi.create({
        title: `Become a ${job.title}`,
        category: 'Career',
        priority: 'high',
        notes: `Path: ${education?.label} → ${(training.methods || []).map(m => TRAINING_TYPES.find(t=>t.id===m)?.label).join(', ')} → ${experience?.label}. Estimated total time: ${months2str(total)}.`,
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep(1); setJob(null);
    setBackground({ lifeStage: LS_FRESHER, existingEduId: null, existingExpMonths: 0 });
    setEducation(null); setTraining({ methods: [], skills: [] });
    setExperience(null); setSaved(false);
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Layers size={22} className="text-accent"/>Build My Roadmap
          </h1>
          <p className="text-text-muted text-sm mt-1">Create a personalised career plan step by step</p>
        </div>
        {step > 2 && (
          <button onClick={reset} className="btn-ghost text-xs flex items-center gap-1.5 text-text-muted">
            <RotateCcw size={13}/>Start over
          </button>
        )}
      </div>

      <StepBar current={step}/>

      <div className="card p-6 min-h-[480px]">
        {step === 1 && <StepBackground background={background} onChange={setBackground}/>}
        {step === 2 && <StepCareer    selected={job}         onSelect={setJob}/>}
        {step === 3 && <StepEducation  job={job}             selected={education}    onSelect={setEducation} background={background}/>}
        {step === 4 && <StepTraining   job={job}             selected={training}     onToggle={handleTrainingToggle}/>}
        {step === 5 && <StepExperience selected={experience} onSelect={setExperience}/>}
        {step === 6 && (
          <StepRoadmap
            job={job} education={education} training={training}
            experience={experience} background={background}
            user={user} onSave={handleSaveToGoals}
            saved={saved} shareSlug={shareSlug} compareSlug={compareSlug}
          />
        )}
      </div>

      {/* Navigation */}
      {step < 6 && (
        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="btn-ghost text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={15}/>Back
          </button>

          <div className="flex gap-1.5">
            {STEPS.map(s => (
              <div key={s.id} className={`w-1.5 h-1.5 rounded-full transition-all
                ${s.id === step ? 'bg-accent w-4' : s.id < step ? 'bg-accent/40' : 'bg-bg-border'}`}/>
            ))}
          </div>

          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            {step === 5 ? 'Build My Roadmap 🚀' : 'Next'}
            <ChevronRight size={15}/>
          </button>
        </div>
      )}
    </div>
  );
}
