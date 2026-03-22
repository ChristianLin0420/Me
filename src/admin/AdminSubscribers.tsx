import { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from './useAuth';

interface Subscriber {
  id: number;
  email: string;
  verified: number;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export function AdminSubscribers() {
  const { authFetch } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/admin/subscribers')
      .then(r => r.json())
      .then(data => {
        setSubscribers(data.subscribers || []);
        setActiveCount(data.activeCount || 0);
        setEmailConfigured(data.emailConfigured || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authFetch]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-widest text-on-surface-variant animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-1">
          Manage
        </div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Subscribers</h1>
      </div>

      {!emailConfigured && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 flex items-start gap-3">
          <AlertCircle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-yellow-800 font-semibold">Email not configured</p>
            <p className="text-xs text-yellow-700 mt-1">
              Set the <code className="bg-yellow-100 px-1">RESEND_API_KEY</code> environment variable to enable email sending. 
              Subscriptions are still collected but confirmation/notification emails won't be sent.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-low p-6">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-on-surface-variant" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Total</span>
          </div>
          <div className="font-headline text-3xl font-bold">{subscribers.length}</div>
        </div>
        <div className="bg-surface-container-low p-6">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-tertiary" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Active</span>
          </div>
          <div className="font-headline text-3xl font-bold text-tertiary">{activeCount}</div>
        </div>
        <div className="bg-surface-container-low p-6">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={14} className="text-on-surface-variant" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">Email</span>
          </div>
          <div className="font-headline text-lg font-bold">{emailConfigured ? 'Active' : 'Not Set'}</div>
        </div>
      </div>

      {subscribers.length === 0 ? (
        <div className="text-center py-16 text-on-surface-variant">
          <Users size={32} className="mx-auto mb-4 opacity-30" />
          <p className="font-mono text-xs uppercase tracking-widest">No subscribers yet</p>
        </div>
      ) : (
        <div className="border border-outline-variant/10">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-high font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
            <div className="col-span-5">Email</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Subscribed</div>
            <div className="col-span-2">Verified</div>
          </div>
          {subscribers.map(sub => (
            <div key={sub.id} className="grid grid-cols-12 gap-4 px-6 py-3 border-t border-outline-variant/10 items-center hover:bg-surface-container-low transition-colors">
              <div className="col-span-5 font-mono text-xs truncate">{sub.email}</div>
              <div className="col-span-2">
                {sub.unsubscribed_at ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-red-500">
                    <XCircle size={10} /> Unsub
                  </span>
                ) : sub.verified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-tertiary">
                    <CheckCircle size={10} /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-on-surface-variant">
                    Pending
                  </span>
                )}
              </div>
              <div className="col-span-3 font-mono text-[10px] text-on-surface-variant">
                {new Date(sub.subscribed_at).toLocaleDateString()}
              </div>
              <div className="col-span-2 font-mono text-[10px] text-on-surface-variant">
                {sub.verified ? 'Yes' : 'No'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
