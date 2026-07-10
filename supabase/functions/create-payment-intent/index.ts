import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { amount, patientId, sessionId, poaContactId } = await req.json();

    if (typeof amount !== 'number' || amount < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    // Demo mode: no Stripe key configured
    if (!stripeSecretKey || stripeSecretKey.length < 10) {
      const paymentIntentId = `pi_demo_${Date.now()}`;
      const clientSecret = `${paymentIntentId}_secret_demo`;

      // Log the payment intent to the database for audit trail
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      if (patientId && patientId !== 'onboarding') {
        await supabase.from('payments').insert({
          patient_id: patientId,
          session_id: sessionId ?? null,
          poa_contact_id: poaContactId ?? null,
          amount,
          payment_type: 'one_time',
          status: 'pending',
          stripe_payment_intent_id: paymentIntentId,
        });
      }

      return new Response(
        JSON.stringify({
          clientSecret,
          paymentIntentId,
          demo: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Production mode: create a real Stripe PaymentIntent
    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(Math.round(amount * 100)),
        currency: 'usd',
        'metadata[patient_id]': patientId ?? '',
        'metadata[session_id]': sessionId ?? '',
        'metadata[poa_contact_id]': poaContactId ?? '',
        'metadata[platform]': 'buoybots',
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(
        JSON.stringify({ error: `Stripe API error: ${errBody}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const intent = await response.json();

    return new Response(
      JSON.stringify({
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        demo: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
