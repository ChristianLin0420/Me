// SCOUT Agent: Paper Discovery Service
// Uses Semantic Scholar Academic Graph API to find top-rated papers
// Focused on: RL, MARL, VLM, VLA, Robotics, World Models
// From top AI conferences and labs

export interface PaperCandidate {
  paperId: string;
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  citationCount: number;
  influentialCitationCount: number;
  url: string;
  pdfUrl: string;
  venue: string;
  publicationDate: string | null;
}

// ── Research Topics ──
const RESEARCH_QUERIES = [
  'reinforcement learning robotics',
  'multi-agent reinforcement learning',
  'vision language model robotics',
  'vision language action model',
  'robot manipulation learning',
  'world model reinforcement learning',
  'sim-to-real transfer robotics',
  'robot learning from demonstration',
  'multi-modal foundation model robot',
  'diffusion policy robot control',
];

// ── Top AI Conferences (normalized lowercase for matching) ──
const TOP_VENUES = new Set([
  // ML
  'icml', 'iclr', 'neurips', 'nips',
  // Robotics
  'icra', 'iros', 'corl',
  // NLP
  'emnlp', 'acl', 'naacl',
  // Vision
  'cvpr', 'eccv', 'iccv',
  // AI General
  'aaai', 'ijcai',
  // Workshops / preprints from these venues often appear as:
  'international conference on machine learning',
  'international conference on learning representations',
  'neural information processing systems',
  'conference on neural information processing systems',
  'ieee international conference on robotics and automation',
  'ieee/rsj international conference on intelligent robots and systems',
  'conference on robot learning',
  'conference on empirical methods in natural language processing',
  'ieee/cvf conference on computer vision and pattern recognition',
  'european conference on computer vision',
  'international conference on computer vision',
  'association for the advancement of artificial intelligence',
]);

// ── Top Labs / Affiliations (partial match against author affiliations or paper text) ──
const TOP_LABS = [
  // Industry
  'meta', 'fair', 'google', 'deepmind', 'google brain', 'google research',
  'openai', 'anthropic', 'nvidia',
  'physical intelligence', 'pi',
  'alibaba', 'bytedance', 'tencent', 'microsoft research',
  'toyota research', 'boston dynamics',
  // Universities
  'stanford', 'mit', 'cmu', 'carnegie mellon',
  'ucsd', 'uc san diego', 'uc berkeley', 'berkeley',
  'princeton', 'caltech', 'georgia tech',
  'eth zurich', 'oxford', 'cambridge',
  'tsinghua', 'peking university',
];

// ── Topic keywords that must appear in title or abstract ──
const TOPIC_KEYWORDS = [
  'reinforcement learning', 'rl',
  'multi-agent', 'marl', 'multi agent',
  'vision language', 'vlm', 'vla',
  'vision-language', 'language model',
  'robot', 'robotic', 'manipulation',
  'world model', 'world-model',
  'sim-to-real', 'sim2real',
  'imitation learning', 'learning from demonstration',
  'diffusion policy', 'action model',
  'embodied', 'locomotion', 'dexterous',
  'foundation model',
];

const SEMANTIC_SCHOLAR_BASE = 'https://api.semanticscholar.org/graph/v1';
const FIELDS = 'paperId,externalIds,title,authors,abstract,year,citationCount,influentialCitationCount,url,openAccessPdf,venue,publicationDate';

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  const headers: Record<string, string> = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
    headers['x-api-key'] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 429) {
        const wait = Math.pow(2, i) * 3000;
        console.log(`[SCOUT] Rate limited, waiting ${wait / 1000}s (attempt ${i + 1}/${retries + 1})...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      if (!res.ok) {
        throw new Error(`Semantic Scholar API error: ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      if (i === retries) {
        console.error(`[SCOUT] All retries exhausted for request`);
        return { data: [] }; // Return empty instead of throwing
      }
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 2000));
    }
  }
  return { data: [] };
}

function isTopicRelevant(title: string, abstract: string): boolean {
  const text = `${title} ${abstract}`.toLowerCase();
  return TOPIC_KEYWORDS.some(kw => text.includes(kw));
}

