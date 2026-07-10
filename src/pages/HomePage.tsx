import {
  ShieldCheck,
  CreditCard,
  Users,
  MessageSquare,
  HeartPulse,
  ArrowRight,
  Lock,
  CheckCircle2,
  Stethoscope,
  Bell,
  FileText,
  Building2,
} from 'lucide-react';
import type { View } from '../types';
import { CtaBanner } from '../components/CtaBanner';
import { SecurityBanner } from '../components/SecurityBanner';
import { DemoDataNotice } from '../components/SecurityBanner';

interface HomePageProps {
  onNavigate: (view: View) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const features = [
    {
      icon: CreditCard,
      title: 'Secure Payment Processing',
      desc: 'Stripe-powered card tokenization for one-time and recurring payments. PCI-compliant by design.',
    },
    {
      icon: HeartPulse,
      title: 'Insurance Display',
      desc: 'Pre-calculated copay, deductible, and coverage details shown at every payment step.',
    },
    {
      icon: Users,
      title: 'POA Communication Portal',
      desc: 'Branded, token-secured portal for family members and Power of Attorney to pay and view plans.',
    },
    {
      icon: MessageSquare,
      title: 'SMS Notifications',
      desc: 'Automated Twilio reminders with session-specific links sent directly to patients and POAs.',
    },
  ];

  const steps = [
    { icon: Users, title: 'Patient Onboarding', desc: 'Register and enter card details via Stripe Elements' },
    { icon: HeartPulse, title: 'Insurance Verified', desc: 'Copay, deductible, and coverage pre-calculated' },
    { icon: CreditCard, title: 'Payment Ready', desc: 'Immediate payment capability after onboarding' },
    { icon: Bell, title: 'POA Notified', desc: 'Secure link sent to family for payments and plans' },
  ];

