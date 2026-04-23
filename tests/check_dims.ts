import { google } from '@ai-sdk/google';
import { embed } from 'ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkDims() {
  const { embedding } = await embed({
    model: google.textEmbeddingModel('gemini-embedding-001'),
    value: 'test',
  });
  console.log('gemini-embedding-001 dimensions:', embedding.length);
}

checkDims();
