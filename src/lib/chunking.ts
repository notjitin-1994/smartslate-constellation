// Token-aware text chunker with sentence-boundary splits and overlap.
// Uses ~4 chars/token approximation for English prose.
// Replaces the old chunkText(text, size) which produced size*4 chars with zero overlap.

const CHARS_PER_TOKEN = 4;

// Split on sentence-ending punctuation followed by whitespace or end-of-string.
// Preserves the delimiter by using a zero-width lookahead.
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getOverlapTail(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  // Cut at a sentence boundary within the tail window if possible
  const tail = text.slice(-maxChars);
  const firstSentenceEnd = tail.search(/[.!?]\s/);
  return firstSentenceEnd >= 0 ? tail.slice(firstSentenceEnd + 1).trim() : tail;
}

/**
 * @param text           Source text to chunk
 * @param targetTokens   Approximate target size per chunk in tokens (default 800 ≈ 3200 chars)
 * @param overlapTokens  Token overlap carried from the previous chunk (default 80 ≈ 320 chars)
 */
export function chunkText(
  text: string,
  targetTokens = 800,
  overlapTokens = 80
): string[] {
  if (!text || !text.trim()) return [];

  const targetChars = targetTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;
  const sentences = splitSentences(text);

  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const wouldExceed = current.length + sentence.length + 1 > targetChars;

    if (wouldExceed && current.length > 0) {
      chunks.push(current.trim());
      // Seed the next chunk with the overlap tail of the current one
      const overlap = getOverlapTail(current, overlapChars);
      current = overlap ? overlap + ' ' + sentence : sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/** Chunk a large document without LLM-based segregation.
 *  Used as a fallback when the document exceeds the segregation threshold. */
export function chunkDocument(
  text: string,
  contextHeader: string,
  targetTokens = 800,
  overlapTokens = 80
): Array<{ raw_content: string; contextual_header: string }> {
  return chunkText(text, targetTokens, overlapTokens).map((chunk) => ({
    raw_content: chunk,
    contextual_header: contextHeader,
  }));
}
