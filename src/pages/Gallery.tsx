import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GalleryItem } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/UI';

const PAGE_SIZE = 6;

export function Gallery() {
  const [allItems, setAllItems] = useState<GalleryItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch('/api/gallery').then(r => r.json()).then(setAllItems);
  }, []);

  const items = allItems.slice(0, visibleCount);
  const hasMore = visibleCount < allItems.length;
  const totalPages = Math.ceil(allItems.length / PAGE_SIZE);
  const currentPage = Math.min(Math.ceil(visibleCount / PAGE_SIZE), totalPages);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-20 px-8 max-w-7xl mx-auto"
    >
      <header className="mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-on-surface-variant mb-4">Visual Archives — Vol. 04</p>
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface max-w-3xl">
              A Study in <br/><span className="text-on-surface-variant/40">Minimalist Persistence.</span>
            </h1>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span className="font-mono text-[10px] text-on-surface-variant">TOTAL_ARTIFACTS: {allItems.length}</span>
            <span className="font-mono text-[10px] text-on-surface-variant">LOC: VARIOUS_GLOBAL</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn("group cursor-crosshair", item.span, i === 1 ? "md:mt-24" : "")}
          >
            <div className="overflow-hidden bg-surface-container-low relative">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale hover:grayscale-0" 
                src={item.url} 
                alt={item.title}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-on-surface/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="mt-4 flex justify-between items-baseline font-mono text-[11px] text-on-surface-variant">
              <span>{item.title}</span>
              <span>{item.date}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 flex flex-col items-center">
        {hasMore ? (
          <>
            <Button variant="outline" className="px-12" onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}>
              LOAD_MORE_ASSETS
            </Button>
            <p className="mt-6 font-mono text-[10px] text-on-surface-variant/50">
              PAGE {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
            </p>
          </>
        ) : (
          <p className="font-mono text-[10px] text-on-surface-variant/50">
            ALL {allItems.length} ARTIFACTS LOADED
          </p>
        )}
      </div>
    </motion.div>
  );
}
