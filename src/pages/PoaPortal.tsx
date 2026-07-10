import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Lock,
  ShieldCheck,
  AlertCircle,
  HeartPulse,
  Calendar,
  FileText,
  CheckCircle2,
  Target,
  Stethoscope,
  User,
  ArrowRight,
} from 'lucide-react';
import type { View, Patient, PoaContact, Session, Payment, TreatmentPlan } from '../types';
import { Logo } from '../components/Logo';
import { SecurityBanner, DemoDataNotice } from '../components/SecurityBanner';
import { PaymentSplitBar, PaymentSplitCard } from '../components/PaymentSplit';
import { InsuranceSummary } from '../components/InsuranceSummary';
import { Modal } from '../components/Modal';
import { StripePaymentForm } from '../components/StripePaymentForm';
import { CtaBanner } from '../components/CtaBanner';
import { showToast } from '../components/Toast';
import { fetchPoaByToken, fetchSessions, fetchPayments, fetchTreatmentPlans, insertPayment, updateSessionPaymentStatus } from '../lib/api';
import { formatCurrency, formatDate, sessionStatusBadge, paymentStatusBadge } from '../lib/format';

interface PoaPortalProps {
  token: string;
  onNavigate: (view: View) => void;
}

type PortalTab = 'overview' | 'sessions' | 'treatment';

