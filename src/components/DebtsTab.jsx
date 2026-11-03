import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import PaginationControls from './PaginationControls';
import { 
  Users, 
  CheckCircle, 
  Trash2, 
  MessageCircle, 
  Plus, 
  Banknote, 
  Smartphone, 
  User, 
  X 
} from 'lucide-react';

export default function DebtsTab({ 
  debts = [], 
  onCollectDebt, 
  onAddDebt, 
  onDeleteDebt 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [collectingDebt, setCollectingDebt] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const DEBTS_PER_PAGE = 7;

  const pendingDebts = debts.filter(d => d.status === 'pending');
  const totalPending = pendingDebts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const totalPages = Math.max(1, Math.ceil(pendingDebts.length / DEBTS_PER_PAGE));
  const paginatedDebts = pendingDebts.slice(
    (currentPage - 1) * DEBTS_PER_PAGE,
    currentPage * DEBTS_PER_PAGE
  );

  const handleCreate = (e) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!customerName.trim() || !numAmt || numAmt <= 0) return;

    onAddDebt({
      id: 'debt_' + Date.now(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      productDesc: productDesc.trim() || 'Productos varios',
      amount: numAmt,
      date: new Date().toISOString(),
      status: 'pending',
      notes: ''
    });

    setCustomerName('');
    setPhone('');
    setProductDesc('');
    setAmount('');
    setShowAddModal(false);
  };

  const confirmCollect = (paymentMethod) => {
    if (!collectingDebt) return;
    onCollectDebt(collectingDebt, paymentMethod);
    setCollectingDebt(null);
  };

  const getWhatsAppLink = (d) => {
    const text = encodeURIComponent(
      `Hola ${d.customerName}! Te escribo de Energía + por los productos (${d.productDesc}). Quedó pendiente un saldo de ${formatCurrency(d.amount)}. Avisame y coordinamos. ¡Muchas gracias!`
    );
    const cleanPhone = (d.phone || '').replace(/\D/g, '');
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  return (
    <div className="space-y-3">
      
      {/* Modal Cobro */}
      {collectingDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">
              Cobrar saldo de {collectingDebt.customerName}
            </h3>
            <p className="text-xs text-slate-600">
              ¿Por qué medio te pagó los <strong className="text-emerald-700 font-bold">{formatCurrency(collectingDebt.amount)}</strong>?
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => confirmCollect('Efectivo')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs active:scale-95"
              >
                <Banknote className="w-4 h-4" />
                <span>En Efectivo</span>
              </button>

              <button
                onClick={() => confirmCollect('Transferencia')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Transferencia</span>
              </button>
            </div>

            <button
              onClick={() => setCollectingDebt(null)}
              className="w-full bg-red-50 border-2 border-red-200 text-red-700 hover:bg-red-100 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Resumen Total a Cobrar */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">Total a Cobrar</span>
          <div className="text-xl font-black text-amber-950 mt-0.5">
            {formatCurrency(totalPending)} <span className="text-xs font-bold text-amber-800">({pendingDebts.length} clientes)</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(!showAddModal)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Anotar Saldo</span>
        </button>
      </div>

      {/* Formulario Anotar Saldo */}
      {showAddModal && (
        <form onSubmit={handleCreate} className="bg-white border-2 border-slate-300 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Anotar saldo pendiente</h4>
            <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Cliente</label>
              <input 
                type="text" 
                required
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ej: Darío, Susi..." 
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Monto ($)</label>
              <input 
                type="number" 
                required
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                placeholder="0" 
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-amber-950 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Productos llevados</label>
            <input 
              type="text" 
              value={productDesc} 
              onChange={e => setProductDesc(e.target.value)}
              placeholder="Ej: 2 bidones de lavandina 5L..." 
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs shadow-md border-2 border-emerald-700 active:scale-98 transition-all"
          >
            Guardar Cuenta Pendiente
          </button>
        </form>
      )}

      {/* Lista de Cuentas por Cobrar */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block px-1">
          Pendientes de Cobro ({pendingDebts.length})
        </span>

        {pendingDebts.length === 0 ? (
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 text-center text-slate-700 font-bold text-xs shadow-xs">
            No hay cobros pendientes actualmente.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="space-y-2">
              {paginatedDebts.map(d => (
                <div 
                  key={d.id}
                  className="bg-white border-2 border-slate-300 rounded-2xl p-3 flex items-center justify-between gap-2 shadow-xs text-xs hover:border-slate-400 transition-all"
                >
                  <div className="truncate flex-1 min-w-0">
                    <div className="font-black text-slate-900 truncate flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{d.customerName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5 font-bold">{d.productDesc}</div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-black text-amber-900 text-xs mr-0.5">
                      {formatCurrency(d.amount)}
                    </span>

                    <button
                      onClick={() => setCollectingDebt(d)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Cobrar</span>
                    </button>

                    <a
                      href={getWhatsAppLink(d)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onDeleteDebt(d.id)}
                      className="w-7 h-7 rounded-xl bg-red-600 text-white border-2 border-red-700 flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all shadow-xs"
                      title="Eliminar Cuenta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación de Cuentas por Cobrar */}
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
