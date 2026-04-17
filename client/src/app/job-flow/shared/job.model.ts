export type JobStatus =
  | 'link_sent'
  | 'contract_signed'
  | 'deposit_authorized'
  | 'deposit_paid'
  | 'in_progress'
  | 'pending_confirmation'
  | 'completed';

export interface Job {
  _id: string;
  jobId: string;
  customerPhone: string;
  customerName?: string;
  serviceDescription: string;
  totalAmount: number;
  depositAmount: number;
  status: JobStatus;
  scheduledDate?: string;
  timeSlotStart?: string;
  timeSlotEnd?: string;
  smsLinkSentAt?: string;
  contractSignedAt?: string;
  depositPaidAt?: string;
  completedAt?: string;
  customerConfirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderConfig {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  contractText: string;
}

export function statusLabel(status: JobStatus): string {
  const map: Record<JobStatus, string> = {
    link_sent: 'Link Sent',
    contract_signed: 'Contract Signed',
    deposit_authorized: 'Deposit Authorized',
    deposit_paid: 'Deposit Paid',
    in_progress: 'In Progress',
    pending_confirmation: 'Awaiting Confirmation',
    completed: 'Completed',
  };
  return map[status] ?? status;
}

export function statusClasses(status: JobStatus): string {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
  const map: Record<JobStatus, string> = {
    link_sent: 'bg-blue-100 text-blue-700',
    contract_signed: 'bg-orange-100 text-orange-700',
    deposit_authorized: 'bg-teal-100 text-teal-700',
    deposit_paid: 'bg-green-100 text-green-700',
    in_progress: 'bg-indigo-100 text-indigo-700',
    pending_confirmation: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };
  return `${base} ${map[status] ?? 'bg-gray-100 text-gray-700'}`;
}
