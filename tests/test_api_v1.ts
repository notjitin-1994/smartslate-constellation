import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testV1() {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
  
  const payload = {
    contents: [{ parts: [{ text: "test" }] }]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log('V1 Response:', JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error('V1 Failed:', e.message);
  }
}

testV1();
