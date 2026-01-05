
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
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); 
  const [isAIStudio, setIsAIStudio] = useState<boolean>(false);
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

  useEffect(() => {
    const checkEnvironment = async () => {
      const aistudio = (window as any).aistudio;
      const envKey = !!process.env.API_KEY;
      
      // Only trigger the "Connect" workflow if we are in an environment that explicitly supports it
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        setIsAIStudio(true);
        const selected = await aistudio.hasSelectedApiKey();
        setHasApiKey(selected || envKey);
      } else {
        setIsAIStudio(false);
        setHasApiKey(envKey);
      }
    };
    checkEnvironment();
  }, []);

  const handleConnectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerate = async () => {
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
      const errorMsg = err?.message || "";
      
      // Handle authentication failures by prompting for a key refresh if in AI Studio
      if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API Key") || errorMsg.includes("401") || errorMsg.includes("403")) {
        if (isAIStudio) {
          setHasApiKey(false);
        }
        alert("Authentication Failed: Please ensure your API_KEY is correctly set in your environment.");
      } else {
        alert(`Generation Error: ${errorMsg || "An unexpected error occurred."}`);
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
            {isAIStudio && !hasApiKey ? (
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
        {isAIStudio && !hasApiKey && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-4 text-amber-800 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="shrink-0" />
            <div className="text-sm">
              <p className="font-bold">API Key Selection Required</p>
              <p>Generation requires a paid project key. Click <strong>Connect API Key</strong> in the header to link your project.</p>
            </div>
          </div>
        )}

        {!bookData ? (
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mt-8">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                🎨 AI-Powered KDP Interiors
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1]">
                Generate Your <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-hand">
                  Coloring Book
                </span>
                <br />In Seconds
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl">
                Amazon KDP ready with industry-standard 0.75" safety margins. Create crisp, high-resolution line art interiors for kids or adults.
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
          <p className="text-slate-400 text-sm italic text-center md:text-left">
            Empowering Independent Publishers. <br className="md:hidden" /> © {new Date().getFullYear()} ColorBook Pro.
          </p>
        </div>
      </footer>

      {isGenerating && <LoadingOverlay progress={progress} />}
    </div>
  );
};

export default App;
