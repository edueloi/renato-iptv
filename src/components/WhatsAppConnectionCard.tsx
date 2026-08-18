import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, QrCode, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { ConfirmModal } from './ConfirmModal';

type WhatsAppStatus = 'disconnected' | 'connecting' | 'connected';

interface StatusResponse {
  status: WhatsAppStatus;
  qrCode: string | null;
  phoneNumber: string | null;
}

export const WhatsAppConnectionCard: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmDisconnectOpen, setIsConfirmDisconnectOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/whatsapp/status');
      if (res.ok) {
        const json: StatusResponse = await res.json();
        setStatus(json.status);
        setQrCode(json.qrCode);
        setPhoneNumber(json.phoneNumber);
      }
    } catch (err) {
      console.error('Error fetching WhatsApp status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await apiFetch('/api/whatsapp/connect', { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error('Error connecting WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  const executeDisconnect = async () => {
    setIsConfirmDisconnectOpen(false);
    setLoading(true);
    try {
      await apiFetch('/api/whatsapp/disconnect', { method: 'POST' });
      await fetchStatus();
    } catch (err) {
      console.error('Error disconnecting WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${
            status === 'connected'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          }`}>
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              Conexão WhatsApp (Baileys)
            </h3>
            {status === 'connected' ? (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Conectado — {phoneNumber}
              </p>
            ) : status === 'connecting' ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                {qrCode ? 'Escaneie o QR Code para conectar' : 'Conectando...'}
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Desconectado — os disparos automáticos não vão funcionar até conectar.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'connected' ? (
            <button
              onClick={() => setIsConfirmDisconnectOpen(true)}
              disabled={loading}
              className="px-3 py-1.5 font-medium rounded-md text-xs border flex items-center gap-1.5 transition-colors shadow-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100"
            >
              <LogOut className="w-3.5 h-3.5" /> Desconectar
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading || status === 'connecting'}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md text-xs border border-emerald-500 flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-60"
            >
              {loading || status === 'connecting' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <QrCode className="w-3.5 h-3.5" />
              )}
              Conectar WhatsApp
            </button>
          )}
        </div>
      </div>

      {status === 'connecting' && qrCode && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-2">
          <img src={qrCode} alt="QR Code do WhatsApp" className="w-48 h-48 rounded-lg border border-slate-200 dark:border-slate-700" />
          <p className="text-[11px] text-slate-500 text-center max-w-xs">
            Abra o WhatsApp no celular do número que vai disparar as mensagens → Dispositivos conectados → Conectar dispositivo → escaneie este código.
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmDisconnectOpen}
        title="Desconectar WhatsApp"
        message="Isso encerra a sessão atual do WhatsApp. Para conectar de novo (ou parear outro número), será necessário escanear um novo QR Code."
        confirmText="Sim, Desconectar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={executeDisconnect}
        onClose={() => setIsConfirmDisconnectOpen(false)}
      />
    </div>
  );
};
