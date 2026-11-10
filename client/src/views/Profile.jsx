import { useState, useEffect } from 'react';
import { useSearchParams, Link } from '../lib/router.jsx';
import { User, Briefcase, MapPin, BadgeCheck, Edit3, Plus, Clock } from 'lucide-react';
import { profilesApi } from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { Spinner, EmptyState } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const TABS = ['overview','work','skills','learning'];

export default function Profile() {
  const [params] = useSearchParams();
  const { user } = useAuthStore();
  const isAuth = !!user;
  const profileId = params.get('id');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profileId) {
      profilesApi.get(profileId).then(r=>setProfile(r?.data)).catch(()=>{}).finally(()=>setLoading(false));
    } else if (isAuth && user?.profile_id) {
      profilesApi.get(user.profile_id).then(r=>setProfile(r?.data)).catch(()=>{}).finally(()=>setLoading(false));
    } else {
      setLoading(false);
    }
  }, [profileId, isAuth, user]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size={36}/></div>;

  if (!profile && !isAuth) return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <User size={48} className="text-text-muted mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-text-primary mb-2">Profile Not Found</h2>
      <Link to="/login" className="btn-primary mx-auto">Sign in to view your profile</Link>
    </div>
  );

  if (!profile) return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <User size={48} className="text-text-muted mx-auto mb-4"/>
      <h2 className="text-xl font-bold text-text-primary mb-2">No Profile Yet</h2>
      <p className="text-text-muted mb-6">Complete your profile to get discovered by mentors and employers</p>
      <button onClick={() => toast.success('Profile creation coming soon!')} className="btn-primary mx-auto">
        <Plus size={16}/>Create Profile
      </button>
    </div>
  );

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-brand-purple flex items-center justify-center text-white font-black text-3xl mx-auto mb-4">
              {profile.avatar_initials || profile.display_name?.[0] || 'P'}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-xl font-bold text-text-primary">{profile.display_name}</h2>
              {profile.is_verified && <BadgeCheck size={18} className="text-accent"/>}
            </div>
            {profile.headline && <p className="text-text-muted text-sm mt-1">{profile.headline}</p>}

            <div className="mt-4 space-y-2 text-sm">
              {profile.current_title && (
                <p className="flex items-center justify-center gap-1.5 text-text-secondary">
                  <Briefcase size={14} className="text-text-muted"/>{profile.current_title}
                  {profile.current_company && ` @ ${profile.current_company}`}
                </p>
              )}
              {profile.city && (
                <p className="flex items-center justify-center gap-1.5 text-text-secondary">
                  <MapPin size={14} className="text-text-muted"/>{profile.city}, {profile.country}
                </p>
              )}
            </div>

            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {profile.years_experience !== undefined && (
                <span className="badge-gray">{profile.years_experience}yr exp</span>
              )}
              {profile.employer_type && <span className="badge-gray uppercase">{profile.employer_type}</span>}
              {profile.open_to_mentor && <span className="badge-green">Open to Mentor</span>}
            </div>

            {isAuth && !profileId && (
              <button onClick={()=>toast.success('Edit mode coming soon!')} className="btn-secondary w-full justify-center mt-5 text-xs">
                <Edit3 size={13}/>Edit Profile
              </button>
            )}
          </div>

          {profile.languages?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-text-primary font-semibold text-sm mb-3">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((l,i)=><span key={i} className="badge-gray">{l}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="lg:col-span-2">
          <div className="flex gap-1 mb-5 overflow-x-auto scrollbar-hide">
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-4 py-2 rounded-lg text-xs font-medium capitalize flex-shrink-0 transition-all ${
                  tab===t ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`}>{t}</button>
            ))}
          </div>

          {tab==='overview' && (
            <div className="space-y-5">
              {profile.bio && (
                <div className="card p-6">
                  <h3 className="text-text-primary font-semibold mb-3">Bio</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{profile.bio}</p>
                </div>
              )}
              {(profile.linkedin_url || profile.github_url || profile.portfolio_url) && (
                <div className="card p-5">
                  <h3 className="text-text-primary font-semibold text-sm mb-3">Links</h3>
                  <div className="space-y-2">
                    {[
                      ['LinkedIn',  profile.linkedin_url],
                      ['GitHub',    profile.github_url],
                      ['Portfolio', profile.portfolio_url],
                    ].filter(([,v]) => v).map(([label, url]) => (
                      <a key={label} href={url} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-accent hover:text-accent-hover text-sm transition-colors">
                        {label} →
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab==='work' && (
            profile.work_history?.length > 0
              ? <div className="space-y-4">
                  {profile.work_history.map((w,i)=>(
                    <div key={i} className="card p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-text-primary font-semibold">{w.job_title}</h4>
                          <p className="text-accent text-sm">{w.company_name}</p>
                          <p className="text-text-muted text-xs mt-0.5 flex items-center gap-1">
                            <Clock size={11}/>{w.start_year} — {w.is_current ? 'Present' : (w.end_year || '—')}
                          </p>
                        </div>
                        {w.employer_type && <span className="badge-gray uppercase text-[10px]">{w.employer_type}</span>}
                      </div>
                      {w.description && <p className="text-text-secondary text-sm mt-3 leading-relaxed">{w.description}</p>}
                      {w.skills_used?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {w.skills_used.map((s,j) => <span key={j} className="badge-blue text-[10px]">{s}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              : <EmptyState title="No work history" desc="Add your work experience to complete your profile"/>
          )}

          {tab==='skills' && (
            profile.skills?.length > 0
              ? <div className="card p-6">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {profile.skills.map((s,i)=>(
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-bg-primary border border-bg-border">
                        <span className="text-text-secondary text-sm">{s.skill_name}</span>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_,j)=>(
                            <div key={j} className={`w-2 h-4 rounded-sm ${j < s.proficiency ? 'bg-accent' : 'bg-bg-border'}`}/>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              : <EmptyState title="No skills listed" desc="Add your skills to showcase your expertise"/>
          )}

          {tab==='learning' && (
            profile.learning_path?.length > 0
              ? <div className="space-y-3">
                  {profile.learning_path.map((l,i)=>(
                    <div key={i} className="card p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-text-primary font-semibold text-sm">{l.title}</h4>
                        <span className="badge-gray capitalize text-[10px]">{l.item_type}</span>
                      </div>
                      {l.provider && <p className="text-text-muted text-xs">{l.provider}</p>}
                      {l.year_completed && <p className="text-text-muted text-xs">Completed {l.year_completed}</p>}
                      {l.skills_gained?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {l.skills_gained.map((s,j) => <span key={j} className="badge-blue text-[10px]">{s}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              : <EmptyState title="No learning path" desc="Add courses and certifications you're working on"/>
          )}
        </div>
      </div>
    </div>
  );
}
