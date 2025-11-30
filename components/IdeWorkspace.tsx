import React, { useState, useEffect } from 'react';
import { CodeEditor } from './CodeEditor';
import { SitePreview } from './SitePreview';
import { TerminalPane } from './TerminalPane';
import { AccentColor, VirtualFile, AppMode, TerminalLog } from '../types';
import { 
  FileCode, Play, Eye, EyeOff, Save, Download, 
  Terminal, FileJson, FileText, Plus, FilePlus
} from 'lucide-react';

interface IdeWorkspaceProps {
  files: VirtualFile[];
  activeFileName: string;
  onFileChange: (fileName: string, newContent: string) => void;
  onFileSelect: (fileName: string) => void;
  onNewFile: (fileName: string) => void;
  onRun: () => void;
  accentColor: AccentColor;
  mode: AppMode;
  terminalLogs: TerminalLog[];
}

export const IdeWorkspace: React.FC<IdeWorkspaceProps> = ({ 
  files, activeFileName, onFileChange, onFileSelect, onNewFile, onRun, accentColor, mode, terminalLogs 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const activeFile = files.find(f => f.name === activeFileName);

  // Auto-open preview for Static Site when code is populated and it's HTML
  useEffect(() => {
    if (mode === 'STATIC_SITE' && activeFile && activeFile.content.length > 50 && !showPreview) {
      setShowPreview(true);
    }
  }, [mode]);

  useEffect(() => {
     if(terminalLogs.length > 0) {
         setShowTerminal(true);
     }
  }, [terminalLogs]);

  const handleDownload = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
  };

  const handleNewFileClick = () => {
      const name = prompt("Enter file name (e.g., style.css, script.py):");
      if (name && name.trim()) {
          onNewFile(name.trim());
      }
  };

  const getIconForFile = (name: string) => {
    if (name.endsWith('.html')) return <FileCode className="w-4 h-4 text-orange-400" />;
    if (name.endsWith('.js')) return <FileJson className="w-4 h-4 text-yellow-400" />;
    if (name.endsWith('.py')) return <FileText className="w-4 h-4 text-blue-400" />;
    if (name.endsWith('.md') || name.endsWith('.txt')) return <FileText className="w-4 h-4 text-zinc-400" />;
    return <Terminal className="w-4 h-4 text-zinc-400" />;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-white/5">
      {/* Top Bar / Toolbar */}
      <div className="h-10 bg-[#252526] flex items-center justify-between px-0 select-none border-b border-[#3e3e42]">
        
        {/* Tabs */}
        <div className="flex items-center h-full overflow-x-auto no-scrollbar max-w-[70%]">
          {files.map(file => (
            <button
              key={file.name}
              onClick={() => onFileSelect(file.name)}
              className={`h-full px-4 flex items-center gap-2 text-xs font-mono border-r border-[#3e3e42] hover:bg-[#2d2d2d] transition-colors ${
                activeFileName === file.name 
                  ? 'bg-[#1e1e1e] text-zinc-100 border-t-2 border-t-[#007fd4]'
                  : 'bg-[#2d2d2d] text-zinc-500 border-t-2 border-t-transparent'
              }`}
            >
              {getIconForFile(file.name)}
              {file.name}
            </button>
          ))}
          <button onClick={handleNewFileClick} className="h-full px-3 text-zinc-500 hover:text-white hover:bg-[#2d2d2d] transition-colors">
              <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center px-2 gap-1">
          <button 
             onClick={onRun}
             className="flex items-center gap-1.5 px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded-sm text-xs font-mono mr-2 transition-colors"
          >
             <Play className="w-3 h-3 fill-current" /> RUN
          </button>

          {mode === 'STATIC_SITE' && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`p-1.5 rounded hover:bg-[#3e3e42] transition-colors ${showPreview ? 'text-zinc-100' : 'text-zinc-500'}`}
              title="Toggle Live Preview"
            >
              {showPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-1.5 rounded hover:bg-[#3e3e42] transition-colors ${showTerminal ? 'text-zinc-100' : 'text-zinc-500'}`}
            title="Toggle Terminal"
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-[#3e3e42] text-zinc-400 hover:text-white transition-colors"
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex overflow-hidden">
             {/* Editor Pane */}
            <div className={`h-full transition-all duration-300 ${showPreview ? 'w-1/2 border-r border-[#3e3e42]' : 'w-full'}`}>
                {activeFile ? (
                    <CodeEditor 
                        code={activeFile.content}
                        language={activeFile.language}
                        onChange={(val) => onFileChange(activeFile.name, val || '')}
                        accentColor={accentColor}
                        readOnly={activeFile.readOnly}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-600 font-mono text-sm">
                        NO_FILE_SELECTED
                    </div>
                )}
            </div>

            {/* Preview Pane */}
            {showPreview && mode === 'STATIC_SITE' && (
                <div className="w-1/2 h-full bg-white relative">
                    <SitePreview 
                        htmlContent={activeFile?.content || ''} 
                        accentColor={accentColor}
                        onClose={() => setShowPreview(false)}
                        embedded={true}
                    />
                </div>
            )}
        </div>

        {/* Terminal Pane */}
        <TerminalPane 
            logs={terminalLogs} 
            isOpen={showTerminal} 
            onClose={() => setShowTerminal(false)} 
        />
      </div>
      
      {/* Footer Status Bar */}
      <div className="h-6 bg-[#007fd4] flex items-center justify-between px-3 text-[10px] text-white font-mono select-none flex-shrink-0">
          <div className="flex items-center gap-4">
              <span>master*</span>
              <span>{activeFileName}</span>
          </div>
          <div className="flex items-center gap-4">
              <span>{activeFile?.language.toUpperCase()}</span>
              <span>UTF-8</span>
          </div>
      </div>
    </div>
  );
};