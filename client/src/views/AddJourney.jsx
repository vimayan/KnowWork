'use client';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from '../lib/router.jsx';
import {
  BookOpen, Plus, Trash2, CheckCircle2, ArrowRight, ArrowLeft,
  Search, Briefcase, GraduationCap, Zap, Clock, Star, Users
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { storiesApi, jobCardsApi } from '../api/index.js';
import { Spinner } from '../components/ui/index.jsx';
import { BASE_EDU, TRAINING_TYPES, EXPERIENCE_OPTIONS } from '../lib/roadmapBuilder.js';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Your Profile',    desc: 'Basic info about you'      },
  { id: 2, label: 'Career Path',     desc: 'How you got there'         },
  { id: 3, label: 'Timeline',        desc: 'Your journey steps'        },
  { id: 4, label: 'Key Learnings',   desc: 'Advice & takeaways'        },
  { id: 5, label: 'Review & Submit', desc: 'Publish your story'        },
];

const BACKGROUNDS = [
  { id: 'fresher',    label: 'Fresher / Student',         icon: '🎓', desc: 'Entered this field right after education' },
  { id: 'switcher',   label: 'Career Switcher',           icon: '🔄', desc: 'Moved from a completely different field' },
  { id: 'non_cs',     label: 'Non-CS / Non-Tech Background', icon: '🌀', desc: 'No formal CS/tech education' },
  { id: 'experienced',label: 'Already in the Industry',   icon: '💼', desc: 'Grew within the same field' },
];

const blank = () => ({ title: '', duration_months: '', description: '', skills: '' });

