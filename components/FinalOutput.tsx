import React, { useState } from 'react';
import { Copy, Check, Terminal, Play, FileCode } from 'lucide-react';
import { AccentColor } from '../types';

interface FinalOutputProps {
  promptContent: string;
  accentColor: AccentColor;
  onPreview?: () => void;
  mode?: string;
}

export const FinalOutput: React.FC<FinalOutputProps> = ({ promptContent, accentColor, onPreview, mode }) => {
  const [copied, setCopied] = useState(false);

  const colorClasses = {
    cyan: 'border-cyan-500/30 text-cyan-400',
    violet: 'border-violet-500/30 text-violet-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    amber: 'border-amber-500/30 text-amber-400',
  };
  
  const btnClasses = {
    cyan: 'hover:bg-cyan-500/20 hover:border-cyan-500/50',
    violet: 'hover:bg-violet-500/20 hover:border-violet-500/50',
    emerald: 'hover:bg-emerald-500/20 hover:border-emerald-500/50',
    amber: 'hover:bg-amber-500/20 hover:border-amber-500/50',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(promptContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Detect if content looks like HTML
  const isHtml = mode === 'STATIC_SITE' && (promptContent.trim().startsWith('<') || promptContent.includes('<!DOCTYPE html>'));

  return (
    <div className={`mt-8 bg-[#09090b] border ${colorClasses[accentColor].split(' ')[0]} rounded overflow-hidden shadow-2xl animate-slide-up relative group`}>
       {/* Scan line effect */}
       <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-50"></div>
       
      <div className="bg-white/[0.02] border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className={`w-5 h-5 ${colorClasses[accentColor].split(' ')[1]}`} />
          <h2 className={`font-mono font-bold text-sm tracking-wider ${colorClasses[accentColor].split(' ')[1]}`}>
            {isHtml ? 'GENERATED_CODE' : 'OUTPUT_SEQUENCE'}
          </h2>
        </div>
        <div className="flex gap-2">
            {isHtml && onPreview && (
                <button
                    onClick={onPreview}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/10 border border-white/20 text-white transition-all text-xs font-mono uppercase tracking-wide font-bold hover:bg-white/20`}
                >
                    <Play className="w-3 h-3 fill-current" /> LIVE PREVIEW
                </button>
            )}
            <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white/5 border border-white/10 text-zinc-300 transition-all text-xs font-mono uppercase tracking-wide ${btnClasses[accentColor]}`}
            >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'COPIED' : 'COPY'}
            </button>
        </div>
      </div>
      
      <div className="p-6 overflow-x-auto bg-[#050505] max-h-[500px] overflow-y-auto custom-scrollbar">
        <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed selection:bg-white/20">
          {promptContent}
        </pre>
      </div>
      
      <div className="bg-zinc-950 p-2 text-[10px] font-mono uppercase tracking-widest text-center text-zinc-600 border-t border-white/5 flex items-center justify-center gap-2">
         {isHtml ? <FileCode className="w-3 h-3"/> : null} 
         {isHtml ? 'Valid HTML5 Document Generated' : 'Ready for LLM Ingestion'}
      </div>
    </div>
  );
};