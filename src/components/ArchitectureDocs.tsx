import React, { useState, useEffect } from 'react';
import { Database, Server, Code, Copy, Check, Shield, Cpu, Layers, Terminal } from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [prismaSchema, setPrismaSchema] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/prisma-schema')
      .then(res => res.text())
      .then(text => setPrismaSchema(text))
      .catch(err => console.error('Error fetching Prisma schema:', err));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(prismaSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
          <Server className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Arquitetura do Sistema & Módulos Back-end / Prisma MySQL
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-xs">
          Documentação técnica da estrutura modular com separação Front-end / Back-end e Schema Prisma pronto para MySQL.
        </p>
      </div>

      {/* Microservices Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400 text-xs">
            <Cpu className="w-4 h-4" /> 1. Módulo de Clientes IPTV/P2P
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            Endpoints RESTful para cadastro, busca por status, renovação em lote e gestão de vencimentos com atualização de status dinâmica.
          </p>
          <code className="block p-1.5 bg-slate-100 dark:bg-slate-800 font-mono text-[10px] rounded text-slate-700 dark:text-slate-300">
            GET /api/clients | POST /api/clients/batch-renew
          </code>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
            <Layers className="w-4 h-4" /> 2. Módulo Financeiro
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            Engine de cálculo de faturamento no período customizado (dia 19 ao dia 19), comparação com o ciclo anterior, cálculo de lucro em R$ e % de crescimento.
          </p>
          <code className="block p-1.5 bg-slate-100 dark:bg-slate-800 font-mono text-[10px] rounded text-slate-700 dark:text-slate-300">
            GET /api/financials?month=YYYY-MM
          </code>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400 text-xs">
            <Terminal className="w-4 h-4" /> 3. Módulo de Bot & Disparos
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px]">
            Microserviço de automação de mensagens com execução contínua a cada 5 minutos, fila de reativação para clientes inativos e log de erros.
          </p>
          <code className="block p-1.5 bg-slate-100 dark:bg-slate-800 font-mono text-[10px] rounded text-slate-700 dark:text-slate-300">
            POST /api/bot/trigger | GET /api/bot/logs
          </code>
        </div>
      </div>

      {/* Prisma Schema Code block for MySQL */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-2 p-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
              Esquema de Banco de Dados Prisma (schema.prisma para MySQL)
            </h4>
          </div>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copiado!' : 'Copiar schema.prisma'}
          </button>
        </div>

        <p className="text-slate-500 text-[11px]">
          Para migrar os dados para o seu banco MySQL de produção, basta copiar o código abaixo em <code className="text-indigo-600 font-bold">prisma/schema.prisma</code> e rodar <code className="text-emerald-600 font-bold">npx prisma db push</code>.
        </p>

        <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] rounded-lg overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
          {prismaSchema}
        </pre>
      </div>
    </div>
  );
};
