
import React from 'react';
import { ColoringBookData } from '../types';
import { Download, FileText, Info, CheckCircle } from 'lucide-react';

interface BookPreviewProps {
  book: ColoringBookData;
  onDownload: () => void;
  isDownloading: boolean;
}

const BookPreview: React.FC<BookPreviewProps> = ({ book, onDownload, isDownloading }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Info */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">{book.title}</h2>
          <p className="text-lg text-slate-500 mt-1">{book.subtitle}</p>
          <div className="flex gap-4 mt-3">
            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              By {book.author}
            </span>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              {book.pages.length} Art Pages
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              KDP Ready
            </span>
          </div>
        </div>
        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50"
        >
          <Download size={20} />
          {isDownloading ? 'Generating PDF...' : 'Download KDP Interior (PDF)'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Title & Info Page Preview */}
        <div className="aspect-[8.5/11] bg-white rounded-xl shadow-md border-2 border-slate-200 p-8 relative flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
          <FileText className="text-slate-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-800">Front Matter</h3>
          <p className="text-sm text-slate-500 mt-2">Centered Title & Intro</p>
          <div className="mt-4 flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">
            <CheckCircle size={12} /> Margin Safe
          </div>
        </div>

        {/* Page Previews */}
        {book.pages.map((page, idx) => (
          <div key={page.id} className="group relative">
            <div className="aspect-[8.5/11] bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden relative">
              <img 
                src={page.imageUrl} 
                alt={page.title} 
                className="w-full h-full object-contain p-6"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white to-transparent h-12"></div>
              <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                PAGE {idx + 1}
              </div>
              
              {/* Margin Safety Indicator */}
              <div className="absolute inset-6 border border-dashed border-red-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="absolute -top-6 left-0 text-[10px] font-mono text-red-500 uppercase tracking-tighter">
                  KDP Safe Margin (0.75")
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between px-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Standard Layout</span>
              <Info size={14} className="text-slate-300 cursor-help" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookPreview;
