import { getDb } from './index.js';

function parseJsonFields(row: any, fields: string[]) {
  if (!row) return row;
  const parsed = { ...row };
  for (const field of fields) {
    if (parsed[field] && typeof parsed[field] === 'string') {
      try { parsed[field] = JSON.parse(parsed[field]); } catch { /* leave as-is */ }
    }
  }
  return parsed;
}

// ── Publications ──

export function getAllPublications() {
  const rows = getDb().prepare('SELECT id, year, type, title, journal, links FROM publications ORDER BY date DESC').all();
  return rows.map((r: any) => ({ ...parseJsonFields(r, ['links']), id: String(r.id) }));
}

export function getPublicationById(id: number) {
  const row = getDb().prepare('SELECT * FROM publications WHERE id = ?').get(id) as any;
  if (!row) return null;

  const parsed = parseJsonFields(row, ['links', 'keywords', 'tools', 'sections']);

  let nextItem = null;
  if (parsed.next_item_id) {
    const next = getDb().prepare('SELECT id, title FROM publications WHERE id = ?').get(parsed.next_item_id) as any;
    if (next) nextItem = { id: String(next.id), title: next.title, contentType: 'publication' };
  }

  return {
    id: String(parsed.id),
    contentType: 'publication',
    category: parsed.category,
    volume: parsed.volume,
    date: parsed.date,
    title: parsed.title,
    author: { name: parsed.author_name, role: parsed.author_role },
    citations: parsed.citations,
    keywords: parsed.keywords,
    heroImage: parsed.hero_image,
    heroCaption: parsed.hero_caption,
    abstract: parsed.abstract,
    tools: parsed.tools,
    sections: parsed.sections,
    nextItem,
  };
}

export function createPublication(data: any) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO publications (year, type, title, journal, links, category, volume, date, author_name, author_role, citations, keywords, hero_image, hero_caption, abstract, tools, sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.year, data.type, data.title, data.journal,
    JSON.stringify(data.links || []),
    data.category || data.type, data.volume || '',
    data.date || data.year, data.author_name || '', data.author_role || '',
    data.citations || 0, JSON.stringify(data.keywords || []),
    data.hero_image || '', data.hero_caption || '',
    data.abstract || '', JSON.stringify(data.tools || []),
    JSON.stringify(data.sections || [])
  );
  return getPublicationById(Number(result.lastInsertRowid));
}

export function updatePublication(id: number, data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE publications SET
      year = COALESCE(?, year), type = COALESCE(?, type), title = COALESCE(?, title),
      journal = COALESCE(?, journal), links = COALESCE(?, links),
      category = COALESCE(?, category), volume = COALESCE(?, volume),
      date = COALESCE(?, date), author_name = COALESCE(?, author_name),
      author_role = COALESCE(?, author_role), citations = COALESCE(?, citations),
      keywords = COALESCE(?, keywords), hero_image = COALESCE(?, hero_image),
      hero_caption = COALESCE(?, hero_caption), abstract = COALESCE(?, abstract),
      tools = COALESCE(?, tools), sections = COALESCE(?, sections),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.year ?? null, data.type ?? null, data.title ?? null,
    data.journal ?? null, data.links ? JSON.stringify(data.links) : null,
    data.category ?? null, data.volume ?? null,
    data.date ?? null, data.author_name ?? null,
    data.author_role ?? null, data.citations ?? null,
    data.keywords ? JSON.stringify(data.keywords) : null,
    data.hero_image ?? null, data.hero_caption ?? null,
    data.abstract ?? null, data.tools ? JSON.stringify(data.tools) : null,
    data.sections ? JSON.stringify(data.sections) : null,
    id
  );
  return getPublicationById(id);
}

export function deletePublication(id: number) {
  getDb().prepare('DELETE FROM publications WHERE id = ?').run(id);
}

// ── Blogs ──

