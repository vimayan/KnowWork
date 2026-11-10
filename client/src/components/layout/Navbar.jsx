'use client';
import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from '../../lib/router.jsx';
import {
  BookOpen, BarChart3, GitCompare, Users, Compass, Map,
  Sparkles, LayoutDashboard, Menu, X, ChevronDown,
  LogOut, User, Settings, Bookmark
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/roadmaps',    label: 'Explore Roadmaps',  icon: Map },
  { to: '/categories',  label: 'Category Roadmaps', icon: BookOpen },
  { to: '/salary',      label: 'Salary Analytics',  icon: BarChart3 },
  { to: '/compare',     label: 'Compare',           icon: GitCompare },
  { to: '/mentors',     label: 'Find Mentors',      icon: Users },
  { to: '/journey/new', label: 'Add Journey',       icon: Compass },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const isAuth = !!user;
  const [mobileOpen, setMobile] = useState(false);
  const [userOpen,   setUser]   = useState(false);
  const userRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => { if (userRef.current && !userRef.current.contains(e.target)) setUser(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
    setUser(false);
    setMobile(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/90 backdrop-blur-md border-b border-bg-border">
      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 h-14 flex items-center gap-4">

        {/* ── Logo ── */}
        <Link to="/" className="flex items-center flex-shrink-0 mr-2">
          <img src="/logo/knowwork-dark.svg" alt="KnowWork" className="h-9 w-auto" />
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden xl:flex items-center gap-0.5 flex-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                }`
              }>
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Right side ── */}
        <div className="ml-auto flex items-center gap-2">

          {/* AI Guide Beta */}
          <NavLink to="/ai-guide"
            className={({ isActive }) =>
              `hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive ? 'bg-brand-amber/20 text-brand-amber' : 'bg-brand-amber/10 text-brand-amber hover:bg-brand-amber/15'
              } border border-brand-amber/20`
            }>
            <Sparkles size={12} />
            AI Guide
            <span className="text-[9px] bg-brand-amber text-bg-primary font-black px-1.5 py-0.5 rounded-full leading-none">
              BETA
            </span>
          </NavLink>

          {isAuth ? (
            <>
              {/* Dashboard link */}
              <NavLink to="/dashboard"
                className={({ isActive }) =>
                  `hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive ? 'bg-accent/15 text-accent' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`
                }>
                <LayoutDashboard size={13} />
                Dashboard
              </NavLink>

              {/* User avatar menu */}
              <div className="relative" ref={userRef}>
                <button onClick={() => setUser(o => !o)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-bg-hover transition-all">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-brand-purple flex items-center justify-center text-white text-xs font-bold">
                    {(user?.avatar_initials || user?.name?.[0] || 'U').toUpperCase()}
                  </div>
                  <ChevronDown size={12} className="text-text-muted hidden sm:block" />
                </button>

                {userOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 card shadow-card py-1 animate-fade-in">
                    <div className="px-3 py-2 border-b border-bg-border mb-1">
                      <p className="text-text-primary text-xs font-semibold truncate">{user?.name}</p>
                      <p className="text-text-muted text-[11px] truncate">{user?.email}</p>
                    </div>
                    {[
                      { to: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
                      { to: '/profile',   label: 'My Profile',   icon: User },
                    ].map(({ to, label, icon: Icon }) => (
                      <Link key={to} to={to} onClick={() => setUser(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-bg-hover text-xs transition-all">
                        <Icon size={13} />
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-bg-border mt-1 pt-1">
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-brand-rose hover:bg-brand-rose/10 text-xs transition-all">
                        <LogOut size={13} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login"    className="btn-ghost text-xs py-1.5 px-3">Sign in</Link>
              <Link to="/register" className="btn-primary text-xs py-1.5 px-4">Get started</Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button onClick={() => setMobile(o => !o)}
            className="xl:hidden p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-all">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-bg-border bg-bg-secondary px-4 py-3 animate-fade-in">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setMobile(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                  isActive ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`
              }>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <NavLink to="/ai-guide" onClick={() => setMobile(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 text-brand-amber hover:bg-brand-amber/10 transition-all">
            <Sparkles size={16} /> AI Guide (Beta)
          </NavLink>
          <div className="border-t border-bg-border mt-3 pt-3">
            {isAuth ? (
              <>
                <NavLink to="/dashboard" onClick={() => setMobile(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-all">
                  <LayoutDashboard size={16} /> Dashboard
                </NavLink>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-brand-rose hover:bg-brand-rose/10 transition-all">
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login"    onClick={() => setMobile(false)} className="flex-1 btn-outline justify-center text-sm">Sign in</Link>
                <Link to="/register" onClick={() => setMobile(false)} className="flex-1 btn-primary justify-center text-sm">Get started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
