import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Grid3x3, ArrowRight, TrendingUp } from 'lucide-react';
import { jobCardsApi } from '../api/index.js';
import { Spinner } from '../components/ui/index.jsx';

const CAT_COLORS = ['text-accent','text-brand-green','text-brand-amber','text-brand-purple','text-brand-teal','text-brand-rose'];

export default function Categories() {
  const [jobs,    setJobs]    = useState([]);
  const [cats,    setCats]    = useState([]);
  const [selCat,  setSelCat]  = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    jobCardsApi.list({ limit: 200 })
      .then(r => {
        const list = r?.data || [];
        setJobs(list);
        const categories = [...new Set(list.map(j => j.category).filter(Boolean))];
        setCats(categories);
        if (categories[0]) setSelCat(categories[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => j.category === selCat);

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Grid3x3 size={24} className="text-accent"/>Category Roadmaps
        </h1>
        <p className="text-text-muted text-sm mt-1">Browse careers by industry and discipline</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={36}/></div>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Category list */}
          <div>
            <div className="card p-3 sticky top-20">
              <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wider px-2 mb-2">Categories</p>
              {cats.map((cat, i) => (
                <button key={cat} onClick={() => setSelCat(cat)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5 ${
                    selCat === cat
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`}>
                  <span className={`text-xs ${CAT_COLORS[i % CAT_COLORS.length]}`}>●</span>
                  <span className="flex-1 text-left">{cat}</span>
                  <span className="text-xs text-text-muted">{jobs.filter(j => j.category === cat).length}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Job cards grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-text-primary font-semibold">
                {selCat} <span className="text-text-muted font-normal text-sm">({filtered.length} careers)</span>
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(job => (
                <Link key={job.id} to={`/career/${job.slug}`}
                  className="card-hover group p-5 flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {job.icon || '💼'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-text-primary font-semibold text-sm group-hover:text-accent transition-colors truncate">{job.title}</h3>
                      <p className="text-text-muted text-xs">{job.discipline}</p>
                    </div>
                  </div>
                  {job.summary && <p className="text-text-muted text-xs leading-relaxed line-clamp-2">{job.summary}</p>}
                  <div className="flex items-center justify-between text-xs mt-auto">
                    {job.india_demand_trend && (
                      <span className={`flex items-center gap-1 ${job.india_demand_trend === 'growing' ? 'text-brand-green' : 'text-text-muted'}`}>
                        <TrendingUp size={11}/>{job.india_demand_trend}
                      </span>
                    )}
                    <span className="text-accent flex items-center gap-1 font-medium ml-auto">
                      Explore <ArrowRight size={11}/>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