export default function AddJourney() {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const isAuth    = !!user;

  const [step,  setStep]  = useState(1);
  const [busy,  setBusy]  = useState(false);

  // ── Step 1: Profile ────────────────────────────────────────────────────────
  const [profile, setP] = useState({
    submitter_name: user?.name || '',
    current_title:  '',
    city:           '',
    country:        'India',
    salary:         '',
  });

  // ── Step 2: Career Path (structured) ──────────────────────────────────────
  const [jobCard,          setJobCard]      = useState(null);   // selected job card object
  const [jobSearch,        setJobSearch]    = useState('');
  const [jobList,          setJobList]      = useState([]);
  const [jobLoading,       setJobLoading]   = useState(false);
  const [showCreateJob,    setShowCreateJob] = useState(false);
  const [newJobForm,       setNewJobForm]   = useState({ title: '', category: '', summary: '' });
  const [creatingJob,      setCreatingJob]  = useState(false);
  const [background,       setBackground]   = useState(null);   // BACKGROUNDS id
  const [educationId,      setEducationId]  = useState(null);   // BASE_EDU id
  const [trainingMethods,  setTrainingMethods] = useState([]); // TRAINING_TYPES ids
  const [experienceId,     setExperienceId] = useState(null);   // EXPERIENCE_OPTIONS id
  const [totalMonths,      setTotalMonths]  = useState('');     // number

  // ── Step 3: Timeline (freeform) ────────────────────────────────────────────
  const [jsteps, setJS] = useState([blank(), blank()]);

  // ── Step 4: Learnings ──────────────────────────────────────────────────────
  const [learn, setL] = useState({
    key_learnings:  [''],
    mistakes_made:  [''],
    advice_to_self: '',
  });

  // ── Step 5: Mentor opt-in ─────────────────────────────────────────────────
  const [wantMentor, setWantMentor] = useState(false);

  // Load job cards for picker
  useEffect(() => {
    setJobLoading(true);
    jobCardsApi.list({ limit: 80 })
      .then(r => setJobList(r?.data || []))
      .catch(() => {})
      .finally(() => setJobLoading(false));
  }, []);

  if (!isAuth) return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <BookOpen size={48} className="text-accent mx-auto mb-4"/>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Share Your Career Journey</h2>
      <p className="text-text-muted mb-6">Sign in to share your story and inspire thousands of students</p>
      <div className="flex gap-3 justify-center">
        <Link to="/login"    className="btn-primary">Sign in</Link>
        <Link to="/register" className="btn-outline">Create account</Link>
      </div>
    </div>
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const updJ = (i, k, v) => setJS(s => s.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const addJ = () => setJS(s => [...s, blank()]);
  const rmJ  = (i) => setJS(s => s.filter((_, j) => j !== i));

  const updL = (key, i, v) => setL(s => ({ ...s, [key]: s[key].map((x, j) => j === i ? v : x) }));
  const addL = (key) => setL(s => ({ ...s, [key]: [...s[key], ''] }));
  const rmL  = (key, i) => setL(s => ({ ...s, [key]: s[key].filter((_, j) => j !== i) }));

  const toggleTraining = (id) =>
    setTrainingMethods(m => m.includes(id) ? m.filter(x => x !== id) : [...m, id]);

  const filteredJobs = jobList.filter(j =>
    !jobSearch ||
    j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.category?.toLowerCase().includes(jobSearch.toLowerCase())
  );

  // ── Create new job card (community suggestion) ────────────────────────────
  const handleCreateJob = async () => {
    if (!newJobForm.title.trim()) return;
    setCreatingJob(true);
    try {
      const res = await jobCardsApi.suggest({
        title:    newJobForm.title.trim(),
        category: newJobForm.category.trim() || undefined,
        summary:  newJobForm.summary.trim()  || undefined,
      });
      const card = res.data;
      setJobCard({ ...card, is_suggested: true });
      setShowCreateJob(false);
      setNewJobForm({ title: '', category: '', summary: '' });
      toast.success('Role created! It will be reviewed and published by our team.');
    } catch {
      toast.error('Could not create role. Please try again.');
    } finally {
      setCreatingJob(false);
    }
  };

  // ── Validation per step ────────────────────────────────────────────────────
  const canProceed = () => {
    if (step === 1) return profile.submitter_name.trim() && profile.current_title.trim();
    if (step === 2) return jobCard && background && educationId && experienceId;
    if (step === 3) return jsteps.some(s => s.title.trim());
    if (step === 4) return true;
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async () => {
    setBusy(true);
    try {
      await storiesApi.submitJourney({
        // Profile
        ...profile,
        // Structured path data
        job_card_id:      jobCard?.id,
        job_card_slug:    jobCard?.slug,
        job_card_title:   jobCard?.title,
        background,
        education_id:     educationId,
        education_label:  BASE_EDU.find(e => e.id === educationId)?.label,
        training_methods: trainingMethods,
        experience_id:    experienceId,
        experience_label: EXPERIENCE_OPTIONS.find(e => e.id === experienceId)?.label,
        total_months:     totalMonths ? parseInt(totalMonths) : null,
        // Freeform timeline
        steps: jsteps
          .filter(s => s.title.trim())
          .map(s => ({
            ...s,
            duration_months: s.duration_months ? parseInt(s.duration_months) : null,
            skills: s.skills.split(',').map(x => x.trim()).filter(Boolean),
          })),
        // Learnings
        key_learnings:  learn.key_learnings.filter(Boolean),
        mistakes_made:  learn.mistakes_made.filter(Boolean),
        advice_to_self: learn.advice_to_self,
        // Mentor opt-in
        wants_to_mentor: wantMentor,
      });
      toast.success('Journey submitted for review!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed — please try again');
    } finally {
      setBusy(false);
    }
  };

  const edu = BASE_EDU.find(e => e.id === educationId);
  const exp = EXPERIENCE_OPTIONS.find(e => e.id === experienceId);

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center justify-center gap-2">
          <BookOpen size={24} className="text-accent"/>Share Your Journey
        </h1>
        <p className="text-text-muted text-sm mt-2">
          Inspire thousands of students — and get discovered as a mentor
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id   ? 'bg-accent border-accent text-white' :
                step === s.id ? 'border-accent text-accent bg-accent/10' :
                                'border-bg-border text-text-muted'
              }`}>
                {step > s.id ? <CheckCircle2 size={13}/> : s.id}
              </div>
              <p className="text-[10px] text-text-muted mt-1 text-center hidden sm:block w-16 leading-tight">{s.label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 transition-all ${step > s.id ? 'bg-accent' : 'bg-bg-border'}`}/>
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="card p-6 animate-fade-in">

        {/* ── STEP 1: Profile ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-1">Your Profile</h2>
            <p className="text-text-muted text-sm mb-5">This appears on your public story and mentor profile.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Full Name *</label>
                <input value={profile.submitter_name} placeholder="Your name"
                  onChange={e => setP(s => ({ ...s, submitter_name: e.target.value }))} className="input"/>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Current Job Title *</label>
                <input value={profile.current_title} placeholder="e.g. Senior Software Engineer at Swiggy"
                  onChange={e => setP(s => ({ ...s, current_title: e.target.value }))} className="input"/>
              </div>
              <div>
                <label className="label">City</label>
                <input value={profile.city} placeholder="Bangalore, Pune..."
                  onChange={e => setP(s => ({ ...s, city: e.target.value }))} className="input"/>
              </div>
              <div>
                <label className="label">Country</label>
                <select value={profile.country} onChange={e => setP(s => ({ ...s, country: e.target.value }))} className="select">
                  {['India','United States','United Kingdom','Canada','Germany','Australia','Singapore'].map(c =>
                    <option key={c}>{c}</option>
                  )}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Current Salary (optional)</label>
                <input value={profile.salary} placeholder="₹18 LPA, $90k..."
                  onChange={e => setP(s => ({ ...s, salary: e.target.value }))} className="input"/>
                <p className="text-text-muted text-[10px] mt-1">Helps students understand earning potential. Only shown as a range.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Career Path (structured) ────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-7">
            <div>
              <h2 className="text-text-primary font-bold text-lg mb-1">Career Path</h2>
              <p className="text-text-muted text-sm">This powers KnowWork's roadmap engine — be specific.</p>
            </div>

            {/* Job card picker */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Briefcase size={13} className="text-accent"/>Which role does this journey lead to? *
              </label>
              {jobCard ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-accent/40 bg-accent/5">
                  <span className="text-2xl">{jobCard.icon || '💼'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-text-primary font-semibold text-sm truncate">{jobCard.title}</p>
                      {jobCard.is_suggested && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-amber/15 text-brand-amber border border-brand-amber/30 flex-shrink-0">
                          📝 Pending review
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-xs">{jobCard.category || (jobCard.is_suggested ? 'Community suggestion' : '')}</p>
                  </div>
                  <button onClick={() => { setJobCard(null); setShowCreateJob(false); }}
                    className="text-text-muted hover:text-brand-rose text-xs transition-colors flex-shrink-0">Change</button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-3">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
                    <input value={jobSearch} onChange={e => setJobSearch(e.target.value)}
                      placeholder="Search careers (e.g. software engineer, data scientist...)"
                      className="input pl-9"/>
                  </div>
                  {jobLoading
                    ? <div className="flex justify-center py-6"><Spinner size={20}/></div>
                    : (
                      <>
                        <div className="grid sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 scrollbar-hide">
                          {filteredJobs.map(j => (
                            <button key={j.id} onClick={() => setJobCard(j)}
                              className="flex items-center gap-2.5 p-3 rounded-xl border border-bg-border bg-bg-primary hover:border-accent/40 hover:bg-accent/5 transition-all text-left">
                              <span className="text-xl flex-shrink-0">{j.icon || '💼'}</span>
                              <div className="min-w-0">
                                <p className="text-text-primary text-xs font-medium truncate">{j.title}</p>
                                <p className="text-text-muted text-[10px]">{j.category}</p>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Can't find role → create it */}
                        {!showCreateJob ? (
                          <button
                            onClick={() => setShowCreateJob(true)}
                            className="mt-3 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-bg-border text-text-muted hover:border-accent/40 hover:text-accent text-xs transition-all"
                          >
                            <Plus size={13}/>
                            Can't find your role? Create it
                          </button>
                        ) : (
                          <div className="mt-3 p-4 rounded-xl border border-accent/30 bg-accent/5 space-y-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-text-primary font-semibold text-xs flex items-center gap-1.5">
                                <Plus size={12} className="text-accent"/>Add a new role
                              </p>
                              <button onClick={() => setShowCreateJob(false)} className="text-text-muted hover:text-text-primary text-[10px]">Cancel</button>
                            </div>
                            <input
                              value={newJobForm.title}
                              onChange={e => setNewJobForm(f => ({ ...f, title: e.target.value }))}
                              placeholder="Role title (e.g. Blockchain Developer) *"
                              className="input text-xs"
                            />
                            <input
                              value={newJobForm.category}
                              onChange={e => setNewJobForm(f => ({ ...f, category: e.target.value }))}
                              placeholder="Category (e.g. Technology, Finance...)"
                              className="input text-xs"
                            />
                            <textarea
                              value={newJobForm.summary}
                              onChange={e => setNewJobForm(f => ({ ...f, summary: e.target.value }))}
                              placeholder="Brief description of this role (optional)"
                              rows={2}
                              className="input text-xs resize-none"
                            />
                            <p className="text-text-muted text-[10px]">
                              📋 This role will be reviewed by our team and published within 24 hours. Your journey will be linked to it immediately.
                            </p>
                            <button
                              onClick={handleCreateJob}
                              disabled={!newJobForm.title.trim() || creatingJob || !isAuth}
                              className="btn-primary text-xs w-full flex items-center justify-center gap-2"
                            >
                              {creatingJob ? <Spinner size={13}/> : <Plus size={13}/>}
                              {isAuth ? 'Create & select this role' : 'Sign in to create a role'}
                            </button>
                          </div>
                        )}
                      </>
                    )
                  }
                </div>
              )}
            </div>

            {/* Background */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Users size={13} className="text-accent"/>Where did you start from? *
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {BACKGROUNDS.map(b => (
                  <button key={b.id} onClick={() => setBackground(b.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      background === b.id
                        ? 'border-accent/60 bg-accent/8'
                        : 'border-bg-border bg-bg-primary hover:border-accent/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{b.icon}</span>
                      <p className="text-text-primary text-xs font-semibold">{b.label}</p>
                    </div>
                    <p className="text-text-muted text-[10px] leading-relaxed">{b.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <label className="label flex items-center gap-1.5">
                <GraduationCap size={13} className="text-accent"/>Education path taken *
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {BASE_EDU.map(e => (
                  <button key={e.id} onClick={() => setEducationId(e.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      educationId === e.id
                        ? 'border-accent/60 bg-accent/8'
                        : 'border-bg-border bg-bg-primary hover:border-accent/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{e.icon}</span>
                      <p className="text-text-primary text-xs font-semibold">{e.label}</p>
                    </div>
                    <p className="text-text-muted text-[10px]">{e.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Training methods — multi-select */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Zap size={13} className="text-accent"/>How did you train? (select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {TRAINING_TYPES.map(t => (
                  <button key={t.id} onClick={() => toggleTraining(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      trainingMethods.includes(t.id)
                        ? 'border-accent/60 bg-accent/10 text-accent'
                        : 'border-bg-border bg-bg-primary text-text-secondary hover:border-accent/30'
                    }`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience type */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Briefcase size={13} className="text-accent"/>How did you get your first real experience? *
              </label>
              <div className="grid sm:grid-cols-2 gap-2">
                {EXPERIENCE_OPTIONS.map(e => (
                  <button key={e.id} onClick={() => setExperienceId(e.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      experienceId === e.id
                        ? 'border-accent/60 bg-accent/8'
                        : 'border-bg-border bg-bg-primary hover:border-accent/30'
                    }`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{e.icon}</span>
                      <p className="text-text-primary text-xs font-semibold">{e.label}</p>
                    </div>
                    <p className="text-text-muted text-[10px] leading-relaxed line-clamp-2">{e.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Total timeline */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Clock size={13} className="text-accent"/>How many months from starting out to your first role?
              </label>
              <div className="flex items-center gap-3">
                <input type="number" min="1" max="120" value={totalMonths}
                  onChange={e => setTotalMonths(e.target.value)}
                  placeholder="e.g. 36" className="input w-32"/>
                <span className="text-text-muted text-sm">months total</span>
                {totalMonths && (
                  <span className="text-accent text-sm font-medium">
                    ≈ {Math.floor(+totalMonths / 12) > 0 ? `${Math.floor(+totalMonths / 12)}yr ` : ''}
                    {+totalMonths % 12 > 0 ? `${+totalMonths % 12}mo` : ''}
                  </span>
                )}
              </div>
              <p className="text-text-muted text-[10px] mt-1">Used to show realistic timelines to students planning this path.</p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Timeline (freeform) ──────────────────────────────────── */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-text-primary font-bold text-lg">Your Career Timeline</h2>
              <button onClick={addJ} className="btn-ghost text-xs"><Plus size={13}/>Add Step</button>
            </div>
            <p className="text-text-muted text-sm mb-5">
              Break your journey into phases — education, first job, pivot, promotion, etc.
              Tell the real story.
            </p>
            <div className="space-y-4">
              {jsteps.map((s, i) => (
                <div key={i} className="p-4 rounded-xl bg-bg-primary border border-bg-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-bold text-sm">Step {i + 1}</span>
                    {jsteps.length > 1 && (
                      <button onClick={() => rmJ(i)} className="text-text-muted hover:text-brand-rose transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Phase title *</label>
                      <input value={s.title} onChange={e => updJ(i, 'title', e.target.value)}
                        placeholder="e.g. Completed B.Tech" className="input"/>
                    </div>
                    <div>
                      <label className="label">Duration (months)</label>
                      <input type="number" value={s.duration_months} onChange={e => updJ(i, 'duration_months', e.target.value)}
                        placeholder="e.g. 48" className="input"/>
                    </div>
                  </div>
                  <div>
                    <label className="label">What happened?</label>
                    <textarea value={s.description} onChange={e => updJ(i, 'description', e.target.value)}
                      placeholder="Describe this phase of your journey — struggles, breakthroughs, what you built..."
                      rows={3} className="textarea"/>
                  </div>
                  <div>
                    <label className="label">Skills gained (comma-separated)</label>
                    <input value={s.skills} onChange={e => updJ(i, 'skills', e.target.value)}
                      placeholder="React, System Design, SQL..." className="input"/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Learnings ────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-text-primary font-bold text-lg mb-1">Key Learnings & Advice</h2>
              <p className="text-text-muted text-sm">The most valuable part — be honest and specific. Students will read every word.</p>
            </div>

            {[
              ['key_learnings', 'Key Learnings', 'e.g. Start building projects in year 1, not year 3'],
              ['mistakes_made', 'Mistakes to Avoid', 'e.g. Wasted 6 months on the wrong tech stack'],
            ].map(([key, label, ph]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">{label}</label>
                  <button onClick={() => addL(key)} className="btn-ghost text-xs py-1"><Plus size={12}/>Add</button>
                </div>
                {learn[key].map((l, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={l} onChange={e => updL(key, i, e.target.value)}
                      placeholder={ph} className="input flex-1"/>
                    {learn[key].length > 1 && (
                      <button onClick={() => rmL(key, i)} className="text-text-muted hover:text-brand-rose transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div>
              <label className="label">Advice to your younger self</label>
              <textarea value={learn.advice_to_self} rows={4}
                onChange={e => setL(s => ({ ...s, advice_to_self: e.target.value }))}
                placeholder="If you could go back and tell yourself one thing at the start..."
                className="textarea"/>
            </div>
          </div>
        )}

        {/* ── STEP 5: Review & Submit ──────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-text-primary font-bold text-lg">Review Your Journey</h2>

            {/* Profile summary */}
            <div className="p-4 rounded-xl bg-bg-primary border border-bg-border">
              <p className="text-text-primary font-semibold">{profile.submitter_name}</p>
              <p className="text-text-muted text-sm">{profile.current_title}</p>
              {profile.city && <p className="text-text-muted text-xs mt-0.5">{profile.city}, {profile.country}</p>}
              {profile.salary && <p className="text-brand-green text-xs mt-0.5 font-medium">{profile.salary}</p>}
            </div>

            {/* Path summary */}
            <div className="p-4 rounded-xl bg-bg-primary border border-bg-border space-y-2">
              <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider mb-3">Career Path</p>
              {jobCard && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{jobCard.icon || '💼'}</span>
                  <div>
                    <p className="text-text-secondary text-xs font-medium">Target Role</p>
                    <p className="text-text-primary text-sm font-semibold">{jobCard.title}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {background && (
                  <div className="p-2 rounded-lg bg-bg-secondary">
                    <p className="text-text-muted text-[10px]">Background</p>
                    <p className="text-text-secondary text-xs font-medium">{BACKGROUNDS.find(b => b.id === background)?.label}</p>
                  </div>
                )}
                {edu && (
                  <div className="p-2 rounded-lg bg-bg-secondary">
                    <p className="text-text-muted text-[10px]">Education</p>
                    <p className="text-text-secondary text-xs font-medium">{edu.label}</p>
                  </div>
                )}
                {exp && (
                  <div className="p-2 rounded-lg bg-bg-secondary">
                    <p className="text-text-muted text-[10px]">First Experience</p>
                    <p className="text-text-secondary text-xs font-medium">{exp.label}</p>
                  </div>
                )}
                {totalMonths && (
                  <div className="p-2 rounded-lg bg-bg-secondary">
                    <p className="text-text-muted text-[10px]">Total Timeline</p>
                    <p className="text-text-secondary text-xs font-medium">{totalMonths} months</p>
                  </div>
                )}
              </div>
              {trainingMethods.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {trainingMethods.map(id => {
                    const t = TRAINING_TYPES.find(t => t.id === id);
                    return (
                      <span key={id} className="px-2 py-0.5 rounded-lg bg-accent/10 text-accent text-[10px] font-medium border border-accent/20">
                        {t?.icon} {t?.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Timeline steps */}
            <div>
              <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider mb-2">Journey Steps</p>
              {jsteps.filter(s => s.title).map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-bg-primary border border-bg-border mb-2">
                  <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <div>
                    <p className="text-text-secondary text-sm font-medium">{s.title}</p>
                    {s.duration_months && <p className="text-text-muted text-xs">{s.duration_months} months</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Mentor opt-in */}
            <div className={`p-4 rounded-xl border transition-all cursor-pointer ${
              wantMentor
                ? 'border-brand-amber/50 bg-brand-amber/8'
                : 'border-bg-border bg-bg-primary hover:border-brand-amber/30'
            }`} onClick={() => setWantMentor(m => !m)}>
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  wantMentor ? 'bg-brand-amber border-brand-amber' : 'border-bg-border'
                }`}>
                  {wantMentor && <CheckCircle2 size={11} className="text-white"/>}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={13} className="text-brand-amber"/>
                    <p className="text-text-primary font-semibold text-sm">Become a mentor on KnowWork</p>
                    <span className="text-[9px] bg-brand-amber text-bg-primary font-black px-1.5 py-0.5 rounded-full">EARN</span>
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed">
                    Get listed on the <strong className="text-text-secondary">{jobCard?.title ?? 'career'}</strong> page.
                    Students can book 1:1 sessions with you — you earn credits and real pay for each session.
                  </p>
                </div>
              </div>
            </div>

            {/* Review notice */}
            <div className="p-4 rounded-xl bg-brand-green/8 border border-brand-green/20">
              <p className="text-brand-green text-xs font-semibold mb-1">Ready to publish?</p>
              <p className="text-text-secondary text-sm">
                Your journey will be reviewed before going live (1–2 business days).
                {wantMentor && ' Your mentor profile will be activated after approval.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
          className="btn-secondary disabled:opacity-30 flex items-center gap-1.5">
          <ArrowLeft size={15}/>Back
        </button>

        {/* Step indicator dots */}
        <div className="flex gap-1.5">
          {STEPS.map(s => (
            <div key={s.id} className={`h-1.5 rounded-full transition-all ${
              s.id === step ? 'bg-accent w-4' : s.id < step ? 'bg-accent/40 w-1.5' : 'bg-bg-border w-1.5'
            }`}/>
          ))}
        </div>

        {step < 5
          ? <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className="btn-primary flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue <ArrowRight size={15}/>
            </button>
          : <button onClick={submit} disabled={busy}
              className="btn-primary flex items-center gap-1.5">
              {busy ? <Spinner size={16}/> : <><CheckCircle2 size={15}/>Submit Journey</>}
            </button>
        }
      </div>
    </div>
  );
}
