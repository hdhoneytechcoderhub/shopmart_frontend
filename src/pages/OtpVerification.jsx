import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { setUser } from '../redux/slices/authSlice';
import Spinner from '../components/common/Spinner';

const LENGTH = 6;

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const email = location.state?.email || '';
  const demo = location.state?.demo;

  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [seconds, setSeconds] = useState(30);
  const inputs = useRef([]);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[i] = v;
      return next;
    });
    if (v && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(LENGTH).fill('');
    text.split('').forEach((c, idx) => { next[idx] = c; });
    setDigits(next);
    inputs.current[Math.min(text.length, LENGTH - 1)]?.focus();
  };

  const code = digits.join('');

  const verify = async () => {
    if (code.length !== LENGTH) {
      toast.error('Enter the complete 6-digit code');
      return;
    }
    setSubmitting(true);
    try {
      const data = await authService.verifyOtp({ email, code });
      if (data?.user) dispatch(setUser(data.user));
      toast.success('Verified! Your account is ready.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err?.response) {
        toast.error(err.response.data?.message || 'Invalid or expired code');
      } else {
        // Demo fallback
        toast.success('Verified (demo). Please sign in.');
        navigate('/login', { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setSeconds(30);
    try {
      await authService.resendOtp(email);
      toast.success('A new code is on its way.');
    } catch {
      toast.success('A new code is on its way.');
    }
  };

  return (
    <div className="text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        <ShieldCheck className="h-7 w-7" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">Verify your email</h1>
      <p className="mt-1 text-sm text-ink-muted">
        We sent a 6-digit code{email ? <> to <span className="font-medium text-ink">{email}</span></> : ''}.
        {demo ? ' Any 6 digits work in demo mode.' : ''}
      </p>

      <div className="mt-6 flex justify-center gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            className="h-14 w-12 rounded-xl border border-slate-300 text-center text-xl font-semibold text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <button onClick={verify} disabled={submitting} className="btn-primary mt-6 w-full">
        {submitting ? <Spinner /> : null}
        {submitting ? 'Verifying…' : 'Verify'}
      </button>

      <p className="mt-4 text-sm text-ink-muted">
        Didn’t get the code?{' '}
        {seconds > 0 ? (
          <span className="text-slate-400">Resend in {seconds}s</span>
        ) : (
          <button onClick={resend} className="link font-medium">Resend code</button>
        )}
      </p>

      <p className="mt-2 text-sm">
        <Link to="/register" className="link">Back to sign up</Link>
      </p>
    </div>
  );
}
