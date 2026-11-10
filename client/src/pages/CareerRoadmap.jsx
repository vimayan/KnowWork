import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Target, TrendingUp, BarChart3, BookOpen, Layers, Building2,
  Globe, AlertTriangle, ChevronRight, ArrowRight, CheckCircle2,
  XCircle, Zap, Clock, Star, Eye
} from 'lucide-react';
import { jobCardsApi, trajectoryApi, salaryApi, roadmapsApi } from '../api/index.js';
import { Spinner, RiskBadge } from '../components/ui/index.jsx';
import { RoadmapCard } from '../components/cards/index.jsx';

const TABS = [
  { id:'overview',    label:'Overview',      icon: Target       },
  { id:'trajectory',  label:'Trajectory',    icon: TrendingUp   },
  { id:'salary',      label:'Salary',        icon: BarChart3    },
  { id:'education',   label:'Education',     icon: BookOpen     },
  { id:'roadmaps',    label:'Roadmaps',      icon: Layers       },
  { id:'employers',   label:'Employers',     icon: Building2    },
  { id:'society',     label:'Society',       icon: Globe        },
  { id:'failures',    label:'Failure Map',   icon: AlertTriangle},
];

function SkillBar({ skill }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-text-secondary text-xs w-36 flex-shrink-0 truncate">{skill.skill_name}</span>
      <div className="flex gap-0.5 flex-1">
        {Array.from({ length: 10 }).map((_, j) => (
          <div key={j} className={`flex-1 h-2 rounded-sm ${j < skill.importance ? 'bg-accent' : 'bg-bg-border'}`} />
        ))}
      </div>
      {skill.is_core && <span className="badge-green text-[9px] flex-shrink-0">Core</span>}
    </div>
  );
}

