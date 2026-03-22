import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, BookOpen, Image, Plus } from 'lucide-react';

export function AdminDashboard() {
  const [counts, setCounts] = useState({ publications: 0, blogs: 0, gallery: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/publications').then(r => r.json()),
      fetch('/api/blogs').then(r => r.json()),
      fetch('/api/gallery').then(r => r.json()),
    ]).then(([pubs, blogs, gallery]) => {
      setCounts({ publications: pubs.length, blogs: blogs.length, gallery: gallery.length });
    });
  }, []);

  const cards = [
    { label: 'Publications', count: counts.publications, icon: FileText, path: '/admin/publications', createPath: '/admin/publications/new' },
    { label: 'Blog Posts', count: counts.blogs, icon: BookOpen, path: '/admin/blogs', createPath: '/admin/blogs/new' },
    { label: 'Gallery Items', count: counts.gallery, icon: Image, path: '/admin/gallery', createPath: '/admin/gallery' },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <header className="mb-12">
        <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">
          SYSTEM OVERVIEW
        </div>
        <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
          Dashboard
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {cards.map(card => (
          <Link
            key={card.label}
            to={card.path}
            className="bg-surface-container-lowest p-8 hover:bg-surface-container-low transition-colors group"
          >
            <div className="flex items-center justify-between mb-6">
              <card.icon size={20} className="text-on-surface-variant" />
              <span className="font-headline text-4xl font-bold">{card.count}</span>
            </div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">
              {card.label}
            </div>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-headline text-xl font-bold tracking-tight mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {cards.map(card => (
            <Link
              key={card.createPath}
              to={card.createPath}
              className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-primary-dim transition-colors"
            >
              <Plus size={12} />
              New {card.label.replace(/s$/, '').replace(/Items$/, 'Item')}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
