import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus, 
  FlaskConical, 
  BarChart3, 
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  Receipt,
  Boxes,
  Sparkles
} from 'lucide-react';

export default function DashboardTab({ 
  transactions, 
  debts, 
  products = [],
  onNavigate 
}) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const monthSales = monthTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const monthExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const monthProfit = monthSales - monthExpenses;

  const pendingDebts = debts.filter(d => d.status === 'pending');
  const pendingDebtsTotal = pendingDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const lowStockCount = products.filter(p => (Number(p.stock) || 0) <= 5).length;
  const recentMovements = transactions.slice(0, 3);

  const monthName = now.toLocaleDateString('es-AR', { month: 'long' });
  const dayName = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="space-y-4">
      
      {/* Saludo Limpio */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Hola, Willi
          </h2>
          <p className="text-xs text-slate-500 capitalize mt-0.5">{dayName}</p>
        </div>
      </div>

      {/* Tarjeta Hero de Ganancia Neta */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-5 shadow-lg shadow-emerald-700/15 text-white space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
            Ganancia de {monthName}
          </span>
          <span className="bg-white/20 backdrop-blur-xs text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
            Al día
          </span>
        </div>
        
        <div className="text-3xl font-black tracking-tight text-white">
          {formatCurrency(monthProfit)}
        </div>

        <div className="pt-3 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs">
            <span className="text-emerald-100/80 block text-[11px] font-semibold">Total Ventas</span>
            <span className="font-extrabold text-sm text-white flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              {formatCurrency(monthSales)}
            </span>
          </div>

          <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs">
            <span className="text-emerald-100/80 block text-[11px] font-semibold">Total Gastos</span>
            <span className="font-extrabold text-sm text-white flex items-center gap-1 mt-0.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
              {formatCurrency(monthExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* 2 Botones de Acción Gigantes Táctiles */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('sales')}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white p-4 rounded-3xl font-extrabold flex flex-col items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm">Cargar Venta</span>
        </button>

        <button
          onClick={() => onNavigate('expenses')}
          className="bg-white hover:bg-slate-50 active:scale-95 transition-all text-slate-800 border border-slate-200/90 p-4 rounded-3xl font-extrabold flex flex-col items-center justify-center gap-2 shadow-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Minus className="w-5 h-5" />
          </div>
          <span className="text-sm text-rose-600">- Cargar Gasto</span>
        </button>
      </div>

      {/* Alertas Importantes (Cobros Pendientes o Bajo Stock) */}
      <div className="space-y-2">
        {pendingDebtsTotal > 0 && (
          <div 
            onClick={() => onNavigate('debts')}
            className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:bg-amber-100/60 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-900">Tenés {pendingDebts.length} cobro(s) pendiente(s)</div>
                <div className="text-[11px] text-amber-700">Total a cobrar: <strong className="font-extrabold">{formatCurrency(pendingDebtsTotal)}</strong></div>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-2.5 py-1 rounded-xl">Cobrar</span>
          </div>
        )}

        {lowStockCount > 0 && (
          <div 
            onClick={() => onNavigate('stock')}
            className="bg-sky-50 border border-sky-200/80 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer active:scale-98 transition-all hover:bg-sky-100/60 shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <Boxes className="w-5 h-5 text-sky-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-sky-900">{lowStockCount} producto(s) con poco stock</div>
                <div className="text-[11px] text-sky-700">Revisá tu inventario para reponer</div>
              </div>
            </div>
            <span className="text-xs font-bold text-sky-800 bg-sky-200/60 px-2.5 py-1 rounded-xl">Ver Stock</span>
          </div>
        )}
      </div>

      {/* Accesos Limpios */}
      <div className="space-y-2.5">
        {/* Stock y Productos */}
        <div 
          onClick={() => onNavigate('stock')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Stock y Catálogo</h3>
              <p className="text-xs text-slate-500">Cargar productos, reposición de compras y precios</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Calculadora de Preparados */}
        <div 
          onClick={() => onNavigate('calculator')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Calculadora de Preparación</h3>
              <p className="text-xs text-slate-500">Rendimiento de cloro a lavandina y costos</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Reportes Mensuales */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 flex items-center justify-between cursor-pointer active:scale-98 transition-all shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Reportes del Mes</h3>
              <p className="text-xs text-slate-500">Balances, en qué gastaste y lo más vendido</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Últimos Movimientos o Estado Limpio */}
      {recentMovements.length === 0 ? (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 text-center space-y-1.5 shadow-2xs">
          <p className="text-xs font-bold text-slate-800">
            ¡Todo limpio y listo para empezar!
          </p>
          <p className="text-[11px] text-slate-500">
            Podés cargar tus primeros productos en <strong>Stock y Catálogo</strong> o registrar tus operaciones con los botones de arriba.
          </p>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Últimos Registros</span>
            <button 
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Ver reporte
            </button>
          </div>

          <div className="space-y-2">
            {recentMovements.map(t => {
              const isSale = t.type === 'sale';
              return (
                <div 
                  key={t.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between text-xs shadow-xs"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isSale ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {isSale ? <ShoppingBag className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate">
                        {t.customer && <span className="text-emerald-700 font-extrabold mr-1">[{t.customer}]</span>}
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{formatDate(t.date)}</div>
                    </div>
                  </div>
                  <span className={`font-black shrink-0 ${isSale ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isSale ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
