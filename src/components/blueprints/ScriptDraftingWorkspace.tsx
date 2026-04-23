// REQUIRED DEPENDENCIES:
// - lucide-react (npm install lucide-react)
// - react-markdown (npm install react-markdown)

"use client";

import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  BookOpen, 
  Send,
  Sparkles,
  Quote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ScriptDraftingWorkspaceProps {
  scriptTitle: string;
  content: string;
  groundingScore: number;
  hallucinationFlag: boolean;
  semanticDelta?: string;
  citations: string[];
  isLoading: boolean;
  onCommit: () => void;
}

const COLORS = {
  bg: '#020C1B',
  primary: '#7C69F5',
  secondary: '#A7DADB',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  glassBorder: 'rgba(124, 105, 245, 0.15)',
  glassBg: 'rgba(124, 105, 245, 0.04)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
};

const ScriptDraftingWorkspace: React.FC<ScriptDraftingWorkspaceProps> = ({
  scriptTitle,
  content,
  groundingScore,
  hallucinationFlag,
  semanticDelta,
  citations,
  isLoading,
  onCommit
}) => {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Integrity Header */}
      <div className="flex items-center justify-between p-4 mb-4 rounded-xl border border-[rgba(124, 105, 245, 0.1)] bg-white/[0.02]">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold">Integrity Shield</span>
            <div className="flex items-center gap-2">
              {hallucinationFlag ? (
                <div className="flex items-center gap-1.5 text-[#EF4444]">
                  <AlertTriangle size={16} />
                  <span className="text-sm font-bold">Grounding Warning</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[#10B981]">
                  <ShieldCheck size={16} />
                  <span className="text-sm font-bold">Verified Grounded</span>
                </div>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex flex-col">
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold">Grounding Score</span>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ 
                    width: `${groundingScore * 10}%`,
                    backgroundColor: groundingScore > 7 ? COLORS.success : groundingScore > 4 ? COLORS.warning : COLORS.error
                  }} 
                />
              </div>
              <span className="text-sm font-mono font-bold text-white">{groundingScore}/10</span>
            </div>
          </div>
        </div>

        <button 
          onClick={onCommit}
          className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#7C69F5] text-white font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(124,105,245,0.3)]"
        >
          Commit to Nova <Send size={14} />
        </button>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Main Script Editor (Markdown) */}
        <div className="flex-1 rounded-2xl border border-[rgba(124, 105, 245, 0.1)] bg-white/[0.01] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[rgba(124, 105, 245, 0.1)] bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#7C69F5]" />
              <span className="text-sm font-semibold text-[#E2E8F0]">{scriptTitle} — Production Script</span>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C69F5]/10 border border-[#7C69F5]/20">
                <Sparkles size={12} className="text-[#7C69F5] animate-pulse" />
                <span className="text-[10px] text-[#7C69F5] font-bold uppercase">Architecting...</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar prose prose-invert max-w-none">
            {isLoading ? (
              <div className="flex flex-col gap-4">
                <div className="h-8 w-1/3 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 className="text-3xl font-bold mb-6 text-white tracking-tight border-b border-white/10 pb-4">{children}</h1>,
                  h2: ({children}) => <h2 className="text-xl font-bold mt-8 mb-4 text-[#7C69F5] uppercase tracking-wider">{children}</h2>,
                  p: ({children}) => <div className="mb-4 leading-relaxed text-[#E2E8F0]">{children}</div>,
                  blockquote: ({children}) => (
                    <div className="my-6 p-4 rounded-lg bg-[#7C69F5]/5 border-l-4 border-[#7C69F5] italic flex gap-3">
                      <Quote size={20} className="text-[#7C69F5] shrink-0" />
                      <div className="text-[#A7DADB]">{children}</div>
                    </div>
                  ),
                  strong: ({children}) => <span className="font-bold text-[#A7DADB]">{children}</span>,
                  ul: ({children}) => <ul className="list-disc pl-5 space-y-2 mb-4 text-[#94A3B8]">{children}</ul>,
                  li: ({children}) => <li className="pl-2">{children}</li>,
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>
        </div>

        {/* Audit Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          <div className="p-5 rounded-2xl border border-[rgba(124, 105, 245, 0.1)] bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-4 text-[#A7DADB]">
              <BookOpen size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Semantic Delta</span>
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed italic">
              {semanticDelta || "Analyzing instructional alignment..."}
            </p>
          </div>

          <div className="flex-1 p-5 rounded-2xl border border-[rgba(124, 105, 245, 0.1)] bg-white/[0.02] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-4 text-[#7C69F5]">
              <BookOpen size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Grounding Citations</span>
            </div>
            <div className="space-y-3">
              {citations.length > 0 ? citations.map((cite, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-3 group hover:border-[#7C69F5]/30 transition-colors">
                  <div className="h-6 w-6 rounded bg-[#7C69F5]/20 flex items-center justify-center text-[10px] font-bold text-[#7C69F5]">
                    {i + 1}
                  </div>
                  <span className="text-xs text-[#E2E8F0] truncate font-medium group-hover:text-white transition-colors">{cite}</span>
                </div>
              )) : (
                <p className="text-xs text-[#94A3B8] italic">No active citations detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptDraftingWorkspace;
