import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_DATA_FILE = path.join(process.cwd(), 'data', 'db_store.json');

const DEFAULT_BOT_CONFIG = {
  enabled: true,
  intervalMinutes: 5,
  targetInactive: true,
  targetOverdue: true,
  targetUpcoming: true,
  daysBeforeDueNotice: 2,
  templateInactive: 'Olá {nome}! Notamos que sua assinatura IPTV/P2P ({app}) está inativa. Temos uma promoção especial para você retornar hoje por apenas R$ {valor}! Responda essa mensagem para reativar seu acesso instantaneamente.',
  templateOverdue: 'Aviso de Vencimento: Olá {nome}, sua mensalidade IPTV/P2P venceu em {vencimento}. Valor: R$ {valor}. Chave PIX: pix@suaempresa.com. Encaminhe o comprovante para liberação imediata!',
  templateUpcoming: 'Olá {nome}, lembrete amigo: sua assinatura IPTV/P2P ({app}) vence em {vencimento}. Garanta a renovação antecipada para continuar assistindo sem interrupção! Valor: R$ {valor}.',
};

const DEFAULT_EMAIL_SETTINGS = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  secure: false,
  smtpUser: '',
  smtpPass: '',
  senderName: 'IPTV & P2P Pro',
  senderEmail: '',
  backupRecipientEmail: '',
  autoBackupSchedule: 'DISABLED',
};

const DEFAULT_MESSAGE_TEMPLATES = [
  {
    id: 'tpl-cobranca',
    title: '⚠️ Cobrança de Vencimento',
    category: 'COBRANCA',
    content: 'Olá {nome}! Sua assinatura de IPTV/P2P ({app}) venceu em {vencimento}.\n\nValor para renovação: R$ {valor}.\n\nPara efetuar o pagamento via PIX e manter seu acesso ativo sem interrupções, responda a esta mensagem!',
    isSystemDefault: true,
  },
  {
    id: 'tpl-lembrete',
    title: '💡 Lembrete Preventivo de Renovação',
    category: 'LEMBRETE',
    content: 'Olá {nome}! Tudo bem? Passando para lembrar que sua assinatura do aplicativo {app} vencerá em {vencimento}.\n\nValor da renovação: R$ {valor}.\n\nGaranta sua renovação antecipada e evite bloqueios!',
    isSystemDefault: true,
  },
  {
    id: 'tpl-pix',
    title: '💲 Dados para Pagamento PIX',
    category: 'PIX',
    content: 'Olá {nome}! Segue os dados para pagamento da sua renovação ({app}):\n\n📌 Chave PIX: {pix}\n💰 Valor: R$ {valor}\n\nApós realizar a transferência, por gentileza nos envie o comprovante por aqui!',
    isSystemDefault: true,
  },
  {
    id: 'tpl-dados-acesso',
    title: '🔑 Dados de Acesso ao Aplicativo',
    category: 'DADOS_ACESSO',
    content: 'Olá {nome}! Segue seus dados de acesso configurados:\n\n👤 Usuário: {usuario}\n🔑 Senha: {senha}\n📲 App: {app}\n📅 Vencimento: {vencimento}\n\nQualquer dúvida na instalação ou login, estamos à disposição!',
    isSystemDefault: true,
  },
  {
    id: 'tpl-boas-vindas',
    title: '🎉 Mensagem de Boas-Vindas',
    category: 'BOAS_VINDAS',
    content: 'Seja muito bem-vindo(a), {nome}! Agradecemos a confiança no nosso serviço no app {app}.\n\nSalve nosso contato em sua agenda para receber suporte rápido e atualizações!',
    isSystemDefault: true,
  },
  {
    id: 'tpl-reativacao',
    title: '🎁 Oferta Especial de Reativação',
    category: 'PROMOCAO',
    content: 'Olá {nome}! Sentimos sua falta! Volte para a melhor grade de canais, filmes e séries sem travamento no app {app}.\n\nPreparamos um desconto exclusivo para seu retorno! Responda esta mensagem para resgatar.',
    isSystemDefault: true,
  },
  {
    id: 'tpl-suporte',
    title: '🛠️ Atualização de Aplicativo / Suporte',
    category: 'SUPORTE',
    content: 'Olá {nome}! Comunicado importante: lançamos uma atualização para o app {app}.\n\nCaso precise de suporte ou ajuda para atualizar, responda esta mensagem!',
    isSystemDefault: true,
  },
];

const DEFAULT_APPS_LIST = [
  'XCIPTV', 'IBO Player', 'IPTV Smarters Pro', 'SSIPTV', 'TVK Player',
  'Unitv', 'WebPlayer', 'SmartOne', 'Kodi', 'GSE Smart IPTV', 'TiviMate',
];