export function getAllBlogs() {
  const rows = getDb().prepare(`
    SELECT id, date, id_tag, tags, title, excerpt, equation, image,
           author_name, author_role, author_avatar
    FROM blogs ORDER BY date DESC
  `).all();
  return rows.map((r: any) => ({
    ...parseJsonFields(r, ['tags']),
    id: String(r.id),
    author: r.author_name ? { name: r.author_name, role: r.author_role, avatar: r.author_avatar } : undefined,
  }));
}

export function getBlogById(id: number) {
  const row = getDb().prepare('SELECT * FROM blogs WHERE id = ?').get(id) as any;
  if (!row) return null;

  const parsed = parseJsonFields(row, ['tags', 'keywords', 'tools', 'sections']);

  let nextItem = null;
  if (parsed.next_item_id) {
    const next = getDb().prepare('SELECT id, title FROM blogs WHERE id = ?').get(parsed.next_item_id) as any;
    if (next) nextItem = { id: String(next.id), title: next.title, contentType: 'blog' };
  }

  return {
    id: String(parsed.id),
    contentType: 'blog',
    category: parsed.category,
    volume: parsed.volume,
    date: parsed.date,
    title: parsed.title,
    author: { name: parsed.author_name, role: parsed.author_role, avatar: parsed.author_avatar },
    keywords: parsed.keywords,
    heroImage: parsed.hero_image,
    heroCaption: parsed.hero_caption,
    abstract: parsed.abstract,
    tools: parsed.tools,
    sections: parsed.sections,
    nextItem,
  };
}

export function createBlog(data: any) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO blogs (date, id_tag, tags, title, excerpt, equation, image, author_name, author_role, author_avatar, category, volume, keywords, hero_image, hero_caption, abstract, tools, sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.date, data.id_tag || '',
    JSON.stringify(data.tags || []), data.title, data.excerpt || '',
    data.equation || '', data.image || '',
    data.author_name || '', data.author_role || '', data.author_avatar || '',
    data.category || 'Research Note', data.volume || data.id_tag || '',
    JSON.stringify(data.keywords || []),
    data.hero_image || '', data.hero_caption || '',
    data.abstract || '', JSON.stringify(data.tools || []),
    JSON.stringify(data.sections || [])
  );
  return getBlogById(Number(result.lastInsertRowid));
}

export function updateBlog(id: number, data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE blogs SET
      date = COALESCE(?, date), id_tag = COALESCE(?, id_tag),
      tags = COALESCE(?, tags), title = COALESCE(?, title),
      excerpt = COALESCE(?, excerpt), equation = COALESCE(?, equation),
      image = COALESCE(?, image), author_name = COALESCE(?, author_name),
      author_role = COALESCE(?, author_role), author_avatar = COALESCE(?, author_avatar),
      category = COALESCE(?, category), volume = COALESCE(?, volume),
      keywords = COALESCE(?, keywords), hero_image = COALESCE(?, hero_image),
      hero_caption = COALESCE(?, hero_caption), abstract = COALESCE(?, abstract),
      tools = COALESCE(?, tools), sections = COALESCE(?, sections),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    data.date ?? null, data.id_tag ?? null,
    data.tags ? JSON.stringify(data.tags) : null, data.title ?? null,
    data.excerpt ?? null, data.equation ?? null,
    data.image ?? null, data.author_name ?? null,
    data.author_role ?? null, data.author_avatar ?? null,
    data.category ?? null, data.volume ?? null,
    data.keywords ? JSON.stringify(data.keywords) : null,
    data.hero_image ?? null, data.hero_caption ?? null,
    data.abstract ?? null, data.tools ? JSON.stringify(data.tools) : null,
    data.sections ? JSON.stringify(data.sections) : null,
    id
  );
  return getBlogById(id);
}

export function deleteBlog(id: number) {
  getDb().prepare('DELETE FROM blogs WHERE id = ?').run(id);
}

// ── Gallery ──

