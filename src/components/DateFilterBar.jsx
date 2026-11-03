import React from 'react';
import { Calendar, X } from 'lucide-react';
import { getArgentinaDateString, ARGENTINA_TIMEZONE } from '../utils/formatters';

export function getLocalDateString(dateInput) {
  return getArgentinaDateString(dateInput);
}

export function filterItemsByDate(items = [], filterType = 'todos', startDate = '', endDate = '') {
  if (!items || !Array.isArray(items)) return [];
  if (filterType === 'todos') return items;

  const now = new Date();
  const todayStr = getArgentinaDateString(now);

  if (filterType === 'hoy') {
    return items.filter(item => {
      if (!item.date) return false;
      return getArgentinaDateString(item.date) === todayStr;
    });
  }

  if (filterType === 'semana') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    const startOfWeekStr = getArgentinaDateString(startOfWeek);

    return items.filter(item => {
      if (!item.date) return false;
      const itemStr = getArgentinaDateString(item.date);
      return itemStr >= startOfWeekStr;
    });
  }

  if (filterType === 'mes') {
    const currentMonthPrefix = todayStr.slice(0, 7); // 'YYYY-MM'
    return items.filter(item => {
      if (!item.date) return false;
      return getArgentinaDateString(item.date).startsWith(currentMonthPrefix);
    });
  }

  if (filterType === 'custom') {
    return items.filter(item => {
      if (!item.date) return false;
      const itemStr = getArgentinaDateString(item.date);
      if (startDate && itemStr < startDate) return false;
      if (endDate && itemStr > endDate) return false;
      return true;
    });
  }

  return items;
}

export default function DateFilterBar({
  filterType = 'todos',
  onSelectFilter,
  startDate = '',
  onStartDateChange,
  endDate = '',
  onEndDateChange,
  activeLabel = '',
  className = ''
}) {
  const filters = [
    { id: 'todos', label: 'Todas' },
    { id: 'hoy', label: 'Hoy' },
    { id: 'semana', label: 'Esta Semana' },
    { id: 'mes', label: 'Este Mes' },
    { id: 'custom', label: 'Elegir Fechas' },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Botones de Filtro Rápido (Chips Horizontales) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
        {filters.map(f => {
          const isSelected = filterType === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs active:scale-95 ${
                isSelected
                  ? f.id === 'custom'
                    ? 'bg-slate-900 text-white shadow-xs border-2 border-slate-900'
                    : 'bg-emerald-600 text-white shadow-xs border-2 border-emerald-700'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Selector de Rango Personalizado */}
      {filterType === 'custom' && (
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3 space-y-2 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b-2 border-slate-100 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-700" />
              <span>Filtrar entre dos fechas</span>
            </span>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  if (onStartDateChange) onStartDateChange('');
                  if (onEndDateChange) onEndDateChange('');
                }}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 text-xs font-bold"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Desde</label>
              <input
                type="date"
                value={startDate}
                onChange={e => onStartDateChange && onStartDateChange(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hasta</label>
              <input
                type="date"
                value={endDate}
                onChange={e => onEndDateChange && onEndDateChange(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
