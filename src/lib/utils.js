import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Merges Tailwind class names without conflicts.
 * Standard shadcn/ui utility.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as Indian Rupees currency.
 */
export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a date string in a human-readable format.
 */
export function formatDate(dateString, fmt = 'dd MMM yyyy') {
  if (!dateString) return '—';
  try {
    return format(parseISO(dateString), fmt);
  } catch {
    return dateString;
  }
}

/**
 * Returns relative time string like "2 hours ago".
 */
export function timeAgo(dateString) {
  if (!dateString) return '—';
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
}

/**
 * Formats a datetime for display in IST (India Standard Time context).
 */
export function formatDateTime(dateString) {
  return formatDate(dateString, 'dd MMM yyyy, hh:mm a');
}

/**
 * Generates a short display ID from a UUID.
 */
export function shortId(uuid) {
  if (!uuid) return '—';
  return '#' + uuid.split('-')[0].toUpperCase();
}

/**
 * Truncates text to a max length with ellipsis.
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

/**
 * Converts an array of objects to CSV string and triggers download.
 */
export function exportToCSV(data, filename = 'export.csv') {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h] ?? '';
      const str = String(val).replace(/"/g, '""');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str}"`
        : str;
    }).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Debounce a function (useful for search inputs).
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
