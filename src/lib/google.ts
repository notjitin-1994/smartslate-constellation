import { createGoogleGenerativeAI } from '@ai-sdk/google';

/**
 * Aggressive Sanitization: Strips all hidden control characters, 
 * newlines, and whitespace that frequently corrupt Vercel environment variables.
 */
const sanitizeKey = (key: string | undefined) => {
  if (!key) return '';
  return key.replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '');
};

export const google = createGoogleGenerativeAI({
  apiKey: sanitizeKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
});
