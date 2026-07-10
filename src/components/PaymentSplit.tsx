import { formatCurrency } from '../lib/format';

interface PaymentSplitProps {
  totalCharge: number;
  insurancePays: number;
  patientOwes: number;
  amountPaid?: number;
  compact?: boolean;
}

export function PaymentSplitBar({ totalCharge, insurancePays, patientOwes, amountPaid = 0 }: PaymentSplitProps) {
  const insurancePct = totalCharge > 0 ? (insurancePays / totalCharge) * 100 : 0;
  const patientPct = totalCharge > 0 ? (patientOwes / totalCharge) * 100 : 0;
  const paidPct = totalCharge > 0 ? (amountPaid / totalCharge) * 100 : 0;
  const remaining = Math.max(0, patientOwes - amountPaid);

  return (
    <div>
      <div className="flex h-8 overflow-hidden rounded-full">
        <div
          className="flex items-center justify-center bg-primary text-xs font-medium text-white transition-all duration-300 ease-brand"
          style={{ width: `${insurancePct}%` }}
          title={`Insurance: ${formatCurrency(insurancePays)}`}
        >
          {insurancePct > 15 && `${insurancePct.toFixed(0)}%`}
        </div>
        <div
          className="flex items-center justify-center bg-primary-100 text-xs font-medium text-primary-500 transition-all duration-300 ease-brand"
          style={{ width: `${patientPct}%` }}
          title={`Patient: ${formatCurrency(patientOwes)}`}
        >
          {patientPct > 15 && `${patientPct.toFixed(0)}%`}
        </div>
      </div>
      {amountPaid > 0 && (
        <div className="mt-1 flex h-2 overflow-hidden rounded-b-full">
          <div
            className="bg-success-500 transition-all duration-300 ease-brand"
            style={{ width: `${paidPct}%` }}
          />
        </div>
      )}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          <span className="text-body-muted">Insurance: <span className="font-medium text-body">{formatCurrency(insurancePays)}</span></span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary-100" />
          <span className="text-body-muted">Patient: <span className="font-medium text-body">{formatCurrency(patientOwes)}</span></span>
        </span>
        {amountPaid > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-success-500" />
            <span className="text-body-muted">Paid: <span className="font-medium text-success-700">{formatCurrency(amountPaid)}</span></span>
          </span>
        )}
        {remaining > 0 && (
          <span className="ml-auto font-medium text-primary-500">
            Balance Due: {formatCurrency(remaining)}
          </span>
        )}
      </div>
    </div>
  );
}

export function PaymentSplitCard({ totalCharge, insurancePays, patientOwes, amountPaid = 0, compact = false }: PaymentSplitProps) {
  const remaining = Math.max(0, patientOwes - amountPaid);
  return (
    <div className={`rounded-2xl border border-neutral-border bg-cream-100 ${compact ? 'p-3' : 'p-4'}`}>
      <div className={`mb-3 font-display font-semibold text-brown-dark ${compact ? 'text-sm' : 'text-base'}`}>Payment Breakdown</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-body-muted">Total Charge</span>
          <span className="font-medium text-body">{formatCurrency(totalCharge)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-body-muted">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            Insurance Pays
          </span>
          <span className="font-medium text-primary">-{formatCurrency(insurancePays)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-2 text-body-muted">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary-100" />
            Patient Owes
          </span>
          <span className="font-medium text-primary-500">{formatCurrency(patientOwes)}</span>
        </div>
        {amountPaid > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center gap-2 text-body-muted">
              <span className="h-2.5 w-2.5 rounded-sm bg-success-500" />
              Already Paid
            </span>
            <span className="font-medium text-success-700">-{formatCurrency(amountPaid)}</span>
          </div>
        )}
        <div className="border-t border-neutral-border pt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-body">Balance Due</span>
            <span className={`font-display font-bold ${remaining > 0 ? 'text-primary-500' : 'text-success-700'}`}>
              {formatCurrency(remaining)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
