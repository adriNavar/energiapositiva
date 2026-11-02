import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_PRODUCT_CATEGORIES, DEMO_PRODUCTS, DEMO_RECIPES, DEMO_TRANSACTIONS, DEMO_DEBTS } from '../data/initialData';

const COLLECTION_NAME = 'empresa';
const DOCUMENT_ID = 'energia_plus';

const docRef = doc(db, COLLECTION_NAME, DOCUMENT_ID);

// Limpiar valores undefined para evitar errores de Firestore
function sanitize(obj) {
  if (obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj));
}

let syncListeners = new Set();
let currentStatus = navigator.onLine ? 'synced' : 'offline';

function setStatus(status) {
  currentStatus = status;
  syncListeners.forEach(listener => {
    try {
      listener(status);
    } catch (e) {
      console.error(e);
    }
  });
}

// Guardar un campo específico en Firestore
export async function saveFieldToCloud(field, value) {
  if (!navigator.onLine) {
    setStatus('offline');
  } else {
    setStatus('syncing');
  }

  try {
    const cleanValue = sanitize(value);
    await setDoc(docRef, {
      [field]: cleanValue,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    setStatus('synced');
  } catch (error) {
    console.error(`Error guardando ${field} en Firebase:`, error);
    setStatus('offline');
  }
}

// Guardar todo el estado en Firestore
export async function saveAllToCloud(allData) {
  setStatus('syncing');
  try {
    const cleanData = sanitize({
      products: allData.products || [],
      transactions: allData.transactions || [],
      debts: allData.debts || [],
      recipes: allData.recipes || [],
      categories: allData.categories || DEFAULT_PRODUCT_CATEGORIES,
      preparations: allData.preparations || [],
      lastUpdated: new Date().toISOString()
    });

    await setDoc(docRef, cleanData, { merge: true });
    setStatus('synced');
  } catch (error) {
    console.error('Error guardando todo en Firebase:', error);
    setStatus('offline');
  }
}

// Vaciar datos en la nube (dejar en cero)
export async function clearCloudData() {
  setStatus('syncing');
  try {
    await setDoc(docRef, {
      products: [],
      transactions: [],
      debts: [],
      recipes: [],
      categories: DEFAULT_PRODUCT_CATEGORIES,
      preparations: [],
      lastUpdated: new Date().toISOString()
    });
    setStatus('synced');
  } catch (error) {
    console.error('Error vaciando Firebase:', error);
    setStatus('offline');
  }
}

// Cargar catálogo de ejemplo en la nube
export async function loadDemoCloudData() {
  setStatus('syncing');
  try {
    await setDoc(docRef, {
      products: DEMO_PRODUCTS,
      transactions: DEMO_TRANSACTIONS,
      recipes: DEMO_RECIPES,
      debts: DEMO_DEBTS,
      categories: DEFAULT_PRODUCT_CATEGORIES,
      preparations: [],
      lastUpdated: new Date().toISOString()
    });
    setStatus('synced');
  } catch (error) {
    console.error('Error cargando demo en Firebase:', error);
    setStatus('offline');
  }
}

// Escuchar cambios en tiempo real desde Firestore
export function subscribeToCloudData(onDataReceived, onStatusChange) {
  if (onStatusChange) {
    syncListeners.add(onStatusChange);
    onStatusChange(currentStatus);
  }

  const unsubscribe = onSnapshot(docRef, async (snapshot) => {
    if (!snapshot.exists()) {
      // Si el documento en la nube aún no existe, lo inicializamos con datos limpios
      console.log('Documento en Firestore no existe todavía. Inicializando...');
      try {
        const initial = {
          products: [],
          transactions: [],
          debts: [],
          recipes: [],
          categories: DEFAULT_PRODUCT_CATEGORIES,
          preparations: [],
          lastUpdated: new Date().toISOString()
        };
        await setDoc(docRef, initial);
        setStatus('synced');
        onDataReceived(initial);
      } catch (err) {
        console.error('Error al inicializar Firestore:', err);
        setStatus('offline');
      }
      return;
    }

    const data = snapshot.data();
    setStatus('synced');

    onDataReceived({
      products: Array.isArray(data.products) ? data.products : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      debts: Array.isArray(data.debts) ? data.debts : [],
      recipes: Array.isArray(data.recipes) ? data.recipes : [],
      categories: Array.isArray(data.categories) && data.categories.length > 0 ? data.categories : DEFAULT_PRODUCT_CATEGORIES,
      preparations: Array.isArray(data.preparations) ? data.preparations : []
    });
  }, (error) => {
    console.error('Error en suscripción de Firestore:', error);
    setStatus('offline');
  });

  return () => {
    if (onStatusChange) {
      syncListeners.delete(onStatusChange);
    }
    unsubscribe();
  };
}
