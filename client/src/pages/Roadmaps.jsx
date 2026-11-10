import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import { jobCardsApi, roadmapsApi } from '../api/index.js';
import { JobCard, RoadmapCard } from '../components/cards/index.jsx';
import { Spinner, EmptyState, Pagination, SkeletonCard } from '../components/ui/index.jsx';
import { useDebounce } from '../hooks/useFetch.js';

const TITLES   = ['Software Engineer','Data Scientist','UX Designer','Product Manager','Marketing Manager','Sales Representative','Business Analyst','DevOps Engineer','Frontend Developer','Backend Developer','Full Stack Developer','Mobile Developer'];
const COUNTRIES= ['India','United States','Canada','United Kingdom','Germany','Australia','Singapore'];
const EDUS     = ["Bachelor's Degree","Master's Degree","PhD","Bootcamp","Self-taught","Associate Degree","Certification Program"];

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group select-none">
      <div onClick={onChange}
        className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-all ${checked ? 'bg-accent border-accent' : 'border-bg-border group-hover:border-accent/50'}`}>
        {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span className="text-text-secondary text-xs group-hover:text-text-primary transition-colors">{label}</span>
    </label>
  );
}

function FilterGroup({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-bg-border pb-4">
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full mb-3 text-left">
        <span className="text-text-primary font-semibold text-xs uppercase tracking-wide">{title}</span>
        <span className="text-text-muted text-xs">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}

export default function Roadmaps() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab,     setTab]     = useState('jobs');
  const [items,   setItems]   = useState([]);
  const [meta,    setMeta]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebar, setSidebar] = useState(true);
  const [page,    setPage]    = useState(1);

  const [q,        setQ]        = useState(searchParams.get('q') || '');
  const [remote,   setRemote]   = useState(false);
  const [freelance,setFreelance]= useState(false);
  const [titles,   setTitles]   = useState([]);
  const [countries,setCountries]= useState([]);
  const [edu,      setEdu]      = useState([]);
  const [salMax,   setSalMax]   = useState(300000);
  const [expMax,   setExpMax]   = useState(20);

  const dq = useDebounce(q, 400);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (dq)       params.q        = dq;
    if (remote)   params.remote   = true;
    if (freelance) params.freelance = true;

    const fn = tab === 'jobs'
      ? jobCardsApi.list(params)
      : roadmapsApi.list({ ...params, status: 'published' });

    fn.then(r => { setItems(r?.data || []); setMeta(r?.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dq, page, tab, remote, freelance]);

  const toggle = (arr, setArr, v) =>
    setArr(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);

  const clearAll = () => {
    setTitles([]); setCountries([]); setEdu([]);
    setRemote(false); setFreelance(false); setQ('');
    setSalMax(300000); setExpMax(20); setPage(1);
  };

  const hasFilters = titles.length || countries.length || edu.length || remote || freelance || q;

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Career Roadmaps</h1>
          <p className="text-text-muted text-sm mt-1">
            {meta?.total ? `${meta.total.toLocaleString('en-IN')} results` : 'Explore all career paths'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-bg-card border border-bg-border overflow-hidden">
            {['jobs','roadmaps'].map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }}
                className={`px-4 py-2 text-xs font-medium capitalize transition-all ${tab === t ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary'}`}>
                {t === 'jobs' ? 'Job Cards' : 'Roadmaps'}
              </button>
            ))}
          </div>
          <button onClick={() => setSidebar(o => !o)} className="btn-ghost text-xs">
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── Sidebar ── */}
        {sidebar && (
          <aside className="w-72 flex-shrink-0 hidden lg:block">
            <div className="card p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-text-primary font-semibold text-sm flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-accent" /> Filters
                </h3>
                {hasFilters && (
                  <button onClick={clearAll} className="text-accent text-xs hover:underline flex items-center gap-1">
                    <X size={10} />Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
                  className="input pl-8 py-2 text-xs" />
              </div>

              <FilterGroup title="Quick Filters">
                <Checkbox label="Remote Friendly"  checked={remote}    onChange={() => setRemote(o => !o)} />
                <Checkbox label="Freelance Viable"  checked={freelance} onChange={() => setFreelance(o => !o)} />
              </FilterGroup>

              <FilterGroup title="Salary Range">
                <input type="range" min={0} max={300000} step={5000} value={salMax}
                  onChange={e => setSalMax(+e.target.value)} className="w-full" />
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>$0</span><span>${salMax.toLocaleString('en-IN')}</span>
                </div>
              </FilterGroup>

              <FilterGroup title="Years of Experience">
                <input type="range" min={0} max={20} value={expMax}
                  onChange={e => setExpMax(+e.target.value)} className="w-full" />
                <div className="flex justify-between text-[10px] text-text-muted">
                  <span>0 years</span><span>{expMax}+ years</span>
                </div>
              </FilterGroup>

              <FilterGroup title="Job Titles">
                {TITLES.map(t => (
                  <Checkbox key={t} label={t} checked={titles.includes(t)}
                    onChange={() => toggle(titles, setTitles, t)} />
                ))}
              </FilterGroup>

              <FilterGroup title="Countries">
                {COUNTRIES.map(c => (
                  <Checkbox key={c} label={c} checked={countries.includes(c)}
                    onChange={() => toggle(countries, setCountries, c)} />
                ))}
              </FilterGroup>

              <FilterGroup title="Education Paths">
                {EDUS.map(e => (
                  <Checkbox key={e} label={e} checked={edu.includes(e)}
                    onChange={() => toggle(edu, setEdu, e)} />
                ))}
              </FilterGroup>
            </div>
          </aside>
        )}

        {/* ── Main grid ── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array(9).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No results found"
              desc="Try adjusting your filters or search query"
              action={<button onClick={clearAll} className="btn-outline">Clear Filters</button>}
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {tab === 'jobs'
                ? items
                    .filter(j => !remote   || j.is_remote_possible)
                    .filter(j => !freelance || j.is_freelance_viable)
                    .filter(j => !titles.length   || titles.includes(j.title))
                    .filter(j => !countries.length || countries.includes(j.country))
                    .map(j => <JobCard key={j.id} job={j} />)
                : items.map(r => <RoadmapCard key={r.id} roadmap={r} />)
              }
            </div>
          )}
          <Pagination page={page} totalPages={meta?.totalPages}
            onChange={p => { setPage(p); window.scrollTo(0, 0); }} />
        </div>
      </div>
    </div>
  );
}
