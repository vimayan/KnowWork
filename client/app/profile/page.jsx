import { Suspense } from 'react';
import ProfileClient from './ProfileClient.jsx';

export const metadata = { title: 'My Profile' };

function LoadingFallback() {
  return (
    <div className="flex justify-center items-center py-24">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProfileClient />
    </Suspense>
  );
}
