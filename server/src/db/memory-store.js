/**
 * In-memory data store with seeded demo data.
 * Used in place of PostgreSQL/MongoDB/Redis/Elasticsearch for portfolio deployment.
 */
import { createHash } from 'crypto';
const uuid = () => crypto.randomUUID();

// bcrypt-like hash for seeded demo passwords (using a simple sha256 stand-in)
// Real bcrypt still used at runtime via auth.service — this is only for seeding.
const hashPassword = async pw => `demo:${createHash('sha256').update(pw).digest('hex')}`;

const now = () => new Date().toISOString();
const daysAgo = n => new Date(Date.now() - n * 86400000).toISOString();

// ─── Tables ───────────────────────────────────────────────────────────────────
export const tables = {
  users:                  [],
  profiles:               [],
  job_fields:             [],
  job_cards:              [],
  job_details:            [],
  job_work_env:           [],
  job_skills:             [],
  job_disciplines:        [],
  job_problems:           [],
  job_market_history:     [],
  job_employers:          [],
  job_education_links:    [],
  subject_skill_map:      [],
  daily_life_scenarios:   [],
  failure_maps:           [],
  survival_paths:         [],
  social_obstacles:       [],
  roadmaps:               [],
  roadmap_steps:          [],
  roadmap_resources:      [],
  user_personal_agenda:   [],
  salary_index:           [],
  salary_datapoints:      [],
  trajectories:           [],
  mentors:                [],
  mentor_sessions:        [],
  communities:            [],
  community_members:      [],
  community_posts:        [],
  success_stories:        [],
  creator_content:        [],
  user_saved_jobs:        [],
  feed_items:             [],
};

