import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginationControls({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = ""
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-between pt-2 px-1 text-xs text-slate-700 font-bold ${className}`}>
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white font-black disabled:opacity-40 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs text-slate-800"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        <span>Anterior</span>
      </button>

      <span className="text-xs font-bold text-slate-600">
        Página <strong className="text-slate-900 font-black">{currentPage}</strong> de {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white font-black disabled:opacity-40 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs text-slate-800"
      >
        <span>Siguiente</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
