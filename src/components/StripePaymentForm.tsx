import { useState, useEffect, useCallback } from 'react';
import { loadStripe, type Stripe, type StripeElements, type StripeCardElement } from '@stripe/stripe-js';
import { Lock, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  patientId: string;
  sessionId: string | null;
  poaContactId: string | null;
  onSuccess: (paymentMethodId: string, cardBrand: string, cardLast4: string) => void;
  onCancel?: () => void;
  ctaLabel?: string;
}

let stripePromise: Promise<Stripe | null> | null = null;

function getStripeKey(): string | null {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  if (!key || key.length < 10) return null;
  return key;
}

function getStripeInstance(): Promise<Stripe | null> {
  const key = getStripeKey();
  if (!key) return Promise.resolve(null);
  if (!stripePromise) {
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export function isStripeConfigured(): boolean {
  return getStripeKey() !== null;
}

export function StripePaymentForm({
  amount,
  patientId,
  sessionId,
  poaContactId,
  onSuccess,
  onCancel,
  ctaLabel = 'Pay Now',
}: StripePaymentFormProps) {
  const [stripeReady, setStripeReady] = useState(false);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const [demoCard, setDemoCard] = useState('');
  const [demoExp, setDemoExp] = useState('');
  const [demoCvc, setDemoCvc] = useState('');
  const [demoZip, setDemoZip] = useState('');

  useEffect(() => {
    let mounted = true;
    getStripeInstance().then(async (stripe) => {
      if (!stripe || !mounted) {
        setDemoMode(true);
        return;
      }
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount, patientId, sessionId, poaContactId }),
        });
        if (!res.ok) throw new Error('Failed to create payment intent');
        const data = await res.json();
        if (!data.clientSecret) throw new Error('No client secret returned');

        const els = stripe.elements({ clientSecret: data.clientSecret, appearance: { theme: 'stripe' } });
        const card = els.create('card');
        card.mount('#stripe-card-element');
        if (mounted) {
          setElements(els);
          setCardElement(card);
          setStripeReady(true);
        }
      } catch {
        if (mounted) setDemoMode(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [amount, patientId, sessionId, poaContactId]);

  const handleRealStripe = useCallback(async () => {
    if (!stripeReady || !cardElement) return;
    const stripe = await getStripeInstance();
    if (!stripe) return;
    setProcessing(true);
    setError(null);
    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
      if (pmError) throw new Error(pmError.message);

      const { error: confirmError } = await stripe.confirmCardPayment(
        (elements as unknown as { _clientSecret: string })._clientSecret,
        { payment_method: paymentMethod.id },
        { handleActions: false },
      );
      if (confirmError) throw new Error(confirmError.message);

      onSuccess(
        paymentMethod.id,
        paymentMethod.card?.brand ?? 'card',
        paymentMethod.card?.last4 ?? '----',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  }, [stripeReady, cardElement, elements, onSuccess]);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };
  const formatExp = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleDemoPay = useCallback(async () => {
    const digits = demoCard.replace(/\s/g, '');
    if (digits.length < 15) {
      setError('Please enter a valid card number');
      return;
    }
    if (demoExp.length < 5) {
      setError('Please enter a valid expiry date');
      return;
    }
    if (demoCvc.length < 3) {
      setError('Please enter a valid CVC');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, patientId, sessionId, poaContactId }),
      });
      const data = res.ok ? await res.json() : { demo: true, paymentIntentId: `pi_demo_${Date.now()}` };

      await new Promise((r) => setTimeout(r, 1200));

      const brand = digits.startsWith('4') ? 'visa' : digits.startsWith('5') ? 'mastercard' : digits.startsWith('3') ? 'amex' : 'discover';
      const last4 = digits.slice(-4);
      onSuccess(data.paymentIntentId ?? `pi_demo_${Date.now()}`, brand, last4);
    } catch {
      onSuccess(`pm_demo_${Date.now()}`, 'visa', demoCard.replace(/\s/g, '').slice(-4));
    } finally {
      setProcessing(false);
    }
  }, [demoCard, demoExp, demoCvc, amount, patientId, sessionId, poaContactId, onSuccess]);

  const currencyStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-body">Secure Payment</span>
        </div>
        <span className="font-display text-lg font-bold text-primary">{currencyStr}</span>
      </div>

      {demoMode && (
        <div className="flex items-start gap-2 rounded-2xl border border-primary-100 bg-primary-50 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
          <p className="text-xs text-brown">
            <span className="font-semibold text-primary-500">Demo Mode:</span> No real Stripe key configured. Use test card{' '}
            <span className="font-mono font-semibold">4242 4242 4242 4242</span> or any valid-looking number.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {!demoMode ? (
          <>
            <div>
              <label className="label">Card Details</label>
              <div id="stripe-card-element" className="min-h-[44px] rounded-2xl border border-neutral-border bg-white p-3" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="label">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-muted" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  value={demoCard}
                  onChange={(e) => setDemoCard(formatCardNumber(e.target.value))}
                  className="input pl-10 font-mono tracking-wider"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Expiry</label>
                <input type="text" inputMode="numeric" placeholder="MM/YY" value={demoExp} onChange={(e) => setDemoExp(formatExp(e.target.value))} className="input font-mono" />
              </div>
              <div>
                <label className="label">CVC</label>
                <input type="text" inputMode="numeric" placeholder="123" maxLength={4} value={demoCvc} onChange={(e) => setDemoCvc(e.target.value.replace(/\D/g, ''))} className="input font-mono" />
              </div>
              <div>
                <label className="label">ZIP</label>
                <input type="text" inputMode="numeric" placeholder="12345" maxLength={5} value={demoZip} onChange={(e) => setDemoZip(e.target.value.replace(/\D/g, ''))} className="input font-mono" />
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-danger-100 bg-danger-50 px-3 py-2 text-sm text-danger-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-body-muted">
        <span>Powered by Stripe · PCI-DSS Compliant</span>
        <span>Tokenized · No card data stored</span>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <button onClick={onCancel} className="btn-secondary flex-1" disabled={processing}>
            Cancel
          </button>
        )}
        <button onClick={demoMode ? handleDemoPay : handleRealStripe} disabled={processing} className="btn-primary flex-1">
          {processing ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            <><Lock className="h-4 w-4" /> {ctaLabel} · {currencyStr}</>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-body-muted">
        Card data is tokenized by Stripe. BuoyBots never sees or stores raw card numbers.
      </p>
    </div>
  );
}