export function PoaPortal({ token, onNavigate }: PoaPortalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poa, setPoa] = useState<PoaContact | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [tab, setTab] = useState<PortalTab>('overview');
  const [paySession, setPaySession] = useState<Session | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPoaByToken(token);
      if (!result) {
        setError('This secure link is invalid or has expired. Please contact the clinic for a new link.');
        setLoading(false);
        return;
      }
      setPoa(result.poa);
      setPatient(result.patient);

      const [s, p, tp] = await Promise.all([
        fetchSessions(result.patient.id),
        fetchPayments(result.patient.id),
        fetchTreatmentPlans(result.patient.id),
      ]);
      setSessions(s);
      setPayments(p);
      setTreatmentPlans(tp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portal');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalOwed = sessions.reduce((sum, s) => sum + s.patient_owes, 0);
  const totalPaid = payments.filter((p) => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, totalOwed - totalPaid);

  const handlePaymentSuccess = useCallback(async (paymentMethodId: string, cardBrand: string, cardLast4: string) => {
    if (!paySession || !patient || !poa) return;
    try {
      await insertPayment({
        patient_id: patient.id,
        session_id: paySession.id,
        poa_contact_id: poa.id,
        amount: paySession.patient_owes,
        payment_type: 'one_time',
        status: 'succeeded',
        stripe_payment_intent_id: paymentMethodId,
        stripe_payment_method_id: paymentMethodId,
        card_brand: cardBrand,
        card_last4: cardLast4,
      });
      await updateSessionPaymentStatus(paySession.id, 'paid');
      showToast('success', `Payment of ${formatCurrency(paySession.patient_owes)} succeeded`);
      setPaySession(null);
      await loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to record payment');
    }
  }, [paySession, patient, poa, loadData]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-body-muted">Verifying secure access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-50">
            <AlertCircle className="h-7 w-7 text-danger-700" />
          </div>
          <h1 className="font-display text-xl font-bold text-brown-dark">Access Denied</h1>
          <p className="mt-2 text-sm text-body-muted">{error}</p>
          <button onClick={() => onNavigate({ name: 'home' })} className="btn-secondary mt-5">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!patient || !poa) return null;

  const tabs: { key: PortalTab; label: string; icon: typeof User }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'sessions', label: 'Sessions & Payments', icon: Calendar },
    { key: 'treatment', label: 'Treatment Plans', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* POA Portal Header — dark band */}
      <header className="bg-brown-near text-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <div className="flex items-center justify-between">
            <Logo dark />
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-200" />
              Secure POA Portal
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-cream-100/70">You are viewing as Power of Attorney for</p>
                <h1 className="font-display text-display-sm font-bold tracking-tight text-white">{patient.full_name}</h1>
              </div>
              <div className="flex gap-3">
                <div className="rounded-2xl bg-white/10 px-5 py-2.5">
                  <div className="text-xs text-cream-100/70">Outstanding Balance</div>
                  <div className="font-display text-xl font-bold text-primary-200">{formatCurrency(balanceDue)}</div>
                </div>
                <div className="rounded-2xl bg-white/10 px-5 py-2.5">
                  <div className="text-xs text-cream-100/70">Paid to Date</div>
                  <div className="font-display text-xl font-bold text-white">{formatCurrency(totalPaid)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Security notice */}
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3">
          <Lock className="h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-xs text-brown">
            <span className="font-semibold text-primary-500">Secure session:</span> You are {poa.full_name} ({poa.relationship}).
            This link is specific to you and expires {poa.token_expires_at ? formatDate(poa.token_expires_at) : 'soon'}.
            Do not share this link with others.
          </p>
        </div>

        <DemoDataNotice className="mb-5" />

        {/* Tabs */}
        <div className="mb-5 flex gap-1 border-b border-neutral-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-brand ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-body-muted hover:text-body'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="animate-fade-in space-y-5">
            {/* Light + dark card pairing */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Dark card */}
              <div className="card-dark p-4">
                <div className="mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary-200" />
                  <h3 className="text-sm font-semibold text-white">Patient Information</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cream-100/60">Name</span>
                    <span className="font-medium text-white">{patient.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-100/60">Insurance</span>
                    <span className="font-medium text-white">{patient.insurance_plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-100/60">Member ID</span>
                    <span className="font-medium text-white">{patient.member_id ?? '—'}</span>
                  </div>
                </div>
              </div>
              {/* Light card */}
              <div className="card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-brown-dark">Insurance Coverage</h3>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-body-muted">Copay</span>
                    <span className="font-medium text-brown-dark">{formatCurrency(patient.copay_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-muted">Coverage Rate</span>
                    <span className="font-medium text-primary">{patient.coverage_rate.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-muted">Deductible</span>
                    <span className="font-medium text-brown-dark">
                      {formatCurrency(patient.deductible_met)} / {formatCurrency(patient.deductible_total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <InsuranceSummary patient={patient} detailed />

            {treatmentPlans.length > 0 && (
              <div className="card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-brown-dark">Active Treatment Plan</h3>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-brown-dark">{treatmentPlans[0].title}</h4>
                  <p className="text-sm text-body-muted">{treatmentPlans[0].diagnosis}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="badge-primary">Started {formatDate(treatmentPlans[0].start_date)}</span>
                    <span className="badge-neutral">Est. end {formatDate(treatmentPlans[0].estimated_end_date)}</span>
                    <span className="badge-neutral">{treatmentPlans[0].frequency}</span>
                  </div>
                </div>
                <button
                  onClick={() => setTab('treatment')}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors duration-150 ease-brand hover:text-primary-400"
                >
                  View full plan <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {balanceDue > 0 && (
              <div className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-brown-dark">Outstanding Balance</h3>
                    <p className="text-sm text-body-muted">Pay session balances on behalf of {patient.full_name}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl font-bold text-primary-500">{formatCurrency(balanceDue)}</div>
                    <button onClick={() => setTab('sessions')} className="mt-1 text-sm font-medium text-primary hover:text-primary-400">
                      Pay now <ArrowRight className="inline h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions tab */}
        {tab === 'sessions' && (
          <div className="animate-fade-in space-y-4">
            {sessions.length === 0 && (
              <div className="card p-8 text-center text-body-muted">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-body-muted" />
                No sessions on record.
              </div>
            )}
            {sessions.map((session) => {
              const sessionPayments = payments.filter((p) => p.session_id === session.id && p.status === 'succeeded');
              const amountPaid = sessionPayments.reduce((sum, p) => sum + p.amount, 0);
              const remaining = Math.max(0, session.patient_owes - amountPaid);
              return (
                <div key={session.id} className="card p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${sessionStatusBadge(session.status)}`}>{session.status}</span>
                        <span className={`badge ${paymentStatusBadge(session.payment_status)}`}>Payment: {session.payment_status}</span>
                        <span className="text-sm text-body-muted">{formatDate(session.session_date)}</span>
                      </div>
                      <h3 className="mt-2 font-display font-semibold text-brown-dark">{session.session_type}</h3>
                      <p className="text-sm text-body-muted">{session.provider}</p>
                      {session.notes && <p className="mt-1 text-sm text-body-muted">{session.notes}</p>}
                    </div>
                    <div className="sm:w-64">
                      <PaymentSplitBar
                        totalCharge={session.total_charge}
                        insurancePays={session.insurance_pays}
                        patientOwes={session.patient_owes}
                        amountPaid={amountPaid}
                      />
                      {remaining > 0 && session.status !== 'cancelled' && (
                        <button
                          onClick={() => setPaySession(session)}
                          className="btn-primary mt-3 w-full text-sm"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Pay {formatCurrency(remaining)}
                        </button>
                      )}
                      {remaining === 0 && session.patient_owes > 0 && (
                        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-success-50 py-2 text-sm font-medium text-success-700">
                          <CheckCircle2 className="h-4 w-4" /> Paid in full
                        </div>
                      )}
                      {session.patient_owes === 0 && (
                        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-primary-50 py-2 text-sm font-medium text-primary">
                          <HeartPulse className="h-4 w-4" /> Fully covered
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Treatment plans tab */}
        {tab === 'treatment' && (
          <div className="animate-fade-in space-y-4">
            {treatmentPlans.length === 0 && (
              <div className="card p-8 text-center text-body-muted">
                <FileText className="mx-auto mb-2 h-8 w-8 text-body-muted" />
                No treatment plans on record.
              </div>
            )}
            {treatmentPlans.map((plan) => (
              <div key={plan.id} className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-h4 font-bold text-brown-dark">{plan.title}</h3>
                    <p className="mt-0.5 text-sm text-body-muted">{plan.diagnosis}</p>
                  </div>
                  <span className={`badge ${plan.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                    {plan.status}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="badge-primary">
                    <Calendar className="h-3 w-3" /> {formatDate(plan.start_date)} — {formatDate(plan.estimated_end_date)}
                  </span>
                  <span className="badge-neutral">
                    <Stethoscope className="h-3 w-3" /> {plan.frequency}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-body">
                    <Target className="h-4 w-4 text-primary" /> Treatment Goals
                  </div>
                  <ul className="space-y-1.5">
                    {plan.goals.map((goal, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-body-muted">
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            <div className="rounded-2xl border border-neutral-border bg-cream-100 p-4">
              <p className="text-xs text-body-muted">
                <span className="font-semibold text-body">Future phases:</span> This portal will be extended
                to include lab results, consent management, and secure messaging with the care team.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8">
          <SecurityBanner />
        </div>
      </div>

      {/* CTA Banner */}
      <div className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <CtaBanner
            headline={<>Questions about your <span className="text-primary-200">loved one's care</span>?</>}
            subtext="Reach out to the clinic for details about treatment plans or billing questions."
            ctaLabel="Get in touch"
            ctaView={{ name: 'home' }}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* Payment modal */}
      <Modal
        open={!!paySession}
        onClose={() => setPaySession(null)}
        title="Pay on Behalf of Patient"
        subtitle={paySession ? `${paySession.session_type} · ${formatDate(paySession.session_date)}` : ''}
        size="md"
      >
        {paySession && (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-2xl border border-primary-100 bg-primary-50 px-3 py-2.5">
              <User className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
              <p className="text-xs text-brown">
                You are paying as <span className="font-semibold text-primary-500">{poa.full_name}</span> ({poa.relationship})
                on behalf of <span className="font-semibold text-primary-500">{patient.full_name}</span>.
              </p>
            </div>
            <PaymentSplitCard
              totalCharge={paySession.total_charge}
              insurancePays={paySession.insurance_pays}
              patientOwes={paySession.patient_owes}
            />
            <div className="border-t border-neutral-border pt-4">
              <StripePaymentForm
                amount={paySession.patient_owes}
                patientId={patient.id}
                sessionId={paySession.id}
                poaContactId={poa.id}
                onSuccess={handlePaymentSuccess}
                onCancel={() => setPaySession(null)}
                ctaLabel="Pay Now"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
