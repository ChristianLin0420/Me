import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, RefreshCw, Play, CheckCircle, Clock, AlertCircle, FileEdit, Loader2, Trash2, Mail } from 'lucide-react';
import { useAuth } from './useAuth';

interface Digest {
  id: number;
  digest_date: string;
  email_sent: number;
  created_at: string;
}

interface PaperSelection {
  id: number;
  digest_id: number;
  paper_index: number;
  arxiv_id: string;
  title: string;
  status: string;
  draft_blog_id: number | null;
  error_message: string | null;
  created_at: string;
}

interface DigestDetail extends Digest {
  papers: any[];
  selections: PaperSelection[];
}

const STATUS_CONFIG: Record<string, { icon: typeof Clock; label: string; color: string }> = {
  pending: { icon: Clock, label: 'PENDING', color: 'text-on-surface-variant' },
  processing: { icon: Loader2, label: 'PROCESSING', color: 'text-blue-600' },
  draft_created: { icon: FileEdit, label: 'DRAFT READY', color: 'text-amber-600' },
  published: { icon: CheckCircle, label: 'PUBLISHED', color: 'text-green-600' },
  failed: { icon: AlertCircle, label: 'FAILED', color: 'text-red-600' },
};

export function AdminPaperDigest() {
  const { authFetch } = useAuth();
  const [digests, setDigests] = useState<Digest[]>([]);
  const [selectedDigest, setSelectedDigest] = useState<DigestDetail | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [digestsRes, draftsRes] = await Promise.all([
        authFetch('/api/admin/digests'),
        authFetch('/api/admin/drafts'),
      ]);
      setDigests(await digestsRes.json());
      setDrafts(await draftsRes.json());
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const loadDigestDetail = async (id: number) => {
    try {
      const res = await authFetch(`/api/admin/digests/${id}`);
      setSelectedDigest(await res.json());
    } catch (err) {
      console.error('Failed to load digest:', err);
    }
  };

  const triggerDigest = async () => {
    setTriggering(true);
    try {
      await authFetch('/api/admin/digest/trigger', { method: 'POST' });
      setTimeout(fetchData, 3000);
    } catch (err) {
      console.error('Failed to trigger digest:', err);
    } finally {
      setTriggering(false);
    }
  };

  const reprocessPaper = async (selectionId: number) => {
    try {
      await authFetch(`/api/admin/papers/${selectionId}/reprocess`, { method: 'POST' });
      if (selectedDigest) {
        setTimeout(() => loadDigestDetail(selectedDigest.id), 2000);
      }
    } catch (err) {
      console.error('Failed to reprocess:', err);
    }
  };

  const publishDraft = async (blogId: number) => {
    try {
      await authFetch(`/api/admin/drafts/${blogId}/publish`, { method: 'POST' });
      fetchData();
      if (selectedDigest) loadDigestDetail(selectedDigest.id);
    } catch (err) {
      console.error('Failed to publish:', err);
    }
  };

  const deleteDigest = async (id: number) => {
    if (!confirm('Delete this digest and all its paper selections?')) return;
    try {
      const res = await authFetch(`/api/admin/digests/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        alert(err.error || 'Failed to delete digest');
        return;
      }
      if (selectedDigest?.id === id) setSelectedDigest(null);
      setDigests(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete digest:', err);
    }
  };

  const resendDigestEmail = async (id: number) => {
    try {
      const res = await authFetch(`/api/admin/digests/${id}/resend`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Email resent!');
        fetchData();
      } else {
        alert(data.error || 'Failed to resend email');
      }
    } catch (err) {
      console.error('Failed to resend email:', err);
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">
            AUTOMATION
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Paper Digest
          </h1>
        </div>
        <button
          onClick={triggerDigest}
          disabled={triggering}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50"
        >
          {triggering ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
          {triggering ? 'Triggering...' : 'Trigger Digest Now'}
        </button>
      </header>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 size={24} className="animate-spin mx-auto text-on-surface-variant" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Digest History */}
          <div className="lg:col-span-1">
            <h2 className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-4">
              DIGEST HISTORY
            </h2>
            <div className="space-y-2">
              {digests.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant font-mono text-xs">
                  No digests yet. Trigger one to get started.
                </div>
              ) : (
                digests.map(d => (
                  <div
                    key={d.id}
                    className={`p-4 transition-colors ${
                      selectedDigest?.id === d.id
                        ? 'bg-surface-container-highest'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <button
                      onClick={() => loadDigestDetail(d.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium">{d.digest_date}</span>
                        {d.email_sent ? (
                          <CheckCircle size={12} className="text-green-600" />
                        ) : (
                          <Clock size={12} className="text-on-surface-variant" />
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-on-surface-variant mt-1">
                        {d.email_sent ? 'EMAIL SENT' : 'EMAIL NOT SENT'}
                      </div>
                    </button>
                    <div className="flex gap-3 mt-2 pt-2 border-t border-outline-variant/30">
                      <button
                        onClick={() => resendDigestEmail(d.id)}
                        className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-blue-600 hover:underline"
                        title={d.email_sent ? 'Resend email' : 'Send email'}
                      >
                        <Mail size={10} />
                        {d.email_sent ? 'Resend' : 'Send Email'}
                      </button>
                      <button
                        onClick={() => deleteDigest(d.id)}
                        className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-red-600 hover:underline"
                        title="Delete digest"
                      >
                        <Trash2 size={10} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drafts Section */}
            {drafts.length > 0 && (
              <div className="mt-8">
                <h2 className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-4">
                  PENDING DRAFTS ({drafts.length})
                </h2>
                <div className="space-y-2">
                  {drafts.map((draft: any) => (
                    <div key={draft.id} className="bg-surface-container-lowest p-4">
                      <h4 className="font-headline text-sm font-medium truncate mb-2">{draft.title}</h4>
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/blogs/${draft.id}`}
                          className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => publishDraft(Number(draft.id))}
                          className="font-mono text-[10px] uppercase tracking-widest text-green-600 hover:underline"
                        >
                          Publish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Digest Detail */}
          <div className="lg:col-span-2">
            {selectedDigest ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">
                    DIGEST: {selectedDigest.digest_date}
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => resendDigestEmail(selectedDigest.id)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Resend digest email"
                    >
                      <Mail size={14} />
                    </button>
                    <button
                      onClick={() => deleteDigest(selectedDigest.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete digest"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => loadDigestDetail(selectedDigest.id)}
                      className="text-on-surface-variant hover:text-on-surface transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedDigest.selections.map(sel => {
                    const config = STATUS_CONFIG[sel.status] || STATUS_CONFIG.pending;
                    const StatusIcon = config.icon;

                    return (
                      <div key={sel.id} className="bg-surface-container-lowest p-5">
                        <div className="flex items-start gap-4">
                          <div className="shrink-0 w-8 h-8 bg-surface-container-high flex items-center justify-center font-mono text-xs font-bold">
                            {sel.paper_index + 1}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="font-headline text-sm font-semibold leading-tight mb-1">
                              {sel.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <StatusIcon size={12} className={`${config.color} ${sel.status === 'processing' ? 'animate-spin' : ''}`} />
                              <span className={`font-mono text-[10px] tracking-widest uppercase ${config.color}`}>
                                {config.label}
                              </span>
                              {sel.arxiv_id && (
                                <span className="font-mono text-[10px] text-on-surface-variant">
                                  arXiv:{sel.arxiv_id}
                                </span>
                              )}
                            </div>
                            {sel.error_message && (
                              <div className="bg-red-50 text-red-700 text-xs font-mono p-2 mb-2">
                                {sel.error_message}
                              </div>
                            )}
                            <div className="flex gap-3">
                              {sel.status === 'draft_created' && sel.draft_blog_id && (
                                <>
                                  <Link
                                    to={`/admin/blogs/${sel.draft_blog_id}`}
                                    className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline"
                                  >
                                    Edit Draft
                                  </Link>
                                  <button
                                    onClick={() => publishDraft(sel.draft_blog_id!)}
                                    className="font-mono text-[10px] uppercase tracking-widest text-green-600 hover:underline"
                                  >
                                    Publish
                                  </button>
                                </>
                              )}
                              {(sel.status === 'failed' || sel.status === 'pending' || sel.status === 'processing') && (
                                <button
                                  onClick={() => reprocessPaper(sel.id)}
                                  className="font-mono text-[10px] uppercase tracking-widest text-blue-600 hover:underline"
                                >
                                  {sel.status === 'failed' ? 'Retry' : sel.status === 'processing' ? 'Force Retry' : 'Process Now'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <Newspaper size={32} className="mx-auto text-on-surface-variant/40 mb-4" />
                <p className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
                  Select a digest to view papers
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
