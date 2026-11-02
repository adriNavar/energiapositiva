import React, { useState } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { 
  FlaskConical, 
  BookmarkPlus, 
  Receipt, 
  Boxes, 
  Trash2, 
  CheckCircle2, 
  Plus
} from 'lucide-react';

export default function CalculatorTab({ 
  recipes, 
  products = [],
  onSaveRecipe, 
  onDeleteRecipe, 
  onRegisterExpenseFromCalc,
  onAddProductFromCalc,
  onAddStockFromCalc
}) {
  const [name, setName] = useState('Lavandina Común');
  const [rawMaterial, setRawMaterial] = useState('Cloro concentrado');
  const [buyQty, setBuyQty] = useState('30');
  const [buyCost, setBuyCost] = useState('18000');
  const [yieldQty, setYieldQty] = useState('50');
  const [sellPrice, setSellPrice] = useState('1200');
  const [notification, setNotification] = useState('');

  const numericBuyCost = parseFloat(buyCost) || 0;
  const numericYieldQty = parseFloat(yieldQty) || 0;
  const numericSellPrice = parseFloat(sellPrice) || 0;

  const costPerLiter = numericYieldQty > 0 ? (numericBuyCost / numericYieldQty) : 0;
  const totalRevenue = numericYieldQty * numericSellPrice;
  const cleanProfit = totalRevenue - numericBuyCost;
  const marginPercent = numericBuyCost > 0 ? (cleanProfit / numericBuyCost) * 100 : 0;

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const handleSaveRecipe = () => {
    if (!name.trim()) return;
    const newRecipe = {
      id: 'rec_' + Date.now(),
      name,
      rawMaterial,
      buyQty: parseFloat(buyQty) || 0,
      buyCost: numericBuyCost,
      yieldQty: numericYieldQty,
      sellPricePerUnit: numericSellPrice,
      notes: `${buyQty}L de ${rawMaterial} rinden ${yieldQty}L`,
    };
    onSaveRecipe(newRecipe);
    showNotify(`Fórmula "${name}" guardada`);
  };

  const handleRegisterExpense = () => {
    if (numericBuyCost <= 0) return;
    onRegisterExpenseFromCalc({
      title: `Compra de ${rawMaterial || 'materia prima'} (${buyQty}L)`,
      amount: numericBuyCost,
      category: 'quimicos',
      paymentMethod: 'Efectivo',
      notes: `Para preparar ${yieldQty}L de ${name}`
    });
    showNotify(`Gasto de ${formatCurrency(numericBuyCost)} registrado`);
  };

  const handleAddToStock = () => {
    if (numericYieldQty <= 0) return;
    if (onAddStockFromCalc) {
      onAddStockFromCalc(name, numericYieldQty);
      showNotify(`+${numericYieldQty} Litros sumados al stock`);
    }
  };

  const loadRecipe = (r) => {
    setName(r.name);
    setRawMaterial(r.rawMaterial || '');
    setBuyQty(String(r.buyQty));
    setBuyCost(String(r.buyCost));
    setYieldQty(String(r.yieldQty));
    setSellPrice(String(r.sellPricePerUnit));
    showNotify(`"${r.name}" cargada`);
  };

  return (
    <div className="space-y-3">
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-[390px] mx-auto bg-emerald-700 text-white font-bold p-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Formulario Compacto */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <FlaskConical className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Calculadora de Preparación / Lotes
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Producto final</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Materia Prima</label>
            <input 
              type="text" 
              value={rawMaterial} 
              onChange={(e) => setRawMaterial(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Comprás</label>
            <input 
              type="number" 
              value={buyQty} 
              onChange={(e) => setBuyQty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-900 text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Costo ($)</label>
            <input 
              type="number" 
              value={buyCost} 
              onChange={(e) => setBuyCost(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-bold text-rose-600 text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Rinde (L)</label>
            <input 
              type="number" 
              value={yieldQty} 
              onChange={(e) => setYieldQty(e.target.value)}
              className="w-full bg-emerald-50 border border-emerald-300 rounded-lg p-1 text-xs font-bold text-emerald-800 text-center"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Venta ($)</label>
            <input 
              type="number" 
              value={sellPrice} 
              onChange={(e) => setSellPrice(e.target.value)}
              className="w-full bg-emerald-50 border border-emerald-300 rounded-lg p-1 text-xs font-bold text-emerald-800 text-center"
            />
          </div>
        </div>

        {/* Resultados Compactos */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Costo real x Litro: <strong className="text-slate-800">{formatCurrency(costPerLiter)}</strong></span>
            <span className="text-slate-500">Total Venta: <strong className="text-slate-800">{formatCurrency(totalRevenue)}</strong></span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Ganancia Limpia</span>
              <span className="text-lg font-black text-emerald-600 leading-tight">{formatCurrency(cleanProfit)}</span>
            </div>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              {formatPercent(marginPercent)}
            </span>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button 
            onClick={handleAddToStock}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-xs"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Sumar +{yieldQty}L al Stock</span>
          </button>

          <button 
            onClick={handleRegisterExpense}
            className="bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-2xs"
          >
            <Receipt className="w-3.5 h-3.5 text-rose-600" />
            <span>Gasto de ${numericBuyCost.toLocaleString('es-AR')}</span>
          </button>
        </div>
      </div>

      {/* Recetas Guardadas Compactas */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Fórmulas Guardadas ({recipes.length})
        </span>

        {recipes.map(r => (
          <div 
            key={r.id}
            className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs text-xs"
          >
            <div onClick={() => loadRecipe(r)} className="cursor-pointer flex-1 min-w-0">
              <div className="font-bold text-slate-900 truncate">{r.name}</div>
              <div className="text-[10px] text-slate-400">
                {r.buyQty}L concentrado ➔ rinde <strong className="text-emerald-700">{r.yieldQty}L</strong>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => loadRecipe(r)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-[11px]"
              >
                Cargar
              </button>
              <button
                onClick={() => onDeleteRecipe(r.id)}
                className="text-slate-300 hover:text-rose-600 p-0.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
