import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Bookmark, Calendar,
  Bell, TrendingUp, ArrowRight, Plus, CheckCircle2, Clock, Target
} from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { usersApi, mentorsApi, feedApi } from '../api/index.js';
import { Spinner, EmptyState } from '../components/ui/index.jsx';
import Goals from '../components/dashboard/Goals.jsx';

const TABS = [
  { id:'overview',  label:'Overview',     icon: LayoutDashboard },
  { id:'goals',     label:'Goals',        icon: Target },
  { id:'roadmaps',  label:'My Roadmaps',  icon: BookOpen },
  { id:'saved',     label:'Saved Jobs',   icon: Bookmark },
  { id:'sessions',  label:'Sessions',     icon: Calendar },
  { id:'feed',      label:'My Feed',      icon: Bell },
];

export default function Dashboard() {
  const { user, initialized } = useAuthStore();
  const isAuth = !!user;
  const navigate = useNavigate();
  const [tab,      setTab]     = useState('overview');
  const [agenda,   setAgenda]  = useState([]);
  const [saved,    setSaved]   = useState([]);
  const [sessions, setSessions]= useState([]);
  const [feed,     setFeed]    = useState({ items: [] });
  const [trending, setTrending]= useState([]);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuth) { navigate('/login'); return; }
    setLoading(true);
    Promise.all([
      usersApi.agenda().then(r=>setAgenda(r?.data||[])).catch(()=>{}),
      usersApi.savedJobs().then(r=>setSaved(r?.data||[])).catch(()=>{}),
      mentorsApi.mySessions().then(r=>setSessions(r?.data||[])).catch(()=>{}),
      feedApi.get().then(r=>setFeed(r?.data||{items:[]})).catch(()=>{}),
      feedApi.trending().then(r=>setTrending(r?.data||[])).catch(()=>{}),
    ]).finally(()=>setLoading(false));
  }, [isAuth, initialized]);

  if (!initialized) return <div className="flex justify-center py-24"><Spinner size={32}/></div>;
  if (!isAuth) return null;

  const upcoming  = sessions.filter(s=>['pending','confirmed'].includes(s.status));
  const completed = sessions.filter(s=>s.status==='completed');

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-text-muted text-sm mt-1">Here's your career journey at a glance</p>
        </div>
        <Link to="/journey/new" className="btn-primary text-xs">
          <Plus size={14}/>Add Journey
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={()=>setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium flex-shrink-0 transition-all ${
              tab===id ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}>
            <Icon size={13}/>{label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={32}/></div> : (
        <div className="animate-fade-in">

          {/* OVERVIEW */}
          {tab==='overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label:'Active Roadmaps',   val: agenda.length,   icon: BookOpen,  cls:'text-accent' },
                  { label:'Saved Jobs',         val: saved.length,    icon: Bookmark,  cls:'text-brand-amber' },
                  { label:'Upcoming Sessions',  val: upcoming.length, icon: Calendar,  cls:'text-brand-green' },
                  { label:'Feed Items',         val: feed.items?.length||0, icon:Bell, cls:'text-brand-purple' },
                ].map(({ label, val, icon: Icon, cls }) => (
                  <div key={label} className="card p-5">
                    <Icon size={20} className={`${cls} mb-3`}/>
                    <p className="text-text-primary text-2xl font-bold">{val}</p>
                    <p className="text-text-muted text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {agenda.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                    <BookOpen size={16} className="text-accent"/>Active Roadmaps
                  </h3>
                  <div className="space-y-3">
                    {agenda.map((a,i)=>(
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-bg-primary border border-bg-border">
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary font-medium text-sm truncate">{a.roadmap_title}</p>
                          <p className="text-text-muted text-xs capitalize">{a.difficulty} · {a.estimated_months} months</p>
                        </div>
                        {a.current_step_title && <p className="text-text-secondary text-xs hidden sm:block">{a.current_step_title}</p>}
                        <Link to={`/roadmaps/${a.roadmap_id}`} className="text-accent hover:text-accent-hover flex-shrink-0">
                          <ArrowRight size={14}/>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {upcoming.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                    <Calendar size={16} className="text-brand-green"/>Upcoming Sessions
                  </h3>
                  <div className="space-y-3">
                    {upcoming.map((s,i)=>(
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary border border-bg-border">
                        <div className="w-10 h-10 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center">
                          <Calendar size={16} className="text-brand-green"/>
                        </div>
                        <div className="flex-1">
                          <p className="text-text-primary text-sm font-medium">{s.topic || 'Career Session'}</p>
                          <p className="text-text-muted text-xs">with {s.mentor_name}</p>
                        </div>
                        <span className={`badge capitalize text-xs ${s.status==='confirmed'?'badge-green':'badge-amber'}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {trending.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-accent"/>Trending This Week
                  </h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {trending.slice(0,8).map((job,i)=>(
                      <Link key={job.id} to={`/career/${job.slug}`}
                        className="flex items-center gap-2 p-3 rounded-xl bg-bg-primary border border-bg-border hover:border-accent/40 transition-all">
                        <span className="text-accent/50 text-xs font-black w-5">#{i+1}</span>
                        <div className="min-w-0">
                          <p className="text-text-secondary text-xs font-medium truncate">{job.title}</p>
                          <p className="text-text-muted text-[10px]">{job.category}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GOALS */}
          {tab==='goals' && <Goals/>}

          {/* ROADMAPS */}
          {tab==='roadmaps' && (
            agenda.length === 0
              ? <EmptyState title="No active roadmaps" desc="Start following a roadmap to track your progress"
                  action={<Link to="/roadmaps" className="btn-primary">Browse Roadmaps</Link>}/>
              : <div className="space-y-4">
                  {agenda.map((a,i)=>(
                    <div key={i} className="card p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-text-primary font-semibold">{a.roadmap_title}</h3>
                          <p className="text-text-muted text-sm mt-0.5 capitalize">{a.difficulty} · {a.estimated_months} months</p>
                        </div>
                        <Link to={`/roadmaps/${a.roadmap_id}`} className="btn-ghost text-xs flex-shrink-0">
                          Continue <ArrowRight size={12}/>
                        </Link>
                      </div>
                      {a.current_step_title && (
                        <div className="mt-4 p-3 rounded-lg bg-bg-primary border border-bg-border">
                          <p className="text-text-muted text-xs mb-0.5">Current step</p>
                          <p className="text-text-secondary text-sm">{a.current_step_title}</p>
                        </div>
                      )}
                      {a.hours_spent && (
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-3">
                          <Clock size={12}/>
                          Hours logged: {Object.values(a.hours_spent).reduce((s,v)=>+s+ +v,0)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
          )}

          {/* SAVED */}
          {tab==='saved' && (
            saved.length === 0
              ? <EmptyState title="No saved jobs" desc="Bookmark interesting careers to revisit them later"
                  action={<Link to="/roadmaps" className="btn-primary">Explore Careers</Link>}/>
              : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {saved.map((j,i)=>(
                    <div key={i} className="card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{j.icon||'💼'}</span>
                        <span className="text-text-muted text-xs">{j.saved_at ? new Date(j.saved_at).toLocaleDateString():'—'}</span>
                      </div>
                      <h3 className="text-text-primary font-semibold text-sm mb-1">{j.title}</h3>
                      <p className="text-text-muted text-xs mb-4">{j.category}</p>
                      <Link to={`/career/${j.slug}`} className="btn-secondary justify-center text-xs w-full">
                        View <ArrowRight size={11}/>
                      </Link>
                    </div>
                  ))}
                </div>
          )}

          {/* SESSIONS */}
          {tab==='sessions' && (
            <div className="space-y-6">
              {upcoming.length > 0 && (
                <div>
                  <h3 className="text-text-primary font-semibold mb-3">Upcoming</h3>
                  <div className="space-y-3">
                    {upcoming.map((s,i)=>(
                      <div key={i} className="card p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green flex-shrink-0">
                          <Calendar size={20}/>
                        </div>
                        <div className="flex-1">
                          <p className="text-text-primary font-medium">{s.topic||'Career Session'}</p>
                          <p className="text-text-muted text-sm">with {s.mentor_name}</p>
                          {s.scheduled_at && <p className="text-accent text-xs mt-0.5">{new Date(s.scheduled_at).toLocaleString()}</p>}
                        </div>
                        <span className={`badge capitalize ${s.status==='confirmed'?'badge-green':'badge-amber'}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {completed.length > 0 && (
                <div>
                  <h3 className="text-text-primary font-semibold mb-3">Completed</h3>
                  <div className="space-y-3">
                    {completed.map((s,i)=>(
                      <div key={i} className="card p-5 flex items-center gap-4 opacity-70">
                        <div className="w-12 h-12 rounded-xl bg-bg-border flex items-center justify-center text-text-muted flex-shrink-0">
                          <CheckCircle2 size={20}/>
                        </div>
                        <div className="flex-1">
                          <p className="text-text-primary font-medium">{s.topic||'Session'}</p>
                          <p className="text-text-muted text-sm">with {s.mentor_name}</p>
                        </div>
                        <span className="badge-gray capitalize">{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sessions.length === 0 && (
                <EmptyState title="No sessions yet" desc="Book a session with a mentor to get started"
                  action={<Link to="/mentors" className="btn-primary">Find a Mentor</Link>}/>
              )}
            </div>
          )}

          {/* FEED */}
          {tab==='feed' && (
            !feed.items?.length
              ? <EmptyState title="Your feed is empty" desc="Select career areas to see relevant content"
                  action={<Link to="/roadmaps" className="btn-primary">Explore Careers</Link>}/>
              : <div className="space-y-3">
                  {feed.items.map((item,i)=>(
                    <div key={i} className={`card p-5 ${item.is_locked?'opacity-55':''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="badge-gray text-[10px] capitalize">{item.item_type?.replace('_',' ')}</span>
                        {item.is_locked && <span className="badge-amber text-[10px]">🔒 Upgrade</span>}
                      </div>
                      <p className="text-text-primary font-medium text-sm">{item.item_data?.title || item.item_type}</p>
                      {item.item_data?.summary && <p className="text-text-muted text-xs mt-1 line-clamp-2">{item.item_data.summary}</p>}
                    </div>
                  ))}
                </div>
          )}
        </div>
      )}
    </div>
  );
}
