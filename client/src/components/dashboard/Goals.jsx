import { useState, useEffect } from 'react';
import {
  Target, Plus, Trash2, CheckCircle2, Circle, Flag, Calendar,
  X, ChevronRight, ArrowRight, Flame, TrendingUp, Lock,
  Pencil, Check, BookOpen, Clock, Zap, Star, AlignLeft,
  MoreHorizontal, GripVertical
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ['Career', 'Skill', 'Education', 'Finance', 'Networking', 'Health', 'Other'];
const PRIORITY_META = {
  high:   { label: 'High',   cls: 'text-brand-rose  bg-brand-rose/10  border-brand-rose/20',  dot: 'bg-brand-rose'  },
  medium: { label: 'Medium', cls: 'text-brand-amber bg-brand-amber/10 border-brand-amber/20', dot: 'bg-brand-amber' },
  low:    { label: 'Low',    cls: 'text-brand-green bg-brand-green/10 border-brand-green/20', dot: 'bg-brand-green' },
};
const STEP_TYPES = ['Action', 'Learning', 'Milestone', 'Review', 'Habit'];
const STORAGE_KEY = 'jd_goals_v2';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pct = g => {
  if (!g.steps?.length) return g.completed ? 100 : 0;
  const done = g.steps.filter(s => s.done).length;
  return Math.round((done / g.steps.length) * 100);
};

const daysLeft = deadline => {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - Date.now()) / 86400000);
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ─── Step node in the flow ────────────────────────────────────────────────────
function StepNode({ step, index, total, onToggle, onDelete, onEdit }) {
  const [editing, setEditing] = useState(false);
  const [title,   setTitle]   = useState(step.title);

  const save = () => { onEdit(step.id, { title: title.trim() || step.title }); setEditing(false); };

  return (
    <div className="flex items-start gap-3">
      {/* Left rail */}
      <div className="flex flex-col items-center flex-shrink-0">
        <button onClick={() => onToggle(step.id)}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            step.done
              ? 'bg-accent border-accent text-white'
              : 'border-bg-border bg-bg-surface hover:border-accent text-text-muted'
          }`}>
          {step.done ? <Check size={13}/> : <span className="text-[10px] font-bold">{index + 1}</span>}
        </button>
        {index < total - 1 && (
          <div className={`w-0.5 h-full min-h-[32px] mt-1 ${step.done ? 'bg-accent/40' : 'bg-bg-border'}`}/>
        )}
      </div>

      {/* Step card */}
      <div className={`flex-1 mb-4 p-3 rounded-xl border transition-all group ${
        step.done
          ? 'bg-bg-primary border-bg-border opacity-60'
          : 'bg-bg-surface border-bg-border hover:border-accent/30'
      }`}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex gap-2">
                <input value={title} onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
                  className="input text-xs py-1 flex-1" autoFocus/>
                <button onClick={save} className="text-accent"><Check size={12}/></button>
              </div>
            ) : (
              <p className={`text-sm font-medium leading-snug ${step.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                {step.title}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-text-muted bg-bg-border/80 px-1.5 py-0.5 rounded">{step.type || 'Action'}</span>
              {step.duration && <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock size={9}/>{step.duration}</span>}
            </div>
            {step.note && <p className="text-text-muted text-[11px] mt-1.5 italic">{step.note}</p>}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => setEditing(true)} className="text-text-muted hover:text-accent p-0.5"><Pencil size={11}/></button>
            <button onClick={() => onDelete(step.id)} className="text-text-muted hover:text-brand-rose p-0.5"><Trash2 size={11}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Right detail panel ───────────────────────────────────────────────────────
function GoalDetailPanel({ goal, onUpdate, onDelete, onClose }) {
  const [activeTab, setActiveTab] = useState('roadmap');
  const [newStep,   setNewStep]   = useState({ title: '', type: 'Action', duration: '', note: '' });
  const [showAdd,   setShowAdd]   = useState(false);
  const [editGoal,  setEditGoal]  = useState(false);
  const [editForm,  setEditForm]  = useState({
    title: goal.title, deadline: goal.deadline || '', notes: goal.notes || '', priority: goal.priority,
  });

  const progress = pct(goal);
  const pm       = PRIORITY_META[goal.priority] || PRIORITY_META.medium;
  const days     = daysLeft(goal.deadline);

  const toggleStep   = id => {
    const steps = goal.steps.map(s => s.id === id ? { ...s, done: !s.done } : s);
    const completed = steps.length > 0 && steps.every(s => s.done);
    onUpdate(goal.id, { steps, completed });
  };
  const deleteStep   = id => onUpdate(goal.id, { steps: goal.steps.filter(s => s.id !== id) });
  const editStep     = (id, patch) => onUpdate(goal.id, { steps: goal.steps.map(s => s.id === id ? { ...s, ...patch } : s) });
  const addStep      = () => {
    if (!newStep.title.trim()) return;
    onUpdate(goal.id, { steps: [...(goal.steps || []), { id: uid(), done: false, ...newStep }] });
    setNewStep({ title: '', type: 'Action', duration: '', note: '' });
    setShowAdd(false);
  };
  const saveEdit = () => { onUpdate(goal.id, editForm); setEditGoal(false); };

  const TABS = [
    { id: 'roadmap',   label: 'Roadmap',  icon: BookOpen },
    { id: 'overview',  label: 'Details',  icon: AlignLeft },
    { id: 'progress',  label: 'Progress', icon: TrendingUp },
  ];

  const done  = (goal.steps || []).filter(s => s.done).length;
  const total = (goal.steps || []).length;

  return (
    <div className="flex flex-col h-full">

      {/* Panel header */}
      <div className="flex items-start gap-3 p-5 border-b border-bg-border flex-shrink-0">
        <div className="flex-1 min-w-0">
          {editGoal ? (
            <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
              className="input font-bold text-base mb-1 w-full" autoFocus
              onKeyDown={e => e.key === 'Enter' && saveEdit()}/>
          ) : (
            <h2 className={`font-bold text-text-primary text-base leading-snug mb-1 ${goal.completed ? 'line-through opacity-60' : ''}`}>
              {goal.title}
            </h2>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${pm.cls}`}>
              <Flag size={9} className="inline mr-1"/>{pm.label}
            </span>
            <span className="text-[11px] text-text-muted bg-bg-border/60 px-2 py-0.5 rounded-full">{goal.category}</span>
            {goal.deadline && (
              <span className={`text-[11px] flex items-center gap-1 px-2 py-0.5 rounded-full ${
                days < 0 ? 'text-brand-rose bg-brand-rose/10' :
                days <= 7 ? 'text-brand-amber bg-brand-amber/10' : 'text-text-muted bg-bg-border/60'
              }`}>
                <Calendar size={9}/>
                {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setEditGoal(e => !e)}
            className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all">
            <Pencil size={14}/>
          </button>
          <button onClick={() => { onDelete(goal.id); onClose(); }}
            className="p-1.5 rounded-lg text-text-muted hover:text-brand-rose hover:bg-brand-rose/10 transition-all">
            <Trash2 size={14}/>
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
            <X size={16}/>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-3 border-b border-bg-border flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-muted">{done}/{total} steps complete</span>
          <span className="text-xs font-bold text-accent">{progress}%</span>
        </div>
        <div className="h-2 bg-bg-border rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-brand-purple rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}/>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-3 border-b border-bg-border flex-shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all border-b-2 ${
              activeTab === id
                ? 'text-accent border-accent'
                : 'text-text-muted border-transparent hover:text-text-primary'
            }`}>
            <Icon size={12}/>{label}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── ROADMAP TAB ── */}
        {activeTab === 'roadmap' && (
          <div>
            {/* Goal as the "start" node */}
            <div className="flex items-start gap-3 mb-0">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Target size={14} className="text-white"/>
                </div>
                {(goal.steps || []).length > 0 && <div className="w-0.5 min-h-[24px] bg-accent/40 mt-1"/>}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-xs font-semibold text-accent uppercase tracking-wide">Goal Start</p>
                <p className="text-text-primary text-sm font-medium mt-0.5">{goal.title}</p>
                {goal.created_at && (
                  <p className="text-text-muted text-[10px] mt-0.5">
                    Started {new Date(goal.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>

            {/* Steps as roadmap nodes */}
            {(goal.steps || []).length > 0 ? (
              (goal.steps).map((step, i) => (
                <StepNode key={step.id} step={step} index={i} total={goal.steps.length}
                  onToggle={toggleStep} onDelete={deleteStep} onEdit={editStep}/>
              ))
            ) : (
              <div className="ml-11 text-text-muted text-sm py-3">No steps yet — add your first step below</div>
            )}

            {/* Goal end node */}
            {(goal.steps || []).length > 0 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 border-dashed
                  border-accent/40">
                  <Star size={13} className={progress === 100 ? 'text-accent' : 'text-text-muted'}/>
                </div>
                <div className="flex-1 pt-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${progress === 100 ? 'text-accent' : 'text-text-muted'}`}>
                    {progress === 100 ? '🎉 Goal Achieved!' : 'Goal Complete'}
                  </p>
                  {goal.deadline && (
                    <p className="text-text-muted text-[10px]">
                      Target: {new Date(goal.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Add step */}
            <div className="mt-5">
              {showAdd ? (
                <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 space-y-3">
                  <p className="text-xs font-semibold text-accent">New Step</p>
                  <input value={newStep.title} onChange={e => setNewStep(s => ({ ...s, title: e.target.value }))}
                    placeholder="What do you need to do?" className="input text-sm" autoFocus
                    onKeyDown={e => e.key === 'Enter' && addStep()}/>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-[10px]">Type</label>
                      <select value={newStep.type} onChange={e => setNewStep(s => ({ ...s, type: e.target.value }))} className="select text-xs">
                        {STEP_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-[10px]">Duration</label>
                      <input value={newStep.duration} onChange={e => setNewStep(s => ({ ...s, duration: e.target.value }))}
                        placeholder="e.g. 2 weeks" className="input text-xs"/>
                    </div>
                  </div>
                  <input value={newStep.note} onChange={e => setNewStep(s => ({ ...s, note: e.target.value }))}
                    placeholder="Notes (optional)" className="input text-xs"/>
                  <div className="flex gap-2">
                    <button onClick={() => setShowAdd(false)} className="btn-secondary text-xs flex-1">Cancel</button>
                    <button onClick={addStep} disabled={!newStep.title.trim()} className="btn-primary text-xs flex-1">
                      <Plus size={12}/>Add Step
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAdd(true)}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-bg-border
                    text-text-muted hover:text-accent hover:border-accent/40 transition-all text-sm">
                  <Plus size={14}/>Add a step to your roadmap
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── DETAILS TAB ── */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {editGoal ? (
              <div className="space-y-3">
                <div>
                  <label className="label">Priority</label>
                  <select value={editForm.priority} onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))} className="select">
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Deadline</label>
                  <input type="date" value={editForm.deadline} onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))} className="input"/>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    rows={4} className="textarea"/>
                </div>
                <button onClick={saveEdit} className="btn-primary w-full text-sm"><Check size={13}/>Save Changes</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Category',  goal.category],
                    ['Priority',  PRIORITY_META[goal.priority]?.label || goal.priority],
                    ['Steps',     `${done}/${total} done`],
                    ['Progress',  `${progress}%`],
                    ...(goal.deadline ? [['Deadline', new Date(goal.deadline).toLocaleDateString('en-IN', { day:'numeric',month:'short',year:'numeric' })]] : []),
                    ['Created',   new Date(goal.created_at).toLocaleDateString('en-IN', { day:'numeric',month:'short',year:'numeric' })],
                  ].map(([label, val]) => (
                    <div key={label} className="p-3 rounded-xl bg-bg-primary border border-bg-border">
                      <p className="text-text-muted text-[10px] uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-text-primary text-sm font-semibold">{val}</p>
                    </div>
                  ))}
                </div>
                {goal.notes && (
                  <div className="p-4 rounded-xl bg-bg-primary border border-bg-border">
                    <p className="text-text-muted text-xs font-semibold uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-text-secondary text-sm leading-relaxed">{goal.notes}</p>
                  </div>
                )}
                <button onClick={() => setEditGoal(true)} className="btn-secondary w-full text-sm">
                  <Pencil size={13}/>Edit Details
                </button>
              </>
            )}
          </div>
        )}

        {/* ── PROGRESS TAB ── */}
        {activeTab === 'progress' && (
          <div className="space-y-4">
            {/* Big progress ring-like display */}
            <div className="text-center py-4">
              <div className="relative inline-flex items-center justify-center w-28 h-28 mb-3">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-bg-border"/>
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                    className="text-accent transition-all duration-700"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                    strokeLinecap="round"/>
                </svg>
                <span className="absolute text-2xl font-bold text-text-primary">{progress}%</span>
              </div>
              <p className="text-text-muted text-sm">{done} of {total} steps completed</p>
            </div>

            {/* Step-by-step status */}
            {(goal.steps || []).length > 0 && (
              <div className="space-y-2">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-wide">Step Status</p>
                {goal.steps.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-primary border border-bg-border">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                      step.done ? 'bg-accent text-white' : 'bg-bg-border text-text-muted'
                    }`}>{step.done ? <Check size={11}/> : i + 1}</span>
                    <p className={`text-sm flex-1 ${step.done ? 'line-through text-text-muted' : 'text-text-secondary'}`}>{step.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${step.done ? 'bg-brand-green/10 text-brand-green' : 'bg-bg-border text-text-muted'}`}>
                      {step.done ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Deadline countdown */}
            {goal.deadline && (
              <div className={`p-4 rounded-xl border ${
                days < 0 ? 'border-brand-rose/30 bg-brand-rose/8' :
                days <= 7 ? 'border-brand-amber/30 bg-brand-amber/8' :
                'border-bg-border bg-bg-primary'
              }`}>
                <p className="text-xs font-semibold mb-1 text-text-muted uppercase tracking-wide">Deadline</p>
                <p className={`text-base font-bold ${days < 0 ? 'text-brand-rose' : days <= 7 ? 'text-brand-amber' : 'text-text-primary'}`}>
                  {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today!' : `${days} days remaining`}
                </p>
                <p className="text-text-muted text-xs mt-0.5">
                  {new Date(goal.deadline).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel footer action */}
      <div className="p-4 border-t border-bg-border flex-shrink-0">
        <button onClick={() => onUpdate(goal.id, { completed: !goal.completed })}
          className={`w-full text-sm flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
            goal.completed
              ? 'bg-bg-border text-text-muted hover:bg-brand-amber/10 hover:text-brand-amber'
              : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent hover:text-white'
          }`}>
          {goal.completed ? <><Circle size={14}/>Mark Incomplete</> : <><CheckCircle2 size={14}/>Mark as Complete</>}
        </button>
      </div>
    </div>
  );
}

// ─── Goal row in the left list ────────────────────────────────────────────────
function GoalRow({ goal, selected, onClick }) {
  const progress = pct(goal);
  const pm       = PRIORITY_META[goal.priority] || PRIORITY_META.medium;
  const days     = daysLeft(goal.deadline);
  const done     = (goal.steps || []).filter(s => s.done).length;
  const total    = (goal.steps || []).length;

  return (
    <button onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all group ${
        selected
          ? 'border-accent bg-accent/5 shadow-sm'
          : 'border-bg-border bg-bg-surface hover:border-accent/40 hover:bg-bg-hover'
      } ${goal.completed ? 'opacity-60' : ''}`}>

      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${pm.dot}`}/>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold text-text-primary truncate ${goal.completed ? 'line-through' : ''}`}>
            {goal.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-text-muted">{goal.category}</span>
            {goal.deadline && days !== null && (
              <span className={`text-[10px] ${days < 0 ? 'text-brand-rose' : days <= 7 ? 'text-brand-amber' : 'text-text-muted'}`}>
                · {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
              </span>
            )}
          </div>

          {/* Mini progress bar */}
          {total > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1 bg-bg-border rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }}/>
              </div>
              <span className="text-[10px] text-text-muted flex-shrink-0">{done}/{total}</span>
            </div>
          )}
        </div>
        <ChevronRight size={14} className={`flex-shrink-0 mt-0.5 transition-colors ${selected ? 'text-accent' : 'text-text-muted group-hover:text-accent'}`}/>
      </div>
    </button>
  );
}

// ─── Add Goal modal ───────────────────────────────────────────────────────────
function AddGoalModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', category: 'Career', priority: 'medium', deadline: '', notes: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.title.trim()) { toast.error('Goal title is required'); return; }
    onAdd({ ...form, id: uid(), steps: [], completed: false, created_at: new Date().toISOString() });
    onClose(); toast.success('Goal created!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-bold text-lg flex items-center gap-2"><Target size={18} className="text-accent"/>New Goal</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18}/></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Goal Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Land a backend developer role at a startup" className="input" autoFocus
              onKeyDown={e => e.key === 'Enter' && submit()}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="select">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className="select">
                {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Deadline (optional)</label>
            <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className="input"/>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Why this goal matters, your approach…" rows={3} className="textarea"/>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={submit}  className="btn-primary  flex-1"><Target size={14}/>Create Goal</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Goals panel ─────────────────────────────────────────────────────────
export default function Goals() {
  const [goals,     setGoals]     = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [selected,  setSelected]  = useState(null);
  const [filter,    setFilter]    = useState('all');
  const [showAdd,   setShowAdd]   = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(goals)); }, [goals]);

  // Keep selected goal in sync
  const selectedGoal = goals.find(g => g.id === selected) || null;

  const addGoal    = g      => { setGoals(gs => [g, ...gs]); setSelected(g.id); };
  const updateGoal = (id, patch) => setGoals(gs => gs.map(g => g.id === id ? { ...g, ...patch } : g));
  const deleteGoal = id      => { setGoals(gs => gs.filter(g => g.id !== id)); setSelected(null); toast.success('Goal removed'); };

  const visible = goals.filter(g =>
    filter === 'all'       ? true :
    filter === 'active'    ? !g.completed :
    filter === 'completed' ? g.completed : true
  );

  const total     = goals.length;
  const completed = goals.filter(g => g.completed).length;
  const inProgress = goals.filter(g => pct(g) > 0 && !g.completed).length;
  const overdue   = goals.filter(g => { const d = daysLeft(g.deadline); return d !== null && d < 0 && !g.completed; }).length;

  return (
    <div className="animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Goals',  val: total,      icon: Target,       cls: 'text-accent' },
          { label: 'Completed',    val: completed,  icon: CheckCircle2, cls: 'text-brand-green' },
          { label: 'In Progress',  val: inProgress, icon: Flame,        cls: 'text-brand-amber' },
          { label: 'Overdue',      val: overdue,    icon: Lock,         cls: 'text-brand-rose' },
        ].map(({ label, val, icon: Icon, cls }) => (
          <div key={label} className="card p-5">
            <Icon size={20} className={`${cls} mb-3`}/>
            <p className="text-text-primary text-2xl font-bold">{val}</p>
            <p className="text-text-muted text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Split layout */}
      <div className={`flex gap-5 min-h-[520px] ${selectedGoal ? 'lg:flex-row flex-col' : ''}`}>

        {/* Left: goal list */}
        <div className={`flex flex-col gap-3 ${selectedGoal ? 'lg:w-80 w-full flex-shrink-0' : 'flex-1'}`}>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1">
              {['all','active','completed'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    filter === f ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`}>{f}</button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-xs">
              <Plus size={13}/>New Goal
            </button>
          </div>

          {/* List */}
          {visible.length === 0 ? (
            <div className="text-center py-16 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Target size={28} className="text-accent"/>
              </div>
              <h3 className="text-text-primary font-semibold mb-2">
                {filter === 'completed' ? 'No completed goals yet' : 'No goals yet'}
              </h3>
              <p className="text-text-muted text-sm mb-5">
                {filter === 'completed' ? 'Complete your first goal to see it here' : 'Set your first goal and build your personal roadmap'}
              </p>
              {filter !== 'completed' && (
                <button onClick={() => setShowAdd(true)} className="btn-primary">
                  <Target size={14}/>Create First Goal
                </button>
              )}
            </div>
          ) : (
            <div className={`space-y-2 ${!selectedGoal ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-3 space-y-0' : ''}`}>
              {visible.map(g => (
                <GoalRow key={g.id} goal={g} selected={selected === g.id}
                  onClick={() => setSelected(selected === g.id ? null : g.id)}/>
              ))}
            </div>
          )}
        </div>

        {/* Right: detail panel */}
        {selectedGoal && (
          <div className="flex-1 card overflow-hidden flex flex-col animate-fade-in" style={{ minHeight: 520 }}>
            <GoalDetailPanel
              goal={selectedGoal}
              onUpdate={updateGoal}
              onDelete={deleteGoal}
              onClose={() => setSelected(null)}
            />
          </div>
        )}
      </div>

      {showAdd && <AddGoalModal onClose={() => setShowAdd(false)} onAdd={addGoal}/>}
    </div>
  );
}
