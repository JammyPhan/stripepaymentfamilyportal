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
    const { to, body, messageType, patientId, poaContactId, sessionId } = await req.json();

    if (!to || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = Deno.env.get('TWILIO_FROM_NUMBER');

    // Demo mode: no Twilio credentials
    if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
      const demoSid = `SM${Date.now()}demo`;

      await supabase.from('sms_logs').insert({
        patient_id: patientId ?? null,
        poa_contact_id: poaContactId ?? null,
        to_phone: to,
        message_body: body,
        message_type: messageType ?? 'payment_reminder',
        session_id: sessionId ?? null,
        status: 'queued',
        twilio_sid: demoSid,
      });

      return new Response(
        JSON.stringify({
          success: true,
          sid: demoSid,
          demo: true,
          message: 'SMS logged in demo mode — Twilio not configured',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Production mode: send via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: twilioFromNumber,
        Body: body,
      }),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      await supabase.from('sms_logs').insert({
        patient_id: patientId ?? null,
        poa_contact_id: poaContactId ?? null,
        to_phone: to,
        message_body: body,
        message_type: messageType ?? 'payment_reminder',
        session_id: sessionId ?? null,
        status: 'failed',
        twilio_sid: twilioData.sid ?? null,
      });

      return new Response(
        JSON.stringify({ success: false, error: twilioData.message ?? 'Twilio error', demo: false }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    await supabase.from('sms_logs').insert({
      patient_id: patientId ?? null,
      poa_contact_id: poaContactId ?? null,
      to_phone: to,
      message_body: body,
      message_type: messageType ?? 'payment_reminder',
      session_id: sessionId ?? null,
      status: twilioData.status ?? 'sent',
      twilio_sid: twilioData.sid,
    });

    return new Response(
      JSON.stringify({
        success: true,
        sid: twilioData.sid,
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
