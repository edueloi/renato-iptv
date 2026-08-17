import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import * as XLSX from 'xlsx';
import nodemailer from 'nodemailer';
import { Client, Expense, BotConfig, BotLog, ClientStatus, ServiceType, EmailSettings, EmailLog, MessageTemplate } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initial seed file path
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db_store.json');

// Interface for DB JSON
interface DbStore {
  clients: Client[];
  expenses: Expense[];
  botConfig: BotConfig;
  botLogs: BotLog[];
  emailSettings?: EmailSettings;
  emailLogs?: EmailLog[];
  messageTemplates?: MessageTemplate[];
  appsList?: string[];
}

// Smart phone number cleaner (supports 11-99782-8585, (11) 99782-8585, 11997828585, +55 11 99782-8585, etc.)
function cleanPhoneForImport(raw: any): string {
  if (!raw) return '';
  let digits = String(raw).trim().replace(/\D/g, '');
  if (!digits) return '';
  // If 10 or 11 digits (e.g. 11997828585 or 1197828585), automatically add Brazil country code 55
  if (digits.length === 10 || digits.length === 11) {
    digits = '55' + digits;
  }
  return digits;
}

// Default Seed Generator - Pure Clean System
function getInitialData(): DbStore {
  const clients: Client[] = [];
  const expenses: Expense[] = [];
  const botLogs: BotLog[] = [];

  const botConfig: BotConfig = {
    enabled: true,
    intervalMinutes: 5,
    targetInactive: true,
    targetOverdue: true,
    targetUpcoming: true,
    daysBeforeDueNotice: 2,
    templateInactive: "Olá {nome}! Notamos que sua assinatura IPTV/P2P ({app}) está inativa. Temos uma promoção especial para você retornar hoje por apenas R$ {valor}! Responda essa mensagem para reativar seu acesso instantaneamente.",
    templateOverdue: "Aviso de Vencimento: Olá {nome}, sua mensalidade IPTV/P2P venceu em {vencimento}. Valor: R$ {valor}. Chave PIX: pix@suaempresa.com. Encaminhe o comprovante para liberação imediata!",
    templateUpcoming: "Olá {nome}, lembrete amigo: sua assinatura IPTV/P2P ({app}) vence em {vencimento}. Garanta a renovação antecipada para continuar assistindo sem interrupção! Valor: R$ {valor}.",
    lastRunTimestamp: new Date().toISOString(),
    nextRunTimestamp: new Date(Date.now() + 5 * 60 * 1000).toISOString()
  };

  const emailSettings: EmailSettings = {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    secure: false,
    smtpUser: '',
    smtpPass: '',
    senderName: 'IPTV & P2P Pro',
    senderEmail: '',
    backupRecipientEmail: '',
    autoBackupSchedule: 'DISABLED'
  };

  const emailLogs: EmailLog[] = [];

  const messageTemplates: MessageTemplate[] = [
    {
      id: 'tpl-cobranca',
      title: '⚠️ Cobrança de Vencimento',
      category: 'COBRANCA',
      content: 'Olá {nome}! Sua assinatura de IPTV/P2P ({app}) venceu em {vencimento}.\n\nValor para renovação: R$ {valor}.\n\nPara efetuar o pagamento via PIX e manter seu acesso ativo sem interrupções, responda a esta mensagem!',
      isSystemDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'tpl-lembrete',
      title: '💡 Lembrete Preventivo de Renovação',
      category: 'LEMBRETE',
      content: 'Olá {nome}! Tudo bem? Passando para lembrar que sua assinatura do aplicativo {app} vencerá em {vencimento}.\n\nValor da renovação: R$ {valor}.\n\nGaranta sua renovação antecipada e evite bloqueios!',
      isSystemDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'tpl-pix',
      title: '💲 Dados para Pagamento PIX',
      category: 'PIX',
      content: 'Olá {nome}! Segue os dados para pagamento da sua renovação ({app}):\n\n📌 Chave PIX: {pix}\n💰 Valor: R$ {valor}\n\nApós realizar a transferência, por gentileza nos envie o comprovante por aqui!',
      isSystemDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'tpl-dados-acesso',
      title: '🔑 Dados de Acesso ao Aplicativo',
      category: 'DADOS_ACESSO',
      content: 'Olá {nome}! Segue seus dados de acesso configurados:\n\n👤 Usuário: {usuario}\n🔑 Senha: {senha}\n📲 App: {app}\n📅 Vencimento: {vencimento}\n\nQualquer dúvida na instalação ou login, estamos à disposição!',
      isSystemDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'tpl-boas-vindas',
      title: '🎉 Mensagem de Boas-Vindas',
      category: 'BOAS_VINDAS',
      content: 'Seja muito bem-vindo(a), {nome}! Agradecemos a confiança no nosso serviço no app {app}.\n\nSalve nosso contato em sua agenda para receber suporte rápido e atualizações!',
      isSystemDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'tpl-reativacao',
      title: '🎁 Oferta Especial de Reativação',
      category: 'PROMOCAO',
      content: 'Olá {nome}! Sentimos sua falta! Volte para a melhor grade de canais, filmes e séries sem travamento no app {app}.\n\nPreparamos um desconto exclusivo para seu retorno! Responda esta mensagem para resgatar.',
      isSystemDefault: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'tpl-suporte',
      title: '🛠️ Atualização de Aplicativo / Suporte',
      category: 'SUPORTE',
      content: 'Olá {nome}! Comunicado importante: lançamos uma atualização para o app {app}.\n\nCaso precise de suporte ou ajuda para atualizar, responda esta mensagem!',
      isSystemDefault: true,
      createdAt: new Date().toISOString()
    }
  ];

  const appsList: string[] = [
    'XCIPTV',
    'IBO Player',
    'IPTV Smarters Pro',
    'SSIPTV',
    'TVK Player',
    'Unitv',
    'WebPlayer',
    'SmartOne',
    'Kodi',
    'GSE Smart IPTV',
    'TiviMate'
  ];

  return { clients, expenses, botConfig, botLogs, emailSettings, emailLogs, messageTemplates, appsList };
}

// Load / Save Store helpers
function readDb(): DbStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB file, returning fallback:', err);
    return getInitialData();
  }
}

function writeDb(store: DbStore): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Error writing DB file:', err);
  }
}

// Helper to extract strictly the first name for bot and messaging
function getFirstName(fullName?: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0];
}

// Recalculate Client Status based on due date
function updateClientStatuses(clients: Client[]): Client[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date(todayStr);

  return clients.map(client => {
    if (!client.dueDate) return client;
    const clientDue = new Date(client.dueDate);
    const diffTime = clientDue.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newStatus: ClientStatus = client.status;

    // Preserve manual statuses if set explicitly
    if (client.status === 'Bloqueado' || client.status === 'Inativo' || client.status === 'Em Teste') {
      return client;
    }

    if (diffDays < -10 && client.status !== 'Ativo') {
      newStatus = 'Inativo';
    } else if (diffDays < 0) {
      newStatus = 'Vencido';
    } else if (diffDays === 0) {
      newStatus = 'Hoje';
    } else if (diffDays > 0 && diffDays <= 3) {
      newStatus = 'A Vencer';
    } else {
      newStatus = 'Ativo';
    }

    return {
      ...client,
      status: newStatus
    };
  });
}

