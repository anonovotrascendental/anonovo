
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1">
      {label && <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">{icon}{label}</label>}
      <input 
        className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-400 ${error ? 'border-red-500 ring-red-500/10' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Textarea: React.FC<TextareaProps> = ({ label, icon, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1">
      {label && <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">{icon}{label}</label>}
      <textarea 
        className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-400 min-h-[100px] resize-none ${className}`}
        {...props}
      />
    </div>
  );
};
