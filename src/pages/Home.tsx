import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail } from 'lucide-react';
import { SectionHeader } from '@/src/components/UI';
import { Publication, BlogPost, GalleryItem } from '@/src/types';
import { cn } from '@/src/lib/utils';

function SubscribeSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus('success');
      setMessage(data.message);
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Something went wrong');
    }
  };

  return (
    <section className="bg-surface-container-low py-24 mb-0">
      <div className="max-w-7xl mx-auto px-8">
        <div className="max-w-2xl">
          <div className="mono-text text-[10px] text-on-surface-variant mb-4 flex items-center gap-2">
            <Mail size={12} />
            SIGNAL_INTERCEPT
          </div>
          <h2 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter mb-4">
            Stay in the loop.
          </h2>
          <p className="text-on-surface-variant leading-relaxed mb-10 max-w-lg">
            Receive dispatches when new research, publications, or notes are archived.
          </p>

          {status === 'success' ? (
            <div className="bg-surface-container-lowest p-6 border-l-4 border-tertiary">
              <p className="font-mono text-sm text-on-surface">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-grow bg-transparent border-0 border-b-2 border-outline-variant/30 focus:ring-0 focus:border-primary py-3 px-0 text-sm placeholder:text-on-surface-variant/40"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="shrink-0 bg-primary text-on-primary px-8 py-3 font-mono text-[11px] uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 disabled:opacity-50"
              >
                {status === 'submitting' ? 'Sending...' : 'Subscribe'}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-4 font-mono text-xs text-red-600">{message}</p>
          )}

          <p className="mt-6 font-mono text-[9px] text-on-surface-variant/40 tracking-wider uppercase">
            Your data stays private. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Home() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch('/api/publications').then(res => res.json()).then(setPublications);
    fetch('/api/blogs').then(res => res.json()).then(setBlogs);
    fetch('/api/gallery').then(res => res.json()).then(setGallery);
    fetch('/api/profile').then(res => res.json()).then(setProfile);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-20"
    >
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8">
            <div className="mono-text text-sm text-on-surface-variant mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></span>
              STATUS: {profile?.status_text || 'RESEARCHING ARTIFICIAL GENERAL INTELLIGENCE'}
            </div>
            <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tighter text-on-surface leading-[0.9] mb-8">
              Mapping the <br/>latent space <br/>to world.
            </h1>
            <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl leading-relaxed mb-10">
              {profile?.bio || 'Machine Learning Researcher specializing in Transformer architectures and symbolic reasoning. Currently investigating the intersection of formal logic and neural networks.'}
            </p>
            <div className="flex gap-6">
              <Link to="/publications" className="px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all active:scale-95 bg-primary text-on-primary hover:bg-primary-dim">
                View Publications
              </Link>
              <Link to="/contact" className="px-8 py-4 font-mono text-sm uppercase tracking-widest transition-all active:scale-95 border-b border-on-surface hover:text-tertiary hover:border-tertiary">
                Get in Touch
              </Link>
            </div>
          </div>
          <div className="lg:col-span-4 relative mt-12 lg:mt-0">
            <div className="aspect-[3/4] bg-surface-container-low rounded-lg overflow-hidden grayscale contrast-125 hover:grayscale-0 transition-all duration-700">
              <img 
                className="w-full h-full object-cover" 
                src={profile?.avatar_url || 'https://picsum.photos/seed/researcher/600/800'}
                alt={profile?.display_name || 'Researcher'}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 p-6 bg-surface-container-lowest shadow-sm rounded-lg border border-outline-variant/10">
              <div className="mono-text text-xs text-on-surface-variant mb-1">CURRENT LOCATION</div>
              <div className="font-headline font-bold text-lg">{profile?.location || 'Zürich, CH'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Vectors */}
      <section className="bg-surface-container-low py-24 mb-32">
        <div className="max-w-7xl mx-auto px-8">
          <SectionHeader title="Core Vectors" subtitle="Current areas of technical exploration" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Robotic', desc: 'Developing autonomous systems that bridge perception, planning, and physical interaction in unstructured environments.' },
              { title: 'World Model', desc: 'Building internal representations that enable agents to predict, simulate, and reason about dynamic environments.' },
              { title: 'Multi-Agent RL', desc: 'Designing cooperative and competitive reinforcement learning frameworks for emergent multi-agent behavior.' }
            ].map((vector, i) => (
              <div key={i} className="p-10 bg-surface-container-lowest tonal-lift">
                <h3 className="mono-text font-bold text-xl mb-4 uppercase">{vector.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">{vector.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Publications */}
      <section className="max-w-7xl mx-auto px-8 mb-32">
        <div className="flex items-center justify-between mb-16">
          <h2 className="font-headline text-5xl font-bold tracking-tighter">Publications</h2>
          <Link to="/publications" className="font-mono text-sm underline decoration-1 underline-offset-4 hover:text-primary uppercase tracking-widest transition-all">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {publications.slice(0, 1).map(pub => (
            <Link to={`/publications/${pub.id}`} key={pub.id} className="md:col-span-7 group block">
              <div className="bg-surface-container-low p-8 md:p-12 h-full flex flex-col justify-between hover:bg-surface-container-high transition-colors">
                <div>
                  <div className="mono-text text-xs text-on-surface-variant mb-6 flex gap-4 uppercase">
                    <span>{pub.year}</span>
                    <span>•</span>
                    <span>{pub.type}</span>
                  </div>
                  <h3 className="font-headline text-3xl md:text-4xl font-bold mb-6 leading-tight group-hover:underline decoration-1 underline-offset-4">
                    {pub.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between mt-8">
                  <p className="mono-text text-xs text-on-surface-variant uppercase max-w-[200px]">
                    {pub.journal}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          <div className="md:col-span-5 flex flex-col gap-8">
            {publications.slice(1, 3).map(pub => (
              <Link to={`/publications/${pub.id}`} key={pub.id} className="bg-surface-container-low p-8 flex flex-col justify-between hover:bg-surface-container-high transition-colors block">
                <div>
                  <div className="mono-text text-xs text-on-surface-variant mb-4 uppercase">{pub.year}</div>
                  <h3 className="font-headline text-xl font-bold mb-4">{pub.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Blogs */}
      <section className="max-w-7xl mx-auto px-8 mb-32">
        <div className="flex items-center justify-between mb-16">
          <h2 className="font-headline text-5xl font-bold tracking-tighter">The Logbook</h2>
          <Link to="/blogs" className="font-mono text-sm underline decoration-1 underline-offset-4 hover:text-primary uppercase tracking-widest transition-all">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {blogs.slice(0, 1).map(blog => (
            <Link to={`/blogs/${blog.id}`} key={blog.id} className="md:col-span-8 group block">
              <div className="bg-surface-container-low p-8 md:p-12 h-full flex flex-col hover:bg-surface-container-high transition-colors">
                {blog.image && (
                  <div className="aspect-video mb-8 bg-surface-variant overflow-hidden">
                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                  <span className="mono-text text-[10px] text-on-surface-variant">{blog.date}</span>
                  <div className="flex gap-2">
                    {blog.tags.map(tag => (
                      <span key={tag} className="text-[10px] border border-outline-variant/20 px-2 py-0.5 text-on-surface-variant/60">{tag}</span>
                    ))}
                  </div>
                </div>
                <h3 className="font-headline text-3xl md:text-4xl font-bold mb-4 leading-tight group-hover:underline decoration-1 underline-offset-4">
                  {blog.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{blog.excerpt}</p>
              </div>
            </Link>
          ))}
          <div className="md:col-span-4 flex flex-col gap-8">
            {blogs.slice(1, 3).map(blog => (
              <Link to={`/blogs/${blog.id}`} key={blog.id} className="bg-surface-container-low p-8 flex flex-col hover:bg-surface-container-high transition-colors block">
                <span className="mono-text text-[10px] text-on-surface-variant mb-3">{blog.date} // {blog.id_tag}</span>
                <h3 className="font-headline text-xl font-bold mb-3">{blog.title}</h3>
                <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-3">{blog.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Records */}
      <section className="max-w-7xl mx-auto px-8 mb-32">
        <SectionHeader title="Visual Records" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:auto-rows-[200px]">
          {gallery.map((item, i) => (
            <div key={item.id} className={cn("overflow-hidden rounded-lg relative group", item.span, i % 3 === 0 ? "row-span-2" : "row-span-1")}>
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                src={item.url} 
                alt={item.title}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-on-surface/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="mono-text text-white text-xs uppercase tracking-widest">{item.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscribe */}
      <SubscribeSection />
    </motion.div>
  );
}