export function getAllGallery() {
  const rows = getDb().prepare('SELECT * FROM gallery ORDER BY date DESC').all();
  return rows.map((r: any) => ({ ...r, id: String(r.id) }));
}

export function createGalleryItem(data: any) {
  const db = getDb();
  const result = db.prepare('INSERT INTO gallery (title, date, url, span) VALUES (?, ?, ?, ?)').run(
    data.title, data.date, data.url, data.span || 'col-span-4'
  );
  return { id: String(result.lastInsertRowid), ...data };
}

export function updateGalleryItem(id: number, data: any) {
  getDb().prepare(`
    UPDATE gallery SET
      title = COALESCE(?, title), date = COALESCE(?, date),
      url = COALESCE(?, url), span = COALESCE(?, span)
    WHERE id = ?
  `).run(data.title ?? null, data.date ?? null, data.url ?? null, data.span ?? null, id);
  return getDb().prepare('SELECT * FROM gallery WHERE id = ?').get(id);
}

export function deleteGalleryItem(id: number) {
  getDb().prepare('DELETE FROM gallery WHERE id = ?').run(id);
}

// ── Subscribers ──

export function addSubscriber(email: string, token: string) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM subscribers WHERE email = ?').get(email) as any;
  if (existing) {
    if (existing.unsubscribed_at) {
      db.prepare('UPDATE subscribers SET unsubscribed_at = NULL, verified = 0, token = ? WHERE id = ?').run(token, existing.id);
      return { id: existing.id, resubscribed: true };
    }
    return { id: existing.id, already: true, verified: existing.verified };
  }
  const result = db.prepare('INSERT INTO subscribers (email, token) VALUES (?, ?)').run(email, token);
  return { id: Number(result.lastInsertRowid), new: true };
}

export function verifySubscriber(token: string) {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscribers WHERE token = ?').get(token) as any;
  if (!sub) return null;
  db.prepare('UPDATE subscribers SET verified = 1 WHERE id = ?').run(sub.id);
  return { id: sub.id, email: sub.email };
}

export function unsubscribe(token: string) {
  const db = getDb();
  const sub = db.prepare('SELECT * FROM subscribers WHERE token = ?').get(token) as any;
  if (!sub) return null;
  db.prepare("UPDATE subscribers SET unsubscribed_at = datetime('now') WHERE id = ?").run(sub.id);
  return { id: sub.id, email: sub.email };
}

export function getVerifiedSubscribers() {
  return getDb().prepare('SELECT id, email, subscribed_at FROM subscribers WHERE verified = 1 AND unsubscribed_at IS NULL').all();
}

export function getAllSubscribers() {
  return getDb().prepare('SELECT id, email, verified, subscribed_at, unsubscribed_at FROM subscribers ORDER BY subscribed_at DESC').all();
}

export function getSubscriberCount() {
  const row = getDb().prepare('SELECT COUNT(*) as count FROM subscribers WHERE verified = 1 AND unsubscribed_at IS NULL').get() as any;
  return row?.count || 0;
}

// ── Auth ──

export function getAdminByUsername(username: string) {
  return getDb().prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as any;
}

// ── Profile ──

export function getProfile() {
  const row = getDb().prepare('SELECT * FROM profile WHERE id = 1').get() as any;
  if (!row) return null;
  return parseJsonFields(row, ['contacts']);
}

export function updateProfile(data: any) {
  const db = getDb();
  db.prepare(`
    UPDATE profile SET
      display_name = COALESCE(?, display_name),
      role_title = COALESCE(?, role_title),
      bio = COALESCE(?, bio),
      avatar_url = COALESCE(?, avatar_url),
      location = COALESCE(?, location),
      status_text = COALESCE(?, status_text),
      contacts = COALESCE(?, contacts),
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    data.display_name ?? null,
    data.role_title ?? null,
    data.bio ?? null,
    data.avatar_url ?? null,
    data.location ?? null,
    data.status_text ?? null,
    data.contacts ? JSON.stringify(data.contacts) : null
  );
  return getProfile();
}
