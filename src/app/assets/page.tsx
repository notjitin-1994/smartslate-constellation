// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Cpu, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  ArrowRight
} from 'lucide-react';

// --- Design System Constants ---
const COLORS = {
  background: '#020C1B',
  primary: '#7C69F5',
  secondary: '#A7DADB',
  textPrimary: '#E2E8F0',
  textSecondary: '#94A3B8',
  glassBg: 'rgba(124, 105, 245, 0.04)',
  glassBorder: 'rgba(124, 105, 245, 0.15)',
};

const glassStyles = {
  background: COLORS.glassBg,
  backdropFilter: 'blur(12px)',
  border: `1px solid ${COLORS.glassBorder}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
};

// --- Components ---

const ConstellationNode = ({ status }: { status: 'idle' | 'processing' | 'complete' }) => {
  return (
    <div className="relative flex items-center justify-center w-6 h-6">
      {status === 'processing' && (
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-full h-full rounded-full"
          style={{ backgroundColor: COLORS.primary, filter: 'blur(4px)' }}
        />
      )}
      <div
        className={`relative z-10 w-2 h-2 rounded-full transition-colors duration-500 ${
          status === 'complete' ? 'bg-[#A7DADB]' : 'bg-[#7C69F5]'
        }`}
        style={{ boxShadow: `0 0 10px ${status === 'complete' ? COLORS.secondary : COLORS.primary}` }}
      />
      <div className="absolute inset-0 border border-white/5 rounded-full scale-150 opacity-20" />
    </div>
  );
};

const AnalysisTrackerItem = ({ label, status }: { label: string, status: 'pending' | 'active' | 'done' }) => (
  <div className="flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors group">
    <ConstellationNode status={status === 'active' ? 'processing' : status === 'done' ? 'complete' : 'idle'} />
    <div className="flex-1">
      <p className={`text-[11px] font-medium tracking-tight ${status === 'done' ? 'text-[#A7DADB]' : 'text-[#E2E8F0]'}`}>
        {label}
      </p>
      {status === 'active' && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          className="h-[1px] bg-gradient-to-r from-[#7C69F5] to-transparent mt-1"
        />
      )}
    </div>
    {status === 'active' && <Loader2 size={12} className="animate-spin text-[#7C69F5]" />}
    {status === 'done' && <CheckCircle2 size={12} className="text-[#A7DADB]" />}
  </div>
);

export default function AssetIngestionDashboard() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="min-h-screen text-slate-200 font-sans selection:bg-[#7C69F5]/30" style={{ backgroundColor: COLORS.background }}>      

      <main className="p-6 md:p-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-[#7C69F5]/10 border border-[#7C69F5]/20 text-[#7C69F5] uppercase">
              V.4-ALPHA
            </span>
            <div className="h-[1px] w-8 bg-[#7C69F5]/30" />
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-2">
            Asset Ingestion <span className="text-[#7C69F5]">Pipeline</span>
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-2xl">
            Initialize the Polaris data architecture by ingesting unstructured organizational assets.
            AI-driven context mapping activates upon upload.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Upload & Mapping */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. File Upload Area */}
            <motion.div
              onDragOver={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              className="relative rounded-2xl overflow-hidden group"
              style={glassStyles}
            >
              <div
                className={`p-12 border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center text-center ${
                  isDragging ? 'border-[#7C69F5] bg-[#7C69F5]/10' : 'border-[#7C69F5]/10 group-hover:border-[#7C69F5]/30'
                }`}
              >
                <div className="relative mb-6">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="relative z-10 w-16 h-16 rounded-2xl bg-[#7C69F5]/10 border border-[#7C69F5]/20 flex items-center justify-center"
                  >
                    <Upload className="text-[#7C69F5]" size={28} />
                  </motion.div>
                  <div className="absolute inset-0 bg-[#7C69F5] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                </div>

                <h3 className="text-lg font-medium text-white mb-1">Drop Technical Assets</h3>
                <p className="text-xs text-[#94A3B8] mb-8">
                  Support for PDF, DOCX, and raw datasets. Max 500MB per batch.
                </p>

                <button className="relative group/btn px-6 py-2.5 rounded-full overflow-hidden transition-all active:scale-95">
                  <div className="absolute inset-0 bg-[#7C69F5]" />
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full" />
                  <span className="relative z-10 text-white text-[13px] font-bold tracking-wide flex items-center gap-2">
                    SELECT BLUEPRINT <ArrowRight size={14} />
                  </span>
                </button>
              </div>
            </motion.div>

            {/* 2. AI Mapping Status List */}
            <div className="rounded-2xl p-6" style={glassStyles}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#A7DADB]/10 text-[#A7DADB]">
                    <Cpu size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Live AI Analysis</h4>
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Active Stream Processing</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-[#7C69F5]">[PROGRESS: 42%]</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg border border-white/5 mb-3">
                  <FileText size={14} className="text-[#94A3B8]" />
                  <span className="text-[11px] font-mono text-[#94A3B8]">[Processing: technical_spec_v4.pdf]</span>
                </div>

                <AnalysisTrackerItem label="Analyzing Domain Context" status="done" />
                <AnalysisTrackerItem label="Extracting Technical Specs" status="active" />
                <AnalysisTrackerItem label="Mapping to Polaris Objective 01" status="pending" />
                <AnalysisTrackerItem label="Structural Integrity Validation" status="pending" />
              </div>
            </div>
          </div>

          {/* Right Column: Summaries & Actions */}
          <div className="lg:col-span-4 space-y-6">

            {/* 3. Content Breakdown Summary */}
            <div className="rounded-2xl p-6 relative overflow-hidden" style={glassStyles}>
              {/* Radial background deco */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7C69F5] blur-[60px] opacity-20" />

              <h4 className="text-[11px] font-bold text-[#7C69F5] uppercase tracking-[0.2em] mb-4">
                Knowledge Extraction
              </h4>

              <div className="space-y-5">
                {[
                  { label: "[Domain Coverage]", value: "84%", sub: "High Confidence" },
                  { label: "[Entity Relationships]", value: "1,242", sub: "Discovered" },
                  { label: "[Policy Conflicts]", value: "03", sub: "Flagged for Review" }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-mono text-[#94A3B8] uppercase">{item.label}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white block leading-none">{item.value}</span>
                        <span className="text-[8px] text-[#A7DADB] uppercase">{item.sub}</span>
                      </div>
                    </div>
                    <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: item.value === "84%" ? "84%" : "40%" }}
                        className="h-full bg-gradient-to-r from-[#7C69F5] to-[#A7DADB]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-[#7C69F5]" />
                  <span className="text-xs font-medium text-white">AI Learning Log</span>
                </div>
                <div className="bg-[#020C1B]/50 rounded-lg p-3 border border-white/5 font-mono text-[9px] text-[#94A3B8] leading-relaxed">
                  {`> Identified core dependency on [System Name]\n> Mapping structural metadata to Layer 02\n> Extracting 14 distinct technical protocols...`}
                </div>
              </div>
            </div>

            {/* 4. Strategic Action / Handover Trigger */}
            <div className="p-1 rounded-2xl bg-gradient-to-br from-[#7C69F5]/30 to-transparent">
              <div className="rounded-[14px] p-6 bg-[#020C1B]" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(124, 105, 245, 0.1), transparent)' }}>
                <h4 className="text-sm font-semibold text-white mb-2">Finalize Architecture</h4>
                <p className="text-[11px] text-[#94A3B8] mb-6 leading-relaxed">
                  Once ingestion reaches 100%, initialize the cognitive handover to the architectural canvas.
                </p>

                <button className="w-full relative py-3 group flex items-center justify-center gap-2 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-[#7C69F5] opacity-10 group-hover:opacity-20 transition-opacity" />
                  <div className="absolute inset-0 border border-[#7C69F5]/30 group-hover:border-[#7C69F5]/60 transition-colors rounded-xl" />

                  {/* Atmospheric ring decoration */}
                  <div className="absolute w-24 h-24 bg-[#7C69F5] blur-[40px] opacity-0 group-hover:opacity-30 transition-opacity -top-12 -left-12" />

                  <span className="relative z-10 text-[11px] font-bold text-[#7C69F5] uppercase tracking-widest">
                    Initialize Handover
                  </span>

                  {/* Scanning flare */}
                  <motion.div
                    initial={{ left: '-100%' }}
                    whileHover={{ left: '100%' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 z-20"  
                  />
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#7C69F5] blur-[150px] opacity-[0.07]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-[#A7DADB] blur-[150px] opacity-[0.03]" />
        {/* Fine grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, #7C69F5 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>
    </div>
  );
}
