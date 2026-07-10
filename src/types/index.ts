export interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  member_id: string | null;
  insurance_plan_name: string | null;
  insurance_type: string;
  copay_amount: number;
  deductible_total: number;
  deductible_met: number;
  coinsurance_rate: number;
  coverage_rate: number;
  out_of_pocket_max: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface PoaContact {
  id: string;
  patient_id: string;
  full_name: string;
  relationship: string | null;
  email: string | null;
  phone: string | null;
  access_token: string | null;
  token_expires_at: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  patient_id: string;
  session_date: string;
  session_type: string;
  provider: string | null;
  total_charge: number;
  insurance_pays: number;
  patient_owes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid';
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  patient_id: string;
  session_id: string | null;
  poa_contact_id: string | null;
  amount: number;
  payment_type: 'one_time' | 'recurring' | 'onboarding_prepay';
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  stripe_payment_intent_id: string | null;
  stripe_payment_method_id: string | null;
  card_brand: string | null;
  card_last4: string | null;
  created_at: string;
}

export interface SmsLog {
  id: string;
  patient_id: string | null;
  poa_contact_id: string | null;
  to_phone: string;
  message_body: string;
  message_type: 'payment_reminder' | 'poa_invitation' | 'session_reminder';
  session_id: string | null;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  twilio_sid: string | null;
  created_at: string;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  title: string;
  diagnosis: string | null;
  goals: string[];
  start_date: string | null;
  estimated_end_date: string | null;
  frequency: string | null;
  status: 'active' | 'completed' | 'on_hold';
  created_at: string;
}

export type View =
  | { name: 'home' }
  | { name: 'onboarding' }
  | { name: 'patient-dashboard'; patientId: string }
  | { name: 'poa-portal'; token: string }
  | { name: 'admin' };
