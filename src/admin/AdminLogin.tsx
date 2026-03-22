import { useState } from 'react';
import { motion } from 'motion/react';

export function AdminLogin({ onLogin }: { onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-4">
            ADMIN // RESTRICTED ACCESS
          </div>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
            The Archivist
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-10 space-y-8 shadow-[0px_20px_40px_rgba(54,57,45,0.05)]">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 text-xs font-mono uppercase tracking-wider text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary transition-all py-2 px-0 font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border-0 border-b border-outline-variant focus:ring-0 focus:border-primary transition-all py-2 px-0 font-mono text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 font-mono text-xs uppercase tracking-widest hover:bg-primary-dim transition-colors disabled:opacity-50"
          >
            {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
