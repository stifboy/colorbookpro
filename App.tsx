
import React, { useState, useCallback } from 'react';
import { TargetAudience, ColoringBookData, GenerationProgress } from './types';
import { generateBookMetadata, generateColoringPage } from './services/geminiService';
import { generateKDPPdf } from './services/pdfService';
import InputForm from './components/InputForm';
import BookPreview from './components/BookPreview';
import LoadingOverlay from './components/LoadingOverlay';
import Logo from './components/Logo';
import { Printer, Layout, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [theme, setTheme] = useState('');
  const [author, setAuthor] = useState('');
  const [audience, setAudience] = useState<TargetAudience>(TargetAudience.KIDS);
  const [pageCount, setPageCount] = useState(10);
  const [bookData, setBookData] = useState<ColoringBookData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    step: 'idle',
    total: 0,
    current: 0,
    message: ''
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Step 1: Text Metadata
      setProgress({ step: 'text', total: pageCount + 1, current: 0, message: 'Generating book structure and titles...' });
      const metadata = await generateBookMetadata(theme, audience, author);

      // Step 2: Coloring Pages
      const pages = [];
      for (let i = 0; i < pageCount; i++) {
        setProgress(prev => ({ 
          ...prev, 
          step: 'images', 
          current: i + 1, 
          message: `Drawing page ${i + 1} with AI...` 
        }));
        const page = await generateColoringPage(theme, audience, i);
        pages.push(page);
      }

      // Step 3: Finalize
      setProgress(prev => ({ 
        ...prev, 
        step: 'assembling', 
        current: pageCount + 1, 
        message: 'Finalizing layouts and margins...' 
      }));

      const finalBook: ColoringBookData = {
        title: metadata.title || 'Untitled Book',
        subtitle: metadata.subtitle || 'A Coloring Book',
        author: author || metadata.author || 'AI Artist',
        description: metadata.title || '',
        audience,
        theme,
        pages,
        copyrightText: metadata.copyrightText || '',
        introduction: metadata.introduction || ''
      };

      setBookData(finalBook);
      setProgress(prev => ({ ...prev, step: 'done', message: 'Book generated successfully!' }));
      setTimeout(() => setIsGenerating(false), 1500);

    } catch (err) {
      console.error(err);
      alert("Something went wrong during generation. Please try again.");
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
      link.setAttribute('download', `${bookData.title.replace(/\s+/g, '_')}_KDP_Interior.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1"><Printer size={16} /> KDP Compliant</span>
            <span className="flex items-center gap-1"><Layout size={16} /> 8.5" x 11"</span>
            <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck size={16} /> Commercial Ready</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {!bookData ? (
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mt-8">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                🚀 Powered by Gemini AI
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1]">
                Launch Your <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Coloring Empire
                </span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl">
                Generate professional, high-resolution coloring book interiors for Amazon KDP in seconds. 
                Full PDF automation with margins, bleed considerations, and single-sided layouts.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
                {[
                  { label: "High Resolution", desc: "300 DPI ready" },
                  { label: "Commercial Use", desc: "Full rights" },
                  { label: "KDP Formatted", desc: "8.5\" x 11\" PDF" }
                ].map((feature, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-slate-900 font-bold text-sm">{feature.label}</p>
                    <p className="text-slate-500 text-xs">{feature.desc}</p>
                  </div>
                ))}
              </div>
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
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setBookData(null)}
                className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors"
              >
                ← Back to Editor
              </button>
            </div>
            <BookPreview 
              book={bookData} 
              onDownload={handleDownload}
              isDownloading={isDownloading}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo size="sm" />
          <p className="text-slate-400 text-sm">
            Designed for Kindle Direct Publishing professionals. © {new Date().getFullYear()} AI Publishing Tools.
          </p>
          <div className="flex gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100"></div>
             <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100"></div>
             <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100"></div>
          </div>
        </div>
      </footer>

      {isGenerating && <LoadingOverlay progress={progress} />}
    </div>
  );
};

export default App;
