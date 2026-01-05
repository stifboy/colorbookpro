
import React from 'react';
import { TargetAudience } from '../types';
import { Sparkles, BookOpen, Users, Hash, User } from 'lucide-react';

interface InputFormProps {
  theme: string;
  setTheme: (val: string) => void;
  author: string;
  setAuthor: (val: string) => void;
  audience: TargetAudience;
  setAudience: (val: TargetAudience) => void;
  pageCount: number;
  setPageCount: (val: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const InputForm: React.FC<InputFormProps> = ({
  theme, setTheme, author, setAuthor, audience, setAudience, pageCount, setPageCount, onGenerate, isGenerating
}) => {
  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Sparkles className="text-blue-500" /> Book Settings
      </h2>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <BookOpen size={16} /> Theme or Subject
          </label>
          <input
            type="text"
            placeholder="e.g., Magical Woodland Creatures, Mandala Dreams..."
            className={inputClasses}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
            <User size={16} /> Author Name
          </label>
          <input
            type="text"
            placeholder="Your name or pen name..."
            className={inputClasses}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Users size={16} /> Audience
            </label>
            <select
              className={inputClasses}
              value={audience}
              onChange={(e) => setAudience(e.target.value as TargetAudience)}
            >
              <option value={TargetAudience.KIDS}>Kids (Simple)</option>
              <option value={TargetAudience.ADULTS}>Adults (Detailed)</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Hash size={16} /> Number of Art Pages
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className={inputClasses}
              value={pageCount}
              onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={isGenerating || !theme}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
              isGenerating || !theme
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {isGenerating ? 'Drafting Book...' : 'Generate KDP Coloring Book'}
          </button>
          <p className="text-xs text-slate-400 text-center mt-3 italic">
            * Generated PDF follows Amazon KDP 8.5" x 11" guidelines with safe 0.75" margins.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InputForm;
