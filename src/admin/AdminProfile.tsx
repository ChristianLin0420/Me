import { useState, useEffect, useCallback } from 'react';
import { Save, Plus, Trash2, Upload } from 'lucide-react';
import { useAuth } from './useAuth';

interface Contact {
  platform: string;
  url: string;
}

interface ProfileData {
  display_name: string;
  role_title: string;
  bio: string;
  avatar_url: string;
  location: string;
  status_text: string;
  contacts: Contact[];
}

const EMPTY_PROFILE: ProfileData = {
  display_name: '', role_title: '', bio: '',
  avatar_url: '', location: '', status_text: '', contacts: [],
};

export function AdminProfile() {
  const { authFetch } = useAuth();
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(data => {
      if (data) setForm({ ...EMPTY_PROFILE, ...data });
    });
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    return data.url;
  }, [authFetch]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      setSuccess('Profile updated successfully');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof ProfileData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const contacts = [...form.contacts];
    contacts[index] = { ...contacts[index], [field]: value };
    update('contacts', contacts);
  };

  const addContact = () => {
    update('contacts', [...form.contacts, { platform: '', url: '' }]);
  };

  const removeContact = (index: number) => {
    update('contacts', form.contacts.filter((_, i) => i !== index));
  };

  return (
    <div className="p-8 max-w-3xl">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">
            SETTINGS
          </div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Profile</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 font-mono text-[10px] uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50"
        >
          <Save size={12} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-6 text-xs font-mono uppercase tracking-wider text-red-700">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-6 text-xs font-mono uppercase tracking-wider text-green-700">{success}</div>
      )}

      <div className="space-y-10">
        {/* Avatar */}
        <div className="flex items-start gap-8">
          <div className="shrink-0">
            <div className="w-32 h-40 bg-surface-container-low overflow-hidden">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30 font-mono text-xs">
                  NO IMAGE
                </div>
              )}
            </div>
            <label className="mt-3 flex items-center justify-center gap-2 bg-surface-container-highest px-4 py-2 font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:bg-surface-container-high transition-colors w-full">
              <Upload size={10} /> Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadImage(file);
                    update('avatar_url', url);
                  }
                }}
              />
            </label>
          </div>
          <div className="flex-grow space-y-4">
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Display Name</label>
              <input
                type="text"
                value={form.display_name}
                onChange={e => update('display_name', e.target.value)}
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-headline text-2xl font-bold"
                placeholder="Your Name"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Role / Title</label>
              <input
                type="text"
                value={form.role_title}
                onChange={e => update('role_title', e.target.value)}
                className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 text-sm"
                placeholder="Machine Learning Researcher"
              />
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => update('bio', e.target.value)}
            rows={3}
            className="w-full bg-transparent border border-outline-variant/15 focus:ring-0 focus:border-primary p-3 text-sm leading-relaxed resize-y"
            placeholder="A short bio about yourself..."
          />
        </div>

        {/* Location & Status */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => update('location', e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm"
              placeholder="Zürich, CH"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Status Text</label>
            <input
              type="text"
              value={form.status_text}
              onChange={e => update('status_text', e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-sm"
              placeholder="RESEARCHING AGI"
            />
          </div>
        </div>

        {/* Avatar URL (manual) */}
        <div>
          <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Avatar URL (or use upload above)</label>
          <input
            type="text"
            value={form.avatar_url}
            onChange={e => update('avatar_url', e.target.value)}
            className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-xs"
            placeholder="https://..."
          />
        </div>

        {/* Contacts */}
        <div className="border-t border-outline-variant/10 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-xl font-bold">Contact Links</h2>
            <button
              onClick={addContact}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-primary hover:underline"
            >
              <Plus size={12} /> Add Link
            </button>
          </div>

          <div className="space-y-4">
            {form.contacts.map((contact, i) => (
              <div key={i} className="flex items-center gap-4 bg-surface-container-lowest p-4">
                <input
                  type="text"
                  value={contact.platform}
                  onChange={e => updateContact(i, 'platform', e.target.value)}
                  placeholder="GITHUB"
                  className="w-40 bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-1 font-mono text-[10px] uppercase tracking-widest"
                />
                <input
                  type="text"
                  value={contact.url}
                  onChange={e => updateContact(i, 'url', e.target.value)}
                  placeholder="https://github.com/username"
                  className="flex-grow bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-1 font-mono text-xs"
                />
                <button
                  onClick={() => removeContact(i)}
                  className="text-on-surface-variant hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {form.contacts.length === 0 && (
              <div className="text-center py-8 text-on-surface-variant/50 font-mono text-xs">
                No contact links yet. Click "Add Link" to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