function matchesTopVenue(venue: string): boolean {
  if (!venue) return false;
  const v = venue.toLowerCase().trim();
  // Direct match
  if (TOP_VENUES.has(v)) return true;
  // Partial match (venue string contains a known conference name)
  for (const tv of TOP_VENUES) {
    if (v.includes(tv) || tv.includes(v)) return true;
  }
  return false;
}

function matchesTopLab(authors: string[]): boolean {
  // Check author names for known lab affiliations
  // Semantic Scholar author names sometimes include affiliation hints
  const authorText = authors.join(' ').toLowerCase();
  return TOP_LABS.some(lab => authorText.includes(lab));
}

function computeRecencyBonus(publicationDate: string | null): number {
  if (!publicationDate) return 0;
  const pubDate = new Date(publicationDate);
  const now = new Date();
  const daysSince = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 7) return 1.0;
  if (daysSince <= 30) return 0.7;
  if (daysSince <= 90) return 0.3;
  if (daysSince <= 365) return 0.1;
  return 0;
}

function scoreAndRank(papers: PaperCandidate[]): PaperCandidate[] {
  const maxCitations = Math.max(...papers.map(p => p.citationCount), 1);
  const maxInfluential = Math.max(...papers.map(p => p.influentialCitationCount), 1);

  const scored = papers.map(p => {
    const venueBonus = matchesTopVenue(p.venue) ? 0.2 : 0;
    const labBonus = matchesTopLab(p.authors) ? 0.1 : 0;

    const score =
      (p.citationCount / maxCitations) * 0.3 +
      (p.influentialCitationCount / maxInfluential) * 0.15 +
      computeRecencyBonus(p.publicationDate) * 0.25 +
      venueBonus +
      labBonus;

    return { paper: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.paper);
}

function deduplicatePapers(papers: PaperCandidate[]): PaperCandidate[] {
  const seen = new Set<string>();
  return papers.filter(p => {
    const key = p.paperId || p.arxivId || p.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function discoverPapers(queries: string[] = RESEARCH_QUERIES): Promise<PaperCandidate[]> {
  const allPapers: PaperCandidate[] = [];

  for (const query of queries) {
    try {
      const q = encodeURIComponent(query);
      // Fetch more papers per query to have a bigger pool to filter from
      const url = `${SEMANTIC_SCHOLAR_BASE}/paper/search?query=${q}&limit=30&fields=${FIELDS}&sort=citationCount:desc`;
      const data = await fetchWithRetry(url);

      if (data.data) {
        for (const paper of data.data) {
          if (!paper.title || !paper.abstract) continue;

          // Filter: must be topic-relevant
          if (!isTopicRelevant(paper.title, paper.abstract)) continue;

          const arxivId = paper.externalIds?.ArXiv || '';
          const pdfUrl = paper.openAccessPdf?.url || (arxivId ? `https://arxiv.org/pdf/${arxivId}` : '');

          allPapers.push({
            paperId: paper.paperId,
            arxivId,
            title: paper.title,
            authors: (paper.authors || []).map((a: any) => a.name),
            abstract: paper.abstract,
            year: paper.year || new Date().getFullYear(),
            citationCount: paper.citationCount || 0,
            influentialCitationCount: paper.influentialCitationCount || 0,
            url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
            pdfUrl,
            venue: paper.venue || '',
            publicationDate: paper.publicationDate || null,
          });
        }
      }

      // Respect rate limits (100 req / 5 min without API key, ~3s between calls is safe)
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`[SCOUT] Failed to fetch papers for "${query}":`, err);
    }
  }

  console.log(`[SCOUT] Raw papers collected: ${allPapers.length}`);
  const deduplicated = deduplicatePapers(allPapers);
  console.log(`[SCOUT] After dedup: ${deduplicated.length}`);

  const ranked = scoreAndRank(deduplicated);

  // Log top papers with their venue/lab signals
  ranked.slice(0, 10).forEach((p, i) => {
    const venueTag = matchesTopVenue(p.venue) ? `[${p.venue}]` : '';
    console.log(`[SCOUT] #${i + 1} (${p.citationCount} cites) ${venueTag} ${p.title.slice(0, 70)}`);
  });

  return ranked;
}

export async function getTopPapers(n: number = 10): Promise<PaperCandidate[]> {
  const papers = await discoverPapers();
  return papers.slice(0, n);
}
