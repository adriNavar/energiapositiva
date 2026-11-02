import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import CategoryCombobox from './CategoryCombobox';
import { 
  Boxes, 
  Plus, 
  Minus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Search, 
  Package, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  CheckCircle2,
  Tag,
  FlaskConical
} from 'lucide-react';

const ITEMS_PER_PAGE = 7;

export function getProductType(p) {
  if (p.type) return p.type;
  if (p.category === 'quimicos' || p.category === 'envases') return 'materia_prima';
  if (p.category === 'preparados') return 'preparado';
  return 'materia_prima';
}

export default function InventoryTab({ 
  products, 
  categories = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onAddCategory,
  onNavigateToTab
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [notification, setNotification] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('todos');
  const [selectedType, setSelectedType] = useState('todos'); // 'todos' | 'materia_prima' | 'preparado' | 'directo'
  const [currentPage, setCurrentPage] = useState(1);

  // Formulario nuevo producto
  const [name, setName] = useState('');
  const [productType, setProductType] = useState('materia_prima'); // 'materia_prima' | 'preparado' | 'directo'
  const [category, setCategory] = useState(categories[0]?.id || 'jabones');
  const [stock, setStock] = useState('0');
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('Litros');

  // Estado de edición
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('materia_prima');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editUnit, setEditUnit] = useState('Litros');

  // Reiniciar a página 1 al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCat, selectedType]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    onAddProduct({
      id: 'prod_' + Date.now(),
      name: name.trim(),
      type: productType,
      category,
      stock: parseFloat(stock) || 0,
      cost: parseFloat(cost) || 0,
      price: parseFloat(price) || 0,
      unit: unit || 'Litros',
    });
    setName('');
    setProductType('materia_prima');
    setStock('0');
    setCost('');
    setPrice('');
    setShowAdd(false);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditType(getProductType(p));
    setEditCategory(p.category || categories[0]?.id || 'jabones');
    setEditPrice(String(p.price));
    setEditCost(String(p.cost || 0));
    setEditStock(String(p.stock || 0));
    setEditUnit(p.unit || 'Litros');
  };

  const saveEdit = (id) => {
    onUpdateProduct(id, {
      name: editName.trim(),
      type: editType,
      category: editCategory,
      price: parseFloat(editPrice) || 0,
      cost: parseFloat(editCost) || 0,
      stock: parseFloat(editStock) || 0,
      unit: editUnit,
    });
    setEditingId(null);
  };

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCat === 'todos' || p.category === selectedCat;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const pType = getProductType(p);
    const matchesType = selectedType === 'todos' || pType === selectedType;
    return matchesCat && matchesSearch && matchesType;
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const totalStockItems = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const totalValuation = products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.cost) || 0)), 0);

  return (
    <div className="space-y-3">
      
      {/* Notificación flotante */}
      {notification && (
        <div className="bg-emerald-600 text-white font-bold p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Barra de Resumen */}
      <div className="bg-white rounded-2xl p-3.5 shadow-xs border-2 border-slate-300 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs text-slate-700 font-medium">
              <strong className="text-slate-900 font-extrabold">
                {products.length} {products.length === 1 ? 'producto' : 'productos'} en catálogo
              </strong>
            </span>
          </div>
        </div>

        <div>
          {/* Botón Nuevo Producto (AZUL AGREGAR) */}
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className={`w-full font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs border-2 ${
              showAdd 
                ? 'bg-blue-800 text-white border-blue-900' 
                : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-white border-2 border-slate-300 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b-2 border-slate-100">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Nuevo Producto</span>
            </h4>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-700 p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Tipo de Ítem</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setProductType('materia_prima')}
                className={`p-2 rounded-xl border-2 text-center transition-all ${
                  productType === 'materia_prima'
                    ? 'bg-amber-100 border-amber-500 text-amber-950 font-black shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-black">Materia Prima</div>
                <div className="text-[9px] font-normal text-slate-600">Insumo / químico</div>
              </button>
              <button
                type="button"
                onClick={() => setProductType('preparado')}
                className={`p-2 rounded-xl border-2 text-center transition-all ${
                  productType === 'preparado'
                    ? 'bg-emerald-100 border-emerald-600 text-emerald-950 font-black shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-black">Preparado</div>
                <div className="text-[9px] font-normal text-slate-600">Fabricación propia</div>
              </button>
              <button
                type="button"
                onClick={() => setProductType('directo')}
                className={`p-2 rounded-xl border-2 text-center transition-all ${
                  productType === 'directo'
                    ? 'bg-sky-100 border-sky-500 text-sky-950 font-black shadow-xs'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-black">Directo</div>
                <div className="text-[9px] font-normal text-slate-600">Reventa directa</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Nombre del Producto</label>
            <input 
              type="text" 
              required
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Lavandina 1L, Detergente..." 
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Categoría</label>
              <CategoryCombobox
                categories={categories}
                selectedCategory={category}
                onSelectCategory={setCategory}
                onAddCategory={onAddCategory}
                showAll={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Unidad</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              >
                <option value="Litros">Litros</option>
                <option value="Unidades">Unidades</option>
                <option value="Bidones 5L">Bidones 5L</option>
                <option value="Botellas 1L">Botellas 1L</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Stock Inicial</label>
              <input 
                type="number" 
                value={stock} 
                onChange={e => setStock(e.target.value)}
                placeholder="0" 
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Costo ($)</label>
              <input 
                type="number" 
                value={cost} 
                onChange={e => setCost(e.target.value)}
                placeholder="0" 
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-rose-600 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Venta ($) *</label>
              <input 
                type="number" 
                required
                value={price} 
                onChange={e => setPrice(e.target.value)}
                placeholder="1500" 
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-emerald-700 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs transition-all active:scale-98 shadow-md border-2 border-emerald-700"
          >
            Guardar Producto
          </button>
        </form>
      )}

      {/* Buscador de Producto y Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar producto por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
          />
        </div>

        {/* Filtro rápido por tipo de producto (Materia Prima sin emojis) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'materia_prima', label: 'Materia Prima' },
            { id: 'preparado', label: 'Preparados' },
            { id: 'directo', label: 'Directos' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedType(t.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs active:scale-95 ${
                selectedType === t.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-800 border-2 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <CategoryCombobox
          categories={categories}
          selectedCategory={selectedCat}
          onSelectCategory={setSelectedCat}
          onAddCategory={onAddCategory}
          showAll={true}
        />
      </div>

      {/* Lista de Productos con Separación Clara y Fuerte entre Tarjetas */}
      <div className="space-y-2.5">
        {products.length === 0 ? (
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 text-center text-xs space-y-1 shadow-xs">
            <p className="font-bold text-slate-800">Todavía no tenés productos cargados.</p>
            <p className="text-slate-500 text-[11px]">Tocá arriba en <strong>Nuevo Producto</strong> para empezar.</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 text-center text-slate-700 font-bold text-xs shadow-xs">
            No se encontraron productos con ese filtro.
          </div>
        ) : (
          paginatedProducts.map(p => {
            const isEditing = editingId === p.id;
            const currentStock = Number(p.stock) || 0;
            const unitProfit = (Number(p.price) || 0) - (Number(p.cost) || 0);

              const pType = getProductType(p);

              return (
                <div 
                  key={p.id}
                  className="bg-white rounded-2xl p-3.5 border-2 border-slate-300 shadow-sm hover:border-slate-400 transition-all space-y-2.5"
                >
                  {isEditing ? (
                    /* Modo Edición */
                    <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">Tipo de Ítem</label>
                        <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setEditType('materia_prima')}
                            className={`p-1.5 rounded-lg border-2 text-center transition-all ${
                              editType === 'materia_prima'
                                ? 'bg-amber-100 border-amber-500 text-amber-950 font-black'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            Materia Prima
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditType('preparado')}
                            className={`p-1.5 rounded-lg border-2 text-center transition-all ${
                              editType === 'preparado'
                                ? 'bg-emerald-100 border-emerald-600 text-emerald-950 font-black'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            Preparado
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditType('directo')}
                            className={`p-1.5 rounded-lg border-2 text-center transition-all ${
                              editType === 'directo'
                                ? 'bg-sky-100 border-sky-500 text-sky-950 font-black'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            Directo
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Nombre</label>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-white border-2 border-slate-300 rounded-lg p-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-700 block font-bold">Stock</span>
                          <input 
                            type="number" 
                            value={editStock} 
                            onChange={e => setEditStock(e.target.value)}
                            className="w-full bg-white border-2 border-slate-300 rounded-lg p-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-700 block font-bold">Costo ($)</span>
                          <input 
                            type="number" 
                            value={editCost} 
                            onChange={e => setEditCost(e.target.value)}
                            className="w-full bg-white border-2 border-slate-300 rounded-lg p-1.5 text-xs font-bold text-rose-600 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-700 block font-bold">Venta ($)</span>
                          <input 
                            type="number" 
                            value={editPrice} 
                            onChange={e => setEditPrice(e.target.value)}
                            className="w-full bg-white border-2 border-slate-300 rounded-lg p-1.5 text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-red-50 border-2 border-red-200 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => saveEdit(p.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Tarjeta con Contenido Limpio */
                    <div className="space-y-2">
                      
                      {/* Fila 1: Nombre, Badge de Tipo, Margen y Stock Pill */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {p.name}
                            </span>
                            {pType === 'materia_prima' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-300">
                                Materia Prima
                              </span>
                            )}
                            {pType === 'preparado' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-950 border border-emerald-300">
                                Preparado
                              </span>
                            )}
                            {pType === 'directo' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-950 border border-sky-300">
                                Directo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                            <span>Costo {formatCurrency(p.cost)}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-extrabold">Gana +{formatCurrency(unitProfit)}</span>
                          </div>
                        </div>

                        {/* Stock Pill Elegante */}
                        <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border-2 shrink-0 ${
                          currentStock > 0 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400' 
                            : 'bg-rose-100 text-rose-900 border-rose-400'
                        }`}>
                          {currentStock > 0 ? `${currentStock} ${p.unit || 'u.'}` : 'Sin Stock'}
                        </span>
                      </div>

                    {/* Fila 2: Separador Sutil y Botones de Acción Coloridos */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                      
                      {/* Precio */}
                      <div>
                        <span className="text-sm font-black text-slate-900">
                          {formatCurrency(p.price)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold ml-0.5">
                          / {p.unit?.slice(0, -1) || 'u'}
                        </span>
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex items-center gap-1.5">
                        
                        {/* Si es preparado: botón Fabricar (Verde) que lleva a Preparados */}
                        {pType === 'preparado' && (
                          <button
                            type="button"
                            onClick={() => onNavigateToTab ? onNavigateToTab('preparation') : null}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all border-2 border-emerald-700"
                            title="Fabricar lote descontando materias primas"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>Fabricar</span>
                          </button>
                        )}

                        {/* Botón Editar (AMARILLO EDITAR) */}
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="w-7 h-7 bg-amber-400 hover:bg-amber-500 text-amber-950 border-2 border-amber-500 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
                          title="Editar producto o corregir inventario"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Eliminar (ROJO ELIMINAR) */}
                        <button
                          type="button"
                          onClick={() => onDeleteProduct(p.id)}
                          className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-600">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold disabled:opacity-40 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <span className="font-semibold text-[11px]">
            Página <strong className="text-slate-900">{currentPage}</strong> de {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold disabled:opacity-40 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
          >
            <span>Siguiente</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
