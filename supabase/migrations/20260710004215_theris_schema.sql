/*
# Theris Patient Payments & POA Communication Schema

## Overview
Creates the full data model for the Theris prototype: patients, their insurance
and payment methods, POA (Power of Attorney) / family contacts, treatment sessions,
payments, and SMS notification logs. All data is sandbox/demo — no real PHI.

## New Tables
1. `patients` — patient demographics, insurance details, and Stripe customer id.
   - `id` uuid PK
   - `full_name` text
   - `date_of_birth` date
   - `email` text
   - `phone` text
   - `member_id` text (insurance member id)
   - `insurance_plan_name` text
   - `insurance_type` text (e.g. 'Medicare', 'Commercial', 'Self-Pay')
   - `copay_amount` numeric (pre-calculated copay)
   - `deductible_total` numeric (annual deductible)
   - `deductible_met` numeric (amount met so far)
   - `coinsurance_rate` numeric (patient coinsurance %, 0-100)
   - `coverage_rate` numeric (insurance coverage %, 0-100)
   - `out_of_pocket_max` numeric
   - `stripe_customer_id` text (Stripe customer, demo)
   - `created_at` timestamptz

2. `poa_contacts` — Power of Attorney / family members who can pay and view plans.
   - `id` uuid PK
   - `patient_id` uuid FK -> patients
   - `full_name` text
   - `relationship` text (e.g. 'Spouse', 'Child', 'Legal Guardian')
   - `email` text
   - `phone` text
   - `access_token` text (secure session-specific token for portal URL)
   - `token_expires_at` timestamptz
   - `created_at` timestamptz

3. `sessions` — treatment sessions with charges and payment status.
   - `id` uuid PK
   - `patient_id` uuid FK -> patients
   - `session_date` date
   - `session_type` text (e.g. 'Physical Therapy', 'Occupational Therapy')
   - `provider` text
   - `total_charge` numeric (billed amount)
   - `insurance_pays` numeric (pre-calculated insurance portion)
   - `patient_owes` numeric (pre-calculated patient portion: copay + coinsurance)
   - `status` text ('scheduled', 'completed', 'cancelled')
   - `payment_status` text ('pending', 'partial', 'paid')
   - `notes` text
   - `created_at` timestamptz

4. `payments` — payment records linked to sessions.
   - `id` uuid PK
   - `patient_id` uuid FK -> patients
   - `session_id` uuid FK -> sessions (nullable for onboarding prepay)
   - `poa_contact_id` uuid FK -> poa_contacts (nullable; set when POA pays)
   - `amount` numeric
   - `payment_type` text ('one_time', 'recurring', 'onboarding_prepay')
   - `status` text ('succeeded', 'pending', 'failed', 'refunded')
   - `stripe_payment_intent_id` text
   - `stripe_payment_method_id` text (tokenized card)
   - `card_brand` text
   - `card_last4` text
   - `created_at` timestamptz

5. `sms_logs` — SMS notification records for audit trail.
   - `id` uuid PK
   - `patient_id` uuid FK -> patients (nullable)
   - `poa_contact_id` uuid FK -> poa_contacts (nullable)
   - `to_phone` text
   - `message_body` text
   - `message_type` text ('payment_reminder', 'poa_invitation', 'session_reminder')
   - `session_id` uuid FK -> sessions (nullable)
   - `status` text ('queued', 'sent', 'delivered', 'failed')
   - `twilio_sid` text
   - `created_at` timestamptz

6. `treatment_plans` — treatment plan summaries viewable by POA.
   - `id` uuid PK
   - `patient_id` uuid FK -> patients
   - `title` text
   - `diagnosis` text
   - `goals` text[]
   - `start_date` date
   - `estimated_end_date` date
   - `frequency` text (e.g. '2x per week')
   - `status` text ('active', 'completed', 'on_hold')
   - `created_at` timestamptz

## Security
- RLS enabled on all tables.
- This is a demo/prototype with no auth screen — policies use `TO anon, authenticated`
  so the anon-key frontend can read/write sandbox data. All data is intentionally
  shared demo data. In production, these would be scoped to authenticated clinician
  accounts and token-validated POA access.
*/

