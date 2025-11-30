import React, { useState } from 'react';
import { AccentColor } from '../types';
import { Send, CheckCircle2 } from 'lucide-react';

interface QuizOverlayProps {
  questions: string[];
  accentColor: AccentColor;
  onSubmit: (answers: {q: string, a: string}[]) => void;
}

export const QuizOverlay: React.FC<QuizOverlayProps> = ({ questions, accentColor, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQ, setCurrentQ] = useState(0);

  const colorMap = {
    cyan: 'bg-cyan-500 text-cyan-500 border-cyan-500',
    violet: 'bg-violet-500 text-violet-500 border-violet-500',
    emerald: 'bg-emerald-500 text-emerald-500 border-emerald-500',
    amber: 'bg-amber-500 text-amber-500 border-amber-500',
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      // Submit
      const formattedAnswers = questions.map((q, i) => ({
        q,
        a: answers[i] || "No specific preference."
      }));
      onSubmit(formattedAnswers);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (answers[currentQ]?.trim().length > 0)) {
       handleNext();
    }
  }

  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl p-8 rounded-xl border border-white/10 bg-[#0c0c0e] shadow-2xl relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-white/5 w-full">
          <div className={`h-full transition-all duration-300 ${colorMap[accentColor].split(' ')[0]}`} style={{ width: `${progress}%` }}></div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-1">Clarification Protocol</h2>
          <h3 className="text-2xl font-bold text-zinc-100 font-mono">Question {currentQ + 1}/{questions.length}</h3>
        </div>

        <div className="min-h-[120px]">
          <p className="text-xl text-zinc-300 leading-relaxed font-light">{questions[currentQ]}</p>
        </div>

        <div className="mt-8">
          <input
            autoFocus
            type="text"
            value={answers[currentQ] || ''}
            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQ]: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here..."
            className={`w-full bg-transparent border-b-2 border-zinc-700 text-lg py-2 focus:outline-none focus:border-opacity-100 transition-colors text-white font-mono placeholder-zinc-600 ${colorMap[accentColor].replace('bg-', 'focus:border-')}`}
          />
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={handleNext}
            disabled={!answers[currentQ]}
            className={`flex items-center gap-2 px-6 py-2 rounded font-bold text-sm uppercase tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              colorMap[accentColor].includes('bg-cyan') ? 'bg-cyan-500 text-black hover:bg-cyan-400' :
              colorMap[accentColor].includes('bg-violet') ? 'bg-violet-500 text-white hover:bg-violet-400' :
              colorMap[accentColor].includes('bg-emerald') ? 'bg-emerald-500 text-black hover:bg-emerald-400' :
              'bg-amber-500 text-black hover:bg-amber-400'
            }`}
          >
            {currentQ === questions.length - 1 ? (
              <>Complete <CheckCircle2 className="w-4 h-4" /></>
            ) : (
              <>Next <Send className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};