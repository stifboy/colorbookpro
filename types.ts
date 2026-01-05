
export enum TargetAudience {
  KIDS = 'Kids',
  ADULTS = 'Adults'
}

export interface ColoringPage {
  id: string;
  title: string;
  imageUrl: string;
  prompt: string;
}

export interface ColoringBookData {
  title: string;
  subtitle: string;
  author: string;
  description: string;
  audience: TargetAudience;
  theme: string;
  pages: ColoringPage[];
  copyrightText: string;
  introduction: string;
}

export interface GenerationProgress {
  step: 'idle' | 'text' | 'images' | 'assembling' | 'done';
  total: number;
  current: number;
  message: string;
}
