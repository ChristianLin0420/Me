import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { GalleryItem } from '@/src/types';
import { useAuth } from './useAuth';

const SPAN_OPTIONS = ['col-span-4', 'col-span-6', 'col-span-8', 'col-span-12'];

export function AdminGallery() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', url: '', span: 'col-span-4' });

  useEffect(() => {
    fetch('/api/gallery').then(r => r.json()).then(setItems);
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url;
  }, [authFetch]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const url = await uploadFile(file);
        const today = new Date().toISOString().split('T')[0];
        const title = file.name.replace(/\.[^.]+$/, '').toUpperCase().replace(/[_-]/g, '_');
        const item = { title: `IMG / ${title}`, date: today, url, span: 'col-span-4' };
        const res = await authFetch('/api/gallery', {
          method: 'POST',
          body: JSON.stringify(item),
        });
        const newItem = await res.json();
        setItems(prev => [newItem, ...prev]);
      } catch (e) {
        console.error('Upload failed:', e);
      }
    }

    setUploading(false);
  };

  const handleAddManual = async () => {
    if (!form.url || !form.title) return;
    const res = await authFetch('/api/gallery', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const newItem = await res.json();
    setItems(prev => [newItem, ...prev]);
    setForm({ title: '', date: '', url: '', span: 'col-span-4' });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gallery item?')) return;
    await authFetch(`/api/gallery/${id}`, { method: 'DELETE' });
    setItems(items.filter(i => i.id !== id));
  };

  const handleUpdateSpan = async (id: string, span: string) => {
    await authFetch(`/api/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ span }),
    });
    setItems(items.map(i => i.id === id ? { ...i, span } : i));
  };

  return (
    <div className="p-8 max-w-6xl">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">
            VISUAL ARCHIVES
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Gallery</h1>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-primary-dim transition-colors cursor-pointer">
            <Upload size={12} />
            {uploading ? 'Uploading...' : 'Upload Images'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 border border-outline-variant/20 px-4 py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-surface-container-high transition-colors"
          >
            <Plus size={12} /> Add URL
          </button>
        </div>
      </header>

      {/* Manual URL form */}
      {showForm && (
        <div className="bg-surface-container-lowest p-6 mb-8 border border-outline-variant/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Add image by URL</span>
            <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-on-surface"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Title" className="bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-xs" />
            <input type="text" value={form.date} onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))} placeholder="2024-03-12" className="bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-xs" />
            <input type="text" value={form.url} onChange={e => setForm(prev => ({ ...prev, url: e.target.value }))} placeholder="Image URL" className="bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-xs" />
            <select value={form.span} onChange={e => setForm(prev => ({ ...prev, span: e.target.value }))} className="bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-xs">
              {SPAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={handleAddManual} className="bg-primary text-on-primary px-6 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-primary-dim transition-colors">
            Add Item
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-outline-variant/20 p-12 mb-8 text-center hover:border-primary transition-colors"
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
      >
        <Upload size={24} className="mx-auto mb-3 text-on-surface-variant/40" />
        <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
          Drag & drop images here
        </p>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-12 gap-4">
        {items.map(item => (
          <div key={item.id} className={`${item.span} group relative`}>
            <div className="relative overflow-hidden bg-surface-container-low">
              <img
                src={item.url}
                alt={item.title}
                className="w-full aspect-square object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-on-surface/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                <select
                  value={item.span}
                  onChange={e => handleUpdateSpan(item.id, e.target.value)}
                  className="bg-white/90 text-xs font-mono px-2 py-1 border-0"
                  onClick={e => e.stopPropagation()}
                >
                  {SPAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-white hover:text-red-300 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="mt-2 font-mono text-[10px] text-on-surface-variant truncate">{item.title}</div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 text-on-surface-variant font-mono text-sm">
          No gallery items yet. Upload some images to get started.
        </div>
      )}
    </div>
  );
}
