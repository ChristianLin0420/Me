import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Eye, Bell, Send } from 'lucide-react';
import { ContentBlock } from '@/src/types';
import { BlockEditor } from './BlockEditor';
import { useAuth } from './useAuth';

type ContentType = 'publication' | 'blog';

interface FormData {
  // Shared
  title: string;
  date: string;
  category: string;
  volume: string;
  abstract: string;
  keywords: string;
  tools: string;
  hero_image: string;
  hero_caption: string;
  author_name: string;
  author_role: string;
  sections: ContentBlock[];
  // Publication-specific
  year: string;
  type: string;
  journal: string;
  citations: number;
  // Blog-specific
  id_tag: string;
  tags: string;
  excerpt: string;
  equation: string;
  image: string;
  author_avatar: string;
}

const EMPTY_FORM: FormData = {
  title: '', date: '', category: '', volume: '', abstract: '',
  keywords: '', tools: '', hero_image: '', hero_caption: '',
  author_name: '', author_role: '', sections: [],
  year: '', type: 'Journal Article', journal: '', citations: 0,
  id_tag: '', tags: '', excerpt: '', equation: '', image: '', author_avatar: '',
};

export function ContentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authFetch } = useAuth();
  const isNew = !id || id === 'new';

  const contentType: ContentType = location.pathname.includes('/publications') ? 'publication' : 'blog';
  const apiBase = contentType === 'publication' ? '/api/publications' : '/api/blogs';
  const listPath = contentType === 'publication' ? '/admin/publications' : '/admin/blogs';

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notifySubs, setNotifySubs] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    if (isNew) return;
    fetch(`${apiBase}/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          title: data.title || '',
          date: data.date || '',
          category: data.category || '',
          volume: data.volume || '',
          abstract: data.abstract || '',
          keywords: Array.isArray(data.keywords) ? data.keywords.join(', ') : data.keywords || '',
          tools: Array.isArray(data.tools) ? data.tools.join(', ') : data.tools || '',
          hero_image: data.heroImage || data.hero_image || '',
          hero_caption: data.heroCaption || data.hero_caption || '',
          author_name: data.author?.name || data.author_name || '',
          author_role: data.author?.role || data.author_role || '',
          sections: data.sections || [],
          year: data.year || '',
          type: data.type || data.category || '',
          journal: data.journal || '',
          citations: data.citations || 0,
          id_tag: data.id_tag || data.volume || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags || '',
          excerpt: data.excerpt || '',
          equation: data.equation || '',
          image: data.image || '',
          author_avatar: data.author?.avatar || data.author_avatar || '',
        });
      })
      .catch(() => setError('Failed to load content'));

    // Check if this is a draft blog
    if (contentType === 'blog' && !isNew) {
      authFetch('/api/admin/drafts')
        .then(r => r.json())
        .then((drafts: any[]) => {
          setIsDraft(drafts.some((d: any) => String(d.id) === String(id)));
        })
        .catch(() => {});
    }
  }, [apiBase, id, isNew]);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url;
  }, [authFetch]);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    const splitAndTrim = (s: string) => s.split(',').map(t => t.trim()).filter(Boolean);

    const body: Record<string, any> = {
      title: form.title,
      date: form.date,
      category: form.category,
      volume: form.volume,
      abstract: form.abstract,
      keywords: splitAndTrim(form.keywords),
      tools: splitAndTrim(form.tools),
      hero_image: form.hero_image,
      hero_caption: form.hero_caption,
      author_name: form.author_name,
      author_role: form.author_role,
      sections: form.sections,
    };

    if (contentType === 'publication') {
      body.year = form.year;
      body.type = form.type;
      body.journal = form.journal;
      body.citations = form.citations;
      body.links = [];
    } else {
      body.id_tag = form.id_tag;
      body.tags = splitAndTrim(form.tags);
      body.excerpt = form.excerpt;
      body.equation = form.equation;
      body.image = form.image;
      body.author_avatar = form.author_avatar;
    }

    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? apiBase : `${apiBase}/${id}`;
      const res = await authFetch(url, { method, body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      const data = await res.json();
      setSuccess('Saved successfully');

      if (notifySubs) {
        try {
          await authFetch('/api/admin/notify', {
            method: 'POST',
            body: JSON.stringify({
              title: form.title,
              type: contentType,
              excerpt: form.abstract || form.excerpt || '',
              contentId: data.id || id,
            }),
          });
          setSuccess('Saved & subscribers notified');
        } catch {
          setSuccess('Saved, but notification failed');
        }
        setNotifySubs(false);
      }

      if (isNew && data.id) {
        navigate(`${listPath}/${data.id}`, { replace: true });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await authFetch(`${apiBase}/${id}`, { method: 'DELETE' });
      navigate(listPath);
    } catch {
      setError('Delete failed');
      setDeleting(false);
    }
  };

  const update = (field: keyof FormData, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(listPath)} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant flex items-center gap-2">
              {contentType} / {isNew ? 'NEW' : `EDIT #${id}`}
              {isDraft && (
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 text-[9px] font-bold">DRAFT</span>
              )}
            </div>
            <h1 className="font-headline text-2xl font-bold tracking-tight">
              {isNew ? `New ${contentType === 'publication' ? 'Publication' : 'Blog Post'}` : form.title || 'Untitled'}
            </h1>
          </div>
        </div>
        <div className="flex gap-3">
          {!isNew && (
            <>
              <a
                href={`/${contentType === 'publication' ? 'publications' : 'blogs'}/${id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-outline-variant/20 font-mono text-[10px] uppercase tracking-widest hover:bg-surface-container-high transition-colors"
              >
                <Eye size={12} /> Preview
              </a>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 font-mono text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} /> Delete
              </button>
            </>
          )}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifySubs}
              onChange={e => setNotifySubs(e.target.checked)}
              className="accent-primary w-3.5 h-3.5"
            />
            <Bell size={12} className="text-on-surface-variant" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Notify</span>
          </label>
          {isDraft && (
            <button
              onClick={async () => {
                try {
                  await authFetch(`/api/admin/drafts/${id}/publish`, { method: 'POST' });
                  setIsDraft(false);
                  setSuccess('Published successfully!');
                } catch { setError('Publish failed'); }
              }}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-green-700 transition-colors"
            >
              <Send size={12} /> Publish
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50"
          >
            <Save size={12} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-6 text-xs font-mono uppercase tracking-wider text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-6 text-xs font-mono uppercase tracking-wider text-green-700">{success}</div>
      )}

      <div className="space-y-8">
        {/* Title */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            className="w-full bg-transparent border-0 border-b-2 border-outline-variant/20 focus:ring-0 focus:border-primary py-3 font-headline text-3xl font-bold tracking-tight"
            placeholder="Enter title..."
          />
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Date</label>
            <input type="text" value={form.date} onChange={e => update('date', e.target.value)} placeholder="2024.08.15" className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Category</label>
            <input type="text" value={form.category} onChange={e => update('category', e.target.value)} placeholder="Journal Article" className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Volume / Tag</label>
            <input type="text" value={form.volume} onChange={e => update('volume', e.target.value)} placeholder="Vol. 14" className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
          </div>
        </div>

        {/* Author */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Author Name</label>
            <input type="text" value={form.author_name} onChange={e => update('author_name', e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 text-sm" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Author Role</label>
            <input type="text" value={form.author_role} onChange={e => update('author_role', e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 text-sm" />
          </div>
        </div>

        {/* Publication-specific fields */}
        {contentType === 'publication' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-surface-container-low p-6">
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Year</label>
              <input type="text" value={form.year} onChange={e => update('year', e.target.value)} placeholder="2024.08" className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Type</label>
              <select value={form.type} onChange={e => update('type', e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm">
                <option>Journal Article</option>
                <option>Conference Paper</option>
                <option>Technical Report</option>
                <option>Book Chapter</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Journal</label>
              <input type="text" value={form.journal} onChange={e => update('journal', e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 text-sm" />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Citations</label>
              <input type="number" value={form.citations} onChange={e => update('citations', Number(e.target.value))} className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
            </div>
          </div>
        )}

        {/* Blog-specific fields */}
        {contentType === 'blog' && (
          <div className="space-y-6 bg-surface-container-low p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">ID Tag</label>
                <input type="text" value={form.id_tag} onChange={e => update('id_tag', e.target.value)} placeholder="NOTE_045" className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="ALGORITHMS, RESEARCH" className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Excerpt</label>
              <textarea value={form.excerpt} onChange={e => update('excerpt', e.target.value)} rows={2} className="w-full bg-transparent border border-outline-variant/15 focus:ring-0 focus:border-primary p-3 text-sm resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Card Equation (optional)</label>
                <input type="text" value={form.equation} onChange={e => update('equation', e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
              </div>
              <div>
                <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Card Image URL</label>
                <input type="text" value={form.image} onChange={e => update('image', e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Author Avatar URL</label>
              <input type="text" value={form.author_avatar} onChange={e => update('author_avatar', e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm" />
            </div>
          </div>
        )}

        {/* Keywords & Tools */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Keywords (comma-separated)</label>
            <input type="text" value={form.keywords} onChange={e => update('keywords', e.target.value)} placeholder="Entropy, Stability, Data Decay" className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 text-sm" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Tools (comma-separated)</label>
            <input type="text" value={form.tools} onChange={e => update('tools', e.target.value)} placeholder="Python / SciPy, LaTeX 2e" className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 text-sm" />
          </div>
        </div>

        {/* Hero Image */}
        <div className="space-y-3">
          <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">Hero Image</label>
          <div className="flex gap-3">
            <input type="text" value={form.hero_image} onChange={e => update('hero_image', e.target.value)} placeholder="Image URL" className="flex-grow bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-xs" />
            <label className="shrink-0 bg-surface-container-highest px-4 py-2 font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:bg-surface-container-high transition-colors">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadImage(file);
                    update('hero_image', url);
                  }
                }}
              />
            </label>
          </div>
          {form.hero_image && <img src={form.hero_image} className="max-h-40 object-cover opacity-80" referrerPolicy="no-referrer" />}
          <input type="text" value={form.hero_caption} onChange={e => update('hero_caption', e.target.value)} placeholder="Hero image caption" className="w-full bg-transparent border-0 border-b border-outline-variant/10 focus:ring-0 focus:border-primary py-1 font-mono text-[10px]" />
        </div>

        {/* Abstract */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Abstract</label>
          <textarea value={form.abstract} onChange={e => update('abstract', e.target.value)} rows={3} className="w-full bg-transparent border border-outline-variant/15 focus:ring-0 focus:border-primary p-3 text-sm leading-relaxed resize-y" placeholder="Brief summary of the content..." />
        </div>

        {/* Content Blocks */}
        <div className="border-t border-outline-variant/10 pt-8">
          <BlockEditor blocks={form.sections} onChange={sections => update('sections', sections)} onUploadImage={uploadImage} />
        </div>
      </div>
    </div>
  );
}
