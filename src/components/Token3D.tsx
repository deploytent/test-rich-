import React from 'react';
import { Crown, Gem, Star, Zap } from 'lucide-react';
import type { TokenColor } from '../types';

export type Token3DSize = 'xs' | 'sm' | 'md' | 'lg' | 'board';

interface Token3DProps {
  color: TokenColor;
  size?: Token3DSize;
  showShadow?: boolean;
  className?: string;
}

const TOKEN_VISUALS: Record<
  TokenColor,
  {
    topLight: string;
    mid: string;
    deep: string;
    rim: string;
    symbolName: string;
    Icon: React.FC<{ className?: string }>;
  }
> = {
  red: {
    topLight: '#FF8A9A',
    mid: '#EF4444',
    deep: '#B91C1C',
    rim: '#881337',
    symbolName: 'มงกุฎ',
    Icon: ({ className }) => <Crown className={className} fill="currentColor" strokeWidth={2} />,
  },
  blue: {
    topLight: '#7DD3FC',
    mid: '#3B82F6',
    deep: '#1D4ED8',
    rim: '#1E3A8A',
    symbolName: 'เพชร',
    Icon: ({ className }) => <Gem className={className} fill="currentColor" fillOpacity={0.28} strokeWidth={2.2} />,
  },
  green: {
    topLight: '#6EE7B7',
    mid: '#10B981',
    deep: '#047857',
    rim: '#064E3B',
    symbolName: 'ดาว',
    Icon: ({ className }) => <Star className={className} fill="currentColor" strokeWidth={2} />,
  },
  yellow: {
    topLight: '#FEF08A',
    mid: '#F59E0B',
    deep: '#D97706',
    rim: '#92400E',
    symbolName: 'สายฟ้า',
    Icon: ({ className }) => <Zap className={className} fill="currentColor" strokeWidth={2} />,
  },
};

const SIZE_CLASSES: Record<
  Token3DSize,
  { box: string; icon: string; rimPx: number; shadowPx: number }
> = {
  xs: {
    box: 'h-4 w-4 border',
    icon: 'h-2.5 w-2.5',
    rimPx: 2,
    shadowPx: 3,
  },
  sm: {
    box: 'h-6 w-6 border-[1.5px]',
    icon: 'h-3.5 w-3.5',
    rimPx: 2.5,
    shadowPx: 5,
  },
  md: {
    box: 'h-8 w-8 border-2',
    icon: 'h-4 w-4',
    rimPx: 3,
    shadowPx: 6,
  },
  lg: {
    box: 'h-10 w-10 border-2',
    icon: 'h-5 w-5',
    rimPx: 4,
    shadowPx: 8,
  },
  board: {
    box: 'h-4 w-4 @[380px]:h-5 @[380px]:w-5 @[460px]:h-7 @[460px]:w-7 border-[1.5px] @[460px]:border-2',
    icon: 'h-2.5 w-2.5 @[380px]:h-3 @[380px]:w-3 @[460px]:h-4 @[460px]:w-4',
    rimPx: 3,
    shadowPx: 6,
  },
};

export const TOKEN_SYMBOL_LABELS: Record<TokenColor, string> = {
  red: 'มงกุฎ',
  blue: 'เพชร',
  green: 'ดาว',
  yellow: 'สายฟ้า',
};

export const Token3D: React.FC<Token3DProps> = ({
  color,
  size = 'md',
  showShadow = false,
  className = '',
}) => {
  const v = TOKEN_VISUALS[color];
  const s = SIZE_CLASSES[size];
  const Icon = v.Icon;

  return (
    <span
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      {showShadow && (
        <span
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[84%] h-[30%] rounded-full bg-slate-900/35 blur-[1.5px] pointer-events-none"
        />
      )}
      <span
        className={`relative inline-flex items-center justify-center rounded-full border-white text-white overflow-hidden ${s.box}`}
        style={{
          background: `radial-gradient(circle at 32% 24%, ${v.topLight} 0%, ${v.mid} 52%, ${v.deep} 100%)`,
          boxShadow: `0 ${s.rimPx}px 0 ${v.rim}, 0 ${s.shadowPx}px ${s.shadowPx + 3}px rgba(15, 23, 42, 0.34), inset 0 1.5px 2px rgba(255, 255, 255, 0.72), inset 0 -2px 3px rgba(0, 0, 0, 0.25)`,
        }}
      >
        {/* Specular dome highlight */}
        <span className="absolute top-[7%] left-[16%] right-[16%] h-[34%] rounded-full bg-gradient-to-b from-white/75 to-white/0 pointer-events-none" />
        {/* Crisp center emblem */}
        <Icon className={`relative z-10 ${s.icon} drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.45)]`} />
      </span>
    </span>
  );
};
