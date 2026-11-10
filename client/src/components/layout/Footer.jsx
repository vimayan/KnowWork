'use client';
import { useState } from 'react';
import { Link } from '../../lib/router.jsx';
import { Send, Twitter, Linkedin, Github, Youtube } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Footer() {
  const [email, setEmail] = useState('');

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success('Subscribed! Check your inbox 🎉');
    setEmail('');
  };

  const links = {
    'Quick Links': [
      ['Browse Roadmaps', '/roadmaps'],
      ['Category Roadmaps', '/categories'],
      ['Salary Analytics', '/salary'],
      ['Find Mentors', '/mentors'],
      ['Add Journey', '/journey/new'],
      ['AI Guide', '/ai-guide'],
    ],
    'Company': [
      ['About Us', '#'],
      ['Contact', '#'],
      ['Blog', '#'],
      ['Terms of Service', '#'],
      ['Privacy Policy', '#'],
    ],
  };

  return (
    <footer className="bg-bg-secondary border-t border-bg-border">
      <div className="max-w-screen-xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-bg-border">

          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center mb-4">
              <img src="/logo/knowwork-dark.svg" alt="KnowWork" className="h-9 w-auto" />
            </Link>
            <p className="text-text-muted text-sm leading-relaxed mb-6">
              Discover real career journeys from professionals who've walked the path you want to take.
            </p>
            <div className="flex items-center gap-2">
              {[Twitter, Linkedin, Github, Youtube].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-9 h-9 rounded-xl bg-bg-card border border-bg-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent/40 transition-all">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-text-primary font-semibold text-sm mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {items.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-text-muted hover:text-text-primary text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4 className="text-text-primary font-semibold text-sm mb-4">Stay Inspired</h4>
            <p className="text-text-muted text-sm leading-relaxed mb-4">
              Get inspiring roadmaps and career insights delivered weekly.
            </p>
            <form onSubmit={subscribe} className="space-y-2.5">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email" className="input text-sm" />
              <button type="submit" className="btn-primary w-full justify-center text-sm">
                <Send size={14} /> Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-muted text-xs">© 2024 KnowWork. All rights reserved.</p>
          <p className="text-text-muted text-xs">Made with ❤️ for students worldwide</p>
        </div>
      </div>
    </footer>
  );
}
