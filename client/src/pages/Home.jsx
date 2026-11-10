import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Map, BarChart3, Users, Sparkles,
  TrendingUp, Star, ChevronLeft, ChevronRight, Quote,
  BookOpen, Globe, Zap, CheckCircle2, Play
} from 'lucide-react';
import { feedApi, roadmapsApi } from '../api/index.js';
import { JobCard, RoadmapCard } from '../components/cards/index.jsx';
import { Spinner, SkeletonCard } from '../components/ui/index.jsx';

/* ─── Static data ─── */
const STATS = [
  { icon: Map,      val: '2,400+',  label: 'Career Roadmaps' },
  { icon: Users,    val: '12,000+', label: 'Professionals' },
  { icon: BarChart3,val: '50+',     label: 'Industries' },
  { icon: Star,     val: '4.9 ★',  label: 'Avg. Rating' },
];

const HOW = [
  { n:'01', icon: Search,   title: 'Search Your Goal',    desc: 'Type your dream job title to find real roadmaps from people who made it there.' },
  { n:'02', icon: Map,      title: 'Follow Real Paths',   desc: 'See the exact steps, tools, education, and timelines from 10,000+ professionals.' },
  { n:'03', icon: Users,    title: 'Connect & Learn',     desc: 'Book 1:1 mentor sessions or ask questions in our professional communities.' },
  { n:'04', icon: Sparkles, title: 'Share Your Journey',  desc: 'Once you make it, inspire the next generation by sharing your own roadmap.' },
];

const STORIES = [
  {
    initials: 'SC', name: 'Sarah Chen', from: 'Retail Worker', to: 'Software Engineer at Google',
    quote: 'I never thought I could code. Three years later, I\'m building products used by millions.',
    journey: 'Self-taught → Bootcamp → Junior Dev → Google SWE', timeframe: '3 years',
  },
  {
    initials: 'RK', name: 'Ravi Kumar', from: 'Mechanical Engineer', to: 'Senior Full Stack Dev',
    quote: 'KnowWork showed me the exact path hundreds had taken before me. I was not alone.',
    journey: 'B.Tech → Online Courses → MSME → MNC', timeframe: '4 years',
  },
  {
    initials: 'PM', name: 'Priya Mehta', from: 'Diploma Graduate', to: 'Lead Mould Design Engineer',
    quote: 'People said a diploma is not enough. My 200+ mould designs proved otherwise.',
    journey: 'Diploma → CADD Training → Junior Eng → Lead Engineer', timeframe: '12 years',
  },
];

const QUOTES = [
  { text: '"Every expert was once a beginner."', author: '— Robin Sharma' },
  { text: '"The best time to plant a tree was 20 years ago. The second best time is now."', author: '— Chinese Proverb' },
  { text: '"Your career is what you\'re paid for. Your calling is what you\'re made for."', author: '— Steve Harvey' },
];

const JOURNEY_PERKS = [
  ['Help Students Navigate', 'Your real experiences help students make informed decisions.'],
  ['Build Your Personal Brand', 'Showcase your expertise and attract talent to mentor or hire.'],
  ['Give Back to Community', "Someone's roadmap inspired you — now pay it forward."],
  ['Connect & Network', 'Meet like-minded professionals and expand your network.'],
];

