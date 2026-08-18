import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

// Single-tenant adaptation of the Baileys WhatsApp manager already proven in
// production at psi-painel-karen/backend/services/whatsappService.js —
// same connection/QR/reconnect/send logic, without the multi-tenant map.

const SESSION_DIR = path.join(process.cwd(), 'data', 'whatsapp_session');

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface WhatsAppState {
  sock: any;
  status: ConnectionStatus;
  qrCode: string | null;
  phoneNumber: string | null;
  manualDisconnect: boolean;
  reconnectTimer: NodeJS.Timeout | null;
  sessionToken: symbol | null;
  hasSession: boolean;
}

const state: WhatsAppState = {
  sock: null,
  status: 'disconnected',
  qrCode: null,
  phoneNumber: null,
  manualDisconnect: false,
  reconnectTimer: null,
  sessionToken: null,
  hasSession: false,
};

function jidToPhone(jid: string): string {
  return String(jid || '').replace(/@.*/, '').replace(/:[0-9]+$/, '');
}

function normalizeDestination(dest: string): string | null {
  const raw = String(dest || '').trim();
  if (!raw) return null;
  if (raw.includes('@')) return raw;
  const digits = raw.replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : null;
}

// BR numbers can be registered on WhatsApp with or without the 9th digit —
// try both variants so old contacts saved without it still resolve.
function brazilJidCandidates(digits: string): string[] {
  if (!digits.startsWith('55')) return [digits];
  if (digits.length === 13 && digits[4] === '9') return [digits, digits.slice(0, 4) + digits.slice(5)];
  if (digits.length === 12) return [digits, digits.slice(0, 4) + '9' + digits.slice(4)];
  return [digits];
}

function makeSilentLogger(): any {
  const noop = () => {};
  const logger: any = { level: 'silent', trace: noop, debug: noop, info: noop, warn: noop, error: noop };
  logger.child = () => makeSilentLogger();
  return logger;
}

function clearReconnectTimer() {
  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
}

export function getStatus() {
  return { status: state.status, qrCode: state.qrCode, phoneNumber: state.phoneNumber };
}

export async function connect(forceNew = false): Promise<void> {
  if (state.status === 'connected' && !forceNew) return;

  clearReconnectTimer();
  state.manualDisconnect = false;
  const sessionToken = Symbol('wa-session');
  state.sessionToken = sessionToken;

  if (forceNew && fs.existsSync(SESSION_DIR)) {
    try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch {}
    state.hasSession = false;
  }

  if (state.sock) {
    try { state.sock.ev?.removeAllListeners?.(); } catch {}
    try { state.sock.end?.(new Error('Reiniciando conexão')); } catch {}
  }

  state.sock = null;
  state.phoneNumber = null;
  state.qrCode = null;
  state.status = 'connecting';

  await createSocket(sessionToken);
}

