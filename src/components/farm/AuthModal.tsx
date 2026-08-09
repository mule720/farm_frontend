import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User as UserIcon, Building2, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ open, onClose, initialMode = 'signin' }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();

  if (!open) return null;

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearMessages();
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) setError(error);
        else onClose();
      } else if (mode === 'signup') {
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        // First person to register for an org is always the Director (org owner / superuser)
        const { error } = await signUp(email, password, fullName, 'director', organization || 'My Farm');
        if (error) setError(error);
        else onClose();
      } else {
        const { error } = await resetPassword(email);
        if (error) setError(error);
        else setSuccess('If your account exists, a reset link will be sent.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded-md">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Set up your farm' : 'Reset password'}
              </h2>
              <p className="text-xs text-green-100">
                {mode === 'signin'
                  ? 'Sign in to AgroNexus'
                  : mode === 'signup'
                  ? 'Create your organisation account — you can add employees later'
                  : "We'll send a reset link to your email"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> {success}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <Field icon={UserIcon} label="Your Full Name" value={fullName} onChange={setFullName} required placeholder="Joseph Mwansa" />
              <Field icon={Building2} label="Organisation / Farm Name" value={organization} onChange={setOrganization} placeholder="e.g. Mwansa Agro Farms" />
            </>
          )}

          <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} required placeholder="you@farm.com" />

          {mode !== 'reset' && (
            <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} required placeholder="••••••••" />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </button>

          <div className="text-center text-xs text-slate-600 space-y-2">
            {mode === 'signin' && (
              <>
                <div>
                  <button type="button" onClick={() => { clearMessages(); setMode('reset'); }} className="text-green-600 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { clearMessages(); setMode('signup'); }} className="text-green-600 hover:underline font-medium">
                    Sign up
                  </button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <div>
                Already have an account?{' '}
                <button type="button" onClick={() => { clearMessages(); setMode('signin'); }} className="text-green-600 hover:underline font-medium">
                  Sign in
                </button>
              </div>
            )}
            {mode === 'reset' && (
              <div>
                <button type="button" onClick={() => { clearMessages(); setMode('signin'); }} className="text-green-600 hover:underline">
                  ← Back to sign in
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = 'text', required, placeholder }: any) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
    </div>
  );
}
