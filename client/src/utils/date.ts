/**
 * Returns a date formatted as 'YYYY-MM-DD' in local timezone.
 * Avoids UTC day-shift bugs caused by new Date().toISOString().split('T')[0].
 */
export function localDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default localDateString;
