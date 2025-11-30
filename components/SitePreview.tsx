import React from 'react';
import { X, Smartphone, Monitor } from 'lucide-react';
import { AccentColor } from '../types';

interface SitePreviewProps {
  htmlContent: string;
  accentColor: AccentColor;
  onClose: () => void;
  embedded?: boolean;
}

export const SitePreview: React.FC<SitePreviewProps> = ({ htmlContent, accentColor, onClose, embedded = false }) => {
  const [viewMode, setViewMode] = React.useState<'desktop' | 'mobile'>('desktop');

  // Clean the HTML string (remove markdown blocks if present)
  const cleanHtml = htmlContent.replace(/^```html/, '').replace(/```$/, '');

  // If embedded, we remove the fixed positioning and adjust the header style
  const containerClass = embedded 
    ? "w-full h-full flex flex-col bg-[#0c0c0e]" 
    : "fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in zoom-in-95 duration-200";

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-[#18181b]">
        <div className="flex items-center gap-3">
           {!embedded && <span className="font-mono font-bold text-zinc-100 tracking-wider text-xs">LIVE_RENDER</span>}
           <div className="flex bg-zinc-900 rounded p-0.5 border border-white/5">
              <button 
                onClick={() => setViewMode('desktop')}
                className={`p-1 rounded transition-colors ${viewMode === 'desktop' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Monitor className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setViewMode('mobile')}
                className={`p-1 rounded transition-colors ${viewMode === 'mobile' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <Smartphone className="w-3 h-3" />
              </button>
           </div>
        </div>
        
        {!embedded && (
            <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
            <X className="w-4 h-4" />
            </button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-900 overflow-hidden relative">
        <div className={`transition-all duration-300 bg-white shadow-xl overflow-hidden ${
          viewMode === 'mobile' 
            ? 'w-[375px] h-[667px] rounded-2xl border-4 border-zinc-800 my-4' 
            : 'w-full h-full'
        }`}>
           <iframe 
             srcDoc={cleanHtml}
             className="w-full h-full bg-white"
             title="Preview"
             sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
           />
        </div>
      </div>
    </div>
  );
};