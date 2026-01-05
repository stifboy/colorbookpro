
import React, { useState } from 'react';
import { TargetAudience, ColoringBookData, GenerationProgress } from './types.ts';
import { generateBookMetadata, generateColoringPage } from './services/geminiService.ts';
import { generateKDPPdf } from './services/pdfService.ts';
import InputForm from './components/InputForm.tsx';
import BookPreview from './components/BookPreview.tsx';
import LoadingOverlay from './components/LoadingOverlay.tsx';
import Logo from './components/Logo.tsx';
import { Printer, Layout, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
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
          message: `Drawing page ${i + 1} with Gemini...` 
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
      console.error(err);
      alert("Generation error. Please ensure your API_KEY is correctly configured in your environment variables.");
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
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><Printer size={16} /> KDP Safe</span>
              <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck size={16} /> Commercial Use</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!bookData ? (
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mt-8">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                🎨 AI-Powered KDP Interiors
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1]">
                Create Your <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-hand">
                  Coloring Book
                </span>
                <br />In Seconds
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl">
                Optimized for Amazon KDP with 0.75" safety margins. 
                Generate professional line art interiors with automated single-sided layout logic.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6">
                {[
                  { label: "Pro Margins", desc: "No Cut-offs" },
                  { label: "High Contrast", desc: "Pure Black/White" },
                  { label: "PDF Ready", desc: "8.5\" x 11\"" }
                ].map((feature, i) => (
                  <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center lg:text-left">
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
        </div>
      </footer>

      {isGenerating && <LoadingOverlay progress={progress} />}
    </div>
  );
};

export default App;
