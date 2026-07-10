import { supabase } from './supabase';
import type { Patient, Session, Payment, PoaContact, SmsLog, TreatmentPlan } from '../types';

export async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPatient(patientId: string): Promise<Patient | null> {
  const { data, error } = await supabase.from('patients').select('*').eq('id', patientId).single();
  if (error) throw error;
  return data;
}

export async function createPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
  const { data, error } = await supabase.from('patients').insert(patient).select().single();
  if (error) throw error;
  return data;
}

export async function fetchSessions(patientId: string): Promise<Session[]> {
  const { data, error } = await supabase.from('sessions').select('*').eq('patient_id', patientId).order('session_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPayments(patientId: string): Promise<Payment[]> {
  const { data, error } = await supabase.from('payments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment> {
  const { data, error } = await supabase.from('payments').insert(payment).select().single();
  if (error) throw error;
  return data;
}

export async function updateSessionPaymentStatus(sessionId: string, status: string): Promise<void> {
  const { error } = await supabase.from('sessions').update({ payment_status: status }).eq('id', sessionId);
  if (error) throw error;
}

export async function fetchPoaContacts(patientId: string): Promise<PoaContact[]> {
  const { data, error } = await supabase.from('poa_contacts').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPoaContact(contact: Omit<PoaContact, 'id' | 'created_at'>): Promise<PoaContact> {
  const { data, error } = await supabase.from('poa_contacts').insert(contact).select().single();
  if (error) throw error;
  return data;
}

export async function fetchPoaByToken(token: string): Promise<{ poa: PoaContact; patient: Patient } | null> {
  const { data: poa, error } = await supabase.from('poa_contacts').select('*').eq('access_token', token).single();
  if (error || !poa) return null;
  if (poa.token_expires_at && new Date(poa.token_expires_at) < new Date()) return null;
  const { data: patient, error: pErr } = await supabase.from('patients').select('*').eq('id', poa.patient_id).single();
  if (pErr || !patient) return null;
  return { poa, patient };
}

export async function fetchTreatmentPlans(patientId: string): Promise<TreatmentPlan[]> {
  const { data, error } = await supabase.from('treatment_plans').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function fetchSmsLogs(): Promise<SmsLog[]> {
  const { data, error } = await supabase.from('sms_logs').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) return [];
  return data ?? [];
}

export async function sendSmsNotification(
  to: string,
  body: string,
  messageType: string,
  patientId: string,
  poaContactId: string | null,
  sessionId: string | null,
): Promise<void> {
  const { error } = await supabase.from('sms_logs').insert({
    patient_id: patientId,
    poa_contact_id: poaContactId,
    session_id: sessionId,
    to_phone: to,
    message_body: body,
    message_type: messageType,
    status: 'queued',
  });
  if (error) throw error;
}