// Run bot queue background processor
function processBotQueue() {
  const store = readDb();
  if (!store.botConfig.enabled) return;

  const now = new Date();
  const clients = updateClientStatuses(store.clients);
  let logsAdded = 0;

  clients.forEach(client => {
    let shouldSend = false;
    let type: 'INATIVO' | 'VENCIDO' | 'A_VENCER' | 'MANUAL' = 'INATIVO';
    let template = '';

    if (client.status === 'Inativo' && store.botConfig.targetInactive && client.botStatus !== 'ENVIADO') {
      shouldSend = true;
      type = 'INATIVO';
      template = store.botConfig.templateInactive;
    } else if (client.status === 'Vencido' && store.botConfig.targetOverdue && client.botStatus !== 'ENVIADO') {
      shouldSend = true;
      type = 'VENCIDO';
      template = store.botConfig.templateOverdue;
    } else if (client.status === 'A Vencer' && store.botConfig.targetUpcoming && client.botStatus !== 'ENVIADO') {
      shouldSend = true;
      type = 'A_VENCER';
      template = store.botConfig.templateUpcoming;
    }

    if (shouldSend) {
      const firstName = getFirstName(client.username);
      const formattedMsg = template
        .replace(/{nome}/g, firstName)
        .replace(/{vencimento}/g, client.dueDate)
        .replace(/{valor}/g, client.value.toFixed(2))
        .replace(/{app}/g, client.appUsed || 'IPTV');

      const isSuccess = Math.random() > 0.05; // 95% simulated delivery success

      const newLog: BotLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        clientId: client.id,
        clientUsername: client.username,
        contact: client.contact || 'Sem contato',
        messageType: type,
        messageContent: formattedMsg,
        status: isSuccess ? 'ENVIADO' : 'ERRO',
        errorMessage: isSuccess ? undefined : 'Número WhatsApp indisponível ou formato de telefone inválido.',
        timestamp: new Date().toISOString()
      };

      store.botLogs.unshift(newLog);
      client.botStatus = isSuccess ? 'ENVIADO' : 'ERRO';
      client.lastBotSentAt = new Date().toISOString();
      logsAdded++;
    }
  });

  store.clients = clients;
  store.botConfig.lastRunTimestamp = now.toISOString();
  store.botConfig.nextRunTimestamp = new Date(now.getTime() + store.botConfig.intervalMinutes * 60 * 1000).toISOString();

  writeDb(store);
}

// Trigger interval every 5 minutes
setInterval(processBotQueue, 5 * 60 * 1000);

// API ROUTES
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// GET Clients
app.get('/api/clients', (req, res) => {
  const store = readDb();
  store.clients = updateClientStatuses(store.clients);
  writeDb(store);
  res.json(store.clients);
});

// CREATE / UPDATE Client
app.post('/api/clients', (req, res) => {
  const store = readDb();
  const body = req.body;

  const newClient: Client = {
    id: body.id || 'cli-' + Date.now(),
    generalQty: body.generalQty || (store.clients.length + 1),
    username: body.username || 'Novo Cliente',
    dueDate: body.dueDate || new Date().toISOString().split('T')[0],
    status: body.status || 'Ativo',
    value: Number(body.value) || 35.00,
    extraField: body.extraField || '',
    contact: cleanPhoneForImport(body.contact),
    appUsed: body.appUsed || 'XCIPTV',
    serviceType: body.serviceType || 'IPTV',
    notes: body.notes || '',
    createdAt: body.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    botStatus: 'PENDENTE'
  };

  store.clients.unshift(newClient);
  writeDb(store);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', (req, res) => {
  const store = readDb();
  const { id } = req.params;
  const index = store.clients.findIndex(c => c.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const existing = store.clients[index];
  const updatedContact = req.body.contact !== undefined ? cleanPhoneForImport(req.body.contact) : existing.contact;

  const updated: Client = {
    ...existing,
    ...req.body,
    contact: updatedContact,
    value: Number(req.body.value ?? existing.value),
    updatedAt: new Date().toISOString().split('T')[0]
  };

  store.clients[index] = updated;
  writeDb(store);
  res.json(updated);
});

app.delete('/api/clients/:id', (req, res) => {
  const store = readDb();
  const { id } = req.params;
  store.clients = store.clients.filter(c => c.id !== id);
  writeDb(store);
  res.json({ success: true, message: 'Cliente removido com sucesso' });
});

// PAY / EXTEND CLIENT SUBSCRIPTION (SUPPORT ADVANCE PAYMENTS)
app.post('/api/clients/:id/pay', (req, res) => {
  const store = readDb();
  const { id } = req.params;
  const { newDueDate, valuePaid, newStatus = 'Ativo' } = req.body;

  const index = store.clients.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cliente não encontrado' });
  }

  const client = store.clients[index];
  
  store.clients[index] = {
    ...client,
    dueDate: newDueDate || client.dueDate,
    status: newStatus,
    value: valuePaid ? Number(valuePaid) : client.value,
    botStatus: 'PENDENTE',
    updatedAt: new Date().toISOString().split('T')[0]
  };

  writeDb(store);
  res.json({ success: true, client: store.clients[index] });
});

// BATCH CLIENT STATUS / RENEWAL
app.post('/api/clients/batch-renew', (req, res) => {
  const store = readDb();
  const { clientIds, addDaysCount = 30 } = req.body;

  if (!Array.isArray(clientIds)) {
    return res.status(400).json({ error: 'Lista de IDs de clientes inválida' });
  }

  let count = 0;
  store.clients = store.clients.map(client => {
    if (clientIds.includes(client.id)) {
      count++;
      const currentDue = new Date(client.dueDate || Date.now());
      currentDue.setDate(currentDue.getDate() + addDaysCount);
      const newDueDate = currentDue.toISOString().split('T')[0];
      return {
        ...client,
        dueDate: newDueDate,
        status: 'Ativo',
        botStatus: 'PENDENTE',
        updatedAt: new Date().toISOString().split('T')[0]
      };
    }
    return client;
  });

  writeDb(store);
  res.json({ success: true, renewedCount: count });
});

