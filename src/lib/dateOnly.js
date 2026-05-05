const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getDateOnlyValue(date) {
  if (!date) return '';

  if (typeof date === 'string' && DATE_ONLY_PATTERN.test(date)) {
    return date;
  }

  return new Date(date).toISOString().slice(0, 10);
}

export function parseDateOnlyForStorage(date) {
  const value = getDateOnlyValue(date);

  if (!value) return null;

  return new Date(`${value}T12:00:00.000Z`);
}

export function formatDateOnly(date, options = { year: 'numeric', month: 'long', day: 'numeric' }) {
  const value = getDateOnlyValue(date);

  if (!value) return '';

  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString('es-MX', options);
}
