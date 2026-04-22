// REQUIRED DEPENDENCIES:
// - framer-motion (npm install framer-motion)
// - lucide-react (npm install lucide-react)
// - @mui/material @emotion/react @emotion/styled (npm install @mui/material @emotion/react @emotion/styled)

"use client";

import React, { useState } from 'react';
import { motion, Transition } from 'framer-motion';
import { 
  ShieldCheck, 
  Chrome, 
  ArrowRight, 
  Lock,
  User,
  Eye,
  EyeOff
} from 'lucide-react';
import { TextField, InputAdornment, Button, IconButton } from '@mui/material';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const glassStyles: React.CSSProperties = {
  background: 'rgba(13, 27, 42, 0.55)',
  backdropFilter: 'blur(18px)',
  border: '1px solid rgba(167, 218, 219, 0.12)',
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
};

const inputStyles = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(2, 12, 27, 0.4)',
    color: '#E2E8F0',
    fontSize: '13px',
    borderRadius: '12px',
    '& fieldset': { borderColor: 'rgba(167, 218, 219, 0.2)' },
    '&:hover fieldset': { borderColor: 'rgba(167, 218, 219, 0.4)' },
    '&.Mui-focused fieldset': { borderColor: '#A7DADB', borderWidth: '1px' },
    '& input:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 100px #020C1B inset !important',
      WebkitTextFillColor: '#E2E8F0 !important',
      transition: 'background-color 5000s ease-in-out 0s',
    },
  },
  '& .MuiInputLabel-root': { color: '#94A3B8', fontSize: '13px' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#A7DADB' },
};

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Access Keys do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) throw error;
      alert('Provisioning request received. Please check your email for activation link.');
      router.push('/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed.';
      alert(errorMessage);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] } as Transition}
      style={glassStyles}
      className="w-full max-w-[460px] rounded-2xl p-8 md:p-10"
    >
      <div className="mb-8 text-left" style={{ textAlign: 'left' }}>
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight font-heading">Create Account</h2>
        <p className="text-[11px] text-[#A7DADB] uppercase tracking-[0.15em] font-bold">Initialize your professional deployment</p>
      </div>

      <form className="space-y-4" onSubmit={handleSignup}>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="First"
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            sx={inputStyles}
          />
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Last"
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            sx={inputStyles}
          />
        </div>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="identity@smartslate.com"
          label="Email Identity"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <User size={16} className="text-[#A7DADB]" />
                </InputAdornment>
              ),
            },
          }}
          sx={inputStyles}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            variant="outlined"
            placeholder="••••••••"
            label="Access Key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={16} className="text-[#A7DADB]" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: '#94A3B8' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={inputStyles}
          />
          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            variant="outlined"
            placeholder="••••••••"
            label="Confirm Key"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ShieldCheck size={16} className="text-[#A7DADB]" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: '#94A3B8' }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={inputStyles}
          />
        </div>

        <div className="pt-4">
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disableElevation
            disabled={loading}
            endIcon={!loading && <ArrowRight size={16} />}
            sx={{
              backgroundColor: '#7C69F5',
              color: '#FFFFFF',
              py: 1.5,
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              borderRadius: '8px',
              boxShadow: '0 0 20px rgba(124, 105, 245, 0.3)',
              '&:hover': {
                backgroundColor: '#6b57e6',
                boxShadow: '0 0 30px rgba(124, 105, 245, 0.5)',
              },
              '&:active': {
                backgroundColor: '#7C69F5',
              },
              '&:focus': {
                backgroundColor: '#7C69F5',
              },
            }}
          >
            {loading ? 'Provisioning...' : 'Initialize Architecture'}
          </Button>
        </div>

        <div className="relative py-2 flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-white/5" />
          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-[0.2em]">OR</span>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>

        <button
          type="button"
          onClick={async () => await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } })}
          className="w-full flex items-center justify-center gap-3 py-3 border border-white/10 rounded-lg text-[12px] font-bold hover:bg-white/5 transition-all text-[#A7DADB] hover:text-white uppercase tracking-wider"
        >
          <Chrome size={16} />
          Sync with Google
        </button>
      </form>

      <div className="mt-8 text-left text-[11px] text-white/60">
        Already a member? {' '}
        <button onClick={() => router.push('/login')} className="text-[#7C69F5] font-bold hover:underline">
          Access Gateway
        </button>
      </div>
    </motion.div>
  );
}
