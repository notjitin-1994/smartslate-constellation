/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  UploadCloud, 
  X, 
  FileCode,
  Trash2,
  Database,
  FileUp,
  Play,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IconButton, 
  Modal, 
  Backdrop, 
  Fade, 
  Box 
} from '@mui/material';
import { supabase } from '@/lib/supabase';

interface QueuedFile {
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
}

interface KnowledgeVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprintId: string;
  blueprintContext: any;
}

export const KnowledgeVaultModal: React.FC<KnowledgeVaultModalProps> = ({
  isOpen,
  onClose,
  blueprintId,
  blueprintContext
}) => {
  const [vaultedFiles, setVaultedFiles] = useState<any[]>([]);
  const [fileQueue, setFileQueue] = useState<QueuedFile[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    const { data } = await supabase
      .from('knowledge_vault')
      .select('metadata, content_type, created_at')
      .eq('blueprint_id', blueprintId);
    
    if (data) {
      const uniqueFiles = Array.from(new Set(data.map(d => d.metadata.source_name))).map(name => {
        return data.find(d => d.metadata.source_name === name);
      });
      setVaultedFiles(uniqueFiles);
    }
  }, [blueprintId]);

  useEffect(() => {
    if (isOpen) fetchFiles();
  }, [isOpen, fetchFiles]);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newQueueItems: QueuedFile[] = selectedFiles.map(file => ({
      file,
      status: 'queued',
      progress: 0
    }));
    setFileQueue(prev => [...prev, ...newQueueItems]);
  };

  const removeFromQueue = (index: number) => {
    setFileQueue(prev => prev.filter((_, i) => i !== index));
  };

  const processBatch = async () => {
    if (fileQueue.length === 0) return;
    setIsBatchProcessing(true);

    for (let i = 0; i < fileQueue.length; i++) {
      if (fileQueue[i].status === 'completed') continue;

      const item = fileQueue[i];
      setCurrentProcessingFile(item.file.name);
      
      const updateStatus = (status: QueuedFile['status'], progress: number) => {
        setFileQueue(prev => {
          const next = [...prev];
          next[i] = { ...next[i], status, progress };
          return next;
        });
      };

      updateStatus('processing', 10);

      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (event) => resolve((event.target?.result as string).split(',')[1]);
          reader.readAsDataURL(item.file);
        });

        const base64 = await base64Promise;
        const contentType = item.file.name.endsWith('.docx') ? 'docx' : item.file.name.endsWith('.pdf') ? 'pdf' : 'text';

        updateStatus('processing', 40);

        const response = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blueprintId,
            contentType,
            content: base64,
            fileName: item.file.name,
            blueprintContext
          }),
        });

        if (!response.ok) throw new Error('Ingestion failed');
        updateStatus('completed', 100);
      } catch (err) {
        console.error(`[Batch Ingest] Failed for ${item.file.name}:`, err);
        updateStatus('failed', 0);
      }
    }

    setIsBatchProcessing(false);
    setCurrentProcessingFile(null);
    fetchFiles();
  };

  const handleDelete = async (fileName: string) => {
    try {
      await fetch(`/api/ingest/delete?blueprintId=${blueprintId}&fileName=${fileName}`, { method: 'DELETE' });
      fetchFiles();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const overallProgress = fileQueue.length > 0 
    ? (fileQueue.filter(f => f.status === 'completed').length / fileQueue.length) * 100 
    : 0;

  return (
    <Modal
      open={isOpen}
      onClose={isBatchProcessing ? undefined : onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(30px)', bgcolor: 'rgba(2, 6, 23, 0.95)' } }}
    >
      <Fade in={isOpen}>
        <Box sx={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '95%', maxWidth: '1000px', maxHeight: '85vh',
          bgcolor: '#020617', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '60px',
          p: { xs: 4, md: 8 }, outline: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 120px rgba(0,0,0,0.9)'
        }}>
          {/* Header */}
          <div className="flex justify-between items-center mb-8 shrink-0 px-4">
             <div className="flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 shadow-lg">
                  <Database size={28} className="text-[#A7DADB]" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-1 font-heading">Knowledge Vault</h2>
                  <p className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Multi-Document Batch Synthesis</p>
                </div>
             </div>
             <IconButton 
               disabled={isBatchProcessing}
               onClick={onClose} 
               sx={{ color: '#A7DADB', bgcolor: 'rgba(167, 218, 219, 0.05)', p: 2, borderRadius: '24px', '&:hover': { bgcolor: 'rgba(167, 218, 219, 0.1)' } }}
             >
               <X size={24} />
             </IconButton>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {isBatchProcessing ? (
                /* --- BATCH LOADING HUD (STRICT VIEWPORT, NO SCROLL) --- */
                <motion.div 
                  key="loading" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                  className="absolute inset-0 flex items-center justify-center p-4 lg:p-10"
                >
                  <div className="w-full max-w-2xl bg-white/[0.01] border border-[#A7DADB]/10 rounded-[4rem] p-12 lg:p-20 relative overflow-hidden flex flex-col items-center text-center shadow-3xl">
                     <div className="absolute inset-0 bg-[#A7DADB]/5 pointer-events-none" />
                     
                     <div className="relative mb-12">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-48 h-48 lg:w-64 lg:h-64 rounded-full border-2 border-[#A7DADB]/10 border-t-[#A7DADB] shadow-[0_0_50px_rgba(167,218,219,0.15)]" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <Cloud size={48} className="text-[#A7DADB] animate-pulse mb-4" />
                           <span className="text-3xl font-black text-white font-mono">{Math.round(overallProgress)}%</span>
                        </div>
                     </div>

                     <div className="space-y-6 w-full relative z-10">
                        <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tighter uppercase">Architectural Synthesis</h3>
                        <div className="flex flex-col gap-2">
                           <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#A7DADB]/40">Active Neural Mapping</p>
                           <p className="text-sm font-bold text-white truncate max-w-full px-10 italic">{`"${currentProcessingFile}"`}</p>
                        </div>

                        <div className="w-full space-y-3 pt-6">
                           <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} className="h-full bg-gradient-to-r from-[#4F46E5] to-[#A7DADB] rounded-full shadow-[0_0_20px_rgba(167,218,219,0.4)]" />
                           </div>
                           <div className="flex justify-between items-center px-2">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Batch Protocol Alpha</span>
                              <span className="text-[9px] font-black text-[#A7DADB] uppercase tracking-[0.2em]">Fact Ledger Grounding</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
              ) : (
                /* --- NORMAL UPLOAD/VAULT UI --- */
                <motion.div 
                  key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full flex flex-col space-y-10 overflow-y-auto custom-scrollbar px-4"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="relative group">
                         <input type="file" multiple onChange={handleFileSelection} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept=".pdf,.docx,.txt" />
                         <div className="p-12 rounded-[3.5rem] border-2 border-dashed border-[#A7DADB]/20 bg-white/[0.01] group-hover:bg-[#A7DADB]/5 group-hover:border-[#A7DADB]/40 transition-all flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-3xl bg-[#A7DADB]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl">
                               <UploadCloud size={32} className="text-[#A7DADB]" />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">Stage Institutional Assets</h3>
                            <p className="text-slate-500 text-[11px] uppercase tracking-widest font-medium">Select multiple documents to anchor the truth ledger</p>
                         </div>
                      </div>

                      {fileQueue.length > 0 && (
                        <div className="space-y-4">
                           <div className="flex items-center justify-between px-6">
                              <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staging Queue</span>
                                 <div className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-mono text-white/40">{fileQueue.length}</div>
                              </div>
                              <button onClick={processBatch} className="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-[#4F46E5] text-[10px] font-black text-white uppercase tracking-widest hover:bg-[#4F46E5]/90 transition-all shadow-xl shadow-indigo-500/10">
                                <Play size={14} fill="currentColor" /> Ingest All Staged
                              </button>
                           </div>
                           <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar-thin pr-2">
                             {fileQueue.map((item, idx) => (
                               <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={idx} className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group">
                                  <div className="flex items-center gap-5 flex-1">
                                     <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-slate-500 group-hover:text-[#A7DADB] transition-colors"><FileCode size={18} /></div>
                                     <span className="text-sm font-bold text-white/80 truncate max-w-[300px]">{item.file.name}</span>
                                  </div>
                                  <IconButton onClick={() => removeFromQueue(idx)} sx={{ color: 'slate.600', '&:hover': { color: 'rose.500', bgcolor: 'rose-500/10' } }}><X size={16} /></IconButton>
                               </motion.div>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-3 px-4">
                         <FileUp size={16} className="text-[#A7DADB]" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#A7DADB]/60">Institutional Vault</span>
                      </div>
                      <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar-thin pr-2">
                        {vaultedFiles.map((file, i) => (
                          <div key={i} className="p-5 rounded-[2rem] bg-black/40 border border-white/5 flex items-center justify-between group/file hover:border-[#A7DADB]/20 transition-all">
                             <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-bold text-slate-300 truncate">{file.metadata.source_name}</span>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter mt-1">{file.content_type} • {new Date(file.created_at).toLocaleDateString()}</span>
                             </div>
                             <IconButton onClick={() => handleDelete(file.metadata.source_name)} size="small" sx={{ opacity: 0, '.group/file:hover &': { opacity: 1 }, color: '#F43F5E', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.1)' } }}>
                               <Trash2 size={14} />
                             </IconButton>
                          </div>
                        ))}
                        {vaultedFiles.length === 0 && (
                          <div className="py-20 text-center border border-white/5 border-dashed rounded-[3rem] bg-white/[0.01]">
                             <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">Vault Access Restricted</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Box>
      </Fade>
    </Modal>
  );
};
