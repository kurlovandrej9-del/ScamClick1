import React, { useState, useRef, useEffect } from 'react';
import { AgentRole, LogMessage, PipelineState, AppMode, AccentColor, Attachment, VirtualFile, BotLanguage, TerminalLog } from './types';
import { PIPELINE_ORDER, MODES, getAgentProfile } from './constants';
import { runAgentStep, generateQuiz, generateImprovedPrompt } from './services/geminiService';
import { AgentMessage } from './components/AgentMessage';
import { QuizOverlay } from './components/QuizOverlay';
import { IdeWorkspace } from './components/IdeWorkspace';
import { 
  Sparkles, Play, Cpu, Loader2, RefreshCcw, ChevronDown, 
  SidebarOpen, SidebarClose, Download, Trash2, 
  Target, Settings, Zap, Layout, PaintBucket,
  Bug, Eye, Terminal, PenTool, Hash, Globe,
  Paperclip, X, FileText, FolderOpen
} from 'lucide-react';

const ICON_MAP: Record<AgentRole, React.ElementType> = {
  [AgentRole.PRODUCT_OWNER]: Target,
  [AgentRole.MECHANIC]: Settings,
  [AgentRole.INNOVATOR]: Zap,
  [AgentRole.TECH_LEAD]: Hash,
  [AgentRole.DESIGNER]: PenTool,
  [AgentRole.QA_ENGINEER]: Bug,
  [AgentRole.SYNTHESIZER]: Terminal,
  [AgentRole.CRITIC]: Eye
};