export default function Home() {
  const navigate = useNavigate();
  const [query,   setQuery]   = useState('');
  const [trending, setTrending] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [storyIdx, setStory]    = useState(0);

  useEffect(() => {
    Promise.all([
      feedApi.trending().then(r => setTrending(r?.data || [])),
      roadmapsApi.list({ limit: 6, status: 'published' }).then(r => setRoadmaps(r?.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/roadmaps?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="animate-fade-in">

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden bg-bg-secondary border-b border-bg-border">
        {/* grid lines bg */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#4f7dff 1px,transparent 1px),linear-gradient(90deg,#4f7dff 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-accent/8 blur-3xl pointer-events-none" />

        <div className="relative max-w-screen-xl mx-auto px-6 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-semibold mb-8">
            <TrendingUp size={12} /> Trusted by 12,000+ professionals worldwide
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-text-primary leading-[1.1] tracking-tight mb-6 max-w-4xl mx-auto">
            Discover Real Roadmaps to
            <span className="gradient-text block mt-1">Your Dream Career</span>
          </h1>

          <p className="text-text-muted text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Learn from real professionals — their struggles, mistakes, takeaways, and growth.
          </p>

          {/* Search bar */}
          <form onSubmit={onSearch} className="flex gap-2 max-w-xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input value={query} onChange={e => setQuery(e.target.value)} type="text"
                placeholder="Search job title (e.g., Data Scientist, UX Designer)"
                className="input pl-10 py-3 text-sm" />
            </div>
            <button type="submit" className="btn-primary px-6 py-3 flex-shrink-0 text-sm">Search</button>
          </form>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            <Link to="/roadmaps"    className="btn-primary px-6 py-2.5"><Map size={16} />Explore Roadmaps</Link>
            <Link to="/journey/new" className="btn-outline px-6 py-2.5"><BookOpen size={16} />Share Your Journey</Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(({ icon: Icon, val, label }) => (
              <div key={label} className="card-glass px-4 py-4 flex flex-col items-center gap-2">
                <Icon size={20} className="text-accent" />
                <p className="text-text-primary font-bold text-xl leading-none">{val}</p>
                <p className="text-text-muted text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TRENDING ═══════════════════ */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="section-heading flex items-center gap-2">
              <TrendingUp size={22} className="text-accent" /> Trending Careers
            </h2>
            <p className="section-sub">Most explored job roadmaps this week</p>
          </div>
          <Link to="/roadmaps" className="btn-ghost text-xs">View all <ArrowRight size={12} /></Link>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : trending.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {trending.slice(0, 8).map(job => <JobCard key={job.id} job={job} />)}
          </div>
        ) : (
          /* fallback demo cards */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { id:'1', slug:'web-developer',  title:'Web Developer',        category:'Technology',    icon:'🌐', india_demand_trend:'growing', is_remote_possible:true,  views:48200, saves:3100 },
              { id:'2', slug:'data-scientist',  title:'Data Scientist',       category:'Data',          icon:'📊', india_demand_trend:'growing', is_remote_possible:true,  views:41000, saves:2800 },
              { id:'3', slug:'mould-designer',  title:'Mould Designer',       category:'Manufacturing', icon:'🔩', india_demand_trend:'stable',  is_remote_possible:false, views:18400, saves:1200 },
              { id:'4', slug:'ux-designer',     title:'UX/UI Designer',       category:'Design',        icon:'🎨', india_demand_trend:'growing', is_remote_possible:true,  views:36000, saves:2400 },
              { id:'5', slug:'spm-designer',    title:'SPM Design Engineer',  category:'Manufacturing', icon:'⚙️', india_demand_trend:'growing', is_remote_possible:false, views:12600, saves:780  },
              { id:'6', slug:'digital-marketer',title:'Digital Marketer',     category:'Marketing',     icon:'📣', india_demand_trend:'growing', is_remote_possible:true,  views:28000, saves:1900 },
              { id:'7', slug:'cybersecurity',   title:'Cybersecurity Analyst',category:'Technology',    icon:'🔐', india_demand_trend:'growing', is_remote_possible:true,  views:22000, saves:1600 },
              { id:'8', slug:'civil-engineer',  title:'Civil Engineer',       category:'Infrastructure',icon:'🏗️', india_demand_trend:'stable',  is_remote_possible:false, views:15000, saves:1100 },
            ].map(job => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </section>

      {/* ═══════════════════ OFFICIAL ROADMAPS ═══════════════════ */}
      {roadmaps.length > 0 && (
        <section className="bg-bg-secondary border-y border-bg-border py-16">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-heading flex items-center gap-2">
                  <Globe size={22} className="text-accent" /> Official Career Roadmaps
                </h2>
                <p className="section-sub">Curated paths from collective data of thousands of professionals</p>
              </div>
              <Link to="/roadmaps" className="btn-ghost text-xs">View all <ArrowRight size={12} /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmaps.slice(0, 6).map(r => <RoadmapCard key={r.id} roadmap={r} />)}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="section-heading">How It Works</h2>
          <p className="section-sub mt-2 max-w-md mx-auto">
            From zero to hired — here's how KnowWork helps you navigate your career
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="card p-6 relative group hover:border-accent/30 transition-all">
              <span className="absolute top-4 right-4 text-4xl font-black text-bg-border leading-none select-none">{n}</span>
              <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <Icon size={20} className="text-accent" />
              </div>
              <h3 className="text-text-primary font-semibold text-sm mb-2">{title}</h3>
              <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ SUCCESS STORIES ═══════════════════ */}
      <section id="stories" className="bg-bg-secondary border-y border-bg-border py-16">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="section-heading">Success Stories</h2>
            <p className="section-sub mt-2">Real transformations from people who dared to change their career path</p>
          </div>

          {/* Feature carousel */}
          <div className="relative max-w-3xl mx-auto mb-8">
            <div className="card p-8 sm:p-10 min-h-[200px]">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-brand-purple flex items-center justify-center text-white text-2xl font-black">
                    {STORIES[storyIdx].initials}
                  </div>
                  <div className="text-center">
                    <p className="text-text-primary font-semibold text-sm">{STORIES[storyIdx].name}</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap justify-center">
                      <span className="badge-gray text-[10px]">{STORIES[storyIdx].from}</span>
                      <ArrowRight size={10} className="text-text-muted" />
                      <span className="badge-green text-[10px]">{STORIES[storyIdx].to}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <Quote size={24} className="text-accent/30 mb-3" />
                  <p className="text-text-secondary text-base leading-relaxed italic mb-4">
                    "{STORIES[storyIdx].quote}"
                  </p>
                  <div className="space-y-1 text-xs text-text-muted">
                    <p><span className="text-text-primary font-medium">Journey:</span> {STORIES[storyIdx].journey}</p>
                    <p><span className="text-text-primary font-medium">Timeframe:</span> {STORIES[storyIdx].timeframe}</p>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={() => setStory(i => (i - 1 + STORIES.length) % STORIES.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-9 h-9 rounded-full bg-bg-card border border-bg-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/40 transition-all shadow-card">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setStory(i => (i + 1) % STORIES.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-9 h-9 rounded-full bg-bg-card border border-bg-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/40 transition-all shadow-card">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mb-10">
            {STORIES.map((_, i) => (
              <button key={i} onClick={() => setStory(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === storyIdx ? 'w-6 bg-accent' : 'w-1.5 bg-bg-border'}`} />
            ))}
          </div>

          {/* Quote cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {QUOTES.map(({ text, author }, i) => (
              <div key={i} className="card p-6 text-center">
                <Quote size={20} className="text-accent/30 mx-auto mb-3" />
                <p className="text-text-secondary text-sm leading-relaxed italic mb-3">{text}</p>
                <p className="text-text-muted text-xs">{author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ SHARE JOURNEY CTA ═══════════════════ */}
      <section className="max-w-screen-xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-6">

          {/* Main CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 to-brand-purple/15 border border-accent/25 p-8">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <h3 className="text-text-primary text-xl font-bold mb-2">Ready to Inspire Others?</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-6">
                Use our guided journey builder to share your complete career story step-by-step.
              </p>
              <ul className="space-y-2.5 mb-7">
                {[
                  'Share your education & career timeline',
                  'Include salary progression & key learnings',
                  'Connect with students seeking mentorship',
                ].map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle2 size={14} className="text-brand-green flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
              <Link to="/journey/new" className="btn-primary">
                Start Sharing Your Journey <ArrowRight size={15} />
              </Link>
              <p className="text-text-muted text-xs mt-3">
                Takes 10–15 minutes · Review before publishing · Edit anytime
              </p>
            </div>
          </div>

          {/* Why share */}
          <div className="card p-8">
            <h3 className="text-text-primary font-semibold mb-6">Why Share Your Journey?</h3>
            <div className="space-y-5">
              {JOURNEY_PERKS.map(([title, desc], i) => (
                <div key={title} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-xs flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="text-text-primary font-medium text-sm mb-0.5">{title}</h4>
                    <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-bg-border">
              <p className="text-accent text-xs font-semibold">
                Join 500+ professionals already sharing their journeys →
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
