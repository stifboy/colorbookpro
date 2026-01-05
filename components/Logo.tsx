
import React from 'react';
import { Palette, BookOpen } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  const containerSize = size === 'sm' ? "p-1.5" : size === 'lg' ? "p-3" : "p-2";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative group`}>
        <div className={`absolute inset-0 bg-blue-600 rounded-lg blur-md opacity-20 group-hover:opacity-40 transition-opacity`}></div>
        <div className={`${containerSize} bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white shadow-lg relative z-10 flex items-center justify-center overflow-hidden`}>
          <BookOpen size={iconSize} className="relative z-10" />
          <div className="absolute -bottom-1 -right-1 opacity-40">
            <Palette size={iconSize * 0.8} />
          </div>
        </div>
      </div>
      <h1 className={`font-black tracking-tight text-slate-800 ${size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl'}`}>
        ColorBook <span className="text-blue-600">Pro</span>
      </h1>
    </div>
  );
};

export default Logo;
