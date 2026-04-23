import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testEmbed() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`;
  
  const payload = {
    content: { parts: [{ text: "test" }] }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.embedding && data.embedding.values) {
      console.log('Embedding dimension count:', data.embedding.values.length);
    } else {
      console.log('Embed Response:', JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.error('Embed Failed:', e.message);
  }
}

testEmbed();
