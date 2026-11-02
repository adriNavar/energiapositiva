import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ShoppingBag, 
  Receipt, 
  Boxes, 
  FlaskConical, 
  Clock, 
  Users, 
  Key, 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';
import { subscribeToAuditLogs, clearAllAuditLogs } from '../services/auditService';
import { getLocalUsers, saveUserToCloud, deleteUserFromCloud } from '../services/authService';

export default function AuditTab({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [usersList, setUsersList] = useState(() => getLocalUsers());
  const [selectedUserFilter, setSelectedUserFilter] = useState('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('todas');
  const [selectedDateFilter, setSelectedDateFilter] = useState('todos'); // 'hoy' | 'semana' | 'mes' | 'todos'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [notification, setNotification] = useState('');

  // Modal para gestionar usuarios
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('seller'); // 'seller' | 'admin'

  useEffect(() => {
    const unsubscribe = subscribeToAuditLogs((receivedLogs) => {
      setLogs(receivedLogs);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // Filtrado de logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return logs.filter(log => {
      // 1. Filtro por usuario
      if (selectedUserFilter !== 'todos') {
        if (log.userId !== selectedUserFilter && log.userName !== selectedUserFilter) {
          return false;
        }
      }

      // 2. Filtro por categoría
      if (selectedCategoryFilter !== 'todas') {
        if (log.category !== selectedCategoryFilter) return false;
      }

      // 3. Filtro por fecha
      if (selectedDateFilter === 'hoy') {
        if (!log.timestamp?.startsWith(todayStr)) return false;
      } else if (selectedDateFilter === 'semana') {
        const logDate = new Date(log.timestamp);
        const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) return false;
      } else if (selectedDateFilter === 'mes') {
        const logDate = new Date(log.timestamp);
        if (logDate.getMonth() !== now.getMonth() || logDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      }

      // 4. Búsqueda por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = (log.description || '').toLowerCase().includes(term);
        const matchesUser = (log.userName || '').toLowerCase().includes(term);
        const matchesAction = (log.action || '').toLowerCase().includes(term);
        if (!matchesDesc && !matchesUser && !matchesAction) return false;
      }

      return true;
    });
  }, [logs, selectedUserFilter, selectedCategoryFilter, selectedDateFilter, searchTerm]);

  // Métricas rápidas
  const todayCount = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return logs.filter(l => l.timestamp?.startsWith(todayStr)).length;
  }, [logs]);

  const salesAuditCount = useMemo(() => {
    return logs.filter(l => l.category === 'ventas').length;
  }, [logs]);

  const expensesAuditCount = useMemo(() => {
    return logs.filter(l => l.category === 'gastos').length;
  }, [logs]);

  // Formato de hora legible
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  // Crear nuevo usuario
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserUsername.trim() || !newUserPassword.trim()) return;

    const newUser = {
      id: 'u_' + Date.now(),
      name: newUserName.trim(),
      username: newUserUsername.trim().toLowerCase(),
      email: `${newUserUsername.trim().toLowerCase()}@energiaplus.com`,
      password: newUserPassword.trim(),
      role: newUserRole,
      badgeColor: newUserRole === 'admin' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-blue-100 text-blue-900 border-blue-300',
      roleLabel: newUserRole === 'admin' ? 'Dueño (Admin)' : 'Vendedor',
      createdAt: new Date().toISOString()
    };

    const updated = await saveUserToCloud(newUser);
    setUsersList(updated);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    showToast(`Usuario "${newUser.name}" creado con éxito`);
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId, userName) => {
    if (userId === 'u_superadmin') {
      alert('No se puede eliminar el usuario Super Admin.');
      return;
    }
    if (!confirm(`¿Eliminar al usuario "${userName}"?`)) return;

    const updated = await deleteUserFromCloud(userId);
    setUsersList(updated);
    showToast(`Usuario "${userName}" eliminado`);
  };

  // Vaciar registros
  const handleClearLogs = async () => {
    if (!confirm('¿Estás seguro de vaciar el historial de auditoría? Esta acción no se puede deshacer.')) return;
    await clearAllAuditLogs();
    setLogs([]);
    showToast('Historial de auditoría vaciado');
  };

  return (
    <div className="space-y-3">
      
      {/* Notificación flotante */}
      {notification && (
        <div className="bg-emerald-600 text-white font-bold p-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs animate-bounce border-2 border-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tarjeta de Encabezado de Auditoría */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl p-4 shadow-lg border-2 border-purple-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base tracking-tight leading-none">Auditoría del Sistema</h2>
                <span className="text-[10px] font-black bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-md">
                  Exclusivo Super Admin
                </span>
              </div>
              <p className="text-[11px] text-purple-200 mt-1 font-medium">
                Monitoreo en tiempo real de cada acción realizada por Willi y vendedores.
              </p>
            </div>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="bg-white/10 rounded-2xl p-2 border border-white/10">
            <span className="text-[10px] text-purple-200 block font-bold">Total Registros</span>
            <span className="text-lg font-black text-white">{logs.length}</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-2 border border-white/10">
            <span className="text-[10px] text-purple-200 block font-bold">Movimientos Hoy</span>
            <span className="text-lg font-black text-emerald-300">+{todayCount}</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-2 border border-white/10">
            <span className="text-[10px] text-purple-200 block font-bold">Ventas Auditadas</span>
            <span className="text-lg font-black text-amber-300">{salesAuditCount}</span>
          </div>
        </div>

        {/* Botón Gestión de Usuarios */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowUsersModal(true)}
            className="flex-1 bg-white text-purple-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:bg-purple-50 active:scale-98 transition-all"
          >
            <Users className="w-3.5 h-3.5 text-purple-700" />
            <span>Gestionar Cuentas y Vendedores</span>
          </button>

          <button
            type="button"
            onClick={handleClearLogs}
            className="px-3 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs flex items-center gap-1 border border-white/20 transition-all active:scale-98"
            title="Limpiar historial"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
            <span>Vaciar</span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-3 space-y-2.5 shadow-xs">
        {/* Buscador */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por usuario, acción o descripción..."
            className="w-full bg-white border-2 border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
          />
        </div>

        {/* Filtros Rápidos de Fecha */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {[
            { id: 'todos', label: 'Todo el historial' },
            { id: 'hoy', label: 'Solo Hoy' },
            { id: 'semana', label: 'Últimos 7 días' },
            { id: 'mes', label: 'Este Mes' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedDateFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap text-xs transition-all active:scale-95 border-2 ${
                selectedDateFilter === f.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtro por Categoría y Usuario */}
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <div>
            <label className="block text-[10px] text-slate-600 mb-0.5">Filtrar por Tipo</label>
            <select
              value={selectedCategoryFilter}
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="todas">Todas las categorías</option>
              <option value="ventas">Ventas</option>
              <option value="gastos">Gastos y Compras</option>
              <option value="stock">Stock y Catálogo</option>
              <option value="preparados">Preparados</option>
              <option value="deudas">Cuentas por Cobrar</option>
              <option value="seguridad">Seguridad / Logins</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-600 mb-0.5">Filtrar por Usuario</label>
            <select
              value={selectedUserFilter}
              onChange={e => setSelectedUserFilter(e.target.value)}
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
            >
              <option value="todos">Todos los usuarios</option>
              {usersList.map(u => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.roleLabel})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Registros Auditados */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-slate-700 px-1">
          <span>Registros encontrados ({filteredLogs.length})</span>
          {filteredLogs.length > 0 && (
            <span className="text-[10px] text-slate-500 font-bold">Orden cronológico</span>
          )}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 text-center text-xs text-slate-500 font-bold space-y-1 shadow-xs">
            <p>No hay eventos registrados para los filtros seleccionados.</p>
            <p className="text-[10px] text-slate-400">Cada venta, modificación de precio, gasto o login quedará registrado acá.</p>
          </div>
        ) : (
          filteredLogs.map((item, idx) => {
            const isExpanded = expandedLogId === (item.id || idx);

            // Icono y color por categoría
            let icon = <Clock className="w-4 h-4 text-slate-600" />;
            let borderStyle = 'border-slate-300';
            let categoryBadge = 'bg-slate-100 text-slate-800 border-slate-300';

            if (item.category === 'ventas') {
              icon = <ShoppingBag className="w-4 h-4 text-emerald-600" />;
              borderStyle = 'border-emerald-300';
              categoryBadge = 'bg-emerald-100 text-emerald-900 border-emerald-300';
            } else if (item.category === 'gastos') {
              icon = <Receipt className="w-4 h-4 text-rose-600" />;
              borderStyle = 'border-rose-300';
              categoryBadge = 'bg-rose-100 text-rose-900 border-rose-300';
            } else if (item.category === 'stock') {
              icon = <Boxes className="w-4 h-4 text-blue-600" />;
              borderStyle = 'border-blue-300';
              categoryBadge = 'bg-blue-100 text-blue-900 border-blue-300';
            } else if (item.category === 'preparados') {
              icon = <FlaskConical className="w-4 h-4 text-amber-600" />;
              borderStyle = 'border-amber-300';
              categoryBadge = 'bg-amber-100 text-amber-900 border-amber-300';
            } else if (item.category === 'seguridad') {
              icon = <ShieldCheck className="w-4 h-4 text-purple-600" />;
              borderStyle = 'border-purple-300';
              categoryBadge = 'bg-purple-100 text-purple-900 border-purple-300';
            }

            return (
              <div
                key={item.id || idx}
                className={`bg-white border-2 ${borderStyle} rounded-2xl p-3 shadow-xs space-y-2 transition-all`}
              >
                {/* Cabecera del Log */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div>
                      {/* Usuario y Rol */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-slate-900">{item.userName}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${
                          item.userRole === 'superadmin'
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : item.userRole === 'admin'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                        }`}>
                          {item.userRoleLabel || item.userRole}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {item.timestamp ? formatDate(item.timestamp) : ''} • {formatTime(item.timestamp)}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider shrink-0 ${categoryBadge}`}>
                    {item.category}
                  </span>
                </div>

                {/* Descripción de la Acción */}
                <div className="text-xs font-bold text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {item.description}
                </div>

                {/* Detalles desplegables */}
                {item.details && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(isExpanded ? null : (item.id || idx))}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      <span>{isExpanded ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos'}</span>
                    </button>

                    {isExpanded && (
                      <pre className="mt-1 p-2 bg-slate-900 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto border-2 border-slate-800">
                        {JSON.stringify(item.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Gestión de Usuarios y Vendedores */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border-2 border-slate-300 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Cuentas y Permisos</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUsersModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {/* Lista de Usuarios Actuales */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Usuarios Registrados ({usersList.length})
              </span>

              {usersList.map(u => (
                <div
                  key={u.id}
                  className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900">{u.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        u.role === 'superadmin'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : u.role === 'admin'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}>
                        {u.roleLabel}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Usuario: <strong>{u.username}</strong> • Clave: <strong>{u.password}</strong>
                    </div>
                  </div>

                  {u.role !== 'superadmin' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Formulario Crear Nuevo Vendedor */}
            <form onSubmit={handleCreateUser} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 space-y-2.5 text-xs">
              <span className="font-black text-slate-900 block text-xs">
                Crear Nuevo Usuario / Vendedor
              </span>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Ej: Lucas Vendedor"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Usuario</label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={e => setNewUserUsername(e.target.value)}
                    placeholder="lucas"
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Contraseña</label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={e => setNewUserPassword(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Rol / Permisos</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                >
                  <option value="seller">Vendedor (Solo Stock y Ventas)</option>
                  <option value="admin">Dueño / Admin (Stock, Ventas, Gastos y Reportes)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-2 rounded-xl text-xs transition-all shadow-xs border-2 border-purple-700"
              >
                Guardar Usuario en la Nube
              </button>
            </form>

            <button
              type="button"
              onClick={() => setShowUsersModal(false)}
              className="w-full bg-slate-200 text-slate-800 hover:bg-slate-300 py-2.5 rounded-xl text-xs font-bold transition-all border-2 border-slate-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
