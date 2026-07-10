export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function calculateAge(dob: string): number | null {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function sessionStatusBadge(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-danger',
    'no-show': 'badge-warning',
  };
  return map[status] ?? 'badge-neutral';
}

export function paymentStatusBadge(status: string): string {
  const map: Record<string, string> = {
    paid: 'badge-success',
    pending: 'badge-warning',
    partial: 'badge-primary',
    refunded: 'badge-neutral',
  };
  return map[status] ?? 'badge-neutral';
}
