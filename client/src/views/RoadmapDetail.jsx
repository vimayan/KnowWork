import { useState, useEffect } from 'react';
import { useParams, Link } from '../lib/router.jsx';
import { Clock, Heart, BarChart3, BookOpen, ChevronDown, ChevronUp, CheckCircle2, ArrowRight } from 'lucide-react';
import { roadmapsApi } from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { Spinner } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function RoadmapDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const isAuth = !!user;
  const [roadmap,  setRoadmap]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [openIdx,  setOpenIdx]  = useState(new Set([0]));
  const [liked,    setLiked]    = useState(false);
  const [progress, setProgress] = useState(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    roadmapsApi.get(id).then(r => setRoadmap(r?.data)).catch(() => {}).finally(() => setLoading(false));
    if (isAuth) roadmapsApi.getProgress(id).then(r => setProgress(r?.data)).catch(() => {});
  }, [id, isAuth]);

  const toggleStep = (i) => setOpenIdx(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const handleLike = async () => {
    try { await roadmapsApi.like(id); setLiked(true); setRoadmap(r => ({ ...r, likes: (r.likes||0)+1 })); }
    catch(e) { toast.error(e.message); }
  };

  const handleStart = async () => {
    if (!isAuth) { toast.error('Login to track your progress'); return; }
    setSaving(true);
    try {
      await roadmapsApi.saveProgress(id, { current_step_id: roadmap?.steps?.[0]?.id });
      toast.success('Roadmap started! Track progress in your Dashboard.');
    } catch(e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size={36}/></div>;
  if (!roadmap) return <div className="text-center py-24 text-text-muted">Roadmap not found</div>;

  const phases = [...new Set((roadmap.steps || []).map(s => s.phase).filter(Boolean))];

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {roadmap.is_official && (
                    <div className="flex items-center gap-1 text-accent">
                      <CheckCircle2 size={13}/><span className="text-xs font-semibold">Official</span>
                    </div>
                  )}
                  <span className="badge-gray text-xs capitalize">{roadmap.trajectory_type?.replace('_',' ')}</span>
                </div>
                <h1 className="text-xl font-bold text-text-primary">{roadmap.title}</h1>
                {roadmap.job_card_title && <p className="text-text-muted text-sm mt-1">For: {roadmap.job_card_title}</p>}
              </div>
              <button onClick={handleLike} disabled={liked}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex-shrink-0 ${
                  liked ? 'border-brand-rose/40 text-brand-rose bg-brand-rose/10' : 'border-bg-border text-text-muted hover:text-text-primary hover:border-bg-hover'
                }`}>
                <Heart size={13} className={liked ? 'fill-current' : ''}/>
                {roadmap.likes || 0}
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              {roadmap.estimated_months && <span className="flex items-center gap-1.5"><Clock size={14}/>{roadmap.estimated_months} months</span>}
              {roadmap.difficulty && <span className="flex items-center gap-1.5 capitalize"><BarChart3 size={14}/>{roadmap.difficulty}</span>}
            </div>
            {roadmap.target_audience && (
              <div className="mt-4 p-3 rounded-lg bg-accent/8 border border-accent/20">
                <p className="text-accent text-xs font-semibold mb-0.5">For whom:</p>
                <p className="text-text-secondary text-sm">{roadmap.target_audience}</p>
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-2.5">
            {(roadmap.steps || []).map((step, i) => (
              <div key={step.id}
                className={`card overflow-hidden transition-all ${progress?.current_step_id === step.id ? 'border-accent/50' : ''}`}>
                <button onClick={() => toggleStep(i)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-bg-hover transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${
                    step.is_milestone ? 'bg-accent border-accent text-white' : 'border-bg-border text-text-muted'
                  }`}>
                    {step.is_milestone ? '★' : i + 1}
                  </div>
                  <div className="flex-1">
                    {step.phase && <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wide mb-0.5">{step.phase}</p>}
                    <p className="text-text-primary font-semibold text-sm">{step.title}</p>
                    {step.duration_weeks && <p className="text-text-muted text-xs mt-0.5">{step.duration_weeks} weeks</p>}
                  </div>
                  {step.skills_gained?.length > 0 && (
                    <span className="text-text-muted text-[10px] hidden sm:block">{step.skills_gained.length} skills</span>
                  )}
                  {openIdx.has(i) ? <ChevronUp size={16} className="text-text-muted flex-shrink-0"/> : <ChevronDown size={16} className="text-text-muted flex-shrink-0"/>}
                </button>

                {openIdx.has(i) && (
                  <div className="px-4 pb-4 pt-1 border-t border-bg-border animate-fade-in">
                    {step.description && <p className="text-text-secondary text-sm leading-relaxed mb-3">{step.description}</p>}
                    {step.skills_gained?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-text-muted text-xs mb-2">Skills gained:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {step.skills_gained.map((s,j)=><span key={j} className="badge-blue text-[10px]">{s}</span>)}
                        </div>
                      </div>
                    )}
                    {step.resources?.length > 0 && (
                      <div>
                        <p className="text-text-muted text-xs mb-2">Resources:</p>
                        <div className="space-y-1.5">
                          {step.resources.map((r,j)=>(
                            <div key={j} className="flex items-center gap-2 text-xs">
                              <span className="badge-gray text-[9px] uppercase flex-shrink-0">{r.resource_type}</span>
                              <span className="text-text-secondary flex-1">{r.title}</span>
                              {r.is_free && <span className="text-brand-green text-[10px]">Free</span>}
                              {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-hover">→</a>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-6 sticky top-20">
            <h3 className="text-text-primary font-semibold mb-5">Start This Roadmap</h3>
            <div className="space-y-3 mb-5 text-sm">
              {[
                ['Duration',   `${roadmap.estimated_months} months`],
                ['Difficulty', roadmap.difficulty],
                ['Steps',      roadmap.steps?.length || 0],
                ['Liked by',   `${(roadmap.likes||0).toLocaleString('en-IN')} people`],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between">
                  <span className="text-text-muted">{k}</span>
                  <span className="text-text-secondary capitalize font-medium">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={handleStart} disabled={saving} className="btn-primary w-full justify-center mb-3">
              {saving ? <Spinner size={16}/> : <><BookOpen size={15}/>{progress ? 'Continue' : 'Start Roadmap'}</>}
            </button>
            {roadmap.job_card_slug && (
              <Link to={`/career/${roadmap.job_card_slug}`} className="btn-secondary w-full justify-center text-xs">
                View Career Details <ArrowRight size={12}/>
              </Link>
            )}
          </div>

          {phases.length > 0 && (
            <div className="card p-5">
              <h3 className="text-text-primary font-semibold text-sm mb-3">Phases</h3>
              {phases.map((p,i)=>(
                <div key={i} className="flex items-center gap-2 text-xs py-1.5 border-b border-bg-border last:border-0">
                  <div className="w-5 h-5 rounded-md bg-accent/10 flex items-center justify-center text-accent text-[9px] font-bold">{i+1}</div>
                  <span className="text-text-secondary flex-1">{p}</span>
                  <span className="text-text-muted">{(roadmap.steps||[]).filter(s=>s.phase===p).length} steps</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
