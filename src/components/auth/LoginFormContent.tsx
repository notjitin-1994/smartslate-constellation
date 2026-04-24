'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type React from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function LoginFormContent(): React.JSX.Element {
  const router = useRouter();
  const [identifier, setIdentifier] = useState({ kind: 'unknown', email: '' });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (identifier.kind !== 'email') {
      setError('Please enter a valid email address');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: identifier.email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.session) throw new Error('Failed to establish session.');

      setIsExiting(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 600);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed.';
      setError(errorMessage);
      setLoading(false);
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      animate={isExiting ? { opacity: 0, scale: 0.95, filter: 'blur(20px)', transition: { duration: 0.6 } } : {}}
      className="space-y-4"
    >
      <AuthInput value={identifier.email} onChange={(raw, parsed) => setIdentifier({ kind: parsed.kind, email: raw })} />
      <PasswordInput label="Password" value={password} onChange={setPassword} placeholder="Enter your password" autoComplete="current-password" name="password" />
      
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 text-red-400" />
            <p className="text-xs text-red-200">{error}</p>
          </div>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full py-3 bg-[#4F46E5] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-500/20 hover:bg-[#4F46E5]/90 transition-all disabled:opacity-50"
      >
        <span className="flex items-center justify-center gap-3">
          {loading ? 'Processing' : (
            <>
              Sign In <ArrowRight size={14} strokeWidth={3} />
            </>
          )}
        </span>
      </button>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.03]" /></div>
        <div className="relative flex justify-center"><span className="bg-[#020617] px-4 text-[9px] font-black text-slate-700 uppercase tracking-widest">Protocol Gate</span></div>
      </div>

      <GoogleOAuthButton />
    </motion.form>
  );
}
