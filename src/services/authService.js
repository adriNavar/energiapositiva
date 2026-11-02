import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const USERS_DOC_REF = doc(db, 'empresa', 'usuarios');
const SESSION_STORAGE_KEY = 'energia_plus_auth_user_v1';
const USERS_LOCAL_STORAGE_KEY = 'energia_plus_users_list_v1';

export const DEFAULT_USERS = [
  {
    id: 'u_superadmin',
    name: 'Super Admin',
    username: 'superadmin',
    email: 'superadmin@energiaplus.com',
    password: 'superadmin2026',
    role: 'superadmin', // Acceso total + Auditoría exclusiva
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
    roleLabel: 'Super Admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u_willi',
    name: 'Willi',
    username: 'willi',
    email: 'willi@energiaplus.com',
    password: 'willi2026',
    role: 'admin', // Stock, Preparados, Ventas, Gastos, Reportes (SIN Auditoría)
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    roleLabel: 'Dueño',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u_vendedor',
    name: 'Vendedor',
    username: 'vendedor',
    email: 'vendedor@energiaplus.com',
    password: 'vendedor2026',
    role: 'seller', // Solo Stock (cargar productos) y Ventas
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    roleLabel: 'Vendedor',
    createdAt: new Date().toISOString()
  }
];

// Obtener usuario actualmente logueado
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// Guardar sesión activa
export function setCurrentUser(user) {
  try {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (e) {
    console.error(e);
  }
}

// Obtener lista local de usuarios
export function getLocalUsers() {
  try {
    const raw = localStorage.getItem(USERS_LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveLocalUsers(users) {
  try {
    localStorage.setItem(USERS_LOCAL_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error(e);
  }
}

// Iniciar sesión con usuario o correo y contraseña
export async function authenticateUser(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // 1. Intentar buscar en Firestore o local
  let users = getLocalUsers();

  try {
    const snap = await getDoc(USERS_DOC_REF);
    if (snap.exists() && Array.isArray(snap.data().list)) {
      users = snap.data().list;
      saveLocalUsers(users);
    } else {
      // Si no existe en la nube, inicializar con los usuarios por defecto
      await setDoc(USERS_DOC_REF, { list: DEFAULT_USERS, updatedAt: new Date().toISOString() });
      users = DEFAULT_USERS;
      saveLocalUsers(users);
    }
  } catch (err) {
    console.warn('Usando usuarios en caché local:', err);
  }

  const found = users.find(u => 
    (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
    u.password === cleanPass
  );

  if (!found) {
    throw new Error('Usuario o contraseña incorrectos');
  }

  // Quitar la contraseña de la sesión activa
  const sessionUser = {
    id: found.id,
    name: found.name,
    username: found.username,
    email: found.email,
    role: found.role,
    roleLabel: found.role === 'superadmin' ? 'Super Admin' : found.role === 'admin' ? 'Dueño (Admin)' : 'Vendedor',
    loginTime: new Date().toISOString()
  };

  setCurrentUser(sessionUser);
  return sessionUser;
}

// Cerrar sesión
export function logoutUser() {
  setCurrentUser(null);
}

// Escuchar usuarios en tiempo real desde Firestore
export function subscribeToUsers(onUsersUpdate) {
  const unsubscribe = onSnapshot(USERS_DOC_REF, async (snapshot) => {
    if (!snapshot.exists()) {
      try {
        await setDoc(USERS_DOC_REF, { list: DEFAULT_USERS, updatedAt: new Date().toISOString() });
        saveLocalUsers(DEFAULT_USERS);
        onUsersUpdate(DEFAULT_USERS);
      } catch (e) {
        console.error(e);
      }
      return;
    }

    const data = snapshot.data();
    const list = Array.isArray(data.list) && data.list.length > 0 ? data.list : DEFAULT_USERS;
    saveLocalUsers(list);
    onUsersUpdate(list);
  }, (err) => {
    console.warn('Error escuchando usuarios de Firestore:', err);
    onUsersUpdate(getLocalUsers());
  });

  return unsubscribe;
}

// Crear o actualizar usuario (solo Super Admin)
export async function saveUserToCloud(user) {
  const currentList = getLocalUsers();
  let updatedList;
  const existingIdx = currentList.findIndex(u => u.id === user.id);

  if (existingIdx >= 0) {
    updatedList = currentList.map(u => u.id === user.id ? { ...u, ...user } : u);
  } else {
    updatedList = [...currentList, { ...user, id: user.id || 'u_' + Date.now(), createdAt: new Date().toISOString() }];
  }

  saveLocalUsers(updatedList);
  try {
    await setDoc(USERS_DOC_REF, { list: updatedList, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error guardando usuario en Firestore:', err);
  }
  return updatedList;
}

// Eliminar usuario
export async function deleteUserFromCloud(userId) {
  const currentList = getLocalUsers();
  const updatedList = currentList.filter(u => u.id !== userId);
  saveLocalUsers(updatedList);
  try {
    await setDoc(USERS_DOC_REF, { list: updatedList, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error eliminando usuario en Firestore:', err);
  }
  return updatedList;
}
