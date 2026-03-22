import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Send, ArrowUpRight, MapPin } from 'lucide-react';
import { Button } from '@/src/components/UI';

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(setProfile).catch(() => {});
  }, []);

  const contacts: { platform: string; url: string }[] = profile?.contacts || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setTimeout(() => setStatus('success'), 1500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-24 px-6"
    >
      <header className="max-w-3xl mx-auto text-center mb-20">
        <div className="font-mono text-xs tracking-[0.3em] uppercase text-on-surface-variant mb-4">Inquiries & Collaboration</div>
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface mb-8">Get in touch.</h1>
        <p className="text-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto font-light">
          Whether you have a technical question regarding an archive or a proposal for a new digital publication, my door is always open.
        </p>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        <div className="md:col-span-4 space-y-12 order-2 md:order-1">
          <section>
            <h3 className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-6">Digital Reach</h3>
            <ul className="space-y-4">
              {contacts.map(link => (
                <li key={link.platform}>
                  <a
                    href={link.url}
                    target={link.url.startsWith('http') ? '_blank' : undefined}
                    rel={link.url.startsWith('http') ? 'noreferrer' : undefined}
                    className="group flex items-center justify-between py-2 border-b border-outline-variant/10 hover:border-primary transition-all"
                  >
                    <span className="font-mono text-sm uppercase">{link.platform}</span>
                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
              {contacts.length === 0 && (
                <>
                  {['GITHUB', 'LINKEDIN', 'ORCID'].map(platform => (
                    <li key={platform}>
                      <a href="#" className="group flex items-center justify-between py-2 border-b border-outline-variant/10 hover:border-primary transition-all">
                        <span className="font-mono text-sm uppercase">{platform}</span>
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </section>
          <section className="bg-surface-container-low p-8 rounded-lg">
            <h3 className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-4">Location</h3>
            <div className="relative h-48 w-full bg-surface-container-high mb-4 overflow-hidden rounded grayscale">
              <img src="https://picsum.photos/seed/map/400/300" alt="Map" className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin size={32} className="text-primary" />
              </div>
            </div>
            <p className="font-mono text-xs uppercase text-on-surface-variant">
              {profile?.location || 'London, United Kingdom'}
            </p>
          </section>
        </div>

        <div className="md:col-span-8 order-1 md:order-2">
          <div className="bg-surface-container-lowest p-8 md:p-12 rounded-xl shadow-[0px_20px_40px_rgba(54,57,45,0.03)]">
            {status === 'success' ? (
              <div className="text-center py-12">
                <h3 className="font-headline text-2xl font-bold mb-4">Inquiry Received.</h3>
                <p className="text-on-surface-variant">The archivist will respond to your request shortly.</p>
                <Button className="mt-8" onClick={() => setStatus('idle')}>Send Another</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2 group-focus-within:text-primary">Full Name</label>
                    <input required className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary transition-all py-2 px-0" placeholder="John Doe" />
                  </div>
                  <div className="group">
                    <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2 group-focus-within:text-primary">Email Address</label>
                    <input required type="email" className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary transition-all py-2 px-0" placeholder="hello@example.com" />
                  </div>
                </div>
                <div className="group">
                  <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2 group-focus-within:text-primary">Your Message</label>
                  <textarea required rows={5} className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary transition-all py-2 px-0 resize-none" placeholder="How can I assist you with your digital archive?" />
                </div>
                <div className="pt-6">
                  <Button type="submit" disabled={status === 'submitting'} className="w-full md:w-auto flex items-center justify-center gap-3">
                    {status === 'submitting' ? 'SENDING...' : 'SEND MESSAGE'}
                    <Send size={14} />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
