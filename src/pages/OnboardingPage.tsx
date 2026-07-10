import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  HeartPulse,
  CreditCard,
  Lock,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import type { View, Patient } from '../types';
import { Logo } from '../components/Logo';
import { SecurityBanner, DemoDataNotice } from '../components/SecurityBanner';
import { StripePaymentForm } from '../components/StripePaymentForm';
import { PaymentSplitCard } from '../components/PaymentSplit';
import { CtaBanner } from '../components/CtaBanner';
import { createPatient, insertPayment } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { showToast } from '../components/Toast';

interface OnboardingPageProps {
  onNavigate: (view: View) => void;
}

type Step = 'patient' | 'insurance' | 'payment' | 'complete';

const insuranceTypes = [
  { value: 'Medicare', label: 'Medicare', icon: HeartPulse, desc: 'Federal health program (65+ or disability)' },
  { value: 'Commercial', label: 'Commercial Insurance', icon: ShieldCheck, desc: 'Employer-sponsored or marketplace plan' },
  { value: 'Self-Pay', label: 'Self-Pay', icon: User, desc: 'No insurance — patient pays full cost' },
];

export function OnboardingPage({ onNavigate }: OnboardingPageProps) {
  const [step, setStep] = useState<Step>('patient');
  const [processing, setProcessing] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [insuranceType, setInsuranceType] = useState('Commercial');
  const [planName, setPlanName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [copay, setCopay] = useState('25');
  const [deductibleTotal, setDeductibleTotal] = useState('1500');
  const [deductibleMet, setDeductibleMet] = useState('500');
  const [coinsurance, setCoinsurance] = useState('20');
  const [coverageRate, setCoverageRate] = useState('80');
  const [oopMax, setOopMax] = useState('5000');

  const [prepayAmount, setPrepayAmount] = useState(25);

  const steps: { key: Step; label: string; icon: typeof User }[] = [
    { key: 'patient', label: 'Patient Info', icon: User },
    { key: 'insurance', label: 'Insurance', icon: HeartPulse },
    { key: 'payment', label: 'Payment Method', icon: CreditCard },
    { key: 'complete', label: 'Complete', icon: CheckCircle2 },
  ];
  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const canProceedPatient = fullName.trim() && dob && email.trim() && phone.trim();
  const canProceedInsurance = insuranceType === 'Self-Pay' || (planName.trim() && memberId.trim());

  const handlePatientNext = () => {
    if (!canProceedPatient) {
      showToast('error', 'Please fill in all patient fields');
      return;
    }
    setStep('insurance');
  };

  const handleInsuranceNext = () => {
    if (!canProceedInsurance) {
      showToast('error', 'Please fill in insurance details');
      return;
    }
    setStep('payment');
  };

  const handleOnboardingPayment = async (paymentMethodId: string, cardBrand: string, cardLast4: string) => {
    setProcessing(true);
    try {
      const patient = await createPatient({
        full_name: fullName,
        date_of_birth: dob,
        email,
        phone,
        member_id: insuranceType === 'Self-Pay' ? null : memberId,
        insurance_plan_name: insuranceType === 'Self-Pay' ? 'Self-Pay' : planName,
        insurance_type: insuranceType,
        copay_amount: parseFloat(copay) || 0,
        deductible_total: parseFloat(deductibleTotal) || 0,
        deductible_met: parseFloat(deductibleMet) || 0,
        coinsurance_rate: parseFloat(coinsurance) || 0,
        coverage_rate: insuranceType === 'Self-Pay' ? 0 : parseFloat(coverageRate) || 80,
        out_of_pocket_max: parseFloat(oopMax) || 0,
        stripe_customer_id: `cus_demo_${Date.now()}`,
      });
      setCreatedPatient(patient);

      if (prepayAmount > 0) {
        await insertPayment({
          patient_id: patient.id,
          session_id: null,
          poa_contact_id: null,
          amount: prepayAmount,
          payment_type: 'onboarding_prepay',
          status: 'succeeded',
          stripe_payment_intent_id: paymentMethodId,
          stripe_payment_method_id: paymentMethodId,
          card_brand: cardBrand,
          card_last4: cardLast4,
        });
      }

      setStep('complete');
      showToast('success', 'Patient onboarded successfully');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to onboard patient');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream texture-warm">
      {/* Onboarding header — dark band */}
      <header className="bg-brown-near py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6">
          <button onClick={() => onNavigate({ name: 'home' })} className="flex items-center gap-2 text-sm text-cream-100/80 transition-colors duration-150 ease-brand hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Logo dark showText={false} />
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <div className="eyebrow mb-3 justify-center">Patient Onboarding</div>
          <h1 className="font-display text-display-md font-bold tracking-tight text-brown-dark sm:text-display-lg">
            Register and set up <span className="text-primary">payment</span>
          </h1>
          <p className="mt-2 text-body-lg text-body-muted">Streamlined onboarding for future therapy sessions</p>
        </div>

        {/* Stepper */}
        <div className="mb-10 flex items-center justify-center">
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-150 ease-brand ${
                    i < currentStepIndex
                      ? 'bg-primary text-white'
                      : i === currentStepIndex
                        ? 'bg-primary text-white ring-4 ring-primary-100'
                        : 'bg-cream-100 text-body-muted border border-neutral-border'
                  }`}
                >
                  {i < currentStepIndex ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 w-6 sm:w-12 ${i < currentStepIndex ? 'bg-primary' : 'bg-neutral-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8 flex justify-center gap-6 sm:gap-12">
          {steps.map((s, i) => (
            <div
              key={s.key}
              className={`text-xs font-medium ${i <= currentStepIndex ? 'text-primary' : 'text-body-muted'}`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="card p-6 sm:p-8">
          {step === 'patient' && (
            <div className="animate-slide-up space-y-5">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold text-brown-dark">Patient Information</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="label label-required">Full Legal Name</label>
                  <input className="input" placeholder="Enter patient's full legal name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <label className="label label-required">Date of Birth</label>
                  <input type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div>
                  <label className="label label-required">Phone Number</label>
                  <input type="tel" className="input" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label label-required">Email Address</label>
                  <input type="email" className="input" placeholder="patient@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handlePatientNext} className="btn-primary">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'insurance' && (
            <div className="animate-slide-up space-y-5">
              <div className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold text-brown-dark">Insurance Information</h2>
              </div>

              <div>
                <label className="label">Insurance Type</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {insuranceTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setInsuranceType(t.value)}
                      className={`rounded-2xl border p-4 text-left transition-all duration-150 ease-brand ${
                        insuranceType === t.value
                          ? 'border-primary bg-primary-50 ring-2 ring-primary-100'
                          : 'border-neutral-border hover:border-primary-200'
                      }`}
                    >
                      <t.icon className={`mb-2 h-5 w-5 ${insuranceType === t.value ? 'text-primary' : 'text-body-muted'}`} />
                      <div className="text-sm font-semibold text-brown-dark">{t.label}</div>
                      <div className="text-xs text-body-muted">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {insuranceType !== 'Self-Pay' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label label-required">Plan Name</label>
                    <input className="input" placeholder="Blue Cross Blue Shield PPO" value={planName} onChange={(e) => setPlanName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label label-required">Member ID</label>
                    <input className="input" placeholder="BCBS-998877" value={memberId} onChange={(e) => setMemberId(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Copay Amount ($)</label>
                    <input type="number" className="input" value={copay} onChange={(e) => setCopay(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Coverage Rate (%)</label>
                    <input type="number" className="input" value={coverageRate} onChange={(e) => setCoverageRate(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Annual Deductible ($)</label>
                    <input type="number" className="input" value={deductibleTotal} onChange={(e) => setDeductibleTotal(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Deductible Met ($)</label>
                    <input type="number" className="input" value={deductibleMet} onChange={(e) => setDeductibleMet(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Coinsurance Rate (%)</label>
                    <input type="number" className="input" value={coinsurance} onChange={(e) => setCoinsurance(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Out-of-Pocket Max ($)</label>
                    <input type="number" className="input" value={oopMax} onChange={(e) => setOopMax(e.target.value)} />
                  </div>
                </div>
              )}

              {insuranceType === 'Self-Pay' && (
                <div className="rounded-2xl border border-neutral-border bg-cream-100 p-4 text-sm text-body-muted">
                  <ShieldCheck className="mb-1.5 h-4 w-4 text-primary" />
                  Self-pay patients are responsible for the full session cost. No insurance split will be displayed.
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep('patient')} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button onClick={handleInsuranceNext} className="btn-primary">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && (
            <div className="animate-slide-up space-y-5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold text-brown-dark">Payment Method</h2>
              </div>

              <DemoDataNotice />

              <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                <div className="flex items-start gap-2">
                  <Lock className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                  <div className="text-sm text-brown">
                    <span className="font-semibold text-primary-500">Card on file for future sessions.</span> Your card is tokenized
                    by Stripe — BuoyBots never stores raw card data. You can make immediate payments after onboarding.
                  </div>
                </div>
              </div>

              <div>
                <label className="label">Onboarding Pre-Payment (Optional)</label>
                <p className="mb-2 text-xs text-body-muted">
                  Pre-pay an amount now to cover upcoming session balances. You can also pay later from your dashboard.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 25, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setPrepayAmount(amt)}
                      className={`rounded-full py-2.5 text-sm font-medium transition-all duration-150 ease-brand ${
                        prepayAmount === amt
                          ? 'bg-primary text-white'
                          : 'bg-white text-body border border-neutral-border hover:border-primary-200'
                      }`}
                    >
                      {amt === 0 ? 'Skip' : formatCurrency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {prepayAmount > 0 ? (
                <div className="space-y-4">
                  <PaymentSplitCard
                    totalCharge={prepayAmount}
                    insurancePays={0}
                    patientOwes={prepayAmount}
                    compact
                  />
                  <StripePaymentForm
                    amount={prepayAmount}
                    patientId="onboarding"
                    sessionId={null}
                    poaContactId={null}
                    onSuccess={handleOnboardingPayment}
                    ctaLabel="Complete Onboarding"
                  />
                </div>
              ) : (
                <button
                  onClick={() => handleOnboardingPayment(`pm_demo_${Date.now()}`, 'visa', '4242')}
                  disabled={processing}
                  className="btn-primary w-full"
                >
                  {processing ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Complete Onboarding</>
                  )}
                </button>
              )}

              <div className="flex justify-start">
                <button onClick={() => setStep('insurance')} className="btn-secondary">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && createdPatient && (
            <div className="animate-scale-in space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
                <CheckCircle2 className="h-8 w-8 text-success-500" />
              </div>
              <div>
                <h2 className="font-display text-display-sm font-bold tracking-tight text-brown-dark">Onboarding Complete</h2>
                <p className="mt-1 text-body-lg text-body-muted">
                  {createdPatient.full_name} has been successfully registered.
                </p>
              </div>

              <div className="mx-auto max-w-sm rounded-2xl border border-neutral-border bg-cream-100 p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-body-muted">Patient</span>
                    <span className="font-medium text-brown-dark">{createdPatient.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-muted">Insurance</span>
                    <span className="font-medium text-brown-dark">{createdPatient.insurance_plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-muted">Copay</span>
                    <span className="font-medium text-brown-dark">{formatCurrency(createdPatient.copay_amount)}</span>
                  </div>
                  {prepayAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-body-muted">Pre-Payment</span>
                      <span className="font-medium text-success-700">{formatCurrency(prepayAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  onClick={() => onNavigate({ name: 'patient-dashboard', patientId: createdPatient.id })}
                  className="btn-primary"
                >
                  Go to Patient Dashboard <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => onNavigate({ name: 'home' })} className="btn-secondary">
                  Back to Home
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <SecurityBanner />
        </div>
      </div>

      {/* CTA at the bottom */}
      {step !== 'complete' && (
        <div className="px-6 pb-20">
          <div className="mx-auto max-w-4xl">
            <CtaBanner
              headline={<>Have questions about <span className="text-primary-200">onboarding</span>?</>}
              subtext="Our team can walk you through the patient registration and payment setup process."
              ctaLabel="Let's talk"
              ctaView={{ name: 'admin' }}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