function TrajectoryGraph({ nodes = [], edges = [] }) {
  const levelOrder = ['intern','junior','mid','senior','lead','principal','staff','director'];
  const sorted = [...nodes].sort((a, b) => {
    const ai = levelOrder.indexOf(a.level);
    const bi = levelOrder.indexOf(b.level);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const groups = {};
  sorted.forEach(n => { const g = n.level || 'other'; if (!groups[g]) groups[g] = []; groups[g].push(n); });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] p-4">
        <div className="flex items-start gap-6">
          {Object.entries(groups).map(([level, grpNodes], gi) => (
            <div key={level} className="flex flex-col gap-3 flex-shrink-0">
              <p className="text-text-muted text-[10px] font-semibold uppercase tracking-wide text-center">{level}</p>
              {grpNodes.map(node => (
                <div key={node.id}
                  className={`relative p-3 rounded-xl border w-44 cursor-default transition-all hover:scale-[1.02] ${
                    node.is_entry_point ? 'border-brand-green/50 bg-brand-green/8' :
                    node.is_terminal   ? 'border-brand-purple/50 bg-brand-purple/8' :
                    'border-bg-border bg-bg-card hover:border-accent/40'
                  }`}>
                  <p className="text-text-primary text-xs font-semibold leading-snug mb-2">{node.label}</p>
                  {node.salary_min_inr && (
                    <p className="text-text-muted text-[10px]">
                      ₹{(node.salary_min_inr/100000).toFixed(1)}L–₹{(node.salary_max_inr/100000).toFixed(1)}L
                    </p>
                  )}
                  {node.reach_probability_pct && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="flex-1 h-1 bg-bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${node.reach_probability_pct}%` }} />
                      </div>
                      <span className="text-[10px] text-accent">{node.reach_probability_pct}%</span>
                    </div>
                  )}
                </div>
              ))}
              {gi < Object.keys(groups).length - 1 && (
                <div className="absolute right-[-16px] top-8 flex items-center">
                  <div className="w-4 h-px bg-bg-border" />
                  <ArrowRight size={8} className="text-text-muted -ml-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CareerRoadmap() {
  const { slug } = useParams();
  const [job,      setJob]      = useState(null);
  const [sections, setSections] = useState({});
  const [traj,     setTraj]     = useState(null);
  const [salary,   setSalary]   = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [tab,      setTab]      = useState('overview');
  const [loading,  setLoading]  = useState(true);
  const [secLoad,  setSecLoad]  = useState({});

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    jobCardsApi.get(slug)
      .then(r => {
        const data = r?.data;
        setJob(data);
        if (!data?.id) return;
        const id = data.id;

        // Parallel: trajectory + salary + roadmaps
        trajectoryApi.graph(id).then(r => setTraj(r?.data)).catch(() => {});
        salaryApi.index(id).then(r => setSalary(r?.data || [])).catch(() => {});
        roadmapsApi.list({ job_card_id: id, limit: 4 }).then(r => setRoadmaps(r?.data || [])).catch(() => {});

        // Free sections
        ['problems', 'history', 'education', 'subjects'].forEach(sec => {
          setSecLoad(s => ({ ...s, [sec]: true }));
          jobCardsApi.section(id, sec)
            .then(r => setSections(s => ({ ...s, [sec]: r?.data || [] })))
            .catch(() => {})
            .finally(() => setSecLoad(s => ({ ...s, [sec]: false })));
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!job?.id) return;
    const proSecs = { employers: true, society: true, failures: true };
    if (proSecs[tab] && !sections[tab]) {
      setSecLoad(s => ({ ...s, [tab]: true }));
      jobCardsApi.section(job.id, tab)
        .then(r => setSections(s => ({ ...s, [tab]: r?.data || [] })))
        .catch(() => {})
        .finally(() => setSecLoad(s => ({ ...s, [tab]: false })));
    }
  }, [tab, job?.id]);

  if (loading) return <div className="flex justify-center py-24"><Spinner size={36} /></div>;
  if (!job)    return <div className="text-center py-24 text-text-muted">Job not found</div>;

  const d = job.details || {};

  return (
    <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-6">
        <Link to="/" className="hover:text-text-primary transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/roadmaps" className="hover:text-text-primary transition-colors">Roadmaps</Link>
        <ChevronRight size={12} />
        <span className="text-text-secondary">{job.title}</span>
      </nav>

      {/* Hero card */}
      <div className="card p-6 lg:p-8 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-4xl flex-shrink-0">
                {job.icon || '💼'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{job.title}</h1>
                <p className="text-text-muted text-sm">{job.field} · {job.category}</p>
              </div>
            </div>
            {job.summary && <p className="text-text-secondary text-sm leading-relaxed mb-4">{job.summary}</p>}
            <div className="flex flex-wrap gap-2">
              {d.india_demand_trend && <span className="badge-green"><TrendingUp size={10}/>{d.india_demand_trend}</span>}
              {job.is_remote_possible && <span className="badge-blue"><Globe size={10}/>Remote</span>}
              {job.is_freelance_viable && <span className="badge-purple">Freelance</span>}
              {job.social_grade && <span className="badge-gray">Grade {job.social_grade}</span>}
              {job.industry_grade && <span className="badge-gray capitalize">{job.industry_grade}</span>}
            </div>
          </div>

          {/* Quick stat grid */}
          <div className="grid grid-cols-3 gap-3 lg:w-80">
            {[
              ['India Market', d.india_market_share_pct ? `${d.india_market_share_pct}%` : '—'],
              ['Global Market', d.global_market_share_pct ? `${d.global_market_share_pct}%` : '—'],
              ['Time to Job', d.avg_time_to_first_job_months ? `${d.avg_time_to_first_job_months}mo` : '—'],
              ['Success Rate', d.success_probability_pct ? `${d.success_probability_pct}%` : '—'],
              ['Career Span', d.typical_career_span_years ? `${d.typical_career_span_years}yr` : '—'],
              ['Hours/Week', d.typical_hours_per_week ? `${d.typical_hours_per_week}h` : '—'],
            ].map(([label, val]) => (
              <div key={label} className="bg-bg-primary border border-bg-border rounded-xl p-3 text-center">
                <p className="text-text-primary font-bold text-sm">{val}</p>
                <p className="text-text-muted text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium flex-shrink-0 transition-all ${
              tab === id ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ── Content panels ── */}
      <div className="animate-fade-in">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {job.what_you_do && (
                <div className="card p-6">
                  <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2"><Zap size={16} className="text-accent"/>What You Do</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">{job.what_you_do}</p>
                </div>
              )}

              {(d.advantages?.length || d.disadvantages?.length) && (
                <div className="card p-6">
                  <h3 className="text-text-primary font-semibold mb-4">Pros & Cons</h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {d.advantages?.length > 0 && (
                      <div>
                        <p className="text-brand-green text-xs font-semibold uppercase tracking-wide mb-2">Advantages</p>
                        <ul className="space-y-2">
                          {d.advantages.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                              <CheckCircle2 size={13} className="text-brand-green mt-0.5 flex-shrink-0" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {d.disadvantages?.length > 0 && (
                      <div>
                        <p className="text-brand-rose text-xs font-semibold uppercase tracking-wide mb-2">Disadvantages</p>
                        <ul className="space-y-2">
                          {d.disadvantages.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                              <XCircle size={13} className="text-brand-rose mt-0.5 flex-shrink-0" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sections.problems?.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-brand-amber"/>Key Challenges</h3>
                  <div className="space-y-3">
                    {sections.problems.slice(0, 5).map((p, i) => (
                      <div key={i} className="p-3 rounded-lg bg-bg-primary border border-bg-border">
                        <div className="flex gap-2 mb-1">
                          <RiskBadge level={p.severity} />
                          {p.category && <span className="badge-gray text-[10px]">{p.category}</span>}
                        </div>
                        <p className="text-text-secondary text-sm">{p.problem}</p>
                        {p.mitigation && <p className="text-text-muted text-xs mt-1.5 italic">Mitigation: {p.mitigation}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sections.history?.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-text-primary font-semibold mb-4">Market History</h3>
                  <div className="space-y-2">
                    {sections.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-primary transition-colors">
                        <span className="text-accent font-bold text-xs w-10 flex-shrink-0">{h.year}</span>
                        <div>
                          {h.key_event && <p className="text-text-primary text-xs font-medium">{h.key_event}</p>}
                          {h.context && <p className="text-text-muted text-[10px]">{h.context}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <div className="card p-5">
                <h3 className="text-text-primary font-semibold text-sm mb-4">Risk Factors</h3>
                <div className="space-y-3">
                  {[
                    ['Automation Risk', d.automation_risk],
                    ['Job Security',    d.job_security],
                    ['Growth Potential',d.growth_potential],
                    ['Competition',     d.competition_level],
                  ].map(([label, val]) => val ? (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-text-muted text-xs">{label}</span>
                      <RiskBadge level={val} />
                    </div>
                  ) : null)}
                </div>
              </div>

              {d.work_setting && (
                <div className="card p-5">
                  <h3 className="text-text-primary font-semibold text-sm mb-3">Work Environment</h3>
                  <div className="space-y-2 text-xs">
                    {[
                      ['Setting', d.work_setting],
                      ['Physical', d.physical_demand],
                      ['Cognitive', d.cognitive_demand],
                      ['Social', d.social_interaction],
                      ['Travel', d.travel_required ? 'Required' : 'Not required'],
                    ].map(([k, v]) => v ? (
                      <div key={k} className="flex justify-between">
                        <span className="text-text-muted">{k}</span>
                        <span className="text-text-secondary capitalize font-medium">{v}</span>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {job.skills?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-text-primary font-semibold text-sm mb-4">Skills Required</h3>
                  <div className="space-y-2.5">
                    {job.skills.map((s, i) => <SkillBar key={i} skill={s} />)}
                  </div>
                </div>
              )}

              {d.positions?.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-text-primary font-semibold text-sm mb-3">Career Positions</h3>
                  {d.positions.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-bg-border last:border-0">
                      <div className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[10px] font-bold">{i + 1}</div>
                      <div>
                        <p className="text-text-secondary text-xs font-medium">{p.title}</p>
                        <p className="text-text-muted text-[10px]">{p.avg_exp_years}+ years</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRAJECTORY */}
        {tab === 'trajectory' && (
          <div className="space-y-5">
            <div className="card p-6">
              <h2 className="text-text-primary font-semibold mb-1">Career Trajectory Graph</h2>
              <p className="text-text-muted text-sm mb-5">Visualised path from entry to peak, with probabilities</p>
              {traj
                ? <TrajectoryGraph nodes={traj.nodes || []} edges={traj.edges || []} />
                : <div className="flex justify-center py-12"><Spinner /></div>
              }
            </div>
          </div>
        )}

        {/* SALARY */}
        {tab === 'salary' && (
          <div className="space-y-5">
            {salary.length > 0 ? (
              <div className="card p-6 overflow-x-auto">
                <h2 className="text-text-primary font-semibold mb-5">Salary Matrix</h2>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-bg-border text-text-muted">
                      {['Zone','Employer','Experience','Min','Median','Max','Demand'].map(h => (
                        <th key={h} className="text-left py-2 pr-4 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {salary.map((r, i) => (
                      <tr key={i} className="border-b border-bg-border/40 hover:bg-bg-primary transition-colors">
                        <td className="py-2.5 pr-4 text-text-secondary capitalize">{r.availability_zone}</td>
                        <td className="py-2.5 pr-4"><span className="badge-gray uppercase text-[9px]">{r.employer_type}</span></td>
                        <td className="py-2.5 pr-4 text-text-secondary">{r.experience_min_yr}–{r.experience_max_yr}yr</td>
                        <td className="py-2.5 pr-4 text-text-secondary">₹{(r.salary_min_inr/100000).toFixed(1)}L</td>
                        <td className="py-2.5 pr-4 text-brand-green font-semibold">₹{((r.salary_median_inr||0)/100000).toFixed(1)}L</td>
                        <td className="py-2.5 pr-4 text-text-secondary">₹{(r.salary_max_inr/100000).toFixed(1)}L</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1.5 bg-bg-border rounded-full overflow-hidden">
                              <div className="h-full bg-brand-green" style={{ width: `${(r.demand_score || 0) * 10}%` }} />
                            </div>
                            <span className="text-text-muted text-[10px]">{r.demand_score}/10</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div className="flex justify-center py-16"><Spinner /></div>}
            <div className="text-center">
              <Link to={`/salary/${slug}`} className="btn-outline">
                <BarChart3 size={15} />View Full Salary Analytics
              </Link>
            </div>
          </div>
        )}

        {/* EDUCATION */}
        {tab === 'education' && (
          <div className="space-y-5">
            {sections.subjects?.length > 0 && (
              <div className="card p-6">
                <h3 className="text-text-primary font-semibold mb-4">Textbook → Job Skill Map</h3>
                <div className="space-y-3">
                  {sections.subjects.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg bg-bg-primary border border-bg-border">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-text-primary text-xs font-semibold">{s.subject_name}</p>
                        <span className="badge-blue text-[10px]">{s.maps_to_skill}</span>
                      </div>
                      {s.degree_stream && <p className="text-text-muted text-[10px]">Stream: {s.degree_stream}</p>}
                      <div className="text-text-muted text-[10px] mt-1.5 space-y-0.5">
                        {s.used_when && <p><span className="text-text-secondary">When used:</span> {s.used_when}</p>}
                        {s.used_where && <p><span className="text-text-secondary">Where:</span> {s.used_where}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sections.education?.length > 0 && (
              <div className="card p-6">
                <h3 className="text-text-primary font-semibold mb-4">Degree Links</h3>
                <div className="space-y-3">
                  {sections.education.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-bg-primary border border-bg-border">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.is_mandatory ? 'bg-brand-rose' : 'bg-brand-green'}`} />
                      <div>
                        <p className="text-text-primary text-xs font-medium">{e.degree_name}{e.stream ? ` (${e.stream})` : ''}</p>
                        <div className="flex gap-1.5 mt-1">
                          <span className={e.is_mandatory ? 'badge-red' : 'badge-green'} style={{ fontSize: 9 }}>
                            {e.is_mandatory ? 'Mandatory' : 'Preferred'}
                          </span>
                          <span className="text-text-muted text-[10px]">Relevance: {e.relevance_score}/10</span>
                        </div>
                        {e.connection_note && <p className="text-text-muted text-[10px] mt-1 italic">{e.connection_note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROADMAPS */}
        {tab === 'roadmaps' && (
          <div>
            <h2 className="text-text-primary font-semibold mb-5">Roadmaps for {job.title}</h2>
            {roadmaps.length > 0
              ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{roadmaps.map(r => <RoadmapCard key={r.id} roadmap={r} />)}</div>
              : <p className="text-text-muted text-sm text-center py-12">No roadmaps yet for this career</p>
            }
          </div>
        )}

        {/* EMPLOYERS */}
        {tab === 'employers' && (
          <div className="card p-6">
            <h2 className="text-text-primary font-semibold mb-5">Employers Hiring {job.title}</h2>
            {secLoad.employers ? <div className="flex justify-center py-12"><Spinner /></div> :
             sections.employers?.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {sections.employers.map((e, i) => (
                  <div key={i} className="p-4 rounded-xl bg-bg-primary border border-bg-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-text-primary font-semibold text-sm">{e.company_name}</p>
                      <span className="badge-gray uppercase text-[10px]">{e.employer_type}</span>
                    </div>
                    <div className="text-xs text-text-muted space-y-1">
                      {e.city && <p>📍 {e.city}, {e.country}</p>}
                      {e.avg_salary_inr && <p>💰 Avg ₹{(e.avg_salary_inr/100000).toFixed(1)}L/yr</p>}
                      {e.openings_est && <p>📋 ~{e.openings_est} openings</p>}
                    </div>
                  </div>
                ))}
              </div>
             ) : <p className="text-text-muted text-sm text-center py-12">Employer data requires login</p>
            }
          </div>
        )}

        {/* SOCIETY */}
        {tab === 'society' && (
          <div className="space-y-4">
            {secLoad.society ? <div className="flex justify-center py-12"><Spinner /></div> :
             sections.society?.length > 0 ? sections.society.map((s, i) => (
              <div key={i} className="card p-6">
                <h3 className="text-text-primary font-semibold mb-2">{s.scenario_title}</h3>
                <span className={`badge mb-3 ${s.impact_type==='direct'?'badge-green':s.impact_type==='systemic'?'badge-blue':'badge-gray'}`}>{s.impact_type}</span>
                <p className="text-text-secondary text-sm leading-relaxed">{s.scenario_body}</p>
                {s.people_impacted_daily && <p className="text-text-muted text-xs mt-2">~{s.people_impacted_daily.toLocaleString('en-IN')} people impacted daily</p>}
              </div>
             )) : <p className="text-text-muted text-sm text-center py-12">Society data requires login</p>
            }
          </div>
        )}

        {/* FAILURES */}
        {tab === 'failures' && (
          <div className="space-y-4">
            {secLoad.failures ? <div className="flex justify-center py-12"><Spinner /></div> :
             sections.failures?.length > 0 ? sections.failures.map((f, i) => (
              <div key={i} className="card p-6 border-l-2 border-l-brand-amber/60">
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge-amber capitalize">{f.failure_type?.replace(/_/g,' ')}</span>
                  {f.probability_pct && <span className="text-text-muted text-xs">{f.probability_pct}% probability</span>}
                  {f.time_lost_months && <span className="text-text-muted text-xs">~{f.time_lost_months}mo lost</span>}
                </div>
                <p className="text-text-secondary text-sm mb-3">{f.description}</p>
                {f.critical_factors?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {f.critical_factors.map((c, j) => <span key={j} className="badge-red text-[10px]">{c}</span>)}
                  </div>
                )}
                {f.recovery_path && (
                  <div className="p-3 rounded-lg bg-brand-green/8 border border-brand-green/20">
                    <p className="text-brand-green text-xs font-semibold mb-1">Recovery Path:</p>
                    <p className="text-text-secondary text-xs">{f.recovery_path}</p>
                  </div>
                )}
              </div>
             )) : <p className="text-text-muted text-sm text-center py-12">Failure map data requires login</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}
