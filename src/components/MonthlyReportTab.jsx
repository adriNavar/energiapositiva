import React, { useState, useMemo } from 'react';
import { formatCurrency, formatPercent, formatDate, getArgentinaYearMonth } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../data/initialData';
import DebtsTab from './DebtsTab';
import DateFilterBar, { filterItemsByDate } from './DateFilterBar';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  BarChart3,
  Users,
  ShoppingBag,
  Building2,
  Package,
  Banknote,
  Smartphone
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function MonthlyReportTab({ 
  transactions = [], 
  debts = [],
  onCollectDebt,
  onAddDebt,
  onDeleteDebt
}) {
  const [activeReportSubTab, setActiveReportSubTab] = useState('balance'); // 'balance' | 'debts'

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [dateFilter, setDateFilter] = useState('mes');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const pendingDebts = debts.filter(d => d.status === 'pending');

  const handlePrevMonth = () => {
    setDateFilter('mes');
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setDateFilter('mes');
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const activeTransactions = useMemo(() => {
    if (dateFilter === 'mes') {
      return transactions.filter(t => {
        if (!t.date) return false;
        const ym = getArgentinaYearMonth(t.date);
        return ym.year === selectedYear && ym.month === selectedMonth;
      });
    }
    return filterItemsByDate(transactions, dateFilter, startDate, endDate);
  }, [transactions, dateFilter, selectedYear, selectedMonth, startDate, endDate]);

  const reportData = useMemo(() => {
    let salesTotal = 0;
    let salesCount = 0;
    let expensesTotal = 0;
    let expensesCount = 0;
    let cashSales = 0;
    let transferSales = 0;

    const expensesByCat = {};
    EXPENSE_CATEGORIES.forEach(c => {
      expensesByCat[c.id] = { label: c.label, amount: 0, count: 0 };
    });

    const productsMap = {};

    activeTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'sale') {
        salesTotal += amt;
        salesCount++;
        if (t.paymentMethod === 'Efectivo') cashSales += amt;
        if (t.paymentMethod === 'Transferencia') transferSales += amt;

        if (t.items && Array.isArray(t.items)) {
          t.items.forEach(item => {
            const name = item.name.replace(/ 1L| 5L/, '');
            if (!productsMap[name]) productsMap[name] = { name, total: 0, qty: 0 };
            productsMap[name].total += (item.qty * item.price);
            productsMap[name].qty += item.qty;
          });
        } else {
          const prodName = t.title ? t.title.replace(/\s*\(x\d+\)/, '') : 'Ventas varias';
          if (!productsMap[prodName]) productsMap[prodName] = { name: prodName, total: 0, qty: 0 };
          productsMap[prodName].total += amt;
          productsMap[prodName].qty += (Number(t.qty) || 1);
        }
      } else if (t.type === 'expense') {
        expensesTotal += amt;
        expensesCount++;
        const catKey = t.category || 'varios';
        if (!expensesByCat[catKey]) {
          expensesByCat[catKey] = { label: 'Varios', amount: 0, count: 0 };
        }
        expensesByCat[catKey].amount += amt;
        expensesByCat[catKey].count++;
      }
    });

    const netProfit = salesTotal - expensesTotal;
    const margin = expensesTotal > 0 ? (netProfit / expensesTotal) * 100 : (salesTotal > 0 ? 100 : 0);

    const sortedExpenses = Object.values(expensesByCat)
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const suppliersMap = {};
    activeTransactions.forEach(t => {
      if (t.type === 'expense' && t.supplier && t.supplier.trim()) {
        const s = t.supplier.trim();
        if (!suppliersMap[s]) suppliersMap[s] = { name: s, total: 0, count: 0 };
        suppliersMap[s].total += (Number(t.amount) || 0);
        suppliersMap[s].count++;
      }
    });

    const sortedSuppliers = Object.values(suppliersMap).sort((a, b) => b.total - a.total);
    const allSoldProducts = Object.values(productsMap).sort((a, b) => b.total - a.total);
    const topProducts = allSoldProducts.slice(0, 5);
    const averageTicket = salesCount > 0 ? Math.round(salesTotal / salesCount) : 0;

    return {
      salesTotal,
      salesCount,
      averageTicket,
      expensesTotal,
      expensesCount,
      cashSales,
      transferSales,
      netProfit,
      margin,
      sortedExpenses,
      topProducts,
      allSoldProducts,
      sortedSuppliers,
    };
  }, [activeTransactions]);

  const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  const periodLabel = useMemo(() => {
    if (dateFilter === 'hoy') return 'Hoy';
    if (dateFilter === 'semana') return 'Esta Semana';
    if (dateFilter === 'mes') return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    if (dateFilter === 'custom') {
      if (startDate && endDate) return `${formatDate(startDate)} al ${formatDate(endDate)}`;
      if (startDate) return `Desde ${formatDate(startDate)}`;
      if (endDate) return `Hasta ${formatDate(endDate)}`;
      return 'Período Elegido';
    }
    return 'Histórico Completo';
  }, [dateFilter, selectedMonth, selectedYear, startDate, endDate]);

  return (
    <div className="space-y-3">

      {/* Switcher Superior */}
      {/* Switcher Superior de Reportes (4 Opciones Claras con Alto Contraste) */}
      <div className="bg-slate-200 p-1.5 rounded-2xl flex gap-1.5 border-2 border-slate-300 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveReportSubTab('balance')}
          className={`flex-1 min-w-[75px] py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
            activeReportSubTab === 'balance'
              ? 'bg-slate-900 text-white font-extrabold shadow-sm'
              : 'bg-white text-slate-800 font-bold border border-slate-300 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Balance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportSubTab('sales')}
          className={`flex-1 min-w-[75px] py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
            activeReportSubTab === 'sales'
              ? 'bg-slate-900 text-white font-extrabold shadow-sm'
              : 'bg-white text-slate-800 font-bold border border-slate-300 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Ventas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportSubTab('expenses')}
          className={`flex-1 min-w-[75px] py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
            activeReportSubTab === 'expenses'
              ? 'bg-slate-900 text-white font-extrabold shadow-sm'
              : 'bg-white text-slate-800 font-bold border border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Gastos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportSubTab('debts')}
          className={`flex-1 min-w-[75px] py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
            activeReportSubTab === 'debts'
              ? 'bg-slate-900 text-white font-extrabold shadow-sm'
              : 'bg-white text-slate-800 font-bold border border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>A Cobrar</span>
        </button>
      </div>

      {/* Filtros de Fecha para las 3 secciones financieras */}
      {activeReportSubTab !== 'debts' && (
        <div className="space-y-2">
          <DateFilterBar
            filterType={dateFilter}
            onSelectFilter={setDateFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />

          {/* Selector de Mes (cuando está activo el filtro 'Este Mes') */}
          {dateFilter === 'mes' && (
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
              <button
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center transition-all active:scale-95 font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Mes Seleccionado</div>
                <div className="text-xs font-black text-slate-900 capitalize mt-0.5">
                  {periodLabel}
                </div>
              </div>

              <button
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center transition-all active:scale-95 font-bold"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1. VISTA DE BALANCE GENERAL */}
      {activeReportSubTab === 'balance' && (
        <div className="space-y-3">
          {/* Resumen Financiero del Período */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Ganancia Limpia ({periodLabel})
              </span>
              <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                {formatPercent(reportData.margin)} rentab.
              </span>
            </div>

            <div className={`text-3xl font-black leading-tight ${reportData.netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(reportData.netProfit)}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t-2 border-slate-200 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border-2 border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-700 block font-bold uppercase tracking-wider">Total Ventas ({reportData.salesCount})</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5 mt-1 text-sm">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  {formatCurrency(reportData.salesTotal)}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border-2 border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-700 block font-bold uppercase tracking-wider">Total Gastos ({reportData.expensesCount})</span>
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5 mt-1 text-sm">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  {formatCurrency(reportData.expensesTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Medios de Cobro */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">Medios de Cobro</span>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">Efectivo</div>
                <div className="text-base font-black text-slate-900 mt-1">{formatCurrency(reportData.cashSales)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">Transferencia</div>
                <div className="text-base font-black text-slate-900 mt-1">{formatCurrency(reportData.transferSales)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. VISTA DE REPORTE DE VENTAS */}
      {activeReportSubTab === 'sales' && (
        <div className="space-y-3">
          {/* Tarjeta Resumen Ventas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Resumen de Ventas ({periodLabel})
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {reportData.salesCount} {reportData.salesCount === 1 ? 'pedido' : 'pedidos'}
              </span>
            </div>
            <div className="text-xl font-black text-slate-900">
              {formatCurrency(reportData.salesTotal)}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-medium block">Ticket Promedio</span>
                <span className="font-bold text-slate-800 text-xs">{formatCurrency(reportData.averageTicket)}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <span className="text-[10px] text-slate-400 font-medium block">Cobrado Electrónico</span>
                <span className="font-bold text-indigo-700 text-xs">
                  {reportData.salesTotal > 0 ? Math.round((reportData.transferSales / reportData.salesTotal) * 100) : 0}% Transf.
                </span>
              </div>
            </div>
          </div>

          {/* Ranking de Productos Más Vendidos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Ranking de Productos Más Vendidos ({reportData.allSoldProducts.length})
            </span>

            {reportData.allSoldProducts.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No hubo ventas de productos en este período.
              </div>
            ) : (
              <div className="space-y-2">
                {reportData.allSoldProducts.map((p, idx) => {
                  const maxTotal = reportData.allSoldProducts[0]?.total || 1;
                  const barPercent = Math.min(100, Math.round((p.total / maxTotal) * 100));

                  return (
                    <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                            idx === 0 ? 'bg-amber-400 text-amber-950 font-black' :
                            idx === 1 ? 'bg-slate-300 text-slate-800 font-black' :
                            idx === 2 ? 'bg-amber-600 text-white font-black' :
                            'bg-slate-200 text-slate-600 font-bold'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 truncate text-[11px]">{p.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-emerald-700 text-xs block">{formatCurrency(p.total)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{p.qty} vendidos</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${barPercent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. VISTA DE REPORTE DE GASTOS Y PROVEEDORES */}
      {activeReportSubTab === 'expenses' && (
        <div className="space-y-3">
          {/* Tarjeta Resumen Gastos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Gastado ({periodLabel})
              </span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                {reportData.expensesCount} {reportData.expensesCount === 1 ? 'gasto' : 'gastos'}
              </span>
            </div>
            <div className="text-xl font-black text-rose-600">
              {formatCurrency(reportData.expensesTotal)}
            </div>
          </div>

          {/* Gastos por Rubro / Categoría */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Gastos por Rubro</span>
            {reportData.sortedExpenses.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400">
                No hay gastos registrados en este período.
              </div>
            ) : (
              <div className="space-y-1.5">
                {reportData.sortedExpenses.map((cat, idx) => {
                  const percent = reportData.expensesTotal > 0 
                    ? Math.round((cat.amount / reportData.expensesTotal) * 100) 
                    : 0;

                  return (
                    <div key={idx} className="space-y-0.5 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-medium text-slate-700">{cat.label}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(cat.amount)} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                        <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gastos por Proveedor */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Gastos por Proveedor ({reportData.sortedSuppliers.length})
            </span>

            {reportData.sortedSuppliers.length === 0 ? (
              <div className="py-3 text-center text-xs text-slate-400 space-y-1">
                <p>No hay compras con proveedor anotado en este período.</p>
                <p className="text-[10px] text-slate-400">Podés indicar el proveedor en la pestaña de Gastos al comprar materias primas o insumos.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {reportData.sortedSuppliers.map((prov, idx) => {
                  const maxSup = reportData.sortedSuppliers[0]?.total || 1;
                  const barPercent = Math.min(100, Math.round((prov.total / maxSup) * 100));

                  return (
                    <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pr-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-900 truncate text-[11px]">{prov.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-rose-600 text-xs block">{formatCurrency(prov.total)}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{prov.count} {prov.count === 1 ? 'compra' : 'compras'}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${barPercent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. VISTA DE CUENTAS POR COBRAR */}
      {activeReportSubTab === 'debts' && (
        <DebtsTab 
          debts={debts}
          onCollectDebt={onCollectDebt}
          onAddDebt={onAddDebt}
          onDeleteDebt={onDeleteDebt}
        />
      )}

    </div>
  );
}
