import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { knowledgeIngestService } from '../../src/lib/services/knowledgeIngestService';
import { instructionalArchitectService } from '../../src/lib/services/instructionalArchitectService';
import { supabase } from '../../src/lib/supabase';

async function verifyPdfPipeline() {
  const blueprintId = '9ed8d030-f189-4cfb-9713-cafd113da263';
  const filePath = path.join(process.cwd(), 'tests/fixtures/test_document.pdf');
  const fileName = 'kju_executive_memo_test.pdf';

  console.log('📑 STARTING PDF VALIDATION TEST');

  try {
    // 1. Read PDF file as Base64
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    
    console.log(`📦 File Loaded: ${fileName} (${buffer.length} bytes)`);

    // 2. Trigger Ingestion
    console.log('🧠 Step 1: Processing PDF through Gemini Vision/OCR...');
    const ingestResult = await knowledgeIngestService.ingest({
      blueprintId,
      contentType: 'pdf',
      content: base64,
      fileName: fileName
    });

    console.log(`✅ Step 1 Success: Ingested ${ (ingestResult as any).count } chunks.`);
    console.log(`📝 Context Header: "${ (ingestResult as any).contextHeader }"`);

    // 3. Verify Database Persistence
    console.log('💾 Step 2: Verifying data in Supabase Knowledge Vault...');
    const { data: dbRows, error: dbError } = await supabase
      .from('knowledge_vault')
      .select('id, raw_content')
      .eq('blueprint_id', blueprintId)
      .eq('metadata->>source_name', fileName);

    if (dbError) throw dbError;
    if (!dbRows || dbRows.length === 0) throw new Error('Data not found in database.');

    console.log(`✅ Step 2 Success: ${dbRows.length} chunks confirmed in database.`);

    // 4. Test High-Fidelity Retrieval (RAG)
    console.log('🔍 Step 3: Testing Semantic Retrieval (RAG)...');
    const architectResult = await instructionalArchitectService.draftNodeScript({
      id: 'TEST_NODE',
      title: 'Executive Strategic Review',
      description: 'Discuss the key priorities and organizational mission defined in the memo.',
      pedagogicalMode: 'ACTIVATION',
      blueprintId
    });

    console.log(`✅ Step 3 Success: Script drafted with grounding.`);
    console.log(`📊 Grounding Score: ${architectResult.groundingScore}/10`);
    console.log(`📚 Citations used: ${architectResult.citations.join(', ')}`);
    console.log('--------------------------------------------------');
    console.log('📄 SCRIPT PREVIEW (Grounded in PDF):');
    console.log(architectResult.script.substring(0, 300) + '...');
    console.log('--------------------------------------------------');

    console.log('🎉 FULL PDF PIPELINE VERIFIED: SUCCESS');

  } catch (error: any) {
    console.error('❌ PDF Validation Failed:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

verifyPdfPipeline();
