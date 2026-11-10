import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { Spinner } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form);
    if (res.ok) { toast.success('Welcome back!'); navigate('/dashboard'); }
    else toast.error(res.error || 'Invalid email or password');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6">
            <img src="/logo/knowwork.svg" alt="KnowWork" className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
          <p className="text-text-muted text-sm mt-2">Sign in to your account to continue</p>
        </div>

        <div className="card p-8">
          <div className="bg-accent/8 border border-accent/20 rounded-lg p-3 mb-6">
            <p className="text-accent text-xs font-semibold mb-1">Demo credentials</p>
            <p className="text-text-secondary text-xs">Email: <strong>test@example.com</strong></p>
            <p className="text-text-secondary text-xs">Password: <strong>TestPass1!</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••" className="input pr-11"/>
                <button type="button" onClick={()=>setShow(o=>!o)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <Spinner size={18}/> : <>Sign in <ArrowRight size={15}/></>}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover font-semibold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
