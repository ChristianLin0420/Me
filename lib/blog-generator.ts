// COMPOSER Agent: Transforms StructuredReading into a blog draft
// Maps AI paper analysis to the existing ContentBlock[] format

import type { StructuredReading } from './paper-reader.js';

interface ContentBlock {
  type: string;
  text?: string;
  latex?: string;
  caption?: string;
  code?: string;
  language?: string;
  url?: string;
  alt?: string;
  width?: number;
  items?: { label: string; value: string; description: string }[];
}

export interface BlogDraft {
  date: string;
  id_tag: string;
  tags: string[];
  title: string;
  excerpt: string;
  equation: string;
  image: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
  category: string;
  volume: string;
  keywords: string[];
  hero_image: string;
  hero_caption: string;
  abstract: string;
  tools: string[];
  sections: ContentBlock[];
  source_paper_id: string;
}

export function generateBlogDraft(
  reading: StructuredReading,
  paper: { arxivId: string; authors: string[]; url: string; venue: string }
): BlogDraft {
  const today = new Date().toISOString().split('T')[0];
  const idTag = `PR-${paper.arxivId || Date.now()}`;

  const sections: ContentBlock[] = [];

  // 01. Overview
  sections.push({ type: 'heading', text: '01. Overview' });
  sections.push({ type: 'paragraph', text: reading.abstract });

  // 02. Key Contributions
  sections.push({ type: 'heading', text: '02. Key Contributions' });
  const contributionsText = reading.keyContributions
    .map((c, i) => `**${i + 1}.** ${c}`)
    .join('\n\n');
  sections.push({ type: 'paragraph', text: contributionsText });

  // 03. Methodology
  sections.push({ type: 'heading', text: '03. Methodology' });
  sections.push({ type: 'paragraph', text: reading.methodology });

  // 04. Key Equations (if any)
  if (reading.equations && reading.equations.length > 0) {
    sections.push({ type: 'heading', text: '04. Key Equations' });
    for (const eq of reading.equations) {
      sections.push({
        type: 'equation',
        latex: eq.latex,
        caption: eq.caption,
      });
    }
  }

  // 05. Results
  const resultsHeadingNum = reading.equations?.length > 0 ? '05' : '04';
  if (reading.results && reading.results.length > 0) {
    sections.push({ type: 'heading', text: `${resultsHeadingNum}. Results` });
    sections.push({
      type: 'metrics',
      items: reading.results.map(r => ({
        label: r.label.toUpperCase(),
        value: r.value,
        description: r.description,
      })),
    });
  }

  // Paper sections summary
  if (reading.sections && reading.sections.length > 0) {
    const sectionNum = parseInt(resultsHeadingNum) + (reading.results?.length > 0 ? 1 : 0);
    sections.push({ type: 'heading', text: `${String(sectionNum).padStart(2, '0')}. Paper Structure` });
    for (const sec of reading.sections) {
      sections.push({ type: 'paragraph', text: `**${sec.heading}**: ${sec.content}` });
    }
  }

  // Critical Analysis
  sections.push({ type: 'heading', text: 'Critical Analysis' });
  sections.push({ type: 'paragraph', text: reading.criticalAnalysis });

  // Paper Reference
  sections.push({ type: 'heading', text: 'Reference' });
  sections.push({
    type: 'paragraph',
    text: `**${reading.title}**\n${paper.authors.join(', ')}\n${paper.venue ? `*${paper.venue}*` : ''}\n[View Paper](${paper.url})`,
  });

  return {
    date: today,
    id_tag: idTag,
    tags: ['PAPER_REVIEW', ...reading.keywords.slice(0, 3).map(k => k.toUpperCase().replace(/\s+/g, '_'))],
    title: `Paper Review: ${reading.title}`,
    excerpt: reading.oneSentenceSummary,
    equation: reading.equations?.[0]?.latex || '',
    image: '',
    author_name: '',
    author_role: '',
    author_avatar: '',
    category: 'Paper Review',
    volume: idTag,
    keywords: reading.keywords,
    hero_image: '',
    hero_caption: '',
    abstract: reading.abstract,
    tools: reading.tools,
    sections,
    source_paper_id: paper.arxivId || paper.url,
  };
}
