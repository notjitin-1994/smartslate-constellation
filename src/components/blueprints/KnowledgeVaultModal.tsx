// REQUIRED DEPENDENCY: framer-motion (npm install framer-motion), lucide-react (npm install lucide-react)

"use client";

import React, { useState, useCallback, useRef } from 'react';
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
  FileCode
} from 'lucide-react';

export const KnowledgeVaultModal = ({ 
  isOpen, 
  onClose, 
  blueprintId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  blueprintId: string;
}) => {
  const [files, setFiles] = useState<Array<{ id: string; file: File; status: 'pending' | 'uploading' | 'complete' }>>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles = droppedFiles.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      status: 'pending' as const
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Strip the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleIngest = async () => {
    if (files.length === 0) return;
    setIsSynthesizing(true);
    setProgress(10);
    
    try {
      for (const fileItem of files) {
        if (fileItem.status === 'complete') continue;
        
        const base64 = await fileToBase64(fileItem.file);
        const contentType = fileItem.file.type.includes('pdf') ? 'pdf' : 
                          fileItem.file.type.includes('word') ? 'docx' : 
                          fileItem.file.type.includes('video') ? 'video' : 
                          fileItem.file.type.includes('image') ? 'image' : 'text';

        const response = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blueprintId,
            contentType,
            content: base64,
            fileName: fileItem.file.name
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ingestion failed');
        }
        
        setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'complete' } : f));
        setProgress(p => Math.min(p + (100 / files.length), 100));
      }
    } catch (error: unknown) {
      console.error('Ingestion Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to ingest knowledge: ${errorMessage}`);
    } finally {
      setIsSynthesizing(false);
      setProgress(0);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf') || type.includes('word') || type.includes('text')) return <FileText size={18} className="text-[#A7DADB]" />;
    if (type.includes('video')) return <Video size={18} className="text-[#7C69F5]" />;
    if (type.includes('image')) return <ImageIcon size={18} className="text-pink-400" />;
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
            <p className="text-sm text-[#94A3B8]">Ground your architecture with multi-modal assets</p>
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
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    setFiles(prev => [...prev, ...selected.map(f => ({
                      id: Math.random().toString(36).substr(2, 9),
                      file: f,
                      status: 'pending' as const
                    }))]);
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
                      {getFileIcon(fileItem.file.type)}
                      <span className="text-sm font-medium text-[#E2E8F0] truncate max-w-[300px]">{fileItem.file.name}</span>
                    </div>
                    {fileItem.status === 'complete' ? <CheckCircle2 size={16} className="text-[#A7DADB]" /> : (
                      <button onClick={() => setFiles(prev => prev.filter(f => f.id !== fileItem.id))} className="opacity-0 group-hover:opacity-100 text-[#94A3B8] hover:text-red-400">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  disabled={files.length === 0 || files.every(f => f.status === 'complete')}
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
