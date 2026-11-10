import { Suspense } from 'react';
import RoadmapDetailClient from './RoadmapDetailClient.jsx';

export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`http://localhost:4000/api/v1/roadmaps/${params.id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { title: 'Roadmap' };
    const data = await res.json();
    const r = data?.data;
    if (!r) return { title: 'Roadmap' };
    return {
      title: r.title,
      description: r.description || `Step-by-step roadmap to become a ${r.title}`,
    };
  } catch {
    return { title: 'Roadmap' };
  }
}

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function RoadmapDetailPage({ params }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RoadmapDetailClient id={params.id} />
    </Suspense>
  );
}
