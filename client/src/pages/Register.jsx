import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { Spinner } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

const PERKS = [
  'Access 2,400+ real career roadmaps',
  'Follow professionals in your dream field',
  'Book 1:1 sessions with industry mentors',
  'Track your personal career progress',
];

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    const res = await register(form);
    if (res.ok) { toast.success('Account created! Welcome 🎉'); navigate('/dashboard'); }
    else toast.error(res.error || 'Registration failed');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-start">

        {/* Left */}
        <div className="hidden md:block pt-10">
          <Link to="/" className="inline-flex items-center mb-8">
            <img src="/logo/knowwork.svg" alt="KnowWork" className="h-10 w-auto" />
          </Link>
          <h2 className="text-3xl font-bold text-text-primary leading-tight mb-4">
            Start your career journey <span className="gradient-text">today</span>
          </h2>
          <p className="text-text-muted leading-relaxed mb-8">
            Join 12,000+ professionals who've used real roadmaps to navigate their careers.
          </p>
          <div className="space-y-3">
            {PERKS.map(p=>(
              <div key={p} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-brand-green flex-shrink-0"/>
                <span className="text-text-secondary text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="card p-8">
          <h2 className="text-text-primary font-bold text-xl mb-6">Create your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" required value={form.name}
                onChange={e=>setForm(s=>({...s,name:e.target.value}))}
                placeholder="Ravi Kumar" className="input"/>
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" required value={form.email}
                onChange={e=>setForm(s=>({...s,email:e.target.value}))}
                placeholder="you@example.com" className="input"/>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={show?'text':'password'} required value={form.password}
                  onChange={e=>setForm(s=>({...s,password:e.target.value}))}
                  placeholder="Min 8 characters" className="input pr-11"/>
                <button type="button" onClick={()=>setShow(o=>!o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Spinner size={18}/> : <>Create free account <ArrowRight size={15}/></>}
            </button>
          </form>
          <p className="text-center text-text-muted text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover font-semibold transition-colors">Sign in</Link>
          </p>
          <p className="text-center text-text-muted text-xs mt-4">
            By signing up you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
