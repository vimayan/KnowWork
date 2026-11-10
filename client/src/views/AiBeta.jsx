import { useState } from 'react';
import { Sparkles, Send, Search, ArrowRight } from 'lucide-react';
import { searchApi } from '../api/index.js';
import { JobCard } from '../components/cards/index.jsx';
import { Spinner } from '../components/ui/index.jsx';

const SUGGESTIONS = [
  'I have a Diploma in Mechanical Engineering, what careers fit me?',
  'What are the best careers for someone who loves coding?',
  'Which careers can I switch to from teaching?',
  'Highest paying remote jobs in India?',
  'Careers that don\'t require a degree but pay well?',
];

export default function AiBeta() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [answer,  setAnswer]  = useState('');
  const [loading, setLoading] = useState(false);
  const [searched,setSearched]= useState(false);

  const search = async (q) => {
    const q2 = q || query;
    if (!q2.trim()) return;
    setLoading(true);
    setSearched(true);
    setAnswer('');
    try {
      const res = await searchApi.jobCards({ q: q2, limit: 6 });
      setResults(res?.data?.results || res?.data || []);
      // Simulate AI answer based on query
      const keywords = q2.toLowerCase();
      if (keywords.includes('diploma') || keywords.includes('mechanical')) {
        setAnswer('Based on your background, Mould Design Engineer, SPM Design Engineer, and CNC Programmer are excellent fits. These roles are in high demand in India\'s manufacturing sector and specifically value diploma holders. You can expect ₹2–6L starting and up to ₹12–18L at senior levels.');
      } else if (keywords.includes('code') || keywords.includes('coding') || keywords.includes('programming')) {
        setAnswer('For coding enthusiasts, Software Engineer, Full Stack Developer, and Data Scientist are top choices. India\'s tech sector is booming — entry-level pays ₹4–8L and senior roles easily cross ₹25–40L, especially in product companies and MNCs.');
      } else if (keywords.includes('remote')) {
        setAnswer('Top remote-friendly careers in India include: Software Engineer, Data Scientist, UX Designer, Digital Marketer, and Content Strategist. These roles often pay 20–40% more when working for international companies from India.');
      } else {
        setAnswer(`I found ${res?.data?.results?.length || res?.data?.length || 0} matching careers for your query. Browse the results below to explore detailed roadmaps, salary data, and real professional journeys for each role.`);
      }
    } catch {
      setAnswer('Could not load results. Please check your connection and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-amber/10 border border-brand-amber/25 text-brand-amber text-sm font-semibold mb-6">
          <Sparkles size={16}/> AI Career Guide — Beta
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-3">
          Your Intelligent Career Advisor
        </h1>
        <p className="text-text-muted max-w-lg mx-auto leading-relaxed">
          Ask anything about careers, qualifications, salaries, or job switches. Get instant, data-backed recommendations.
        </p>
      </div>

      {/* Search */}
      <div className="card p-6 mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"/>
            <input value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter')search()}}
              placeholder="Ask anything about careers, qualifications, salaries..."
              className="input pl-11 py-3.5 text-sm text-text-primary"/>
          </div>
          <button onClick={()=>search()} disabled={loading || !query.trim()}
            className="btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
            {loading ? <Spinner size={18}/> : <Send size={18}/>}
          </button>
        </div>

        <div className="mt-4">
          <p className="text-text-muted text-xs mb-2.5">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => { setQuery(s); search(s); }}
                className="px-3 py-1.5 rounded-lg bg-bg-primary border border-bg-border text-text-secondary hover:text-text-primary hover:border-accent/40 text-xs transition-all">
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Answer */}
      {searched && !loading && answer && (
        <div className="card p-6 mb-6 border-l-2 border-l-brand-amber/60 animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-brand-amber"/>
            <span className="text-brand-amber text-xs font-semibold uppercase tracking-wide">AI Insight</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{answer}</p>
        </div>
      )}

      {/* Results */}
      {loading && <div className="flex justify-center py-16"><Spinner size={36}/></div>}

      {!loading && results.length > 0 && (
        <div>
          <h2 className="text-text-primary font-semibold mb-4">Matching Careers ({results.length})</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(job => <JobCard key={job.id} job={job}/>)}
          </div>
        </div>
      )}

      {!loading && searched && results.length === 0 && !answer && (
        <div className="text-center py-16">
          <p className="text-text-muted text-sm">No results found. Try a different query.</p>
        </div>
      )}

      {/* Feature badges */}
      {!searched && (
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { emoji:'🎯', title:'Career Matching', desc:'Get personalised career suggestions based on your background and goals' },
            { emoji:'💰', title:'Salary Insights',  desc:'Instant salary benchmarks for any career across zones and experience levels' },
            { emoji:'🗺️', title:'Path Planning',   desc:'Discover the fastest, balanced, and academic routes to your dream role' },
          ].map(({ emoji, title, desc }) => (
            <div key={title} className="card p-5 text-center">
              <div className="text-3xl mb-3">{emoji}</div>
              <h3 className="text-text-primary font-semibold text-sm mb-1.5">{title}</h3>
              <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
