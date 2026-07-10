export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth + 'T00:00:00');
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function sessionStatusBadge(status: string): string {
  switch (status) {
    case 'completed':
      return 'badge-success';
    case 'scheduled':
      return 'badge-info';
    case 'cancelled':
      return 'badge-neutral';
    default:
      return 'badge-neutral';
  }
}

export function paymentStatusBadge(status: string): string {
  switch (status) {
    case 'paid':
      return 'badge-success';
    case 'partial':
      return 'badge-warning';
    case 'pending':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
}

export function cardBrandIcon(brand: string | null): string {
  if (!brand) return 'card';
  const b = brand.toLowerCase();
  if (b === 'visa') return 'cc-visa';
  if (b === 'mastercard') return 'cc-mastercard';
  if (b === 'amex' || b === 'american express') return 'cc-amex';
  if (b === 'discover') return 'cc-discover';
  return 'card';
}
