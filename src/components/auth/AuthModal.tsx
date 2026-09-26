import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { X, Lock, Mail, User as UserIcon, Building2, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { t } = useI18n();
  const { login, register, quickLoginAs, isLoading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'signin') {
      const res = await login(email, password);
      if (res.success) {
        setSuccessMsg(t.auth.loginSuccess);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.error || t.auth.invalidCredentials);
      }
    } else {
      // Validate register
      if (password !== confirmPassword) {
        setErrorMsg(t.auth.passwordMismatch);
        return;
      }
      if (password.length < 6) {
        setErrorMsg(t.auth.minPasswordLength);
        return;
      }
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }

      const res = await register(email, password, name, organizationName);
      if (res.success) {
        setSuccessMsg(t.auth.registerSuccess);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.error || 'Registration failed');
      }
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await quickLoginAs(targetEmail);
    if (res.success) {
      setSuccessMsg(t.auth.loginSuccess);
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.error || 'Quick login failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {mode === 'signin' ? t.auth.signInTitle : t.auth.signUpTitle}
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'signin' ? t.auth.subtitleSignIn : t.auth.subtitleSignUp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/30 p-1 m-4 mb-2 rounded-xl border">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.nav.signIn}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.nav.signUp}
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 pt-2">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.auth.name} <span className="text-rose-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.auth.orgName}
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3" />
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Global Corporation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.auth.email} <span className="text-rose-400">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.auth.password} <span className="text-rose-400">*</span>
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.auth.confirmPassword} <span className="text-rose-400">*</span>
              </label>
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <span>{isLoading ? 'Processing...' : mode === 'signin' ? t.auth.signInBtn : t.auth.signUpBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Bar */}
        <div className="px-6 pb-6 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.auth.demoAccounts}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('ngoncnp01@gmail.com')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-200 text-left transition-colors truncate"
            >
              <div className="font-semibold text-white truncate">Ngôn Cnp</div>
              <div className="text-[10px] text-indigo-400 font-mono">ngoncnp01</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('sarah.chen@aurameet.enterprise.io')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-200 text-left transition-colors truncate"
            >
              <div className="font-semibold text-white truncate">Sarah Chen</div>
              <div className="text-[10px] text-indigo-400 font-mono">Host</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('alex.rivera@aurameet.enterprise.io')}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-200 text-left transition-colors truncate"
            >
              <div className="font-semibold text-white truncate">Alex Rivera</div>
              <div className="text-[10px] text-indigo-400 font-mono">Admin</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
