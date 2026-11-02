import React, { useState, useRef, useEffect } from 'react';
import { 
  loadStoredData, 
  saveTransactions, 
  saveProducts, 
  saveRecipes, 
  saveDebts,
  saveCategories,
  savePreparations,
  saveProductsLocal,
  saveTransactionsLocal,
  saveDebtsLocal,
  saveCategoriesLocal,
  savePreparationsLocal,
  exportBackup,
  importBackup,
  clearAllData,
  loadDemoData
} from './utils/storage';
import { subscribeToCloudData } from './services/firebaseSync';
import { getCurrentUser, logoutUser } from './services/authService';
import { logAuditEvent } from './services/auditService';
import { formatCurrency } from './utils/formatters';

import InventoryTab from './components/InventoryTab';
import PreparationTab from './components/PreparationTab';
import SalesTab from './components/SalesTab';
import ExpensesTab from './components/ExpensesTab';
import MonthlyReportTab from './components/MonthlyReportTab';
import AuditTab from './components/AuditTab';
import LoginScreen from './components/LoginScreen';

import { 
  Boxes, 
  FlaskConical, 
  ShoppingBag, 
  Receipt, 
  BarChart3, 
  Zap, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  Database,
  X,
  Sparkles,
  CheckCircle2,
  Cloud,
  ShieldCheck,
  LogOut,
  User
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [data, setData] = useState(() => loadStoredData());
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'
  const [activeTab, setActiveTab] = useState(() => {
    const user = getCurrentUser();
    return user?.role === 'seller' ? 'sales' : 'stock';
  });
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [headerNotification, setHeaderNotification] = useState('');
  const fileInputRef = useRef(null);

  const { transactions = [], products = [], recipes = [], debts = [], categories = [], preparations = [] } = data;

  // Suscripción en tiempo real a Firebase Firestore
  useEffect(() => {
    const unsubscribe = subscribeToCloudData(
      (remoteData) => {
        saveProductsLocal(remoteData.products || []);
        saveTransactionsLocal(remoteData.transactions || []);
        saveDebtsLocal(remoteData.debts || []);
        saveCategoriesLocal(remoteData.categories || []);
        savePreparationsLocal(remoteData.preparations || []);
        setData(remoteData);
      },
      (status) => {
        setSyncStatus(status);
      }
    );

    return () => unsubscribe();
  }, []);

  // Guardar control de pestañas según rol de usuario
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'seller' && activeTab !== 'stock' && activeTab !== 'sales') {
      setActiveTab('sales');
    } else if (currentUser.role === 'admin' && activeTab === 'audit') {
      setActiveTab('reports');
    }
  }, [currentUser, activeTab]);

  const showToast = (msg) => {
    setHeaderNotification(msg);
    setTimeout(() => setHeaderNotification(''), 3500);
  };

  const refreshData = () => {
    setData(loadStoredData());
  };

  const navigateTo = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    logAuditEvent({
      action: 'LOGIN',
      category: 'seguridad',
      description: `${user.name} (${user.roleLabel}) inició sesión en el sistema.`,
      user
    });
    if (user.role === 'seller') {
      setActiveTab('sales');
    } else {
      setActiveTab('stock');
    }
    showToast(`¡Bienvenido, ${user.name}!`);
  };

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión en este dispositivo?')) {
      if (currentUser) {
        logAuditEvent({
          action: 'LOGOUT',
          category: 'seguridad',
          description: `${currentUser.name} (${currentUser.roleLabel}) cerró sesión.`,
          user: currentUser
        });
      }
      logoutUser();
      setCurrentUser(null);
    }
  };

  // Agregar nueva categoría
  const handleAddCategory = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = categories.find(c => c.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCat = {
      id: 'cat_' + Date.now(),
      label: trimmed
    };
    const updated = [...categories, newCat];
    saveCategories(updated);
    setData(prev => ({ ...prev, categories: updated }));

    logAuditEvent({
      action: 'CATEGORIA_CREADA',
      category: 'stock',
      description: `Creó categoría "${trimmed}"`,
      user: currentUser
    });

    return newCat;
  };

  // Descontar stock múltiple (usado en ventas)
  const deductStockMultiple = (itemsList) => {
    if (!itemsList || !Array.isArray(itemsList)) return;
    const updatedProducts = products.map(p => {
      const match = itemsList.find(item => item.id === p.id || item.name === p.name);
      if (match) {
        const current = Number(p.stock) || 0;
        return { ...p, stock: Math.max(0, current - Number(match.qty || 1)) };
      }
      return p;
    });
    saveProducts(updatedProducts);
    setData(prev => ({ ...prev, products: updatedProducts }));
  };

  // 1. PRODUCTOS Y STOCK
  const handleAddProduct = (newProd) => {
    const updated = [newProd, ...products];
    saveProducts(updated);
    setData(prev => ({ ...prev, products: updated }));

    logAuditEvent({
      action: 'PRODUCTO_CREADO',
      category: 'stock',
      description: `Dio de alta el producto "${newProd.name}" (${newProd.stock} ${newProd.unit || 'u.'} a ${formatCurrency(newProd.price)})`,
      details: newProd,
      user: currentUser
    });
  };

  const handleUpdateProduct = (id, updates) => {
    const old = products.find(p => p.id === id);
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    saveProducts(updated);
    setData(prev => ({ ...prev, products: updated }));

    logAuditEvent({
      action: 'PRODUCTO_MODIFICADO',
      category: 'stock',
      description: `Modificó producto "${old?.name || id}"`,
      details: { id, updates, previous: old },
      user: currentUser
    });
  };

  const handleDeleteProduct = (id) => {
    const old = products.find(p => p.id === id);
    if (!confirm(`¿Eliminar "${old?.name || 'este producto'}" del catálogo y stock?`)) return;
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
    setData(prev => ({ ...prev, products: updated }));

    logAuditEvent({
      action: 'PRODUCTO_ELIMINADO',
      category: 'stock',
      description: `Eliminó producto "${old?.name || id}" del catálogo`,
      details: old,
      user: currentUser
    });
  };

  // Cargar Compra de Mercadería (Suma stock y registra el gasto operativo)
  const handlePurchaseStock = ({ productId, productName, qtyBought, totalCost, paymentMethod }) => {
    const numQty = parseFloat(qtyBought) || 0;
    const numCost = parseFloat(totalCost) || 0;
    if (numQty <= 0) return;

    // 1. Actualizar stock y costo unitario
    const updatedProducts = products.map(p => {
      if (p.id === productId || p.name.toLowerCase() === productName.toLowerCase()) {
        const currentStock = Number(p.stock) || 0;
        const unitCost = numCost > 0 ? Math.round(numCost / numQty) : (p.cost || 0);
        return {
          ...p,
          stock: currentStock + numQty,
          cost: unitCost > 0 ? unitCost : p.cost
        };
      }
      return p;
    });
    saveProducts(updatedProducts);

    // 2. Si se pagó un costo, registrar el gasto
    let updatedTxs = transactions;
    if (numCost > 0) {
      const newExpense = {
        id: 'exp_' + Date.now(),
        type: 'expense',
        title: `Compra stock: ${productName} (+${numQty} u.)`,
        category: 'quimicos',
        amount: numCost,
        paymentMethod: paymentMethod || 'Efectivo',
        date: new Date().toISOString(),
        notes: `Reposición de mercadería para ${productName}`
      };
      updatedTxs = [newExpense, ...transactions];
      saveTransactions(updatedTxs);
    }

    setData(prev => ({
      ...prev,
      products: updatedProducts,
      transactions: updatedTxs
    }));

    logAuditEvent({
      action: 'COMPRA_STOCK',
      category: 'stock',
      description: `Compra de stock: +${numQty} u. de "${productName}" por ${formatCurrency(numCost)}`,
      details: { productId, productName, qtyBought: numQty, totalCost: numCost, paymentMethod },
      user: currentUser
    });
  };

  // 2. PREPARADOS (Fabricación con descuento de stock)
  const handleProducePreparation = ({ 
    finishedName, 
    finishedCategory, 
    yieldQty, 
    sellPrice, 
    unit, 
    unitCost, 
    totalCost, 
    ingredientsUsed, 
    isExisting, 
    existingProductId 
  }) => {
    // A. Descontar stock de insumos
    let updatedProducts = products.map(p => {
      const used = ingredientsUsed.find(i => i.productId === p.id);
      if (used) {
        const current = Number(p.stock) || 0;
        return { ...p, stock: Math.max(0, current - Number(used.qty)) };
      }
      return p;
    });

    // B. Sumar o crear el producto terminado
    if (isExisting && existingProductId) {
      updatedProducts = updatedProducts.map(p => {
        if (p.id === existingProductId) {
          return {
            ...p,
            stock: (Number(p.stock) || 0) + Number(yieldQty),
            price: sellPrice > 0 ? sellPrice : p.price,
            cost: unitCost > 0 ? Math.round(unitCost) : p.cost
          };
        }
        return p;
      });
    } else {
      const existingByName = updatedProducts.find(
        p => p.name.trim().toLowerCase() === finishedName.trim().toLowerCase()
      );

      if (existingByName) {
        updatedProducts = updatedProducts.map(p => {
          if (p.id === existingByName.id) {
            return {
              ...p,
              stock: (Number(p.stock) || 0) + Number(yieldQty),
              price: sellPrice > 0 ? sellPrice : p.price,
              cost: unitCost > 0 ? Math.round(unitCost) : p.cost
            };
          }
          return p;
        });
      } else {
        const newProd = {
          id: 'prod_' + Date.now(),
          name: finishedName.trim(),
          type: 'preparado',
          category: finishedCategory || 'preparados',
          stock: Number(yieldQty),
          cost: Number(unitCost) > 0 ? Math.round(unitCost) : 0,
          price: Number(sellPrice) || 0,
          unit: unit || 'Litros'
        };
        updatedProducts = [newProd, ...updatedProducts];
      }
    }
    saveProducts(updatedProducts);

    // C. Guardar en el historial de preparados
    const newPrep = {
      id: 'prep_' + Date.now(),
      date: new Date().toISOString(),
      finishedName,
      yieldQty,
      unit: unit || 'Litros',
      sellPrice,
      unitCost: Math.round(unitCost),
      totalCost,
      ingredients: ingredientsUsed
    };
    const updatedPreps = [newPrep, ...preparations];
    savePreparations(updatedPreps);

    setData(prev => ({
      ...prev,
      products: updatedProducts,
      preparations: updatedPreps
    }));

    logAuditEvent({
      action: 'PREPARADO_FABRICADO',
      category: 'preparados',
      description: `Fabricó ${yieldQty} ${unit || 'Litros'} de "${finishedName}" (Costo: ${formatCurrency(totalCost)})`,
      details: { finishedName, yieldQty, unit, sellPrice, unitCost, totalCost, ingredientsUsed },
      user: currentUser
    });
  };

  const handleDeletePreparation = (id) => {
    const prep = preparations.find(p => p.id === id);
    if (!prep) return;

    if (!confirm(`¿Eliminar la preparación de "${prep.finishedName}"? Se restaurará el stock de las materias primas y se restará del producto terminado.`)) return;

    let updatedProducts = [...products];

    // 1. Restaurar insumos/materias primas usadas
    if (prep.ingredients && Array.isArray(prep.ingredients)) {
      prep.ingredients.forEach(ing => {
        updatedProducts = updatedProducts.map(p => {
          if (p.id === ing.productId || p.name === ing.name) {
            return { ...p, stock: (Number(p.stock) || 0) + (Number(ing.qty) || 0) };
          }
          return p;
        });
      });
    }

    // 2. Restar lo que se había fabricado del producto terminado
    const yieldNum = parseFloat(prep.yieldQty) || 0;
    if (yieldNum > 0) {
      updatedProducts = updatedProducts.map(p => {
        if (p.name.trim().toLowerCase() === prep.finishedName.trim().toLowerCase()) {
          return { ...p, stock: Math.max(0, (Number(p.stock) || 0) - yieldNum) };
        }
        return p;
      });
    }

    const updatedPreps = preparations.filter(p => p.id !== id);
    saveProducts(updatedProducts);
    savePreparations(updatedPreps);
    setData(prev => ({
      ...prev,
      products: updatedProducts,
      preparations: updatedPreps
    }));
    showToast(`Se anuló el preparado de ${prep.finishedName} y se restauró el stock`);

    logAuditEvent({
      action: 'PREPARADO_ANULADO',
      category: 'preparados',
      description: `Anuló preparación de "${prep.finishedName}" y restauró materias primas`,
      details: prep,
      user: currentUser
    });
  };

  // 3. VENTAS Y GASTOS (Transacciones con reversión de stock)
  const handleAddTransaction = (newTx) => {
    const updatedTxs = [newTx, ...transactions];
    saveTransactions(updatedTxs);

    let updatedProducts = products;

    if (newTx.type === 'sale') {
      // Descontar stock de productos vendidos
      if (newTx.items && Array.isArray(newTx.items)) {
        updatedProducts = products.map(p => {
          const match = newTx.items.find(item => item.id === p.id || item.name === p.name);
          if (match) {
            const current = Number(p.stock) || 0;
            return { ...p, stock: Math.max(0, current - Number(match.qty || 1)) };
          }
          return p;
        });
        saveProducts(updatedProducts);
      } else if (newTx.productId) {
        updatedProducts = products.map(p => {
          if (p.id === newTx.productId) {
            const current = Number(p.stock) || 0;
            return { ...p, stock: Math.max(0, current - Number(newTx.qty || 1)) };
          }
          return p;
        });
        saveProducts(updatedProducts);
      }
    } else if (newTx.type === 'expense' && newTx.isStockPurchase && newTx.productId) {
      // Sumar al stock de la materia prima comprada
      const numQty = parseFloat(newTx.qtyBought) || 0;
      if (numQty > 0) {
        updatedProducts = products.map(p => {
          if (p.id === newTx.productId) {
            const currentStock = Number(p.stock) || 0;
            const newCost = Number(newTx.amount) > 0 ? Math.round(Number(newTx.amount) / numQty) : p.cost;
            return {
              ...p,
              stock: currentStock + numQty,
              cost: newCost > 0 ? newCost : p.cost
            };
          }
          return p;
        });
        saveProducts(updatedProducts);
      }
    }

    setData(prev => ({ 
      ...prev, 
      products: updatedProducts,
      transactions: updatedTxs 
    }));

    logAuditEvent({
      action: newTx.type === 'sale' ? 'VENTA_REGISTRADA' : 'GASTO_REGISTRADO',
      category: newTx.type === 'sale' ? 'ventas' : 'gastos',
      description: newTx.type === 'sale' 
        ? `Venta cobrada: ${newTx.title || 'Venta'} por ${formatCurrency(newTx.amount)} (${newTx.paymentMethod || 'Efectivo'})`
        : `Gasto registrado: ${newTx.title} por ${formatCurrency(newTx.amount)}`,
      details: newTx,
      user: currentUser
    });
  };

  const handleUpdateTransaction = (id, updates) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    let updatedProducts = products;

    // A. Si es venta y cambiaron los ítems/cantidades
    if (oldTx.type === 'sale' && updates.items) {
      const oldItems = oldTx.items || [];
      const newItems = updates.items || [];

      // Calcular diferencias de stock: delta = viejo - nuevo
      // si viejo vendió 5 y nuevo 3: delta = +2 (se devuelven 2 al stock)
      // si viejo vendió 2 y nuevo 5: delta = -3 (se restan 3 al stock)
      const stockDeltas = {};
      oldItems.forEach(item => {
        const pId = item.id;
        stockDeltas[pId] = (stockDeltas[pId] || 0) + (Number(item.qty) || 0);
      });
      newItems.forEach(item => {
        const pId = item.id;
        stockDeltas[pId] = (stockDeltas[pId] || 0) - (Number(item.qty) || 0);
      });

      updatedProducts = products.map(p => {
        if (stockDeltas[p.id] !== undefined) {
          const delta = stockDeltas[p.id];
          return { ...p, stock: Math.max(0, (Number(p.stock) || 0) + delta) };
        }
        return p;
      });
      saveProducts(updatedProducts);
    }

    // B. Si es gasto con compra de stock y cambió la cantidad
    if (oldTx.type === 'expense' && oldTx.isStockPurchase && updates.qtyBought !== undefined) {
      const oldQty = parseFloat(oldTx.qtyBought) || 0;
      const newQty = parseFloat(updates.qtyBought) || 0;
      const delta = newQty - oldQty;
      const targetProdId = updates.productId || oldTx.productId;

      if (delta !== 0 && targetProdId) {
        updatedProducts = products.map(p => {
          if (p.id === targetProdId) {
            return { ...p, stock: Math.max(0, (Number(p.stock) || 0) + delta) };
          }
          return p;
        });
        saveProducts(updatedProducts);
      }
    }

    const updatedTxs = transactions.map(t => t.id === id ? { ...t, ...updates } : t);
    saveTransactions(updatedTxs);
    setData(prev => ({
      ...prev,
      products: updatedProducts,
      transactions: updatedTxs
    }));
    showToast('Registro actualizado con éxito');

    logAuditEvent({
      action: oldTx.type === 'sale' ? 'VENTA_MODIFICADA' : 'GASTO_MODIFICADO',
      category: oldTx.type === 'sale' ? 'ventas' : 'gastos',
      description: `Modificó ${oldTx.type === 'sale' ? 'venta' : 'gasto'} "${oldTx.title}"`,
      details: { id, updates, previous: oldTx },
      user: currentUser
    });
  };

  const handleDeleteTransaction = (id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const isSale = tx.type === 'sale';
    const confirmMsg = isSale
      ? `¿Eliminar esta venta de "${tx.title || 'productos'}"? Se devolverá el stock vendido.`
      : `¿Eliminar este gasto de "${tx.title}"?${tx.isStockPurchase ? ' Se descontará el stock sumado.' : ''}`;

    if (!confirm(confirmMsg)) return;

    let updatedProducts = products;

    if (isSale) {
      // Restaurar stock de los productos vendidos
      const itemsToRestore = tx.items && Array.isArray(tx.items) 
        ? tx.items 
        : tx.productId ? [{ id: tx.productId, qty: tx.qty || 1 }] : [];

      if (itemsToRestore.length > 0) {
        updatedProducts = products.map(p => {
          const match = itemsToRestore.find(item => item.id === p.id || item.name === p.name);
          if (match) {
            return { ...p, stock: (Number(p.stock) || 0) + (Number(match.qty) || 1) };
          }
          return p;
        });
        saveProducts(updatedProducts);
      }
    } else if (tx.type === 'expense' && tx.isStockPurchase && tx.productId) {
      // Revertir el stock que se había sumado por compra de materia prima
      const qtyToRevert = parseFloat(tx.qtyBought) || 0;
      if (qtyToRevert > 0) {
        updatedProducts = products.map(p => {
          if (p.id === tx.productId) {
            return { ...p, stock: Math.max(0, (Number(p.stock) || 0) - qtyToRevert) };
          }
          return p;
        });
        saveProducts(updatedProducts);
      }
    }

    const updatedTxs = transactions.filter(t => t.id !== id);
    saveTransactions(updatedTxs);
    setData(prev => ({
      ...prev,
      products: updatedProducts,
      transactions: updatedTxs
    }));
    showToast(isSale ? 'Venta eliminada y stock restaurado' : 'Gasto eliminado');

    logAuditEvent({
      action: isSale ? 'VENTA_ELIMINADA' : 'GASTO_ELIMINADO',
      category: isSale ? 'ventas' : 'gastos',
      description: `Eliminó ${isSale ? 'venta' : 'gasto'} "${tx.title}" por ${formatCurrency(tx.amount)}`,
      details: tx,
      user: currentUser
    });
  };

  // 4. CUENTAS POR COBRAR (Saldos pendientes)
  const handleAddDebt = (newDebt) => {
    const updated = [newDebt, ...debts];
    saveDebts(updated);

    if (newDebt.orderItems && Array.isArray(newDebt.orderItems)) {
      deductStockMultiple(newDebt.orderItems);
    } else if (newDebt.productId) {
      deductStockMultiple([{ id: newDebt.productId, qty: newDebt.qty || 1 }]);
    }

    setData(prev => ({ ...prev, debts: updated }));

    logAuditEvent({
      action: 'FIADO_REGISTRADO',
      category: 'ventas',
      description: `Anotó saldo pendiente a ${newDebt.customerName} por ${formatCurrency(newDebt.amount)}`,
      details: newDebt,
      user: currentUser
    });
  };

  const handleCollectDebt = (debt, paymentMethod) => {
    const updatedDebts = debts.map(d => d.id === debt.id ? { ...d, status: 'paid' } : d);
    saveDebts(updatedDebts);

    const newSale = {
      id: 'tx_' + Date.now(),
      type: 'sale',
      customer: debt.customerName,
      title: `Cobro: ${debt.customerName} (${debt.productDesc})`,
      amount: Number(debt.amount),
      paymentMethod,
      date: new Date().toISOString(),
      notes: `Cobrado por ${debt.productDesc}`
    };
    const updatedTxs = [newSale, ...transactions];
    saveTransactions(updatedTxs);

    setData(prev => ({
      ...prev,
      debts: updatedDebts,
      transactions: updatedTxs
    }));

    logAuditEvent({
      action: 'FIADO_COBRADO',
      category: 'ventas',
      description: `Cobró deuda de ${debt.customerName} por ${formatCurrency(debt.amount)} (${paymentMethod})`,
      details: { debt, paymentMethod },
      user: currentUser
    });
  };

  const handleDeleteDebt = (id) => {
    const debt = debts.find(d => d.id === id);
    if (!confirm('¿Eliminar este registro pendiente?')) return;
    const updated = debts.filter(d => d.id !== id);
    saveDebts(updated);
    setData(prev => ({ ...prev, debts: updated }));

    logAuditEvent({
      action: 'FIADO_ELIMINADO',
      category: 'ventas',
      description: `Eliminó registro de fiado de ${debt?.customerName || id} por ${formatCurrency(debt?.amount || 0)}`,
      details: debt,
      user: currentUser
    });
  };

  // 5. ACCIONES DE RESPALDO Y DATOS
  const handleClearAll = () => {
    if (confirm('¿Estás seguro de dejar TODO EN CERO? Esta acción vaciará el stock, ventas y gastos para empezar de cero.')) {
      logAuditEvent({
        action: 'SISTEMA_REINICIADO',
        category: 'seguridad',
        description: `Reinició todo el sistema a CERO (0)`,
        user: currentUser
      });
      clearAllData();
      refreshData();
      setShowOptionsModal(false);
      showToast('Se reiniciaron todos los datos a 0');
    }
  };

  const handleLoadDemo = () => {
    if (confirm('¿Cargar datos de ejemplo de prueba?')) {
      logAuditEvent({
        action: 'DATOS_DEMO_CARGADOS',
        category: 'seguridad',
        description: `Cargó catálogo y datos de demostración`,
        user: currentUser
      });
      loadDemoData();
      refreshData();
      setShowOptionsModal(false);
      showToast('Datos de prueba cargados con éxito');
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importBackup(
      file,
      () => {
        logAuditEvent({
          action: 'COPIA_RESTAURADA',
          category: 'seguridad',
          description: `Restauró copia de seguridad JSON desde archivo`,
          user: currentUser
        });
        refreshData();
        setShowOptionsModal(false);
        showToast('¡Copia de seguridad restaurada correctamente!');
      },
      (err) => alert('Error al restaurar: ' + err)
    );
  };

  const getSubHeaderTitle = () => {
    switch (activeTab) {
      case 'stock': return 'Stock y Catálogo';
      case 'preparation': return 'Fabricación de Preparados';
      case 'sales': return 'Punto de Venta';
      case 'expenses': return 'Control de Gastos';
      case 'reports': return 'Ganancias y Saldos';
      case 'audit': return 'Control de Auditoría';
      default: return 'Energía +';
    }
  };

  // Pantalla de Login si no hay usuario autenticado
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex justify-center font-sans antialiased">
      
      {/* Marco de Celular Limpio */}
      <div className="w-full max-w-[430px] min-h-screen bg-slate-100 border-x-2 border-slate-300 flex flex-col justify-between relative shadow-xl">
        
        {/* Barra Superior con Logo Oficial y Banner */}
        <header className="sticky top-0 z-30 bg-white border-b-2 border-slate-300 px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo-clean.png" 
              alt="Energía +" 
              className="h-9 w-auto object-contain drop-shadow-xs shrink-0" 
            />
            <div className="border-l-2 border-slate-200 pl-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300">
                  {currentUser.role === 'superadmin' ? 'Super Admin' : currentUser.role === 'seller' ? 'Vendedor' : 'Willi'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-extrabold mt-0.5">{getSubHeaderTitle()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Opciones técnicas de desarrollador: ÚNICAMENTE visible para el Super Admin */}
            {currentUser.role === 'superadmin' && (
              <button
                type="button"
                onClick={() => setShowOptionsModal(true)}
                className="p-2 rounded-xl text-purple-700 hover:text-purple-900 hover:bg-purple-50 border-2 border-purple-200 active:scale-95 transition-all shadow-2xs"
                title="Opciones de Desarrollador y Respaldos"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border-2 border-slate-200 hover:border-rose-300 active:scale-95 transition-all shadow-2xs"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Aviso no intrusivo si se queda sin internet */}
        {syncStatus === 'offline' && (
          <div className="bg-amber-50 border-b border-amber-300 text-amber-900 px-3 py-1.5 text-center text-[11px] font-bold">
            Modo sin internet: los cambios se guardarán automáticamente al reconectar
          </div>
        )}

        {/* Notificación Flotante Superior */}
        {headerNotification && (
          <div className="fixed top-14 left-4 right-4 z-50 max-w-[390px] mx-auto bg-slate-900 text-white font-bold p-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs animate-bounce border-2 border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{headerNotification}</span>
          </div>
        )}

        {/* Contenido Principal de Cada Sección */}
        <main className="flex-1 p-3.5 pb-24 overflow-y-auto">
          {activeTab === 'stock' && (
            <InventoryTab 
              products={products} 
              categories={categories}
              onAddProduct={handleAddProduct} 
              onUpdateProduct={handleUpdateProduct} 
              onDeleteProduct={handleDeleteProduct} 
              onAddCategory={handleAddCategory}
              onNavigateToTab={navigateTo}
            />
          )}

          {activeTab === 'preparation' && currentUser.role !== 'seller' && (
            <PreparationTab 
              products={products} 
              categories={categories}
              preparations={preparations}
              onProducePreparation={handleProducePreparation}
              onDeletePreparation={handleDeletePreparation}
              onAddCategory={handleAddCategory}
            />
          )}

          {activeTab === 'sales' && (
            <SalesTab 
              products={products} 
              sales={transactions.filter(t => t.type === 'sale')} 
              categories={categories}
              onAddSale={handleAddTransaction} 
              onUpdateSale={handleUpdateTransaction}
              onDeleteSale={handleDeleteTransaction}
              onAddDebt={handleAddDebt}
              onAddCategory={handleAddCategory}
            />
          )}

          {activeTab === 'expenses' && currentUser.role !== 'seller' && (
            <ExpensesTab 
              products={products}
              expenses={transactions.filter(t => t.type === 'expense')} 
              onAddExpense={handleAddTransaction} 
              onUpdateExpense={handleUpdateTransaction}
              onDeleteExpense={handleDeleteTransaction} 
            />
          )}

          {activeTab === 'reports' && currentUser.role !== 'seller' && (
            <MonthlyReportTab 
              transactions={transactions} 
              debts={debts} 
              onCollectDebt={handleCollectDebt}
              onAddDebt={handleAddDebt}
              onDeleteDebt={handleDeleteDebt}
            />
          )}

          {activeTab === 'audit' && currentUser.role === 'superadmin' && (
            <AuditTab currentUser={currentUser} />
          )}
        </main>

        {/* Barra de Navegación Inferior */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-40 bg-white border-t-2 border-slate-300 px-1 py-1.5 flex justify-between items-center shadow-2xl select-none">
          
          {/* 1. Stock */}
          <button
            onClick={() => navigateTo('stock')}
            className={`flex-1 py-1 px-0.5 rounded-xl flex flex-col items-center gap-0.5 transition-all outline-none active:scale-95 ${
              activeTab === 'stock' 
                ? 'bg-emerald-600 text-white font-extrabold shadow-sm' 
                : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className={`w-4 h-4 ${activeTab === 'stock' ? 'text-white' : 'text-slate-700'}`} />
            <span className="text-[10px]">Stock</span>
          </button>

          {/* 2. Preparados (Solo Super Admin y Dueño) */}
          {currentUser.role !== 'seller' && (
            <button
              onClick={() => navigateTo('preparation')}
              className={`flex-1 py-1 px-0.5 rounded-xl flex flex-col items-center gap-0.5 transition-all outline-none active:scale-95 ${
                activeTab === 'preparation' 
                  ? 'bg-emerald-600 text-white font-extrabold shadow-sm' 
                  : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FlaskConical className={`w-4 h-4 ${activeTab === 'preparation' ? 'text-white' : 'text-slate-700'}`} />
              <span className="text-[10px]">Preparados</span>
            </button>
          )}

          {/* 3. Vender (Todos los roles) */}
          <button
            onClick={() => navigateTo('sales')}
            className={`flex-1 py-1 px-0.5 rounded-xl flex flex-col items-center gap-0.5 transition-all outline-none active:scale-95 ${
              activeTab === 'sales' 
                ? 'bg-emerald-600 text-white font-extrabold shadow-sm' 
                : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className={`w-4 h-4 ${activeTab === 'sales' ? 'text-white' : 'text-slate-700'}`} />
            <span className="text-[10px]">Vender</span>
          </button>

          {/* 4. Gastos (Solo Super Admin y Dueño) */}
          {currentUser.role !== 'seller' && (
            <button
              onClick={() => navigateTo('expenses')}
              className={`flex-1 py-1 px-0.5 rounded-xl flex flex-col items-center gap-0.5 transition-all outline-none active:scale-95 ${
                activeTab === 'expenses' 
                  ? 'bg-emerald-600 text-white font-extrabold shadow-sm' 
                  : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className={`w-4 h-4 ${activeTab === 'expenses' ? 'text-white' : 'text-slate-700'}`} />
              <span className="text-[10px]">Gastos</span>
            </button>
          )}

          {/* 5. Reportes (Solo Super Admin y Dueño) */}
          {currentUser.role !== 'seller' && (
            <button
              onClick={() => navigateTo('reports')}
              className={`flex-1 py-1 px-0.5 rounded-xl flex flex-col items-center gap-0.5 transition-all outline-none active:scale-95 ${
                activeTab === 'reports' 
                  ? 'bg-emerald-600 text-white font-extrabold shadow-sm' 
                  : 'text-slate-700 font-bold hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'reports' ? 'text-white' : 'text-slate-700'}`} />
              <span className="text-[10px]">Reportes</span>
            </button>
          )}

          {/* 6. Auditoría (EXCLUSIVO Super Admin) */}
          {currentUser.role === 'superadmin' && (
            <button
              onClick={() => navigateTo('audit')}
              className={`flex-1 py-1 px-0.5 rounded-xl flex flex-col items-center gap-0.5 transition-all outline-none active:scale-95 ${
                activeTab === 'audit' 
                  ? 'bg-purple-600 text-white font-extrabold shadow-sm' 
                  : 'text-purple-700 font-bold hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'audit' ? 'text-white' : 'text-purple-700'}`} />
              <span className="text-[10px]">Auditoría</span>
            </button>
          )}

        </nav>

        {/* Modal de Opciones / Respaldo de Datos (Solo accesible por Super Admin) */}
        {showOptionsModal && currentUser.role === 'superadmin' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border-2 border-slate-300">
              <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Opciones y Respaldos</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowOptionsModal(false)}
                  className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Banner de Estado Firebase */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-black text-slate-900 text-[11px]">Firebase Cloud Firestore</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Proyecto: energia-positivaa</div>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : syncStatus === 'syncing'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {syncStatus === 'synced' ? 'Conectado' : syncStatus === 'syncing' ? 'Sincronizando' : 'Offline'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  type="button"
                  onClick={exportBackup}
                  className="w-full bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-900 font-bold p-3 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-blue-700" />
                    <div className="text-left">
                      <div className="font-bold">Descargar Copia de Seguridad</div>
                      <div className="text-[10px] text-blue-700 font-medium">Guardar archivo JSON con todo el negocio</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white hover:bg-slate-50 border-2 border-slate-300 text-slate-800 font-bold p-3 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Upload className="w-4 h-4 text-slate-700" />
                    <div className="text-left">
                      <div className="font-bold">Restaurar Copia de Seguridad</div>
                      <div className="text-[10px] text-slate-500 font-medium">Cargar archivo JSON previamente guardado</div>
                    </div>
                  </div>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImportFile} 
                  accept=".json" 
                  className="hidden" 
                />

                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-900 font-bold p-3 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <div className="text-left">
                      <div className="font-bold">Cargar Datos de Ejemplo</div>
                      <div className="text-[10px] text-amber-700 font-medium">Cargar catálogo de muestra para probar</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="w-full bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-700 font-bold p-3 rounded-2xl flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <RotateCcw className="w-4 h-4 text-red-600" />
                    <div className="text-left">
                      <div className="font-bold">Dejar Todo en Cero (0)</div>
                      <div className="text-[10px] text-red-600 font-medium">Vaciar inventario y ventas para arrancar limpio</div>
                    </div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowOptionsModal(false)}
                className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all border-2 border-slate-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
