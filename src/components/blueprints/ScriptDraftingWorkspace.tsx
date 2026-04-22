// REQUIRED DEPENDENCY: framer-motion (npm install framer-motion), lucide-react (npm install lucide-react), @mui/material (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Link as LinkIcon, 
  FileText, 
  Loader2
} from 'lucide-react';
import { Box, Typography, Button } from '@mui/material';

interface ScriptDraftingWorkspaceProps {
  scriptTitle: string;
  content: string;
  groundingScore: number;
  hallucinationFlag: boolean;
  semanticDelta?: string;
  citations: string[];
  isLoading?: boolean;
  onCommit: () => void;
}

const ScriptDraftingWorkspace = ({ 
  scriptTitle, 
  content, 
  groundingScore, 
  hallucinationFlag, 
  semanticDelta, 
  citations,
  isLoading,
  onCommit
}: ScriptDraftingWorkspaceProps) => {
  const [activeCitationIdx, setActiveCitationIdx] = useState<number | null>(null);

  const integrityColor = groundingScore > 7 ? '#A7DADB' : '#7C69F5';

  if (isLoading) {
    return (
      <Box className="flex flex-col items-center justify-center h-full w-full bg-[#020C1B]">
        <Loader2 className="animate-spin text-[#7C69F5] mb-4" size={48} />
        <Typography className="text-[#94A3B8] font-mono tracking-widest text-xs uppercase">
          Synthesizing Instructional Paths...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col h-full w-full overflow-hidden bg-[#020C1B] font-sans selection:bg-[#7C69F5]/30">
      {/* HEADER / INTEGRITY SHIELD */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#7C69F5]/20 bg-[#020C1B]/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-[#7C69F5]/10 border border-[#7C69F5]/30">
            <FileText size={20} className="text-[#7C69F5]" />
          </div>
          <div>
            <Typography className="text-[10px] font-bold text-[#7C69F5] tracking-widest uppercase">Script Workspace</Typography>
            <Typography variant="h6" className="text-[#E2E8F0] font-medium leading-tight">{scriptTitle}</Typography>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-full border border-[#7C69F5]/20">
            <div className="relative flex items-center justify-center w-10 h-10">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="20" cy="20" r="18" stroke="rgba(124, 105, 245, 0.1)" strokeWidth="3" fill="transparent" />
                <motion.circle
                  cx="20" cy="20" r="18" stroke={integrityColor} strokeWidth="3" fill="transparent" strokeDasharray="113.1"
                  initial={{ strokeDashoffset: 113.1 }}
                  animate={{ strokeDashoffset: 113.1 - (113.1 * groundingScore) / 10 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-[#E2E8F0]">{groundingScore}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <Typography className="text-[10px] text-[#94A3B8] uppercase tracking-tighter">Grounding Score</Typography>
                <ShieldCheck size={12} className="text-[#A7DADB]" />
              </div>
              <Typography className="text-xs font-bold text-[#E2E8F0]">Integrity Shield</Typography>
            </div>
          </div>
          
          <Button 
            variant="contained"
            onClick={onCommit}
            sx={{ bgcolor: '#7C69F5', '&:hover': { bgcolor: '#6a56e0' }, textTransform: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, px: 3 }}
          >
            COMMIT TO NOVA
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `radial-gradient(#7C69F5 1px, transparent 0)`, backgroundSize: '24px 24px' }} />

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <AnimatePresence>
            {hallucinationFlag && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 backdrop-blur-md flex items-start gap-4">
                <AlertTriangle className="text-amber-500 mt-1 flex-shrink-0" size={20} />
                <div>
                  <Typography className="text-amber-500 font-bold text-sm">Semantic Delta Detected</Typography>
                  <Typography className="text-amber-200/70 text-xs mt-1">{semanticDelta || "Content deviates from the Polaris source artifacts."}</Typography>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="max-w-3xl mx-auto">
            <Typography className="text-[#E2E8F0] leading-relaxed text-lg font-light tracking-wide whitespace-pre-wrap">
              {content || "Initialize architecture to generate script..."}
            </Typography>
          </div>
        </div>

        <div className="w-80 border-l border-[#7C69F5]/15 bg-[#020C1B]/80 backdrop-blur-xl flex flex-col">
          <div className="p-4 border-b border-[#7C69F5]/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon size={14} className="text-[#A7DADB]" />
              <Typography className="text-xs font-bold text-[#E2E8F0] uppercase tracking-widest">Grounding Sources</Typography>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {citations.map((source, i) => (
              <motion.div
                key={i}
                onMouseEnter={() => setActiveCitationIdx(i)}
                onMouseLeave={() => setActiveCitationIdx(null)}
                className={`p-3 rounded border transition-all duration-300 cursor-pointer ${activeCitationIdx === i ? 'bg-[#7C69F5]/10 border-[#7C69F5]' : 'bg-[#7C69F5]/5 border-[#7C69F5]/15'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A7DADB]" />
                  <Typography className="text-[10px] text-[#94A3B8] uppercase font-bold">Source {i + 1}</Typography>
                </div>
                <Typography className="text-sm font-medium text-[#E2E8F0] mb-2">{source}</Typography>
                <button className="text-[10px] text-[#7C69F5] hover:underline flex items-center gap-1 uppercase tracking-tighter">Open Source <LinkIcon size={10} /></button>
              </motion.div>
            ))}
            {citations.length === 0 && (
              <Typography className="text-xs text-[#94A3B8] italic text-center py-10">No citations mapped yet.</Typography>
            )}
          </div>
        </div>
      </div>
    </Box>
  );
};

export default ScriptDraftingWorkspace;
