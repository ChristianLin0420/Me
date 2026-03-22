import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, ArrowUpRight } from 'lucide-react';
import { Button } from '@/src/components/UI';

declare global {
  interface Window {
    L?: any;
  }
}

const LOCATION_COORDS: Record<string, [number, number]> = {
  'hsinchu': [24.8036, 120.9686],
  'taipei': [25.033, 121.5654],
  'london': [51.5074, -0.1278],
  'zürich': [47.3769, 8.5417],
  'zurich': [47.3769, 8.5417],
  'new york': [40.7128, -74.0060],
  'san francisco': [37.7749, -122.4194],
  'tokyo': [35.6762, 139.6503],
  'berlin': [52.5200, 13.4050],
  'singapore': [1.3521, 103.8198],
};

function getCoords(location: string): [number, number] {
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(LOCATION_COORDS)) {
    if (lower.includes(key)) return coords;
  }
  return [24.8036, 120.9686];
}

function LocationMap({ location }: { location: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    function initMap() {
      if (!window.L || !mapRef.current) {
        setTimeout(initMap, 100);
        return;
      }

      const coords = getCoords(location);
      const map = window.L.map(mapRef.current, {
        center: coords,
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
      });

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      const pinIcon = window.L.divIcon({
        html: `<div style="width:24px;height:24px;background:#5e5e5e;border:3px solid #fefcf4;border-radius:50%;box-shadow:0 2px 8px rgba(54,57,45,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: '',
      });

      window.L.marker(coords, { icon: pinIcon }).addTo(map);
      mapInstance.current = map;
    }

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [location]);

  return (
    <div
      ref={mapRef}
      className="h-48 w-full rounded overflow-hidden"
      style={{ filter: 'grayscale(1) sepia(0.35) contrast(0.85) brightness(1.05)' }}
    />
  );
}

export function Contact() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(setProfile).catch(() => {});
  }, []);

  const contacts: { platform: string; url: string }[] = profile?.contacts || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('success');
      setName(''); setEmail(''); setMessage('');
    } catch {
      setStatus('error');
    }
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
            <div className="mb-4">
              <LocationMap location={profile?.location || 'Hsinchu, TW'} />
            </div>
            <p className="font-mono text-xs uppercase text-on-surface-variant">
              {profile?.location || 'Hsinchu, TW'}
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
                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    Something went wrong. Please try again.
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2 group-focus-within:text-primary">Full Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary transition-all py-2 px-0" placeholder="John Doe" />
                  </div>
                  <div className="group">
                    <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2 group-focus-within:text-primary">Email Address</label>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary transition-all py-2 px-0" placeholder="hello@example.com" />
                  </div>
                </div>
                <div className="group">
                  <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2 group-focus-within:text-primary">Your Message</label>
                  <textarea required rows={5} value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary transition-all py-2 px-0 resize-none" placeholder="How can I assist you with your digital archive?" />
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
