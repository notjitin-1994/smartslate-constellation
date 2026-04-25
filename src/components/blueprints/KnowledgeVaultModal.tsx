/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  UploadCloud, 
  X, 
  FileCode,
  Trash2,
  Cloud,
  Database,
  FileUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  IconButton, 
  Modal, 
  Backdrop, 
  Fade, 
  Box 
} from '@mui/material';
import { supabase } from '@/lib/supabase';

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
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchFiles = useCallback(async () => {
    const { data } = await supabase
      .from('knowledge_vault')
      .select('metadata, content_type, created_at')
      .eq('blueprint_id', blueprintId);
    
    if (data) {
      const uniqueFiles = Array.from(new Set(data.map(d => d.metadata.source_name))).map(name => {
        return data.find(d => d.metadata.source_name === name);
      });
      setFiles(uniqueFiles);
    }
  }, [blueprintId]);

  useEffect(() => {
    if (isOpen) fetchFiles();
  }, [isOpen, fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !blueprintId) return;

    setIsUploading(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const contentType = file.name.endsWith('.docx') ? 'docx' : file.name.endsWith('.pdf') ? 'pdf' : 'text';

      try {
        setProgress(30);
        const response = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blueprintId,
            contentType,
            content: base64,
            fileName: file.name,
            blueprintContext
          }),
        });

        if (!response.ok) throw new Error('Ingestion failed');
        setProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          fetchFiles();
        }, 1000);
      } catch (err) {
        console.error('Ingestion Error:', err);
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
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
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500, sx: { backdropFilter: 'blur(30px)', bgcolor: 'rgba(2, 6, 23, 0.95)' } }}
    >
      <Fade in={isOpen}>
        <Box sx={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '95%', maxWidth: '900px', maxHeight: '85vh',
          bgcolor: '#020617', border: '1px solid rgba(167, 218, 219, 0.1)', borderRadius: '60px',
          p: { xs: 6, md: 10 }, outline: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          boxShadow: '0 0 120px rgba(0,0,0,0.9)'
        }}>
          <div className="flex justify-between items-center mb-12 shrink-0">
             <div className="flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-[#A7DADB]/10 border border-[#A7DADB]/20 shadow-lg">
                  <Database size={28} className="text-[#A7DADB]" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-1 font-heading">Knowledge Vault</h2>
                  <p className="text-[10px] font-black text-[#A7DADB]/40 uppercase tracking-[0.4em]">Master Institutional Ledger</p>
                </div>
             </div>
             <IconButton onClick={onClose} sx={{ color: '#A7DADB', bgcolor: 'rgba(167, 218, 219, 0.05)', p: 2, borderRadius: '20px', '&:hover': { bgcolor: 'rgba(167, 218, 219, 0.1)' } }}>
               <X size={24} />
             </IconButton>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
            {!isUploading ? (
              <div className="space-y-12">
                <div className="relative group">
                   <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" accept=".pdf,.docx,.txt" />
                   <div className="p-12 rounded-[3rem] border-2 border-dashed border-[#A7DADB]/20 bg-white/[0.01] group-hover:bg-[#A7DADB]/5 group-hover:border-[#A7DADB]/40 transition-all flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-[#A7DADB]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                         <UploadCloud size={32} className="text-[#A7DADB]" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">Ingest Institutional Knowledge</h3>
                      <p className="text-slate-500 text-xs uppercase tracking-widest font-medium">Drop PDF or DOCX to anchor the truth ledger</p>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 text-slate-500 mb-4 px-4">
                     <FileUp size={14} className="text-[#A7DADB]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.3em]">Currently Vaulted Assets</span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {files.map((file, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-[#A7DADB]/20 transition-all group"
                      >
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-[#A7DADB]">
                              <FileCode size={20} />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-white truncate max-w-[200px]">{file.metadata.source_name}</span>
                              <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">{new Date(file.created_at).toLocaleDateString()} • {file.content_type}</span>
                           </div>
                        </div>
                        <IconButton onClick={() => handleDelete(file.metadata.source_name)} sx={{ color: '#F43F5E', opacity: 0.2, '&:hover': { opacity: 1, bgcolor: 'rgba(244, 63, 94, 0.1)' } }} className="group-hover:opacity-100 transition-opacity">
                          <Trash2 size={18} />
                        </IconButton>
                      </motion.div>
                    ))}
                    {files.length === 0 && (
                      <div className="py-20 text-center">
                         <p className="text-xs text-slate-600 font-bold uppercase tracking-[0.3em]">No knowledge assets detected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-10">
                <div className="p-16 rounded-[4rem] bg-white/[0.01] border border-[#A7DADB]/10 relative overflow-hidden flex flex-col items-center w-full max-w-md shadow-2xl">
                  <div className="absolute inset-0 bg-[#A7DADB]/5 pointer-events-none" />
                  <div className="relative mb-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} className="w-32 h-32 rounded-full border-2 border-[#A7DADB]/10 border-t-[#A7DADB] shadow-[0_0_30px_rgba(167,218,219,0.1)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Cloud size={32} className="text-[#A7DADB] animate-pulse" />
                    </div>
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-white tracking-tighter uppercase">Architectural Synthesis</h3>
                  <p className="mb-10 text-[10px] font-black uppercase tracking-[0.4em] text-[#A7DADB]/40 text-center leading-relaxed">Mapping institutional knowledge<br/>into neural constellations</p>
                  <div className="w-full">
                    <div className="h-1.5 w-full rounded-full bg-white/[0.03] overflow-hidden border border-white/5 p-[1px]">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[#4F46E5] to-[#A7DADB] rounded-full" />
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                       <span className="text-[10px] font-mono font-bold text-[#A7DADB]">{Math.round(progress)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Box>
      </Fade>
    </Modal>
  );
};
