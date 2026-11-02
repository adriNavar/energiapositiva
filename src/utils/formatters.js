// Utilidades de formato de moneda y fechas argentinas

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return '$' + Math.round(Number(amount)).toLocaleString('es-AR');
}

export function formatPercent(num) {
  if (isNaN(num) || !isFinite(num)) return '0%';
  const rounded = Math.round(num);
  return (rounded >= 0 ? '+' : '') + rounded + '%';
}

export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  const timeStr = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) return `Hoy, ${timeStr}`;
  if (isYesterday) return `Ayer, ${timeStr}`;
  
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) + `, ${timeStr}`;
}
