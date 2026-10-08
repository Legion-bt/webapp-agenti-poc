import React, { useState } from 'react';
import { store } from '../../lib/store';
import { ArrowRight, AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface LoginViewProps {
  onSuccess: () => void;
}

// Fine film grain over the gradient, keeps large blurred areas from looking flat.
const NOISE_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

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
    'login-input w-full h-12 pl-11 pr-4 border rounded-xl text-sm transition-colors focus:ring-4 focus:ring-violet-500/20 focus:outline-hidden';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07060f] text-white font-sans flex items-center justify-center px-4 py-12">
      {/* Animated gradient blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="login-blob-a absolute -top-[20%] -left-[10%] w-[max(60vw,440px)] h-[max(60vw,440px)] max-w-[820px] max-h-[820px] rounded-full bg-blue-600/55 blur-[120px]" />
        <div className="login-blob-b absolute -bottom-[25%] -right-[10%] w-[max(55vw,420px)] h-[max(55vw,420px)] max-w-[760px] max-h-[760px] rounded-full bg-fuchsia-600/45 blur-[120px]" />
        <div className="login-blob-c absolute top-[30%] left-[45%] w-[max(35vw,300px)] h-[max(35vw,300px)] max-w-[520px] max-h-[520px] rounded-full bg-cyan-400/30 blur-[110px]" />
        <div className="absolute inset-0 opacity-[0.18] mix-blend-overlay" style={{ backgroundImage: NOISE_BG }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(7,6,15,0.75)_100%)]" />
      </div>

      <div className="login-rise relative w-full max-w-[420px]">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-fuchsia-500 blur-lg opacity-70" />
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 via-violet-500 to-fuchsia-500 text-2xl font-extrabold shadow-xl">
              A
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Agente
            <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              Go
            </span>
          </h1>
          <p className="mt-2 text-sm text-white/60">Il portale della tua rete vendita</p>
        </div>

        {/* Glass card */}
        <div className="relative rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
          <div aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="px-7 py-8 sm:px-9">
            <h2 className="text-lg font-semibold">Accedi al tuo account</h2>
            <p className="mt-1 text-sm text-white/55">Usa le credenziali aziendali.</p>

            <form className="mt-7 space-y-4" onSubmit={handleLogin} noValidate>
              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-white/70 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
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
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-white/70 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="La tua password"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-white/40 hover:text-white cursor-pointer transition-colors"
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-sm text-rose-100"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group relative cursor-pointer w-full h-12 mt-2 flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 bg-[length:200%_100%] bg-left hover:bg-right text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(139,92,246,0.7)] transition-all duration-500 focus:outline-hidden focus:ring-4 focus:ring-violet-400/40 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Accesso in corso…</span>
                  </>
                ) : (
                  <>
                    <span>Accedi</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-white/45">
          Problemi di accesso? Contatta l'amministratore della tua organizzazione.
        </p>
      </div>
    </div>
  );
};
