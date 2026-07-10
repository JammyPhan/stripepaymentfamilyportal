import { Shield, HeartPulse, Building2, User } from 'lucide-react';
import type { Patient } from '../types';
import { formatCurrency } from '../lib/format';

export function InsuranceSummary({ patient, detailed = false }: { patient: Patient; detailed?: boolean }) {
  const deductibleRemaining = Math.max(0, patient.deductible_total - patient.deductible_met);
  const deductiblePct = patient.deductible_total > 0 ? (patient.deductible_met / patient.deductible_total) * 100 : 100;

  const typeIcon = {
    Medicare: <HeartPulse className="h-4 w-4" />,
    Commercial: <Building2 className="h-4 w-4" />,
    'Self-Pay': <User className="h-4 w-4" />,
  }[patient.insurance_type] ?? <Shield className="h-4 w-4" />;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-50 text-primary">
            {typeIcon}
          </div>
          <div>
            <div className="text-sm font-semibold text-brown-dark">{patient.insurance_plan_name ?? 'No Insurance'}</div>
            <div className="text-xs text-body-muted">{patient.insurance_type} · ID: {patient.member_id ?? '—'}</div>
          </div>
        </div>
        <span className="badge-primary">{patient.insurance_type}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-cream-100 p-3">
          <div className="text-xs text-body-muted">Copay</div>
          <div className="font-display text-lg font-bold text-brown-dark">{formatCurrency(patient.copay_amount)}</div>
        </div>
        <div className="rounded-xl bg-cream-100 p-3">
          <div className="text-xs text-body-muted">Coverage Rate</div>
          <div className="font-display text-lg font-bold text-primary">{patient.coverage_rate.toFixed(0)}%</div>
        </div>
        <div className="rounded-xl bg-cream-100 p-3">
          <div className="text-xs text-body-muted">Coinsurance</div>
          <div className="font-display text-lg font-bold text-brown-dark">{patient.coinsurance_rate.toFixed(0)}%</div>
        </div>
        <div className="rounded-xl bg-cream-100 p-3">
          <div className="text-xs text-body-muted">Out-of-Pocket Max</div>
          <div className="font-display text-lg font-bold text-brown-dark">{formatCurrency(patient.out_of_pocket_max)}</div>
        </div>
      </div>

      {detailed && patient.deductible_total > 0 && (
        <div className="mt-3 rounded-xl border border-neutral-border p-3">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-body">Annual Deductible</span>
            <span className="text-body-muted">
              {formatCurrency(patient.deductible_met)} / {formatCurrency(patient.deductible_total)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300 ease-brand"
              style={{ width: `${deductiblePct}%` }}
            />
          </div>
          <div className="mt-1.5 text-xs text-body-muted">
            {deductibleRemaining > 0
              ? `${formatCurrency(deductibleRemaining)} remaining before coverage begins`
              : 'Deductible met — coverage active'}
          </div>
        </div>
      )}
    </div>
  );
}