// ─── Seed ─────────────────────────────────────────────────────────────────────
export async function seedMemoryStore() {
  if (tables.job_fields.length) return; // already seeded

  const jf1 = uuid(), jf2 = uuid(), jf3 = uuid(), jf4 = uuid(), jf5 = uuid();
  const jc1 = uuid(), jc2 = uuid(), jc3 = uuid(), jc4 = uuid(), jc5 = uuid();

  // ── Job Fields ──────────────────────────────────────────────────────────────
  tables.job_fields.push(
    { id: jf1, name: 'Software Engineering', category: 'Technology', discipline: 'Engineering', industry: 'IT', icon: '💻', created_at: daysAgo(300) },
    { id: jf2, name: 'Data Science',          category: 'Technology', discipline: 'Analytics',  industry: 'IT', icon: '📊', created_at: daysAgo(300) },
    { id: jf3, name: 'Product Management',    category: 'Business',   discipline: 'Management', industry: 'IT', icon: '🗺️',  created_at: daysAgo(300) },
    { id: jf4, name: 'UI/UX Design',          category: 'Design',     discipline: 'Creative',   industry: 'IT', icon: '🎨', created_at: daysAgo(300) },
    { id: jf5, name: 'DevOps Engineering',    category: 'Technology', discipline: 'Operations', industry: 'IT', icon: '⚙️',  created_at: daysAgo(300) },
  );

  // ── Job Cards ───────────────────────────────────────────────────────────────
  tables.job_cards.push(
    { id: jc1, slug: 'software-engineer',   title: 'Software Engineer',   alternate_titles: ['SWE','Developer'], field_id: jf1, summary: 'Build scalable software systems and products.', what_you_do: 'Write, test and ship code daily.', social_grade: 'A', industry_grade: 'core', is_remote_possible: true, is_field_work: false, is_shift_based: false, is_freelance_viable: true, featured: true, published: true, views: 12400, saves: 890, created_at: daysAgo(200) },
    { id: jc2, slug: 'data-scientist',      title: 'Data Scientist',      alternate_titles: ['ML Engineer','AI Engineer'], field_id: jf2, summary: 'Extract insights from data using ML and statistics.', what_you_do: 'Build models, analyse trends, present findings.', social_grade: 'A', industry_grade: 'core', is_remote_possible: true, is_field_work: false, is_shift_based: false, is_freelance_viable: true, featured: true, published: true, views: 9800, saves: 720, created_at: daysAgo(190) },
    { id: jc3, slug: 'product-manager',     title: 'Product Manager',     alternate_titles: ['PM','APM','Senior PM'], field_id: jf3, summary: 'Own the product vision and roadmap end-to-end.', what_you_do: 'Prioritise features, align teams, ship products.', social_grade: 'A', industry_grade: 'core', is_remote_possible: true, is_field_work: false, is_shift_based: false, is_freelance_viable: false, featured: true, published: true, views: 7200, saves: 560, created_at: daysAgo(180) },
    { id: jc4, slug: 'ux-designer',         title: 'UX Designer',         alternate_titles: ['UI Designer','Product Designer'], field_id: jf4, summary: 'Design intuitive and beautiful user experiences.', what_you_do: 'User research, wireframes, prototypes.', social_grade: 'B', industry_grade: 'core', is_remote_possible: true, is_field_work: false, is_shift_based: false, is_freelance_viable: true, featured: false, published: true, views: 5600, saves: 430, created_at: daysAgo(170) },
    { id: jc5, slug: 'devops-engineer',     title: 'DevOps Engineer',     alternate_titles: ['SRE','Platform Engineer'], field_id: jf5, summary: 'Bridge development and operations for reliable delivery.', what_you_do: 'CI/CD, infrastructure, monitoring.', social_grade: 'A', industry_grade: 'core', is_remote_possible: true, is_field_work: false, is_shift_based: false, is_freelance_viable: true, featured: false, published: true, views: 4800, saves: 310, created_at: daysAgo(160) },
  );

  // ── Job Skills ──────────────────────────────────────────────────────────────
  const skillsData = [
    [jc1, 'JavaScript', 'technical', 95, true, 12],
    [jc1, 'React / Next.js', 'technical', 90, true, 10],
    [jc1, 'Node.js', 'technical', 85, true, 8],
    [jc1, 'SQL', 'technical', 80, true, 6],
    [jc1, 'Git & Version Control', 'tool', 75, true, 4],
    [jc2, 'Python', 'technical', 98, true, 10],
    [jc2, 'Machine Learning', 'technical', 95, true, 16],
    [jc2, 'SQL & Data Wrangling', 'technical', 90, true, 8],
    [jc2, 'Statistics', 'technical', 88, true, 12],
    [jc2, 'TensorFlow / PyTorch', 'technical', 80, false, 10],
    [jc3, 'Product Strategy', 'business', 95, true, 8],
    [jc3, 'Stakeholder Management', 'soft', 92, true, 6],
    [jc3, 'Agile / Scrum', 'methodology', 88, true, 4],
    [jc3, 'Data Analytics', 'technical', 85, true, 6],
    [jc4, 'Figma', 'tool', 95, true, 6],
    [jc4, 'User Research', 'methodology', 92, true, 6],
    [jc4, 'Interaction Design', 'technical', 90, true, 8],
    [jc4, 'Prototyping', 'technical', 88, true, 4],
    [jc5, 'Docker & Kubernetes', 'technical', 95, true, 10],
    [jc5, 'CI/CD Pipelines', 'technical', 92, true, 8],
    [jc5, 'AWS / GCP / Azure', 'technical', 90, true, 10],
    [jc5, 'Linux / Shell', 'technical', 88, true, 6],
  ];
  for (const [cid, name, type, imp, core, weeks] of skillsData) {
    tables.job_skills.push({ id: uuid(), job_card_id: cid, skill_name: name, skill_type: type, importance: imp, is_core: core, learn_time_weeks: weeks });
  }

  // ── Job Details ─────────────────────────────────────────────────────────────
  for (const jc of tables.job_cards) {
    tables.job_details.push({ id: uuid(), job_card_id: jc.id, what_you_do_detail: jc.what_you_do, day_in_life: 'Morning standup, code review, feature development, testing, deployment.', tools_used: ['Git', 'VS Code', 'Slack', 'JIRA'], typical_teams: ['Engineering', 'Product', 'Design'], typical_work_hours: '9-6', work_life_balance: 'good' });
    tables.job_work_env.push({ id: uuid(), job_card_id: jc.id, work_setting: 'remote', dress_code: 'casual', team_size: 'medium', collaboration: 'high', autonomy: 'high', pressure: 'medium', creativity: 'high' });
  }

  // ── Salary Index ─────────────────────────────────────────────────────────────
  const salaryRanges = [
    [jc1, 'India', 'startup',    0, 2,  600000,  1200000, 1000000],
    [jc1, 'India', 'startup',    2, 5,  1200000, 2200000, 1800000],
    [jc1, 'India', 'MNC',        0, 2,  800000,  1600000, 1200000],
    [jc1, 'India', 'MNC',        2, 5,  1600000, 3000000, 2400000],
    [jc1, 'India', 'MNC',        5, 10, 3000000, 5500000, 4200000],
    [jc2, 'India', 'startup',    0, 2,  700000,  1400000, 1100000],
    [jc2, 'India', 'MNC',        2, 5,  1800000, 3200000, 2600000],
    [jc2, 'India', 'MNC',        5, 10, 3200000, 6000000, 4500000],
    [jc3, 'India', 'startup',    2, 5,  1500000, 2800000, 2200000],
    [jc3, 'India', 'MNC',        5, 10, 3000000, 6000000, 4500000],
    [jc4, 'India', 'startup',    0, 2,  500000,  1000000,  800000],
    [jc4, 'India', 'MNC',        2, 5,  1000000, 2000000, 1600000],
    [jc5, 'India', 'MNC',        0, 2,  700000,  1400000, 1100000],
    [jc5, 'India', 'MNC',        2, 5,  1500000, 3000000, 2300000],
  ];
  for (const [cid, country, employer, min, max, low, high, avg] of salaryRanges) {
    tables.salary_index.push({ id: uuid(), job_card_id: cid, availability_zone: country, employer_type: employer, experience_min_yr: min, experience_max_yr: max, salary_min_inr: low, salary_max_inr: high, salary_median_inr: avg, effective_to: null, discipline_id: null });
  }

  // Salary datapoints for percentile calculations
  for (const jc of tables.job_cards) {
    for (let i = 0; i < 50; i++) {
      const base = 800000 + Math.random() * 3200000;
      tables.salary_datapoints.push({ id: uuid(), job_card_id: jc.id, country: 'India', salary_inr: Math.round(base), experience_years: Math.floor(Math.random() * 10), employer_type: ['startup','MNC','PSU'][Math.floor(Math.random()*3)], time: daysAgo(Math.floor(Math.random()*730)) });
    }
  }

  // ── Roadmaps ─────────────────────────────────────────────────────────────────
  const rm1 = uuid(), rm2 = uuid(), rm3 = uuid();
  const adminId = uuid();
  tables.users.push({
    id: adminId, email: 'admin@knowwork.app', name: 'KnowWork Admin',
    avatar_initials: 'KA', password_hash: await hashPassword('Admin@123'),
    role: 'admin', subscription_tier: 'premium', profile_id: null,
    free_areas_selected: [], paid_areas: [], free_natures_selected: [],
    email_verified: true, last_login_at: daysAgo(1), login_count: 50, created_at: daysAgo(300),
  });

  tables.roadmaps.push(
    { id: rm1, job_card_id: jc1, created_by: adminId, title: 'Full-Stack Engineer — Beginner to Job-Ready', description: 'Complete path from zero coding knowledge to landing your first full-stack job.', trajectory_type: 'balanced', target_audience: 'beginner', estimated_months: 12, difficulty: 'easy', is_official: true, status: 'published', likes: 342, views: 5600, created_at: daysAgo(150) },
    { id: rm2, job_card_id: jc2, created_by: adminId, title: 'Data Scientist — Python & ML Mastery', description: 'From statistics basics to deploying ML models in production.', trajectory_type: 'academic', target_audience: 'intermediate', estimated_months: 10, difficulty: 'medium', is_official: true, status: 'published', likes: 289, views: 4200, created_at: daysAgo(130) },
    { id: rm3, job_card_id: jc3, created_by: adminId, title: 'Product Manager — MBA Optional', description: 'How to break into PM without an MBA using side projects and portfolio.', trajectory_type: 'direct', target_audience: 'career_switcher', estimated_months: 8, difficulty: 'medium', is_official: true, status: 'published', likes: 198, views: 3100, created_at: daysAgo(110) },
  );

  // Roadmap steps
  const steps = [
    [rm1, 1, 'Foundations', 'HTML, CSS & JavaScript Basics', 8],
    [rm1, 2, 'Frontend',    'React & State Management',       8],
    [rm1, 3, 'Backend',     'Node.js & REST APIs',            8],
    [rm1, 4, 'Database',    'SQL & NoSQL Essentials',         6],
    [rm1, 5, 'Projects',    'Build 3 Portfolio Projects',     12],
    [rm2, 1, 'Foundations', 'Python for Data Science',        6],
    [rm2, 2, 'Statistics',  'Probability & Statistics',       8],
    [rm2, 3, 'ML Basics',   'Supervised & Unsupervised Learning', 10],
    [rm2, 4, 'Deep Learning','Neural Nets & CNNs',            8],
    [rm2, 5, 'Deployment',  'MLOps & Model Serving',         6],
    [rm3, 1, 'Foundations', 'Product Thinking Fundamentals', 4],
    [rm3, 2, 'Analytics',   'Data-Driven Decision Making',   6],
    [rm3, 3, 'Execution',   'Agile & Sprint Management',     4],
    [rm3, 4, 'Portfolio',   'Build Case Studies',            8],
  ];
  for (const [rid, pos, phase, title, weeks] of steps) {
    tables.roadmap_steps.push({ id: uuid(), roadmap_id: rid, position: pos, phase, title, description: `Learn ${title} through hands-on projects.`, duration_weeks: weeks, is_milestone: pos === 1, skills_gained: [], skill_hours_required: null });
  }

  // ── Mentors ───────────────────────────────────────────────────────────────────
  const mentorData = [
    ['Arjun Sharma',  'Senior SWE at Google',    jc1, 'Bangalore', 7,  3500, 4.9, true,  ['JavaScript','React','System Design']],
    ['Priya Nair',    'Data Scientist at Flipkart',jc2,'Mumbai',   5,  2500, 4.8, true,  ['Python','ML','SQL']],
    ['Rahul Verma',   'PM at Swiggy',             jc3, 'Hyderabad', 8,  4000, 4.7, false, ['Product Strategy','Agile','Analytics']],
    ['Sneha Patel',   'UX Lead at Razorpay',      jc4, 'Pune',     6,  2000, 4.9, true,  ['Figma','User Research','Interaction Design']],
    ['Vikram Menon',  'DevOps Architect at Infosys',jc5,'Chennai',10, 3000, 4.6, true,  ['Kubernetes','AWS','CI/CD']],
    ['Ananya Krishnan','ML Eng at Amazon',         jc2,'Bangalore', 4, 2000, 4.8, true,  ['Python','NLP','Deep Learning']],
  ];
  for (const [name, headline, jcid, city, exp, rate, rating, available, skills] of mentorData) {
    const uid = uuid();
    const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    tables.users.push({ id: uid, email: `${name.toLowerCase().replace(/ /g,'.')}@demo.com`, name, avatar_initials: initials, password_hash: '', role: 'mentor', subscription_tier: 'premium', profile_id: null, free_areas_selected: [], paid_areas: [], free_natures_selected: [], email_verified: true, last_login_at: daysAgo(2), login_count: 10, created_at: daysAgo(200) });
    // Field names match mentors.service.js query columns: available, rating, hourly_rate_inr, title, languages, total_reviews
    tables.mentors.push({ id: uuid(), user_id: uid, job_card_id: jcid, title: headline, company: headline.split(' at ')[1] || 'India', bio: `Experienced ${headline}. Passionate about mentoring the next generation.`, city, country: 'India', years_experience: exp, hourly_rate_inr: rate, session_duration_min: 60, available, rating: rating, avg_rating: rating, total_sessions: Math.floor(Math.random()*50)+10, total_reviews: Math.floor(Math.random()*20)+5, languages: ['English', 'Hindi'], skills, created_at: daysAgo(200) });
  }

  // ── Trajectories ──────────────────────────────────────────────────────────────
  for (const jc of tables.job_cards) {
    tables.trajectories.push({
      id: uuid(), job_card_id: jc.id, slug: `${jc.slug}-trajectory`,
      title: `How to Become a ${jc.title}`, description: `Real trajectory data for ${jc.title}`,
      steps: ['Foundation','Skill Building','Portfolio','Job Hunt','Offer'],
      avg_duration_months: 10, difficulty: 'medium', status: 'published',
      views: Math.floor(Math.random()*3000)+500, created_at: daysAgo(100),
    });
  }

  // ── Communities ───────────────────────────────────────────────────────────────
  const comms = [
    [jc1, 'Software Engineers India', 'The largest SWE community in India.', 15400],
    [jc2, 'Data Science India',       'Stats, ML, and data careers.',        9200],
    [jc3, 'Product Managers Network', 'All things product.',                 6800],
  ];
  for (const [jcid, name, desc, members] of comms) {
    tables.communities.push({ id: uuid(), job_card_id: jcid, name, description: desc, member_count: members, is_public: true, created_at: daysAgo(300) });
  }
}
