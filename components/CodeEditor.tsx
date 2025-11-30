import React from 'react';
import Editor, { Loader } from '@monaco-editor/react';
import { AccentColor } from '../types';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
  accentColor: AccentColor;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, language, onChange, accentColor, readOnly }) => {
  
  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Optional: Configure theme colors dynamically if needed, 
    // but strict 'vs-dark' is usually good enough for IDE feel.
  };

  return (
    <div className="w-full h-full overflow-hidden bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage={language}
        language={language}
        value={code}
        theme="vs-dark"
        onChange={onChange}
        options={{
          readOnly: readOnly,
          minimap: { enabled: true },
          fontSize: 13,
          fontFamily: "'JetBrains Mono', monospace",
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          automaticLayout: true,
          cursorBlinking: "smooth",
          smoothScrolling: true,
        }}
        onMount={handleEditorDidMount}
        loading={
            <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">
                INITIALIZING_IDE_ENVIRONMENT...
            </div>
        }
      />
    </div>
  );
};