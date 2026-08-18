import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { 
  FileSpreadsheet, Upload, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, 
  Clipboard, Trash2, Edit2, Plus, Search, HelpCircle, Check, Sparkles, Filter
} from 'lucide-react';
import { 
  formatDateBR, 
  maskPhoneInput, 
  formatCurrencyBR, 
  maskCurrencyInput, 
  parseCurrencyToNumber 
} from '../utils/masks';

interface SpreadsheetImporterProps {
  onImportSuccess: () => void;
}

interface ParsedClientRow {
  id?: string;
  generalQty: number;
  username: string;
  dueDate: string; // YYYY-MM-DD
  status: string;
  value: number;
  extraField: string;
  contact: string;
  appUsed: string;
  serviceType: string;
}

export const SpreadsheetImporter: React.FC<SpreadsheetImporterProps> = ({
  onImportSuccess
}) => {
  const [importMode, setImportMode] = useState<'FILE' | 'PASTE'>('FILE');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedClientRow[]>([]);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatusMsg(null);
    }
  };

  const handleInsertSampleText = () => {
    const sample = `1	Cliente Exemplo 1	15/08/2026	Ativo	35.00	Servidor 01	11-99782-8585	XCIPTV
2	Cliente Exemplo 2	08/08/2026	Hoje	30.00	P2P Direct	21 99887-7665	IBO PLAYER
3	Cliente Exemplo 3	02/08/2026	Vencido	40.00	Dual Server	31977665544	IPTV SMARTERS PRO`;
    setPastedText(sample);
    setStatusMsg(null);
  };

  const handleParse = async () => {
    if (importMode === 'FILE' && !file) {
      setStatusMsg({ type: 'error', text: 'Selecione um arquivo Excel (.xlsx, .xls ou .csv).' });
      return;
    }
    if (importMode === 'PASTE' && !pastedText.trim()) {
      setStatusMsg({ type: 'error', text: 'Cole as linhas copiadas do Excel na caixa de texto.' });
      return;
    }

    setParsing(true);
    setStatusMsg(null);

    try {
      let payload: any = {};

      if (importMode === 'FILE' && file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          payload = { fileBase64: base64 };
          await sendParseReq(payload);
        };
        reader.readAsDataURL(file);
      } else {
        payload = { pastedText };
        await sendParseReq(payload);
      }
    } catch (err: any) {
      setParsing(false);
      setStatusMsg({ type: 'error', text: 'Erro ao processar os dados: ' + err.message });
    }
  };

  const sendParseReq = async (payload: any) => {
    try {
      const res = await apiFetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      setParsing(false);

      if (res.ok) {
        setParsedRows(json.allRows || []);
        setStatusMsg({
          type: 'success',
          text: `Sucesso! ${json.totalParsed} clientes lidos e prontos para pré-visualização.`
        });
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Falha ao processar dados.' });
      }
    } catch (err: any) {
      setParsing(false);
      setStatusMsg({ type: 'error', text: 'Erro na requisição: ' + err.message });
    }
  };

  const handleUpdateRow = (index: number, field: keyof ParsedClientRow, value: any) => {
    setParsedRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleDeleteRow = (index: number) => {
    setParsedRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleAddBlankRow = () => {
    const nextQty = parsedRows.length + 1;
    setParsedRows(prev => [
      ...prev,
      {
        generalQty: nextQty,
        username: `Novo Cliente ${nextQty}`,
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Ativo',
        value: 35.00,
        extraField: '',
        contact: '',
        appUsed: 'XCIPTV',
        serviceType: 'IPTV'
      }
    ]);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;
    setImporting(true);
    setStatusMsg(null);

    try {
      const res = await apiFetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientsToImport: parsedRows,
          overwriteExisting
        })
      });

      const json = await res.json();
      setImporting(false);

      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: `Importação concluída! ${json.importedCount} clientes cadastrados no sistema com sucesso.`
        });
        setParsedRows([]);
        setFile(null);
        setPastedText('');
        onImportSuccess();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Erro ao importar clientes.' });
      }
    } catch (err: any) {
      setImporting(false);
      setStatusMsg({ type: 'error', text: 'Erro de comunicação: ' + err.message });
    }
  };

  // Filter parsed rows in preview table
  const filteredRows = parsedRows.filter(row => 
    row.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
    row.contact.includes(searchFilter) ||
    row.appUsed.toLowerCase().includes(searchFilter.toLowerCase()) ||
    row.status.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalRevenuePreview = parsedRows.reduce((acc, row) => acc + (Number(row.value) || 0), 0);

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Header Info Banner */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Importação e Pré-visualização de Planilha Excel
              </h3>
              <p className="text-slate-500 text-xs">
                Envie seu arquivo de clientes (.xlsx, .xls, .csv) ou cole diretamente do Excel.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 w-full sm:w-auto">
            <button
              onClick={() => { setImportMode('FILE'); setStatusMsg(null); }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                importMode === 'FILE'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Arquivo Excel</span>
            </button>
            <button
              onClick={() => { setImportMode('PASTE'); setStatusMsg(null); }}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                importMode === 'PASTE'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Copiar e Colar</span>
            </button>
          </div>
        </div>

        {/* Expected Column Mapping Reference */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500" /> Ordens de Colunas Reconhecidas (A a H):
            </span>
            <span className="text-[10px] text-slate-400">Pode colar com ou sem cabeçalho</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 font-mono text-[10px]">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-indigo-600 font-bold block">A: Qtd</span>
              <span className="text-slate-500">Ex: 1, 2, 3</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-indigo-600 font-bold block">B: Usuário</span>
              <span className="text-slate-500">Ex: João Silva</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-indigo-600 font-bold block">C: Data</span>
              <span className="text-slate-500">Ex: 15/08/2026</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-indigo-600 font-bold block">D: Status</span>
              <span className="text-slate-500">Ativo / Vencido</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-indigo-600 font-bold block">E: Valor</span>
              <span className="text-slate-500">Ex: 35.00</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-indigo-600 font-bold block">F: Servidor</span>
              <span className="text-slate-500">Ex: Server 01</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-indigo-600 font-bold block">G: Telefone</span>
              <span className="text-slate-500">Ex: 11987654321</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="text-indigo-600 font-bold block">H: App</span>
              <span className="text-slate-500">Ex: XCIPTV</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section: File Upload or Text Paste */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        {importMode === 'FILE' ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center space-y-3 hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
            <Upload className="w-8 h-8 mx-auto text-indigo-500" />
            <div className="space-y-1">
              <p className="text-slate-800 dark:text-slate-100 font-semibold text-xs">
                Arraste ou selecione seu arquivo Excel / CSV
              </p>
              <p className="text-slate-400 text-[11px]">Formatos suportados: .XLSX, .XLS, .CSV</p>
            </div>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="block mx-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
            />
            {file && (
              <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 text-xs font-mono">
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clipboard className="w-4 h-4 text-indigo-500" /> Cole abaixo as linhas selecionadas no Excel:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInsertSampleText}
                  className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  Usar Exemplo de Teste
                </button>
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => setPastedText('')}
                    className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Copie as células do seu Excel e cole aqui (Ctrl+V). Suporta telefones como 11-99782-8585, (11) 99782-8585 ou 11997828585.\nExemplo:\n1\tNome do Cliente\t15/08/2026\tAtivo\t35.00\tServidor 01\t11-99782-8585\tXCIPTV`}
              className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-200 resize-y"
            />
          </div>
        )}

        {/* Action Button: Parse */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={handleParse}
            disabled={parsing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs border border-indigo-500 flex items-center gap-1.5 transition-all shadow-2xs"
          >
            {parsing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {parsing ? 'Analisando Dados...' : 'Analisar e Mapear Dados'}
          </button>
        </div>

        {/* Status Alert Message */}
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

      {/* Interactive Live Preview Area */}
      {parsedRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs space-y-3 p-3.5">
          {/* Header Summary & Filter Bar */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                  Pré-visualização Interativa ({parsedRows.length} Clientes Lidos)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Faturamento Total Mapeado: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">R$ {totalRevenuePreview.toFixed(2)}</strong>. Você pode alterar qualquer dado abaixo antes de confirmar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Internal Search Filter */}
              <div className="relative flex-1 md:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar na pré-visualização..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-full focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddBlankRow}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Linha
              </button>
            </div>
          </div>

          {/* Interactive Editable Table (Desktop & Tablet) */}
          <div className="hidden md:block overflow-x-auto max-h-96 rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2 w-10">Qtd</th>
                  <th className="p-2">Nome do Cliente</th>
                  <th className="p-2">Vencimento</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Valor (R$)</th>
                  <th className="p-2">Contato WhatsApp</th>
                  <th className="p-2">Aplicativo</th>
                  <th className="p-2">Extra</th>
                  <th className="p-2 text-center w-12">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="p-2 text-slate-400">{row.generalQty}</td>
                    
                    {/* Username Input */}
                    <td className="p-1 font-sans">
                      <input
                        type="text"
                        value={row.username}
                        onChange={(e) => handleUpdateRow(idx, 'username', e.target.value)}
                        className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 rounded focus:bg-white dark:focus:bg-slate-900 focus:outline-none font-medium text-slate-900 dark:text-slate-100"
                      />
                    </td>

                    {/* Due Date Input */}
                    <td className="p-1">
                      <input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) => handleUpdateRow(idx, 'dueDate', e.target.value)}
                        className="px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 rounded focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-800 dark:text-slate-200"
                      />
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-1">
                      <select
                        value={row.status}
                        onChange={(e) => handleUpdateRow(idx, 'status', e.target.value)}
                        className="px-1.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded focus:outline-none text-[10px] font-sans font-semibold text-slate-800 dark:text-slate-200"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Hoje">Hoje</option>
                        <option value="A Vencer">A Vencer</option>
                        <option value="Vencido">Vencido</option>
                        <option value="Bloqueado">Bloqueado</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </td>

                    {/* Value Input with BRL Currency Mask */}
                    <td className="p-1">
                      <div className="relative flex items-center">
                        <span className="text-[10px] text-slate-400 font-bold mr-0.5 select-none">R$</span>
                        <input
                          type="text"
                          value={row.value !== undefined ? (Number(row.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '35,00'}
                          onChange={(e) => {
                            const valNum = parseCurrencyToNumber(e.target.value);
                            handleUpdateRow(idx, 'value', valNum);
                          }}
                          className="w-20 px-1 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 rounded focus:bg-white dark:focus:bg-slate-900 focus:outline-none font-bold text-emerald-600 dark:text-emerald-400 text-xs"
                        />
                      </div>
                    </td>

                    {/* Contact Input with Phone Mask */}
                    <td className="p-1">
                      <input
                        type="text"
                        value={row.contact ? maskPhoneInput(row.contact) : ''}
                        onChange={(e) => {
                          const masked = maskPhoneInput(e.target.value);
                          handleUpdateRow(idx, 'contact', masked);
                        }}
                        placeholder="(11) 99999-9999"
                        className="w-32 px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 rounded focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                      />
                    </td>

                    {/* App Used Input */}
                    <td className="p-1 font-sans">
                      <input
                        type="text"
                        value={row.appUsed}
                        onChange={(e) => handleUpdateRow(idx, 'appUsed', e.target.value)}
                        className="w-24 px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 rounded focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-indigo-600 dark:text-indigo-400 font-semibold"
                      />
                    </td>

                    {/* Extra Field */}
                    <td className="p-1 font-sans">
                      <input
                        type="text"
                        value={row.extraField}
                        onChange={(e) => handleUpdateRow(idx, 'extraField', e.target.value)}
                        placeholder="Opcional"
                        className="w-24 px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-indigo-500 rounded focus:bg-white dark:focus:bg-slate-900 focus:outline-none text-slate-500"
                      />
                    </td>

                    {/* Delete Action */}
                    <td className="p-1 text-center">
                      <button
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                        title="Remover linha"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive Card List View for Mobile Screen */}
          <div className="block md:hidden space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredRows.map((row, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">#{row.generalQty}</span>
                    <input
                      type="text"
                      value={row.username}
                      onChange={(e) => handleUpdateRow(idx, 'username', e.target.value)}
                      className="font-bold text-slate-900 dark:text-slate-100 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 text-xs w-full"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteRow(idx)}
                    className="p-1 text-rose-600 hover:bg-rose-100 rounded shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Vencimento:</label>
                    <input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) => handleUpdateRow(idx, 'dueDate', e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">Status:</label>
                    <select
                      value={row.status}
                      onChange={(e) => handleUpdateRow(idx, 'status', e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1 py-0.5 text-xs w-full font-semibold"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Hoje">Hoje</option>
                      <option value="A Vencer">A Vencer</option>
                      <option value="Vencido">Vencido</option>
                      <option value="Bloqueado">Bloqueado</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">Valor (R$):</label>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
                      <span className="text-[10px] font-bold text-slate-400">R$</span>
                      <input
                        type="text"
                        value={row.value !== undefined ? (Number(row.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '35,00'}
                        onChange={(e) => {
                          const valNum = parseCurrencyToNumber(e.target.value);
                          handleUpdateRow(idx, 'value', valNum);
                        }}
                        className="bg-transparent text-xs w-full font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block">Aplicativo:</label>
                    <input
                      type="text"
                      value={row.appUsed}
                      onChange={(e) => handleUpdateRow(idx, 'appUsed', e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs w-full font-semibold text-indigo-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final Options & Confirm Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>Substituir lista de clientes cadastrados no sistema</span>
            </label>

            <button
              onClick={handleConfirmImport}
              disabled={importing || parsedRows.length === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs border border-emerald-500/80 flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
            >
              {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{importing ? 'Importando Clientes...' : `Confirmar e Cadastrar ${parsedRows.length} Clientes`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
