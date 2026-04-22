'use client';

import { useState } from 'react';
import type React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  name?: string;
};

export function PasswordInput({ label, value, onChange, placeholder, autoComplete, name }: Props): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const meetsCriteria = value.length >= 6;

  return (
    <div className="space-y-1">
      <label htmlFor="password-input" className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      <div className="group relative">
        <div className={`from-primary/20 to-primary-dark/20 absolute -inset-0.5 rounded-xl bg-gradient-to-r opacity-0 blur transition-opacity duration-300 ${focused ? 'opacity-100' : ''}`} aria-hidden="true" />
        <div className="relative">
          <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
            <Lock className={`h-4 w-4 transition-colors duration-200 ${focused ? 'text-primary' : 'text-white/40'}`} />
          </div>
          <input id="password-input" type={visible ? 'text' : 'password'} autoComplete={autoComplete} name={name} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => {setFocused(false); setTouched(true);}} placeholder={placeholder} className={`w-full rounded-xl border bg-white/5 py-2.5 pr-20 pl-10 text-sm text-white backdrop-blur-sm transition-all duration-200 placeholder:text-white/30 focus:ring-2 focus:outline-none xl:py-3 ${focused ? 'border-primary/50 ring-primary/20 bg-white/10' : (touched && !meetsCriteria ? 'border-red-500/50 bg-white/10 ring-red-500/10' : 'border-white/10 hover:border-white/20')}`} />
          <button type="button" onClick={() => setVisible((v) => !v)} className="absolute top-1/2 right-3 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/40 hover:bg-white/5 hover:text-white/70">
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
