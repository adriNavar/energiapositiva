import React, { useState } from 'react';
import { Zap, Lock, User, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { authenticateUser } from '../services/authService';

export default function LoginScreen({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Por favor ingresá usuario y contraseña');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const user = await authenticateUser(identifier, password);
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userKey, pass) => {
    setIdentifier(userKey);
    setPassword(pass);
    setLoading(true);
    setErrorMsg('');

    try {
      const user = await authenticateUser(userKey, pass);
      onLoginSuccess(user);
    } catch (err) {
      setErrorMsg(err.message || 'Error en acceso rápido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-3 font-sans antialiased">
      <div className="w-full max-w-[420px] bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-5 space-y-4">
        
        {/* Cabecera / Banner con Logo Oficial */}
        <div className="text-center space-y-2 pt-2">
          <div className="flex justify-center py-1">
            <img 
              src="/logo-clean.png" 
              alt="Energía +" 
              className="h-16 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform" 
            />
          </div>
          <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-black uppercase tracking-wider">
            Productos de Limpieza
          </div>
        </div>

        {/* Mensaje de error si falló */}
        {errorMsg && (
          <div className="bg-red-50 border-2 border-red-300 text-red-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-black text-slate-800 mb-1">Usuario</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Ingrese usuario"
                className="w-full bg-white border-2 border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-800 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Ingrese contraseña"
                className="w-full bg-white border-2 border-slate-300 rounded-xl pl-9 pr-9 py-2.5 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black py-3 rounded-xl text-xs transition-all shadow-md border-2 border-emerald-700 disabled:opacity-50 mt-2"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Footer info limpio */}
        <div className="text-center pt-2 border-t-2 border-slate-100 text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Energía + &bull; Sistema Seguro</span>
        </div>

      </div>
    </div>
  );
}
