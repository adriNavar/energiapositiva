import { 
  INITIAL_PRODUCTS, 
  INITIAL_RECIPES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_DEBTS,
  DEFAULT_PRODUCT_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_RECIPES,
  DEMO_TRANSACTIONS,
  DEMO_DEBTS
} from '../data/initialData';

import { saveFieldToCloud, clearCloudData, loadDemoCloudData, saveAllToCloud } from '../services/firebaseSync';
import { getArgentinaDateString } from './formatters';

const KEYS = {
  TRANSACTIONS: 'energia_plus_transactions_v3',
  PRODUCTS: 'energia_plus_products_v3',
  RECIPES: 'energia_plus_recipes_v3',
  DEBTS: 'energia_plus_debts_v3',
  CATEGORIES: 'energia_plus_categories_v3',
  PREPARATIONS: 'energia_plus_preparations_v3',
};

const CLEAN_INIT_FLAG = 'energia_plus_clean_v3_ready';

// Vaciar y dejar todo en 0
export function clearAllData() {
  saveTransactionsLocal([]);
  saveProductsLocal([]);
  saveRecipesLocal([]);
  saveDebtsLocal([]);
  savePreparationsLocal([]);
  saveCategoriesLocal(DEFAULT_PRODUCT_CATEGORIES);

  // Sincronizar vaciado en Firebase
  clearCloudData().catch(console.error);

  // Limpiar versiones viejas si existían
  try {
    const oldKeys = [
      'energia_plus_transactions_v2', 'energia_plus_products_v2', 'energia_plus_recipes_v2',
      'energia_plus_debts_v2', 'energia_plus_categories_v2', 'energia_plus_preparations_v2',
      'energia_plus_transactions_v1', 'energia_plus_products_v1', 'energia_plus_recipes_v1',
      'energia_plus_debts_v1', 'energia_plus_categories_v1',
      'energia_plus_transactions', 'energia_plus_products', 'energia_plus_debts', 'energia_plus_recipes'
    ];
    oldKeys.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.error(e);
  }
}

export function loadStoredData() {
  try {
    if (!localStorage.getItem(CLEAN_INIT_FLAG)) {
      localStorage.setItem(CLEAN_INIT_FLAG, 'true');
    }

    const rawTx = localStorage.getItem(KEYS.TRANSACTIONS);
    const rawProd = localStorage.getItem(KEYS.PRODUCTS);
    const rawRec = localStorage.getItem(KEYS.RECIPES);
    const rawDebts = localStorage.getItem(KEYS.DEBTS);
    const rawCats = localStorage.getItem(KEYS.CATEGORIES);
    const rawPrep = localStorage.getItem(KEYS.PREPARATIONS);

    return {
      transactions: rawTx !== null ? JSON.parse(rawTx) : [],
      products: rawProd !== null ? JSON.parse(rawProd) : [],
      recipes: rawRec !== null ? JSON.parse(rawRec) : [],
      debts: rawDebts !== null ? JSON.parse(rawDebts) : [],
      categories: rawCats !== null ? JSON.parse(rawCats) : DEFAULT_PRODUCT_CATEGORIES,
      preparations: rawPrep !== null ? JSON.parse(rawPrep) : [],
    };
  } catch (error) {
    console.error('Error al cargar datos de localStorage:', error);
    return {
      transactions: [],
      products: [],
      recipes: [],
      debts: [],
      categories: DEFAULT_PRODUCT_CATEGORIES,
      preparations: [],
    };
  }
}

// Métodos locales puros (usados también al sincronizar desde Firebase sin re-emitir)
export function saveCategoriesLocal(data) {
  try {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

export function saveTransactionsLocal(data) {
  try {
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

export function saveProductsLocal(data) {
  try {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

export function saveRecipesLocal(data) {
  try {
    localStorage.setItem(KEYS.RECIPES, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

export function saveDebtsLocal(data) {
  try {
    localStorage.setItem(KEYS.DEBTS, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

export function savePreparationsLocal(data) {
  try {
    localStorage.setItem(KEYS.PREPARATIONS, JSON.stringify(data));
  } catch (e) {
    console.error(e);
  }
}

// Métodos que guardan localmente y replican a Firebase
export function saveCategories(data) {
  saveCategoriesLocal(data);
  saveFieldToCloud('categories', data).catch(console.error);
}

export function saveTransactions(data) {
  saveTransactionsLocal(data);
  saveFieldToCloud('transactions', data).catch(console.error);
}

export function saveProducts(data) {
  saveProductsLocal(data);
  saveFieldToCloud('products', data).catch(console.error);
}

export function saveRecipes(data) {
  saveRecipesLocal(data);
  saveFieldToCloud('recipes', data).catch(console.error);
}

export function saveDebts(data) {
  saveDebtsLocal(data);
  saveFieldToCloud('debts', data).catch(console.error);
}

export function savePreparations(data) {
  savePreparationsLocal(data);
  saveFieldToCloud('preparations', data).catch(console.error);
}

export function exportBackup() {
  const data = loadStoredData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const now = getArgentinaDateString();
  const a = document.createElement('a');
  a.href = url;
  a.download = `respaldo-energia-plus-${now}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        throw new Error('El archivo no tiene el formato correcto');
      }
      saveTransactionsLocal(parsed.transactions || []);
      saveProductsLocal(parsed.products || []);
      saveRecipesLocal(parsed.recipes || []);
      saveDebtsLocal(parsed.debts || []);
      if (parsed.categories) saveCategoriesLocal(parsed.categories);
      if (parsed.preparations) savePreparationsLocal(parsed.preparations);

      await saveAllToCloud(parsed);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (onError) onError(err.message);
    }
  };
  reader.readAsText(file);
}

// Cargar catálogo de ejemplo del cuaderno de Willi
export function loadDemoData() {
  saveTransactionsLocal(DEMO_TRANSACTIONS);
  saveProductsLocal(DEMO_PRODUCTS);
  saveRecipesLocal(DEMO_RECIPES);
  saveDebtsLocal(DEMO_DEBTS);
  loadDemoCloudData().catch(console.error);
}

export function resetToDemoData() {
  clearAllData();
}
