import { ShieldCheck, Lock, Eye, AlertTriangle } from 'lucide-react';

export function SecurityBanner({ dark = false }: { dark?: boolean }) {
  const baseColor = dark ? 'text-cream-100/70' : 'text-body-muted';
  const iconColor = dark ? 'text-primary-200' : 'text-primary';
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs ${baseColor}`}>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className={`h-3.5 w-3.5 ${iconColor}`} />
        HIPAA-Compliant Demo
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Lock className={`h-3.5 w-3.5 ${iconColor}`} />
        PCI-DSS via Stripe
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Eye className={`h-3.5 w-3.5 ${iconColor}`} />
        Sandbox Data Only
      </span>
      <span className="inline-flex items-center gap-1.5">
        <AlertTriangle className={`h-3.5 w-3.5 ${iconColor}`} />
        No Real PHI
      </span>
    </div>
  );
}

export function DemoDataNotice({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  if (dark) {
    return (
      <div className={`flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 ${className}`}>
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-primary-200 mt-0.5" />
        <div className="text-sm text-cream-100/90">
          <span className="font-semibold text-primary-200">Demo Environment.</span>{' '}
          All data is synthetic sandbox data. No real payments are processed and no real PHI is stored.
        </div>
      </div>
    );
  }
  return (
    <div className={`flex items-start gap-2.5 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 ${className}`}>
      <AlertTriangle className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
      <div className="text-sm text-brown">
        <span className="font-semibold text-primary-500">Demo Environment.</span>{' '}
        All data is synthetic sandbox data. No real payments are processed and no real PHI is stored.
      </div>
    </div>
  );
}
