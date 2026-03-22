import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useAuth } from './useAuth';

export function ContentList() {
  const location = useLocation();
  const { authFetch } = useAuth();
  const contentType = location.pathname.includes('/publications') ? 'publication' : 'blog';
  const apiBase = contentType === 'publication' ? '/api/publications' : '/api/blogs';
  const adminBase = contentType === 'publication' ? '/admin/publications' : '/admin/blogs';
  const publicBase = contentType === 'publication' ? '/publications' : '/blogs';

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch(apiBase).then(r => r.json()).then(setItems);
  }, [apiBase]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await authFetch(`${apiBase}/${id}`, { method: 'DELETE' });
    setItems(items.filter(i => String(i.id) !== id));
  };

  return (
    <div className="p-8 max-w-5xl">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">
            MANAGE CONTENT
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            {contentType === 'publication' ? 'Publications' : 'Blog Posts'}
          </h1>
        </div>
        <Link
          to={`${adminBase}/new`}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-primary-dim transition-colors"
        >
          <Plus size={12} />
          New {contentType === 'publication' ? 'Publication' : 'Post'}
        </Link>
      </header>

      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-center py-20 text-on-surface-variant font-mono text-sm">
            No items yet. Create your first one.
          </div>
        )}

        {items.map(item => (
          <div key={item.id} className="bg-surface-container-lowest p-6 flex items-start gap-6 group hover:bg-surface-container-low transition-colors">
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-[10px] text-on-surface-variant">
                  {item.year || item.date}
                </span>
                {item.type && (
                  <span className="font-mono text-[10px] text-tertiary uppercase">{item.type}</span>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1">
                    {item.tags.map((tag: string) => (
                      <span key={tag} className="font-mono text-[10px] text-on-surface-variant/60 border border-outline-variant/15 px-1">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <h3 className="font-headline text-lg font-semibold truncate">{item.title}</h3>
              {item.journal && <p className="font-mono text-xs text-on-surface-variant mt-1 truncate">{item.journal}</p>}
              {item.excerpt && <p className="text-xs text-on-surface-variant mt-1 truncate">{item.excerpt}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={`${publicBase}/${item.id}`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-on-surface-variant hover:text-on-surface transition-colors"
                title="View"
              >
                <Eye size={14} />
              </a>
              <Link
                to={`${adminBase}/${item.id}`}
                className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                title="Edit"
              >
                <Pencil size={14} />
              </Link>
              <button
                onClick={() => handleDelete(String(item.id))}
                className="p-2 text-on-surface-variant hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