async function createSocket(sessionToken: symbol): Promise<void> {
  // Baileys v7 is ESM-only; the production build of this server bundles to
  // CJS, so this must stay a dynamic import (works from both CJS and ESM).
  let baileys: any;
  try {
    baileys = await import('@whiskeysockets/baileys');
  } catch (err: any) {
    state.status = 'disconnected';
    console.error('[WhatsApp] Biblioteca Baileys não disponível:', err.message);
    return;
  }

  const makeWASocket = baileys.makeWASocket || baileys.default;
  const { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = baileys;

  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state: authState, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  let waVersion: [number, number, number] = [2, 3000, 1015901307];
  try {
    const latest = await fetchLatestBaileysVersion?.();
    if (latest?.version) waVersion = latest.version;
  } catch {}

  const sock = makeWASocket({
    version: waVersion,
    auth: authState,
    browser: ['Chrome (Linux)', 'IPTV & P2P Pro', '1.0.0'],
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    connectTimeoutMs: 60_000,
    retryRequestDelayMs: 2_000,
    logger: makeSilentLogger(),
  });

  state.sock = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update: any) => {
    if (state.sessionToken !== sessionToken) return;
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      state.status = 'connecting';
      try {
        state.qrCode = await QRCode.toDataURL(qr, { width: 320, margin: 2 });
      } catch (e: any) {
        console.warn('[WhatsApp] Falha ao gerar QR Code:', e.message);
        state.qrCode = null;
      }
    }

    if (connection === 'open') {
      state.status = 'connected';
      state.qrCode = null;
      state.hasSession = true;
      state.phoneNumber = jidToPhone(sock.user?.id || '') || 'Conectado';
      console.log(`[WhatsApp] Conectado: ${state.phoneNumber}`);
    }

    if (connection === 'close') {
      state.status = 'disconnected';
      state.qrCode = null;
      state.phoneNumber = null;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason?.loggedOut;

      if (loggedOut) {
        state.hasSession = false;
        try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch {}
        return;
      }

      if (state.manualDisconnect) return;

      console.log('[WhatsApp] Desconectado. Tentando reconectar em 5s...');
      clearReconnectTimer();
      state.reconnectTimer = setTimeout(() => {
        state.reconnectTimer = null;
        if (state.sessionToken === sessionToken && !state.manualDisconnect) {
          connect(false).catch(err => console.error('[WhatsApp] Erro ao reconectar:', err.message));
        }
      }, 5000);
    }
  });
}

export async function disconnectSession(): Promise<void> {
  clearReconnectTimer();
  state.manualDisconnect = true;
  state.sessionToken = Symbol('wa-manual-disconnect');

  if (state.sock) {
    try { state.sock.ev?.removeAllListeners?.(); } catch {}
    try { await state.sock.logout?.(); } catch {}
    try { state.sock.end?.(new Error('Desconexão manual')); } catch {}
  }

  try { fs.rmSync(SESSION_DIR, { recursive: true, force: true }); } catch {}

  state.sock = null;
  state.status = 'disconnected';
  state.qrCode = null;
  state.phoneNumber = null;
  state.hasSession = false;
}

export async function sendWhatsAppMessage(contact: string, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!state.sock || state.status !== 'connected') {
    return { ok: false, error: 'WhatsApp não está conectado.' };
  }

  let jid = normalizeDestination(contact);
  if (!jid) {
    return { ok: false, error: 'Número de contato inválido.' };
  }

  try {
    if (jid.endsWith('@s.whatsapp.net')) {
      const digits = jid.replace('@s.whatsapp.net', '');
      try {
        const results = await state.sock.onWhatsApp(...brazilJidCandidates(digits));
        const found = Array.isArray(results) ? results.find((r: any) => r?.exists && r?.jid) : null;
        if (found) {
          jid = found.jid;
        } else if (Array.isArray(results)) {
          return { ok: false, error: `O número ${contact} não possui WhatsApp.` };
        }
      } catch {
        // Se a verificação falhar (timeout etc.), segue com o JID normalizado.
      }
    }

    await state.sock.sendMessage(jid, { text: String(text || '') });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: `Erro ao enviar via WhatsApp: ${err.message || err}` };
  }
}

export async function initWhatsApp(): Promise<void> {
  const hasExistingSession = fs.existsSync(SESSION_DIR) && fs.readdirSync(SESSION_DIR).length > 0;
  state.hasSession = hasExistingSession;
  if (hasExistingSession) {
    console.log('[WhatsApp] Sessão salva encontrada, tentando restaurar conexão...');
    await connect(false);
  }

  // Se cair silenciosamente mas já havia uma sessão pareada, tenta reconectar.
  setInterval(() => {
    if (state.status === 'disconnected' && !state.manualDisconnect && state.hasSession) {
      console.log('[WhatsApp] Health-check: reconectando sessão existente...');
      connect(false).catch(err => console.error('[WhatsApp] Erro no health-check:', err.message));
    }
  }, 5 * 60 * 1000);
}
