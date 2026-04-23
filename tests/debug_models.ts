import { google } from '@ai-sdk/google';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugModels() {
  console.log('API Key present:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  
  try {
    // Try a simple generation to see what happens
    console.log('Testing connection with gemini-1.5-flash...');
    // We can't easily list models via the AI SDK directly, but we can try to use one.
    // The error message mentioned "v1beta".
  } catch (e) {
    console.error(e);
  }
}

debugModels();
