import { describe, it, expect } from 'vitest';
import {
  months2str,
  encodeRoadmapSlug,
  decodeRoadmapSlug,
  buildRoadmapData,
  BASE_EDU,
  TRAINING_TYPES,
  EXPERIENCE_OPTIONS,
} from '../src/lib/roadmapBuilder.js';

// ─── months2str ───────────────────────────────────────────────────────────────
describe('months2str', () => {
  it('returns "0 months" for falsy input', () => {
    expect(months2str(0)).toBe('0 months');
    expect(months2str(null)).toBe('0 months');
    expect(months2str(undefined)).toBe('0 months');
  });

  it('formats whole years', () => {
    expect(months2str(12)).toBe('1 yr');
    expect(months2str(24)).toBe('2 yr');
    expect(months2str(48)).toBe('4 yr');
  });

  it('formats months only', () => {
    expect(months2str(3)).toBe('3 mo');
    expect(months2str(6)).toBe('6 mo');
  });

  it('formats years + months', () => {
    expect(months2str(14)).toBe('1 yr 2 mo');
    expect(months2str(30)).toBe('2 yr 6 mo');
  });
});

// ─── encodeRoadmapSlug / decodeRoadmapSlug ────────────────────────────────────
describe('encodeRoadmapSlug', () => {
  const job = { slug: 'software-engineer' };
  const edu = { id: 'btech' };
  const training = { methods: ['online', 'project'] };
  const exp = { id: 'internship' };

  it('encodes a full slug', () => {
    expect(encodeRoadmapSlug(job, edu, training, exp))
      .toBe('software-engineer--btech--online.project--internship');
  });

  it('uses "online" as fallback when no methods', () => {
    expect(encodeRoadmapSlug(job, edu, { methods: [] }, exp))
      .toBe('software-engineer--btech--online--internship');
  });
});

describe('decodeRoadmapSlug', () => {
  it('decodes a valid slug', () => {
    const decoded = decodeRoadmapSlug('software-engineer--btech--online.project--internship');
    expect(decoded).toEqual({
      careerSlug:   'software-engineer',
      eduId:        'btech',
      trainingIds:  ['online', 'project'],
      experienceId: 'internship',
    });
  });

  it('returns null for malformed slug (fewer than 4 parts)', () => {
    expect(decodeRoadmapSlug('software-engineer--btech')).toBeNull();
    expect(decodeRoadmapSlug('')).toBeNull();
  });

  it('handles single training method', () => {
    const decoded = decodeRoadmapSlug('data-scientist--mtech--online--freelance');
    expect(decoded.trainingIds).toEqual(['online']);
    expect(decoded.experienceId).toBe('freelance');
  });
});

// ─── buildRoadmapData ─────────────────────────────────────────────────────────
describe('buildRoadmapData', () => {
  const job = { slug: 'software-engineer', title: 'Software Engineer', field: 'Technology', skills: [] };
  const education = BASE_EDU.find(e => e.id === 'btech');   // 48 months
  const training  = { methods: ['online', 'project'], skills: [] }; // 8+10 = 18 weeks = 5 months
  const experience = EXPERIENCE_OPTIONS.find(e => e.id === 'internship'); // 6 months

  it('computes total months correctly', () => {
    const data = buildRoadmapData(job, education, training, experience, { lifeStage: 'fresher' });
    expect(data.totalMonths).toBe(48 + 5 + 6); // 59
  });

  it('returns 0 credited for fresher background', () => {
    const data = buildRoadmapData(job, education, training, experience, { lifeStage: 'fresher' });
    expect(data.creditedTotal).toBe(0);
    expect(data.remainingTotal).toBe(data.totalMonths);
  });

  it('credits education for career-switcher with matching degree', () => {
    const data = buildRoadmapData(job, education, training, experience, {
      lifeStage: 'career-switcher',
      existingEduId: 'btech',
      existingExpMonths: 0,
    });
    expect(data.creditedEdu).toBe(48);
    expect(data.remainingTotal).toBe(data.totalMonths - 48);
  });

  it('credits experience for working professional (capped at selected exp)', () => {
    const data = buildRoadmapData(job, education, training, experience, {
      lifeStage: 'working',
      existingExpMonths: 24,
    });
    // experience is internship = 6 months, so min(24, 6) = 6
    expect(data.creditedExp).toBe(6);
  });

  it('does NOT credit experience beyond the selected option', () => {
    const data = buildRoadmapData(job, education, training, experience, {
      lifeStage: 'working',
      existingExpMonths: 100,
    });
    expect(data.creditedExp).toBe(experience.months); // capped at 6
  });

  it('includes all 4 phases for fresh user', () => {
    const data = buildRoadmapData(job, education, training, experience, { lifeStage: 'fresher' });
    const phaseNames = data.timeline.map(p => p.phase);
    expect(phaseNames).toContain('Education');
    expect(phaseNames).toContain('Training & Skills');
    expect(phaseNames).toContain('Experience');
    expect(phaseNames.some(n => n.includes('Software Engineer'))).toBe(true);
  });

  it('has cumulative timeline offsets', () => {
    const data = buildRoadmapData(job, education, training, experience, { lifeStage: 'fresher' });
    let prev = 0;
    for (const phase of data.timeline) {
      expect(phase.start).toBe(prev);
      expect(phase.end).toBeGreaterThan(phase.start);
      prev = phase.end;
    }
  });
});

// ─── Static data sanity ───────────────────────────────────────────────────────
describe('BASE_EDU', () => {
  it('has positive duration for all options', () => {
    for (const edu of BASE_EDU) {
      expect(edu.duration_months).toBeGreaterThan(0);
    }
  });

  it('includes btech and bootcamp', () => {
    const ids = BASE_EDU.map(e => e.id);
    expect(ids).toContain('btech');
    expect(ids).toContain('bootcamp');
  });
});

describe('TRAINING_TYPES', () => {
  it('all types have positive week durations', () => {
    for (const t of TRAINING_TYPES) {
      expect(t.weeks).toBeGreaterThan(0);
    }
  });
});

describe('EXPERIENCE_OPTIONS', () => {
  it('fulltime has 0 months (apply direct)', () => {
    const fulltime = EXPERIENCE_OPTIONS.find(e => e.id === 'fulltime');
    expect(fulltime.months).toBe(0);
  });

  it('internship has positive months', () => {
    const internship = EXPERIENCE_OPTIONS.find(e => e.id === 'internship');
    expect(internship.months).toBeGreaterThan(0);
  });
});