const App: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [pipeline, setPipeline] = useState<PipelineState>({
    isProcessing: false,
    currentStep: null,
    progress: 0,
    finished: false,
    phase: 'draft',
    mode: 'STATIC_SITE'
  });
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [accentColor, setAccentColor] = useState<AccentColor>('emerald');
  const [isAccentDropdownOpen, setIsAccentDropdownOpen] = useState(false);
  
  // Bot Language State
  const [botLanguage, setBotLanguage] = useState<BotLanguage>('javascript');
  
  // IDE State
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  
  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<string[] | null>(null);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Initialize file system based on mode
  useEffect(() => {
    const info = MODES[pipeline.mode];
    let ext = info.fileExt;
    let lang = info.fileLang;
    
    // Adjust extension for bot language
    if (pipeline.mode === 'TG_BOT') {
       if (botLanguage === 'python') {
           ext = 'bot.py';
           lang = 'python';
       } else {
           ext = 'bot.js';
           lang = 'javascript';
       }
    }

    const defaultFile: VirtualFile = {
      name: ext,
      language: lang,
      content: pipeline.mode === 'TG_BOT' 
          ? (botLanguage === 'python' ? '# Python Bot Code...' : '// Node.js Bot Code...') 
          : '<!-- Your HTML will appear here -->',
    };
    setFiles([defaultFile]);
    setActiveFileName(defaultFile.name);
    setTerminalLogs([]);
  }, [pipeline.mode, botLanguage]);

  const handleLogUpdate = (id: string, newContent: string) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, content: newContent } : log));
    const log = logs.find(l => l.id === id);
    if (log && log.agentId === AgentRole.SYNTHESIZER) {
       updateFileContent(newContent);
    }
  };

  const updateFileContent = (content: string) => {
    // Determine target file name based on mode/lang
    let targetName = MODES[pipeline.mode].fileExt;
    if (pipeline.mode === 'TG_BOT') {
        targetName = botLanguage === 'python' ? 'bot.py' : 'bot.js';
    }
    
    // Clean content
    let cleanContent = content;
    if (content.includes('```')) {
       const lines = content.split('\n');
       const start = lines.findIndex(l => l.startsWith('```'));
       const end = lines.lastIndexOf('```');
       if (start !== -1) {
           cleanContent = lines.slice(start + 1, end !== -1 && end > start ? end : undefined).join('\n');
       }
    }

    setFiles(prev => prev.map(f => f.name === targetName ? { ...f, content: cleanContent } : f));
  };

  const processQueue = async (
    queue: AgentRole[], 
    baseHistory: LogMessage[], 
    apiKey: string,
    mode: AppMode,
    promptOverride?: string
  ) => {
    let currentHistory = [...baseHistory];
    const promptToUse = promptOverride || idea;

    for (let i = 0; i < queue.length; i++) {
      const role = queue[i];
      setPipeline(prev => ({ ...prev, currentStep: role }));
      await new Promise(resolve => setTimeout(resolve, 600));

      const responseText = await runAgentStep(role, promptToUse, currentHistory, apiKey, mode, attachments, botLanguage);
      
      const newMessage: LogMessage = {
        id: crypto.randomUUID(),
        agentId: role,
        content: responseText,
        timestamp: Date.now(),
        mode: mode
      };

      currentHistory = [...currentHistory, newMessage];
      setLogs(prev => [...prev, newMessage]);

      if (role === AgentRole.SYNTHESIZER) {
        updateFileContent(responseText);
      }
    }
    return currentHistory;
  };

  const handleStart = async () => {
    if (!idea.trim() && attachments.length === 0) return;
    
    setLogs([]);
    setQuizQuestions(null);
    setImprovedPrompt(null);
    setTerminalLogs([]);
    
    // Reset file content logic similar to useEffect
    const info = MODES[pipeline.mode];
    let ext = info.fileExt;
    let lang = info.fileLang;
    if (pipeline.mode === 'TG_BOT') {
        ext = botLanguage === 'python' ? 'bot.py' : 'bot.js';
        lang = botLanguage === 'python' ? 'python' : 'javascript';
    }
    setFiles([{ name: ext, language: lang, content: '' }]);
    
    setPipeline(prev => ({
      ...prev,
      isProcessing: true,
      currentStep: PIPELINE_ORDER[0],
      finished: false,
      phase: 'draft'
    }));

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("API_KEY not found.");
      return;
    }

    if (pipeline.mode === 'STATIC_SITE') {
       try {
         const questions = await generateQuiz(idea, apiKey, attachments);
         setQuizQuestions(questions);
         setPipeline(prev => ({...prev, isProcessing: false, currentStep: null }));
         return;
       } catch (e) {
         console.error(e);
       }
    }

    executeStandardPipeline(apiKey);
  };

  const handleQuizSubmit = async (answers: {q: string, a: string}[]) => {
     setQuizQuestions(null);
     setPipeline(prev => ({...prev, isProcessing: true, currentStep: PIPELINE_ORDER[0] }));
     const apiKey = process.env.API_KEY!;
     const improved = await generateImprovedPrompt(idea, answers, apiKey);
     setImprovedPrompt(improved);
     await executeStandardPipeline(apiKey, improved);
  };

  const executeStandardPipeline = async (apiKey: string, promptOverride?: string) => {
    try {
      await processQueue(PIPELINE_ORDER, [], apiKey, pipeline.mode, promptOverride);
      setPipeline(prev => ({ ...prev, isProcessing: false, currentStep: null, finished: true }));
    } catch (e) {
      console.error(e);
      setPipeline(prev => ({ ...prev, isProcessing: false, finished: true }));
    }
  }

  const handleClear = () => {
      if(confirm('Reset Workspace?')) {
          setLogs([]);
          setIdea('');
          setAttachments([]);
          setQuizQuestions(null);
          setImprovedPrompt(null);
          setTerminalLogs([]);
          setPipeline(prev => ({...prev, finished: false, progress: 0, currentStep: null, isProcessing: false}));
      }
  }

  const handleNewFile = (fileName: string) => {
     // Guess language
     let lang = 'plaintext';
     if(fileName.endsWith('.js')) lang = 'javascript';
     if(fileName.endsWith('.py')) lang = 'python';
     if(fileName.endsWith('.html')) lang = 'html';
     if(fileName.endsWith('.css')) lang = 'css';
     if(fileName.endsWith('.json')) lang = 'json';

     const newFile: VirtualFile = {
         name: fileName,
         language: lang,
         content: ''
     };
     setFiles(prev => [...prev, newFile]);
     setActiveFileName(fileName);
  };

  const addTerminalLog = (type: 'info' | 'error' | 'success' | 'command', content: string) => {
      setTerminalLogs(prev => [...prev, {
          id: crypto.randomUUID(),
          type,
          content,
          timestamp: Date.now()
      }]);
  };

  const handleRun = () => {
      if (pipeline.mode === 'TG_BOT') {
          setTerminalLogs([]); // Clear
          if (botLanguage === 'javascript') {
              addTerminalLog('command', 'npm install telegraf');
              setTimeout(() => addTerminalLog('success', 'added 15 packages in 1s'), 800);
              setTimeout(() => addTerminalLog('command', 'node bot.js'), 1500);
              setTimeout(() => addTerminalLog('info', '[Bot] Starting polling...'), 2000);
              setTimeout(() => addTerminalLog('success', '[Bot] Online and ready! (Simulation)'), 2500);
          } else {
              addTerminalLog('command', 'pip install python-telegram-bot');
              setTimeout(() => addTerminalLog('success', 'Successfully installed python-telegram-bot-20.0'), 1000);
              setTimeout(() => addTerminalLog('command', 'python bot.py'), 1800);
              setTimeout(() => addTerminalLog('info', 'INFO:telegram.ext.Application:Application started'), 2500);
              setTimeout(() => addTerminalLog('success', 'Bot is polling... (Simulation Mode)'), 3000);
          }
      } else if (pipeline.mode === 'PROMPT_OPTIMIZER') {
          addTerminalLog('info', 'Copying prompt to clipboard...');
          const file = files.find(f => f.name === activeFileName);
          if (file) {
              navigator.clipboard.writeText(file.content);
              addTerminalLog('success', 'Copied!');
          }
      }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAttachments: Attachment[] = [];
      Array.from(e.target.files).forEach(file => {
        newAttachments.push({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
          mimeType: file.type
        });
      });
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const getAccentColor = (type: 'text' | 'bg' | 'border') => {
      const map = {
          cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500/50' },
          violet: { text: 'text-violet-400', bg: 'bg-violet-500', border: 'border-violet-500/50' },
          emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/50' },
          amber: { text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/50' },
      }
      return map[accentColor][type];
  }

  const currentModeInfo = MODES[pipeline.mode];
  const CurrentModeIcon = currentModeInfo.icon;

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-slate-200 overflow-hidden font-inter selection:bg-white/20">
      
      {quizQuestions && (
        <QuizOverlay 
          questions={quizQuestions} 
          accentColor={accentColor} 
          onSubmit={handleQuizSubmit} 
        />
      )}

      {/* HEADER */}
      <nav className="h-12 border-b border-white/5 bg-[#09090b] flex items-center justify-between px-3 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className={`w-4 h-4 ${getAccentColor('text')}`} />
            <span className="font-mono font-bold tracking-tight text-zinc-100 text-sm">GameForge_IDE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
             <div className="relative">
                <button 
                    onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                    disabled={pipeline.isProcessing}
                    className="flex items-center gap-2 px-3 py-1 rounded-sm border border-white/10 hover:bg-zinc-800 transition-colors text-xs font-mono tracking-wide"
                >
                    <CurrentModeIcon className={`w-3.5 h-3.5 ${getAccentColor('text')}`} />
                    <span>{currentModeInfo.label}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
                {isModeDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-[#18181b] border border-white/10 rounded shadow-xl py-1 z-50">
                         {(Object.keys(MODES) as AppMode[]).map((m) => (
                             <button
                                key={m}
                                onClick={() => { setPipeline(prev => ({...prev, mode: m})); setIsModeDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-2 text-xs font-mono hover:bg-zinc-800 flex items-center gap-2 ${pipeline.mode === m ? getAccentColor('text') : 'text-zinc-400'}`}
                             >
                                 <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                 {MODES[m].label}
                             </button>
                         ))}
                    </div>
                )}
             </div>

             <div className="relative">
                <button 
                    onClick={() => setIsAccentDropdownOpen(!isAccentDropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1 rounded-sm border border-white/10 hover:bg-zinc-800 transition-colors"
                >
                    <PaintBucket className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                {isAccentDropdownOpen && (
                   <div className="absolute top-full right-0 mt-1 w-32 bg-[#18181b] border border-white/10 rounded shadow-xl p-2 z-50 grid grid-cols-4 gap-2">
                       {(['cyan', 'violet', 'emerald', 'amber'] as AccentColor[]).map(c => (
                           <button 
                             key={c}
                             onClick={() => { setAccentColor(c); setIsAccentDropdownOpen(false); }}
                             className={`w-6 h-6 rounded-full border border-white/10 ${c === 'cyan' ? 'bg-cyan-500' : c === 'violet' ? 'bg-violet-500' : c === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                           />
                       ))}
                   </div>
                )}
             </div>

             <button onClick={handleClear} disabled={pipeline.isProcessing} className="p-1.5 hover:bg-red-900/30 rounded text-zinc-400 hover:text-red-400 disabled:opacity-30">
                 <Trash2 className="w-4 h-4" />
             </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT COLUMN: Chat & Agents (30% width) */}
        <aside className="w-[30%] min-w-[320px] max-w-[450px] border-r border-white/5 bg-[#0c0c0e] flex flex-col">
           
           {/* File Explorer Header */}
           <div className="h-8 bg-[#18181b] border-b border-white/5 flex items-center px-3 text-[10px] font-mono text-zinc-400 uppercase tracking-wider gap-2">
              <FolderOpen className="w-3 h-3" />
              <span>Project: {pipeline.mode.replace('_', ' ')}</span>
           </div>

           {/* LOGS AREA */}
           <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
              {logs.length === 0 && !pipeline.isProcessing && (
                  <div className="text-center mt-10 opacity-40">
                      <Cpu className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
                      <p className="text-xs font-mono text-zinc-500">System Ready.</p>
                  </div>
              )}
              
              {improvedPrompt && (
                  <div className="p-3 bg-white/5 border border-white/10 rounded text-xs font-mono text-zinc-400 whitespace-pre-wrap">
                      <span className="text-zinc-500 font-bold block mb-1">SPECIFICATION:</span>
                      {improvedPrompt}
                  </div>
              )}

              {logs.map(log => (
                 <AgentMessage 
                    key={log.id}
                    message={log} 
                    currentMode={pipeline.mode} 
                    icon={ICON_MAP[log.agentId]}
                    accentColor={accentColor}
                    onUpdate={handleLogUpdate}
                 />
              ))}
              
              {pipeline.isProcessing && (
                 <div className="flex items-center gap-2 p-2 bg-white/5 rounded border border-white/10">
                    <Loader2 className={`w-4 h-4 animate-spin ${getAccentColor('text')}`} />
                    <span className="text-xs font-mono text-zinc-400">
                        Agent {getAgentProfile(pipeline.currentStep!, pipeline.mode).name} working...
                    </span>
                 </div>
              )}
              <div ref={logsEndRef} />
           </div>

           {/* INPUT AREA */}
           <div className="p-3 border-t border-white/5 bg-[#09090b]">
              
              {/* Bot Language Selector */}
              {pipeline.mode === 'TG_BOT' && !pipeline.isProcessing && (
                  <div className="flex gap-2 mb-2">
                      <button 
                        onClick={() => setBotLanguage('javascript')}
                        className={`flex-1 py-1 text-[10px] font-mono border rounded ${botLanguage === 'javascript' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'border-white/10 text-zinc-500'}`}
                      >
                          Node.js (Telegraf)
                      </button>
                      <button 
                        onClick={() => setBotLanguage('python')}
                        className={`flex-1 py-1 text-[10px] font-mono border rounded ${botLanguage === 'python' ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : 'border-white/10 text-zinc-500'}`}
                      >
                          Python (Async)
                      </button>
                  </div>
              )}

              <div className="relative group">
                  <div className={`absolute -inset-0.5 rounded-lg opacity-20 group-hover:opacity-40 transition duration-500 blur ${getAccentColor('bg')}`}></div>
                  <div className="relative bg-[#0c0c0e] rounded-lg border border-white/10 p-1">
                      <textarea
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="Define requirements..."
                        className="w-full h-20 bg-transparent p-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none font-mono resize-none"
                        disabled={pipeline.isProcessing}
                      />
                      
                      {attachments.length > 0 && (
                          <div className="flex gap-2 px-2 pb-2 overflow-x-auto">
                              {attachments.map(att => (
                                  <div key={att.id} className="relative group/att flex-shrink-0">
                                      <div className="w-8 h-8 bg-white/10 rounded border border-white/10 flex items-center justify-center">
                                         <Paperclip className="w-3 h-3 text-zinc-400" />
                                      </div>
                                      <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))} className="absolute -top-1 -right-1 bg-zinc-900 rounded-full text-red-400 opacity-0 group-hover/att:opacity-100">
                                          <X className="w-3 h-3" />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}

                      <div className="flex justify-between items-center px-1 pt-1 border-t border-white/5">
                         <div className="flex gap-1">
                             <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-white/10 rounded text-zinc-500 hover:text-zinc-300">
                                 <Paperclip className="w-3.5 h-3.5" />
                             </button>
                             <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                         </div>
                         <button
                           onClick={handleStart}
                           disabled={pipeline.isProcessing}
                           className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold font-mono tracking-wide uppercase transition-all ${
                             pipeline.isProcessing ? 'bg-zinc-800 text-zinc-500' : `bg-white/10 hover:bg-white/20 text-zinc-100 border border-white/10 ${getAccentColor('border')}`
                           }`}
                         >
                           {pipeline.isProcessing ? 'BUSY' : 'RUN'} <Play className="w-3 h-3 fill-current" />
                         </button>
                      </div>
                  </div>
              </div>
           </div>
        </aside>

        {/* RIGHT COLUMN: IDE (70% width) */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
             <IdeWorkspace 
                files={files}
                activeFileName={activeFileName}
                onFileChange={(name, content) => setFiles(prev => prev.map(f => f.name === name ? {...f, content} : f))}
                onFileSelect={setActiveFileName}
                onNewFile={handleNewFile}
                onRun={handleRun}
                accentColor={accentColor}
                mode={pipeline.mode}
                terminalLogs={terminalLogs}
             />
        </main>
      </div>
    </div>
  );
};

export default App;