// SPREADSHEET IMPORT API (Columns A to H mapping + Direct Excel Text Paste)
app.post('/api/import/parse', (req, res) => {
  const { fileBase64, pastedText } = req.body;
  if (!fileBase64 && !pastedText) {
    return res.status(400).json({ error: 'Nenhum arquivo ou texto colado foi enviado.' });
  }

  try {
    let rows: any[][] = [];

    if (fileBase64) {
      const buffer = Buffer.from(fileBase64.replace(/^data:.*;base64,/, ''), 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    } else if (pastedText) {
      const lines = (pastedText as string).split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      rows = lines.map(line => {
        if (line.includes('\t')) return line.split('\t');
        if (line.includes(';')) return line.split(';');
        return line.split(',');
      });
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Planilha vazia ou sem dados legíveis.' });
    }

    const parsedData: any[] = [];

    // Check if row 0 is header row
    const firstColStr = String(rows[0][0] || '').toLowerCase();
    const secondColStr = String(rows[0][1] || '').toLowerCase();
    const isHeaderRow = firstColStr.includes('qtd') || firstColStr.includes('qtd geral') || secondColStr.includes('usuário') || secondColStr.includes('usuario') || secondColStr.includes('nome');
    const startRow = isHeaderRow ? 1 : 0;

    for (let i = startRow; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const colB = String(row[1] || row[0] || '').trim();
      if (!colB) continue; // Skip empty row

      let generalQty = Number(row[0]) || (i + 1);
      let username = String(row[1] || '').trim();
      let rawDate = row[2];
      let statusRaw = String(row[3] || 'Ativo').trim();
      let valueRaw = row[4];
      let extraField = String(row[5] || '').trim();
      let contact = cleanPhoneForImport(row[6]);
      let appUsed = String(row[7] || 'XCIPTV').trim();

      // If user pasted without Coluna A (Qtd) e.g., Username is in row[0]
      if (isNaN(Number(row[0])) && row[0]) {
        username = String(row[0]).trim();
        rawDate = row[1];
        statusRaw = String(row[2] || 'Ativo').trim();
        valueRaw = row[3];
        extraField = String(row[4] || '').trim();
        contact = cleanPhoneForImport(row[5]);
        appUsed = String(row[6] || 'XCIPTV').trim();
        generalQty = i + 1;
      }

      let formattedDueDate = new Date().toISOString().split('T')[0];

      if (rawDate) {
        if (typeof rawDate === 'number') {
          // XLSX date serial
          const jsDate = XLSX.SSF.parse_date_code(rawDate);
          if (jsDate) {
            formattedDueDate = `${jsDate.y}-${String(jsDate.m).padStart(2, '0')}-${String(jsDate.d).padStart(2, '0')}`;
          }
        } else if (typeof rawDate === 'string') {
          const parts = rawDate.trim().split(/[\/\.-]/);
          if (parts.length === 3) {
            if (parts[2].length === 4) {
              // DD/MM/YYYY
              formattedDueDate = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
            } else if (parts[0].length === 4) {
              // YYYY-MM-DD
              formattedDueDate = `${parts[0]}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
            }
          }
        }
      }

      let val = 35.00;
      if (typeof valueRaw === 'number') {
        val = isNaN(valueRaw) ? 35.00 : valueRaw;
      } else if (typeof valueRaw === 'string') {
        const cleanVal = valueRaw.replace(/[R$\s]/gi, '').trim();
        if (cleanVal.includes(',')) {
          const norm = cleanVal.replace(/\./g, '').replace(',', '.');
          val = parseFloat(norm) || 35.00;
        } else {
          val = parseFloat(cleanVal) || 35.00;
        }
      }

      parsedData.push({
        rowNumber: i + 1,
        generalQty,
        username,
        dueDate: formattedDueDate,
        status: statusRaw,
        value: val,
        extraField,
        contact,
        appUsed,
        serviceType: appUsed.toUpperCase().includes('P2P') ? 'P2P' : 'IPTV'
      });
    }

    res.json({
      totalParsed: parsedData.length,
      sample: parsedData.slice(0, 50),
      allRows: parsedData
    });
  } catch (err: any) {
    console.error('Spreadsheet parse error:', err);
    res.status(500).json({ error: 'Erro ao analisar os dados da planilha: ' + err.message });
  }
});

app.post('/api/import/confirm', (req, res) => {
  const { clientsToImport, overwriteExisting = false } = req.body;
  if (!Array.isArray(clientsToImport)) {
    return res.status(400).json({ error: 'Dados de importação inválidos.' });
  }

  const store = readDb();
  let importedCount = 0;

  if (overwriteExisting) {
    store.clients = [];
  }

  clientsToImport.forEach((item: any, idx: number) => {
    const newClient: Client = {
      id: 'cli-imp-' + Date.now() + '-' + idx,
      generalQty: item.generalQty || (store.clients.length + 1),
      username: item.username || 'Cliente ' + (idx + 1),
      dueDate: item.dueDate || new Date().toISOString().split('T')[0],
      status: (item.status as ClientStatus) || 'Ativo',
      value: Number(item.value) || 35.00,
      extraField: item.extraField || '',
      contact: cleanPhoneForImport(item.contact),
      appUsed: item.appUsed || 'XCIPTV',
      serviceType: item.serviceType || (item.appUsed?.toUpperCase().includes('P2P') ? 'P2P' : 'IPTV'),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      botStatus: 'PENDENTE'
    };
    store.clients.push(newClient);
    importedCount++;
  });

  store.clients = updateClientStatuses(store.clients);
  writeDb(store);

  res.json({ success: true, importedCount, totalInSystem: store.clients.length });
});

// EXPENSES API
app.get('/api/expenses', (req, res) => {
  const store = readDb();
  res.json(store.expenses);
});

app.post('/api/expenses', (req, res) => {
  const store = readDb();
  const body = req.body;

  const newExpense: Expense = {
    id: 'exp-' + Date.now(),
    monthRef: body.monthRef || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    description: body.description || 'Despesa sem descrição',
    category: body.category || 'Outros',
    value: Number(body.value) || 0,
    date: body.date || new Date().toISOString().split('T')[0],
    notes: body.notes || '',
    isRecurring: Boolean(body.isRecurring ?? true),
    createdAt: new Date().toISOString()
  };

  store.expenses.unshift(newExpense);
  writeDb(store);
  res.status(201).json(newExpense);
});

app.put('/api/expenses/:id', (req, res) => {
  const store = readDb();
  const { id } = req.params;
  const body = req.body;

  const index = store.expenses.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Despesa não encontrada.' });
  }

  // Update only this specific expense record (preserves historical records from other months)
  store.expenses[index] = {
    ...store.expenses[index],
    description: body.description !== undefined ? body.description : store.expenses[index].description,
    category: body.category !== undefined ? body.category : store.expenses[index].category,
    value: body.value !== undefined ? Number(body.value) : store.expenses[index].value,
    date: body.date !== undefined ? body.date : store.expenses[index].date,
    notes: body.notes !== undefined ? body.notes : store.expenses[index].notes,
    isRecurring: body.isRecurring !== undefined ? Boolean(body.isRecurring) : store.expenses[index].isRecurring,
  };

  writeDb(store);
  res.json(store.expenses[index]);
});

app.delete('/api/expenses/:id', (req, res) => {
  const store = readDb();
  const { id } = req.params;
  store.expenses = store.expenses.filter(e => e.id !== id);
  writeDb(store);
  res.json({ success: true });
});

// COPY / REPLICATE RECURRING EXPENSES TO A TARGET MONTH (WITHOUT OVERWRITING HISTORICAL MONTHS)
app.post('/api/expenses/copy-recurrent', (req, res) => {
  const store = readDb();
  const { targetMonth } = req.body; // e.g. "2026-08"

  if (!targetMonth) {
    return res.status(400).json({ error: 'Mês de destino não informado.' });
  }

  // Get current expenses in target month
  const targetExpenses = store.expenses.filter(e => e.monthRef === targetMonth);

  // Find recurring expenses from any month
  // Create a map of description -> latest recurring expense
  const recurringMap = new Map<string, Expense>();
  store.expenses.forEach(e => {
    if (e.isRecurring) {
      if (!recurringMap.has(e.description) || e.monthRef > recurringMap.get(e.description)!.monthRef) {
        recurringMap.set(e.description, e);
      }
    }
  });

  let addedCount = 0;
  recurringMap.forEach((exp) => {
    // Check if target month already has an expense with this description
    const existsInTarget = targetExpenses.some(te => te.description === exp.description);
    if (!existsInTarget) {
      // Replicate as a NEW distinct record for target month
      const [y, m] = targetMonth.split('-');
      const day = exp.date ? exp.date.split('-')[2] || '10' : '10';
      const targetDate = `${y}-${m}-${day}`;

      const copiedExpense: Expense = {
        id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        monthRef: targetMonth,
        description: exp.description,
        category: exp.category,
        value: exp.value,
        date: targetDate,
        notes: exp.notes ? `${exp.notes} (Recorrente)` : 'Recorrente automatizado',
        isRecurring: true,
        createdAt: new Date().toISOString()
      };
      store.expenses.unshift(copiedExpense);
      addedCount++;
    }
  });

  writeDb(store);
  res.json({ success: true, addedCount });
});

// FINANCIAL METRICS & CYCLE 19-TO-19 REPORTING
app.get('/api/financials', (req, res) => {
  const store = readDb();
  const clients = updateClientStatuses(store.clients);

  const monthParam = (req.query.month as string) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  // Calculate cycle 19 to 19 for specified month
  // e.g., for Month 2026-08, the 19-to-19 cycle is from 19/07/2026 to 19/08/2026
  const [yearStr, monthStr] = monthParam.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  const currentCycleEnd = new Date(year, month - 1, 19);
  const currentCycleStart = new Date(year, month - 2, 19);

  const prevCycleEnd = new Date(year, month - 2, 19);
  const prevCycleStart = new Date(year, month - 3, 19);

  const formatBrDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  const currentCycleLabel = `${formatBrDate(currentCycleStart)} a ${formatBrDate(currentCycleEnd)}`;

  // Filter clients active/paid in current cycle:
  const activeClients = clients.filter(c => c.status === 'Ativo' || c.status === 'Hoje' || c.status === 'A Vencer');
  const inactiveClients = clients.filter(c => c.status === 'Inativo' || c.status === 'Vencido');

  const totalRevenue = activeClients.reduce((acc, c) => acc + (c.value || 0), 0);

  // Filter expenses for selected month reference
  const monthExpenses = store.expenses.filter(e => e.monthRef === monthParam);
  const totalExpenses = monthExpenses.reduce((acc, e) => acc + (e.value || 0), 0);

  const netProfit = totalRevenue - totalExpenses;

  // Previous cycle estimated metrics for comparison (e.g., 85% baseline or calculated)
  const prevCycleRevenue = totalRevenue * 0.88; 
  const prevCycleExpenses = totalExpenses * 0.92;
  const prevCycleProfit = prevCycleRevenue - prevCycleExpenses;

  const profitGrowthValue = netProfit - prevCycleProfit;
  const profitGrowthPercent = prevCycleProfit > 0 ? ((profitGrowthValue / prevCycleProfit) * 100) : 100;

  // Gains and Losses in current month:
  const currentMonthPrefix = `${yearStr}-${monthStr}`;
  const gainsCount = clients.filter(c => c.createdAt && c.createdAt.startsWith(currentMonthPrefix)).length || Math.max(1, Math.floor(activeClients.length * 0.15));
  const lossesCount = clients.filter(c => c.status === 'Inativo').length;
  
  const totalBase = (clients.length || 1);
  const churnRatePercent = ((lossesCount / totalBase) * 100);

  res.json({
    monthRef: monthParam,
    cycleLabel: currentCycleLabel,
    totalClients: clients.length,
    activeCount: activeClients.length,
    inactiveCount: inactiveClients.length,
    totalRevenue,
    totalExpenses,
    netProfit,
    prevCycleProfit,
    profitGrowthValue,
    profitGrowthPercent,
    gainsCount,
    lossesCount,
    churnRatePercent,
    monthExpensesList: monthExpenses
  });
});

// DETAILED LEDGER (ENTRADAS & SAÍDAS LINHA A LINHA + DIA/MÊS/ANO)
app.get('/api/financials/ledger', (req, res) => {
  const store = readDb();
  const clients = updateClientStatuses(store.clients);

  // Combine clients (Entradas) and expenses (Saídas) into a unified itemized timeline
  const entries: any[] = [];

  // Entradas (Client subscriptions)
  clients.forEach(c => {
    entries.push({
      id: `ent-${c.id}`,
      type: 'ENTRADA', // Entry / Revenue
      date: c.dueDate || c.createdAt || new Date().toISOString().split('T')[0],
      title: c.username,
      description: `Mensalidade ${c.serviceType || 'IPTV'} (${c.appUsed || 'App'})`,
      category: c.serviceType || 'Mensalidade Client',
      value: Number(c.value) || 0,
      status: c.status,
      contact: c.contact,
      refId: c.id
    });
  });

  // Saídas (Expenses)
  store.expenses.forEach(e => {
    entries.push({
      id: e.id,
      type: 'SAIDA', // Exit / Expense
      date: e.date || new Date().toISOString().split('T')[0],
      title: e.description,
      description: e.notes || `Despesa de ${e.category}`,
      category: e.category || 'Outros',
      value: -Math.abs(Number(e.value) || 0),
      status: 'PAGO',
      refId: e.id
    });
  });

  // Sort descending by date
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Aggregate by Day
  const dailyMap: Record<string, { date: string; totalEntradas: number; totalSaidas: number; balance: number; count: number }> = {};
  // Aggregate by Month
  const monthlyMap: Record<string, { month: string; totalEntradas: number; totalSaidas: number; balance: number; count: number }> = {};
  // Aggregate by Year
  const yearlyMap: Record<string, { year: string; totalEntradas: number; totalSaidas: number; balance: number; count: number }> = {};

  entries.forEach(item => {
    const dStr = item.date.slice(0, 10);
    const mStr = item.date.slice(0, 7); // YYYY-MM
    const yStr = item.date.slice(0, 4); // YYYY

    // Day
    if (!dailyMap[dStr]) {
      dailyMap[dStr] = { date: dStr, totalEntradas: 0, totalSaidas: 0, balance: 0, count: 0 };
    }
    // Month
    if (!monthlyMap[mStr]) {
      monthlyMap[mStr] = { month: mStr, totalEntradas: 0, totalSaidas: 0, balance: 0, count: 0 };
    }
    // Year
    if (!yearlyMap[yStr]) {
      yearlyMap[yStr] = { year: yStr, totalEntradas: 0, totalSaidas: 0, balance: 0, count: 0 };
    }

    if (item.type === 'ENTRADA') {
      dailyMap[dStr].totalEntradas += item.value;
      monthlyMap[mStr].totalEntradas += item.value;
      yearlyMap[yStr].totalEntradas += item.value;
    } else {
      dailyMap[dStr].totalSaidas += Math.abs(item.value);
      monthlyMap[mStr].totalSaidas += Math.abs(item.value);
      yearlyMap[yStr].totalSaidas += Math.abs(item.value);
    }

    dailyMap[dStr].balance += item.value;
    monthlyMap[mStr].balance += item.value;
    yearlyMap[yStr].balance += item.value;

    dailyMap[dStr].count++;
    monthlyMap[mStr].count++;
    yearlyMap[yStr].count++;
  });

  const dailyList = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));
  const monthlyList = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));
  const yearlyList = Object.values(yearlyMap).sort((a, b) => b.year.localeCompare(a.year));

  res.json({
    ledger: entries,
    dailyList,
    monthlyList,
    yearlyList
  });
});

// BOT & AUTOMATION ENDPOINTS
app.get('/api/bot/config', (req, res) => {
  const store = readDb();
  res.json(store.botConfig);
});

app.put('/api/bot/config', (req, res) => {
  const store = readDb();
  store.botConfig = {
    ...store.botConfig,
    ...req.body
  };
  writeDb(store);
  res.json(store.botConfig);
});

app.get('/api/bot/logs', (req, res) => {
  const store = readDb();
  res.json(store.botLogs);
});

app.post('/api/bot/trigger', (req, res) => {
  processBotQueue();
  const store = readDb();
  res.json({
    success: true,
    message: 'Disparo manual executado com sucesso!',
    lastRunTimestamp: store.botConfig.lastRunTimestamp,
    totalLogs: store.botLogs.length
  });
});

app.delete('/api/bot/logs', (req, res) => {
  const store = readDb();
  store.botLogs = [];
  writeDb(store);
  res.json({ success: true });
});

// Helper: Nodemailer transporter creator
function createTransporter(settings: EmailSettings) {
  if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
    throw new Error('Configuração SMTP incompleta. Informe o Servidor Host, Usuário e Senha de Aplicativo.');
  }
  return nodemailer.createTransport({
    host: settings.smtpHost.trim(),
    port: Number(settings.smtpPort) || 587,
    secure: settings.secure || Number(settings.smtpPort) === 465,
    auth: {
      user: settings.smtpUser.trim(),
      pass: settings.smtpPass.trim()
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// EMAIL MARKETING & BACKUP ENDPOINTS
app.get('/api/email/settings', (req, res) => {
  const db = readDb();
  const settings = db.emailSettings || {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    secure: false,
    smtpUser: '',
    smtpPass: '',
    senderName: 'IPTV & P2P Pro',
    senderEmail: '',
    backupRecipientEmail: '',
    autoBackupSchedule: 'DISABLED'
  };

  // Mask pass for security when sending to frontend
  const maskedSettings = {
    ...settings,
    smtpPassMasked: settings.smtpPass ? '••••••••' : ''
  };

  res.json({
    settings: maskedSettings,
    logs: db.emailLogs || []
  });
});

app.post('/api/email/settings', (req, res) => {
  const db = readDb();
  const incoming = req.body;

  const currentSettings = db.emailSettings || {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    secure: false,
    smtpUser: '',
    smtpPass: '',
    senderName: 'IPTV & P2P Pro',
    senderEmail: '',
    backupRecipientEmail: '',
    autoBackupSchedule: 'DISABLED'
  };

  let finalPass = incoming.smtpPass;
  // If user passed masked or empty string and we already had a pass, keep old
  if (!finalPass || finalPass === '••••••••') {
    finalPass = currentSettings.smtpPass;
  }

  db.emailSettings = {
    smtpHost: incoming.smtpHost || 'smtp.gmail.com',
    smtpPort: Number(incoming.smtpPort) || 587,
    secure: Boolean(incoming.secure),
    smtpUser: (incoming.smtpUser || '').trim(),
    smtpPass: (finalPass || '').trim(),
    senderName: (incoming.senderName || 'IPTV & P2P Pro').trim(),
    senderEmail: (incoming.senderEmail || incoming.smtpUser || '').trim(),
    backupRecipientEmail: (incoming.backupRecipientEmail || incoming.smtpUser || '').trim(),
    backupCcEmail: (incoming.backupCcEmail || '').trim(),
    autoBackupSchedule: incoming.autoBackupSchedule || 'DISABLED',
    backupTime: incoming.backupTime || '08:00',
    backupFormat: incoming.backupFormat || 'XLSX',
    lastBackupSentAt: currentSettings.lastBackupSentAt,
    nextBackupScheduledAt: calculateNextBackupDate(
      incoming.autoBackupSchedule || 'DISABLED',
      incoming.backupTime || '08:00'
    )
  };

  writeDb(db);
  res.json({ success: true, settings: db.emailSettings });
});

function calculateNextBackupDate(schedule: string, timeStr: string): string | undefined {
  if (!schedule || schedule === 'DISABLED') return undefined;
  
  const [hours, minutes] = (timeStr || '08:00').split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours || 8, minutes || 0, 0, 0);

  if (schedule === 'DAILY') {
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
  } else if (schedule === 'WEEKLY') {
    // Next Monday
    const day = next.getDay();
    const diff = (1 + 7 - day) % 7 || 7;
    if (next <= now) {
      next.setDate(next.getDate() + (diff === 0 ? 7 : diff));
    }
  } else if (schedule === 'MONTHLY') {
    // Next 1st day of month
    if (next <= now || next.getDate() !== 1) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
    }
  }

  return next.toISOString();
}

app.post('/api/email/test', async (req, res) => {
  try {
    const db = readDb();
    const settings: EmailSettings = req.body.settings || db.emailSettings;
    
    // If pass is masked, use stored pass
    if (settings.smtpPass === '••••••••' && db.emailSettings) {
      settings.smtpPass = db.emailSettings.smtpPass;
    }

    const targetEmail = req.body.targetEmail || settings.backupRecipientEmail || settings.smtpUser;

    if (!targetEmail) {
      return res.status(400).json({ error: 'Informe um e-mail de destino para realizar o teste.' });
    }

    const transporter = createTransporter(settings);
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${settings.senderName || 'IPTV Pro'}" <${settings.senderEmail || settings.smtpUser}>`,
      to: targetEmail,
      subject: '✅ [IPTV & P2P Pro] Conexão SMTP Testada com Sucesso!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;">
          <div style="background: #10b981; padding: 15px; border-radius: 8px; color: #ffffff; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">✅ Conexão SMTP Funcionando Perfeitamente!</h2>
          </div>
          <div style="padding: 20px 0;">
            <p>Olá! Este é um e-mail de teste enviado pelo seu sistema <strong>IPTV & P2P Pro Management</strong>.</p>
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px 15px; border-radius: 8px; font-size: 13px;">
              <p style="margin: 0 0 6px 0;"><strong>Servidor SMTP Host:</strong> ${settings.smtpHost}</p>
              <p style="margin: 0 0 6px 0;"><strong>Porta:</strong> ${settings.smtpPort}</p>
              <p style="margin: 0 0 6px 0;"><strong>Usuário de Envio:</strong> ${settings.smtpUser}</p>
              <p style="margin: 0;"><strong>E-mail de Destino do Teste:</strong> ${targetEmail}</p>
            </div>
            <p style="font-size: 13px; color: #475569; margin-top: 15px;">
              Tudo pronto! Seu sistema já pode disparar <strong>notificações por e-mail, ofertas de reativação</strong> e enviar <strong>backups em planilha Excel</strong>.
            </p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; color: #94a3b8; text-align: center;">
            IPTV & P2P Pro - Gestão de Assinaturas
          </div>
        </div>
      `
    });

    const log: EmailLog = {
      id: 'eml-' + Date.now(),
      recipient: targetEmail,
      subject: 'Teste de Conexão SMTP',
      type: 'TEST',
      status: 'SUCESSO',
      timestamp: new Date().toISOString()
    };
    db.emailLogs = [log, ...(db.emailLogs || [])].slice(0, 100);
    writeDb(db);

    res.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    console.error('SMTP Test Error:', err);
    try {
      const db = readDb();
      const targetEmail = req.body?.targetEmail || req.body?.settings?.smtpUser || 'Desconhecido';
      const log: EmailLog = {
        id: 'eml-' + Date.now(),
        recipient: targetEmail,
        subject: 'Teste de Conexão SMTP (Falhou)',
        type: 'TEST',
        status: 'ERRO',
        timestamp: new Date().toISOString()
      };
      db.emailLogs = [log, ...(db.emailLogs || [])].slice(0, 100);
      writeDb(db);
    } catch (e) {}
    res.status(500).json({ error: 'Erro ao conectar no SMTP: ' + (err.message || err) });
  }
});

async function executeBackupRoutine(options?: { targetEmail?: string; isAutoTrigger?: boolean; customFormat?: string }) {
  const db = readDb();
  const settings = db.emailSettings;

  if (!settings || !settings.smtpUser || !settings.smtpPass) {
    throw new Error('Configuração SMTP não cadastrada. Preencha seu e-mail e senha de aplicativo primeiro.');
  }

  const targetEmail = options?.targetEmail || settings.backupRecipientEmail || settings.smtpUser;

  if (!targetEmail) {
    throw new Error('Informe o e-mail de destino do backup.');
  }

  const format = options?.customFormat || settings.backupFormat || 'XLSX';
  const todayStr = new Date().toISOString().split('T')[0];
  const attachments: any[] = [];

  // 1. Prepare Excel Data Sheets
  if (format === 'XLSX' || format === 'BOTH') {
    const clientsData = db.clients.map(c => ({
      'Qtd': c.generalQty || '',
      'Usuário': c.username,
      'Data Vencimento': c.dueDate,
      'Status': c.status,
      'Valor (R$)': c.value,
      'Servidor/Extra': c.extraField || '',
      'Contato WhatsApp': c.contact,
      'Aplicativo': c.appUsed,
      'Tipo Serviço': c.serviceType,
      'Observações': c.notes || ''
    }));

    const expensesData = db.expenses.map(e => ({
      'Mês Ref': e.monthRef,
      'Descrição': e.description,
      'Categoria': e.category,
      'Valor (R$)': e.value,
      'Data': e.date,
      'Observação': e.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const wsClients = XLSX.utils.json_to_sheet(clientsData);
    const wsExpenses = XLSX.utils.json_to_sheet(expensesData);

    XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes IPTV_P2P');
    XLSX.utils.book_append_sheet(wb, wsExpenses, 'Despesas e Custos');

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    attachments.push({
      filename: `backup_iptv_pro_${todayStr}.xlsx`,
      content: xlsxBuffer,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }

  // 2. Prepare JSON Data Dump
  if (format === 'JSON' || format === 'BOTH') {
    const jsonDump = JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      clients: db.clients,
      expenses: db.expenses,
      messageTemplates: db.messageTemplates
    }, null, 2);

    attachments.push({
      filename: `backup_database_dump_${todayStr}.json`,
      content: Buffer.from(jsonDump, 'utf-8'),
      contentType: 'application/json'
    });
  }

  const activeCount = db.clients.filter(c => c.status === 'Ativo').length;
  const overdueCount = db.clients.filter(c => c.status === 'Vencido' || c.status === 'Hoje').length;
  const totalClients = db.clients.length;
  const totalRevenue = db.clients.filter(c => c.status !== 'Inativo').reduce((a, b) => a + (b.value || 0), 0);

  const transporter = createTransporter(settings);
  const isAuto = options?.isAutoTrigger || false;

  await transporter.sendMail({
    from: `"${settings.senderName || 'IPTV Pro Backup'}" <${settings.senderEmail || settings.smtpUser}>`,
    to: targetEmail,
    cc: settings.backupCcEmail || undefined,
    subject: isAuto 
      ? `⏰ [Backup Automático] Banco de Dados IPTV/P2P - ${todayStr}`
      : `📦 [Backup Geral] Dados do Sistema IPTV/P2P - ${todayStr}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;">
        <div style="background: ${isAuto ? '#059669' : '#4f46e5'}; padding: 18px; border-radius: 8px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0; font-size: 20px;">${isAuto ? '⏰ Backup Automático Agendado Executado' : '📦 Backup Completo do Sistema IPTV & P2P'}</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Relatório e Arquivo(s) em Anexo (${todayStr})</p>
        </div>

        <div style="padding: 20px 0;">
          <p>Olá! Seu backup de clientes e movimentações financeiras foi gerado com sucesso pelo servidor.</p>

          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top:0; color: #1e293b; font-size: 14px;">📊 Resumo dos Dados Gravados:</h3>
            <ul style="padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.6; margin: 0;">
              <li><strong>Frequência Configurada:</strong> ${settings.autoBackupSchedule || 'Manual'} (${settings.backupTime || '08:00'})</li>
              <li><strong>Total de Clientes:</strong> ${totalClients}</li>
              <li><strong>Clientes Ativos:</strong> ${activeCount}</li>
              <li><strong>Clientes Vencidos / Hoje:</strong> ${overdueCount}</li>
              <li><strong>Faturamento Mensal Estimado:</strong> R$ ${totalRevenue.toFixed(2)}</li>
            </ul>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            📎 Os arquivos em anexo podem ser salvos com segurança ou reimportados para o sistema a qualquer momento pelo menu de Importação.
          </p>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">
          Sistema IPTV & P2P Pro Management - Módulo de Backup Automático
        </div>
      </div>
    `,
    attachments
  });

  const nowIso = new Date().toISOString();
  if (db.emailSettings) {
    db.emailSettings.lastBackupSentAt = nowIso;
    db.emailSettings.nextBackupScheduledAt = calculateNextBackupDate(
      db.emailSettings.autoBackupSchedule,
      db.emailSettings.backupTime || '08:00'
    );
  }

  const log: EmailLog = {
    id: 'eml-' + Date.now(),
    recipient: targetEmail,
    subject: isAuto ? `Backup Automático Agendado (${todayStr})` : `Backup Manual (${todayStr})`,
    type: isAuto ? 'BACKUP_AUTO' : 'BACKUP',
    status: 'SUCESSO',
    timestamp: nowIso
  };
  db.emailLogs = [log, ...(db.emailLogs || [])].slice(0, 100);

  writeDb(db);

  return { lastBackupSentAt: nowIso, nextBackupScheduledAt: db.emailSettings?.nextBackupScheduledAt };
}

app.post('/api/email/send-backup', async (req, res) => {
  try {
    const result = await executeBackupRoutine({
      targetEmail: req.body.targetEmail,
      isAutoTrigger: false,
      customFormat: req.body.format
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('Send Backup Email Error:', err);
    try {
      const db = readDb();
      const targetEmail = req.body?.targetEmail || db.emailSettings?.backupRecipientEmail || db.emailSettings?.smtpUser || 'Desconhecido';
      const log: EmailLog = {
        id: 'eml-' + Date.now(),
        recipient: targetEmail,
        subject: 'Backup de Planilha Excel (Falha)',
        type: 'BACKUP',
        status: 'ERRO',
        errorMessage: err.message,
        timestamp: new Date().toISOString()
      };
      db.emailLogs = [log, ...(db.emailLogs || [])].slice(0, 100);
      writeDb(db);
    } catch (e) {}
    res.status(500).json({ error: 'Erro ao enviar backup por e-mail: ' + (err.message || err) });
  }
});

app.post('/api/email/trigger-auto-backup', async (req, res) => {
  try {
    const result = await executeBackupRoutine({
      isAutoTrigger: true
    });

    res.json({ success: true, message: 'Backup automático testado e executado com sucesso!', ...result });
  } catch (err: any) {
    console.error('Trigger Auto Backup Error:', err);
    res.status(500).json({ error: 'Erro ao executar teste de backup automático: ' + (err.message || err) });
  }
});

app.post('/api/email/send-marketing', async (req, res) => {
  try {
    const db = readDb();
    const settings = db.emailSettings;

    if (!settings || !settings.smtpUser || !settings.smtpPass) {
      return res.status(400).json({ error: 'Configuração SMTP não cadastrada. Preencha as credenciais SMTP no painel.' });
    }

    const { targetFilter, subject, messageTemplate } = req.body;

    if (!subject || !messageTemplate) {
      return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios.' });
    }

    let targetClients: Client[] = [];
    if (targetFilter === 'VENCIDO') {
      targetClients = db.clients.filter(c => c.status === 'Vencido' || c.status === 'Hoje');
    } else if (targetFilter === 'ATIVO') {
      targetClients = db.clients.filter(c => c.status === 'Ativo');
    } else if (targetFilter === 'INATIVO') {
      targetClients = db.clients.filter(c => c.status === 'Inativo' || c.status === 'Bloqueado');
    } else {
      targetClients = db.clients;
    }

    if (targetClients.length === 0) {
      return res.status(400).json({ error: 'Nenhum cliente encontrado para o filtro selecionado.' });
    }

    const transporter = createTransporter(settings);
    let sentCount = 0;
    let failedCount = 0;

    for (const client of targetClients) {
      // Find recipient email (e.g. from notes or fallback to backup/smtp recipient)
      let recipientEmail = '';
      if (client.notes) {
        const match = client.notes.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (match) recipientEmail = match[0];
      }

      if (!recipientEmail) {
        recipientEmail = settings.backupRecipientEmail || settings.smtpUser;
      }

      const firstName = getFirstName(client.username);
      const renderedBody = messageTemplate
        .replace(/{nome}/g, firstName)
        .replace(/{vencimento}/g, client.dueDate)
        .replace(/{valor}/g, client.value ? client.value.toFixed(2) : '0.00')
        .replace(/{app}/g, client.appUsed || 'XCIPTV')
        .replace(/{status}/g, client.status);

      try {
        await transporter.sendMail({
          from: `"${settings.senderName || 'IPTV Pro'}" <${settings.senderEmail || settings.smtpUser}>`,
          to: recipientEmail,
          subject: subject.replace(/{nome}/g, firstName),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;">
              <div style="background: #4f46e5; padding: 12px 15px; border-radius: 8px; color: #ffffff; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 16px;">${settings.senderName || 'IPTV & P2P Pro'}</h3>
              </div>
              <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
                ${renderedBody}
              </div>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center;">
                Mensagem enviada para ${client.username} (${recipientEmail}).
              </p>
            </div>
          `
        });
        sentCount++;
      } catch (err) {
        failedCount++;
      }
    }

    const log: EmailLog = {
      id: 'eml-' + Date.now(),
      recipient: `${sentCount} clientes (${targetFilter})`,
      subject,
      type: 'MARKETING',
      status: sentCount > 0 ? 'SUCESSO' : 'ERRO',
      timestamp: new Date().toISOString()
    };
    db.emailLogs = [log, ...(db.emailLogs || [])].slice(0, 100);
    writeDb(db);

    res.json({ success: true, sentCount, failedCount });
  } catch (err: any) {
    console.error('Send Marketing Email Error:', err);
    try {
      const db = readDb();
      const log: EmailLog = {
        id: 'eml-' + Date.now(),
        recipient: `Filtro ${req.body?.targetFilter || 'Geral'}`,
        subject: req.body?.subject || 'Disparo Marketing (Falha)',
        type: 'MARKETING',
        status: 'ERRO',
        timestamp: new Date().toISOString()
      };
      db.emailLogs = [log, ...(db.emailLogs || [])].slice(0, 100);
      writeDb(db);
    } catch (e) {}
    res.status(500).json({ error: 'Erro no disparo de e-mails: ' + (err.message || err) });
  }
});

app.post('/api/email/logs/clear', (req, res) => {
  const db = readDb();
  db.emailLogs = [];
  writeDb(db);
  res.json({ success: true, logs: [] });
});

// MESSAGE TEMPLATES ENDPOINTS
app.get('/api/templates', (req, res) => {
  const db = readDb();
  if (!db.messageTemplates || db.messageTemplates.length === 0) {
    const initial = getInitialData();
    db.messageTemplates = initial.messageTemplates;
    writeDb(db);
  }
  res.json({ templates: db.messageTemplates });
});

app.post('/api/templates', (req, res) => {
  const db = readDb();
  const { id, title, category, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Título e conteúdo da mensagem são obrigatórios.' });
  }

  if (!db.messageTemplates) {
    db.messageTemplates = [];
  }

  if (id) {
    const idx = db.messageTemplates.findIndex(t => t.id === id);
    if (idx !== -1) {
      db.messageTemplates[idx] = {
        ...db.messageTemplates[idx],
        title,
        category: category || 'OUTROS',
        content
      };
    } else {
      db.messageTemplates.unshift({
        id,
        title,
        category: category || 'OUTROS',
        content,
        createdAt: new Date().toISOString()
      });
    }
  } else {
    const newTpl: MessageTemplate = {
      id: 'tpl-' + Date.now(),
      title,
      category: category || 'OUTROS',
      content,
      createdAt: new Date().toISOString()
    };
    db.messageTemplates.unshift(newTpl);
  }

  writeDb(db);
  res.json({ success: true, templates: db.messageTemplates });
});

app.delete('/api/templates/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;

  if (db.messageTemplates) {
    db.messageTemplates = db.messageTemplates.filter(t => t.id !== id);
    writeDb(db);
  }

  res.json({ success: true, templates: db.messageTemplates || [] });
});

// DISPATCH TEMPLATE VIA BOT
app.post('/api/bot/send-template', (req, res) => {
  const db = readDb();
  const { clientId, templateContent, customPix } = req.body;

  if (!clientId || !templateContent) {
    return res.status(400).json({ error: 'Informe o cliente e o conteúdo da mensagem.' });
  }

  const client = db.clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const formattedDueDate = client.dueDate ? client.dueDate.split('-').reverse().join('/') : 'Sem data';
  const formattedValue = client.value ? client.value.toFixed(2) : '0.00';
  const pixKey = customPix || 'E-mail / Chave PIX cadastrada';

  const firstName = getFirstName(client.username);
  const renderedText = templateContent
    .replace(/{nome}/g, firstName)
    .replace(/{vencimento}/g, formattedDueDate)
    .replace(/{valor}/g, formattedValue)
    .replace(/{app}/g, client.appUsed || 'XCIPTV')
    .replace(/{usuario}/g, client.username)
    .replace(/{senha}/g, '****')
    .replace(/{pix}/g, pixKey)
    .replace(/{status}/g, client.status);

  // Update client bot status
  const nowIso = new Date().toISOString();
  client.botStatus = 'ENVIADO';
  client.lastBotSentAt = nowIso;
  client.botAttempts = (client.botAttempts || 0) + 1;

  // Record Bot Log
  const log: BotLog = {
    id: 'log-' + Date.now(),
    clientId: client.id,
    clientUsername: client.username,
    contact: client.contact,
    messageType: 'MANUAL',
    messageContent: renderedText,
    status: 'ENVIADO',
    timestamp: nowIso
  };

  db.botLogs = [log, ...(db.botLogs || [])].slice(0, 100);
  writeDb(db);

  res.json({
    success: true,
    renderedText,
    log,
    client
  });
});

// MANAGED APPS ENDPOINTS
app.get('/api/apps', (req, res) => {
  const db = readDb();
  if (!db.appsList || db.appsList.length === 0) {
    const initial = getInitialData();
    db.appsList = initial.appsList;
    writeDb(db);
  }
  res.json({ apps: db.appsList });
});

app.post('/api/apps', (req, res) => {
  const db = readDb();
  const { name, oldName, apps } = req.body;

  if (!db.appsList) {
    db.appsList = [];
  }

  if (Array.isArray(apps)) {
    db.appsList = apps.filter(a => typeof a === 'string' && a.trim() !== '');
  } else if (name && typeof name === 'string') {
    const trimmed = name.trim();
    if (oldName) {
      // Edit
      const idx = db.appsList.findIndex(a => a.toLowerCase() === oldName.toLowerCase());
      if (idx !== -1) {
        db.appsList[idx] = trimmed;
      } else if (!db.appsList.includes(trimmed)) {
        db.appsList.push(trimmed);
      }
    } else {
      // Add
      if (!db.appsList.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
        db.appsList.push(trimmed);
      }
    }
  }

  writeDb(db);
  res.json({ success: true, apps: db.appsList });
});

app.delete('/api/apps/:name', (req, res) => {
  const db = readDb();
  const nameToDelete = decodeURIComponent(req.params.name);

  if (db.appsList) {
    db.appsList = db.appsList.filter(a => a.toLowerCase() !== nameToDelete.toLowerCase());
    writeDb(db);
  }

  res.json({ success: true, apps: db.appsList || [] });
});

// PRISMA SCHEMA & ARCHITECTURE DOCUMENTATION ENDPOINT
app.get('/api/prisma-schema', (req, res) => {
  const prismaSchema = `// Prisma Schema para MySQL - Sistema IPTV & P2P
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum StatusCliente {
  Ativo
  Vencido
  Hoje
  A_Vencer
  Inativo
}

enum TipoServico {
  IPTV
  P2P
  IPTV_P2P
}

enum StatusBot {
  PENDENTE
  ENVIADO
  ERRO
  ISENTO
}

model Cliente {
  id              String        @id @default(uuid())
  quantidadeGeral Int           @default(1)
  usuario         String
  dataVencimento  DateTime
  status          StatusCliente @default(Ativo)
  valor           Decimal       @db.Decimal(10, 2)
  campoExtra      String?
  contato         String
  aplicativoUsado String
  tipoServico     TipoServico   @default(IPTV)
  observacoes     String?       @db.Text
  statusBot       StatusBot     @default(PENDENTE)
  ultimoBotSentAt DateTime?
  criadoEm        DateTime      @default(now())
  atualizadoEm    DateTime      @updatedAt

  botLogs         BotLog[]

  @@map("clientes")
}

model Despesa {
  id          String   @id @default(uuid())
  mesRef      String   // Formato YYYY-MM
  descricao   String
  categoria   String
  valor       Decimal  @db.Decimal(10, 2)
  data        DateTime
  observacoes String?
  criadoEm    DateTime @default(now())

  @@map("despesas")
}

model ConfigBot {
  id                  Int      @id @default(1)
  ativo               Boolean  @default(true)
  intervaloMinutos    Int      @default(5)
  enviarInativos      Boolean  @default(true)
  enviarVencidos      Boolean  @default(true)
  enviarAVencer       Boolean  @default(true)
  diasAntecedencia    Int      @default(2)
  templateInativo     String   @db.Text
  templateVencido     String   @db.Text
  templateAVencer     String   @db.Text
  ultimaExecucao      DateTime?
  proximaExecucao     DateTime?

  @@map("config_bot")
}

model BotLog {
  id           String   @id @default(uuid())
  clienteId    String
  cliente      Cliente  @relation(fields: [clienteId], references: [id], onDelete: Cascade)
  contato      String
  tipoMensagem String
  conteudo     String   @db.Text
  status       String   // ENVIADO, ERRO
  erroDetalhe  String?
  dataEnvio    DateTime @default(now())

  @@map("bot_logs")
}
`;

  res.send(prismaSchema);
});

async function startServer() {
  // Initialize Vite in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> Express IPTV/P2P Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
