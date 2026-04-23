import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
  
  try {
    // There isn't a direct listModels in the new SDK easily exposed like this, 
    // but we can test a simple model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Gemini 1.5 Flash test success:", result.response.text());
  } catch (e: any) {
    console.error("Gemini 1.5 Flash test failed:", e.message);
  }
}

listModels();
