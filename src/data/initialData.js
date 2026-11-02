// Categorías de gastos con íconos vectoriales limpios
export const EXPENSE_CATEGORIES = [
  { id: 'quimicos', label: 'Materia Prima y Químicos', icon: 'FlaskConical', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { id: 'envases', label: 'Bidones, Botellas y Tapas', icon: 'Package', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
  { id: 'flete', label: 'Nafta, Envíos y Fletes', icon: 'Fuel', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  { id: 'etiquetas', label: 'Etiquetas y Bolsas', icon: 'Tag', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { id: 'varios', label: 'Herramientas y Varios', icon: 'Wrench', color: 'text-slate-300', bg: 'bg-slate-700/30 border-slate-600/30' },
];

// Categorías de productos base del catálogo
export const DEFAULT_PRODUCT_CATEGORIES = [
  { id: 'jabones', label: 'Jabones y Ropa' },
  { id: 'lavandina', label: 'Lavandina y Cloro' },
  { id: 'desodorantes', label: 'Desodorantes' },
  { id: 'limpieza', label: 'Cocina y Limpieza' },
  { id: 'autos', label: 'Línea Auto/Moto' },
  { id: 'especiales', label: 'Especiales / Plagas' },
];

export const PRODUCT_CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  ...DEFAULT_PRODUCT_CATEGORIES
];

// DATOS INICIALES EN CERO (Para que Willi cargue sus propios productos, ventas y stock)
export const INITIAL_PRODUCTS = [];
export const INITIAL_TRANSACTIONS = [];
export const INITIAL_DEBTS = [];
export const INITIAL_RECIPES = [];

// DATOS DE EJEMPLO DEL CUADERNO (Por si necesitan restaurar o ver ejemplos)
export const DEMO_PRODUCTS = [
  // Jabones y Ropa
  { id: 'p1', category: 'jabones', name: 'Jabón Líquido Ariel 1L', cost: 600, price: 1700, unit: 'Litros', stock: 35 },
  { id: 'p2', category: 'jabones', name: 'Jabón Líquido Skip 1L', cost: 600, price: 1700, unit: 'Litros', stock: 30 },
  { id: 'p3', category: 'jabones', name: 'Jabón Líquido Ala 1L', cost: 600, price: 1700, unit: 'Litros', stock: 25 },
  { id: 'p4', category: 'jabones', name: 'Suavizante para Ropa 1L', cost: 500, price: 1800, unit: 'Litros', stock: 40 },
  
  // Lavandina y Cloro
  { id: 'p5', category: 'lavandina', name: 'Lavandina 1L', cost: 360, price: 1200, unit: 'Litros', stock: 60 },
  { id: 'p6', category: 'lavandina', name: 'Lavandina Bidón 5L', cost: 1800, price: 5500, unit: 'Bidones', stock: 15 },
  { id: 'p7', category: 'lavandina', name: 'Cloro Puro 1L', cost: 800, price: 2400, unit: 'Litros', stock: 20 },

  // Desodorantes de Piso
  { id: 'p8', category: 'desodorantes', name: 'Desodorante Lavanda 1L', cost: 350, price: 1400, unit: 'Litros', stock: 45 },
  { id: 'p9', category: 'desodorantes', name: 'Desodorante Frutilla 1L', cost: 350, price: 1400, unit: 'Litros', stock: 30 },
  { id: 'p10', category: 'desodorantes', name: 'Desodorante Marina 1L', cost: 350, price: 1400, unit: 'Litros', stock: 35 },
  { id: 'p11', category: 'desodorantes', name: 'Desodorante Cherry 1L', cost: 350, price: 1400, unit: 'Litros', stock: 25 },
  { id: 'p12', category: 'desodorantes', name: 'Citronella 1L', cost: 350, price: 1400, unit: 'Litros', stock: 20 },

  // Cocina y Limpieza
  { id: 'p13', category: 'limpieza', name: 'Detergente 1L', cost: 450, price: 1500, unit: 'Litros', stock: 40 },
  { id: 'p14', category: 'limpieza', name: 'Desengrasante 1L', cost: 700, price: 2300, unit: 'Litros', stock: 25 },
  { id: 'p15', category: 'limpieza', name: 'Jabón para Manos Uva 1L', cost: 500, price: 1500, unit: 'Litros', stock: 15 },

  // Línea Automotor
  { id: 'p16', category: 'autos', name: 'Shampoo Auto/Motos 1L', cost: 800, price: 2500, unit: 'Litros', stock: 15 },
  { id: 'p17', category: 'autos', name: 'Silicona Líquida 250cc', cost: 700, price: 2200, unit: 'Unidades', stock: 18 },
  { id: 'p18', category: 'autos', name: 'Revividor para Cauchos 250cc', cost: 700, price: 2200, unit: 'Unidades', stock: 12 },

  // Plagas y Especiales
  { id: 'p19', category: 'especiales', name: 'Kaotrina 1L', cost: 500, price: 1400, unit: 'Litros', stock: 10 },
  { id: 'p20', category: 'especiales', name: 'Matecucaracha', cost: 600, price: 1800, unit: 'Unidades', stock: 15 },
];

export const DEMO_RECIPES = [
  {
    id: 'r1',
    name: 'Lavandina Común (desde Cloro Puro)',
    rawMaterial: 'Cloro Concentrado',
    buyQty: 30,
    buyCost: 18000,
    yieldQty: 50,
    sellPricePerUnit: 1200,
    notes: '30L de cloro concentrado rinden 50L de lavandina'
  },
  {
    id: 'r2',
    name: 'Desodorante para Piso (Lavanda / Frutilla / Marina)',
    rawMaterial: 'Esencia pura + Emulsionante',
    buyQty: 5,
    buyCost: 12000,
    yieldQty: 60,
    sellPricePerUnit: 1400,
    notes: 'Rinde 60 litros listos para envasar'
  }
];

export const DEMO_TRANSACTIONS = [
  {
    id: 't1',
    type: 'sale',
    customer: 'Darío',
    title: 'Pedido: Darío (4L Ariel, 2L Lavandina, 2L Des. Marina)',
    items: [
      { name: 'Jabón Líquido Ariel 1L', qty: 4, unitPrice: 1700 },
      { name: 'Lavandina 1L', qty: 2, unitPrice: 1200 },
      { name: 'Desodorante Marina 1L', qty: 2, unitPrice: 1400 }
    ],
    amount: 12000,
    paymentMethod: 'Efectivo',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'paid'
  },
  {
    id: 't2',
    type: 'sale',
    customer: 'Susi',
    title: 'Pedido: Susi (5L Ariel, 5L Lavandina, Silicona 250cc)',
    items: [
      { name: 'Jabón Líquido Ariel 1L', qty: 5, unitPrice: 1700 },
      { name: 'Lavandina 1L', qty: 5, unitPrice: 1200 },
      { name: 'Silicona Líquida 250cc', qty: 1, unitPrice: 2200 }
    ],
    amount: 16700,
    paymentMethod: 'Transferencia',
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: 'paid'
  },
  {
    id: 't3',
    type: 'expense',
    title: 'Compra de Cloro puro concentrado (30L)',
    category: 'quimicos',
    amount: 18000,
    paymentMethod: 'Efectivo',
    date: new Date(Date.now() - 3600000 * 6).toISOString(),
    notes: 'Para preparar 50 litros de lavandina'
  }
];

export const DEMO_DEBTS = [
  {
    id: 'd1',
    customerName: 'Daniela',
    phone: '',
    productDesc: 'Skip 3L, Ariel 3L, Shampoo Autos, Revividor Cauchos',
    amount: 14800,
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'pending',
    notes: 'Anotado del cuaderno'
  },
  {
    id: 'd2',
    customerName: 'Sonia',
    phone: '',
    productDesc: 'Desengrasante 2L, Detergente 2L',
    amount: 7600,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'pending',
    notes: 'Anotado del cuaderno'
  }
];
