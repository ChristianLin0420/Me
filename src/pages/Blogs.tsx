import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, ChevronsUpDown } from 'lucide-react';
import { BlogPost } from '@/src/types';
import { LaTeX } from '@/src/components/LaTeX';

export function Blogs() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetch('/api/blogs').then(res => res.json()).then(setBlogs);
  }, []);

  const filtered = useMemo(() => {
    let result = blogs;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q)) ||
        b.id_tag.toLowerCase().includes(q)
      );
    }
    if (sortAsc) {
      result = [...result].sort((a, b) => a.date.localeCompare(b.date));
    }
    return result;
  }, [blogs, query, sortAsc]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-24 px-8 max-w-7xl mx-auto"
    >
      <header className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="max-w-2xl">
          <div className="text-[10px] tracking-[0.3em] text-on-surface-variant font-bold uppercase mb-4 opacity-60">
            REPOSITORY / BLOGS
          </div>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tighter text-on-surface mb-6 leading-[0.9]">
            The Digital <span className="italic text-primary">Logbook</span>
          </h1>
          <p className="text-on-surface-variant leading-relaxed max-w-lg text-sm">
            A formal collection of research notes, algorithmic explorations, and observations on the intersection of data and physical archives.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-low px-6 py-4 flex flex-col items-end">
            <span className="text-[10px] font-bold text-on-surface-variant/40">TOTAL_ENTRIES</span>
            <span className="text-2xl font-bold">{filtered.length}</span>
          </div>
        </div>
      </header>

      <div className="bg-surface-container-low mb-16 p-2 flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex-grow flex items-center px-4 gap-3 bg-surface-container-lowest border border-outline-variant/10">
          <Search size={16} className="text-on-surface-variant" />
          <input 
            className="w-full bg-transparent border-none focus:ring-0 text-xs py-3 placeholder:text-on-surface-variant/30 uppercase tracking-widest font-mono" 
            placeholder="QUERY_THE_ARCHIVE..." 
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortAsc(prev => !prev)}
            className="bg-primary text-on-primary px-6 py-3 text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:bg-primary-dim transition-all"
          >
            {sortAsc ? 'OLDEST' : 'LATEST'} <ChevronsUpDown size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {filtered.map((blog, i) => (
          <article key={blog.id} className={i === 0 ? "md:col-span-8 group" : "md:col-span-4 group"}>
            <Link to={`/blogs/${blog.id}`} className="bg-surface-container-low p-8 h-full flex flex-col transition-all duration-500 hover:bg-surface-container-lowest hover:-translate-y-1 block">
              {blog.image && (
                <div className="aspect-video mb-8 bg-surface-variant overflow-hidden">
                  <img src={blog.image} alt={blog.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="flex justify-between items-start mb-8">
                <span className="text-[10px] font-bold bg-surface-container-highest px-3 py-1 tracking-widest">
                  {blog.date} // {blog.id_tag}
                </span>
                <div className="flex gap-2">
                  {blog.tags.map(tag => (
                    <span key={tag} className="text-[10px] border border-outline-variant/20 px-2 py-1 text-on-surface-variant/60">{tag}</span>
                  ))}
                </div>
              </div>
              <h2 className="font-headline text-3xl font-bold tracking-tight mb-6 group-hover:text-primary transition-colors leading-tight">
                {blog.title}
              </h2>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-8 flex-grow">
                {blog.excerpt}
              </p>
              {blog.equation && (
                <div className="bg-surface-container-lowest py-10 px-6 border-l-4 border-primary/20 mb-8 flex items-center justify-center text-lg">
                  <LaTeX math={blog.equation} display />
                </div>
              )}
              <div className="mt-auto flex items-center justify-between pt-8 border-t border-outline-variant/5">
                {blog.author && (
                  <div className="flex items-center gap-3">
                    <img src={blog.author.avatar} alt={blog.author.name} className="w-10 h-10 rounded-full grayscale" referrerPolicy="no-referrer" />
                    <div>
                      <div className="text-[10px] font-bold uppercase">{blog.author.name}</div>
                      <div className="text-[8px] text-on-surface-variant/50 uppercase">{blog.author.role}</div>
                    </div>
                  </div>
                )}
                <span className="text-[10px] font-bold underline decoration-1 underline-offset-4 hover:text-primary">
                  EXECUTE_READ
                </span>
              </div>
            </Link>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="md:col-span-12 text-center py-20 text-on-surface-variant font-mono text-sm">
            No entries match your query.
          </div>
        )}
      </div>
    </motion.div>
  );
}
