import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { Package, PlusCircle, Trash2, Edit2, Check, X } from 'lucide-react';

export default function CatalogTab({ 
  products, 
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct 
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('Litro');

  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editCost, setEditCost] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    onAddProduct({
      id: 'prod_' + Date.now(),
      name: name.trim(),
      cost: parseFloat(cost) || 0,
      price: parseFloat(price) || 0,
      unit: unit || 'Unidad',
    });
    setName('');
    setCost('');
    setPrice('');
    setShowAdd(false);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditPrice(String(p.price));
    setEditCost(String(p.cost || 0));
  };

  const saveEdit = (id) => {
    onUpdateProduct(id, {
      price: parseFloat(editPrice) || 0,
      cost: parseFloat(editCost) || 0,
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg">📋</span>
            Lista de Productos y Precios
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Controlá tus costos y cuánto le ganás a cada producto.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-2xl shadow-md transition-all active:scale-95"
          title="Agregar Producto"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Formulario nuevo producto */}
      {showAdd && (
        <form onSubmit={handleCreate} className="bg-slate-800/90 border border-cyan-500/30 rounded-3xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Nuevo Producto a la Venta</h4>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Producto</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Desengrasante Multiuso 1L" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Costo ($)</label>
              <input 
                type="number" 
                value={cost} 
                onChange={e => setCost(e.target.value)}
                placeholder="0" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-rose-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Venta ($) *</label>
              <input 
                type="number" 
                required
                value={price} 
                onChange={e => setPrice(e.target.value)}
                placeholder="1500" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unidad</label>
              <select 
                value={unit} 
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="Litro">Litro</option>
                <option value="Bidón">Bidón</option>
                <option value="Unidad">Unidad</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md"
          >
            Guardar Producto
          </button>
        </form>
      )}

      {/* Lista de Productos */}
      <div className="space-y-2.5">
        {products.map(p => {
          const isEditing = editingId === p.id;
          const unitProfit = (p.price || 0) - (p.cost || 0);
          const margin = p.cost > 0 ? (unitProfit / p.cost) * 100 : 100;

          return (
            <div 
              key={p.id}
              className="bg-slate-800/90 border border-slate-700/60 rounded-2xl p-3.5 space-y-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="overflow-hidden">
                  <div className="text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                    <span>🧴</span>
                    <span>{p.name}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Unidad: <span className="text-slate-300 font-semibold">{p.unit || 'Litro'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(p)}
                    className="text-slate-400 hover:text-cyan-400 p-1.5 rounded-lg"
                    title="Editar precios"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="text-slate-600 hover:text-rose-400 p-1.5 rounded-lg"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="bg-slate-900/90 p-3 rounded-xl border border-cyan-500/50 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">Costo:</span>
                      <input 
                        type="number" 
                        value={editCost} 
                        onChange={e => setEditCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-rose-400 font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Precio Venta:</span>
                      <input 
                        type="number" 
                        value={editPrice} 
                        onChange={e => setEditPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-emerald-400 font-bold"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => saveEdit(p.id)}
                      className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                  <div className="bg-slate-900/60 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Costo</span>
                    <span className="font-extrabold text-rose-400">{formatCurrency(p.cost)}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-slate-400 block font-semibold">Venta</span>
                    <span className="font-extrabold text-emerald-400">{formatCurrency(p.price)}</span>
                  </div>
                  <div className="bg-emerald-950/40 border border-emerald-500/20 p-2 rounded-xl text-center">
                    <span className="text-[10px] text-emerald-300 block font-semibold">Ganancia</span>
                    <span className="font-extrabold text-emerald-300">+{formatCurrency(unitProfit)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
