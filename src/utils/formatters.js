// Utilidades de formato de moneda y fechas argentinas

export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return '$' + Math.round(Number(amount)).toLocaleString('es-AR');
}

export function formatPercent(num) {
  if (isNaN(num) || !isFinite(num)) return '0%';
  const rounded = Math.round(num);
  return (rounded >= 0 ? '+' : '') + rounded + '%';
}

/**
 * Obtiene la fecha en formato 'YYYY-MM-DD' según la zona horaria de Argentina (America/Argentina/Buenos_Aires).
 * Esto evita desfases de UTC (por ejemplo a las 23:30 de la noche que en UTC ya es el día siguiente).
 */
export function getArgentinaDateString(dateInput = new Date()) {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

/**
 * Obtiene el año y mes (0-11) en zona horaria argentina
 */
export function getArgentinaYearMonth(dateInput = new Date()) {
  const str = getArgentinaDateString(dateInput);
  if (!str) return { year: 0, month: 0 };
  const [year, month] = str.split('-').map(Number);
  return { year, month: month - 1 };
}

/**
 * Formatea una fecha ISO a hora local argentina mostrando "Hoy, HH:mm", "Ayer, HH:mm" o fecha completa
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  
  const dateStr = getArgentinaDateString(date);
  const todayStr = getArgentinaDateString(now);
  
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getArgentinaDateString(yesterday);
  
  const isToday = dateStr === todayStr;
  const isYesterday = dateStr === yesterdayStr;
  
  const timeStr = date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ARGENTINA_TIMEZONE
  });
  
  if (isToday) return `Hoy, ${timeStr}`;
  if (isYesterday) return `Ayer, ${timeStr}`;
  
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    timeZone: ARGENTINA_TIMEZONE
  }) + `, ${timeStr}`;
}
