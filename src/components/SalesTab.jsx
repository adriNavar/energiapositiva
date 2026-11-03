import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate, getArgentinaDateString } from '../utils/formatters';
import CategoryCombobox from './CategoryCombobox';
import DateFilterBar, { filterItemsByDate } from './DateFilterBar';
import { 
  Trash2, 
  Banknote, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  Minus, 
  Plus, 
  User, 
  X, 
  Search,
  ShoppingBag,
  History,
  TrendingUp,
  Edit2,
  Calendar,
  Eye,
  Receipt,
  Package
} from 'lucide-react';

const CATALOG_ITEMS_PER_PAGE = 8;
const SALES_HISTORY_PER_PAGE = 8;

export default function SalesTab({ 
  products, 
  sales, 
  categories = [],
  onAddSale, 
  onUpdateSale,
  onDeleteSale,
  onAddDebt,
  onAddCategory
}) {
  const [activeSubTab, setActiveSubTab] = useState('new'); // 'new' | 'history'
  const [customerName, setCustomerName] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [selectedCat, setSelectedCat] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [notification, setNotification] = useState('');

  // Estados para Editar Venta
  const [editingSale, setEditingSale] = useState(null);
  const [editCustomer, setEditCustomer] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Efectivo');
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editItems, setEditItems] = useState([]);

  // Estado para Modal de Detalle de Venta (El Ojito 👁️)
  const [viewingSale, setViewingSale] = useState(null);

  const startEditSale = (s) => {
    setEditingSale(s);
    setEditCustomer(s.customer || '');
    setEditPaymentMethod(s.paymentMethod || 'Efectivo');
    setEditDate(s.date ? getArgentinaDateString(s.date) : getArgentinaDateString());
    setEditAmount(String(s.amount || ''));
    setEditItems(s.items && Array.isArray(s.items) ? JSON.parse(JSON.stringify(s.items)) : []);
  };

  const updateEditItemQty = (index, delta) => {
    setEditItems(prev => {
      const copy = [...prev];
      const newQty = Math.max(1, (copy[index].qty || 1) + delta);
      copy[index] = { ...copy[index], qty: newQty };
      const newTotal = copy.reduce((sum, it) => sum + (it.qty * (it.price || 0)), 0);
      setEditAmount(String(newTotal));
      return copy;
    });
  };

  const removeEditItem = (index) => {
    setEditItems(prev => {
      const copy = prev.filter((_, i) => i !== index);
      const newTotal = copy.reduce((sum, it) => sum + (it.qty * (it.price || 0)), 0);
      setEditAmount(String(newTotal));
      return copy;
    });
  };

  const handleSaveEditSale = (e) => {
    e.preventDefault();
    if (!editingSale || !onUpdateSale) return;
    const numAmount = parseFloat(editAmount) || 0;
    if (numAmount <= 0) return;

    let newTitle = editingSale.title;
    if (editItems.length > 0) {
      newTitle = editItems.map(it => `${it.name} (x${it.qty})`).join(', ');
    }

    onUpdateSale(editingSale.id, {
      customer: editCustomer.trim(),
      paymentMethod: editPaymentMethod,
      amount: numAmount,
      date: editDate ? new Date(editDate + 'T12:00:00').toISOString() : editingSale.date,
      items: editItems,
      title: newTitle
    });

    setEditingSale(null);
    showNotify('Venta editada y stock actualizado correctamente');
  };

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  useEffect(() => {
    setCatalogPage(1);
  }, [searchTerm, selectedCat]);

  useEffect(() => {
    setHistoryPage(1);
  }, [historySearchTerm, dateFilter, startDate, endDate]);

  const addProductToOrder = (prod) => {
    setOrderItems(prev => {
      const existing = prev.find(item => item.id === prod.id);
      if (existing) {
        return prev.map(item => 
          item.id === prod.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { 
        id: prod.id, 
        name: prod.name, 
        price: prod.price, 
        unit: prod.unit, 
        qty: 1 
      }];
    });
  };

  const updateItemQty = (prodId, delta) => {
    setOrderItems(prev => {
      return prev.map(item => {
        if (item.id === prodId) {
          const next = item.qty + delta;
          return next > 0 ? { ...item, qty: next } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeItem = (prodId) => {
    setOrderItems(prev => prev.filter(item => item.id !== prodId));
  };

  const orderTotal = orderItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const totalLitersOrUnits = orderItems.reduce((sum, item) => sum + item.qty, 0);

  const handleFinishOrder = (method) => {
    if (orderItems.length === 0 || orderTotal <= 0) {
      alert('Seleccioná al menos un producto para registrar el pedido.');
      return;
    }

    const itemsSummary = orderItems.map(i => `${i.qty}${i.unit === 'Litros' ? 'L' : ''} ${i.name.replace(/ 1L| 5L/, '')}`).join(', ');
    const titleText = customerName.trim() 
      ? `Pedido: ${customerName.trim()} (${itemsSummary})` 
      : itemsSummary;

    if (method === 'A Cobrar' || method === 'Cta. Cte.') {
      if (!customerName.trim()) {
        alert('Escribí el nombre del cliente para registrar la cuenta a cobrar.');
        return;
      }

      onAddDebt({
        id: 'debt_' + Date.now(),
        customerName: customerName.trim(),
        phone: '',
        productDesc: itemsSummary,
        orderItems: [...orderItems],
        amount: orderTotal,
        date: new Date().toISOString(),
        status: 'pending',
        notes: ''
      });

      showNotify(`Saldo a cobrar de ${formatCurrency(orderTotal)} anotado para ${customerName}`);
    } else {
      onAddSale({
        id: 'tx_' + Date.now(),
        type: 'sale',
        customer: customerName.trim() || null,
        title: titleText,
        items: [...orderItems],
        amount: orderTotal,
        paymentMethod: method,
        date: new Date().toISOString(),
        status: 'paid'
      });

      showNotify(`Venta de ${formatCurrency(orderTotal)} registrada`);
    }

    setOrderItems([]);
    setCustomerName('');
  };

  // Filtrado y paginación de productos del catálogo
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCat === 'todos' || p.category === selectedCat;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalCatalogPages = Math.max(1, Math.ceil(filteredProducts.length / CATALOG_ITEMS_PER_PAGE));
  const paginatedCatalog = filteredProducts.slice(
    (catalogPage - 1) * CATALOG_ITEMS_PER_PAGE, 
    catalogPage * CATALOG_ITEMS_PER_PAGE
  );

  // Filtrado y paginación del historial de ventas
  const filteredSales = useMemo(() => {
    let list = filterItemsByDate(sales, dateFilter, startDate, endDate);
    if (historySearchTerm.trim()) {
      const term = historySearchTerm.toLowerCase();
      list = list.filter(s => 
        (s.customer && s.customer.toLowerCase().includes(term)) ||
        (s.title && s.title.toLowerCase().includes(term)) ||
        (s.paymentMethod && s.paymentMethod.toLowerCase().includes(term))
      );
    }
    return list;
  }, [sales, dateFilter, startDate, endDate, historySearchTerm]);

  const totalHistoryPages = Math.max(1, Math.ceil(filteredSales.length / SALES_HISTORY_PER_PAGE));
  const paginatedSales = filteredSales.slice(
    (historyPage - 1) * SALES_HISTORY_PER_PAGE, 
    historyPage * SALES_HISTORY_PER_PAGE
  );

  const totalSalesRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [filteredSales]);

  return (
    <div className="space-y-3">
      {notification && (
        <div className="bg-emerald-600 text-white font-bold p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Modal para Ver Detalle del Pedido (El Ojito 👁️) */}
      {viewingSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-3.5 shadow-2xl border-2 border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 border-2 border-blue-300 text-blue-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Detalle del Pedido</h3>
                  <span className="text-[10px] text-slate-500 font-bold block">{formatDate(viewingSale.date)}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setViewingSale(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ficha Resumen del Cliente y Pago */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Cliente:</span>
                <span className="font-black text-slate-900 text-sm">
                  {viewingSale.customer?.trim() || 'Cliente Ocasional'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Medio de pago:</span>
                <span className="font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {viewingSale.paymentMethod || 'Efectivo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold">Estado:</span>
                <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  ✓ Cobrado
                </span>
              </div>
            </div>

            {/* Grilla / Desglose de Productos */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Productos del Pedido</span>
              </div>

              {viewingSale.items && Array.isArray(viewingSale.items) && viewingSale.items.length > 0 ? (
                <div className="border-2 border-slate-200 rounded-2xl overflow-hidden divide-y-2 divide-slate-100 max-h-56 overflow-y-auto">
                  {viewingSale.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 bg-white flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-black text-slate-900 truncate">{it.name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold">
                          {it.qty} {it.unit || 'u.'} × {formatCurrency(it.price)}
                        </div>
                      </div>
                      <div className="font-black text-slate-900 text-xs shrink-0">
                        {formatCurrency((Number(it.qty) || 1) * (Number(it.price) || 0))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs text-slate-700 font-bold">
                  {viewingSale.title || 'Venta registrada'}
                </div>
              )}
            </div>

            {/* Total Cobrado */}
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 flex items-center justify-between">
              <span className="font-black text-emerald-950 text-xs">Total Cobrado</span>
              <span className="font-black text-emerald-700 text-lg">
                +{formatCurrency(viewingSale.amount)}
              </span>
            </div>

            {/* Botones del Modal */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const s = viewingSale;
                  setViewingSale(null);
                  startEditSale(s);
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border-2 border-amber-500 active:scale-95 transition-all shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar Venta</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingSale(null)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center active:scale-95 transition-all shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Venta */}
      {editingSale && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-3.5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Editar Venta</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingSale(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSale} className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Cliente (Opcional)</label>
                <input
                  type="text"
                  value={editCustomer}
                  onChange={e => setEditCustomer(e.target.value)}
                  placeholder="Nombre del cliente..."
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Medio de Cobro</label>
                  <select
                    value={editPaymentMethod}
                    onChange={e => setEditPaymentMethod(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
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

              {/* Ítems Vendidos */}
              {editItems.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-bold text-slate-800">Productos Vendidos</label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                    {editItems.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="truncate flex-1 min-w-0 pr-1">
                          <div className="font-bold text-slate-900 truncate">{item.name}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{formatCurrency(item.price)} c/u</div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center bg-white rounded-lg border-2 border-slate-300 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateEditItemQty(idx, -1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-700 font-black hover:bg-slate-100 rounded"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-black text-slate-900 text-xs">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => updateEditItemQty(idx, 1)}
                              className="w-6 h-6 flex items-center justify-center text-slate-700 font-black hover:bg-slate-100 rounded"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEditItem(idx)}
                            className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center border border-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Total Cobrado ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 rounded-xl pl-7 pr-3 py-2 text-xs font-black text-emerald-700 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
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

      {/* Switcher Superior */}
      <div className="bg-slate-200 p-1.5 rounded-2xl flex gap-1.5 border-2 border-slate-300">
        <button
          type="button"
          onClick={() => setActiveSubTab('new')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'new'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Armar Venta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historial ({sales.length})</span>
        </button>
      </div>

      {activeSubTab === 'new' ? (
        <div className="space-y-3">
          {/* Ticket / Pedido en Armado */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border-2 border-slate-300 focus-within:border-blue-600">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <input 
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nombre del Cliente (opcional)"
                className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {customerName && (
                <button onClick={() => setCustomerName('')} className="text-slate-400 hover:text-slate-600 p-0.5">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {orderItems.length === 0 ? (
              <div className="text-center py-3 text-xs font-bold text-slate-600 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl">
                Tocá los productos abajo para armar el pedido.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                {orderItems.map(item => (
                  <div 
                    key={item.id}
                    className="bg-slate-50 border-2 border-slate-300 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="overflow-hidden flex-1 min-w-0">
                      <div className="font-black text-slate-900 truncate text-xs">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{formatCurrency(item.price)} c/u</div>
                    </div>

                    <div className="flex items-center bg-white border-2 border-slate-300 rounded-lg p-0.5 shadow-2xs">
                      <button 
                        onClick={() => updateItemQty(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded active:bg-slate-200 font-black"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-black text-xs text-slate-900">{item.qty}</span>
                      <button 
                        onClick={() => updateItemQty(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded active:bg-slate-200 font-black"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-black text-slate-900 text-xs w-16 text-right">
                      {formatCurrency(item.qty * item.price)}
                    </span>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center justify-center font-bold shadow-xs active:scale-90 transition-all border border-red-700 shrink-0"
                      title="Quitar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {orderItems.length > 0 && (
              <div className="pt-2 border-t-2 border-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-bold">{totalLitersOrUnits} productos en ticket</span>
                  <span className="text-lg font-black text-slate-900">
                    {formatCurrency(orderTotal)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleFinishOrder('Efectivo')}
                    className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-all border-2 border-emerald-700"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Efectivo</span>
                  </button>

                  <button
                    onClick={() => handleFinishOrder('Transferencia')}
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-all border-2 border-indigo-700"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Transf.</span>
                  </button>

                  <button
                    onClick={() => handleFinishOrder('A Cobrar')}
                    className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-amber-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs transition-all border-2 border-amber-600"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>A Cobrar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Catálogo */}
          <div className="space-y-2.5">
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar producto para agregar..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              <CategoryCombobox
                categories={categories}
                selectedCategory={selectedCat}
                onSelectCategory={setSelectedCat}
                onAddCategory={onAddCategory}
                showAll={true}
              />
            </div>

            {/* Grilla de Productos */}
            {products.length === 0 ? (
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-600 space-y-1.5 shadow-xs">
                <p className="font-black text-slate-900 text-sm">No hay productos cargados todavía.</p>
                <p className="text-xs text-slate-600 font-semibold">Cargá tus primeros productos en la sección de <strong>Stock</strong>.</p>
              </div>
            ) : paginatedCatalog.length === 0 ? (
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 text-center text-xs font-bold text-slate-600 shadow-xs">
                No se encontraron productos con ese filtro.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {paginatedCatalog.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addProductToOrder(p)}
                    className="bg-white border-2 border-slate-300 hover:border-blue-500 active:border-blue-600 active:scale-98 p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-1.5 shadow-xs"
                  >
                    <div className="overflow-hidden flex-1 min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{p.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-emerald-700 font-black">{formatCurrency(p.price)}</span>
                        <span className="text-[11px] text-slate-500 font-bold">({p.stock} {p.unit || 'u.'})</span>
                      </div>
                    </div>
                    <span className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 font-black text-base shadow-xs active:scale-90 transition-all border border-blue-700">
                      +
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Paginación */}
            {totalCatalogPages > 1 && (
              <div className="flex items-center justify-between pt-1 px-1 text-xs text-slate-700 font-bold">
                <button
                  disabled={catalogPage === 1}
                  onClick={() => setCatalogPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white font-black disabled:opacity-40 hover:bg-slate-50 shadow-2xs transition-all"
                >
                  Anterior
                </button>
                <span className="text-xs font-bold">Página <strong className="text-slate-900 font-black">{catalogPage}</strong> de {totalCatalogPages}</span>
                <button
                  disabled={catalogPage === totalCatalogPages}
                  onClick={() => setCatalogPage(p => Math.min(totalCatalogPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white font-black disabled:opacity-40 hover:bg-slate-50 shadow-2xs transition-all"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Vista de Historial de Ventas */
        <div className="space-y-2.5">
          {/* Tarjeta Resumen Total Ventas */}
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border-2 border-emerald-300 font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  {dateFilter === 'hoy' 
                    ? 'Vendido Hoy' 
                    : dateFilter === 'semana' 
                      ? 'Vendido Esta Semana' 
                      : dateFilter === 'mes' 
                        ? 'Vendido Este Mes' 
                        : dateFilter === 'custom' 
                          ? 'Período Elegido' 
                          : 'Total Recaudado'}
                </span>
                <span className="text-base font-black text-slate-900">{formatCurrency(totalSalesRevenue)}</span>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-800 bg-emerald-100 border-2 border-emerald-300 px-2.5 py-1 rounded-xl">
              {filteredSales.length} {filteredSales.length === 1 ? 'venta' : 'ventas'}
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

          {/* Buscador de Ventas */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente o producto..."
              value={historySearchTerm}
              onChange={e => setHistorySearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
            />
          </div>

          {/* Grilla / Tabla de Ventas */}
          {sales.length === 0 ? (
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-600 space-y-1 shadow-xs">
              <p className="font-black text-slate-900 text-sm">Aún no hay ventas registradas.</p>
              <p className="text-xs text-slate-500 font-semibold">Armá un pedido en la pestaña "Armar Venta".</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 text-center text-xs font-bold text-slate-600 shadow-xs">
              No se encontraron ventas para ese filtro de fecha o búsqueda.
            </div>
          ) : (
            <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xs overflow-hidden">
              {/* Encabezado de la Grilla */}
              <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-slate-100 border-b-2 border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-600 items-center">
                <div className="col-span-3">Fecha</div>
                <div className="col-span-4">Cliente</div>
                <div className="col-span-2 text-right">Monto</div>
                <div className="col-span-3 text-right pr-1">Acciones</div>
              </div>

              {/* Filas de la Grilla */}
              <div className="divide-y-2 divide-slate-100">
                {paginatedSales.map(s => {
                  const clientName = s.customer?.trim() || 'Venta directa';

                  return (
                    <div 
                      key={s.id}
                      className="grid grid-cols-12 gap-1 px-3 py-2.5 items-center text-xs hover:bg-slate-50 transition-colors"
                    >
                      {/* 1. Fecha */}
                      <div className="col-span-3 text-[11px] font-bold text-slate-600 leading-tight">
                        {formatDate(s.date)}
                      </div>

                      {/* 2. A quién / Cliente */}
                      <div className="col-span-4 font-black text-slate-900 truncate pr-1" title={clientName}>
                        {clientName}
                      </div>

                      {/* 3. Monto */}
                      <div className="col-span-2 text-right font-black text-emerald-700 whitespace-nowrap text-xs">
                        +{formatCurrency(s.amount)}
                      </div>

                      {/* 4. Acciones: Ojito, Editar, Eliminar */}
                      <div className="col-span-3 flex items-center justify-end gap-1">
                        {/* Ojito */}
                        <button 
                          type="button"
                          onClick={() => setViewingSale(s)}
                          className="w-7 h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-blue-300 rounded-lg flex items-center justify-center font-bold shadow-2xs transition-all active:scale-90"
                          title="Ver detalle del pedido"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Editar */}
                        <button 
                          type="button"
                          onClick={() => startEditSale(s)}
                          className="w-7 h-7 bg-amber-400 hover:bg-amber-500 text-amber-950 border-2 border-amber-500 rounded-lg flex items-center justify-center font-bold shadow-2xs transition-all active:scale-90"
                          title="Editar Venta"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>

                        {/* Eliminar */}
                        <button 
                          type="button"
                          onClick={() => onDeleteSale(s.id)}
                          className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 rounded-lg flex items-center justify-center font-bold shadow-2xs transition-all active:scale-90"
                          title="Eliminar Venta"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Paginación */}
          {totalHistoryPages > 1 && (
            <div className="flex items-center justify-between pt-1 px-1 text-xs text-slate-700 font-bold">
              <button
                disabled={historyPage === 1}
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white font-black disabled:opacity-40 hover:bg-slate-50 shadow-2xs transition-all"
              >
                Anterior
              </button>
              <span className="text-xs font-bold">Página <strong className="text-slate-900 font-black">{historyPage}</strong> de {totalHistoryPages}</span>
              <button
                disabled={historyPage === totalHistoryPages}
                onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border-2 border-slate-300 bg-white font-black disabled:opacity-40 hover:bg-slate-50 shadow-2xs transition-all"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
