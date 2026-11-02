import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import CategoryCombobox from './CategoryCombobox';
import DateFilterBar, { filterItemsByDate } from './DateFilterBar';
import { 
  FlaskConical, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  History, 
  Calendar,
  X,
  Search,
  ArrowLeft
} from 'lucide-react';

export default function PreparationTab({ 
  products = [], 
  categories = [],
  preparations = [], 
  onProducePreparation,
  onDeletePreparation,
  onAddCategory 
}) {
  const [activeSubTab, setActiveSubTab] = useState('create'); // 'create' | 'history'
  const [notification, setNotification] = useState('');

  // Modo de producto terminado: null (pantalla inicial) | 'new' | 'existing'
  const [productMode, setProductMode] = useState(null);
  const [existingProdId, setExistingProdId] = useState('');
  const [finishedName, setFinishedName] = useState('');
  const [finishedCategory, setFinishedCategory] = useState(categories[0]?.id || 'preparados');
  const [finishedUnit, setFinishedUnit] = useState('Litros');
  const [yieldQty, setYieldQty] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  // Lista de insumos a descontar
  const [ingredients, setIngredients] = useState([
    { id: '', qty: '' }
  ]);

  // Filtros de fecha y búsqueda para historial
  const [dateFilter, setDateFilter] = useState('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  const filteredPreparations = useMemo(() => {
    let list = filterItemsByDate(preparations, dateFilter, startDate, endDate);
    if (historySearchTerm.trim()) {
      const q = historySearchTerm.toLowerCase();
      list = list.filter(p => 
        p.finishedName?.toLowerCase().includes(q) ||
        p.ingredients?.some(ing => ing.name?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [preparations, dateFilter, startDate, endDate, historySearchTerm]);

  const totalYieldInFilter = useMemo(() => {
    return filteredPreparations.reduce((sum, p) => sum + (parseFloat(p.yieldQty) || 0), 0);
  }, [filteredPreparations]);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // Agregar fila de insumo
  const addIngredientRow = () => {
    setIngredients(prev => [...prev, { id: '', qty: '' }]);
  };

  // Actualizar fila de insumo
  const updateIngredientRow = (index, field, value) => {
    setIngredients(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Eliminar fila de insumo
  const removeIngredientRow = (index) => {
    if (ingredients.length <= 1) return;
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  // Si selecciona un producto existente, sincronizar datos
  const handleSelectExistingProduct = (prodId) => {
    setExistingProdId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setFinishedName(prod.name);
      setFinishedCategory(prod.category || 'preparados');
      setFinishedUnit(prod.unit || 'Litros');
      if (prod.price) setSellPrice(String(prod.price));
    }
  };

  // Calcular total de litros de insumos usados
  const totalIngredientQty = ingredients.reduce((sum, ing) => {
    return sum + (parseFloat(ing.qty) || 0);
  }, 0);

  // Calcular costo total acumulado de insumos usados
  const totalIngredientsCost = ingredients.reduce((sum, ing) => {
    const prod = products.find(p => p.id === ing.id);
    const qty = parseFloat(ing.qty) || 0;
    const unitCost = prod ? (Number(prod.cost) || 0) : 0;
    return sum + (qty * unitCost);
  }, 0);

  const numYield = parseFloat(yieldQty) || 0;
  const costPerLiter = numYield > 0 ? (totalIngredientsCost / numYield) : 0;
  const numPrice = parseFloat(sellPrice) || 0;
  const profitPerLiter = numPrice > costPerLiter ? (numPrice - costPerLiter) : 0;

  // Ayuda inteligente para completar la cantidad obtenida según la unidad elegida
  const smartYieldSuggestion = useMemo(() => {
    if (totalIngredientQty <= 0) return null;
    if (finishedUnit === 'Bidones 5L') {
      const bidones = Math.floor(totalIngredientQty / 5);
      if (bidones > 0) {
        return {
          qty: bidones,
          label: `Son ${bidones} bidones (de ${totalIngredientQty}L)`
        };
      }
      return {
        qty: totalIngredientQty,
        label: `Usar ${totalIngredientQty}L`
      };
    }
    if (finishedUnit === 'Botellas 1L') {
      return {
        qty: Math.floor(totalIngredientQty),
        label: `Son ${Math.floor(totalIngredientQty)} botellas (de ${totalIngredientQty}L)`
      };
    }
    return {
      qty: totalIngredientQty,
      label: `Usar los ${totalIngredientQty}L de insumos`
    };
  }, [totalIngredientQty, finishedUnit]);

  // Enviar fabricación
  const handleSubmit = (e) => {
    e.preventDefault();

    const finalName = productMode === 'new' ? finishedName.trim() : (products.find(p => p.id === existingProdId)?.name || finishedName.trim());
    if (!finalName) {
      alert('Ingresá el nombre del producto terminado.');
      return;
    }

    if (!numYield || numYield <= 0) {
      alert('Ingresá la cantidad total producida (rendimiento).');
      return;
    }

    // Validar insumos
    const validIngredients = ingredients
      .filter(ing => ing.id && parseFloat(ing.qty) > 0)
      .map(ing => {
        const prod = products.find(p => p.id === ing.id);
        const qty = parseFloat(ing.qty);
        return {
          productId: ing.id,
          name: prod ? prod.name : 'Insumo',
          unit: prod ? (prod.unit || 'Litros') : 'Litros',
          qty: qty,
          unitCost: prod ? (Number(prod.cost) || 0) : 0,
          totalCost: prod ? ((Number(prod.cost) || 0) * qty) : 0,
        };
      });

    if (validIngredients.length === 0) {
      alert('Agregá al menos un insumo del stock con su cantidad a utilizar.');
      return;
    }

    onProducePreparation({
      finishedName: finalName,
      finishedCategory: finishedCategory,
      yieldQty: numYield,
      sellPrice: numPrice,
      unit: finishedUnit,
      unitCost: costPerLiter,
      totalCost: totalIngredientsCost,
      ingredientsUsed: validIngredients,
      isExisting: productMode === 'existing',
      existingProductId: existingProdId
    });

    showNotify(`¡Preparado "${finalName}" (+${numYield} ${finishedUnit}) registrado y stock actualizado!`);

    // Reset form
    setFinishedName('');
    setExistingProdId('');
    setYieldQty('');
    setSellPrice('');
    setIngredients([{ id: '', qty: '' }]);
    setProductMode(null);
  };

  return (
    <div className="space-y-3">
      
      {/* Notificación flotante */}
      {notification && (
        <div className="bg-emerald-600 text-white font-bold p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Switcher Superior */}
      <div className="bg-slate-200 p-1.5 rounded-2xl flex gap-1.5 border-2 border-slate-300">
        <button
          type="button"
          onClick={() => setActiveSubTab('create')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeSubTab === 'create'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Fabricar Preparado</span>
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
          <span>Historial ({preparations.length})</span>
        </button>
      </div>

      {activeSubTab === 'create' ? (
        !productMode ? (
          /* PANTALLA INICIAL: SELECCIÓN DE MODO DE FABRICACIÓN */
          <div className="space-y-3.5 pt-1">
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 text-center shadow-xs">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                ¿Qué vas a fabricar hoy?
              </h2>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                Elegí una opción para comenzar la elaboración:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Opción 1: Nuevo Producto */}
              <button
                type="button"
                onClick={() => {
                  setProductMode('new');
                  setExistingProdId('');
                }}
                className="bg-white border-2 border-slate-300 hover:border-blue-600 active:border-blue-600 rounded-2xl p-4 text-left shadow-xs transition-all active:scale-[0.98] group flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
                    Opción 1
                  </span>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                    Fabricar Nuevo Producto
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Creá un preparado desde cero: definí su nombre, categoría, unidad y precio de venta.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border-2 border-slate-300 flex items-center justify-center font-black text-base group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors shrink-0 mt-1">
                  →
                </div>
              </button>

              {/* Opción 2: Sumar a Producto Existente */}
              <button
                type="button"
                onClick={() => {
                  setProductMode('existing');
                }}
                className="bg-white border-2 border-slate-300 hover:border-emerald-600 active:border-emerald-600 rounded-2xl p-4 text-left shadow-xs transition-all active:scale-[0.98] group flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Opción 2
                  </span>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Sumar a Producto Existente
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    Elegí un producto que ya tenés en catálogo y sumale más stock fabricado descontando materias primas.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border-2 border-slate-300 flex items-center justify-center font-black text-base group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-colors shrink-0 mt-1">
                  →
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE 3 PASOS */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Barra superior con botón Cambiar */}
            <div className="flex items-center justify-between bg-white border-2 border-slate-300 rounded-2xl p-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductMode(null)}
                  className="bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-900 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all border-2 border-slate-300"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cambiar</span>
                </button>
                <div className="text-xs font-bold text-slate-700">
                  Modo: <span className="text-slate-900 font-black">{productMode === 'new' ? 'Fabricar Nuevo Producto' : 'Sumar a Producto Existente'}</span>
                </div>
              </div>
            </div>

            {/* Paso 1: Producto a Fabricar */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-100">
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {productMode === 'new' ? '1. Datos del Nuevo Producto' : '1. Elegir Producto Existente'}
                </h2>
              </div>

              {productMode === 'new' ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Nombre del preparado</label>
                    <input
                      type="text"
                      required
                      value={finishedName}
                      onChange={e => setFinishedName(e.target.value)}
                      placeholder="Ej: Lavandina Perfumada Pino / Detergente..."
                      className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Categoría</label>
                      <CategoryCombobox
                        categories={categories}
                        selectedCategory={finishedCategory}
                        onSelectCategory={setFinishedCategory}
                        onAddCategory={onAddCategory}
                        showAll={false}
                        placeholder="Elegir categoría"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Unidad</label>
                      <select
                        value={finishedUnit}
                        onChange={e => setFinishedUnit(e.target.value)}
                        className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                      >
                        <option value="Litros">Litros</option>
                        <option value="Unidades">Unidades</option>
                        <option value="Bidones 5L">Bidones 5L</option>
                        <option value="Botellas 1L">Botellas 1L</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Seleccionar producto del catálogo</label>
                  <select
                    required
                    value={existingProdId}
                    onChange={e => handleSelectExistingProduct(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="">Seleccionar producto a sumar stock...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock actual: {p.stock} {p.unit || 'u.'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Paso 2: Insumos a Descontar */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      2. Insumos a descontar del stock
                    </h2>
                    <p className="text-[11px] text-slate-500 font-semibold">Se descuentan automáticamente al fabricar</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1 border-2 border-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insumo</span>
                </button>
              </div>

              {products.length === 0 ? (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-center text-xs text-amber-900 font-bold">
                  No tenés productos cargados en stock. Primero cargá tu materia prima en la pestaña de Stock.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {ingredients.map((ing, idx) => {
                    const selectedProd = products.find(p => p.id === ing.id);
                    const currentStock = selectedProd ? (Number(selectedProd.stock) || 0) : 0;
                    const qtyEntered = parseFloat(ing.qty) || 0;
                    const remaining = currentStock - qtyEntered;
                    const isOver = qtyEntered > currentStock;

                    return (
                      <div 
                        key={idx} 
                        className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">
                            Insumo #{idx + 1}
                          </span>
                          {ingredients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeIngredientRow(idx)}
                              className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center shadow-xs active:scale-90 transition-all border border-red-700"
                              title="Quitar Insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-8">
                            <select
                              required
                              value={ing.id}
                              onChange={e => updateIngredientRow(idx, 'id', e.target.value)}
                              className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                            >
                              <option value="">Elegir insumo / materia prima...</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (Stock: {p.stock} {p.unit || 'u.'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-4">
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              required
                              placeholder="Cant."
                              value={ing.qty}
                              onChange={e => updateIngredientRow(idx, 'qty', e.target.value)}
                              className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                            />
                          </div>
                        </div>

                        {selectedProd && qtyEntered > 0 && (
                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                            <span className={isOver ? 'text-red-600 font-black' : 'text-slate-600 font-bold'}>
                              Stock actual: {currentStock} ➔ Quedan: <strong className={isOver ? 'text-red-600 font-black' : 'text-slate-900 font-black'}>{remaining.toFixed(1)}</strong>
                            </span>
                            {selectedProd.cost > 0 && (
                              <span className="text-slate-600 font-bold">
                                Costo: {formatCurrency(qtyEntered * selectedProd.cost)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Paso 3: Cantidad Obtenida y Precio de Venta */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-3.5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-100">
                <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    3. ¿Cuánto fabricaste y a qué precio lo vendés?
                  </h2>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Indicá cuánto producto final obtuviste para sumar al stock y el precio de venta.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800">
                      {finishedUnit === 'Litros' 
                        ? 'Litros finales' 
                        : finishedUnit === 'Bidones 5L' 
                          ? 'Bidones 5L finales' 
                          : finishedUnit === 'Botellas 1L' 
                            ? 'Botellas 1L finales' 
                            : `Total de ${finishedUnit}`}
                    </label>
                    {smartYieldSuggestion && !yieldQty && (
                      <button
                        type="button"
                        onClick={() => setYieldQty(String(smartYieldSuggestion.qty))}
                        className="text-[10px] text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-1.5 py-0.5 rounded-md font-black transition-all active:scale-95"
                        title="Copiar cálculo basado en los insumos agregados"
                      >
                        {smartYieldSuggestion.label}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      value={yieldQty}
                      onChange={e => setYieldQty(e.target.value)}
                      placeholder={finishedUnit === 'Bidones 5L' ? 'Ej: 6' : 'Ej: 30'}
                      className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                    <span className="text-xs font-black text-slate-800 shrink-0 bg-slate-100 px-2.5 py-2 rounded-xl border-2 border-slate-300">
                      {finishedUnit}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {`Precio venta x ${finishedUnit === 'Bidones 5L' ? 'bidón' : finishedUnit === 'Botellas 1L' ? 'botella' : finishedUnit === 'Litros' ? 'litro' : 'u.'} ($)`}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={sellPrice}
                      onChange={e => setSellPrice(e.target.value)}
                      placeholder={finishedUnit === 'Bidones 5L' ? 'Ej: 5000' : 'Ej: 1200'}
                      className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Resumen */}
              {numYield > 0 && (
                <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Se sumarán al Stock:</span>
                    <span className="text-emerald-700 font-black text-sm">+{numYield} {finishedUnit}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-300 text-xs">
                    <div>
                      <span className="text-slate-600 block font-semibold">Costo estimado:</span>
                      <strong className="text-slate-900 font-black">
                        {totalIngredientsCost > 0 ? `${formatCurrency(costPerLiter)} / ${unit || 'Litro'}` : 'Sin costo'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-600 block font-semibold">Ganancia estimada:</span>
                      <strong className="text-emerald-700 font-black">
                        {profitPerLiter > 0 ? `${formatCurrency(profitPerLiter)} / ${unit || 'Litro'}` : (numPrice > 0 ? `${formatCurrency(numPrice)} / ${unit || 'Litro'}` : '$0')}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón Fabricar */}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-98 border-2 border-emerald-700"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Fabricar Preparado y Actualizar Stock</span>
              </button>
            </div>

          </form>
        )
      ) : (
        /* Vista de Historial de Preparaciones */
        <div className="space-y-2">
          {/* Tarjeta Resumen de Elaboraciones */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  {dateFilter === 'hoy' 
                    ? 'Fabricado Hoy' 
                    : dateFilter === 'semana' 
                      ? 'Fabricado Esta Semana' 
                      : dateFilter === 'mes' 
                        ? 'Fabricado Este Mes' 
                        : dateFilter === 'custom' 
                          ? 'Período Elegido' 
                          : 'Total Fabricado'}
                </span>
                <span className="text-sm font-black text-slate-900">
                  {filteredPreparations.length} {filteredPreparations.length === 1 ? 'preparado' : 'preparados'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-lg">
              +{totalYieldInFilter} producidos
            </span>
          </div>

          {/* Filtros Rápidos de Fecha */}
          <DateFilterBar
            filterType={dateFilter}
            onSelectFilter={setDateFilter}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
          />

          {/* Buscador de Preparados */}
          {preparations.length > 0 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={historySearchTerm}
                onChange={e => setHistorySearchTerm(e.target.value)}
                placeholder="Buscar por nombre o insumo..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              {historySearchTerm && (
                <button
                  type="button"
                  onClick={() => setHistorySearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {preparations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 space-y-1 shadow-2xs">
              <FlaskConical className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-800">Aún no realizaste ningún preparado.</p>
              <p className="text-[11px] text-slate-400">
                Podés mezclar insumos de tu stock (por ejemplo lavandina + desodorante) y fabricar tus productos listos para la venta.
              </p>
            </div>
          ) : filteredPreparations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500 space-y-1 shadow-2xs">
              <p className="font-bold text-slate-800">No se encontraron preparados para este filtro.</p>
              <p className="text-[11px] text-slate-400">
                Probá seleccionando "Todas" o cambiando el rango de fechas.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPreparations.map(prep => (
                <div
                  key={prep.id}
                  className="bg-white border border-slate-300 rounded-2xl p-3.5 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <h4 className="font-bold text-slate-900 text-xs">{prep.finishedName}</h4>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(prep.date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="bg-emerald-50 text-emerald-700 font-bold text-[11px] px-2.5 py-0.5 rounded-lg border border-emerald-200/70">
                        +{prep.yieldQty} {prep.unit || 'L'}
                      </span>
                      {onDeletePreparation && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar este registro de preparación de "${prep.finishedName}"?`)) {
                              onDeletePreparation(prep.id);
                            }
                          }}
                          className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
                          title="Eliminar Preparación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Insumos descontados */}
                  {prep.ingredients && prep.ingredients.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-2 text-xs space-y-0.5 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Insumos descontados:
                      </span>
                      {prep.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span>• {ing.name}</span>
                          <span className="font-bold text-slate-900">-{ing.qty} {ing.unit || 'L'}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>Venta: <strong className="text-slate-900">{formatCurrency(prep.sellPrice)} / {prep.unit?.slice(0, -1) || 'L'}</strong></span>
                    {prep.unitCost > 0 && (
                      <span>Costo: <strong className="text-slate-900">{formatCurrency(prep.unitCost)} / {prep.unit?.slice(0, -1) || 'L'}</strong></span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
