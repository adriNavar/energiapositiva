import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { 
  FlaskConical, 
  Users, 
  Boxes, 
  Download, 
  Upload, 
  ChevronRight, 
  BookOpen,
  ShieldCheck,
  Menu
} from 'lucide-react';
import { exportBackup, importBackup } from '../utils/storage';

export default function MenuTab({ 
  debts, 
  products, 
  recipes, 
  onNavigate, 
  onDataRestored 
}) {
  const pendingDebts = debts.filter(d => d.status === 'pending');
  const pendingTotal = pendingDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const lowStockCount = products.filter(p => (Number(p.stock) || 0) <= 5).length;

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importBackup(file, () => {
      alert('Copia de seguridad restaurada con éxito');
      if (onDataRestored) onDataRestored();
    }, (err) => {
      alert('Error al importar archivo: ' + err);
    });
  };

  return (
    <div className="space-y-3">
      
      {/* Opciones Principales Estilo Fila Compacta */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
        
        {/* 1. Stock y Productos */}
        <div 
          onClick={() => onNavigate('stock')}
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Stock y Productos</span>
                {lowStockCount > 0 && (
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-extrabold px-1.5 py-0.2 rounded-md">
                    {lowStockCount} bajos
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">{products.length} productos • Cargar stock y compras</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* 2. Calculadora de Preparados */}
        <div 
          onClick={() => onNavigate('calculator')}
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Calculadora de Preparación</div>
              <div className="text-[11px] text-slate-400">Rendimiento de cloro, fórmulas y costos</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* 3. Cuentas y Cobranzas */}
        <div 
          onClick={() => onNavigate('debts')}
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Cuentas por Cobrar</span>
                {pendingDebts.length > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded-md">
                    {pendingDebts.length}
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                {pendingTotal > 0 ? `Total pendiente: ${formatCurrency(pendingTotal)}` : 'Sin saldos pendientes'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

      </div>

      {/* Respaldo Compacto */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 space-y-2 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Copia de Seguridad</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Tus datos se guardan en este celular sin internet. Descargá un archivo de respaldo.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={exportBackup}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Copia</span>
          </button>

          <label className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurar</span>
            <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
          </label>
        </div>
      </div>

      {/* Cómo agregar como App */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-[11px] text-slate-500 space-y-1">
        <span className="font-bold text-slate-800 flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          Instalar en la pantalla del celular:
        </span>
        <p>En el menú de Chrome o Safari seleccioná <strong>"Agregar a la pantalla principal"</strong>.</p>
      </div>

    </div>
  );
}
