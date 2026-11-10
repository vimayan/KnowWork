import { Link } from '../lib/router.jsx';
import { Map, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/20 to-brand-purple/15 border border-accent/20 flex items-center justify-center mx-auto mb-6">
          <Map size={36} className="text-accent" />
        </div>
        <h1 className="text-6xl font-black text-text-primary mb-3">404</h1>
        <h2 className="text-xl font-bold text-text-primary mb-2">Page Not Found</h2>
        <p className="text-text-muted max-w-sm mx-auto mb-8 leading-relaxed">
          This path doesn't exist yet. Maybe it's a new career route waiting to be discovered.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Map size={16} />Go Home
          </Link>
          <Link to="/roadmaps" className="btn-outline">
            Browse Roadmaps <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
