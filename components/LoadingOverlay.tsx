
import React from 'react';
import { GenerationProgress } from '../types';
import { Loader2, Palette, FileSearch, CheckCircle2 } from 'lucide-react';

interface LoadingOverlayProps {
  progress: GenerationProgress;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress }) => {
  const percent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  const getIcon = () => {
    switch(progress.step) {
      case 'text': return <FileSearch className="w-12 h-12 text-blue-500 animate-pulse" />;
      case 'images': return <Palette className="w-12 h-12 text-indigo-500 animate-bounce" />;
      case 'assembling': return <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />;
      case 'done': return <CheckCircle2 className="w-12 h-12 text-green-500" />;
      default: return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          {getIcon()}
        </div>
        
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            {progress.step === 'text' && "Drafting Concepts..."}
            {progress.step === 'images' && "Illustrating Pages..."}
            {progress.step === 'assembling' && "Assembling Book..."}
            {progress.step === 'done' && "Success!"}
          </h3>
          <p className="text-slate-500">{progress.message}</p>
        </div>

        {progress.total > 0 && (
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              {progress.current} of {progress.total} Tasks Complete
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 italic">
            High-quality AI generation takes a few moments. We're crafting professional 300DPI-equivalent line art.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
