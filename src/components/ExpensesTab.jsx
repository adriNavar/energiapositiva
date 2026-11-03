import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency, formatDate, getArgentinaDateString } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../data/initialData';
import DateFilterBar, { filterItemsByDate } from './DateFilterBar';
import HabitualExpenseCombobox from './HabitualExpenseCombobox';
import PaginationControls from './PaginationControls';
import { 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Receipt,
  Search,
  TrendingDown,
  Edit2,
  Building2,
  Boxes,
  X,
  Calendar
} from 'lucide-react';

export default function ExpensesTab({ 
  products = [],
  expenses = [], 
  onAddExpense, 
  onUpdateExpense,
  onDeleteExpense 
}) {
  const [category, setCategory] = useState('quimicos');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [supplier, setSupplier] = useState('');
  const [isStockPurchase, setIsStockPurchase] = useState(false);
  const [purchaseProdId, setPurchaseProdId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [notification, setNotification] = useState('');
  const [dateFilter, setDateFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const EXPENSES_PER_PAGE = 8;

  // Edición de gasto
  const [editingExpense, setEditingExpense] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('quimicos');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Efectivo');
  const [editSupplier, setEditSupplier] = useState('');
  const [editDate, setEditDate] = useState('');

  const knownSuppliers = useMemo(() => {
    const set = new Set();
    expenses.forEach(e => {
      if (e.supplier && e.supplier.trim()) set.add(e.supplier.trim());
    });
    return Array.from(set);
  }, [expenses]);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    const prod = products.find(p => p.id === purchaseProdId);
    const qty = parseFloat(purchaseQty) || 0;
    const shouldAddStock = isStockPurchase && !!prod && qty > 0;

    let finalTitle = title.trim();
    if (!finalTitle) {
      if (shouldAddStock) {
        finalTitle = `Compra ${prod.name} (+${qty} ${prod.unit || 'u.'})`;
      } else {
        finalTitle = 'Gasto operativo';
      }
    }

    onAddExpense({
      id: 'exp_' + Date.now(),
      type: 'expense',
      title: finalTitle,
      category,
      amount: numAmount,
      paymentMethod,
      supplier: supplier.trim(),
      isStockPurchase: shouldAddStock,
      productId: shouldAddStock ? prod.id : undefined,
      qtyBought: shouldAddStock ? qty : undefined,
      date: new Date().toISOString(),
      notes: supplier.trim() ? `Proveedor: ${supplier.trim()}` : ''
    });

    showNotify(
      shouldAddStock
        ? `Gasto registrado y se sumaron +${qty} ${prod.unit || 'u.'} a ${prod.name}`
        : `Gasto de ${formatCurrency(numAmount)} registrado`
    );

    setTitle('');
    setAmount('');
    setSupplier('');
    setIsStockPurchase(false);
    setPurchaseProdId('');
    setPurchaseQty('');
  };

  const startEditExpense = (exp) => {
    setEditingExpense(exp);
    setEditTitle(exp.title || '');
    setEditAmount(String(exp.amount || ''));
    setEditCategory(exp.category || 'varios');
    setEditPaymentMethod(exp.paymentMethod || 'Efectivo');
    setEditSupplier(exp.supplier || '');
    setEditDate(exp.date ? getArgentinaDateString(exp.date) : getArgentinaDateString());
  };

  const handleSaveEditExpense = (e) => {
    e.preventDefault();
    if (!editingExpense || !onUpdateExpense) return;
    const numAmt = parseFloat(editAmount) || 0;
    if (numAmt <= 0) return;

    onUpdateExpense(editingExpense.id, {
      title: editTitle.trim() || 'Gasto operativo',
      amount: numAmt,
      category: editCategory,
      paymentMethod: editPaymentMethod,
      supplier: editSupplier.trim(),
      date: editDate ? new Date(editDate + 'T12:00:00').toISOString() : editingExpense.date,
      notes: editSupplier.trim() ? `Proveedor: ${editSupplier.trim()}` : ''
    });

    setEditingExpense(null);
    showNotify('Gasto actualizado correctamente');
  };

  const filteredExpenses = useMemo(() => {
    let list = filterItemsByDate(expenses, dateFilter, startDate, endDate);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(exp => 
        (exp.title && exp.title.toLowerCase().includes(term)) ||
        (exp.category && exp.category.toLowerCase().includes(term)) ||
        (exp.paymentMethod && exp.paymentMethod.toLowerCase().includes(term))
      );
    }
    return list;
  }, [expenses, dateFilter, startDate, endDate, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / EXPENSES_PER_PAGE));
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * EXPENSES_PER_PAGE,
    currentPage * EXPENSES_PER_PAGE
  );

  const totalFilteredExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-3">
      {notification && (
        <div className="bg-emerald-600 text-white font-bold p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Modal para Editar Gasto */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-3.5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Editar Gasto</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingExpense(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Monto ($)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-rose-600 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Medio de Pago</label>
                  <select
                    value={editPaymentMethod}
                    onChange={e => setEditPaymentMethod(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={editSupplier}
                    onChange={e => setEditSupplier(e.target.value)}
                    placeholder="Ej: Química Sur..."
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 bg-red-50 border-2 border-red-300 hover:bg-red-100 text-red-700 font-bold py-2.5 rounded-xl text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs border-2 border-emerald-700"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulario de Gasto */}
      <form onSubmit={handleSubmit} className="bg-white border-2 border-slate-300 rounded-2xl p-4 space-y-3.5 shadow-xs">
        <div className="pb-2 border-b-2 border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-rose-600" />
            <span>Cargar Gasto Operativo</span>
          </h2>
        </div>

        {/* Fila 1: Categoría del Gasto */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Categoría del Gasto
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fila 2: Descripción / Gasto Habitual (Combobox con autocompletado y cosas ya cargadas) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
            <span>Descripción / Gasto Habitual</span>
            <span className="text-[10px] text-blue-700 font-bold">Elegí uno habitual o escribí uno nuevo</span>
          </label>
          <HabitualExpenseCombobox
            value={title}
            onChange={setTitle}
            products={products}
            currentCategory={category}
            onSelectHabitual={(item) => {
              setTitle(item.title);
              if (item.category) setCategory(item.category);
              if (item.isStock && item.productId) {
                setIsStockPurchase(true);
                setPurchaseProdId(item.productId);
              } else {
                setIsStockPurchase(false);
                setPurchaseProdId('');
              }
            }}
            placeholder="Elegir habitual, materia prima o escribir acá..."
          />
        </div>

        {/* Fila 3: Monto Pagado ($) y Proveedor */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Monto Pagado ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">$</span>
              <input 
                type="number" 
                required
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                placeholder="15000" 
                className="w-full bg-white border-2 border-slate-300 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-rose-600 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Proveedor (Opcional)
            </label>
            <input 
              type="text" 
              value={supplier} 
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej: Química Sur, Envases Rossi..." 
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Proveedores frecuentes si existen */}
        {knownSuppliers.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 -mt-1">
            <span className="text-[10px] font-bold text-slate-500">Sugerir proveedor:</span>
            {knownSuppliers.slice(0, 4).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSupplier(s)}
                className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2 py-0.5 rounded-lg font-bold border border-slate-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Compra de Materia Prima / Producto (Sumar al Stock) */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isStockPurchase}
              onChange={e => setIsStockPurchase(e.target.checked)}
              className="w-5 h-5 text-amber-600 rounded border-2 border-amber-400 focus:ring-amber-500"
            />
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-amber-700" />
              <span>¿Es compra de Materia Prima o Producto? (Sumar al stock)</span>
            </span>
          </label>

          {isStockPurchase && (
            <div className="grid grid-cols-12 gap-2 pt-2 border-t-2 border-amber-200/80 animate-in fade-in duration-150">
              <div className="col-span-7">
                <label className="block text-xs font-bold text-amber-950 mb-1">¿Qué producto compraste?</label>
                <select
                  value={purchaseProdId}
                  onChange={e => {
                    setPurchaseProdId(e.target.value);
                    const p = products.find(x => x.id === e.target.value);
                    if (p && !title) setTitle(`Compra ${p.name}`);
                  }}
                  className="w-full bg-white border-2 border-amber-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                >
                  <option value="">Seleccionar materia prima...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock} {p.unit || 'u.'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-5">
                <label className="block text-xs font-bold text-amber-950 mb-1">Cantidad sumada</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={purchaseQty}
                  onChange={e => setPurchaseQty(e.target.value)}
                  placeholder="Ej: 100"
                  className="w-full bg-white border-2 border-amber-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Medio de Pago y Botón */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex bg-slate-200 p-1 rounded-xl border-2 border-slate-300 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaymentMethod('Efectivo')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                paymentMethod === 'Efectivo' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('Transferencia')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                paymentMethod === 'Transferencia' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Transf.
            </button>
          </div>

          <button
            type="submit"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 border-2 border-emerald-700"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Guardar Gasto</span>
          </button>
        </div>
      </form>

      {/* Historial de Gastos con Filtro de Fecha */}
      <div className="space-y-2.5 pt-1">
        {/* Resumen de Gastos del Período */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center border-2 border-rose-300 font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                {dateFilter === 'hoy' 
                  ? 'Gastos de Hoy' 
                  : dateFilter === 'semana' 
                    ? 'Gastos Esta Semana' 
                    : dateFilter === 'mes' 
                      ? 'Gastos Este Mes' 
                      : dateFilter === 'custom' 
                        ? 'Período Elegido' 
                        : 'Total Gastos'}
              </span>
              <span className="text-base font-black text-rose-600">-{formatCurrency(totalFilteredExpensesAmount)}</span>
            </div>
          </div>
          <span className="text-xs font-black text-rose-800 bg-rose-100 border-2 border-rose-300 px-2.5 py-1 rounded-xl">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
          </span>
        </div>

        {/* Filtros de Fecha */}
        <DateFilterBar
          filterType={dateFilter}
          onSelectFilter={setDateFilter}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
        />

        {/* Buscador de Gastos */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por concepto o categoría..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>

        {/* Lista de Gastos */}
        {expenses.length === 0 ? (
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 text-center text-xs font-bold text-slate-700 shadow-xs">
            Aún no hay gastos registrados.
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 text-center text-xs font-bold text-slate-700 shadow-xs">
            No se encontraron gastos para ese filtro de fecha o búsqueda.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="space-y-2">
              {paginatedExpenses.map(exp => (
                <div 
                  key={exp.id}
                  className="bg-white border-2 border-slate-300 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs text-xs"
                >
                  <div className="truncate flex-1 min-w-0">
                    <div className="font-black text-slate-900 truncate flex items-center gap-1.5 flex-wrap">
                      <span>{exp.title}</span>
                      {exp.supplier && (
                        <span className="text-[11px] bg-slate-100 text-slate-900 font-bold px-2 py-0.5 rounded border-2 border-slate-300">
                          Prov: {exp.supplier}
                        </span>
                      )}
                      {exp.isStockPurchase && (
                        <span className="text-[11px] bg-emerald-100 text-emerald-950 font-black px-2 py-0.5 rounded border-2 border-emerald-300">
                          +{exp.qtyBought} stock
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                      {formatDate(exp.date)} • {exp.paymentMethod}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-black text-rose-600 text-xs">
                      -{formatCurrency(exp.amount)}
                    </span>
                    <button 
                      onClick={() => startEditExpense(exp)}
                      className="w-8 h-8 bg-amber-400 hover:bg-amber-500 text-amber-950 border-2 border-amber-500 rounded-xl flex items-center justify-center font-bold shadow-xs transition-all active:scale-90"
                      title="Editar Gasto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDeleteExpense(exp.id)}
                      className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 rounded-xl flex items-center justify-center font-bold shadow-xs transition-all active:scale-90"
                      title="Eliminar Gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación de Gastos */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

    </div>
  );
}
