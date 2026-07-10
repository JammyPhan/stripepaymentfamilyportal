export function Logo({ className = '', showText = true, dark = false }: { className?: string; showText?: boolean; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M12 4C12 4 7 8.5 7 14a5 5 0 0 0 10 0C17 8.5 12 4 12 4Z" fill="white" fillOpacity="0.95" />
          <circle cx="12" cy="13" r="2" fill="#CB550B" />
        </svg>
      </div>
      {showText && (
        <span className={`font-display text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-brown-dark'}`}>
          BuoyBots
        </span>
      )}
    </div>
  );
}
