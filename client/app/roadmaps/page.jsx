import { Suspense } from 'react';
import RoadmapsClient from './RoadmapsClient.jsx';

export const metadata = {
  title: 'Career Roadmaps',
  description: 'Explore hundreds of career roadmaps across tech, business, design, healthcare and more. Filter by salary, experience and skills.',
};

// Fetch initial job card list server-side for fast first paint + SEO
async function getInitialJobs() {
  try {
    const res = await fetch('http://localhost:4000/api/v1/job-cards?limit=12&page=1', {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data ?? [];
  } catch {
    return [];
  }
}

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default async function RoadmapsPage() {
  const initialJobs = await getInitialJobs();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <RoadmapsClient initialJobs={initialJobs} />
    </Suspense>
  );
}
