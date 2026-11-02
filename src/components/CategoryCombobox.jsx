import React, { useState, useRef, useEffect } from 'react';
import { Tag, ChevronDown, Check, Plus, Search, X } from 'lucide-react';

export default function CategoryCombobox({
  categories = [],
  selectedCategory = 'todos',
  onSelectCategory,
  onAddCategory,
  showAll = true,
  placeholder = "Filtrar por categoría",
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsCreating(false);
        setSearchTerm('');
      }
    }
    if (isOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen]);

  // Autofoco en el input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const selectedObj = categories.find(c => c.id === selectedCategory);
  const selectedLabel = selectedCategory === 'todos' 
    ? 'Todas las categorías' 
    : (selectedObj ? selectedObj.label : 'Categoría seleccionada');

  const filteredCategories = categories.filter(c =>
    c.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const exactMatch = categories.some(
    c => c.label.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  const handleCreateCategory = (nameToCreate) => {
    const trimmed = nameToCreate.trim();
    if (!trimmed) return;
    if (onAddCategory) {
      const created = onAddCategory(trimmed);
      if (created) {
        onSelectCategory(created.id);
      }
    }
    setSearchTerm('');
    setIsCreating(false);
    setNewCatName('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Botón Disparador del Combobox */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsCreating(false);
        }}
        className="w-full bg-white border-2 border-slate-300 hover:border-slate-400 rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-between gap-2 shadow-2xs transition-all text-slate-800"
      >
        <div className="flex items-center gap-2 truncate">
          <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">
            {selectedCategory === 'todos' ? 'Categoría: Todas' : selectedLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedCategory !== 'todos' && showAll && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCategory('todos');
              }}
              className="p-0.5 hover:text-slate-700 cursor-pointer"
              title="Quitar filtro"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
        </div>
      </button>

      {/* Menú Desplegable con Buscador */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 min-w-[220px]">
          
          {/* Barra de Búsqueda de Categorías */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar o crear categoría..."
                className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-7 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Categorías con Scroll */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 p-1 text-xs no-scrollbar">
            
            {/* Opción "Todas las categorías" si corresponde */}
            {showAll && !searchTerm && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('todos');
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left font-bold transition-colors ${
                  selectedCategory === 'todos' 
                    ? 'bg-emerald-50 text-emerald-800' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Todas las categorías</span>
                {selectedCategory === 'todos' && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
              </button>
            )}

            {/* Categorías Filtradas */}
            {filteredCategories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left font-semibold transition-colors ${
                    isSelected 
                      ? 'bg-emerald-50 text-emerald-800 font-bold' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Opción rápida para crear si escribió algo que no existe */}
            {searchTerm.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => handleCreateCategory(searchTerm)}
                className="w-full px-2.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-left flex items-center gap-1.5 transition-colors mt-0.5 border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">
                  Crear categoría <strong className="underline">"{searchTerm.trim()}"</strong>
                </span>
              </button>
            )}

            {filteredCategories.length === 0 && !searchTerm.trim() && (
              <div className="p-3 text-center text-slate-400 text-[11px]">
                No hay categorías cargadas.
              </div>
            )}
          </div>

          {/* Pie del desplegable: Botón o Formulario para Agregar Categoría */}
          <div className="p-1.5 border-t border-slate-100 bg-slate-50/50">
            {isCreating ? (
              <div className="space-y-1.5 p-1 bg-white border border-slate-200 rounded-xl p-2 shadow-2xs">
                <input
                  type="text"
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateCategory(newCatName);
                    }
                  }}
                  placeholder="Nombre de la categoría..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-semibold"
                />
                <div className="flex gap-1 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setNewCatName('');
                    }}
                    className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateCategory(newCatName)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-0.5 rounded text-[11px] font-bold shadow-2xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full py-1 px-2 rounded-lg text-emerald-700 hover:bg-emerald-50 active:scale-98 font-bold text-xs flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nueva Categoría</span>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