-- Patients
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  date_of_birth date,
  email text,
  phone text,
  member_id text,
  insurance_plan_name text,
  insurance_type text DEFAULT 'Commercial',
  copay_amount numeric DEFAULT 0,
  deductible_total numeric DEFAULT 0,
  deductible_met numeric DEFAULT 0,
  coinsurance_rate numeric DEFAULT 0,
  coverage_rate numeric DEFAULT 80,
  out_of_pocket_max numeric DEFAULT 0,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_patients" ON patients;
CREATE POLICY "anon_select_patients" ON patients FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_patients" ON patients;
CREATE POLICY "anon_insert_patients" ON patients FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_patients" ON patients;
CREATE POLICY "anon_update_patients" ON patients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_patients" ON patients;
CREATE POLICY "anon_delete_patients" ON patients FOR DELETE TO anon, authenticated USING (true);

-- POA Contacts
CREATE TABLE IF NOT EXISTS poa_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relationship text,
  email text,
  phone text,
  access_token text UNIQUE,
  token_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE poa_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_poa_contacts" ON poa_contacts;
CREATE POLICY "anon_select_poa_contacts" ON poa_contacts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_poa_contacts" ON poa_contacts;
CREATE POLICY "anon_insert_poa_contacts" ON poa_contacts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_poa_contacts" ON poa_contacts;
CREATE POLICY "anon_update_poa_contacts" ON poa_contacts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_poa_contacts" ON poa_contacts;
CREATE POLICY "anon_delete_poa_contacts" ON poa_contacts FOR DELETE TO anon, authenticated USING (true);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  session_type text NOT NULL,
  provider text,
  total_charge numeric NOT NULL DEFAULT 0,
  insurance_pays numeric NOT NULL DEFAULT 0,
  patient_owes numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled',
  payment_status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE TO anon, authenticated USING (true);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  poa_contact_id uuid REFERENCES poa_contacts(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_type text NOT NULL DEFAULT 'one_time',
  status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_payment_method_id text,
  card_brand text,
  card_last4 text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- SMS Logs
CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  poa_contact_id uuid REFERENCES poa_contacts(id) ON DELETE SET NULL,
  to_phone text NOT NULL,
  message_body text NOT NULL,
  message_type text NOT NULL DEFAULT 'payment_reminder',
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued',
  twilio_sid text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sms_logs" ON sms_logs;
CREATE POLICY "anon_select_sms_logs" ON sms_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sms_logs" ON sms_logs;
CREATE POLICY "anon_insert_sms_logs" ON sms_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sms_logs" ON sms_logs;
CREATE POLICY "anon_update_sms_logs" ON sms_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sms_logs" ON sms_logs;
CREATE POLICY "anon_delete_sms_logs" ON sms_logs FOR DELETE TO anon, authenticated USING (true);

-- Treatment Plans
CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  title text NOT NULL,
  diagnosis text,
  goals text[] DEFAULT '{}',
  start_date date,
  estimated_end_date date,
  frequency text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_treatment_plans" ON treatment_plans;
CREATE POLICY "anon_select_treatment_plans" ON treatment_plans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_treatment_plans" ON treatment_plans;
CREATE POLICY "anon_insert_treatment_plans" ON treatment_plans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_treatment_plans" ON treatment_plans;
CREATE POLICY "anon_update_treatment_plans" ON treatment_plans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_treatment_plans" ON treatment_plans;
CREATE POLICY "anon_delete_treatment_plans" ON treatment_plans FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_payment_status ON sessions(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_poa_contacts_patient_id ON poa_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_poa_contacts_access_token ON poa_contacts(access_token);
CREATE INDEX IF NOT EXISTS idx_sms_logs_patient_id ON sms_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
