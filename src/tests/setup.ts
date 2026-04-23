import { vi } from 'vitest';

// Helper to create a chainable mock
const createMockChain = (responseData: any = { id: 'mock-id' }) => {
  const chain: any = {
    select: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve({ data: responseData, error: null })),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    // Make the chain itself thenable to act like a promise
    then: (resolve: any) => Promise.resolve({ data: Array.isArray(responseData) ? responseData : [responseData], error: null }).then(resolve),
  };
  return chain;
};

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => createMockChain()),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
  },
}));

// Mock AI SDK
vi.mock('ai', () => ({
  generateText: vi.fn(() => Promise.resolve({ text: 'Mocked AI Response' })),
  embed: vi.fn(() => Promise.resolve({ embedding: new Array(768).fill(0) })),
  embedMany: vi.fn(() => Promise.resolve({ embeddings: [new Array(768).fill(0)] })),
}));

vi.mock('@ai-sdk/google', () => ({
  google: Object.assign(vi.fn(() => ({})), {
    textEmbeddingModel: vi.fn(() => ({})),
  }),
}));

// Mock unpdf
vi.mock('unpdf', () => ({
  getDocumentProxy: vi.fn(() => Promise.resolve({})),
  extractText: vi.fn(() => Promise.resolve({ text: 'Mocked PDF Text' })),
}));

// Mock mammoth
vi.mock('mammoth', () => ({
  extractRawText: vi.fn(() => Promise.resolve({ value: 'Mocked DOCX Text' })),
}));
