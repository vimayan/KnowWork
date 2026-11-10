import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from '../lib/router.jsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BarChart3, TrendingUp, IndianRupee, Send, Filter, Users } from 'lucide-react';
import { jobCardsApi, salaryApi } from '../api/index.js';
import { useAuthStore } from '../store/authStore.js';
import { Spinner, Modal } from '../components/ui/index.jsx';
import toast from 'react-hot-toast';

export default function SalaryAnalytics() {
  const { slug } = useParams();
  const { user } = useAuthStore();

  const [jobs, setJobs]     = useState([]);
  const [selJob, setSelJob] = useState(null);
  const [salary, setSalary] = useState([]);
  const [perc,   setPerc]   = useState(null);
  const [trend,  setTrend]  = useState([]);
  const [loading,setLoading]= useState(false);

  const [zone,     setZone]     = useState('metro');
  const [employer, setEmployer] = useState('all');
  const [exp,      setExp]      = useState(3);
  const [country,  setCountry]  = useState('India');

  const [submitOpen, setSubmitOpen] = useState(false);
  const [form, setForm] = useState({ salary_inr:'', job_title:'', employer_type:'mnc', experience_years:3, education:'' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    jobCardsApi.list({ limit: 100 })
      .then(r => {
        const list = r?.data || [];
        setJobs(list);
        if (slug) {
          const match = list.find(j => j.slug === slug);
          if (match) return setSelJob(match);
          jobCardsApi.get(slug).then(r2 => setSelJob(r2?.data)).catch(() => {});
        } else if (list[0]) {
          setSelJob(list[0]);
        }
      }).catch(() => {});
  }, [slug]);

  const loadSalary = useCallback(() => {
    if (!selJob?.id) return;
    setLoading(true);
    Promise.all([
      salaryApi.index(selJob.id, { zone, employer, exp }),
      salaryApi.percentiles(selJob.id, country),
      salaryApi.trend(selJob.id, 24),
    ]).then(([idx, perc, tr]) => {
      setSalary(idx?.data || []);
      setPerc(perc?.data);
      setTrend((tr?.data || []).map(r => ({
        month: r.month?.slice(0, 7),
        avg: +(r.avg_salary / 100000).toFixed(1),
        count: r.data_points,
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selJob, zone, employer, exp, country]);

  useEffect(() => { loadSalary(); }, [loadSalary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selJob) return;
    setSubmitting(true);
    try {
      await salaryApi.submit({ ...form, job_card_id: selJob.id, salary_inr: +form.salary_inr });
      toast.success('Salary data submitted — thank you!');
      setSubmitOpen(false);
      setForm({ salary_inr:'', job_title:'', employer_type:'mnc', experience_years:3, education:'' });
    } catch(err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const chartData = salary.map(r => ({
    label: `${r.employer_type?.toUpperCase()} ${r.experience_min_yr}–${r.experience_max_yr}yr`,
    Min:    +(r.salary_min_inr/100000).toFixed(1),
    Median: +((r.salary_median_inr||0)/100000).toFixed(1),
    Max:    +(r.salary_max_inr/100000).toFixed(1),
  }));

  const tooltipStyle = { background:'#161d2e', border:'1px solid #1e2a3d', borderRadius:8, fontSize:11 };

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={24} className="text-accent"/>Salary Analytics
          </h1>
          <p className="text-text-muted text-sm mt-1">Multi-axis salary data from real crowdsourced submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/mentors" className="btn-secondary text-xs">
            <Users size={13}/>Find a Mentor
          </Link>
          <button onClick={() => user ? setSubmitOpen(true) : toast.error('Please login to submit data')}
            className="btn-primary text-xs">
            <Send size={13}/>Submit My Salary
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Filters */}
        <div className="space-y-4">
          <div className="card p-5">
            <p className="label text-xs mb-2">Job Card</p>
            <select value={selJob?.id || ''} onChange={e => setSelJob(jobs.find(j=>j.id===e.target.value))} className="select text-xs py-2">
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>

          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-1.5 text-text-primary font-semibold text-sm">
              <Filter size={14}/>Filters
            </div>
            <div>
              <p className="label text-xs">Zone</p>
              <select value={zone} onChange={e=>setZone(e.target.value)} className="select text-xs py-2">
                {['metro','tier1','tier2','tier3','rural','remote'].map(z=><option key={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <p className="label text-xs">Employer Type</p>
              <select value={employer} onChange={e=>setEmployer(e.target.value)} className="select text-xs py-2">
                {['all','msme','mnc','startup','government'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p className="label text-xs">Experience: {exp}yr</p>
              <input type="range" min={0} max={20} value={exp} onChange={e=>setExp(+e.target.value)} className="w-full mt-1"/>
            </div>
            <div>
              <p className="label text-xs">Country</p>
              <select value={country} onChange={e=>setCountry(e.target.value)} className="select text-xs py-2">
                {['India','Global'].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {perc && (
            <div className="card p-5">
              <h3 className="text-text-primary font-semibold text-sm mb-4 flex items-center gap-1.5">
                <IndianRupee size={14} className="text-brand-green"/>Percentiles
              </h3>
              <div className="space-y-2.5">
                {[['P25',perc.p25],['Median',perc.median],['Mean',perc.mean],['P75',perc.p75],['P90',perc.p90]].map(([l,v])=> v ? (
                  <div key={l} className="flex justify-between">
                    <span className="text-text-muted text-xs">{l}</span>
                    <span className="text-text-primary font-semibold text-xs">₹{(v/100000).toFixed(1)}L</span>
                  </div>
                ):null)}
                {perc.sample_count && <p className="text-text-muted text-[10px] pt-2 border-t border-bg-border">Based on {perc.sample_count} submissions</p>}
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="lg:col-span-3 space-y-5">
          {loading && <div className="flex justify-center py-16"><Spinner/></div>}

          {!loading && chartData.length > 0 && (
            <div className="card p-6">
              <h3 className="text-text-primary font-semibold mb-5">Salary Range by Type & Experience (₹ Lakhs)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barSize={14} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3d" vertical={false}/>
                  <XAxis dataKey="label" tick={{fontSize:9}} stroke="#5a6a85" tickLine={false} angle={-15} textAnchor="end" height={44}/>
                  <YAxis tick={{fontSize:10}} stroke="#5a6a85" tickLine={false} axisLine={false} tickFormatter={v=>`₹${v}L`}/>
                  <Tooltip contentStyle={tooltipStyle} formatter={v=>[`₹${v}L`,'']}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="Min"    fill="#1e2a3d" radius={[2,2,0,0]}/>
                  <Bar dataKey="Median" fill="#4f7dff" radius={[2,2,0,0]}/>
                  <Bar dataKey="Max"    fill="#22c55e" radius={[2,2,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!loading && trend.length > 0 && (
            <div className="card p-6">
              <h3 className="text-text-primary font-semibold mb-5 flex items-center gap-2">
                <TrendingUp size={16} className="text-accent"/>Salary Trend (24 months)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3d" vertical={false}/>
                  <XAxis dataKey="month" tick={{fontSize:10}} stroke="#5a6a85" tickLine={false}/>
                  <YAxis tick={{fontSize:10}} stroke="#5a6a85" tickLine={false} axisLine={false} tickFormatter={v=>`₹${v}L`}/>
                  <Tooltip contentStyle={tooltipStyle} formatter={v=>[`₹${v}L`,'']}/>
                  <Line dataKey="avg" name="Avg Salary" stroke="#4f7dff" strokeWidth={2} dot={false} activeDot={{r:4,fill:'#4f7dff'}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {!loading && salary.length > 0 && (
            <div className="card p-6 overflow-x-auto">
              <h3 className="text-text-primary font-semibold mb-4">Full Salary Matrix</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-bg-border text-text-muted">
                    {['Zone','Employer','Exp','Min','Median','Max','Demand','Sample'].map(h=>(
                      <th key={h} className="text-left py-2 pr-3 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salary.map((r,i)=>(
                    <tr key={i} className="border-b border-bg-border/40 hover:bg-bg-primary transition-colors">
                      <td className="py-2.5 pr-3 text-text-secondary capitalize">{r.availability_zone}</td>
                      <td className="py-2.5 pr-3"><span className="badge-gray uppercase text-[9px]">{r.employer_type}</span></td>
                      <td className="py-2.5 pr-3 text-text-secondary">{r.experience_min_yr}–{r.experience_max_yr}yr</td>
                      <td className="py-2.5 pr-3 text-text-secondary">₹{(r.salary_min_inr/100000).toFixed(1)}L</td>
                      <td className="py-2.5 pr-3 text-brand-green font-semibold">₹{((r.salary_median_inr||0)/100000).toFixed(1)}L</td>
                      <td className="py-2.5 pr-3 text-text-secondary">₹{(r.salary_max_inr/100000).toFixed(1)}L</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1">
                          <div className="w-10 h-1.5 bg-bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-brand-green" style={{width:`${(r.demand_score||0)*10}%`}}/>
                          </div>
                          <span className="text-text-muted">{r.demand_score}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-text-muted">{r.sample_size||0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Submit modal */}
      <Modal open={submitOpen} onClose={()=>setSubmitOpen(false)} title="Submit Your Salary Data">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Job Title *</label>
            <input required value={form.job_title} onChange={e=>setForm(s=>({...s,job_title:e.target.value}))} placeholder="Your actual title" className="input"/></div>
          <div><label className="label">Annual Salary (₹) *</label>
            <input required type="number" value={form.salary_inr} onChange={e=>setForm(s=>({...s,salary_inr:e.target.value}))} placeholder="1200000" className="input"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Employer Type</label>
              <select value={form.employer_type} onChange={e=>setForm(s=>({...s,employer_type:e.target.value}))} className="select">
                {['msme','mnc','startup','government'].map(t=><option key={t}>{t}</option>)}
              </select></div>
            <div><label className="label">Experience (years)</label>
              <input type="number" min={0} max={50} value={form.experience_years} onChange={e=>setForm(s=>({...s,experience_years:+e.target.value}))} className="input"/></div>
          </div>
          <div><label className="label">Education</label>
            <input value={form.education} onChange={e=>setForm(s=>({...s,education:e.target.value}))} placeholder="B.Tech CSE, Diploma..." className="input"/></div>
          <div className="flex gap-3">
            <button type="button" onClick={()=>setSubmitOpen(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? <Spinner size={16}/> : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
