import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Shield,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { t } = useI18n();
  const { login, register, loginWithGoogle, isLoading } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // Google sign-in modal/state
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

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
        toast.success(t.auth.loginSuccess, 'Đăng nhập thành công');
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        const err = res.error || t.auth.invalidCredentials;
        setErrorMsg(err);
        toast.error(err, 'Lỗi đăng nhập');
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
        setErrorMsg('Vui lòng nhập họ và tên hiển thị.');
        return;
      }

      const res = await register(email, password, name, organizationName, 'HOST');
      if (res.success) {
        setSuccessMsg(t.auth.registerSuccess);
        toast.success(t.auth.registerSuccess, 'Tạo tài khoản thành công');
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        const err = res.error || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
        setErrorMsg(err);
        toast.error(err, 'Lỗi đăng ký');
      }
    }
  };

  const handleFillAdminCredentials = () => {
    setMode('signin');
    setEmail('ngoncnp01@gmail.com');
    setPassword('password123');
    setErrorMsg(null);
    toast.info('Đã tự động điền thông tin Quản trị viên (Admin).', 'Tài khoản Quản trị');
  };

  const handleGoogleQuickAuth = async (targetEmail: string, targetName: string) => {
    setErrorMsg(null);
    const res = await loginWithGoogle(
      targetEmail,
      targetName,
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(targetName)}`
    );
    if (res.success) {
      toast.success(
        `Đăng nhập Google thành công với tài khoản ${targetEmail}!`,
        'Xác thực Google'
      );
      setIsGoogleChooserOpen(false);
      onClose();
    } else {
      setErrorMsg(res.error || 'Đăng nhập bằng Google thất bại.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {mode === 'signin' ? t.auth.signInTitle : t.auth.signUpTitle}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                {mode === 'signin' ? t.auth.subtitleSignIn : t.auth.subtitleSignUp}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* Mode switcher tabs */}
          <div className="px-5 sm:px-6 pt-4">
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.nav.signIn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.nav.signUp}
              </button>
            </div>
          </div>

          {/* Google Quick Sign-In / Sign-Up Button */}
          <div className="px-5 sm:px-6 pt-4">
            <button
              type="button"
              onClick={() => setIsGoogleChooserOpen(true)}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700/80 rounded-xl font-semibold text-xs transition-all shadow-xs hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer min-h-[42px]"
            >
              {/* Official Google SVG Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.auth.continueWithGoogle}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium shrink-0">
                {t.auth.orEmailPassword}
              </span>
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            </div>
          </div>

          {/* Google Account Selector Popup */}
          {isGoogleChooserOpen && (
            <div className="mx-5 sm:mx-6 mb-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {t.auth.chooseGoogleAccount}
                </span>
                <button
                  type="button"
                  onClick={() => setIsGoogleChooserOpen(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main Admin Google account shortcut */}
              <button
                type="button"
                onClick={() => handleGoogleQuickAuth('ngoncnp01@gmail.com', 'Ngôn Cnp')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-850 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-indigo-300 dark:border-indigo-700/60 transition-all text-left cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    NC
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      Ngôn Cnp
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      ngoncnp01@gmail.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                  Admin
                </span>
              </button>

              {/* Or enter custom Google account */}
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  {t.auth.useAnotherAccount}:
                </div>
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Họ và tên Google"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customGoogleEmail && customGoogleEmail.includes('@')) {
                      handleGoogleQuickAuth(customGoogleEmail, customGoogleName || customGoogleEmail.split('@')[0]);
                    } else {
                      toast.error('Vui lòng nhập địa chỉ email hợp lệ.');
                    }
                  }}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Xác nhận đăng nhập Google
                </button>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                {t.auth.googleAccountNote}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-5 sm:px-6 space-y-3.5 pb-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.auth.name} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t.auth.orgName}
                  </label>
                  <div className="relative flex items-center">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3" />
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Tập đoàn Công nghệ / Doanh nghiệp"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.auth.email} <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.io"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t.auth.password} <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.auth.confirmPassword} <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer min-h-[40px]"
            >
              <span>{isLoading ? 'Đang xử lý...' : mode === 'signin' ? t.auth.signInBtn : t.auth.signUpBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Admin System Control Info Banner */}
          <div className="px-5 sm:px-6 pb-6 pt-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="text-[11px] text-slate-800 dark:text-slate-300 flex items-center gap-1.5 font-bold">
                <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{t.auth.adminHint}</span>
              </div>
              <button
                type="button"
                onClick={handleFillAdminCredentials}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer text-left sm:text-right"
              >
                {t.auth.adminFillBtn}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs">
              <div className="truncate">
                <div className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                  ngoncnp01@gmail.com
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Mật khẩu: <span className="font-mono font-medium">password123</span> (Super Admin)
                </div>
              </div>
              <button
                type="button"
                onClick={handleFillAdminCredentials}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
              >
                Tự động điền
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
