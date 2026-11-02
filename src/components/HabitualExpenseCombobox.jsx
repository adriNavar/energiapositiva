import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Plus, Trash2, X, Boxes, Receipt } from 'lucide-react';

const STORAGE_KEY = 'energia_plus_habitual_expenses_v2';

const DEFAULT_HABITUALS = [
  { id: 'h1', title: 'Nafta reparto', category: 'flete' },
  { id: 'h2', title: 'Bidones 5L vacíos', category: 'envases' },
  { id: 'h3', title: 'Botellas 1L vacías', category: 'envases' },
  { id: 'h4', title: 'Tapas con precinto', category: 'envases' },
  { id: 'h5', title: 'Bolsas y embalaje', category: 'etiquetas' },
  { id: 'h6', title: 'Rollo de etiquetas', category: 'etiquetas' },
  { id: 'h7', title: 'Luz / Electricidad', category: 'varios' },
  { id: 'h8', title: 'Alquiler local', category: 'varios' },
  { id: 'h9', title: 'Monotributo', category: 'varios' },
  { id: 'h10', title: 'Mantenimiento / Reparaciones', category: 'varios' },
];

export default function HabitualExpenseCombobox({
  value = '',
  onChange,
  onSelectHabitual,
  products = [],
  currentCategory = 'quimicos',
  placeholder = "Elegir habitual o escribir descripción..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos'); // 'todos' | 'stock' | 'operativos'
  const containerRef = useRef(null);

  const [habitualList, setHabitualList] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_HABITUALS;
    } catch {
      return DEFAULT_HABITUALS;
    }
  });

  const saveHabituals = (list) => {
    setHabitualList(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const addHabitual = (titleToAdd) => {
    const trimmed = titleToAdd.trim();
    if (!trimmed) return;
    if (habitualList.some(h => h.title.toLowerCase() === trimmed.toLowerCase())) return;

    const newItem = {
      id: 'hab_' + Date.now(),
      title: trimmed,
      category: currentCategory || 'varios'
    };
    const updated = [newItem, ...habitualList];
    saveHabituals(updated);
    if (onSelectHabitual) {
      onSelectHabitual({ title: trimmed, category: newItem.category, isStock: false });
    } else if (onChange) {
      onChange(trimmed);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const removeHabitual = (id, e) => {
    e.stopPropagation();
    const updated = habitualList.filter(h => h.id !== id);
    saveHabituals(updated);
  };

  // Cerrar al tocar afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen]);

  // Ítems de productos cargados en stock
  const stockItems = products.map(p => ({
    id: 'prod_' + p.id,
    title: p.name,
    isStock: true,
    productId: p.id,
    stock: p.stock,
    unit: p.unit || 'u.',
    category: p.type === 'materia_prima' ? 'quimicos' : (p.category === 'envases' ? 'envases' : 'quimicos')
  }));

  // Gastos habituales operativos
  const operationalItems = habitualList.map(h => ({
    ...h,
    isStock: false
  }));

  const query = searchTerm.toLowerCase().trim();

  const filteredStock = stockItems.filter(item => 
    !query || item.title.toLowerCase().includes(query)
  );

  const filteredOperat = operationalItems.filter(item => 
    !query || item.title.toLowerCase().includes(query)
  );

  const isExactMatch = 
    stockItems.some(i => i.title.toLowerCase() === query) ||
    operationalItems.some(i => i.title.toLowerCase() === query);

  const handlePickItem = (item) => {
    if (onSelectHabitual) {
      onSelectHabitual(item);
    } else if (onChange) {
      onChange(item.title);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Input principal editable con botón desplegable */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            setSearchTerm(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-white border-2 border-slate-300 focus:border-blue-600 rounded-xl pl-3 pr-10 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setSearchTerm('');
          }}
          className="absolute right-1.5 top-1.5 p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Ver opciones habituales y materias primas"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Menú Desplegable con Categorías y Buscador */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border-2 border-slate-300 rounded-2xl shadow-xl overflow-hidden animate-in fade-in duration-100">
          
          {/* Cabecera con Buscador interno y Filtros */}
          <div className="p-2.5 border-b-2 border-slate-100 bg-slate-50 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar o escribir concepto..."
                className="w-full bg-white border-2 border-slate-300 rounded-xl pl-8 pr-7 py-1.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de filtro rápido */}
            <div className="flex gap-1 text-[11px] font-bold overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveFilter('todos')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === 'todos' 
                    ? 'bg-slate-900 text-white font-black' 
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                Todos ({filteredStock.length + filteredOperat.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('stock')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'stock' 
                    ? 'bg-amber-600 text-white font-black' 
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Stock / Insumos ({filteredStock.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('operativos')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'operativos' 
                    ? 'bg-blue-600 text-white font-black' 
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>Habituales ({filteredOperat.length})</span>
              </button>
            </div>
          </div>

          {/* Lista scrolleable con altura máxima */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1 text-xs">
            
            {/* Opción rápida para guardar nuevo concepto si escribió algo que no existe */}
            {searchTerm.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => addHabitual(searchTerm)}
                className="w-full p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-left flex items-center justify-between transition-colors border-2 border-blue-200 mb-1"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Plus className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="truncate">
                    Guardar <strong>"{searchTerm.trim()}"</strong> como habitual
                  </span>
                </div>
                <span className="text-[10px] bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md font-black shrink-0">
                  Guardar
                </span>
              </button>
            )}

            {/* SECCIÓN 1: Materias Primas / Insumos del Catálogo */}
            {(activeFilter === 'todos' || activeFilter === 'stock') && filteredStock.length > 0 && (
              <div className="py-1">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1 bg-amber-50/70 rounded-lg mb-1">
                  <Boxes className="w-3 h-3 text-amber-700" />
                  <span>Materias Primas y Productos en Stock ({filteredStock.length})</span>
                </div>
                {filteredStock.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePickItem(item)}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-100 text-left flex items-center justify-between transition-colors group"
                  >
                    <div className="truncate flex-1 pr-2">
                      <span className="font-bold text-slate-900 block truncate group-hover:text-blue-700">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Stock actual: {item.stock} {item.unit}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md border border-amber-300 shrink-0">
                      Sumar Stock
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* SECCIÓN 2: Gastos Habituales del Negocio */}
            {(activeFilter === 'todos' || activeFilter === 'operativos') && filteredOperat.length > 0 && (
              <div className="py-1">
                <div className="px-2 py-1 text-[10px] font-black uppercase text-blue-900 tracking-wider flex items-center gap-1 bg-blue-50/70 rounded-lg mb-1">
                  <Receipt className="w-3 h-3 text-blue-700" />
                  <span>Gastos Habituales Guardados ({filteredOperat.length})</span>
                </div>
                {filteredOperat.map(item => (
                  <div
                    key={item.id}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-100 flex items-center justify-between transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => handlePickItem(item)}
                      className="text-left flex-1 truncate pr-2"
                    >
                      <span className="font-bold text-slate-900 block truncate group-hover:text-blue-700">
                        {item.title}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => removeHabitual(item.id, e)}
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shrink-0"
                      title="Quitar de habituales"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {filteredStock.length === 0 && filteredOperat.length === 0 && !searchTerm.trim() && (
              <div className="p-4 text-center text-slate-500 text-xs font-semibold">
                No hay elementos en esta lista.
              </div>
            )}
          </div>

          {/* Pie del desplegable */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Tocá cualquier elemento para seleccionarlo</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="font-bold text-blue-600 hover:underline"
            >
              Cerrar
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
