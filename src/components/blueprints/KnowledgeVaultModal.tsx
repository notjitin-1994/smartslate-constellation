// REQUIRED DEPENDENCY: framer-motion (npm install framer-motion), lucide-react (npm install lucide-react)

"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Video, 
  Image as ImageIcon, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  FileCode,
  Trash2
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
  blueprintId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  blueprintId: string;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadata = row.metadata as any;
      const name = metadata?.source_name || 'Unknown File';
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
      name: f.name,
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
        
        // Detect Content Type reliably
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
            fileName: file.name
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Delete failed: ${errorMessage}`);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf') || type.includes('word') || type.includes('text') || type === 'pdf' || type === 'docx' || type === 'text') return <FileText size={18} className="text-[#A7DADB]" />;
    if (type.includes('video') || type === 'video') return <Video size={18} className="text-[#7C69F5]" />;
    if (type.includes('image') || type === 'image') return <ImageIcon size={18} className="text-pink-400" />;
    return <FileCode size={18} className="text-[#94A3B8]" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#020C1B]/80 backdrop-blur-md" 
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[rgba(124, 105, 245, 0.2)] bg-[#020C1B] shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        style={{ background: 'radial-gradient(circle at top left, rgba(124, 105, 245, 0.08), transparent 40%), #020C1B' }}
      >
        <div className="flex items-center justify-between border-b border-[rgba(124, 105, 245, 0.1)] p-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#E2E8F0]">Knowledge Vault</h2>
            <p className="text-sm text-[#94A3B8]">Manage your multi-modal instructional assets</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-[#E2E8F0]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {!isSynthesizing ? (
            <div className="space-y-6">
              <label 
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(124, 105, 245, 0.2)] bg-white/[0.02] p-10 transition-all hover:border-[#7C69F5]/50 hover:bg-[#7C69F5]/5"
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    setFiles(prev => {
                       const existingNames = new Set(prev.map(f => f.name));
                       const filtered: VaultFile[] = selected.filter(f => !existingNames.has(f.name)).map(f => ({
                        id: Math.random().toString(36).substr(2, 9),
                        name: f.name,
                        file: f,
                        type: f.type,
                        status: 'pending'
                      }));
                      return [...prev, ...filtered];
                    });
                  }}
                />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #7C69F5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                <UploadCloud className="mb-4 text-[#7C69F5] transition-transform group-hover:-translate-y-1" size={42} />
                <p className="text-center text-[#E2E8F0]">
                  <span className="font-semibold text-[#7C69F5]">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">PDF, DOCX, Video, or Image assets</p>
              </label>

              <div className="max-h-[240px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {files.map((fileItem) => (
                  <div key={fileItem.id} className="group flex items-center justify-between rounded-lg border border-[rgba(124, 105, 245, 0.1)] bg-white/[0.03] p-3 hover:bg-white/[0.05]">
                    <div className="flex items-center gap-3">
                      {getFileIcon(fileItem.type)}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[#E2E8F0] truncate max-w-[300px]">{fileItem.name}</span>
                        {fileItem.isExisting && <span className="text-[10px] text-[#A7DADB] font-bold uppercase tracking-tighter">Processed</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {fileItem.status === 'complete' && <CheckCircle2 size={16} className="text-[#A7DADB]" />}
                      <button 
                        onClick={() => fileItem.isExisting ? handleDelete(fileItem.name) : setFiles(prev => prev.filter(f => f.id !== fileItem.id))} 
                        className="text-[#94A3B8] hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="text-center py-8 border border-dashed border-white/5 rounded-xl">
                    <p className="text-xs text-[#94A3B8] italic">No assets in vault. Initialize ingestion to begin.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  disabled={files.filter(f => f.status === 'pending').length === 0}
                  onClick={handleIngest}
                  className="group relative overflow-hidden rounded-full bg-[#7C69F5] px-8 py-3 font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">Initialize Ingest Engine <Sparkles size={18} /></span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-8 flex h-32 w-32 items-center justify-center">
                <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 rounded-full border border-[#7C69F5]/30" />
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#7C69F5]/20 shadow-[0_0_30px_rgba(124,105,245,0.4)]">
                  <Loader2 className="animate-spin text-[#7C69F5]" size={32} />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-[#E2E8F0]">Synthesizing Wisdom</h3>
              <p className="mb-6 text-sm text-[#94A3B8]">Aligning multi-modal assets with Polaris standards...</p>
              <div className="w-full max-w-sm">
                <div className="mb-2 flex justify-between text-xs font-medium text-[#94A3B8]"><span>V.4-ALPHA Processing</span><span>{Math.round(progress)}%</span></div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-to-r from-[#7C69F5] to-[#A7DADB]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
