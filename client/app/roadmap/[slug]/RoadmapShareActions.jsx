'use client';
import { useState } from 'react';
import { Share2, Check, Star, LogIn } from 'lucide-react';
import { useAuthStore } from '../../../src/store/authStore.js';
import { goalsApi } from '../../../src/api/index.js';
import { BASE_EDU, TRAINING_TYPES, EXPERIENCE_OPTIONS, decodeRoadmapSlug, months2str, buildRoadmapData } from '../../../src/lib/roadmapBuilder.js';

export default function RoadmapShareActions({ shareUrl, params: slug, job }) {
  const { user } = useAuthStore();
  const [copied,  setCopied]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSave = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const decoded = decodeRoadmapSlug(slug);
    if (!decoded) return;

    const edu = BASE_EDU.find(e => e.id === decoded.eduId);
    const exp = EXPERIENCE_OPTIONS.find(e => e.id === decoded.experienceId);
    const trainingLabels = decoded.trainingIds
      .map(id => TRAINING_TYPES.find(t => t.id === id)?.label ?? id)
      .join(', ');

    const { totalMonths } = buildRoadmapData(job, edu, { methods: decoded.trainingIds, skills: [] }, exp);

    setSaving(true);
    try {
      await goalsApi.create({
        title: `Become a ${job.title}`,
        category: 'Career',
        priority: 'high',
        notes: `Path: ${edu?.label} → ${trainingLabels} → ${exp?.label}. Estimated total time: ${months2str(totalMonths)}. Roadmap: ${shareUrl}`,
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 flex-shrink-0">
      {/* Share / Copy URL */}
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
          copied
            ? 'bg-brand-green/10 border-brand-green/40 text-brand-green'
            : 'bg-bg-card border-bg-border text-text-secondary hover:border-accent/50 hover:text-accent'
        }`}
      >
        {copied ? <Check size={13}/> : <Share2 size={13}/>}
        {copied ? 'Copied!' : 'Share'}
      </button>

      {/* Save to Goals */}
      {saved ? (
        <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-brand-green/10 border border-brand-green/30 text-brand-green">
          <Check size={13}/>Saved
        </span>
      ) : (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          {saving
            ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/>
            : user ? <Star size={13}/> : <LogIn size={13}/>
          }
          {user ? 'Save to Goals' : 'Sign in to Save'}
        </button>
      )}
    </div>
  );
}
