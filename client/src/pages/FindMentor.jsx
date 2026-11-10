import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Users } from 'lucide-react';
import { mentorsApi, jobCardsApi } from '../api/index.js';
import { MentorCard } from '../components/cards/index.jsx';
import { Spinner, EmptyState, Pagination } from '../components/ui/index.jsx';
import { useDebounce } from '../hooks/useFetch.js';

export default function FindMentor() {
  const [mentors, setMentors] = useState([]);
  const [jobs,    setJobs]    = useState([]);
  const [meta,    setMeta]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  const [search,   setSearch]   = useState('');
  const [jobId,    setJobId]    = useState('');
  const [avail,    setAvail]    = useState(true);
  const [maxRate,  setMaxRate]  = useState('');
  const [sort,     setSort]     = useState('rating');

  const dq = useDebounce(search, 400);

  useEffect(() => {
    jobCardsApi.list({ limit: 100 }).then(r => setJobs(r?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12, sort };
    if (avail)  params.available   = true;
    if (jobId)  params.job_card_id = jobId;
    if (maxRate) params.maxRate    = maxRate;

    mentorsApi.list(params)
      .then(r => { setMentors(r?.data || []); setMeta(r?.meta); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, sort, avail, jobId, maxRate, dq]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-text-primary flex items-center justify-center gap-2">
          <Users size={28} className="text-accent"/>Find a Mentor
        </h1>
        <p className="text-text-muted mt-2">Book 1:1 sessions with experienced professionals in your field</p>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search mentors…"
            className="input pl-9 py-2 text-sm"/>
        </div>
        <select value={jobId} onChange={e=>setJobId(e.target.value)} className="select py-2 text-sm w-44">
          <option value="">All Careers</option>
          {jobs.map(j=><option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="select py-2 text-sm w-36">
          <option value="rating">Top Rated</option>
          <option value="sessions">Most Sessions</option>
        </select>
        <input type="number" value={maxRate} onChange={e=>setMaxRate(e.target.value)}
          placeholder="Max ₹/hr" className="input py-2 text-sm w-28"/>
        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none">
          <input type="checkbox" checked={avail} onChange={e=>setAvail(e.target.checked)}
            className="w-4 h-4 rounded border-bg-border bg-bg-secondary text-accent cursor-pointer"/>
          Available
        </label>
        {meta?.total && <p className="text-text-muted text-sm ml-auto">{meta.total} mentors</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={36}/></div>
      ) : mentors.length === 0 ? (
        <EmptyState title="No mentors found" desc="Try adjusting your search or filters"/>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mentors.map(m => <MentorCard key={m.id} mentor={m}/>)}
        </div>
      )}
      <Pagination page={page} totalPages={meta?.totalPages} onChange={p=>{setPage(p);window.scrollTo(0,0)}}/>
    </div>
  );
}
