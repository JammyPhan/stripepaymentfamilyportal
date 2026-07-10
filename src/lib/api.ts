import type { Patient, PoaContact, Session, Payment, TreatmentPlan, SmsLog } from '../types';
import { supabase } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function edgeHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Patient[];
}

export async function fetchPatient(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Patient | null;
}

export async function createPatient(input: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
  const { data, error } = await supabase
    .from('patients')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Patient;
}

export async function fetchSessions(patientId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('patient_id', patientId)
    .order('session_date', { ascending: true });
  if (error) throw error;
  return data as Session[];
}

export async function fetchPayments(patientId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Payment[];
}

export async function fetchPoaContacts(patientId: string): Promise<PoaContact[]> {
  const { data, error } = await supabase
    .from('poa_contacts')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as PoaContact[];
}

export async function fetchPoaByToken(token: string): Promise<{ poa: PoaContact; patient: Patient } | null> {
  const { data: poaData, error: poaError } = await supabase
    .from('poa_contacts')
    .select('*')
    .eq('access_token', token)
    .maybeSingle();
  if (poaError) throw poaError;
  if (!poaData) return null;

  const poa = poaData as PoaContact;
  if (poa.token_expires_at && new Date(poa.token_expires_at) < new Date()) {
    return null;
  }

  const { data: patientData, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', poa.patient_id)
    .maybeSingle();
  if (patientError) throw patientError;
  if (!patientData) return null;

  return { poa, patient: patientData as Patient };
}

export async function fetchTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
  const { data, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as TreatmentPlan[];
}

export async function fetchSmsLogs(): Promise<SmsLog[]> {
  const { data, error } = await supabase
    .from('sms_logs')
    .select('*, patients(full_name), poa_contacts(full_name)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data as unknown as SmsLog[];
}

export async function createPoaContact(input: Omit<PoaContact, 'id' | 'created_at'>): Promise<PoaContact> {
  const { data, error } = await supabase
    .from('poa_contacts')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as PoaContact;
}

export async function updateSessionPaymentStatus(sessionId: string, status: Session['payment_status']): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ payment_status: status })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function insertPayment(input: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Payment;
}

export interface CreatePaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
  demo: boolean;
}

export async function createPaymentIntent(
  amount: number,
  patientId: string,
  sessionId: string | null,
  poaContactId: string | null,
): Promise<CreatePaymentResponse> {
  const url = `${supabaseUrl}/functions/v1/create-payment-intent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({ amount, patientId, sessionId, poaContactId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payment intent failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (!json.clientSecret) {
    throw new Error('Invalid response: missing clientSecret');
  }
  return json as CreatePaymentResponse;
}

export interface SendSmsResponse {
  success: boolean;
  sid: string;
  demo: boolean;
}

export async function sendSmsNotification(
  to: string,
  body: string,
  messageType: string,
  patientId: string | null,
  poaContactId: string | null,
  sessionId: string | null,
): Promise<SendSmsResponse> {
  const url = `${supabaseUrl}/functions/v1/send-sms`;
  const res = await fetch(url, {
    method: 'POST',
    headers: edgeHeaders(),
    body: JSON.stringify({ to, body, messageType, patientId, poaContactId, sessionId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SMS send failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json as SendSmsResponse;
}
