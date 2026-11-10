import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Globe, CheckCircle2, MessageSquare, IndianRupee, Star } from 'lucide-react';
import { mentorsApi } from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { Spinner, StarRating, Modal } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function MentorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAuth = !!user;
  const [mentor,   setMentor]  = useState(null);
  const [loading,  setLoading] = useState(true);
  const [bookOpen, setBook]    = useState(false);
  const [form, setForm] = useState({ topic:'', student_goal:'', duration_min:60 });
  const [submitting, setSub]   = useState(false);

  useEffect(() => {
    mentorsApi.get(id)
      .then(r => setMentor(r?.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!isAuth) { toast.error('Please login to book a session'); navigate('/login'); return; }
    setSub(true);
    try {
      await mentorsApi.book(id, form);
      toast.success('Session booked! The mentor will confirm shortly.');
      setBook(false);
    } catch(err) { toast.error(err.message); }
    finally { setSub(false); }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size={36}/></div>;
  if (!mentor) return <div className="text-center py-24 text-text-muted">Mentor not found</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-7 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-brand-purple flex items-center justify-center text-white font-black text-3xl mx-auto mb-4">
              {mentor.avatar_initials || mentor.name?.[0] || 'M'}
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-1">{mentor.name}</h1>
            <p className="text-text-muted text-sm">{mentor.title}</p>
            <p className="text-accent text-sm">{mentor.company}</p>

            <div className="flex items-center justify-center gap-2 mt-3">
              <StarRating rating={mentor.rating} size={16}/>
              <span className="text-text-primary font-bold">{mentor.rating || '—'}</span>
              <span className="text-text-muted text-xs">({mentor.total_reviews} reviews)</span>
            </div>

            <div className="flex items-center justify-center gap-2 mt-2.5">
              {mentor.available
                ? <span className="badge-green"><span className="w-1.5 h-1.5 rounded-full bg-brand-green"/>Available</span>
                : <span className="badge-gray">Unavailable</span>
              }
            </div>

            <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-bg-border text-center">
              <div>
                <p className="text-text-primary font-bold text-xl">{mentor.total_sessions}</p>
                <p className="text-text-muted text-xs">Sessions</p>
              </div>
              <div>
                <p className="text-text-primary font-bold text-xl flex items-center justify-center gap-0.5">
                  <IndianRupee size={14}/>{mentor.hourly_rate_inr?.toLocaleString('en-IN') || 'Free'}
                </p>
                <p className="text-text-muted text-xs">/hour</p>
              </div>
            </div>

            <button onClick={()=>setBook(true)} disabled={!mentor.available}
              className="btn-primary w-full justify-center mt-5 disabled:opacity-40 disabled:cursor-not-allowed">
              <MessageSquare size={15}/>Book a Session
            </button>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="text-text-primary font-semibold text-sm">Details</h3>
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <Clock size={14} className="text-text-muted"/>{mentor.session_duration_min || 60} min sessions
            </div>
            {mentor.languages?.length > 0 && (
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <Globe size={14} className="text-text-muted"/>Speaks: {mentor.languages.join(', ')}
              </div>
            )}
            {mentor.job_card_title && (
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <CheckCircle2 size={14} className="text-brand-green"/>Expert: {mentor.job_card_title}
              </div>
            )}
          </div>

          {mentor.expertise?.length > 0 && (
            <div className="card p-5">
              <h3 className="text-text-primary font-semibold text-sm mb-3">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {mentor.expertise.map((e,i)=>(
                  <span key={i} className="badge-blue text-xs">{typeof e==='object'?e.skill:e}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {mentor.bio && (
            <div className="card p-6">
              <h2 className="text-text-primary font-semibold mb-3">About</h2>
              <p className="text-text-secondary text-sm leading-relaxed">{mentor.bio}</p>
            </div>
          )}

          <div className="card p-6">
            <h2 className="text-text-primary font-semibold mb-5">What You'll Get</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                ['Career Guidance', 'Personalised advice for your specific situation and goals'],
                ['Resume Review', 'Expert feedback on your resume from an industry professional'],
                ['Interview Prep', 'Practice with real questions and get honest, actionable feedback'],
              ].map(([title, desc]) => (
                <div key={title} className="p-4 rounded-xl bg-bg-primary border border-bg-border">
                  <h4 className="text-text-primary font-semibold text-sm mb-1.5">{title}</h4>
                  <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-text-primary font-semibold mb-5">How to Book</h2>
            <div className="space-y-4">
              {[
                ['1','Click "Book a Session"','Fill in your topic, goal, and preferred duration'],
                ['2','Mentor Confirms','The mentor reviews and confirms within 24 hours'],
                ['3','Join the Call','Connect on Google Meet, Zoom, or your preferred platform'],
                ['4','Leave a Review','Share your experience to help other students'],
              ].map(([n,title,desc])=>(
                <div key={n} className="flex gap-4">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">{n}</div>
                  <div>
                    <p className="text-text-primary font-semibold text-sm">{title}</p>
                    <p className="text-text-muted text-xs mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>setBook(true)} disabled={!mentor.available}
              className="btn-primary mt-6 disabled:opacity-40 disabled:cursor-not-allowed">
              <MessageSquare size={15}/>Book — {mentor.hourly_rate_inr ? `₹${mentor.hourly_rate_inr}/hr` : 'Free'}
            </button>
          </div>
        </div>
      </div>

      <Modal open={bookOpen} onClose={()=>setBook(false)} title="Book a Session">
        <form onSubmit={handleBook} className="space-y-4">
          <div>
            <label className="label">Topic</label>
            <input required value={form.topic} onChange={e=>setForm(s=>({...s,topic:e.target.value}))}
              placeholder="e.g. Resume review for web dev roles" className="input"/>
          </div>
          <div>
            <label className="label">Your Goal (optional)</label>
            <textarea value={form.student_goal} onChange={e=>setForm(s=>({...s,student_goal:e.target.value}))}
              placeholder="What do you want to achieve?" rows={3} className="textarea"/>
          </div>
          <div>
            <label className="label">Duration</label>
            <select value={form.duration_min} onChange={e=>setForm(s=>({...s,duration_min:+e.target.value}))} className="select">
              {[30,45,60,90,120].map(m=>(
                <option key={m} value={m}>{m} min{mentor.hourly_rate_inr ? ` — ₹${Math.round(mentor.hourly_rate_inr*m/60)}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={()=>setBook(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? <Spinner size={16}/> : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