function readLegacyStore(): any | null {
  if (!fs.existsSync(LEGACY_DATA_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(LEGACY_DATA_FILE, 'utf-8'));
  } catch (err) {
    console.warn('Não foi possível ler data/db_store.json, usando defaults:', err);
    return null;
  }
}

async function main() {
  const legacy = readLegacyStore();

  const botConfig = legacy?.botConfig ?? DEFAULT_BOT_CONFIG;
  await prisma.botConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      enabled: botConfig.enabled,
      intervalMinutes: botConfig.intervalMinutes,
      targetInactive: botConfig.targetInactive,
      targetOverdue: botConfig.targetOverdue,
      targetUpcoming: botConfig.targetUpcoming,
      daysBeforeDueNotice: botConfig.daysBeforeDueNotice,
      templateInactive: botConfig.templateInactive,
      templateOverdue: botConfig.templateOverdue,
      templateUpcoming: botConfig.templateUpcoming,
      lastRunTimestamp: botConfig.lastRunTimestamp ? new Date(botConfig.lastRunTimestamp) : null,
      nextRunTimestamp: botConfig.nextRunTimestamp ? new Date(botConfig.nextRunTimestamp) : null,
    },
    update: {},
  });
  console.log('✔ botConfig pronto');

  const emailSettings = legacy?.emailSettings ?? DEFAULT_EMAIL_SETTINGS;
  await prisma.emailSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      smtpHost: emailSettings.smtpHost,
      smtpPort: emailSettings.smtpPort,
      secure: emailSettings.secure,
      smtpUser: emailSettings.smtpUser,
      smtpPass: emailSettings.smtpPass,
      senderName: emailSettings.senderName,
      senderEmail: emailSettings.senderEmail,
      backupRecipientEmail: emailSettings.backupRecipientEmail,
      backupCcEmail: emailSettings.backupCcEmail,
      autoBackupSchedule: emailSettings.autoBackupSchedule,
      backupTime: emailSettings.backupTime,
      backupFormat: emailSettings.backupFormat,
      lastBackupSentAt: emailSettings.lastBackupSentAt ? new Date(emailSettings.lastBackupSentAt) : null,
      nextBackupScheduledAt: emailSettings.nextBackupScheduledAt ? new Date(emailSettings.nextBackupScheduledAt) : null,
    },
    update: {},
  });
  console.log('✔ emailSettings pronto');

  const templates = legacy?.messageTemplates ?? DEFAULT_MESSAGE_TEMPLATES;
  for (const tpl of templates) {
    await prisma.messageTemplate.upsert({
      where: { id: tpl.id },
      create: {
        id: tpl.id,
        title: tpl.title,
        category: tpl.category,
        content: tpl.content,
        isSystemDefault: !!tpl.isSystemDefault,
        createdAt: tpl.createdAt ? new Date(tpl.createdAt) : undefined,
      },
      update: {},
    });
  }
  console.log(`✔ ${templates.length} message templates prontos`);

  const appsList = legacy?.appsList ?? DEFAULT_APPS_LIST;
  for (const name of appsList) {
    await prisma.appOption.upsert({ where: { name }, create: { name }, update: {} });
  }
  console.log(`✔ ${appsList.length} apps prontos`);

  const clients = legacy?.clients ?? [];
  for (const c of clients) {
    await prisma.client.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        generalQty: c.generalQty,
        username: c.username,
        dueDate: new Date(c.dueDate),
        status: c.status,
        value: c.value,
        extraField: c.extraField,
        contact: c.contact,
        appUsed: c.appUsed,
        serviceType: c.serviceType,
        notes: c.notes,
        botStatus: c.botStatus,
        lastBotSentAt: c.lastBotSentAt ? new Date(c.lastBotSentAt) : null,
        botAttempts: c.botAttempts,
        createdAt: c.createdAt ? new Date(c.createdAt) : undefined,
      },
      update: {},
    });
  }
  if (clients.length) console.log(`✔ ${clients.length} clientes migrados de db_store.json`);

  const expenses = legacy?.expenses ?? [];
  for (const e of expenses) {
    await prisma.expense.upsert({
      where: { id: e.id },
      create: {
        id: e.id,
        monthRef: e.monthRef,
        description: e.description,
        category: e.category,
        value: e.value,
        date: new Date(e.date),
        notes: e.notes,
        isRecurring: !!e.isRecurring,
        createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
      },
      update: {},
    });
  }
  if (expenses.length) console.log(`✔ ${expenses.length} despesas migradas de db_store.json`);

  const ADMIN_USERNAME = 'renatomatos';
  const ADMIN_PASSWORD = 'Renato@123';
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { username: ADMIN_USERNAME },
    create: {
      username: ADMIN_USERNAME,
      passwordHash,
      name: 'Renato Matos',
      role: 'ADMIN',
    },
    update: {},
  });
  console.log(`✔ usuário "${ADMIN_USERNAME}" pronto`);
}

main()
  .catch((err) => {
    console.error('Erro ao popular o banco:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
