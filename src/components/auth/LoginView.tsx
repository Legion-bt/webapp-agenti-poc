import React, { useState } from 'react';
import { store } from '../../lib/store';
import { getDatabaseStatus } from '../../lib/supabase/client';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Database,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface LoginViewProps {
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dbStatus = getDatabaseStatus();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Inserisci sia l\'indirizzo email che la password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await store.loginWithSupabase(email, password);

      if (!result.success) {
        setErrorMessage(
          result.error ||
            'Autenticazione fallita. Verifica le credenziali create nel tuo database Supabase.'
        );
        return;
      }

      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Errore di connessione a Supabase. Verifica che le credenziali siano corrette.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle showLabel />
      </div>

      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-2xl shadow-lg mb-4">
          A
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          AgenteGo ERP
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Portale B2B Commerciale • Autenticazione Supabase
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl dark:shadow-2xl rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-800">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Accedi con il tuo account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Usa le credenziali create nel database Supabase.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Indirizzo Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@azienda.it"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="leading-snug">{errorMessage}</div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifica credenziali in corso...</span>
                  </>
                ) : (
                  <>
                    <span>Accedi al Portale</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Supabase Connection Status Indicator */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-3xs text-slate-500 dark:text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Progetto: {dbStatus.projectId}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Auth Attivo</span>
            </div>
          </div>
        </div>

        {/* Security / Architecture explanation note */}
        <div className="mt-4 p-3.5 bg-slate-200/60 dark:bg-slate-900/80 rounded-xl border border-slate-300/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-2xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Autenticazione Sicura & Row Level Security (RLS)</span>
          </div>
          <p className="leading-relaxed">
            Gli accessi demo sono stati disabilitati. È possibile accedere unicamente utilizzando gli utenti registrati nella tabella autenticazione di Supabase. I permessi RLS garantiscono che ciascun agente acceda esclusivamente ai propri dati assegnati.
          </p>
        </div>
      </div>
    </div>
  );
};
