/**
 * Shared roadmap-building utilities.
 * Pure JS — no React. Works on both server (SSR) and client.
 */

// ─── Static data ──────────────────────────────────────────────────────────────

export const BASE_EDU = [
  {
    id: 'btech', label: 'B.Tech / B.E.', subtitle: 'Engineering Degree',
    icon: '🎓', duration_months: 48, type: 'degree',
    desc: '4-year undergraduate engineering programme. Best for structured learning and campus placements.',
    skill_coverage: 85,
  },
  {
    id: 'bsc', label: 'B.Sc / BCA', subtitle: 'Science / Computer Applications',
    icon: '🔬', duration_months: 36, type: 'degree',
    desc: '3-year undergraduate degree. Good base for IT and data roles, especially from tier-1 colleges.',
    skill_coverage: 70,
  },
  {
    id: 'mtech', label: 'M.Tech / M.S.', subtitle: 'Postgraduate Engineering',
    icon: '🏛️', duration_months: 24, type: 'degree',
    desc: '2-year postgraduate degree. Opens research and senior engineering roles faster.',
    skill_coverage: 92,
  },
  {
    id: 'mba', label: 'MBA', subtitle: 'Business Administration',
    icon: '💼', duration_months: 24, type: 'degree',
    desc: 'Best for product, consulting, and leadership tracks. IIM/ISB fast-tracks to senior roles.',
    skill_coverage: 75,
  },
  {
    id: 'diploma', label: 'Diploma / Polytechnic', subtitle: '3-Year Technical Diploma',
    icon: '📜', duration_months: 36, type: 'diploma',
    desc: 'Vocational 3-year programme. Strong hands-on training, good for manufacturing & IT roles.',
    skill_coverage: 65,
  },
  {
    id: 'bootcamp', label: 'Bootcamp / Intensive Course', subtitle: '3–6 months',
    icon: '⚡', duration_months: 5, type: 'bootcamp',
    desc: 'Fast-paced coding or skill bootcamp. Best ROI for career switchers into tech.',
    skill_coverage: 60,
  },
  {
    id: 'self', label: 'Self-Taught / Online Courses', subtitle: '6–18 months',
    icon: '🌐', duration_months: 12, type: 'self',
    desc: 'YouTube + Udemy + projects. Zero cost, portfolio-driven. Works best in tech and design.',
    skill_coverage: 55,
  },
  {
    id: 'certification', label: 'Professional Certifications', subtitle: '3–12 months',
    icon: '🏅', duration_months: 6, type: 'cert',
    desc: 'Industry certs (AWS, CFA, PMP, CISSP). Fastest way to validate skills employers trust.',
    skill_coverage: 72,
  },
];

export const TRAINING_TYPES = [
  { id: 'online',    label: 'Online Courses',         icon: '💻', weeks: 8,  desc: 'Structured video courses on Udemy, Coursera, etc.' },
  { id: 'coaching',  label: 'Coaching / Mentorship',  icon: '🧑‍🏫', weeks: 12, desc: 'Live sessions with an industry expert (1-on-1 or group).' },
  { id: 'project',   label: 'Personal Projects',      icon: '🛠️', weeks: 10, desc: 'Build real-world projects to demonstrate skills.' },
  { id: 'hackathon', label: 'Hackathons / Contests',  icon: '🏆', weeks: 2,  desc: 'Intense competitive events to fast-track skills.' },
  { id: 'workshop',  label: 'Workshops & Bootcamps',  icon: '⚡', weeks: 6,  desc: 'Intensive in-person or live online deep-dives.' },
  { id: 'research',  label: 'Research / Papers',      icon: '📚', weeks: 16, desc: 'Academic research to deepen expertise (best for senior roles).' },
];

