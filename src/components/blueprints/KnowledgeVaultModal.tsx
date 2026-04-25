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
  Loader2,
  CheckCircle2,
  Play,
  AlertCircle
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

        updateStatus('processing', 30);

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
          <div className="flex justify-between items-center mb-10 shrink-0 px-4">
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
               sx={{ color: '#A7DADB', bgcolor: 'rgba(167, 218, 219, 0.05)', p: 2, borderRadius: '20px', '&:hover': { bgcolor: 'rgba(167, 218, 219, 0.1)' } }}
             >
               <X size={24} />
             </IconButton>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-12">
            {/* Batch Upload Zone */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="relative group">
                   <input 
                     type="file" 
                     multiple 
                     disabled={isBatchProcessing}
                     onChange={handleFileSelection} 
                     className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                     accept=".pdf,.docx,.txt" 
                   />
                   <div className="p-10 rounded-[3rem] border-2 border-dashed border-[#A7DADB]/20 bg-white/[0.01] group-hover:bg-[#A7DADB]/5 group-hover:border-[#A7DADB]/40 transition-all flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#A7DADB]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                         <UploadCloud size={28} className="text-[#A7DADB]" />
                      </div>
                      <h3 className="text-white font-bold text-base mb-1">Stage Documents</h3>
                      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium">Select multiple PDF or DOCX assets</p>
                   </div>
                </div>

                {/* Staging Queue */}
                <AnimatePresence>
                  {fileQueue.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                       <div className="flex items-center justify-between px-4">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Staging Area ({fileQueue.length})</span>
                          <button 
                            onClick={processBatch}
                            disabled={isBatchProcessing}
                            className="flex items-center gap-2 text-[10px] font-black text-[#4F46E5] uppercase tracking-widest hover:text-white transition-colors"
                          >
                            {isBatchProcessing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                            {isBatchProcessing ? 'Processing Batch...' : 'Ingest All Staged'}
                          </button>
                       </div>
                       <div className="space-y-2">
                         {fileQueue.map((item, idx) => (
                           <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group">
                              <div className="flex items-center gap-4 flex-1">
                                 <FileCode size={16} className={item.status === 'completed' ? 'text-emerald-500' : 'text-slate-500'} />
                                 <div className="flex flex-col flex-1">
                                    <span className="text-xs font-bold text-white truncate max-w-[200px]">{item.file.name}</span>
                                    <div className="w-full h-0.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                                       <motion.div animate={{ width: `${item.progress}%` }} className={`h-full ${item.status === 'failed' ? 'bg-rose-500' : 'bg-[#A7DADB]'}`} />
                                    </div>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                 {item.status === 'completed' ? <CheckCircle2 size={16} className="text-emerald-500" /> : 
                                  item.status === 'failed' ? <AlertCircle size={16} className="text-rose-500" /> :
                                  !isBatchProcessing && (
                                   <IconButton onClick={() => removeFromQueue(idx)} sx={{ color: 'slate.600', '&:hover': { color: 'rose.500' } }}>
                                      <X size={14} />
                                   </IconButton>
                                 )}
                              </div>
                           </div>
                         ))}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Vault Inventory */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 px-4">
                   <FileUp size={14} className="text-[#A7DADB]" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#A7DADB]/60">Vaulted Assets</span>
                </div>
                <div className="space-y-3">
                  {vaultedFiles.map((file, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group/file hover:border-[#A7DADB]/20 transition-all">
                       <div className="flex flex-col overflow-hidden">
                          <span className="text-[11px] font-bold text-slate-300 truncate">{file.metadata.source_name}</span>
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mt-0.5">{file.content_type}</span>
                       </div>
                       <IconButton onClick={() => handleDelete(file.metadata.source_name)} size="small" sx={{ opacity: 0, '.group/file:hover &': { opacity: 1 }, color: 'rose.500', '&:hover': { bgcolor: 'rose-500/10' } }}>
                         <Trash2 size={12} />
                       </IconButton>
                    </div>
                  ))}
                  {vaultedFiles.length === 0 && (
                    <div className="py-10 text-center border border-white/5 rounded-[2rem] bg-white/[0.01]">
                       <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Vault Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Box>
      </Fade>
    </Modal>
  );
};
