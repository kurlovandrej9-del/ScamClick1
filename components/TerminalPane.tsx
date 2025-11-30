import React, { useEffect, useRef } from 'react';
import { TerminalLog } from '../types';
import { X, Minus, Square } from 'lucide-react';

interface TerminalPaneProps {
  logs: TerminalLog[];
  onClose: () => void;
  isOpen: boolean;
}

export const TerminalPane: React.FC<TerminalPaneProps> = ({ logs, onClose, isOpen }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="h-48 border-t border-[#3e3e42] bg-[#1e1e1e] flex flex-col font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-1 bg-[#252526] border-b border-[#3e3e42] select-none">
        <div className="flex gap-4">
          <span className="text-zinc-100 border-b border-white text-xs font-bold px-1">TERMINAL</span>
          <span className="text-zinc-500 text-xs hover:text-zinc-300 cursor-pointer">OUTPUT</span>
          <span className="text-zinc-500 text-xs hover:text-zinc-300 cursor-pointer">DEBUG CONSOLE</span>
        </div>
        <div className="flex gap-2">
           <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-3 h-3" /></button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs bg-black text-zinc-300">
        <div className="mb-2 text-zinc-500">Welcome to GameForge Terminal [v1.0.0]</div>
        {logs.map((log) => (
          <div key={log.id} className="mb-1 break-all">
             <span className="text-zinc-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
             <span className={`${
               log.type === 'error' ? 'text-red-400' : 
               log.type === 'success' ? 'text-green-400' : 
               log.type === 'command' ? 'text-blue-400 font-bold' : 'text-zinc-300'
             }`}>
                {log.type === 'command' ? '> ' : ''}{log.content}
             </span>
          </div>
        ))}
        <div className="flex items-center gap-1 mt-2 text-zinc-100 animate-pulse">
          <span>$</span>
          <div className="w-2 h-4 bg-zinc-400"></div>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};