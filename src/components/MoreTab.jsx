import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import { exportBackup, importBackup, resetToDemoData } from '../utils/storage';
import { 
  Download, 
  Upload, 
  RotateCcw, 
  MessageCircle, 
  CheckCircle2, 
  Share2, 
  HelpCircle,
  Copy,
  BookOpen
} from 'lucide-react';

export default function MoreTab({ 
  transactions, 
  debts, 
  onDataRestored 
}) {
  const [copied, setCopied] = useState(false);

  // Calcular balance de hoy
  const today = new Date().toDateString();
  const todayTxs = transactions.filter(t => new Date(t.date).toDateString() === today);
  
  const todaySales = todayTxs
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const todayExpenses = todayTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const todayProfit = todaySales - todayExpenses;

  const pendingDebts = debts
    .filter(d => d.status === 'pending')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const generateWhatsAppMessage = () => {
    const dateFormatted = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    return `📊 *Resumen Limpieza Willi (${dateFormatted})*\n` +
      `💰 *Ventas:* ${formatCurrency(todaySales)}\n` +
      `🧾 *Gastos:* ${formatCurrency(todayExpenses)}\n` +
      `---------------------------\n` +
      `💵 *GANANCIA LIMPIA:* ${formatCurrency(todayProfit)}\n` +
      `⏳ *Cuentas por cobrar:* ${formatCurrency(pendingDebts)}\n` +
      `\n_Enviado desde Limpieza Control_`;
  };

  const handleCopyMessage = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importBackup(file, () => {
      alert('✅ ¡Copia de seguridad restaurada con éxito!');
      if (onDataRestored) onDataRestored();
    }, (err) => {
      alert('❌ Error al importar archivo: ' + err);
    });
  };

  const handleReset = () => {
    if (confirm('¿Seguro que querés volver a los datos de ejemplo iniciales? Se borrarán los datos cargados manualmente.')) {
      resetToDemoData();
      if (onDataRestored) onDataRestored();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-4">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-lg">⚙️</span>
          Herramientas y Respaldo
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Enviá balances por WhatsApp y guardá copias de seguridad.</p>
      </div>

      {/* Resumen para WhatsApp */}
      <div className="bg-gradient-to-br from-emerald-950/70 via-slate-800 to-slate-900 border border-emerald-500/40 rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            Reporte del Día para WhatsApp
          </span>
          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded-lg">
            Hoy
          </span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-slate-300 space-y-1">
          <div className="text-emerald-400 font-bold">📊 Resumen Limpieza Willi</div>
          <div>💰 Ventas: <strong className="text-white">{formatCurrency(todaySales)}</strong></div>
          <div>🧾 Gastos: <strong className="text-rose-400">{formatCurrency(todayExpenses)}</strong></div>
          <div className="border-t border-slate-800 pt-1 text-emerald-300 font-bold">
            💵 Ganancia Limpia: {formatCurrency(todayProfit)}
          </div>
          {pendingDebts > 0 && (
            <div className="text-amber-400 font-semibold">
              ⏳ Cuentas pendientes: {formatCurrency(pendingDebts)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleCopyMessage}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Abrir WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Copia de Seguridad */}
      <div className="bg-slate-800/90 border border-slate-700/60 rounded-3xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <span>💾</span>
          Seguridad de tus Datos
        </h3>
        <p className="text-xs text-slate-400">
          Tus datos se guardan solos en este teléfono, pero podés descargar un archivo de copia por si cambiás de celu o querés tener un respaldo.
        </p>

        <div className="space-y-2 pt-1">
          <button
            onClick={exportBackup}
            className="w-full bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Copia de Seguridad (.json)</span>
          </button>

          <label className="w-full bg-slate-900 hover:bg-slate-750 border border-slate-700 text-slate-300 font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-slate-400" />
            <span>Restaurar desde archivo de copia</span>
            <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
          </label>
        </div>
      </div>

      {/* Instrucciones para guardar como App en el Celular */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          ¿Cómo instalar en la pantalla del celular?
        </h3>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
          <li>Abrí este enlace en <strong>Google Chrome</strong> (Android) o <strong>Safari</strong> (iPhone).</li>
          <li>Tocá los 3 puntitos de arriba (o el botón compartir en iPhone).</li>
          <li>Elegí <strong>"Agregar a la pantalla principal"</strong> o <strong>"Instalar aplicación"</strong>.</li>
          <li>¡Listo! Te queda un ícono como cualquier aplicación de tu teléfono.</li>
        </ul>
      </div>

      {/* Restablecer demo */}
      <div className="pt-2 text-center">
        <button
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-rose-400 flex items-center justify-center gap-1.5 mx-auto transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer datos de ejemplo</span>
        </button>
      </div>

    </div>
  );
}
