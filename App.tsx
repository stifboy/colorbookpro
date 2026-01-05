
import React, { useState, useEffect } from 'react';
import { TargetAudience, ColoringBookData, GenerationProgress } from './types.ts';
import { generateBookMetadata, generateColoringPage } from './services/geminiService.ts';
import { generateKDPPdf } from './services/pdfService.ts';
import InputForm from './components/InputForm.tsx';
import BookPreview from './components/BookPreview.tsx';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import Logo from './components/Logo.tsx';
import { Printer, Layout, ShieldCheck, Key, AlertCircle } from 'lucide-react';

declare global {
  // Fix: Use the global AIStudio type instead of defining an inline literal that conflicts with the environment's definition.
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [theme, setTheme] = useState('');
  const [author, setAuthor] = useState('');
  const [audience, setAudience] = useState<TargetAudience>(TargetAudience.KIDS);
  const [pageCount, setPageCount] = useState(5);
  const [bookData, setBookData] = useState<ColoringBookData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [progress, setProgress] = useState<GenerationProgress>({
    step: 'idle',
    total: 0,
    current: 0,
    message: ''
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      // Trigger the key selection dialog.
      await window.aistudio.openSelectKey();
      // Assume success to avoid race conditions with hasSelectedApiKey() immediately after.
      setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
    if (!hasApiKey) {
      await handleSelectKey();
      return;
    }

    setIsGenerating(true);
    try {
      setProgress({ step: 'text', total: pageCount + 1, current: 0, message: 'Drafting book structure...' });
      const metadata = await generateBookMetadata(theme, audience, author);

      const pages = [];
      for (let i = 0; i < pageCount; i++) {
        setProgress(prev => ({ 
          ...prev, 
          step: 'images', 
          current: i + 1, 
          message: `Drawing page ${i + 1} with Gemini 3 Pro...` 
        }));
        const page = await generateColoringPage(theme, audience, i);
        pages.push(page);
      }

      setProgress(prev => ({ 
        ...prev, 
        step: 'assembling', 
        current: pageCount + 1, 
        message: 'Formatting PDF with KDP safe margins...' 
      }));

      const finalBook: ColoringBookData = {
        title: metadata.title || 'ColorBook Masterpiece',
        subtitle: metadata.subtitle || 'A Professional Coloring Experience',
        author: author || metadata.author || 'AI Artist',
        description: metadata.title || '',
        audience,
        theme,
        pages,
        copyrightText: metadata.copyrightText || `© ${new Date().getFullYear()} ${author}. All rights reserved.`,
        introduction: metadata.introduction || 'Welcome to your artistic journey.'
      };

      setBookData(finalBook);
      setProgress(prev => ({ ...prev, step: 'done', message: 'Book generated successfully!' }));
      setTimeout(() => setIsGenerating(false), 1200);

    } catch (err: any) {
      console.error(err);
      // Handle the case where the key might be invalid or project missing.
      if (err.message?.includes("Requested entity was not found")) {
        setHasApiKey(false);
        alert("API connection issue. Please re-select your Gemini API key.");
      } else {
        alert("Generation error. Ensure you have an active Gemini API key selected.");
      }
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!bookData) return;
    setIsDownloading(true);
    try {
      const blob = await generateKDPPdf(bookData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bookData.title.replace(/\s+/g, '_')}_KDP.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {!hasApiKey && (
              <button 
                onClick={handleSelectKey}
                className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-bold border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <Key size={16} /> Connect API
              </button>
            )}
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Printer size={16} /> KDP Safe</span>
              <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck size={16} /> Commercial</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!bookData ? (
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mt-8">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                🎨 Gemini 3 Pro Generation
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1]">
                Launch Your <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-hand">
                  KDP Coloring 
                </span>
                <br />Business
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl">
                The only generator with built-in Amazon KDP margin safety (0.75"). 
                Generate intricate line art interiors with single-sided layout automation.
              </p>
              
              {!hasApiKey && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 max-w-lg">
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-bold text-sm">API Key Required</p>
                    <p className="text-amber-700 text-xs">To use Pro-tier image generation, you must connect a paid Gemini API key from a project with billing enabled.</p>
                    <button onClick={handleSelectKey} className="mt-2 text-amber-900 text-xs font-black underline">Connect Now →</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 w-full">
              <InputForm
                theme={theme}
                setTheme={setTheme}
                author={author}
                setAuthor={setAuthor}
                audience={audience}
                setAudience={setAudience}
                pageCount={pageCount}
                setPageCount={setPageCount}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <button 
              onClick={() => setBookData(null)}
              className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors"
            >
              ← Back to Editor
            </button>
            <BookPreview 
              book={bookData} 
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo size="sm" />
          <p className="text-slate-400 text-sm italic">
            Automating KDP Interior Design. © {new Date().getFullYear()} ColorBook Pro.
          </p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-slate-400 text-xs hover:underline">Billing Docs</a>
        </div>
      </footer>

      {isGenerating && <LoadingOverlay progress={progress} />}
    </div>
  );
};

export default App;
