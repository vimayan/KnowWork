import { Suspense } from 'react';
import CareerClient from './CareerClient.jsx';

// Generate SEO metadata server-side from the job card data
export async function generateMetadata({ params }) {
  try {
    const res = await fetch(`http://localhost:4000/api/v1/job-cards/${params.slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { title: 'Career Roadmap' };
    const data = await res.json();
    const jc = data?.data;
    if (!jc) return { title: 'Career Roadmap' };

    return {
      title: `${jc.title} Career Roadmap`,
      description: jc.description || `Explore the complete career roadmap for ${jc.title}. Skills, salary, education paths and step-by-step guide.`,
      openGraph: {
        title: `${jc.title} Career Roadmap | KnowWork`,
        description: jc.description,
        type: 'article',
      },
      keywords: [jc.title, 'career roadmap', 'salary', 'skills', ...(jc.skills?.map(s => s.skill_name) ?? [])],
    };
  } catch {
    return { title: 'Career Roadmap' };
  }
}

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CareerPage({ params }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CareerClient slug={params.slug} />
    </Suspense>
  );
}
