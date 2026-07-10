import type { View } from '../types';

interface CtaBannerProps {
  headline: React.ReactNode;
  subtext: string;
  ctaLabel: string;
  ctaView?: View;
  onNavigate?: (view: View) => void;
  className?: string;
}

export function CtaBanner({ headline, subtext, ctaLabel, ctaView, onNavigate, className = '' }: CtaBannerProps) {
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-brown-near via-primary-400 to-primary px-8 py-12 sm:px-12 sm:py-16 ${className}`}>
      <div className="absolute inset-0 sheen" />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h2 className="font-display text-display-md font-bold leading-tight text-white sm:text-display-lg">
          {headline}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-cream-100/90">
          {subtext}
        </p>
        <button
          onClick={() => onNavigate && ctaView && onNavigate(ctaView)}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-medium text-brown-near transition-all duration-150 ease-brand hover:bg-cream-100 active:scale-[0.98]"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
