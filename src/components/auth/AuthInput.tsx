'use client';

import { useState, useEffect } from 'react';
import type React from 'react';
import { Mail, Check, X } from 'lucide-react';

type IdentifierValue = { kind: 'email'; email: string } | { kind: 'unknown'; raw: string };

type Props = {
  value: string;
  onChange: (raw: string, parsed: IdentifierValue) => void;
  placeholder?: string;
};

function detect(input: string): IdentifierValue {
  const trimmed = input.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (emailRegex.test(trimmed)) {
    return { kind: 'email', email: trimmed.toLowerCase() };
  }
  return { kind: 'unknown', raw: input };
}

export function AuthInput({ value, onChange, placeholder }: Props): React.JSX.Element {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    onChange(value, detect(value));
  }, [value, onChange]);

  const hasValue = value.length > 0;
  const parsed = detect(value);
  const isValidFormat = parsed.kind === 'email';
  const showValidation = hasValue && !focused;

  return (
    <div className="space-y-1">
      <label htmlFor="email-input" className="block text-[11px] font-semibold text-white/60 uppercase tracking-wider">Email Address</label>
      <div className="group relative">
        <div className={`from-primary/20 to-primary-dark/20 absolute -inset-0.5 rounded-xl bg-gradient-to-r opacity-0 blur transition-opacity duration-300 ${focused ? 'opacity-100' : ''}`} aria-hidden="true" />
        <div className="relative">
          <div className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2">
            <Mail className={`h-4 w-4 transition-colors duration-200 ${focused ? 'text-primary' : 'text-white/40'}`} />
          </div>
          <input 
            id="email-input" 
            type="email" 
            autoComplete="username" 
            name="email" 
            value={value} 
            onChange={(e) => onChange(e.target.value, detect(e.target.value))} 
            onFocus={() => setFocused(true)} 
            onBlur={() => setFocused(false)} 
            placeholder={placeholder ?? 'name@company.com'} 
            className={`premium-input pl-10 pr-10 ${isValidFormat ? (focused ? 'ring-primary/20' : 'hover:border-white/20') : (hasValue && !focused ? 'border-red-500/50 bg-white/10 ring-red-500/10' : '')}`} 
          />
          {showValidation && (
            <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
              {isValidFormat ? <Check className="h-5 w-5 text-emerald-400" /> : <X className="h-5 w-5 text-red-400" />}
            </div>
          )}
        </div>
      </div>
      {showValidation && !isValidFormat && <p className="animate-fade-in-up text-xs text-red-400">Please enter a valid email address</p>}
    </div>
  );
}
