import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Mail, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isConfigured } from '../lib/supabase';

async function redirectToCheckout(plan, accessToken) {
  if (!isConfigured || !supabase || !accessToken) return false;
  try {
    const res = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/app?activated=1`,
          cancelUrl:  `${window.location.origin}/login?plan=${plan}`,
        }),
      }
    );
    const json = await res.json();
    if (json.url) {
      window.location.href = json.url;
      return true;
    }
    console.error('Checkout error:', json.error);
  } catch (e) {
    console.error('Checkout fetch failed:', e);
  }
  return false;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm">
        <Briefcase size={18} className="text-white" strokeWidth={2.5} />
      </div>
      <p className="text-lg font-extrabold tracking-tight text-slate-900">Kidz<span className="text-brand-600">Biz</span></p>
    </div>
  );
}

export default function AuthPage() {
  const { signIn, signUp, isConfigured: authConfigured } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [mode, setMode]         = useState('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [resetSent, setResetSent]   = useState(false);

  const handlePasswordReset = async () => {
    if (!email.trim()) { setError('Enter your email address first.'); return; }
    setError('');
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetSent(true);
  };

  const plan = params.get('plan') || 'free';
  const isPaidPlan = plan === 'family' || plan === 'class';

  const PLAN_LABELS = {
    free:   'Free plan',
    family: 'Family plan — $12/mo',
    class:  'Class plan — $29/mo',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingMsg('');

    try {
      if (!authConfigured) {
        navigate('/app');
        return;
      }

      let accessToken = null;
      let userId = null;

      if (mode === 'signup') {
        setLoadingMsg('Creating your account…');
        const { data, error: signUpErr } = await signUp(email, password);
        if (signUpErr) throw signUpErr;
        accessToken = data?.session?.access_token ?? null;
        userId = data?.session?.user?.id ?? null;
      } else {
        setLoadingMsg('Signing in…');
        const { data, error: signInErr } = await signIn(email, password);
        if (signInErr) throw signInErr;
        accessToken = data?.session?.access_token ?? null;
        userId = data?.session?.user?.id ?? null;
      }

      if (isPaidPlan && accessToken && userId) {
        // Skip checkout if already on a paid plan
        const { data: familyRow } = await supabase
          .from('families')
          .select('plan_tier')
          .eq('id', userId)
          .single();
        const alreadyPaid = familyRow?.plan_tier === 'family' || familyRow?.plan_tier === 'class';
        if (!alreadyPaid) {
          setLoadingMsg('Redirecting to payment…');
          const redirected = await redirectToCheckout(plan, accessToken);
          if (redirected) return;
        }
      }

      navigate('/app');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link to="/"><Logo /></Link>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-7">
          {isPaidPlan && PLAN_LABELS[plan] && (
            <div className="mb-5 px-3 py-2 bg-brand-50 border border-brand-100 rounded-lg text-xs font-semibold text-brand-700 text-center">
              {PLAN_LABELS[plan]} · 14-day free trial
            </div>
          )}

          <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-6">
            {['signin', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-semibold transition ${m === mode ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {!authConfigured && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Demo mode</strong> — Supabase not configured.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6+ characters" className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition text-sm" />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 disabled:opacity-50 transition">
              {loading ? (loadingMsg || 'Please wait…') : mode === 'signin' ? 'Sign in' : 'Create account'}
              {!loading && <ChevronRight size={16} />}
            </button>
          </form>

          {mode === 'signin' && (
            <div className="mt-3 text-center">
              {resetSent
                ? <p className="text-xs text-green-700">Check your email for a reset link.</p>
                : <button type="button" onClick={handlePasswordReset} className="text-xs text-slate-500 hover:text-brand-600 hover:underline">Forgot password?</button>
              }
            </div>
          )}
          {mode === 'signup' && (
            <p className="mt-4 text-center text-xs text-slate-500">
              By creating an account you agree to our terms of service.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/" className="text-brand-600 hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
