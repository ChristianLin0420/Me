import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navLinks = [
  { name: 'HOME', path: '/' },
  { name: 'BLOGS', path: '/blogs' },
  { name: 'PUBLICATIONS', path: '/publications' },
  { name: 'GALLERY', path: '/gallery' },
  { name: 'CONTACTS', path: '/contact' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-300",
      scrolled ? "glass-nav py-4 shadow-sm" : "bg-transparent py-6"
    )}>
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <Link to="/" className="font-mono font-bold text-xl tracking-tighter text-on-surface">
          ARCHIVIST
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "font-headline text-sm tracking-tight font-medium uppercase transition-all relative py-1",
                location.pathname === link.path 
                  ? "text-on-surface border-b-2 border-on-surface" 
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-on-surface"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-surface border-t border-outline-variant/10 p-8 flex flex-col space-y-6 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="font-headline text-lg font-medium uppercase text-on-surface"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

export function Footer() {
  const [contacts, setContacts] = useState<{ platform: string; url: string }[]>([]);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data?.contacts) setContacts(data.contacts);
      })
      .catch(() => {});
  }, []);

  const links = contacts.length > 0
    ? contacts
    : [{ platform: 'GITHUB', url: '#' }, { platform: 'LINKEDIN', url: '#' }, { platform: 'ORCID', url: '#' }, { platform: 'EMAIL', url: '#' }];

  return (
    <footer className="bg-surface-container-low w-full py-12 px-8 border-t border-outline-variant/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-6 md:mb-0">
          © {new Date().getFullYear()} THE DIGITAL ARCHIVIST. ALL RIGHTS RESERVED.
        </div>
        <div className="flex space-x-8 items-center">
          {links.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target={link.url.startsWith('http') ? '_blank' : undefined}
              rel={link.url.startsWith('http') ? 'noreferrer' : undefined}
              className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant hover:text-on-surface underline decoration-1 underline-offset-4 transition-all hover:-translate-y-0.5"
            >
              {link.platform}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
