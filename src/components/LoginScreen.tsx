import React, { useState } from 'react';
import { Tv, Lock, User, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { setSession } from '../utils/api';

export interface UserAuth {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'GERENTE' | 'SUPORTE';
  avatarUrl?: string;
}

interface LoginScreenProps {
  onLoginSuccess: (user: UserAuth) => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Por favor, preencha o usuário e a senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Usuário ou senha inválidos.');
        return;
      }

      setSession(data.token);
      localStorage.setItem('iptv_pro_auth', JSON.stringify(data.user));
      onLoginSuccess(data.user);
    } catch (err) {
      setError('Não foi possível conectar ao servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans text-xs">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 mb-3 border border-indigo-400/30">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            IPTV & P2P <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/60">Pro 2026</span>
          </h1>
          <p className="text-[11px] text-slate-400 mt-1">
            Painel do Revendedor - Gestão Financeira & Automação
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700/70 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200 text-xs">Acesso ao Sistema</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">v2.4.0</span>
          </div>

          {error && (
            <div className="mb-4 p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-lg text-rose-300 text-[11px] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu usuário de acesso"
                  autoComplete="username"
                  className="w-full pl-8 pr-3 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-8 pr-9 py-2 bg-slate-900/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end text-[11px] pt-1">
              <span className="text-slate-500 text-[10px]">Criptografia SSL 256-bit</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-lg border border-indigo-400/30 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-[10px] text-slate-500">
          IPTV & P2P Manager • Sistema responsivo para Celular e Desktop
        </div>
      </div>
    </div>
  );
}
