import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Server, ShieldCheck, Key, FileSpreadsheet, CheckCircle2, 
  AlertCircle, RefreshCw, HelpCircle, Sparkles, Clock, Copy, ArrowRight,
  BookOpen, FileText, Check, Settings, History, Eye, EyeOff, Globe, Zap,
  Calendar, CheckCircle, XCircle, Search, Trash2, Filter, Database, Layers
} from 'lucide-react';
import { EmailSettings, EmailLog } from '../types';

interface EmailMarketingCenterProps {
  onRefreshData?: () => void;
}

export const EmailMarketingCenter: React.FC<EmailMarketingCenterProps> = () => {
  const [activeSubTab, setActiveSubTab] = useState<'CONFIG' | 'AUTO_BACKUP' | 'BACKUP' | 'MARKETING' | 'LOGS'>('CONFIG');
  
  // SMTP Settings Form State
  const [settings, setSettings] = useState<EmailSettings>({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    secure: false,
    smtpUser: '',
    smtpPass: '',
    senderName: 'IPTV & P2P Pro',
    senderEmail: '',
    backupRecipientEmail: '',
    backupCcEmail: '',
    autoBackupSchedule: 'DISABLED',
    backupTime: '08:00',
    backupFormat: 'XLSX'
  });

  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [sendingBackup, setSendingBackup] = useState(false);
  const [testingAutoBackup, setTestingAutoBackup] = useState(false);
  const [sendingMarketing, setSendingMarketing] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [testTargetEmail, setTestTargetEmail] = useState('');

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email Marketing Form
  const [mktFilter, setMktFilter] = useState<'VENCIDO' | 'ATIVO' | 'INATIVO' | 'TODOS'>('VENCIDO');
  const [mktSubject, setMktSubject] = useState('Aviso Importante sobre sua Assinatura IPTV/P2P - {nome}');
  const [mktTemplate, setMktTemplate] = useState(
    `Olá {nome},\n\nSua assinatura de IPTV/P2P ({app}) encontra-se com o vencimento em {vencimento}.\n\nValor para renovação: R$ {valor}.\n\nPara efetuar o pagamento via PIX ou cartão, responda a esta mensagem ou solicite a chave PIX.\n\nAtenciosamente,\nEquipe de Suporte IPTV & P2P`
  );

  // Selected Email Provider Tutorial Tab
  const [tutorialProvider, setTutorialProvider] = useState<'GMAIL' | 'OUTLOOK' | 'CPANEL'>('GMAIL');

  // Logs History Filter & Action State
  const [logSearchText, setLogSearchText] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'TODOS' | 'SUCESSO' | 'ERRO'>('TODOS');
  const [logTypeFilter, setLogTypeFilter] = useState<'TODOS' | 'TEST' | 'BACKUP' | 'MARKETING'>('TODOS');
  const [clearingLogs, setClearingLogs] = useState(false);

  const handleClearLogs = async () => {
    if (!window.confirm('Tem certeza que deseja limpar todo o histórico de envios por e-mail?')) return;
    setClearingLogs(true);
    try {
      const res = await fetch('/api/email/logs/clear', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setLogs([]);
        setStatusMsg({ type: 'success', text: 'Histórico de envios por e-mail limpo com sucesso.' });
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Erro ao limpar histórico.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Erro ao conectar ao servidor para limpar histórico.' });
    } finally {
      setClearingLogs(false);
    }
  };

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/email/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.settings) {
          setSettings({
            ...json.settings,
            smtpPass: json.settings.smtpPassMasked || ''
          });
          setTestTargetEmail(json.settings.backupRecipientEmail || json.settings.smtpUser || '');
        }
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.error('Error loading email settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const applyProviderPreset = (providerKey: string) => {
    if (providerKey === 'GMAIL') {
      setSettings(prev => ({
        ...prev,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        secure: false
      }));
      setTutorialProvider('GMAIL');
      setStatusMsg({ type: 'success', text: '⚡ Preenchido para Gmail (smtp.gmail.com:587). Insira sua Senha de Aplicativo abaixo.' });
    } else if (providerKey === 'OUTLOOK') {
      setSettings(prev => ({
        ...prev,
        smtpHost: 'smtp-mail.outlook.com',
        smtpPort: 587,
        secure: false
      }));
      setTutorialProvider('OUTLOOK');
      setStatusMsg({ type: 'success', text: '⚡ Preenchido para Outlook/Hotmail (smtp-mail.outlook.com:587).' });
    } else if (providerKey === 'YAHOO') {
      setSettings(prev => ({
        ...prev,
        smtpHost: 'smtp.mail.yahoo.com',
        smtpPort: 587,
        secure: false
      }));
      setStatusMsg({ type: 'success', text: '⚡ Preenchido para Yahoo Mail (smtp.mail.yahoo.com:587).' });
    } else if (providerKey === 'BREVO') {
      setSettings(prev => ({
        ...prev,
        smtpHost: 'smtp-relay.brevo.com',
        smtpPort: 587,
        secure: false
      }));
      setStatusMsg({ type: 'success', text: '⚡ Preenchido para Brevo / Sendinblue (smtp-relay.brevo.com:587).' });
    } else if (providerKey === 'SENDGRID') {
      setSettings(prev => ({
        ...prev,
        smtpHost: 'smtp.sendgrid.net',
        smtpPort: 587,
        secure: false
      }));
      setStatusMsg({ type: 'success', text: '⚡ Preenchido para SendGrid (smtp.sendgrid.net:587).' });
    } else if (providerKey === 'MAILGUN') {
      setSettings(prev => ({
        ...prev,
        smtpHost: 'smtp.mailgun.org',
        smtpPort: 587,
        secure: false
      }));
      setStatusMsg({ type: 'success', text: '⚡ Preenchido para Mailgun (smtp.mailgun.org:587).' });
    } else if (providerKey === 'CPANEL') {
      setSettings(prev => ({
        ...prev,
        smtpHost: prev.smtpHost.includes('gmail') || prev.smtpHost.includes('outlook') ? 'mail.seu-dominio.com' : prev.smtpHost,
        smtpPort: 465,
        secure: true
      }));
      setTutorialProvider('CPANEL');
      setStatusMsg({ type: 'success', text: '⚡ Preenchido para cPanel / Titan / Domínio Próprio (Porta 465 - SSL/TLS).' });
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      setSavingSettings(false);
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Configurações SMTP e Backup salvas com sucesso!' });
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Erro ao salvar configurações.' });
      }
    } catch (err: any) {
      setSavingSettings(false);
      setStatusMsg({ type: 'error', text: 'Falha na conexão: ' + err.message });
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setStatusMsg(null);
    try {
      const target = testTargetEmail.trim() || settings.backupRecipientEmail || settings.smtpUser;
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          settings,
          targetEmail: target
        })
      });
      const json = await res.json();
      setTestingSmtp(false);
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `✅ Conexão SMTP Testada com Sucesso! E-mail de confirmação enviado para ${target}.` });
        fetchEmailSettings();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Falha ao testar conexão SMTP.' });
      }
    } catch (err: any) {
      setTestingSmtp(false);
      setStatusMsg({ type: 'error', text: 'Erro no teste SMTP: ' + err.message });
    }
  };

  const handleSendBackupNow = async () => {
    setSendingBackup(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/email/send-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: settings.backupRecipientEmail })
      });
      const json = await res.json();
      setSendingBackup(false);
      if (res.ok) {
        setStatusMsg({ 
          type: 'success', 
          text: `📦 Backup da planilha gerado e enviado por e-mail para ${settings.backupRecipientEmail || settings.smtpUser}!` 
        });
        fetchEmailSettings();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Falha ao enviar backup por e-mail.' });
      }
    } catch (err: any) {
      setSendingBackup(false);
      setStatusMsg({ type: 'error', text: 'Erro no envio do backup: ' + err.message });
    }
  };

  const handleTriggerAutoBackupNow = async () => {
    setTestingAutoBackup(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/email/trigger-auto-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      setTestingAutoBackup(false);
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: `⏰ ${json.message || 'Backup automático testado e enviado por e-mail com sucesso!'}`
        });
        fetchEmailSettings();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Falha ao testar rotina de backup automático.' });
      }
    } catch (err: any) {
      setTestingAutoBackup(false);
      setStatusMsg({ type: 'error', text: 'Erro na execução do backup automático: ' + err.message });
    }
  };

  const handleSendMarketing = async () => {
    setSendingMarketing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/email/send-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetFilter: mktFilter,
          subject: mktSubject,
          messageTemplate: mktTemplate
        })
      });
      const json = await res.json();
      setSendingMarketing(false);
      if (res.ok) {
        setStatusMsg({ 
          type: 'success', 
          text: `🚀 Sucesso! Disparo concluído para ${json.sentCount} clientes (${json.failedCount} falhas).` 
        });
        fetchEmailSettings();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Erro ao realizar disparo.' });
      }
    } catch (err: any) {
      setSendingMarketing(false);
      setStatusMsg({ type: 'error', text: 'Erro de comunicação: ' + err.message });
    }
  };

  const setQuickPreset = (type: 'OVERDUE' | 'REACTIVATE' | 'PREVENTIVE') => {
    if (type === 'OVERDUE') {
      setMktFilter('VENCIDO');
      setMktSubject('⚠️ Aviso de Vencimento - Renovação da Assinatura IPTV/P2P ({nome})');
      setMktTemplate(
        `Olá {nome}!\n\nIdentificamos que sua assinatura de IPTV/P2P ({app}) venceu em {vencimento}.\n\nValor da Mensalidade: R$ {valor}.\n\nPara não perder o acesso aos canais, filmes e séries, efetue a renovação solicitando a chave PIX em resposta a este e-mail.\n\nObrigado por utilizar nossos serviços!`
      );
    } else if (type === 'REACTIVATE') {
      setMktFilter('INATIVO');
      setMktSubject('🎁 Oferta Especial de Retorno para você, {nome}!');
      setMktTemplate(
        `Olá {nome}!\n\nSentimos sua falta! Que tal retornar para a melhor lista de canais IPTV e P2P com alta qualidade e sem travamentos?\n\nPrepararmos um desconto exclusivo de reativação para seu aplicativo ({app}).\n\nResponda a este e-mail agora para resgatar sua oferta especial!\n\nAtenciosamente,\nEquipe IPTV & P2P Pro`
      );
    } else if (type === 'PREVENTIVE') {
      setMktFilter('ATIVO');
      setMktSubject('💡 Lembrete Preventivo de Renovação - {nome}');
      setMktTemplate(
        `Olá {nome}!\n\nEste é um lembrete preventivo: sua assinatura IPTV/P2P ({app}) vencerá em {vencimento}.\n\nGaranta a renovação antecipada por R$ {valor} para continuar assistindo sem interrupção de sinal.\n\nDúvidas ou renovações via PIX, basta responder esta mensagem!\n\nUm grande abraço.`
      );
    }
  };

  if (loadingSettings) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-2">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
        <p className="text-xs">Carregando módulo de e-mail e backups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Central de E-mail Marketing & Backups de Planilha
              </h2>
              <p className="text-slate-500 text-xs">
                Configure seu servidor SMTP, envie e-mails de cobrança e receba backups de planilhas no seu e-mail.
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('CONFIG')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'CONFIG'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configuração SMTP</span>
            </button>

            <button
              onClick={() => setActiveSubTab('AUTO_BACKUP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'AUTO_BACKUP'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Frequência & Backup Automático</span>
            </button>

            <button
              onClick={() => setActiveSubTab('BACKUP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'BACKUP'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Backup Manual</span>
            </button>

            <button
              onClick={() => setActiveSubTab('MARKETING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'MARKETING'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Disparar E-mails</span>
            </button>

            <button
              onClick={() => setActiveSubTab('LOGS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeSubTab === 'LOGS'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico ({logs.length})</span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {statusMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* SUB TAB 1: SMTP CONFIGURATION & APP PASSWORD GUIDE */}
      {activeSubTab === 'CONFIG' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* SMTP Form Card */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            
            {/* SMTP Status Header & Indicator */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Credenciais do Servidor SMTP
                </h3>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-1.5">
                {settings.smtpUser && settings.smtpHost && settings.smtpPass ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Configurado ({settings.smtpHost})</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pendente de Configuração</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Provider Presets */}
            <div className="space-y-1.5">
              <label className="block text-slate-600 dark:text-slate-400 font-semibold text-[11px] flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span>Preenchimento Rápido por Provedor:</span>
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => applyProviderPreset('GMAIL')}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-1"
                >
                  <Globe className="w-3 h-3 text-red-500" />
                  <span>Gmail</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyProviderPreset('OUTLOOK')}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-1"
                >
                  <Globe className="w-3 h-3 text-sky-500" />
                  <span>Outlook/Hotmail</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyProviderPreset('YAHOO')}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-1"
                >
                  <span>Yahoo</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyProviderPreset('BREVO')}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-1"
                >
                  <span>Brevo</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyProviderPreset('SENDGRID')}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-1"
                >
                  <span>SendGrid</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyProviderPreset('CPANEL')}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-center gap-1"
                >
                  <Server className="w-3 h-3 text-emerald-500" />
                  <span>cPanel / Domínio Próprio</span>
                </button>
              </div>
            </div>

            {/* Main SMTP Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Servidor SMTP (Host):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                  />
                  <Server className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Porta SMTP:
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                    placeholder="587 ou 465"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, smtpPort: 587, secure: false })}
                      className={`px-1.5 py-1 text-[10px] font-bold rounded border ${
                        settings.smtpPort === 587 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      587
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, smtpPort: 465, secure: true })}
                      className={`px-1.5 py-1 text-[10px] font-bold rounded border ${
                        settings.smtpPort === 465 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      465
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Seu E-mail (Usuário SMTP):
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value, senderEmail: e.target.value })}
                    placeholder="suaempresa@gmail.com"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span>Senha / Senha de Aplicativo:</span>
                  <Key className="w-3.5 h-3.5 text-indigo-500" />
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={settings.smtpPass}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                    placeholder="•••• •••• •••• ••••"
                    className="w-full pl-8 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-mono"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Nome do Remetente (Exibição):
                </label>
                <input
                  type="text"
                  value={settings.senderName}
                  onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                  placeholder="Atendimento IPTV & P2P Pro"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  E-mail do Remetente:
                </label>
                <input
                  type="email"
                  value={settings.senderEmail}
                  onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                  placeholder="atendimento@suaempresa.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  E-mail Destino dos Backups:
                </label>
                <input
                  type="email"
                  value={settings.backupRecipientEmail}
                  onChange={(e) => setSettings({ ...settings, backupRecipientEmail: e.target.value })}
                  placeholder="admin@suaempresa.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Backup Automático de Planilha:</span>
                </label>
                <select
                  value={settings.autoBackupSchedule || 'DISABLED'}
                  onChange={(e) => setSettings({ ...settings, autoBackupSchedule: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                >
                  <option value="DISABLED">Desativado (Somente envio manual)</option>
                  <option value="DAILY">Diário (Envio automático todos os dias)</option>
                  <option value="WEEKLY">Semanal (Envio todas as segundas-feiras)</option>
                  <option value="MONTHLY">Mensal (Envio no dia 1º de cada mês)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.secure}
                  onChange={(e) => setSettings({ ...settings, secure: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Usar Conexão Segura SSL/TLS direta (Porta 465)</span>
              </label>
            </div>

            {/* Test Email Recipient Input & Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex-1 w-full">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    E-mail Destino do Teste SMTP:
                  </label>
                  <input
                    type="email"
                    value={testTargetEmail}
                    onChange={(e) => setTestTargetEmail(e.target.value)}
                    placeholder="digite-seu-email@gmail.com"
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto pt-1 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                    className="w-full sm:w-auto px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-lg text-xs border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {testingSmtp ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                    <span>{testingSmtp ? 'Testando...' : 'Testar SMTP Agora'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs border border-indigo-500 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{savingSettings ? 'Salvando...' : 'Salvar Configurações'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tutorial Guide Card */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Tutorial: Como Gerar a Senha de App
                </h3>
              </div>
            </div>

            {/* Provider Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
              <button
                onClick={() => setTutorialProvider('GMAIL')}
                className={`flex-1 py-1 rounded font-bold transition-all ${
                  tutorialProvider === 'GMAIL' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Gmail / Google
              </button>
              <button
                onClick={() => setTutorialProvider('OUTLOOK')}
                className={`flex-1 py-1 rounded font-bold transition-all ${
                  tutorialProvider === 'OUTLOOK' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Outlook / Hotmail
              </button>
              <button
                onClick={() => setTutorialProvider('CPANEL')}
                className={`flex-1 py-1 rounded font-bold transition-all ${
                  tutorialProvider === 'CPANEL' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                cPanel / Titan
              </button>
            </div>

            {/* Steps according to provider */}
            {tutorialProvider === 'GMAIL' && (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Passos para gerar no Gmail (smtp.gmail.com | Porta 587):
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                  <li>
                    Acesse sua conta Google no site <strong className="text-indigo-600 dark:text-indigo-400">myaccount.google.com</strong>.
                  </li>
                  <li>
                    Acesse o menu <strong className="text-slate-800 dark:text-slate-200">Segurança</strong> e ative a <strong>Verificação em 2 Etapas</strong>.
                  </li>
                  <li>
                    Na barra de pesquisa da Conta Google, pesquise por <strong className="text-indigo-600 dark:text-indigo-400">"Senhas de app"</strong>.
                  </li>
                  <li>
                    Digite um nome para o app (ex: <em>IPTV Pro Management</em>) e clique em <strong>Criar</strong>.
                  </li>
                  <li>
                    O Google exibirá um código de <strong>16 letras amarelas/azuis</strong>.
                  </li>
                  <li>
                    Cole esse código de 16 letras no campo <strong>"Senha de Aplicativo"</strong> no formulário ao lado e clique em Salvar.
                  </li>
                </ol>

                <div className="pt-2">
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                  >
                    <span>Abrir Google Senhas de App</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {tutorialProvider === 'OUTLOOK' && (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Passos no Outlook / Hotmail (smtp-mail.outlook.com | Porta 587):
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                  <li>
                    Acesse <strong className="text-indigo-600 dark:text-indigo-400">account.microsoft.com/security</strong>.
                  </li>
                  <li>
                    Clique em <strong>Opções de segurança avançadas</strong>.
                  </li>
                  <li>
                    Procure por <strong>Senhas de aplicativo</strong> e clique em <strong>Criar uma nova senha de aplicativo</strong>.
                  </li>
                  <li>
                    Copie a senha de 16 caracteres gerada pela Microsoft e cole no formulário do sistema.
                  </li>
                </ol>
              </div>
            )}

            {tutorialProvider === 'CPANEL' && (
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  E-mail de Domínio Próprio / cPanel / Titan:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                  <li>
                    <strong>Servidor Host:</strong> Insira <code>mail.seudominio.com</code> ou <code>smtp.titan.email</code>.
                  </li>
                  <li>
                    <strong>Porta:</strong> Use <code>465</code> (marcando a caixa SSL) ou <code>587</code>.
                  </li>
                  <li>
                    <strong>Usuário & Senha:</strong> Utilize o e-mail completo do seu domínio e a senha padrão da caixa de entrada.
                  </li>
                </ol>
              </div>
            )}

            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1 font-bold">
                <HelpCircle className="w-3.5 h-3.5" /> Dica de Segurança Importante:
              </div>
              <p>
                Nunca coloque sua senha pessoal do e-mail. Utilize sempre uma <strong>Senha de Aplicativo (App Password)</strong> gerada especificamente para envios automáticos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB: AUTO_BACKUP - FREQUÊNCIA E BACKUP AUTOMÁTICO DO BANCO DE DADOS */}
      {activeSubTab === 'AUTO_BACKUP' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          {/* Header & Status Overview */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  Gestão de Frequência & Backup Automático por E-mail
                </h3>
                <p className="text-slate-500 text-xs">
                  Agende envios periódicos automáticos do banco de dados (clientes, vencimentos e financeiro) para seu e-mail.
                </p>
              </div>
            </div>

            {/* Quick Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                settings.autoBackupSchedule !== 'DISABLED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}>
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {settings.autoBackupSchedule === 'DAILY' ? 'Frequência: Diária' :
                   settings.autoBackupSchedule === 'WEEKLY' ? 'Frequência: Semanal' :
                   settings.autoBackupSchedule === 'MONTHLY' ? 'Frequência: Mensal' : 'Automação Desativada'}
                </span>
              </span>

              {settings.autoBackupSchedule !== 'DISABLED' && (
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Horário: {settings.backupTime || '08:00'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
                <span>Status do Agendamento</span>
                <Database className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                {settings.autoBackupSchedule === 'DISABLED' ? (
                  <span className="text-amber-600 dark:text-amber-400">Pausado / Manual</span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ativo ({settings.autoBackupSchedule})
                  </span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
                <span>Próximo Envio Programado</span>
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">
                {settings.autoBackupSchedule === 'DISABLED' 
                  ? 'Nenhum envio previsto' 
                  : settings.nextBackupScheduledAt 
                    ? new Date(settings.nextBackupScheduledAt).toLocaleString('pt-BR') 
                    : `Amanhã às ${settings.backupTime || '08:00'}`}
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
              <div className="text-slate-500 text-xs font-semibold flex items-center justify-between">
                <span>Último Backup Enviado</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                {settings.lastBackupSentAt 
                  ? new Date(settings.lastBackupSentAt).toLocaleString('pt-BR') 
                  : 'Nenhum registro ainda'}
              </div>
            </div>
          </div>

          {/* Form & Actions Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Auto Backup Configuration Form */}
            <div className="lg:col-span-7 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <Settings className="w-4 h-4 text-indigo-500" /> Regras de Frequência e Destino
              </h4>

              {/* Frequência Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1.5">
                  Frequência de Envio Automático:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'DISABLED', label: 'Desativado', desc: 'Apenas manual' },
                    { id: 'DAILY', label: 'Diário', desc: 'Todos os dias' },
                    { id: 'WEEKLY', label: 'Semanal', desc: 'Toda 2ª feira' },
                    { id: 'MONTHLY', label: 'Mensal', desc: 'Dia 1º do mês' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSettings({ ...settings, autoBackupSchedule: item.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        settings.autoBackupSchedule === item.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{item.label}</div>
                      <div className={`text-[10px] ${settings.autoBackupSchedule === item.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Horário & Formato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Horário do Disparo:
                  </label>
                  <input
                    type="time"
                    value={settings.backupTime || '08:00'}
                    onChange={(e) => setSettings({ ...settings, backupTime: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Fuso horário do servidor (BRT)</span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" /> Formato dos Anexos:
                  </label>
                  <select
                    value={settings.backupFormat || 'XLSX'}
                    onChange={(e) => setSettings({ ...settings, backupFormat: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="XLSX">📊 Planilha Excel (.xlsx)</option>
                    <option value="JSON">💾 Dump JSON do Banco (.json)</option>
                    <option value="BOTH">📦 Ambos (.xlsx + .json)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Defina quais arquivos anexar</span>
                </div>
              </div>

              {/* E-mails Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" /> E-mail Destino Principal:
                  </label>
                  <input
                    type="email"
                    value={settings.backupRecipientEmail}
                    onChange={(e) => setSettings({ ...settings, backupRecipientEmail: e.target.value })}
                    placeholder="seu-email@dominio.com"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1 flex items-center gap-1">
                    <Copy className="w-3.5 h-3.5 text-slate-400" /> E-mail em Cópia (CC):
                  </label>
                  <input
                    type="email"
                    value={settings.backupCcEmail || ''}
                    onChange={(e) => setSettings({ ...settings, backupCcEmail: e.target.value })}
                    placeholder="copia-seguranca@dominio.com (opcional)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full sm:flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs border border-indigo-500 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  {savingSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{savingSettings ? 'Salvando Frequência...' : 'Salvar Regras de Automação'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerAutoBackupNow}
                  disabled={testingAutoBackup}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs border border-emerald-500 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  title="Executa o disparo do backup agora mesmo conforme os parâmetros salvos"
                >
                  {testingAutoBackup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>{testingAutoBackup ? 'Testando Disparo...' : '⚡ Testar Disparo Automático Agora'}</span>
                </button>
              </div>
            </div>

            {/* Info & Workflow Guide */}
            <div className="lg:col-span-5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700/60 pb-2">
                <Sparkles className="w-4 h-4 text-emerald-500" /> Como Funciona o Motor de Automação
              </h4>

              <div className="space-y-2.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Verificação Periódica</p>
                    <p className="text-[11px] text-slate-500">O servidor monitora o horário configurado e compara com a data do último envio.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Empacotamento e Anexo</p>
                    <p className="text-[11px] text-slate-500">Gera arquivos atualizados contendo todos os clientes, vencimentos e histórico financeiro.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Envio Seguro SMTP</p>
                    <p className="text-[11px] text-slate-500">Dispara a mensagem diretamente para seu e-mail configurado com confirmação e resumo visual.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1">
                <p className="font-bold text-indigo-900 dark:text-indigo-300 text-xs flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Proteção de Dados e Backup Seguro
                </p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-relaxed">
                  Seus arquivos de backup podem ser usados para restauração instantânea do banco de dados em qualquer emergência ou troca de servidor.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: EXCEL SPREADSHEET BACKUP TO EMAIL */}
      {activeSubTab === 'BACKUP' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Envio e Backup de Planilha Excel por E-mail
                </h3>
                <p className="text-slate-500 text-xs">
                  Gere a planilha oficial <code>.xlsx</code> de todos os seus clientes e receba diretamente na sua caixa de e-mail.
                </p>
              </div>
            </div>

            {settings.lastBackupSentAt && (
              <div className="text-right text-[11px]">
                <span className="text-slate-400 block">Último backup enviado em:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {new Date(settings.lastBackupSentAt).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Enviar Backup Instantâneo:
              </h4>
              <p className="text-slate-500 text-xs">
                O servidor criará um arquivo <strong>.xlsx (Excel)</strong> com todas as colunas de clientes (Nome, Vencimento, Valor, WhatsApp, Aplicativo) e despesas e enviará em anexo.
              </p>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                  Enviar para o E-mail:
                </label>
                <input
                  type="email"
                  value={settings.backupRecipientEmail}
                  onChange={(e) => setSettings({ ...settings, backupRecipientEmail: e.target.value })}
                  placeholder="seuemail@dominio.com"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSendBackupNow}
                disabled={sendingBackup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs border border-emerald-500 flex items-center justify-center gap-2 shadow-2xs transition-all"
              >
                {sendingBackup ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                <span>{sendingBackup ? 'Gerando e Enviando Backup...' : '📦 Enviar Backup Atual por E-mail Agora'}</span>
              </button>
            </div>

            {/* Structure info box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-500" /> Estrutura do Anexo da Planilha:
              </h4>
              <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Aba 1 (Clientes IPTV/P2P):</strong> Mapeamento completo com Colunas A a H.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Aba 2 (Despesas e Custos):</strong> Registro financeiro do servidor e aplicativo.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>Corpo em HTML:</strong> Resumo com total de ativos, vencidos e faturamento estimado.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 3: MARKETING & NOTICE EMAIL BULK DISPATCH */}
      {activeSubTab === 'MARKETING' && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-500" /> Disparo de E-mails Marketing & Avisos
              </h3>
              <p className="text-slate-500 text-xs">
                Envie notificações de renovação, cobrança ou promoções em massa usando sua conta SMTP.
              </p>
            </div>

            {/* Quick Template Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold">Modelos Prontos:</span>
              <button
                type="button"
                onClick={() => setQuickPreset('OVERDUE')}
                className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-semibold border border-indigo-200 dark:border-indigo-800"
              >
                Cobrança Vencidos
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset('REACTIVATE')}
                className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800"
              >
                Promo Inativos
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset('PREVENTIVE')}
                className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-lg text-[11px] font-semibold border border-amber-200 dark:border-amber-800"
              >
                Lembrete Preventivo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
            {/* Form Fields */}
            <div className="lg:col-span-8 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Público Alvo / Destinatários:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setMktFilter('VENCIDO')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      mktFilter === 'VENCIDO'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Clientes Vencidos
                  </button>

                  <button
                    type="button"
                    onClick={() => setMktFilter('ATIVO')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      mktFilter === 'ATIVO'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Clientes Ativos
                  </button>

                  <button
                    type="button"
                    onClick={() => setMktFilter('INATIVO')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      mktFilter === 'INATIVO'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Inativos/Bloqueados
                  </button>

                  <button
                    type="button"
                    onClick={() => setMktFilter('TODOS')}
                    className={`py-2 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      mktFilter === 'TODOS'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Toda a Base
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assunto do E-mail:
                </label>
                <input
                  type="text"
                  value={mktSubject}
                  onChange={(e) => setMktSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corpo do E-mail (Suporta Tags Dinâmicas):
                </label>
                <textarea
                  rows={8}
                  value={mktTemplate}
                  onChange={(e) => setMktTemplate(e.target.value)}
                  className="w-full p-3 font-sans text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSendMarketing}
                  disabled={sendingMarketing}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs border border-indigo-500 flex items-center justify-center gap-2 shadow-2xs transition-all"
                >
                  {sendingMarketing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{sendingMarketing ? 'Enviando E-mails...' : `🚀 Disparar E-mails para o Público ${mktFilter}`}</span>
                </button>
              </div>
            </div>

            {/* Variable Tags Legend Card */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" /> Variaveis para Personalizar:
              </h4>

              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <code className="text-indigo-600 dark:text-indigo-400 font-bold block">{`{nome}`}</code>
                  <span className="text-slate-500">Nome do Cliente registrado</span>
                </div>

                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <code className="text-indigo-600 dark:text-indigo-400 font-bold block">{`{vencimento}`}</code>
                  <span className="text-slate-500">Data de vencimento (DD/MM/YYYY)</span>
                </div>

                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <code className="text-indigo-600 dark:text-indigo-400 font-bold block">{`{valor}`}</code>
                  <span className="text-slate-500">Valor da assinatura (R$)</span>
                </div>

                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <code className="text-indigo-600 dark:text-indigo-400 font-bold block">{`{app}`}</code>
                  <span className="text-slate-500">Aplicativo usado (XCIPTV, IBO, etc.)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 4: DISPATCH LOGS PANEL */}
      {activeSubTab === 'LOGS' && (() => {
        const totalDisparos = logs.length;
        const sucessosCount = logs.filter(l => l.status === 'SUCESSO').length;
        const errosCount = logs.filter(l => l.status === 'ERRO').length;
        const ultimoEnvio = logs[0]?.timestamp 
          ? new Date(logs[0].timestamp).toLocaleString('pt-BR') 
          : 'Nenhum disparo';

        const filteredLogs = logs.filter(log => {
          const q = logSearchText.trim().toLowerCase();
          const matchesSearch = !q || 
            log.recipient.toLowerCase().includes(q) || 
            (log.subject && log.subject.toLowerCase().includes(q));
          const matchesStatus = logStatusFilter === 'TODOS' || log.status === logStatusFilter;
          const matchesType = logTypeFilter === 'TODOS' || log.type === logTypeFilter;

          return matchesSearch && matchesStatus && matchesType;
        });

        return (
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" /> Painel de Histórico de Envios SMTP
                </h3>
                <p className="text-slate-500 text-xs">
                  Acompanhe em tempo real o status, data/hora e destinatários de cada e-mail disparado pelo servidor.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={fetchEmailSettings}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  title="Atualizar lista de disparos"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Atualizar</span>
                </button>

                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    disabled={clearingLogs}
                    className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 font-medium text-xs rounded-lg border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-1.5 transition-colors"
                    title="Limpar histórico"
                  >
                    {clearingLogs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Limpar Histórico</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
                  <span>Total Registrado</span>
                  <Mail className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {totalDisparos} <span className="text-[10px] font-normal text-slate-400">envios</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
                  <span>Envios com Sucesso</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-base font-bold text-emerald-800 dark:text-emerald-200">
                  {sucessosCount} <span className="text-[10px] font-normal opacity-80">({totalDisparos > 0 ? Math.round((sucessosCount / totalDisparos) * 100) : 0}%)</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/60 space-y-1">
                <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-[11px] font-medium">
                  <span>Falhas / Erros</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="text-base font-bold text-rose-800 dark:text-rose-200">
                  {errosCount} <span className="text-[10px] font-normal opacity-80">({totalDisparos > 0 ? Math.round((errosCount / totalDisparos) * 100) : 0}%)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
                  <span>Último Disparo</span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200 truncate" title={ultimoEnvio}>
                  {ultimoEnvio}
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-xs">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={logSearchText}
                  onChange={(e) => setLogSearchText(e.target.value)}
                  placeholder="Filtrar por e-mail destinatário ou assunto..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {logSearchText && (
                  <button
                    onClick={() => setLogSearchText('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status Filter Toggle */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <Filter className="w-3 h-3 text-indigo-500" /> Status:
                </span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setLogStatusFilter('TODOS')}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                      logStatusFilter === 'TODOS'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogStatusFilter('SUCESSO')}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                      logStatusFilter === 'SUCESSO'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Sucesso
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogStatusFilter('ERRO')}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                      logStatusFilter === 'ERRO'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Erro
                  </button>
                </div>

                {/* Type Filter Dropdown */}
                <select
                  value={logTypeFilter}
                  onChange={(e) => setLogTypeFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="TODOS">Todos os Tipos</option>
                  <option value="TEST">Teste SMTP</option>
                  <option value="BACKUP">Backup Excel</option>
                  <option value="MARKETING">Marketing / Avisos</option>
                </select>
              </div>
            </div>

            {/* Results Count Banner */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
              <span>
                Exibindo <strong>{filteredLogs.length}</strong> de <strong>{logs.length}</strong> disparos gravados
              </span>
              {(logSearchText || logStatusFilter !== 'TODOS' || logTypeFilter !== 'TODOS') && (
                <button
                  type="button"
                  onClick={() => {
                    setLogSearchText('');
                    setLogStatusFilter('TODOS');
                    setLogTypeFilter('TODOS');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                >
                  Limpar Filtros
                </button>
              )}
            </div>

            {/* Logs List Container */}
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <Mail className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
                <p>Nenhum registro de e-mail encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[420px] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                      <th className="p-2.5">Data / Hora</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5">Destinatário</th>
                      <th className="p-2.5">Assunto</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sans text-xs">
                    {filteredLogs.map((log) => {
                      const logDate = new Date(log.timestamp);
                      const formattedDate = isNaN(logDate.getTime()) 
                        ? log.timestamp 
                        : logDate.toLocaleString('pt-BR');

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-2.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              log.type === 'BACKUP' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
                              log.type === 'TEST' ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' :
                              'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                            }`}>
                              {log.type === 'TEST' ? 'TESTE SMTP' : log.type === 'BACKUP' ? 'BACKUP EXCEL' : 'MARKETING'}
                            </span>
                          </td>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px] sm:max-w-[300px]" title={log.recipient}>
                                {log.recipient}
                              </span>
                            </div>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400">
                            <span className="truncate max-w-[220px] block" title={log.subject}>
                              {log.subject || 'Sem assunto'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            {log.status === 'SUCESSO' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>Sucesso</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-800">
                                <XCircle className="w-3 h-3 text-rose-500" />
                                <span>Erro</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};
