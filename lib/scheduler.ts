// SCOUT + HERALD Orchestrator: Cron scheduling and daily digest pipeline

import cron from 'node-cron';
import crypto from 'crypto';
import { getTopPapers, type PaperCandidate } from './papers.js';
import { sendDigestEmail, sendDraftReadyEmail } from './email.js';
import * as queries from '../db/queries.js';
import { processPaper } from './paper-reader.js';
import { generateBlogDraft } from './blog-generator.js';

const DIGEST_EMAIL = process.env.DIGEST_EMAIL || process.env.ADMIN_EMAIL || 'crlc112358@gmail.com';

export async function runDailyDigest(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[SCHEDULER] Running daily digest for ${today}...`);

  // Check if already run today
  const existing = queries.getDigestByDate(today);
  if (existing && existing.email_sent) {
    console.log(`[SCHEDULER] Digest for ${today} already sent.`);
    return;
  }

  try {
    // 1. Discover papers (SCOUT)
    console.log('[SCOUT] Discovering top papers...');
    const papers = await getTopPapers(10);
    console.log(`[SCOUT] Found ${papers.length} papers.`);

    if (papers.length === 0) {
      console.log('[SCOUT] No papers found, skipping digest.');
      return;
    }

    // 2. Store digest
    const digest = queries.createDigest(today, papers);

    // 3. Create selection tokens (HERALD)
    const papersWithTokens = papers.map((paper, index) => {
      const token = crypto.randomBytes(32).toString('hex');
      queries.createPaperSelection({
        digest_id: digest.id,
        paper_index: index,
        arxiv_id: paper.arxivId || paper.paperId,
        title: paper.title,
        selection_token: token,
      });
      return { ...paper, selectionToken: token };
    });

    // 4. Send digest email (HERALD)
    console.log(`[HERALD] Sending digest email to ${DIGEST_EMAIL}...`);
    const emailResult = await sendDigestEmail(DIGEST_EMAIL, papersWithTokens);
    if ((emailResult as any)?.mock) {
      console.warn(`[HERALD] Email was MOCKED (RESEND_API_KEY not configured). No email was actually sent.`);
      console.warn(`[HERALD] Set RESEND_API_KEY in your .env to enable real email delivery.`);
    } else {
      queries.markDigestEmailSent(digest.id);
      console.log(`[HERALD] Digest email sent successfully.`);
    }
  } catch (err) {
    console.error('[SCHEDULER] Daily digest failed:', err);
  }
}

const PROCESSING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export async function processPaperSelection(selectionId: number): Promise<void> {
  const selection = queries.getPaperSelectionById(selectionId);
  if (!selection) throw new Error('Selection not found');

  // Allow retry if stuck in "processing" for too long
  if (selection.status === 'processing') {
    const updatedAt = new Date(selection.updated_at).getTime();
    const elapsed = Date.now() - updatedAt;
    if (elapsed < PROCESSING_TIMEOUT_MS) {
      throw new Error(`Selection is currently processing (started ${Math.round(elapsed / 1000)}s ago). Wait or retry after 10 min.`);
    }
    console.log(`[SCHEDULER] Selection ${selectionId} stuck in processing for ${Math.round(elapsed / 60000)} min, allowing retry.`);
  } else if (selection.status !== 'pending' && selection.status !== 'failed') {
    throw new Error(`Selection is already ${selection.status}`);
  }

  try {
    queries.updatePaperSelectionStatus(selectionId, 'processing');

    // Get the digest to retrieve full paper metadata
    const digest = queries.getDigest(selection.digest_id);
    if (!digest) throw new Error('Digest not found');

    const papers = digest.papers as PaperCandidate[];
    const paper = papers[selection.paper_index];
    if (!paper) throw new Error('Paper not found in digest');

    // READER: Download and analyze paper
    console.log(`[READER] Processing paper: ${paper.title}`);
    const pdfUrl = paper.pdfUrl || `https://arxiv.org/pdf/${paper.arxivId}`;
    const { text, reading } = await processPaper(pdfUrl, {
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
    });

    queries.updatePaperSelectionStatus(selectionId, 'processing', {
      paper_content: text.slice(0, 50000), // Store first 50k chars
      ai_reading: reading,
    });

    // COMPOSER: Generate blog draft
    console.log(`[COMPOSER] Generating blog draft...`);
    const draft = generateBlogDraft(reading, {
      arxivId: paper.arxivId,
      authors: paper.authors,
      url: paper.url,
      venue: paper.venue,
    });

    const blog = queries.createDraftBlog(draft);
    if (!blog) throw new Error('Failed to create draft blog');

    queries.updatePaperSelectionStatus(selectionId, 'draft_created', {
      draft_blog_id: Number(blog.id),
    });

    // Send notification email
    console.log(`[COMPOSER] Draft created. Sending notification...`);
    await sendDraftReadyEmail(DIGEST_EMAIL, {
      title: paper.title,
      blogId: Number(blog.id),
    });

    console.log(`[COMPOSER] Pipeline complete for: ${paper.title}`);
  } catch (err: any) {
    console.error(`[SCHEDULER] Paper processing failed:`, err);
    queries.updatePaperSelectionStatus(selectionId, 'failed', {
      error_message: err.message || 'Unknown error',
    });
  }
}

export function initScheduler(): void {
  const cronExpression = process.env.DIGEST_CRON || '0 7 * * *';
  console.log(`[SCHEDULER] Initializing daily digest cron: ${cronExpression}`);

  cron.schedule(cronExpression, () => {
    runDailyDigest().catch(err => {
      console.error('[SCHEDULER] Cron job failed:', err);
    });
  });

  console.log('[SCHEDULER] Cron job registered.');
}
