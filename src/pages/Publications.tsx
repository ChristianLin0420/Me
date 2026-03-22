import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MoveRight } from 'lucide-react';
import { Publication } from '@/src/types';
import { cn } from '@/src/lib/utils';

const FILTERS = [
  { label: 'ALL_WORKS', value: '' },
  { label: 'JOURNAL_ARTICLES', value: 'Journal Article' },
  { label: 'CONFERENCE_PAPERS', value: 'Conference Paper' },
  { label: 'TECHNICAL_REPORTS', value: 'Technical Report' },
  { label: 'BOOK_CHAPTERS', value: 'Book Chapter' },
];

export function Publications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    fetch('/api/publications').then(res => res.json()).then(setPublications);
  }, []);

  const filtered = activeFilter
    ? publications.filter(p => p.type === activeFilter)
    : publications;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-24 px-8 max-w-7xl mx-auto"
    >
      <header className="mb-20">
        <div className="mono-text text-on-surface-variant text-xs tracking-[0.2em] uppercase mb-4">Research & Citations</div>
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface mb-6">Publications</h1>
        <p className="max-w-2xl text-lg text-on-surface-variant leading-relaxed">
          A curated repository of peer-reviewed research, technical reports, and academic contributions focused on the intersection of digital ethics and historical preservation.
        </p>
      </header>

      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-outline-variant/10 pb-6">
        <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
          {FILTERS.map(filter => (
            <button
              key={filter.label}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "mono-text text-[10px] px-3 py-1 transition-colors",
                activeFilter === filter.value
                  ? "bg-surface-container-highest text-on-surface rounded-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="mono-text text-[10px] text-on-surface-variant uppercase tracking-widest">
          Showing: [{filtered.length} of {publications.length}]
        </div>
      </div>

      <div className="space-y-1">
        {filtered.map((pub) => (
          <Link to={`/publications/${pub.id}`} key={pub.id} className="group flex flex-col md:flex-row md:items-start gap-6 p-8 transition-all duration-300 bg-surface-container-low mb-1 hover:bg-surface-container-lowest hover:-translate-y-0.5 block">
            <div className="mono-text text-on-surface-variant text-sm w-32 shrink-0 pt-1">
              {pub.year}
            </div>
            <div className="flex-grow">
              <div className="mono-text text-[10px] text-tertiary font-bold uppercase tracking-wider mb-2">{pub.type}</div>
              <h3 className="font-headline text-2xl font-semibold mb-3 group-hover:text-primary transition-colors">{pub.title}</h3>
              <p className="text-on-surface-variant mb-6 mono-text text-sm leading-relaxed italic">
                {pub.journal}
              </p>
              <div className="flex flex-wrap gap-6">
                {pub.links.map(link => (
                  <span key={link.label} className="flex items-center gap-2 mono-text text-xs text-on-surface hover:underline underline-offset-4 transition-all">
                    <span className="text-sm opacity-60">{link.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant font-mono text-sm">
            No publications found for this category.
          </div>
        )}
      </div>

      <section className="mt-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          <div className="md:col-span-4 bg-surface-container-highest p-12 flex flex-col justify-center">
            <div className="mono-text text-[10px] tracking-widest text-on-surface-variant mb-6 uppercase">Current Focus</div>
            <h2 className="font-headline text-3xl font-bold leading-tight mb-6">Long-term preservation of AI-generated datasets</h2>
            <a className="flex items-center gap-3 mono-text text-xs font-bold hover:translate-x-2 transition-transform" href="#">
              READ_WORKING_PAPER
              <MoveRight size={16} />
            </a>
          </div>
          <div className="md:col-span-8 relative aspect-[16/9] md:aspect-auto overflow-hidden">
            <img 
              alt="Abstract digital matrix" 
              className="w-full h-full object-cover grayscale opacity-80" 
              src="https://picsum.photos/seed/matrix/1200/600" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-primary/10 mix-blend-multiply"></div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
