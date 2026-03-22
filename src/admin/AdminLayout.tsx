import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, BookOpen, Image, LogOut, User, Users } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const adminNav = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Publications', path: '/admin/publications', icon: FileText },
  { name: 'Blogs', path: '/admin/blogs', icon: BookOpen },
  { name: 'Gallery', path: '/admin/gallery', icon: Image },
  { name: 'Subscribers', path: '/admin/subscribers', icon: Users },
  { name: 'Profile', path: '/admin/profile', icon: User },
];

export function AdminLayout({ username, onLogout }: { username: string; onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container-low border-r border-outline-variant/10 flex flex-col shrink-0">
        <div className="p-6 border-b border-outline-variant/10">
          <Link to="/admin" className="font-mono font-bold text-sm tracking-tighter text-on-surface">
            ARCHIVIST
          </Link>
          <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mt-1">
            ADMIN PANEL
          </div>
        </div>

        <nav className="flex-grow py-4">
          {adminNav.map(item => {
            const isActive = item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 text-sm transition-all",
                  isActive
                    ? "bg-surface-container-highest text-on-surface font-medium"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                )}
              >
                <item.icon size={16} />
                <span className="font-headline text-xs uppercase tracking-wider">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-outline-variant/10">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] text-on-surface-variant uppercase">{username}</div>
            <button onClick={onLogout} className="text-on-surface-variant hover:text-on-surface transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
          <Link to="/" className="block mt-3 font-mono text-[10px] text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest underline underline-offset-4">
            View Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
