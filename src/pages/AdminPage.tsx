import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Send,
  ExternalLink,
  Copy,
  CheckCircle2,
  Loader2,
  Bell,
  RefreshCw,
  Search,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  HeartPulse,
} from 'lucide-react';
import type { View, Patient, PoaContact, SmsLog } from '../types';
import { DemoDataNotice } from '../components/SecurityBanner';
import { Modal } from '../components/Modal';
import { CtaBanner } from '../components/CtaBanner';
import { showToast } from '../components/Toast';
import { fetchPatients, fetchPoaContacts, fetchSmsLogs, createPoaContact, sendSmsNotification } from '../lib/api';
import { formatCurrency, formatDateTime, formatDate } from '../lib/format';
import { supabase } from '../lib/supabase';

interface AdminPageProps {
  onNavigate: (view: View) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [smsLogs, setSmsLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'patients' | 'sms-logs'>('patients');

  const [addPoaPatient, setAddPoaPatient] = useState<Patient | null>(null);
  const [poaContacts, setPoaContacts] = useState<PoaContact[]>([]);
  const [poaName, setPoaName] = useState('');
  const [poaRelationship, setPoaRelationship] = useState('');
  const [poaEmail, setPoaEmail] = useState('');
  const [poaPhone, setPoaPhone] = useState('');
  const [creatingPoa, setCreatingPoa] = useState(false);
  const [createdPoaToken, setCreatedPoaToken] = useState<string | null>(null);

  const [smsPatient, setSmsPatient] = useState<Patient | null>(null);
  const [smsPoaContacts, setSmsPoaContacts] = useState<PoaContact[]>([]);
  const [smsTarget, setSmsTarget] = useState<'patient' | 'poa'>('patient');
  const [smsPoaId, setSmsPoaId] = useState<string>('');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSending, setSmsSending] = useState(false);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ps, logs] = await Promise.all([fetchPatients(), fetchSmsLogs()]);
      setPatients(ps);
      setSmsLogs(logs);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.insurance_type.toLowerCase().includes(search.toLowerCase()),
  );

  const openAddPoa = useCallback(async (patient: Patient) => {
    setAddPoaPatient(patient);
    setPoaName('');
    setPoaRelationship('');
    setPoaEmail('');
    setPoaPhone('');
    setCreatedPoaToken(null);
    const contacts = await fetchPoaContacts(patient.id);
    setPoaContacts(contacts);
  }, []);

  const handleCreatePoa = useCallback(async () => {
    if (!addPoaPatient || !poaName.trim()) {
      showToast('error', 'Please enter the POA full name');
      return;
    }
    setCreatingPoa(true);
    try {
      const token = `buoybots-poa-${crypto.randomUUID()}`;
      const contact = await createPoaContact({
        patient_id: addPoaPatient.id,
        full_name: poaName,
        relationship: poaRelationship || null,
        email: poaEmail || null,
        phone: poaPhone || null,
        access_token: token,
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setCreatedPoaToken(token);
      setPoaContacts((prev) => [contact, ...prev]);
      showToast('success', 'POA contact created successfully');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to create POA contact');
    } finally {
      setCreatingPoa(false);
    }
  }, [addPoaPatient, poaName, poaRelationship, poaEmail, poaPhone]);

  const handleCopyToken = useCallback(async (token: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/poa/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    showToast('success', 'Portal link copied to clipboard');
  }, []);

  const openSmsModal = useCallback(async (patient: Patient) => {
    setSmsPatient(patient);
    setSmsTarget('patient');
    setSmsPoaId('');
    setSmsMessage(`BuoyBots: You have a pending balance for your upcoming therapy session. View your account at ${window.location.origin}${window.location.pathname}#/patient/${patient.id}`);
    const contacts = await fetchPoaContacts(patient.id);
    setSmsPoaContacts(contacts);
  }, []);

  const handleSendSms = useCallback(async () => {
    if (!smsPatient) return;
    const to = smsTarget === 'patient'
      ? smsPatient.phone
      : smsPoaContacts.find((c) => c.id === smsPoaId)?.phone ?? null;

    if (!to) {
      showToast('error', 'No phone number available for the selected recipient');
      return;
    }
    if (!smsMessage.trim()) {
      showToast('error', 'Please enter a message');
      return;
    }
    setSmsSending(true);
    try {
      const selectedPoa = smsTarget === 'poa' ? smsPoaContacts.find((c) => c.id === smsPoaId) : null;
      await sendSmsNotification(
        to,
        smsMessage,
        'payment_reminder',
        smsPatient.id,
        selectedPoa?.id ?? null,
        null,
      );

      await supabase.from('sms_logs').insert({
        patient_id: smsPatient.id,
        poa_contact_id: selectedPoa?.id ?? null,
        to_phone: to,
        message_body: smsMessage,
        message_type: 'payment_reminder',
        status: 'queued',
      });

      showToast('success', `SMS queued to ${to} (demo mode)`);
      setSmsPatient(null);
      await load();
    } catch {
      showToast('warning', 'SMS queued in demo mode — Twilio key not configured');
      setSmsPatient(null);
      await load();
    } finally {
      setSmsSending(false);
    }
  }, [smsPatient, smsTarget, smsPoaId, smsPoaContacts, smsMessage, load]);

  return (
    <div className="animate-fade-in mx-auto max-w-6xl px-6 pt-32 pb-20">
      <div className="mb-8">
        <div className="eyebrow mb-3">Clinician Dashboard</div>
        <h1 className="font-display text-display-md font-bold tracking-tight text-brown-dark">
          Manage patients & <span className="text-primary">POA access</span>
        </h1>
        <p className="mt-2 text-body-lg text-body-muted">Oversee patient records, generate secure portal links, and send SMS notifications.</p>
      </div>

      <DemoDataNotice className="mb-6" />

      {/* Stats row — dark band */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-brown-near p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-cream-100/70"><Users className="h-3.5 w-3.5" /> Total Patients</div>
            <div className="mt-1 font-display text-3xl font-bold text-white">{patients.length}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-cream-100/70"><ShieldCheck className="h-3.5 w-3.5" /> Medicare</div>
            <div className="mt-1 font-display text-3xl font-bold text-white">{patients.filter((p) => p.insurance_type === 'Medicare').length}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-cream-100/70"><MessageSquare className="h-3.5 w-3.5" /> SMS Sent</div>
            <div className="mt-1 font-display text-3xl font-bold text-white">{smsLogs.length}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-cream-100/70"><HeartPulse className="h-3.5 w-3.5" /> Commercial</div>
            <div className="mt-1 font-display text-3xl font-bold text-white">{patients.filter((p) => p.insurance_type === 'Commercial').length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-neutral-border">
        {(['patients', 'sms-logs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-brand ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-body-muted hover:text-body'
            }`}
          >
            {t === 'patients' ? 'Patients' : 'SMS Log'}
          </button>
        ))}
        <button onClick={load} className="ml-auto btn-ghost">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Patients tab */}
      {tab === 'patients' && (
        <div className="animate-fade-in">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-body-muted" />
              <input
                className="input pl-10"
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button onClick={() => onNavigate({ name: 'onboarding' })} className="btn-primary">
              <Plus className="h-4 w-4" /> Onboard New Patient
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-10 text-center text-body-muted">
              <Users className="mx-auto mb-2 h-8 w-8 text-body-muted" />
              No patients found.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="card p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-brown-dark">{p.full_name}</h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-body-muted">
                          <span className="inline-flex items-center gap-1"><HeartPulse className="h-3 w-3" /> {p.insurance_plan_name}</span>
                          {p.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {p.email}</span>}
                          {p.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</span>}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="badge-primary">{p.insurance_type}</span>
                          <span className="badge-neutral">Copay {formatCurrency(p.copay_amount)}</span>
                          <span className="badge-neutral">{p.coverage_rate.toFixed(0)}% coverage</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onNavigate({ name: 'patient-dashboard', patientId: p.id })}
                        className="btn-secondary text-xs"
                      >
                        <ArrowRight className="h-3.5 w-3.5" /> View
                      </button>
                      <button
                        onClick={() => openSmsModal(p)}
                        className="btn-secondary text-xs"
                      >
                        <Bell className="h-3.5 w-3.5" /> Send SMS
                      </button>
                      <button
                        onClick={() => openAddPoa(p)}
                        className="btn-primary text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> POA Access
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SMS log tab */}
      {tab === 'sms-logs' && (
        <div className="animate-fade-in">
          {smsLogs.length === 0 ? (
            <div className="card p-10 text-center text-body-muted">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-body-muted" />
              No SMS notifications sent yet.
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-border bg-cream-100 text-left text-xs uppercase tracking-wider text-body-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">To</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Message</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border">
                  {smsLogs.map((log) => (
                    <tr key={log.id} className="transition-colors duration-150 ease-brand hover:bg-cream-100/50">
                      <td className="px-4 py-3 text-body-muted whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                      <td className="px-4 py-3 font-medium text-brown-dark">{log.to_phone}</td>
                      <td className="px-4 py-3">
                        <span className="badge-neutral capitalize">{log.message_type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3 text-body-muted hidden sm:table-cell max-w-xs truncate">{log.message_body}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${log.status === 'delivered' || log.status === 'sent' ? 'badge-success' : log.status === 'failed' ? 'badge-danger' : 'badge-warning'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CTA Banner */}
      <div className="mt-12">
        <CtaBanner
          headline={<>Ready to <span className="text-primary-200">streamline</span> your workflow?</>}
          subtext="Onboard a new patient or generate a secure POA portal link to get started."
          ctaLabel="Onboard a Patient"
          ctaView={{ name: 'onboarding' }}
          onNavigate={onNavigate}
        />
      </div>

      {/* POA Modal */}
      <Modal
        open={!!addPoaPatient}
        onClose={() => setAddPoaPatient(null)}
        title={`POA Access — ${addPoaPatient?.full_name}`}
        subtitle="Create a secure portal link for a family member or Power of Attorney"
        size="lg"
      >
        {addPoaPatient && (
          <div className="space-y-5">
            {poaContacts.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-body">Existing POA Contacts</h3>
                <div className="space-y-2">
                  {poaContacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-2xl border border-neutral-border bg-cream-100 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-brown-dark">{c.full_name}</div>
                        <div className="text-xs text-body-muted">{c.relationship} · {c.email} · {c.phone}</div>
                        <div className="text-xs text-body-muted">Expires {c.token_expires_at ? formatDate(c.token_expires_at) : 'N/A'}</div>
                      </div>
                      {c.access_token && (
                        <button
                          onClick={() => handleCopyToken(c.access_token!)}
                          className={`ml-2 flex-shrink-0 btn-secondary text-xs ${copiedToken === c.access_token ? 'text-success-700' : ''}`}
                        >
                          {copiedToken === c.access_token ? (
                            <><CheckCircle2 className="h-3.5 w-3.5" /> Copied</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5" /> Copy Link</>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!createdPoaToken ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-body">Add New POA Contact</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="label label-required">Full Name</label>
                    <input className="input" placeholder="Enter the POA's full name" value={poaName} onChange={(e) => setPoaName(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Relationship</label>
                    <select className="input" value={poaRelationship} onChange={(e) => setPoaRelationship(e.target.value)}>
                      <option value="">Select...</option>
                      {['Spouse', 'Child', 'Parent', 'Legal Guardian', 'Sibling', 'Other'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" className="input" placeholder="Enter their email" value={poaEmail} onChange={(e) => setPoaEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input type="tel" className="input" placeholder="+1 555 222 3333" value={poaPhone} onChange={(e) => setPoaPhone(e.target.value)} />
                  </div>
                </div>
                <button
                  onClick={handleCreatePoa}
                  disabled={creatingPoa || !poaName.trim()}
                  className="btn-primary w-full"
                >
                  {creatingPoa ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    <><ShieldCheck className="h-4 w-4" /> Generate Secure Portal Link</>
                  )}
                </button>
              </div>
            ) : (
              <div className="animate-scale-in space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                  <h3 className="font-display font-semibold text-brown-dark">POA Portal Link Generated</h3>
                </div>
                <div className="rounded-2xl border border-primary-100 bg-primary-50 p-4">
                  <p className="mb-2 text-xs font-medium text-primary-500">Share this secure link with {poaName}:</p>
                  <code className="block break-all rounded-xl bg-white p-3 text-xs text-body border border-neutral-border">
                    {window.location.origin}{window.location.pathname}#/poa/{createdPoaToken}
                  </code>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleCopyToken(createdPoaToken)}
                      className={`btn-secondary flex-1 text-xs ${copiedToken === createdPoaToken ? 'text-success-700' : ''}`}
                    >
                      {copiedToken === createdPoaToken ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Copied!</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" /> Copy Link</>
                      )}
                    </button>
                    <button
                      onClick={() => onNavigate({ name: 'poa-portal', token: createdPoaToken })}
                      className="btn-primary flex-1 text-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Preview Portal
                    </button>
                  </div>
                </div>
                <p className="text-xs text-body-muted">
                  This link expires in 30 days. Send via a secure channel. The link is specific to {poaName} and their relationship to {addPoaPatient.full_name}.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* SMS Modal */}
      <Modal
        open={!!smsPatient}
        onClose={() => setSmsPatient(null)}
        title="Send SMS Notification"
        subtitle={`Payment reminder for ${smsPatient?.full_name}`}
        size="md"
      >
        {smsPatient && (
          <div className="space-y-4">
            <div>
              <label className="label">Send to</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSmsTarget('patient')}
                  className={`rounded-2xl border p-3 text-left transition-all duration-150 ease-brand ${smsTarget === 'patient' ? 'border-primary bg-primary-50 ring-2 ring-primary-100' : 'border-neutral-border'}`}
                >
                  <div className="text-sm font-semibold text-brown-dark">Patient</div>
                  <div className="text-xs text-body-muted">{smsPatient.phone ?? 'No phone'}</div>
                </button>
                <button
                  onClick={() => setSmsTarget('poa')}
                  className={`rounded-2xl border p-3 text-left transition-all duration-150 ease-brand ${smsTarget === 'poa' ? 'border-primary bg-primary-50 ring-2 ring-primary-100' : 'border-neutral-border'}`}
                >
                  <div className="text-sm font-semibold text-brown-dark">POA / Family</div>
                  <div className="text-xs text-body-muted">{smsPoaContacts.length} contact(s)</div>
                </button>
              </div>
            </div>

            {smsTarget === 'poa' && smsPoaContacts.length > 0 && (
              <div>
                <label className="label">Select POA Contact</label>
                <select
                  className="input"
                  value={smsPoaId}
                  onChange={(e) => {
                    setSmsPoaId(e.target.value);
                    const contact = smsPoaContacts.find((c) => c.id === e.target.value);
                    if (contact?.access_token) {
                      setSmsMessage(`BuoyBots: You have a payment due for ${smsPatient.full_name}'s therapy session. View the patient's portal and pay securely: ${window.location.origin}${window.location.pathname}#/poa/${contact.access_token}`);
                    }
                  }}
                >
                  <option value="">Select contact...</option>
                  {smsPoaContacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name} ({c.relationship}) · {c.phone ?? 'No phone'}</option>
                  ))}
                </select>
              </div>
            )}

            {smsTarget === 'poa' && smsPoaContacts.length === 0 && (
              <div className="rounded-2xl border border-neutral-border bg-cream-100 p-3 text-sm text-body-muted">
                No POA contacts for this patient. Add one first.
              </div>
            )}

            <div>
              <label className="label">Message</label>
              <textarea
                className="input min-h-[100px] resize-none"
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
              />
              <p className="mt-1 text-right text-xs text-body-muted">{smsMessage.length} chars</p>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-primary-100 bg-primary-50 px-3 py-2.5">
              <Bell className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
              <p className="text-xs text-brown">
                <span className="font-semibold text-primary-500">Demo Mode:</span> Twilio is not yet configured. The SMS will be
                logged to the SMS Log tab but not delivered to a real phone number.
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setSmsPatient(null)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={handleSendSms}
                disabled={smsSending || (smsTarget === 'poa' && !smsPoaId)}
                className="btn-primary flex-1"
              >
                {smsSending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="h-4 w-4" /> Send SMS</>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
