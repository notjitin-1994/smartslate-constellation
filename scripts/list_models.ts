import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function listModels() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    console.error('API Key missing');
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const response = await fetch(url);
    const data: any = await response.json();
    
    console.log('--- AVAILABLE MODELS ---');
    if (data.models) {
      data.models.forEach((m: any) => {
        if (m.supportedGenerationMethods.includes('generateContent') || m.supportedGenerationMethods.includes('embedContent')) {
          console.log(`${m.name.replace('models/', '')} | Methods: ${m.supportedGenerationMethods.join(', ')}`);
        }
      });
    } else {
      console.log('No models found in response:', data);
    }
  } catch (error) {
    console.error('Fetch failed:', error);
  }
}

listModels();
