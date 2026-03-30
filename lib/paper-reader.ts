// READER Agent: Paper Analysis Pipeline
// Downloads PDFs, extracts text, and uses Groq API (Llama 3.3 70B) for structured reading

export interface StructuredReading {
  title: string;
  oneSentenceSummary: string;
  abstract: string;
  keyContributions: string[];
  methodology: string;
  results: { label: string; value: string; description: string }[];
  sections: { heading: string; content: string }[];
  equations: { latex: string; caption: string }[];
  keywords: string[];
  tools: string[];
  criticalAnalysis: string;
}

export async function downloadPaperPdf(pdfUrl: string): Promise<Buffer> {
  console.log(`[READER] Downloading PDF from: ${pdfUrl}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const res = await fetch(pdfUrl, {
      headers: { 'User-Agent': 'TheDigitalArchivist/1.0 (research paper digest)' },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`PDF download failed: ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType && !contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      console.warn(`[READER] Unexpected content-type: ${contentType}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      throw new Error('PDF download returned empty response');
    }

    return Buffer.from(arrayBuffer);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`PDF download timed out after 60s: ${pdfUrl}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse, VerbosityLevel } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS });
    const result = await parser.getText();
    return result.text;
  } catch (err: any) {
    throw new Error(`PDF text extraction failed: ${err.message || 'Unknown error'}. The PDF may be image-only or corrupted.`);
  }
}

export async function readPaper(
  paperText: string,
  metadata: { title: string; authors: string[]; abstract: string }
): Promise<StructuredReading> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is required for paper reading. Get a free key at https://console.groq.com');
  }

  // Truncate paper text to fit within Groq free tier TPM limits (~12k tokens ≈ ~30k chars)
  const maxChars = 28000;
  const truncatedText = paperText.length > maxChars
    ? paperText.slice(0, maxChars) + '\n\n[... paper text truncated for length ...]'
    : paperText;

  const prompt = `You are a research paper analyst. Read the following academic paper and return a structured JSON analysis.

Paper Title: ${metadata.title}
Authors: ${metadata.authors.join(', ')}
Paper Abstract: ${metadata.abstract}

--- FULL PAPER TEXT ---
${truncatedText}
--- END PAPER TEXT ---

Return a JSON object with EXACTLY this structure (no markdown code fences, just raw JSON):
{
  "title": "paper title",
  "oneSentenceSummary": "one sentence summary, max 200 characters",
  "abstract": "2-3 paragraph comprehensive summary of the paper",
  "keyContributions": ["contribution 1", "contribution 2", "contribution 3"],
  "methodology": "2-3 paragraphs describing the methodology",
  "results": [{"label": "METRIC NAME", "value": "value", "description": "what this means"}],
  "sections": [{"heading": "Section Name", "content": "summary of this section"}],
  "equations": [{"latex": "LaTeX string", "caption": "what this equation represents"}],
  "keywords": ["keyword1", "keyword2"],
  "tools": ["framework1", "dataset1"],
  "criticalAnalysis": "2-3 paragraphs on strengths, limitations, and future work"
}

Guidelines:
- For equations, use valid LaTeX syntax
- For results/metrics, extract quantitative findings with their values
- Keywords should be 5-10 specific terms
- Tools should list frameworks, datasets, and methods used
- Be thorough but concise in each section
- If you cannot find certain information (e.g., no equations), return an empty array for that field`;

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_completion_tokens: 8192,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Groq API error (${res.status}): ${errBody}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content ?? '';

      // Try to extract JSON from the response
      let jsonStr = text.trim();
      // Remove markdown code fences if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      // Also try to find JSON object boundaries if there's surrounding text
      if (!jsonStr.startsWith('{')) {
        const startIdx = jsonStr.indexOf('{');
        const endIdx = jsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
          jsonStr = jsonStr.slice(startIdx, endIdx + 1);
        }
      }

      let parsed: StructuredReading;
      try {
        parsed = JSON.parse(jsonStr) as StructuredReading;
      } catch (parseErr) {
        console.error(`[READER] JSON parse failed. Response snippet:`, jsonStr.slice(0, 500));
        throw new Error(`Failed to parse AI response as JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      }

      // Basic validation
      if (!parsed.title || !parsed.oneSentenceSummary || !parsed.keyContributions) {
        throw new Error('Missing required fields in AI response');
      }

      // Ensure array fields are actually arrays
      parsed.keyContributions = Array.isArray(parsed.keyContributions) ? parsed.keyContributions : [];
      parsed.results = Array.isArray(parsed.results) ? parsed.results : [];
      parsed.sections = Array.isArray(parsed.sections) ? parsed.sections : [];
      parsed.equations = Array.isArray(parsed.equations) ? parsed.equations : [];
      parsed.keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];
      parsed.tools = Array.isArray(parsed.tools) ? parsed.tools : [];

      return parsed;
    } catch (err: any) {
      console.error(`[READER] Attempt ${attempt + 1} failed:`, err);
      if (attempt === maxRetries) throw err;
      // Wait longer on rate limits (429/413)
      const isRateLimit = err.message?.includes('429') || err.message?.includes('413') || err.message?.includes('rate_limit');
      const delay = isRateLimit ? 60000 : 2000;
      console.log(`[READER] Waiting ${delay / 1000}s before retry...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error('Failed to read paper after all retries');
}

export async function processPaper(
  pdfUrl: string,
  metadata: { title: string; authors: string[]; abstract: string }
): Promise<{ text: string; reading: StructuredReading }> {
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await downloadPaperPdf(pdfUrl);
  } catch (err: any) {
    throw new Error(`Failed to download PDF from ${pdfUrl}: ${err.message}`);
  }

  let text: string;
  try {
    text = await extractTextFromPdf(pdfBuffer);
  } catch (err: any) {
    throw new Error(`Failed to extract text from PDF: ${err.message}`);
  }

  if (text.length < 500) {
    throw new Error(`Extracted text too short (${text.length} chars) — PDF may be image-only or corrupted`);
  }

  let reading: StructuredReading;
  try {
    reading = await readPaper(text, metadata);
  } catch (err: any) {
    throw new Error(`Groq API analysis failed: ${err.message}`);
  }

  return { text, reading };
}
