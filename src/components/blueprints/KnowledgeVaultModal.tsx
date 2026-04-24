/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Video, 
  Image as ImageIcon, 
  UploadCloud, 
  X, 
  FileCode,
  Trash2,
  Cloud
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VaultFile {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'uploading' | 'complete';
  isExisting?: boolean;
  file?: File;
}

export const KnowledgeVaultModal = ({ 
  isOpen, 
  onClose, 
  blueprintId,
  blueprintContext
}: { 
  isOpen: boolean; 
  onClose: () => void;
  blueprintId: string;
  blueprintContext?: Record<string, unknown> | null;
}) => {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchExistingFiles = useCallback(async () => {
    if (!blueprintId) return;
    
    const { data, error } = await supabase
      .from('knowledge_vault')
      .select('metadata, content_type')
      .eq('blueprint_id', blueprintId);

    if (error) {
      console.error('Error fetching vault files:', error);
      return;
    }

    const uniqueFiles = new Map<string, VaultFile>();
    data?.forEach((row: { metadata: Record<string, unknown> | null, content_type: string }) => {
      const metadata = row.metadata as any;
      const name = (metadata?.source_name || 'Unknown File').replace(/_/g, ' ');
      if (!uniqueFiles.has(name)) {
        uniqueFiles.set(name, {
          id: name,
          name: name,
          type: row.content_type,
          status: 'complete',
          isExisting: true
        });
      }
    });

    setFiles(Array.from(uniqueFiles.values()));
  }, [blueprintId]);

  useEffect(() => {
    if (isOpen) {
      fetchExistingFiles();
    }
  }, [isOpen, fetchExistingFiles]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: VaultFile[] = droppedFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      name: f.name.replace(/_/g, ' '),
      file: f,
      type: f.type,
      status: 'pending'
    }));
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = newFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleIngest = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' && f.file);
    if (pendingFiles.length === 0) return;
    
    setIsSynthesizing(true);
    setProgress(10);
    
    try {
      for (const fileItem of pendingFiles) {
        const file = fileItem.file!;
        const base64 = await fileToBase64(file);
        
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        let contentType = 'text';
        if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
          contentType = 'pdf';
        } else if (fileType.includes('officedocument.wordprocessingml.document') || fileName.endsWith('.docx')) {
          contentType = 'docx';
        } else if (fileType.includes('video') || fileName.endsWith('.mp4') || fileName.endsWith('.mov')) {
          contentType = 'video';
        } else if (fileType.includes('image') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
          contentType = 'image';
        }

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

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ingestion failed');
        }
        
        setProgress(p => Math.min(p + (100 / pendingFiles.length), 100));
      }
      await fetchExistingFiles();
    } catch (error: unknown) {
      console.error('Ingestion Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to ingest knowledge: ${errorMessage}`);
    } finally {
      setIsSynthesizing(false);
      setProgress(0);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to remove ${fileName} from the Knowledge Vault?`)) return;
    
    try {
      const response = await fetch(`/api/ingest/delete?blueprintId=${blueprintId}&fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Delete failed');
      setFiles(prev => prev.filter(f => f.name !== fileName));
    } catch (error: unknown) {
      alert(`Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf') || type.includes('word') || type.includes('text') || type === 'pdf' || type === 'docx' || type === 'text') return <FileText size={18} className="text-[#A7DADB]" />;
    if (type.includes('video') || type === 'video') return <Video size={18} className="text-[#A7DADB]/60" />;
    if (type.includes('image') || type === 'image') return <ImageIcon size={18} className="text-[#A7DADB]/40" />;
    return <FileCode size={18} className="text-[#A7DADB]/20" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-[#020617]/90 backdrop-blur-2xl" />

      <motion.div
        initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-[#A7DADB]/10 bg-[#020617] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.03] p-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tighter text-white">Knowledge Vault</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A7DADB]/60 mt-1">Institutional Fact Repository</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 bg-white/[0.03] text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {!isSynthesizing ? (
            <div className="space-y-8">
              <label 
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#A7DADB]/20 bg-white/[0.01] p-12 transition-all hover:border-[#A7DADB]/40 hover:bg-[#A7DADB]/5"
              >
                <input type="file" className="hidden" ref={fileInputRef} multiple onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    setFiles(prev => {
                       const existingNames = new Set(prev.map(f => f.name));
                       const filtered: VaultFile[] = selected.filter(f => !existingNames.has(f.name)).map(f => ({
                        id: Math.random().toString(36).substr(2, 9),
                        name: f.name.replace(/_/g, ' '),
                        file: f,
                        type: f.type,
                        status: 'pending'
                      }));
                      return [...prev, ...filtered];
                    });
                }} />
                <UploadCloud className="mb-6 text-[#A7DADB]/40 group-hover:text-[#A7DADB] transition-all" size={48} />
                <p className="text-center text-slate-200 font-bold uppercase tracking-widest text-[11px]">
                  Deposit Instructional Assets
                </p>
                <p className="mt-2 text-[10px] text-slate-600 font-black uppercase tracking-tighter">PDF, DOCX, Video, or Images</p>
              </label>

              <div className="max-h-[300px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {files.map((fileItem) => (
                  <div key={fileItem.id} className="group flex items-center justify-between rounded-2xl border border-white/[0.03] bg-white/[0.01] p-4 hover:border-[#A7DADB]/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">{getFileIcon(fileItem.type)}</div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white truncate max-w-[300px]">{fileItem.name}</span>
                        {fileItem.isExisting && <span className="text-[9px] text-[#A7DADB] font-black uppercase tracking-widest mt-0.5">Verified Asset</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => fileItem.isExisting ? handleDelete(fileItem.name) : setFiles(prev => prev.filter(f => f.id !== fileItem.id))} 
                      className="text-slate-600 hover:text-rose-500 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-white/[0.03] rounded-3xl">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Repository Empty</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  disabled={files.filter(f => f.status === 'pending').length === 0}
                  onClick={handleIngest}
                  className="px-10 py-3 bg-[#4F46E5] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-[#4F46E5]/90 transition-all disabled:opacity-50"
                >
                  Start Ingestion
                </button>
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
                <p className="mb-10 text-[10px] font-black uppercase tracking-[0.4em] text-[#A7DADB]/40 text-center leading-relaxed">
                  Mapping institutional knowledge<br/>into neural constellations
                </p>
                <div className="w-full">
                  <div className="h-1 w-full rounded-full bg-white/[0.03] overflow-hidden border border-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[#4F46E5] to-[#A7DADB]" />
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
      </motion.div>
    </div>
  );
};
