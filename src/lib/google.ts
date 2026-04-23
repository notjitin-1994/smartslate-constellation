import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  // Force v1 API which is more stable for these models
  apiVersion: 'v1',
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);
