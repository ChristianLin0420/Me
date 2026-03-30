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
    FROM blogs WHERE is_draft = 0 ORDER BY date DESC
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
    if (existing.verified) {
      return { id: existing.id, already: true, verified: true };
    }
    db.prepare('UPDATE subscribers SET token = ? WHERE id = ?').run(token, existing.id);
    return { id: existing.id, already: false, verified: false };
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
  return getDb().prepare('SELECT id, email, verified, token, subscribed_at, unsubscribed_at FROM subscribers ORDER BY subscribed_at DESC').all();
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

// ── Paper Digests ──

export function createDigest(digestDate: string, papers: any[]) {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO paper_digests (digest_date, papers) VALUES (?, ?)'
  ).run(digestDate, JSON.stringify(papers));
  return { id: Number(result.lastInsertRowid), digest_date: digestDate, papers };
}

export function getDigest(id: number) {
  const row = getDb().prepare('SELECT * FROM paper_digests WHERE id = ?').get(id) as any;
  if (!row) return null;
  return parseJsonFields(row, ['papers']);
}

export function getDigestByDate(digestDate: string) {
  const row = getDb().prepare('SELECT * FROM paper_digests WHERE digest_date = ?').get(digestDate) as any;
  if (!row) return null;
  return parseJsonFields(row, ['papers']);
}

export function getAllDigests() {
  const rows = getDb().prepare('SELECT id, digest_date, email_sent, created_at FROM paper_digests ORDER BY digest_date DESC').all();
  return rows;
}

export function markDigestEmailSent(id: number) {
  getDb().prepare('UPDATE paper_digests SET email_sent = 1 WHERE id = ?').run(id);
}

export function deleteDigest(id: number) {
  const db = getDb();
  db.prepare('DELETE FROM paper_selections WHERE digest_id = ?').run(id);
  db.prepare('DELETE FROM paper_digests WHERE id = ?').run(id);
}

export function createPaperSelection(data: {
  digest_id: number;
  paper_index: number;
  arxiv_id: string;
  title: string;
  selection_token: string;
}) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO paper_selections (digest_id, paper_index, arxiv_id, title, selection_token)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.digest_id, data.paper_index, data.arxiv_id, data.title, data.selection_token);
  return { id: Number(result.lastInsertRowid), ...data, status: 'pending' };
}

function safeJsonParse(str: string | null | undefined, fallback: any = null): any {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    console.error('[DB] Failed to parse JSON field:', str?.slice(0, 200));
    return fallback;
  }
}

export function getPaperSelectionByToken(token: string) {
  const row = getDb().prepare('SELECT * FROM paper_selections WHERE selection_token = ?').get(token) as any;
  if (!row) return null;
  return {
    ...row,
    ai_reading: safeJsonParse(row.ai_reading),
  };
}

export function getPaperSelectionById(id: number) {
  const row = getDb().prepare('SELECT * FROM paper_selections WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    ai_reading: safeJsonParse(row.ai_reading),
  };
}

export function getSelectionsByDigestId(digestId: number) {
  const rows = getDb().prepare('SELECT * FROM paper_selections WHERE digest_id = ? ORDER BY paper_index ASC').all(digestId) as any[];
  return rows.map(row => ({
    ...row,
    ai_reading: safeJsonParse(row.ai_reading),
  }));
}

export function updatePaperSelectionStatus(id: number, status: string, extra?: {
  paper_content?: string;
  ai_reading?: any;
  draft_blog_id?: number;
  error_message?: string;
}) {
  const db = getDb();
  let sql = `UPDATE paper_selections SET status = ?, updated_at = datetime('now')`;
  const params: any[] = [status];

  if (extra?.paper_content !== undefined) {
    sql += ', paper_content = ?';
    params.push(extra.paper_content);
  }
  if (extra?.ai_reading !== undefined) {
    sql += ', ai_reading = ?';
    params.push(JSON.stringify(extra.ai_reading));
  }
  if (extra?.draft_blog_id !== undefined) {
    sql += ', draft_blog_id = ?';
    params.push(extra.draft_blog_id);
  }
  if (extra?.error_message !== undefined) {
    sql += ', error_message = ?';
    params.push(extra.error_message);
  }

  sql += ' WHERE id = ?';
  params.push(id);
  db.prepare(sql).run(...params);
}

export function getAllDraftBlogs() {
  const rows = getDb().prepare(`
    SELECT id, date, id_tag, tags, title, excerpt, equation, image,
           author_name, author_role, author_avatar, source_paper_id
    FROM blogs WHERE is_draft = 1 ORDER BY created_at DESC
  `).all();
  return rows.map((r: any) => ({
    ...parseJsonFields(r, ['tags']),
    id: String(r.id),
    author: r.author_name ? { name: r.author_name, role: r.author_role, avatar: r.author_avatar } : undefined,
  }));
}

export function publishDraft(blogId: number) {
  getDb().prepare('UPDATE blogs SET is_draft = 0, updated_at = datetime(\'now\') WHERE id = ?').run(blogId);
  return getBlogById(blogId);
}

export function createDraftBlog(data: any) {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO blogs (date, id_tag, tags, title, excerpt, equation, image, author_name, author_role, author_avatar, category, volume, keywords, hero_image, hero_caption, abstract, tools, sections, is_draft, source_paper_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    data.date, data.id_tag || '',
    JSON.stringify(data.tags || []), data.title, data.excerpt || '',
    data.equation || '', data.image || '',
    data.author_name || '', data.author_role || '', data.author_avatar || '',
    data.category || 'Paper Review', data.volume || data.id_tag || '',
    JSON.stringify(data.keywords || []),
    data.hero_image || '', data.hero_caption || '',
    data.abstract || '', JSON.stringify(data.tools || []),
    JSON.stringify(data.sections || []),
    data.source_paper_id || null
  );
  return getBlogById(Number(result.lastInsertRowid));
}

// ── Profile ──

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
