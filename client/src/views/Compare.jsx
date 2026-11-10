// ─────────────────────────────────────────────────────────────
// Compare.jsx  (export default exported separately below)
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link } from '../lib/router.jsx';
import { GitCompare, Plus, X, ArrowRight, Users } from 'lucide-react';
import { jobCardsApi, salaryApi } from '../api/index.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Spinner } from '../components/ui/index.jsx';

const COLORS = ['#4f7dff','#22c55e','#f59e0b','#f43f5e'];
const tooltipStyle = { background:'#161d2e', border:'1px solid #1e2a3d', borderRadius:8, fontSize:11 };

export default function Compare() {
  const [all,      setAll]      = useState([]);
  const [selected, setSelected] = useState([]);
  const [comp,     setComp]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    jobCardsApi.list({ limit: 100 }).then(r => setAll(r?.data || [])).catch(() => {});
  }, []);

  const add = (job) => {
    if (selected.find(j => j.id === job.id) || selected.length >= 4) return;
    setSelected(s => [...s, job]);
  };
  const remove = (id) => setSelected(s => s.filter(j => j.id !== id));

  useEffect(() => {
    if (selected.length < 2) { setComp([]); return; }
    setLoading(true);
    salaryApi.compare(selected.map(j => j.id))
      .then(r => setComp(r?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selected]);

  const filtered = all.filter(j =>
    !selected.find(s => s.id === j.id) &&
    (j.title.toLowerCase().includes(search.toLowerCase()) || (j.category || '').toLowerCase().includes(search.toLowerCase()))
  );

  const chartData = comp.map(r => ({
    name: r.title?.slice(0, 16),
    Median: +((r.median_inr || 0) / 100000).toFixed(1),
    Mean:   +((r.mean_inr   || 0) / 100000).toFixed(1),
  }));

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <GitCompare size={24} className="text-accent"/>Compare Careers
          </h1>
          <p className="text-text-muted text-sm mt-1">Select 2–4 job cards to compare side by side</p>
        </div>
        <Link to="/mentors" className="btn-secondary text-xs">
          <Users size={13}/>Find a Mentor
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Picker */}
        <div className="card p-5 h-fit sticky top-20">
          <h3 className="text-text-primary font-semibold text-sm mb-3">Add Job to Compare</h3>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search jobs…" className="input mb-3 text-xs py-2"/>
          <div className="max-h-72 overflow-y-auto scrollbar-hide space-y-0.5">
            {filtered.slice(0,30).map(j=>(
              <button key={j.id} onClick={()=>add(j)} disabled={selected.length>=4}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-bg-hover text-left transition-all group disabled:opacity-40 disabled:cursor-not-allowed">
                <div>
                  <p className="text-text-secondary text-xs group-hover:text-text-primary">{j.title}</p>
                  <p className="text-text-muted text-[10px]">{j.category}</p>
                </div>
                <Plus size={13} className="text-text-muted group-hover:text-accent flex-shrink-0"/>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-wrap gap-2">
            {selected.map((j,i)=>(
              <div key={j.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{borderColor:COLORS[i]+'55',background:COLORS[i]+'15',color:COLORS[i]}}>
                {j.title}
                <button onClick={()=>remove(j.id)} className="hover:opacity-70"><X size={11}/></button>
              </div>
            ))}
            {selected.length < 2 && <p className="text-text-muted text-xs py-2">Select at least 2 jobs to compare</p>}
          </div>

          {loading && <div className="flex justify-center py-12"><Spinner/></div>}

          {!loading && comp.length >= 2 && (
            <>
              <div className="card p-6">
                <h3 className="text-text-primary font-semibold mb-5">Salary Comparison (₹ Lakhs)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} barSize={28} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3d" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:11}} stroke="#5a6a85" tickLine={false}/>
                    <YAxis tick={{fontSize:10}} stroke="#5a6a85" tickLine={false} axisLine={false} tickFormatter={v=>`₹${v}L`}/>
                    <Tooltip contentStyle={tooltipStyle} formatter={v=>[`₹${v}L`,'']}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <Bar dataKey="Median" fill="#4f7dff" radius={[3,3,0,0]}/>
                    <Bar dataKey="Mean"   fill="#22c55e" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-4" style={{gridTemplateColumns:`repeat(${Math.min(selected.length,3)},1fr)`}}>
                {selected.map((job,i)=>{
                  const c = comp.find(x=>x.id===job.id);
                  return (
                    <div key={job.id} className="card p-5 border-t-2" style={{borderTopColor:COLORS[i]}}>
                      <h4 className="text-text-primary font-semibold text-sm mb-3">{job.title}</h4>
                      <div className="space-y-2 text-xs">
                        {[
                          ['Median',   c?.median_inr ? `₹${(c.median_inr/100000).toFixed(1)}L` : '—', 'text-brand-green'],
                          ['Mean',     c?.mean_inr   ? `₹${(c.mean_inr/100000).toFixed(1)}L`   : '—', ''],
                          ['Demand',   job.india_demand_trend || '—', ''],
                          ['Remote',   job.is_remote_possible ? 'Yes':'No', job.is_remote_possible?'text-brand-green':'text-text-muted'],
                          ['Samples',  c?.samples || 0, ''],
                        ].map(([k,v,cls])=>(
                          <div key={k} className="flex justify-between">
                            <span className="text-text-muted">{k}</span>
                            <span className={`font-medium ${cls || 'text-text-secondary'}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <Link to={`/career/${job.slug}`} className="btn-ghost text-xs mt-4 justify-center w-full border border-bg-border">
                        View Full <ArrowRight size={11}/>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
