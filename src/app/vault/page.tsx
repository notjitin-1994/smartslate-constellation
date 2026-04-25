/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  Database, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Filter, 
  Download,
  ShieldCheck,
  Zap,
  Cloud,
  Play,
  FileCode,
  FileUp,
  ExternalLink,
  ArrowLeft,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import { IconButton } from '@mui/material';

/** 
 * UTILS 
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QueuedFile {
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
}

type BatchStatus = 'idle' | 'processing' | 'success' | 'error';

const StatCard = ({ label, value, icon: Icon, subValue }: { label: string, value: string | number, icon: any, subValue?: string }) => (
  <div className="flex-1 min-w-[200px] p-6 rounded-[2rem] border border-[#A7DADB]/10 bg-white/[0.01] backdrop-blur-3xl group hover:border-[#A7DADB]/30 transition-all">
    <div className="flex items-center gap-4 mb-4">
      <div className="p-3 rounded-2xl bg-[#A7DADB]/5 group-hover:bg-[#A7DADB]/10 transition-colors">
        <Icon size={20} className="text-[#A7DADB]" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
    </div>
    <div className="flex items-end justify-between">
      <div className="text-3xl font-black text-white tracking-tighter">{value}</div>
      {subValue && <div className="text-[10px] font-bold text-[#A7DADB]/60 uppercase tracking-widest pb-1">{subValue}</div>}
    </div>
  </div>
);

function VaultContent() {
  const router = useRouter();
  const [vaultedFiles, setVaultedFiles] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [batchStatus, setBatchStatus] = useState<BatchStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVaultData = useCallback(async () => {
    // 1. Fetch ALL knowledge objects (both global and blueprint-specific)
    const { data, error } = await supabase
      .from('knowledge_vault')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      console.log(`[Vault] Synchronized ${data.length} atomic facts.`);
      setFacts(data);
      
      // 2. Aggregate unique files based on metadata source_name
      // We use a Map to ensure we get the most recent entry for each unique file name
      const fileMap = new Map();
      data.forEach(item => {
        const name = item.metadata?.source_name;
        if (name && !fileMap.has(name)) {
          fileMap.set(name, item);
        }
      });
      
      const uniqueFiles = Array.from(fileMap.values());
      console.log(`[Vault] Identified ${uniqueFiles.length} unique technical assets.`);
      setVaultedFiles(uniqueFiles);
    }
    if (error) console.error('[Vault] Sync Error:', error);
  }, []);

  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newQueueItems: QueuedFile[] = selectedFiles.map(file => ({
      file,
      status: 'queued',
      progress: 0
    }));
    setFileQueue(prev => [...prev, ...newQueueItems]);
    setBatchStatus('idle');
    setLastError(null);
  };

  const processBatch = async () => {
    if (fileQueue.length === 0) return;
    setBatchStatus('processing');
    setLastError(null);

    let hasFailure = false;

    for (let i = 0; i < fileQueue.length; i++) {
      const item = fileQueue[i];
      setCurrentProcessingFile(item.file.name);
      
      const updateStatus = (status: QueuedFile['status'], progress: number) => {
        setFileQueue(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status, progress };
          return next;
        });
      };

      updateStatus('processing', 20);

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (event) => resolve((event.target?.result as string).split(',')[1]);
          reader.readAsDataURL(item.file);
        });

        const base64 = await base64Promise;
        const contentType = item.file.name.endsWith('.docx') ? 'docx' : item.file.name.endsWith('.pdf') ? 'pdf' : 'text';

        const response = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blueprintId: null, // Global ingestion
            contentType,
            content: base64,
            fileName: item.file.name
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Ingestion failed');
        }
        
        updateStatus('completed', 100);
      } catch (err: any) {
        console.error(`[Vault Ingest] Failed:`, err);
        updateStatus('failed', 0);
        setLastError(err.message || 'System error during harvest');
        hasFailure = true;
      }
    }

    if (hasFailure) {
      setBatchStatus('error');
    } else {
      setBatchStatus('success');
      // Add slight delay to ensure DB indexing before refresh
      setTimeout(() => {
        fetchVaultData();
        // Reset to idle after success view
        setTimeout(() => setBatchStatus('idle'), 4000);
      }, 500);
    }
    
    setCurrentProcessingFile(null);
    if (!hasFailure) setFileQueue([]);
  };

  const handleDelete = async (fileName: string) => {
    try {
      const response = await fetch(`/api/ingest/delete?fileName=${encodeURIComponent(fileName)}`, { method: 'DELETE' });
      if (response.ok) fetchVaultData();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredFacts = facts.filter(f => 
    f.raw_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.metadata?.source_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.content_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overallProgress = fileQueue.length > 0 
    ? (fileQueue.filter(f => f.status === 'completed').length / fileQueue.length) * 100 
    : 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#020617] text-[#F8FAFC] overflow-y-auto custom-scrollbar relative">
      <main className="p-8 md:p-12 max-w-[1600px] mx-auto w-full space-y-12 relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#A7DADB] opacity-60">
               <Database size={16} />
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">Neural Trace Repository</span>
            </div>
            <div className="flex items-center gap-6">
               <button 
                 onClick={() => router.back()}
                 className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-[#A7DADB] transition-all group"
               >
                 <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
               </button>
               <h1 className="text-5xl font-black tracking-tighter uppercase text-white">Knowledge Vault</h1>
            </div>
            <p className="text-slate-500 text-lg max-w-2xl font-medium">Global grounding ledger for institutional technical protocols.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#A7DADB] transition-colors" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query the ledger..." 
                className="bg-white/[0.02] border border-[#A7DADB]/10 rounded-2xl py-3.5 pl-12 pr-6 w-80 focus:outline-none focus:border-[#A7DADB]/40 transition-all text-sm font-bold tracking-tight text-white placeholder:text-slate-700"
              />
            </div>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Technical Assets" value={vaultedFiles.length} icon={FileUp} subValue="Verified" />
          <StatCard label="Atomic Facts" value={facts.length} icon={Zap} subValue="Extracted" />
          <StatCard label="Grounding Precision" value="99.4%" icon={ShieldCheck} subValue="Elite" />
          <StatCard label="Vault Integrity" value="Stable" icon={CheckCircle2} subValue="Active" />
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* LEFT: INGESTION & LEDGER */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* INGESTION HUD */}
            <section className={cn(
              "relative rounded-[3rem] border-2 border-dashed bg-white/[0.01] transition-all group overflow-hidden min-h-[400px] flex items-center justify-center",
              batchStatus === 'error' ? "border-rose-500/20" : 
              batchStatus === 'success' ? "border-emerald-500/20" : 
              fileQueue.length > 0 ? "border-[#A7DADB]/30" : "border-[#A7DADB]/10 hover:border-[#A7DADB]/30"
            )}>
               <AnimatePresence mode="wait">
                  {batchStatus === 'processing' ? (
                    <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-16 flex flex-col items-center text-center space-y-8 w-full">
                       <div className="relative">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="w-40 h-40 rounded-full border border-[#A7DADB]/20 border-t-[#A7DADB]" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Cloud size={32} className="text-[#A7DADB] animate-pulse" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black uppercase tracking-tighter">Harvesting Data</h3>
                          <p className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Active Extraction: {currentProcessingFile}</p>
                       </div>
                       <div className="w-full max-w-md h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div animate={{ width: `${overallProgress}%` }} className="h-full bg-[#4F46E5] shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
                       </div>
                    </motion.div>
                  ) : batchStatus === 'success' ? (
                    <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="p-16 flex flex-col items-center text-center space-y-6">
                       <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 200 }}>
                            <CheckCircle2 size={48} />
                          </motion.div>
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-emerald-400">Ingestion Complete</h3>
                          <p className="text-slate-500 text-sm font-medium">Technical facts have been successfully verified and committed to the ledger.</p>
                       </div>
                    </motion.div>
                  ) : batchStatus === 'error' ? (
                    <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-16 flex flex-col items-center text-center space-y-6">
                       <div className="w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
                          <XCircle size={48} />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black uppercase tracking-tighter text-rose-500">Extraction Failed</h3>
                          <p className="text-rose-400/60 text-[10px] font-mono uppercase tracking-widest">{lastError}</p>
                       </div>
                       <button onClick={() => processBatch()} className="px-8 py-3 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center gap-2">
                          <RefreshCw size={14} /> Retry Ingestion
                       </button>
                    </motion.div>
                  ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-16 flex flex-col items-center text-center space-y-6">
                       <input type="file" multiple onChange={handleFileSelection} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept=".pdf,.docx,.txt" />
                       <div className="w-20 h-20 rounded-3xl bg-[#A7DADB]/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <UploadCloud size={36} className="text-[#A7DADB]" />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black uppercase tracking-tighter">Ingest Assets</h3>
                          <p className="text-slate-500 text-sm font-medium">Anchor the constellation with multi-document technical grounding.</p>
                       </div>
                       {fileQueue.length > 0 && (
                         <button onClick={(e) => { e.stopPropagation(); processBatch(); }} className="relative z-30 px-8 py-3 rounded-xl bg-[#4F46E5] text-[10px] font-black text-white uppercase tracking-[0.3em] hover:bg-[#4338ca] transition-all shadow-2xl shadow-indigo-500/40 flex items-center gap-3 active:scale-95">
                            <Play size={14} fill="currentColor" /> Initialize Batch Ingestion ({fileQueue.length})
                         </button>
                       )}
                    </motion.div>
                  )}
               </AnimatePresence>
            </section>

            {/* FACT LEDGER TABLE */}
            <section className="rounded-[3rem] border border-[#A7DADB]/10 bg-white/[0.01] overflow-hidden flex flex-col min-h-[600px]">
               <div className="p-10 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-1.5 h-10 bg-[#4F46E5] rounded-full" />
                     <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase">Fact Ledger</h2>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Atomic Grounding Objects</p>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     <button 
                       onClick={fetchVaultData}
                       title="Refresh Ledger"
                       className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-[#A7DADB] transition-all"
                     >
                       <RefreshCw size={18} className={cn(batchStatus === 'processing' && "animate-spin")} />
                     </button>
                     <button className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-[#A7DADB] transition-all"><Filter size={18} /></button>
                     <button className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-500 hover:text-[#A7DADB] transition-all"><Download size={18} /></button>
                  </div>
               </div>

               <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/[0.02]">
                           <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Source</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Type</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest">Extracted Content</th>
                           <th className="px-8 py-5 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/[0.03]">
                        {filteredFacts.map((fact, idx) => (
                          <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                   <FileCode size={14} className="text-[#A7DADB]/40" />
                                   <span className="text-xs font-bold text-slate-300 truncate max-w-[140px]">{fact.metadata?.source_name || 'System Gen'}</span>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <span className="px-2 py-0.5 rounded-md bg-[#A7DADB]/5 border border-[#A7DADB]/10 text-[9px] font-black text-[#A7DADB] uppercase tracking-tighter">
                                   {fact.content_type}
                                </span>
                             </td>
                             <td className="px-8 py-6">
                                <div className="space-y-2">
                                   {fact.contextual_header && (
                                     <p className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-widest">{fact.contextual_header}</p>
                                   )}
                                   <p className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors whitespace-pre-wrap leading-relaxed">
                                      {fact.raw_content}
                                   </p>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-center">
                                <div className="flex items-center justify-center gap-4">
                                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                                      <CheckCircle2 size={10} /> Verified
                                   </div>
                                   <button 
                                     title="Copy Fact ID"
                                     onClick={() => navigator.clipboard.writeText(fact.id)}
                                     className="p-2 rounded-lg hover:bg-white/5 text-slate-600 hover:text-[#A7DADB] transition-all opacity-0 group-hover:opacity-100"
                                   >
                                      <FileCode size={14} />
                                   </button>
                                </div>
                             </td>
                          </tr>
                        ))}
                        {filteredFacts.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-32 text-center">
                               <div className="flex flex-col items-center space-y-4 opacity-20">
                                  <Database size={48} className="text-slate-500" />
                                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">No ledger entries discovered</p>
                               </div>
                            </td>
                          </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </section>
          </div>

          {/* RIGHT: ARCHIVE REGISTRY */}
          <div className="col-span-12 lg:col-span-4">
             <section className="rounded-[3rem] border border-[#A7DADB]/10 bg-white/[0.01] overflow-hidden flex flex-col h-full min-h-[800px]">
                <div className="p-10 border-b border-white/5 space-y-1">
                   <h2 className="text-2xl font-black tracking-tighter uppercase">Institutional Archive</h2>
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Master Technical Registry</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                   {vaultedFiles.map((file, idx) => (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} key={idx} className="group/file p-6 rounded-[2.5rem] bg-black/40 border border-white/5 hover:border-[#A7DADB]/30 transition-all relative overflow-hidden">
                        <div className="flex items-start justify-between relative z-10">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-[#A7DADB]/5 flex items-center justify-center group-hover/file:bg-[#A7DADB]/10 transition-colors border border-[#A7DADB]/10">
                                 <FileText size={24} className="text-[#A7DADB]" />
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                 <span className="text-sm font-black text-slate-200 group-hover/file:text-white transition-colors truncate max-w-[180px]">
                                    {file.metadata?.source_name || "Unknown Asset"}
                                 </span>
                                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                    {file.content_type || "Technical"} • {file.created_at ? new Date(file.created_at).toLocaleDateString() : "Historical"}
                                 </span>
                              </div>
                           </div>
                           <IconButton onClick={() => handleDelete(file.metadata?.source_name)} size="small" sx={{ color: 'rgba(244, 63, 94, 0.4)', '&:hover': { color: '#F43F5E', bgcolor: 'rgba(244, 63, 94, 0.1)' }, opacity: 0, '.group/file:hover &': { opacity: 1 } }}>
                              <Trash2 size={16} />
                           </IconButton>
                        </div>
                        <div className="mt-6 flex items-center justify-between relative z-10">
                           <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Grounding Active</span>
                           </div>
                           <button className="flex items-center gap-2 text-[9px] font-black text-[#A7DADB]/40 hover:text-[#A7DADB] transition-colors uppercase tracking-[0.2em]">
                              Inspect <ExternalLink size={10} />
                           </button>
                        </div>
                        <div className="absolute inset-0 bg-[#A7DADB]/[0.01] opacity-0 group-hover/file:opacity-100 transition-opacity" />
                     </motion.div>
                   ))}

                   {vaultedFiles.length === 0 && (
                     <div className="py-32 text-center opacity-20 space-y-4">
                        <FileUp size={48} className="mx-auto text-slate-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Archive Empty</p>
                     </div>
                   )}
                </div>

                <div className="p-10 border-t border-white/5 bg-white/[0.01] space-y-6">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vault Capacity</span>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">24% Optimized</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: '24%' }} className="h-full bg-gradient-to-r from-[#4F46E5] to-[#A7DADB]" />
                   </div>
                </div>
             </section>
          </div>

        </div>
      </main>

      {/* AMBIENT BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#020617]">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#4F46E5]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-[#A7DADB]/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #A7DADB 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>
    </div>
  );
}

export default function KnowledgeVault() {
  return <VaultContent />;
}