export const EXPERIENCE_OPTIONS = [
  {
    id: 'internship',  label: 'Internship',                  icon: '🏢',
    months: 6,  desc: 'Paid or unpaid internship at a company. Best first exposure to real work.',
    badge: 'Recommended for freshers', badgeColor: 'badge-green',
  },
  {
    id: 'freelance',   label: 'Freelance Projects',          icon: '🌍',
    months: 8,  desc: 'Take client projects on Upwork, Fiverr, or via referrals. Build income while learning.',
    badge: 'High income potential', badgeColor: 'badge-purple',
  },
  {
    id: 'contract',    label: 'Contract / Consulting',       icon: '📋',
    months: 6,  desc: 'Short-term contracts with startups. Varied exposure, good for fast-learners.',
    badge: null,
  },
  {
    id: 'open_source', label: 'Open Source Contributions',   icon: '🔓',
    months: 4,  desc: 'Contribute to GitHub projects. Builds portfolio and community reputation.',
    badge: 'Great for tech roles', badgeColor: 'badge-blue',
  },
  {
    id: 'own_startup', label: 'Build Your Own Product',      icon: '🚀',
    months: 12, desc: 'Build and launch your own side project or startup. Ultimate portfolio.',
    badge: 'High risk, high reward', badgeColor: 'badge-amber',
  },
  {
    id: 'fulltime',    label: 'Direct Full-Time Entry',      icon: '💼',
    months: 0,  desc: 'Apply directly to junior roles after studies. Works best with strong portfolio.',
    badge: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function months2str(m) {
  if (!m) return '0 months';
  const y = Math.floor(m / 12), mo = m % 12;
  return [y && `${y} yr`, mo && `${mo} mo`].filter(Boolean).join(' ');
}

// ─── URL encoding / decoding ──────────────────────────────────────────────────

/**
 * Encode selections into a URL-safe slug.
 * Format: {careerSlug}--{eduId}--{trainingIds joined by '.'}--{experienceId}
 */
export function encodeRoadmapSlug(job, education, training, experience) {
  const trainingStr = (training?.methods ?? []).join('.');
  return `${job.slug}--${education.id}--${trainingStr || 'online'}--${experience.id}`;
}

/**
 * Decode a slug back into selection params.
 * Returns null if the slug is malformed.
 */
export function decodeRoadmapSlug(slug) {
  const parts = slug.split('--');
  if (parts.length < 4) return null;
  return {
    careerSlug:   parts[0],
    eduId:        parts[1],
    trainingIds:  parts[2].split('.').filter(Boolean),
    experienceId: parts[3],
  };
}

// ─── Roadmap computation ──────────────────────────────────────────────────────

/**
 * Build the complete roadmap data object from selections.
 * Accepts an optional `background` object to apply gap analysis:
 *   background.lifeStage        — 'student' | 'fresher' | 'working' | 'career-switcher'
 *   background.existingEduId    — edu id the user already holds (career-switcher only)
 *   background.existingExpMonths — months of existing relevant experience
 *
 * Returns phases (for rendering), totals, credited amounts, and remaining totals.
 */
export function buildRoadmapData(job, education, training, experience, background) {
  const methods = training?.methods ?? [];
  const skills  = training?.skills  ?? [];

  const trainingWeeks   = methods.reduce((sum, mid) => {
    const t = TRAINING_TYPES.find(t => t.id === mid);
    return sum + (t?.weeks ?? 0);
  }, 0);
  const extraSkillWeeks = skills.reduce((sum, sn) => {
    const s = job?.skills?.find(sk => sk.skill_name === sn);
    return sum + (s?.learn_time_weeks ?? 4);
  }, 0);

  const trainingMonths   = Math.ceil((trainingWeeks + extraSkillWeeks) / 4);
  const educationMonths  = education?.duration_months ?? 0;
  const experienceMonths = experience?.months ?? 0;
  const totalMonths      = educationMonths + trainingMonths + experienceMonths;

  // ── Gap analysis ────────────────────────────────────────────────────────────
  const lifeStage    = background?.lifeStage ?? 'fresher';
  const isSwitcher   = lifeStage === 'career-switcher';
  const isWorking    = lifeStage === 'working';
  const hasExisting  = isSwitcher || isWorking;

  const eduMatch     = isSwitcher && background?.existingEduId === education?.id;
  const creditedEdu  = eduMatch ? educationMonths : 0;
  const creditedExp  = hasExisting
    ? Math.min(background?.existingExpMonths ?? 0, experienceMonths)
    : 0;
  const creditedTotal  = creditedEdu + creditedExp;
  const remainingTotal = totalMonths - creditedTotal;

  // ── Phase construction ──────────────────────────────────────────────────────
  const eduRemaining = Math.max(0, educationMonths - creditedEdu);
  const expRemaining = Math.max(0, experienceMonths - creditedExp);

  const phases = [
    // Education — omit entirely if fully credited
    educationMonths > 0 && {
      phase: 'Education',
      icon: '🎓',
      duration: educationMonths,
      credited: creditedEdu,
      remaining: eduRemaining,
      colorClass: 'border-accent/40 bg-accent/5',
      dotClass: 'bg-accent',
      steps: [
        {
          title: education?.label ?? 'Degree / Qualification',
          desc: education?.desc ?? '',
          time: creditedEdu > 0
            ? `${months2str(creditedEdu)} credited · ${months2str(eduRemaining)} remaining`
            : months2str(educationMonths),
        },
        eduRemaining > 0 && {
          title: `Study core subjects for ${job?.title ?? 'your career'}`,
          desc: `Focus on curriculum relevant to ${job?.field ?? 'your domain'}. Maintain 7.5+ CGPA for top placements.`,
          time: '',
        },
      ].filter(Boolean),
    },

    // Training — never credited (skills stay current)
    trainingMonths > 0 && {
      phase: 'Training & Skills',
      icon: '⚡',
      duration: trainingMonths,
      credited: 0,
      remaining: trainingMonths,
      colorClass: 'border-brand-amber/40 bg-brand-amber/5',
      dotClass: 'bg-brand-amber',
      steps: [
        ...methods.map(mid => {
          const t = TRAINING_TYPES.find(t => t.id === mid);
          return { title: t?.label ?? mid, desc: t?.desc ?? '', time: `~${t?.weeks} weeks` };
        }),
        ...(skills.length > 0
          ? [{ title: 'Skill deep-dives', desc: `Focus: ${skills.slice(0, 5).join(', ')}`, time: `${extraSkillWeeks} weeks total` }]
          : []),
      ],
    },

    // Experience — show remaining duration in description when partially credited
    experienceMonths > 0 && {
      phase: 'Experience',
      icon: '💼',
      duration: experienceMonths,
      credited: creditedExp,
      remaining: expRemaining,
      colorClass: 'border-brand-green/40 bg-brand-green/5',
      dotClass: 'bg-brand-green',
      steps: [
        {
          title: experience?.label ?? 'Work Experience',
          desc: experience?.desc ?? '',
          time: creditedExp > 0
            ? `${months2str(creditedExp)} credited · ${months2str(expRemaining)} remaining`
            : months2str(experienceMonths),
        },
        expRemaining > 0 && {
          title: 'Build portfolio / GitHub / LinkedIn',
          desc: 'Document every project and result. Recruiters will evaluate this before your resume.',
          time: '',
        },
      ].filter(Boolean),
    },

    // Job hunting — always present
    {
      phase: `Land Your First ${job?.title ?? ''} Role`,
      icon: '🚀',
      duration: 2,
      credited: 0,
      remaining: 2,
      colorClass: 'border-brand-purple/40 bg-brand-purple/5',
      dotClass: 'bg-brand-purple',
      steps: [
        { title: 'Job applications & networking', desc: 'Apply to 50+ companies. LinkedIn, Naukri, Referrals. Target MSMEs first for speed.', time: '4–8 weeks' },
        { title: 'Interview prep', desc: `Study ${job?.title ?? ''}-specific interview questions. Practice DSA / domain-specific rounds.`, time: '2–4 weeks' },
        {
          title: `Land your first ${job?.title ?? ''} offer`,
          desc: job?.salary_bands?.[0]
            ? `Negotiate salary based on the ₹${(job.salary_bands[0].sal_min / 100000).toFixed(0)}L–${(job.salary_bands[0].sal_max / 100000).toFixed(0)}L band.`
            : 'Negotiate based on market rates and your portfolio strength.',
          time: '',
        },
      ],
    },
  ].filter(Boolean).filter(p => p.steps.length > 0);

  // Attach cumulative offsets using *remaining* durations
  let cumulative = 0;
  const timeline = phases.map(p => {
    const start = cumulative;
    cumulative += p.remaining || (p.credited > 0 ? 0 : 2);
    return { ...p, start, end: cumulative };
  });

  return {
    timeline,
    totalMonths,
    remainingTotal,
    creditedTotal,
    creditedEdu,
    creditedExp,
    educationMonths,
    trainingMonths,
    experienceMonths,
  };
}

// ─── Pre-render combinations ──────────────────────────────────────────────────

/** Top career slugs to pre-render */
export const TOP_CAREER_SLUGS = [
  'software-engineer', 'data-scientist', 'ux-designer', 'product-manager',
  'devops-engineer', 'cybersecurity-analyst', 'full-stack-developer',
  'machine-learning-engineer', 'frontend-developer', 'backend-developer',
];

/** Top education IDs */
export const TOP_EDU_IDS = ['btech', 'mtech', 'bootcamp', 'self'];

/** Default training for pre-rendered pages */
export const DEFAULT_TRAINING = 'online.project';

/** Top experience IDs */
export const TOP_EXPERIENCE_IDS = ['internship', 'freelance', 'open_source'];
