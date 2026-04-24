import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Sanitize key to prevent hidden newline corruption (%0D%0A)
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || '',
});
