import { collection, addDoc, onSnapshot, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getCurrentUser } from './authService';

const AUDIT_COLLECTION = 'audit_logs';
const AUDIT_LOCAL_KEY = 'energia_plus_audit_logs_cache_v1';

// Obtener logs cacheados localmente
export function getLocalAuditLogs() {
  try {
    const raw = localStorage.getItem(AUDIT_LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAuditLogs(logs) {
  try {
    localStorage.setItem(AUDIT_LOCAL_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch (e) {
    console.error(e);
  }
}

// Registrar un evento de auditoría
export async function logAuditEvent({ action, category = 'sistema', description, details = null, user = null }) {
  const activeUser = user || getCurrentUser() || {
    id: 'anonimo',
    name: 'Usuario sin sesión',
    role: 'invitado',
    roleLabel: 'Invitado'
  };

  const logEntry = {
    action,
    category,
    description: description || action,
    details: details ? JSON.parse(JSON.stringify(details)) : null,
    userId: activeUser.id,
    userName: activeUser.name,
    userRole: activeUser.role,
    userRoleLabel: activeUser.roleLabel || activeUser.role,
    timestamp: new Date().toISOString()
  };

  // 1. Guardar en caché local
  const currentLocal = getLocalAuditLogs();
  saveLocalAuditLogs([logEntry, ...currentLocal]);

  // 2. Enviar a Firestore
  try {
    await addDoc(collection(db, AUDIT_COLLECTION), logEntry);
  } catch (err) {
    console.warn('No se pudo enviar log de auditoría a Firebase (guardado localmente):', err);
  }

  return logEntry;
}

// Suscribirse a logs de auditoría en tiempo real (solo Super Admin)
export function subscribeToAuditLogs(onLogsReceived) {
  // Emitir primero el caché local para carga instantánea
  onLogsReceived(getLocalAuditLogs());

  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      saveLocalAuditLogs(logs);
      onLogsReceived(logs);
    }, (err) => {
      console.warn('Error escuchando auditoría en Firebase:', err);
      onLogsReceived(getLocalAuditLogs());
    });

    return unsubscribe;
  } catch (err) {
    console.error('Error configurando query de auditoría:', err);
    return () => {};
  }
}

// Vaciar logs de auditoría (solo Super Admin)
export async function clearAllAuditLogs() {
  saveLocalAuditLogs([]);
  try {
    const snapshot = await getDocs(query(collection(db, AUDIT_COLLECTION), limit(200)));
    const batchDeletes = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(batchDeletes);
  } catch (err) {
    console.error('Error vaciando logs de auditoría:', err);
  }
}
