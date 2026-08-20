export type ClientStatus = 'Ativo' | 'Vencido' | 'Hoje' | 'A Vencer' | 'Inativo' | 'Bloqueado' | 'Em Teste' | 'Pendente Pagamento' | 'Ativo Parceiro';

export type ServiceType = 'IPTV' | 'P2P' | 'IPTV_P2P';

export interface Client {
  id: string;
  generalQty?: number; // Coluna A: quantidade geral de cliente
  username: string;    // Coluna B: Usuário / Nome
  dueDate: string;     // Coluna C: Data de vencimento (YYYY-MM-DD)
  status: ClientStatus;// Coluna D: Status
  value: number;       // Coluna E: Valor
  extraField?: string; // Coluna F: Vazio/Extra
  contact: string;     // Coluna G: Contato (WhatsApp)
  appUsed: string;     // Coluna H: Aplicativo usado
  serviceType: ServiceType; // IPTV ou P2P
  notes?: string;      // Observação
  createdAt: string;
  updatedAt: string;
  
  // Bot tracking fields
  botStatus?: 'PENDENTE' | 'ENVIADO' | 'ERRO' | 'ISENTO';
  lastBotSentAt?: string;
  botAttempts?: number;
}

export interface Expense {
  id: string;
  monthRef: string; // Ex: "2026-08"
  description: string;
  category: 'Servidor IPTV' | 'Servidor P2P' | 'Painel Master' | 'Links/CDN' | 'Marketing' | 'Outros';
  value: number;
  date: string;
  notes?: string;
  isRecurring?: boolean; // Se o custo se repete todo mês automaticamente
  createdAt: string;
}

export interface CycleReport {
  cycleLabel: string; // Ex: "19/07/2026 a 19/08/2026"
  startDate: string;
  endDate: string;
  totalActiveClients: number;
  totalInactiveClients: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  
  // Comparisons with previous 19-19 cycle
  prevCycleProfit: number;
  profitGrowthValue: number; // Ex: +R$ 450,00
  profitGrowthPercent: number; // Ex: +15.5%
  
  // Monthly gains and losses
  gainsCount: number; // Novos clientes inseridos no mês
  lossesCount: number; // Clientes inativados/perdas no mês
  churnRatePercent: number;
}

export interface BotLog {
  id: string;
  clientId: string;
  clientUsername: string;
  contact: string;
  messageType: 'INATIVO' | 'VENCIDO' | 'A_VENCER' | 'MANUAL';
  messageContent: string;
  status: 'ENVIADO' | 'ERRO' | 'AGENDADO';
  errorMessage?: string;
  timestamp: string;
}

export interface BotConfig {
  enabled: boolean;
  intervalMinutes: number; // Default 5 mins
  targetInactive: boolean;
  targetOverdue: boolean;
  targetUpcoming: boolean;
  daysBeforeDueNotice: number;
  templateInactive: string;
  templateOverdue: string;
  templateUpcoming: string;
  lastRunTimestamp?: string;
  nextRunTimestamp?: string;
}

export interface ImportPreviewItem {
  rowNumber: number;
  generalQty: number;
  username: string;
  dueDate: string;
  status: string;
  value: number;
  extraField: string;
  contact: string;
  appUsed: string;
  isValid: boolean;
  errors: string[];
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  secure: boolean;
  smtpUser: string;
  smtpPass: string;
  senderName: string;
  senderEmail: string;
  backupRecipientEmail: string;
  backupCcEmail?: string;
  autoBackupSchedule: 'DISABLED' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  backupTime?: string; // ex: '08:00'
  backupFormat?: 'XLSX' | 'JSON' | 'BOTH';
  lastBackupSentAt?: string;
  nextBackupScheduledAt?: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  type: 'TEST' | 'BACKUP' | 'MARKETING' | 'COBRANCA' | 'BACKUP_AUTO';
  status: 'SUCESSO' | 'ERRO';
  errorMessage?: string;
  timestamp: string;
}

export interface MessageTemplate {
  id: string;
  title: string;
  category: 'COBRANCA' | 'LEMBRETE' | 'BOAS_VINDAS' | 'PIX' | 'DADOS_ACESSO' | 'PROMOCAO' | 'SUPORTE' | 'OUTROS';
  content: string;
  isSystemDefault?: boolean;
  createdAt: string;
}
