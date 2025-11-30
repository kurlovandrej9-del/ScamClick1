import React, { useState } from 'react';
import { LogMessage, AppMode, AccentColor } from '../types';
import { getAgentProfile } from '../constants';
import ReactMarkdown from 'react-markdown';
import { Edit2, Check, X, User } from 'lucide-react';

interface AgentMessageProps {
  message: LogMessage;
  currentMode: AppMode;
  icon: React.ElementType;
  accentColor: AccentColor;
  onUpdate: (id: string, newContent: string) => void;
}

export const AgentMessage: React.FC<AgentMessageProps> = ({ message, currentMode, icon: Icon, accentColor, onUpdate }) => {
  const modeToUse = message.mode || currentMode;
  const agent = getAgentProfile(message.agentId, modeToUse);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  // Map accent colors to tailwind classes
  const colorMap = {
    cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    violet: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
    emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  };
  
  const buttonColorMap = {
    cyan: 'text-cyan-400 hover:text-cyan-300',
    violet: 'text-violet-400 hover:text-violet-300',
    emerald: 'text-emerald-400 hover:text-emerald-300',
    amber: 'text-amber-400 hover:text-amber-300',
  };

  const handleSave = () => {
    onUpdate(message.id, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  return (
    <div className="group flex gap-5 p-5 border-l border-white/5 hover:bg-white/[0.02] transition-colors relative">
      {/* Connector Line */}
      <div className="absolute left-[-1px] top-0 bottom-0 w-[1px] bg-white/5 group-hover:bg-white/10 transition-colors"></div>

      {/* Icon Column */}
      <div className="flex-shrink-0 flex flex-col items-center pt-1">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorMap[accentColor].replace('text-', 'border-').split(' ')[1]} bg-[#09090b]`}>
          <Icon className={`w-5 h-5 ${colorMap[accentColor].split(' ')[0]}`} />
        </div>
      </div>
      
      {/* Content Column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-mono font-bold text-sm tracking-wide text-zinc-300">
              {agent.name}
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider border border-white/10 px-1.5 py-0.5 rounded">
              {agent.title}
            </span>
          </div>
          <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
             <span className="text-[10px] text-zinc-600 font-mono">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
             {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                  <Edit2 className="w-3 h-3" />
                </button>
             )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="animate-in fade-in duration-200">
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-64 bg-[#09090b] border border-white/20 rounded-md p-3 text-sm font-mono text-zinc-300 focus:outline-none focus:border-white/40 resize-y"
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors">
                <X className="w-3 h-3" /> Cancel
              </button>
              <button onClick={handleSave} className={`flex items-center gap-1 px-3 py-1.5 rounded bg-zinc-900 border border-current ${buttonColorMap[accentColor]} text-xs font-bold transition-all`}>
                <Check className="w-3 h-3" /> Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none text-zinc-400">
            <ReactMarkdown 
               components={{
                h1: ({node, ...props}) => <h1 className="text-zinc-200 font-mono text-base border-b border-white/10 pb-2 mb-4 mt-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-zinc-200 font-mono text-sm font-bold mt-4 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-zinc-300 font-mono text-sm font-bold mt-3 mb-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                strong: ({node, ...props}) => <strong className={`font-bold ${colorMap[accentColor].split(' ')[0]}`} {...props} />,
                code({node, className, children, ...props}) {
                  return (
                    <code className={`${className} bg-white/5 px-1.5 py-0.5 rounded text-zinc-300 font-mono text-[11px] border border-white/5`} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};