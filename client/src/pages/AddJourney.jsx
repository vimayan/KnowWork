import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Trash2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { storiesApi } from '../api/index.js';
import { Spinner } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const STEPS = [
  { id:1, label:'Your Profile',     desc:'Basic info about you' },
  { id:2, label:'Career Timeline',  desc:'Your journey steps' },
  { id:3, label:'Key Learnings',    desc:'Advice & takeaways' },
  { id:4, label:'Review & Submit',  desc:'Publish your story' },
];

const blank = () => ({ title:'', duration:'', description:'', skills:'' });

export default function AddJourney() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAuth = !!user;
  const [step,  setStep]  = useState(1);
  const [busy,  setBusy]  = useState(false);

  const [profile, setP] = useState({
    submitter_name: user?.name || '',
    current_title: '', city: '', country: 'India',
    education: '', salary: '',
  });

  const [jsteps, setJS] = useState([blank(), blank()]);

  const [learn, setL] = useState({
    key_learnings:  [''],
    mistakes_made:  [''],
    advice_to_self: '',
  });

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

  const updJ = (i, k, v) => setJS(s => s.map((x,j)=>j===i?{...x,[k]:v}:x));
  const addJ = () => setJS(s => [...s, blank()]);
  const rmJ  = (i) => setJS(s => s.filter((_,j)=>j!==i));

  const updL = (key, i, v) => setL(s => ({ ...s, [key]: s[key].map((x,j)=>j===i?v:x) }));
  const addL = (key) => setL(s => ({ ...s, [key]: [...s[key], ''] }));
  const rmL  = (key,i) => setL(s => ({ ...s, [key]: s[key].filter((_,j)=>j!==i) }));

  const submit = async () => {
    if (!profile.submitter_name.trim() || !profile.current_title.trim()) {
      toast.error('Name and job title are required');
      return;
    }
    const validSteps = jsteps.filter(s => s.title.trim());
    if (!validSteps.length) {
      toast.error('Add at least one career step');
      return;
    }
    setBusy(true);
    try {
      await storiesApi.submitJourney({
        ...profile,
        steps:          validSteps.map(s => ({ ...s, skills: s.skills.split(',').map(x => x.trim()).filter(Boolean) })),
        key_learnings:  learn.key_learnings.filter(Boolean),
        mistakes_made:  learn.mistakes_made.filter(Boolean),
        advice_to_self: learn.advice_to_self,
      });
      toast.success('Journey submitted for review!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed — please try again');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center justify-center gap-2">
          <BookOpen size={24} className="text-accent"/>Share Your Journey
        </h1>
        <p className="text-text-muted text-sm mt-2">Inspire thousands of students with your real career story</p>
      </div>

      {/* Progress bar */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id  ? 'bg-accent border-accent text-white' :
                step === s.id? 'border-accent text-accent bg-accent/10' :
                              'border-bg-border text-text-muted'
              }`}>
                {step > s.id ? <CheckCircle2 size={13}/> : s.id}
              </div>
              <p className="text-[10px] text-text-muted mt-1 text-center hidden sm:block w-20 leading-tight">{s.label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${step > s.id ? 'bg-accent' : 'bg-bg-border'}`}/>
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="card p-7 animate-fade-in">

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-5">Your Profile</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ['Full Name *',         'submitter_name', 'text', 'Your name'],
                ['Current Job Title *', 'current_title',  'text', 'e.g. Senior Developer'],
                ['City',               'city',            'text', 'Mumbai, Pune...'],
                ['Education',          'education',       'text', 'B.Tech CSE, Diploma...'],
                ['Salary (approx)',     'salary',          'text', '₹12 LPA, $80k...'],
              ].map(([label, key, type, ph]) => (
                <div key={key} className={key === 'submitter_name' ? 'sm:col-span-2' : ''}>
                  <label className="label">{label}</label>
                  <input type={type} value={profile[key]} placeholder={ph}
                    onChange={e=>setP(s=>({...s,[key]:e.target.value}))} className="input"/>
                </div>
              ))}
              <div>
                <label className="label">Country</label>
                <select value={profile.country} onChange={e=>setP(s=>({...s,country:e.target.value}))} className="select">
                  {['India','United States','United Kingdom','Canada','Germany','Australia','Singapore'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-text-primary font-bold text-lg">Career Timeline</h2>
              <button onClick={addJ} className="btn-ghost text-xs"><Plus size={13}/>Add Step</button>
            </div>
            <p className="text-text-muted text-sm mb-5">Each step = a phase of your journey (education, first job, pivot, etc.)</p>
            <div className="space-y-5">
              {jsteps.map((s,i)=>(
                <div key={i} className="p-5 rounded-xl bg-bg-primary border border-bg-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-accent font-bold text-sm">Step {i+1}</span>
                    {jsteps.length > 1 && (
                      <button onClick={()=>rmJ(i)} className="text-text-muted hover:text-brand-rose transition-colors"><Trash2 size={14}/></button>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className="label">Title *</label>
                      <input value={s.title} onChange={e=>updJ(i,'title',e.target.value)} placeholder="e.g. Joined first company" className="input"/></div>
                    <div><label className="label">Duration</label>
                      <input value={s.duration} onChange={e=>updJ(i,'duration',e.target.value)} placeholder="e.g. 2 years" className="input"/></div>
                  </div>
                  <div><label className="label">Description</label>
                    <textarea value={s.description} onChange={e=>updJ(i,'description',e.target.value)}
                      placeholder="What happened during this phase?" rows={3} className="textarea"/></div>
                  <div><label className="label">Skills Gained (comma-separated)</label>
                    <input value={s.skills} onChange={e=>updJ(i,'skills',e.target.value)} placeholder="React, Node.js, System Design" className="input"/></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-text-primary font-bold text-lg">Key Learnings & Advice</h2>
            <p className="text-text-muted text-sm">This is the most valuable part — be honest and specific.</p>

            {[
              ['key_learnings', 'Key Learnings', 'What did you learn?'],
              ['mistakes_made', 'Mistakes Made', 'What would you do differently?'],
            ].map(([key, label, ph]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">{label}</label>
                  <button onClick={()=>addL(key)} className="btn-ghost text-xs py-1"><Plus size={12}/>Add</button>
                </div>
                {learn[key].map((l,i)=>(
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={l} onChange={e=>updL(key,i,e.target.value)} placeholder={ph} className="input flex-1"/>
                    {learn[key].length > 1 && (
                      <button onClick={()=>rmL(key,i)} className="text-text-muted hover:text-brand-rose transition-colors"><Trash2 size={14}/></button>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <div>
              <label className="label">Advice to Your Younger Self</label>
              <textarea value={learn.advice_to_self} rows={4}
                onChange={e=>setL(s=>({...s,advice_to_self:e.target.value}))}
                placeholder="If you could go back and give one piece of advice..." className="textarea"/>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h2 className="text-text-primary font-bold text-lg mb-5">Review Your Journey</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-primary border border-bg-border">
                <h3 className="text-text-primary font-semibold">{profile.submitter_name}</h3>
                <p className="text-text-muted text-sm">{profile.current_title} · {profile.city}, {profile.country}</p>
                {profile.education && <p className="text-text-muted text-xs mt-1">Education: {profile.education}</p>}
                {profile.salary    && <p className="text-text-muted text-xs">Salary: {profile.salary}</p>}
              </div>

              <div>
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2">Journey Steps</p>
                {jsteps.filter(s=>s.title).map((s,i)=>(
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-bg-primary border border-bg-border mb-2">
                    <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">{i+1}</div>
                    <div>
                      <p className="text-text-secondary text-sm font-medium">{s.title}</p>
                      {s.duration && <p className="text-text-muted text-xs">{s.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-brand-green/8 border border-brand-green/20">
                <p className="text-brand-green text-xs font-semibold mb-1">Ready to publish?</p>
                <p className="text-text-secondary text-sm">Your journey will be reviewed before publishing. Takes 1–2 business days.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button onClick={()=>setStep(s=>s-1)} disabled={step===1} className="btn-secondary disabled:opacity-30">
          <ArrowLeft size={15}/>Back
        </button>
        {step < 4
          ? <button onClick={()=>setStep(s=>s+1)} className="btn-primary">Continue <ArrowRight size={15}/></button>
          : <button onClick={submit} disabled={busy} className="btn-primary">
              {busy ? <Spinner size={16}/> : <><CheckCircle2 size={15}/>Submit Journey</>}
            </button>
        }
      </div>
    </div>
  );
}
