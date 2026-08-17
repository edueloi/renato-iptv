import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, Edit2, Trash2, Copy, Check, Send, 
  Sparkles, Filter, Bot, ExternalLink, RefreshCw, AlertCircle, 
  CheckCircle2, UserCheck, DollarSign, FileText, HelpCircle, Layers
} from 'lucide-react';
import { Client, MessageTemplate } from '../types';
import { formatPhoneBR, getFirstName } from '../utils/masks';
import { ConfirmModal } from './ConfirmModal';

interface MessageTemplatesCenterProps {
  clients?: Client[];
  onRefreshClients?: () => void;
}

export const MessageTemplatesCenter: React.FC<MessageTemplatesCenterProps> = ({
  clients = [],
  onRefreshClients
}) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected for Direct Send
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customPix, setCustomPix] = useState<string>('suachavepix@email.com');
  const [customText, setCustomText] = useState<string>('');

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sendingBot, setSendingBot] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Template Modal Form (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // When selectedClientId or selectedTemplateId changes, update the rendered preview
  useEffect(() => {
    if (selectedTemplateId) {
      const tpl = templates.find(t => t.id === selectedTemplateId);
      if (tpl) {
        setCustomText(tpl.content);
      }
    }
  }, [selectedTemplateId, templates]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates || []);
        if (json.templates && json.templates.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(json.templates[0].id);
          setCustomText(json.templates[0].content);
        }
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate?.title || !editingTemplate?.content) {
      setStatusMsg({ type: 'error', text: 'Informe o título e o texto da mensagem.' });
      return;
    }

    setSavingTemplate(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTemplate)
      });
      const json = await res.json();
      setSavingTemplate(false);
      if (res.ok) {
        setTemplates(json.templates || []);
        setIsModalOpen(false);
        setEditingTemplate(null);
        setStatusMsg({ type: 'success', text: 'Modelo de mensagem salvo com sucesso!' });
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Erro ao salvar modelo.' });
      }
    } catch (err: any) {
      setSavingTemplate(false);
      setStatusMsg({ type: 'error', text: 'Erro de comunicação: ' + err.message });
    }
  };

  const executeDeleteTemplate = async () => {
    if (!deleteTemplateId) return;

    try {
      const res = await fetch(`/api/templates/${deleteTemplateId}`, { method: 'DELETE' });
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.templates || []);
        if (selectedTemplateId === deleteTemplateId) {
          setSelectedTemplateId('');
          setCustomText('');
        }
        setStatusMsg({ type: 'success', text: 'Modelo de mensagem removido.' });
      }
    } catch (err) {
      console.error('Error deleting template:', err);
    } finally {
      setDeleteTemplateId(null);
    }
  };

  // Replace tags helper
  const renderMessageForClient = (rawText: string, client?: Client) => {
    if (!client) return rawText;

    const formattedDueDate = client.dueDate ? client.dueDate.split('-').reverse().join('/') : 'DD/MM/YYYY';
    const formattedValue = client.value ? client.value.toFixed(2) : '0.00';

    return rawText
      .replace(/{nome}/g, getFirstName(client.username))
      .replace(/{vencimento}/g, formattedDueDate)
      .replace(/{valor}/g, formattedValue)
      .replace(/{app}/g, client.appUsed || 'XCIPTV')
      .replace(/{usuario}/g, client.username)
      .replace(/{senha}/g, '****')
      .replace(/{pix}/g, customPix || 'suachavepix@email.com')
      .replace(/{status}/g, client.status);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const finalRenderedText = renderMessageForClient(customText, selectedClient);

  // Open WhatsApp Link
  const handleOpenWhatsApp = () => {
    if (!selectedClient || !selectedClient.contact) {
      setStatusMsg({ type: 'error', text: 'Selecione um cliente cadastrado com número de WhatsApp.' });
      return;
    }

    const cleanPhone = selectedClient.contact.replace(/\D/g, '');
    if (!cleanPhone) {
      setStatusMsg({ type: 'error', text: 'Número de telefone do cliente é inválido.' });
      return;
    }

    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
    const encodedText = encodeURIComponent(finalRenderedText);
    const waUrl = `https://wa.me/${fullPhone}?text=${encodedText}`;

    window.open(waUrl, '_blank');
    setStatusMsg({ type: 'success', text: `Conexão direcionada para o WhatsApp de ${selectedClient.username}!` });
  };

  // Trigger Bot Dispatch
  const handleTriggerBotSend = async () => {
    if (!selectedClient) {
      setStatusMsg({ type: 'error', text: 'Selecione um cliente para disparar o bot.' });
      return;
    }

    setSendingBot(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/bot/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          templateContent: customText,
          customPix
        })
      });
      const json = await res.json();
      setSendingBot(false);
      if (res.ok) {
        setStatusMsg({ 
          type: 'success', 
          text: `🤖 Disparo concluído com sucesso via Bot para ${selectedClient.username}!` 
        });
        if (onRefreshClients) onRefreshClients();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Erro ao disparar mensagem via Bot.' });
      }
    } catch (err: any) {
      setSendingBot(false);
      setStatusMsg({ type: 'error', text: 'Erro de comunicação: ' + err.message });
    }
  };

  const handleCopyText = (text: string, idStr: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idStr);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesCat = categoryFilter === 'TODOS' || t.category === categoryFilter;
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Mensagens Prontas & Envio Direto ao WhatsApp
              </h2>
              <p className="text-slate-500 text-xs">
                Modelos pré-definidos para cobranças, lembretes, envio de PIX e teste grátis com 1 clique no WhatsApp ou Bot.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingTemplate({
                title: '',
                category: 'COBRANCA',
                content: 'Olá {nome}! Sua assinatura ({app}) vence em {vencimento}. Valor: R$ {valor}.'
              });
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Mensagem Pronta</span>
          </button>
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

      {/* QUICK DISPATCH PANEL (TELA DE ENVIO RÁPIDO) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Send className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
            Disparo Rápido: Selecione o Cliente & Modelo
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Controls Column */}
          <div className="md:col-span-5 space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>1. Selecionar Cliente Cadastrado:</span>
                <span className="text-slate-400 font-normal">({clients.length} disponíveis)</span>
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-medium"
              >
                <option value="">-- Selecione o Cliente --</option>
                {clients.map((cli) => (
                  <option key={cli.id} value={cli.id}>
                    {cli.username} ({cli.status}) - Venc: {cli.dueDate ? cli.dueDate.split('-').reverse().join('/') : 'S/D'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                2. Selecionar Modelo de Mensagem Pronta:
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-medium"
              >
                <option value="">-- Selecione um modelo --</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chave PIX (para substituir a tag {'{pix}'}):
              </label>
              <input
                type="text"
                value={customPix}
                onChange={(e) => setCustomPix(e.target.value)}
                placeholder="Ex: financeiro@empresa.com ou celular"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs"
              />
            </div>

            {selectedClient && (
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs space-y-1">
                <p className="font-bold text-indigo-900 dark:text-indigo-200">
                  Dados do Cliente Selecionado:
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>Usuário:</strong> {selectedClient.username} | <strong>Status:</strong> {selectedClient.status}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  <strong>WhatsApp:</strong> {formatPhoneBR(selectedClient.contact)} | <strong>App:</strong> {selectedClient.appUsed || 'XCIPTV'}
                </p>
              </div>
            )}
          </div>

          {/* Preview & Action Column */}
          <div className="md:col-span-7 space-y-3">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center justify-between">
              <span>Pré-visualização e Edição da Mensagem Renderizada:</span>
              <button
                type="button"
                onClick={() => handleCopyText(finalRenderedText, 'preview')}
                className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-bold text-[11px]"
              >
                {copiedId === 'preview' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId === 'preview' ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </label>

            <textarea
              rows={7}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-3 font-sans text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed resize-y"
              placeholder="Digite ou edite a mensagem personalizada..."
            />

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>📱 Abrir no WhatsApp Direct</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerBotSend}
                disabled={sendingBot}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-all"
              >
                {sendingBot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 shrink-0" />}
                <span>🤖 Disparar via Bot do Sistema</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODELOS DE MENSAGENS CATEGORIZADOS (TEMPLATES GALLERY) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
              Galeria de Modelos Prontos ({filteredTemplates.length})
            </h3>
          </div>

          {/* Search and Category Switcher */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none w-full sm:w-40"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none font-semibold text-slate-700 dark:text-slate-200"
            >
              <option value="TODOS">Todas Categorias</option>
              <option value="COBRANCA">Cobrança</option>
              <option value="LEMBRETE">Lembrete Preventivo</option>
              <option value="PIX">Chave PIX</option>
              <option value="DADOS_ACESSO">Dados de Acesso</option>
              <option value="BOAS_VINDAS">Boas-Vindas</option>
              <option value="PROMOCAO">Reativação / Promo</option>
              <option value="SUPORTE">Suporte / Atualização</option>
            </select>
          </div>
        </div>

        {/* Template Cards Grid */}
        {loadingTemplates ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
            <p className="text-xs">Carregando modelos de mensagens...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum modelo de mensagem encontrado para o filtro selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.map((tpl) => (
              <div 
                key={tpl.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  selectedTemplateId === tpl.id 
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600 shadow-2xs' 
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm line-clamp-1">
                      {tpl.title}
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                      {tpl.category}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-xs whitespace-pre-wrap leading-relaxed line-clamp-5 font-sans bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    {tpl.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setCustomText(tpl.content);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 transition-all"
                  >
                    <Send className="w-3 h-3" />
                    <span>Usar Agora</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopyText(tpl.content, tpl.id)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Copiar texto"
                    >
                      {copiedId === tpl.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(tpl);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Editar modelo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {!tpl.isSystemDefault && (
                      <button
                        type="button"
                        onClick={() => setDeleteTemplateId(tpl.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Excluir modelo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {editingTemplate.id ? 'Editar Modelo de Mensagem' : 'Novo Modelo de Mensagem Pronta'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título da Mensagem Pronta:
                </label>
                <input
                  type="text"
                  value={editingTemplate.title || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  placeholder="Ex: Cobrança via PIX com Desconto"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria:
                </label>
                <select
                  value={editingTemplate.category || 'COBRANCA'}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="COBRANCA">Cobrança</option>
                  <option value="LEMBRETE">Lembrete Preventivo</option>
                  <option value="PIX">Chave PIX</option>
                  <option value="DADOS_ACESSO">Dados de Acesso</option>
                  <option value="BOAS_VINDAS">Boas-Vindas</option>
                  <option value="PROMOCAO">Reativação / Promoção</option>
                  <option value="SUPORTE">Suporte / Atualização</option>
                  <option value="OUTROS">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Texto do Modelo (Aceita Tags Automáticas):
                </label>
                <textarea
                  rows={6}
                  value={editingTemplate.content || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  placeholder="Digite o texto da mensagem..."
                  className="w-full p-3 font-sans text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none resize-y"
                />
              </div>

              {/* Tags Legend */}
              <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Tags automáticas disponíveis para usar no texto:
                </p>
                <div className="flex flex-wrap gap-1 font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{`{nome}`}</span>
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{`{vencimento}`}</span>
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{`{valor}`}</span>
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{`{app}`}</span>
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{`{pix}`}</span>
                  <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">{`{usuario}`}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                {savingTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>{savingTemplate ? 'Salvando...' : 'Salvar Modelo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Modal */}
      <ConfirmModal
        isOpen={!!deleteTemplateId}
        title="Excluir Mensagem Pronta"
        message="Tem certeza que deseja excluir esta mensagem pronta? Ela não estará mais disponível para envio automático."
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={executeDeleteTemplate}
        onClose={() => setDeleteTemplateId(null)}
      />
    </div>
  );
};