  const demoPatients = [
    { name: 'Margaret Chen', type: 'Medicare', copay: '$20', id: 'a1b2c3d4-0001-4000-8000-000000000001' },
    { name: 'Robert Williams', type: 'Commercial PPO', copay: '$35', id: 'a1b2c3d4-0001-4000-8000-000000000002' },
    { name: 'Dorothy Patterson', type: 'Medicare Advantage', copay: '$15', id: 'a1b2c3d4-0001-4000-8000-000000000003' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero — cream background, large editorial type */}
      <section className="relative overflow-hidden bg-cream pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 texture-warm" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="eyebrow mb-5">Prototype · Ready for Stakeholder Review</div>
              <h1 className="font-display text-display-xl font-bold leading-tight text-brown-dark text-balance">
                Patient Payments &<br />
                <span className="text-primary">POA Communication</span>
              </h1>
              <p className="mt-6 max-w-lg text-body-lg text-body">
                A secure, HIPAA-compliant payment and communication platform connecting patients,
                families, and providers. Streamline collections while keeping loved ones informed.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => onNavigate({ name: 'onboarding' })}
                  className="btn-primary"
                >
                  Start Patient Onboarding
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onNavigate({ name: 'admin' })}
                  className="btn-secondary"
                >
                  <Stethoscope className="h-4 w-4" />
                  Clinician Dashboard
                </button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-body-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-primary" /> PCI-DSS Compliant
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-primary" /> HIPAA & HITECH
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Sandbox Data
                </span>
              </div>
            </div>

            {/* Hero visual: payment split demo card */}
            <div className="relative">
              <div className="rounded-3xl border border-neutral-border bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-body-muted">Session Payment</div>
                    <div className="font-display text-lg font-semibold text-brown-dark">Physical Therapy · Jul 10</div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                    <HeartPulse className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-body-muted">Total Charge</span>
                    <span className="font-medium text-body">$150.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-body-muted">
                      <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Insurance (80%)
                    </span>
                    <span className="font-medium text-primary">-$120.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="inline-flex items-center gap-2 text-body-muted">
                      <span className="h-2.5 w-2.5 rounded-sm bg-primary-100" /> Patient Owes
                    </span>
                    <span className="font-medium text-primary-500">$30.00</span>
                  </div>
                </div>
                <div className="mb-4 flex h-8 overflow-hidden rounded-full">
                  <div className="flex items-center justify-center bg-primary text-xs font-medium text-white" style={{ width: '80%' }}>80%</div>
                  <div className="flex items-center justify-center bg-primary-100 text-xs font-medium text-primary-500" style={{ width: '20%' }}>20%</div>
                </div>
                <button className="btn-primary w-full">
                  <Lock className="h-4 w-4" /> Pay $30.00 Securely
                </button>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-body-muted">
                  <Lock className="h-3 w-3" /> Powered by Stripe · Tokenized
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — cream bg, white cards */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="eyebrow mb-3 justify-center">Core Capabilities</div>
            <h2 className="font-display text-display-lg font-bold tracking-tight text-brown-dark">
              Four pillars of the <span className="text-primary">BuoyBots platform</span>
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-6 transition-colors duration-150 ease-brand hover:border-primary-200">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-brown-dark">{f.title}</h3>
                <p className="text-sm leading-relaxed text-body-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark band — process/steps section */}
      <section className="bg-brown-near py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="eyebrow mb-3 justify-center text-primary-200">How It Works</div>
            <h2 className="font-display text-display-lg font-bold tracking-tight text-white">
              From onboarding to <span className="text-primary-200">payment</span>
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="rounded-2xl border border-brown-deepest/40 bg-brown-black/30 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {i + 1}
                    </div>
                    <step.icon className="h-5 w-5 text-primary-200" />
                  </div>
                  <h3 className="font-display font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-cream-100/70">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-brown-deepest/60 md:block">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo patients — cream bg */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-6">
            <DemoDataNotice />
          </div>
          <div className="mb-12 text-center">
            <div className="eyebrow mb-3 justify-center">Explore Demo Patients</div>
            <h2 className="font-display text-display-lg font-bold tracking-tight text-brown-dark">
              Three sandbox profiles with <span className="text-primary">different coverage</span>
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {demoPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate({ name: 'patient-dashboard', patientId: p.id })}
                className="card p-6 text-left transition-colors duration-150 ease-brand hover:border-primary-200"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <span className="badge-primary">{p.type}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-brown-dark">{p.name}</h3>
                <p className="mt-1 text-sm text-body-muted">Copay: {p.copay}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  View Dashboard <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* POA Portal — dark band with SMS showcase */}
      <section className="bg-brown-near py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="eyebrow mb-4 text-primary-200">POA Communication Portal</div>
              <h2 className="font-display text-display-lg font-bold tracking-tight text-white">
                Keeping families <span className="text-primary-200">in the loop</span>
              </h2>
              <p className="mt-4 max-w-lg text-body-lg text-cream-100/80">
                Family members and Power of Attorney contacts receive secure, branded links to view
                treatment plans and make payments on behalf of their loved ones.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  { icon: Lock, text: 'Token-secured URLs with session-specific context' },
                  { icon: FileText, text: 'View treatment plans and session charges' },
                  { icon: CreditCard, text: 'Make payments via the same secure Stripe flow' },
                  { icon: Building2, text: 'Consistent BuoyBots branding for phishing resistance' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 flex-shrink-0 text-primary-200" />
                    <span className="text-cream-100/90">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-brown-deepest/40 bg-brown-black/30 p-6">
              <div className="mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary-200" />
                <span className="text-sm font-medium text-cream-100/90">Sample SMS Notification</span>
              </div>
              <div className="rounded-2xl bg-brown-black/50 p-4 font-mono text-sm text-cream-100/90">
                <p className="leading-relaxed">
                  BuoyBots: You have a payment due for Margaret Chen's PT session on Jul 10. Balance: $30.00.{' '}
                  <span className="text-primary-200 underline">https://buoybots.app/poa/buoybots-poa-token-margaret-2024</span>
                </p>
              </div>
              <p className="mt-3 text-xs text-cream-100/60">
                Sent via Twilio sandbox · Session-specific link · Branded domain for phishing resistance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security — cream bg with white card */}
      <section className="bg-cream py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-neutral-border bg-white p-8 sm:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <div className="eyebrow mb-3">Security & Compliance</div>
                <h2 className="font-display text-display-sm font-bold tracking-tight text-brown-dark">
                  Built for healthcare <span className="text-primary">from day one</span>
                </h2>
                <p className="mt-3 text-body-md text-body-muted">
                  Every layer designed with patient data protection in mind.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
                {[
                  { icon: ShieldCheck, title: 'HIPAA & HITECH', desc: 'Compliance framework for demo environments' },
                  { icon: Lock, title: 'PCI-DSS', desc: 'Stripe Elements for card tokenization — no raw card data' },
                  { icon: Users, title: 'Phishing Resistance', desc: 'Consistent branding and secure URLs for POA access' },
                  { icon: CheckCircle2, title: 'Sandbox Data', desc: 'No real PHI or production payment data' },
                ].map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-display font-semibold text-brown-dark">{item.title}</div>
                      <div className="text-sm text-body-muted">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 border-t border-neutral-border pt-6">
              <SecurityBanner />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-cream pb-20 px-6">
        <div className="mx-auto max-w-5xl">
          <CtaBanner
            headline={<>See BuoyBots in <span className="text-primary-200">action</span></>}
            subtext="Book a walkthrough of the patient payment and POA communication platform with our team."
            ctaLabel="Book a Demo"
            ctaView={{ name: 'onboarding' }}
            onNavigate={onNavigate}
          />
        </div>
      </section>
    </div>
  );
}
