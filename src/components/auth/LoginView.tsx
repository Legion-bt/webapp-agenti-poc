import React, { useState } from 'react';
import { store } from '../../lib/store';
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  BookOpen,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface LoginViewProps {
  onSuccess: () => void;
}

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Catalogo e listini',
    text: 'Prezzi e sconti personalizzati per ogni cliente, sempre aggiornati.',
  },
  {
    icon: ShoppingCart,
    title: 'Ordini in mobilità',
    text: 'Disponibilità di magazzino in tempo reale e invio diretto al gestionale.',
  },
  {
    icon: Users,
    title: 'Situazione clienti',
    text: 'Fido, esposizione e sospesi sotto controllo prima di ogni visita.',
  },
];

const BrandMark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-extrabold text-lg shadow-sm">
      A
    </div>
    <span className="text-lg font-bold tracking-tight">AgenteGo</span>
  </div>
);

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Inserisci email e password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await store.loginWithSupabase(email, password);

      if (!result.success) {
        setErrorMessage(result.error || 'Accesso non riuscito. Verifica le credenziali.');
        return;
      }

      onSuccess();
    } catch {
      setErrorMessage('Impossibile contattare il servizio di accesso. Riprova tra qualche istante.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full h-11 px-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 focus:outline-hidden';

  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Brand panel (desktop only) */}
      <aside className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-slate-900 text-white p-12 border-r border-transparent dark:border-slate-800">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute -bottom-40 -left-24 w-[32rem] h-[32rem] rounded-full bg-blue-600/25 blur-3xl pointer-events-none" />

        <BrandMark className="relative" />

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Il portale per la tua rete vendita.
          </h2>
          <p className="mt-3 text-slate-300 leading-relaxed">
            Tutto quello che serve all'agente sul campo, collegato in tempo reale al gestionale aziendale.
          </p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <div className="flex items-center justify-center w-10 h-10 shrink-0 rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} AgenteGo</p>
      </aside>

      {/* Sign-in form */}
      <main className="relative flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle showLabel />
        </div>

        <div className="w-full max-w-sm mx-auto">
          <BrandMark className="lg:hidden mb-10" />

          <h1 className="text-2xl font-bold tracking-tight">Accedi</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Inserisci le credenziali aziendali per continuare.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleLogin} noValidate>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@azienda.it"
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-700 dark:text-rose-300"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="cursor-pointer w-full h-11 flex justify-center items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white shadow-sm transition-colors focus:outline-hidden focus:ring-4 focus:ring-blue-600/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Accesso in corso…</span>
                </>
              ) : (
                <>
                  <span>Accedi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-sm text-slate-500 dark:text-slate-400">
            Problemi di accesso? Contatta l'amministratore della tua organizzazione.
          </p>
        </div>
      </main>
    </div>
  );
};
