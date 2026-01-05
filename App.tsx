
import React, { useState, useEffect } from 'react';
import { TargetAudience, ColoringBookData, GenerationProgress } from './types';
import { generateBookMetadata, generateColoringPage } from './services/geminiService';
import { generateKDPPdf } from './services/pdfService';
import InputForm from './components/InputForm';
import BookPreview from './components/BookPreview';
import LoadingOverlay from './components/LoadingOverlay';
import Logo from './components/Logo';
import { Printer, ShieldCheck, Key, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); // Assume true initially to prevent layout shift
  const [theme, setTheme] = useState('');
  const [author, setAuthor] = useState('');
  const [audience, setAudience] = useState<TargetAudience>(TargetAudience.KIDS);
  const [pageCount, setPageCount] = useState(5);
  const [bookData, setBookData] = useState<ColoringBookData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    step: 'idle',
    total: 0,
    current: 0,
    message: ''
  });

  // Check for API key presence on mount
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      const envKey = process?.env?.API_KEY;
      
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const selected = await aistudio.hasSelectedApiKey();
        // If aistudio is present, prioritize its state. If not, fallback to process.env
        setHasApiKey(selected || !!envKey);
      } else {
        setHasApiKey(!!envKey);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      // Per instructions: assume success after triggering to mitigate race conditions
      setHasApiKey(true);
    } else {
      alert("This environment does not support dynamic key selection. Please ensure API_KEY is set in your build environment.");
    }
  };

  const handleGenerate = async () => {
    // Final check before starting
    if (!process.env.API_KEY && !hasApiKey) {
      alert("Please click the 'Connect API Key' button first to link your Google Cloud project.");
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
          message: `Drawing page ${i + 1} with Gemini Pro...` 
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
        copyrightText: metadata.copyrightText || `© ${new Date().getFullYear()} ${author || 'AI Artist'}. All rights reserved.`,
        introduction: metadata.introduction || 'Welcome to your artistic journey.'
      };

      setBookData(finalBook);
      setProgress(prev => ({ ...prev, step: 'done', message: 'Book generated successfully!' }));
      setTimeout(() => setIsGenerating(false), 1200);

    } catch (err: any) {
      console.error("Gemini Generation Error:", err);
      
      // Handle the case where the key is invalid or not found
      if (err?.message?.includes("Requested entity was not found") || err?.message?.includes("API Key must be set")) {
        setHasApiKey(false);
        alert("Your API Key session has expired or is invalid. Please click 'Connect API Key' to reconnect.");
      } else {
        alert(`Generation Error: ${err?.message || "An unexpected error occurred. Please check your console."}`);
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
            {!hasApiKey ? (
              <button 
                onClick={handleConnectKey}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
              >
                <Key size={16} /> Connect API Key
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Printer size={16} /> KDP Safe</span>
                <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck size={16} /> Commercial Use</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!hasApiKey && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4 text-amber-800 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="shrink-0" />
            <div className="text-sm">
              <p className="font-bold">API Key Required</p>
              <p>You must click <strong>"Connect API Key"</strong> in the top right to link a paid Google Cloud project. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline font-bold">Billing setup info</a>.</p>
            </div>
          </div>
        )}

        {!bookData ? (
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mt-8">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                🎨 Professional KDP Interiors
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1]">
                Generate Your <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-hand">
                  Coloring Book
                </span>
                <br />In Seconds
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl">
                Amazon KDP ready with 0.75" safety margins. Create crisp, high-resolution line art interiors for kids or adults.
              </p>
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
            Built for Authors & Illustrators. © {new Date().getFullYear()} ColorBook Pro.
          </p>
        </div>
      </footer>

      {isGenerating && <LoadingOverlay progress={progress} />}
    </div>
  );
};

export default App;
