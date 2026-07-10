import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  HeartPulse,
  Loader2,
  Receipt,
  User,
  Stethoscope,
  Lock,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import type { View, Patient, Session, Payment } from '../types';
import { InsuranceSummary } from '../components/InsuranceSummary';
import { PaymentSplitBar, PaymentSplitCard } from '../components/PaymentSplit';
import { Modal } from '../components/Modal';
import { StripePaymentForm } from '../components/StripePaymentForm';
import { CtaBanner } from '../components/CtaBanner';
import { showToast } from '../components/Toast';
import { fetchPatient, fetchSessions, fetchPayments, insertPayment, updateSessionPaymentStatus } from '../lib/api';
import { formatCurrency, formatDate, formatDateTime, calculateAge, sessionStatusBadge, paymentStatusBadge } from '../lib/format';

interface PatientDashboardProps {
  patientId: string;
  onNavigate: (view: View) => void;
}

export function PatientDashboard({ patientId, onNavigate }: PatientDashboardProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paySession, setPaySession] = useState<Session | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, pays] = await Promise.all([
        fetchPatient(patientId),
        fetchSessions(patientId),
        fetchPayments(patientId),
      ]);
      setPatient(p);
      setSessions(s);
      setPayments(pays);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalOwed = sessions.reduce((sum, s) => sum + s.patient_owes, 0);
  const totalPaid = payments.filter((p) => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, totalOwed - totalPaid);
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const handlePaymentSuccess = useCallback(async (paymentMethodId: string, cardBrand: string, cardLast4: string) => {
    if (!paySession) return;
    try {
      await insertPayment({
        patient_id: patientId,
        session_id: paySession.id,
        poa_contact_id: null,
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
  }, [paySession, patientId, loadData]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 pt-32 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-body-muted" />
        <h2 className="font-display text-xl font-bold text-brown-dark">Patient not found</h2>
        <button onClick={() => onNavigate({ name: 'home' })} className="btn-primary mt-4">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </button>
      </div>
    );
  }

  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="animate-fade-in mx-auto max-w-6xl px-6 pt-32 pb-20">
      <button onClick={() => onNavigate({ name: 'home' })} className="mb-5 inline-flex items-center gap-1.5 text-sm text-body-muted transition-colors duration-150 ease-brand hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </button>

      {/* Patient header — dark band */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-brown-near">
        <div className="flex flex-col gap-4 px-6 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-white">{patient.full_name}</h1>
              <p className="text-sm text-cream-100/80">
                {age ? `${age} years old` : 'DOB unknown'} · {patient.insurance_type} · ID: {patient.member_id ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl bg-white/10 px-5 py-2.5">
              <div className="text-xs text-cream-100/70">Balance Due</div>
              <div className="font-display text-xl font-bold text-primary-200">{formatCurrency(balanceDue)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-2.5">
              <div className="text-xs text-cream-100/70">Total Paid</div>
              <div className="font-display text-xl font-bold text-white">{formatCurrency(totalPaid)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: sessions */}
        <div className="space-y-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 text-xs text-body-muted">
                <Calendar className="h-3.5 w-3.5" /> Upcoming
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-brown-dark">{upcomingSessions.length}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-xs text-body-muted">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-brown-dark">{completedSessions.length}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-xs text-body-muted">
                <Receipt className="h-3.5 w-3.5" /> Total Charges
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-brown-dark">{formatCurrency(totalOwed)}</div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 text-xs text-body-muted">
                <TrendingUp className="h-3.5 w-3.5" /> Coverage
              </div>
              <div className="mt-1 font-display text-2xl font-bold text-primary">{patient.coverage_rate.toFixed(0)}%</div>
            </div>
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-brown-dark">
              <Stethoscope className="h-5 w-5 text-primary" /> Treatment Sessions
            </h2>
            <div className="space-y-3">
              {sessions.length === 0 && (
                <div className="card p-8 text-center text-body-muted">
                  <Calendar className="mx-auto mb-2 h-8 w-8 text-body-muted" />
                  No sessions scheduled yet.
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
                          <span className={`badge ${paymentStatusBadge(session.payment_status)}`}>
                            {session.payment_status === 'paid' && <CheckCircle2 className="h-3 w-3" />}
                            {session.payment_status === 'pending' && <Clock className="h-3 w-3" />}
                            Payment: {session.payment_status}
                          </span>
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
                            <HeartPulse className="h-4 w-4" /> Fully covered by insurance
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {payments.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-brown-dark">
                <Receipt className="h-5 w-5 text-primary" /> Payment History
              </h2>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-neutral-border bg-cream-100 text-left text-xs uppercase tracking-wider text-body-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Card</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                      <th className="px-4 py-3 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-border">
                    {payments.map((p) => (
                      <tr key={p.id} className="transition-colors duration-150 ease-brand hover:bg-cream-100/50">
                        <td className="px-4 py-3 text-body-muted">{formatDateTime(p.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-body">{p.payment_type.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3 text-body-muted">
                          {p.card_brand ? (
                            <span className="inline-flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5" />
                              <span className="capitalize">{p.card_brand}</span> ····{p.card_last4}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-brown-dark">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`badge ${p.status === 'succeeded' ? 'badge-success' : p.status === 'failed' ? 'badge-danger' : 'badge-neutral'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: insurance + summary */}
        <div className="space-y-4">
          <InsuranceSummary patient={patient} detailed />

          <div className="card p-4">
            <h3 className="mb-3 font-display text-sm font-semibold text-brown-dark">Payment Summary</h3>
            <PaymentSplitCard
              totalCharge={totalOwed}
              insurancePays={totalOwed - totalPaid - balanceDue}
              patientOwes={balanceDue}
              amountPaid={totalPaid}
            />
          </div>

          <div className="card p-4">
            <div className="flex items-start gap-2.5">
              <Lock className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
              <div className="text-xs text-body-muted">
                <span className="font-semibold text-body">Secure Payment:</span> All card data is tokenized
                by Stripe. BuoyBots never sees or stores your raw card number, CVC, or full expiration date.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="mt-12">
        <CtaBanner
          headline={<>Need help with your <span className="text-primary-200">payments</span>?</>}
          subtext="Contact our billing team for questions about your session balances or insurance coverage."
          ctaLabel="Get in touch"
          ctaView={{ name: 'admin' }}
          onNavigate={onNavigate}
        />
      </div>

      {/* Payment modal */}
      <Modal
        open={!!paySession}
        onClose={() => setPaySession(null)}
        title="Pay Session Balance"
        subtitle={paySession ? `${paySession.session_type} · ${formatDate(paySession.session_date)}` : ''}
        size="md"
      >
        {paySession && (
          <div className="space-y-4">
            <PaymentSplitCard
              totalCharge={paySession.total_charge}
              insurancePays={paySession.insurance_pays}
              patientOwes={paySession.patient_owes}
            />
            <div className="border-t border-neutral-border pt-4">
              <StripePaymentForm
                amount={paySession.patient_owes}
                patientId={patientId}
                sessionId={paySession.id}
                poaContactId={null}
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
