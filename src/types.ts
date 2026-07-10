export interface View {
  name: 'home' | 'onboarding' | 'patient-dashboard' | 'poa-portal' | 'admin';
  patientId?: string;
  token?: string;
}

export type InsuranceType = 'Medicare' | 'Commercial' | 'Self-Pay';

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';
export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'refunded';

export interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  member_id: string | null;
  insurance_plan_name: string | null;
  insurance_type: InsuranceType;
  copay_amount: number;
  deductible_total: number;
  deductible_met: number;
  coinsurance_rate: number;
  coverage_rate: number;
  out_of_pocket_max: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  patient_id: string;
  session_date: string;
  session_type: string;
  provider: string;
  status: SessionStatus;
  total_charge: number;
  insurance_pays: number;
  patient_owes: number;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
}

export type PaymentType = 'onboarding_prepay' | 'one_time' | 'recurring' | 'refund';
export type PaymentStatusType = 'succeeded' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  patient_id: string;
  session_id: string | null;
  poa_contact_id: string | null;
  amount: number;
  payment_type: PaymentType;
  status: PaymentStatusType;
  stripe_payment_intent_id: string | null;
  stripe_payment_method_id: string | null;
  card_brand: string | null;
  card_last4: string | null;
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

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  title: string;
  diagnosis: string;
  start_date: string;
  estimated_end_date: string;
  frequency: string;
  goals: string[];
  status: 'active' | 'completed' | 'discontinued';
  created_at: string;
}

export interface SmsLog {
  id: string;
  patient_id: string;
  poa_contact_id: string | null;
  to_phone: string;
  message_body: string;
  message_type: string;
  status: string;
  twilio_sid: string | null;
  created_at: string;
}
