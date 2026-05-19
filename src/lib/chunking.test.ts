import { describe, it, expect } from 'vitest';
import { chunkText, chunkDocument } from './chunking';

const SHORT = 'This is a short sentence. It has two parts.';

const LONG_TEXT = Array.from({ length: 60 }, (_, i) =>
  `Sentence number ${i + 1} describes an important instructional design principle in detail.`
).join(' ');

describe('chunkText', () => {
  it('returns an empty array for empty input', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   ')).toEqual([]);
  });

  it('returns a single chunk for short text that fits within target', () => {
    const chunks = chunkText(SHORT, 800, 80);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(SHORT);
  });

  it('splits long text into multiple chunks', () => {
    const chunks = chunkText(LONG_TEXT, 100, 10); // small target to force splitting
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('each chunk does not exceed the target character count by a full extra sentence', () => {
    const targetTokens = 50;
    const chunks = chunkText(LONG_TEXT, targetTokens, 5);
    const targetChars = targetTokens * 4;
    for (const chunk of chunks) {
      // Each chunk can exceed target by at most one sentence (last sentence pushed it over)
      // Allow 2x as a reasonable ceiling
      expect(chunk.length).toBeLessThan(targetChars * 2);
    }
  });

  it('all original sentences are present across the full chunk set', () => {
    const sentences = [
      'The first important rule is to always sanitize inputs.',
      'The second rule covers output encoding for XSS prevention.',
      'The third rule is about using parameterized queries.',
      'The fourth rule deals with proper authentication flows.',
      'The fifth rule is about secure session management.',
    ];
    const text = sentences.join(' ');
    const chunks = chunkText(text, 30, 5); // force splits
    const joined = chunks.join(' ');
    // Every sentence start should appear somewhere in the joined chunks
    for (const sentence of sentences) {
      const firstWords = sentence.split(' ').slice(0, 3).join(' ');
      expect(joined).toContain(firstWords);
    }
  });

  it('overlap carries tail of previous chunk into next chunk', () => {
    // Use a very small target and overlap to make the overlap verifiable
    const text =
      'Alpha sentence ends here. Beta sentence follows next. Gamma sentence comes last.';
    const chunks = chunkText(text, 10, 5); // ~40 char target, ~20 char overlap
    // If overlap is working, chunk[1] should contain some words from chunk[0]'s end
    if (chunks.length >= 2) {
      // Get last word of chunk[0] — it should appear at the start of chunk[1]
      const lastWordsChunk0 = chunks[0].split(' ').slice(-3).join(' ');
      // At least one word from the tail should bleed into the next chunk
      const hasOverlap = chunks[1].includes(lastWordsChunk0.split(' ')[0]) ||
        chunks[1].includes(lastWordsChunk0.split(' ')[1] || '');
      expect(hasOverlap).toBe(true);
    }
  });

  it('handles text with no sentence-ending punctuation', () => {
    const text = 'no punctuation here at all just words flowing continuously without end';
    const chunks = chunkText(text, 5, 1); // very small target (~20 chars)
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    // All content preserved
    const rejoined = chunks.join(' ');
    expect(rejoined).toContain('no punctuation');
  });
});

describe('chunkDocument', () => {
  it('includes the contextual_header on every chunk', () => {
    const chunks = chunkDocument(LONG_TEXT, 'Safety Manual', 100, 10);
    expect(chunks.length).toBeGreaterThan(0);
    for (const c of chunks) {
      expect(c.contextual_header).toBe('Safety Manual');
    }
  });

  it('preserves the raw_content field', () => {
    const chunks = chunkDocument(SHORT, 'Header', 800, 80);
    expect(chunks[0].raw_content).toBe(SHORT);
  });
});
