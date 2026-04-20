import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Droplets, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/store/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Login page — email/password auth via Supabase.
 * On success, redirects to /dashboard.
 * Shows "Not authorized" if user is not in admins table.
 */
export default function Login() {
  const navigate = useNavigate();
  const { signIn, sendPasswordReset, verifyOtp, cancelOtp } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState('LOGIN'); // 'LOGIN' | 'RESET' | 'OTP'
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async ({ email, password }) => {
    const res = await signIn(email, password);
    if (res.error) {
      toast.error(res.error.message ?? 'Sign in failed');
      return;
    }
    if (res.requireOtp) {
      setOtpEmail(email);
      setView('OTP');
      toast.success('Password verified. OTP sent to email.');
      return;
    }
    toast.success('Welcome back!');
    navigate('/dashboard', { replace: true });
  };
  
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otpCode.length < 6) return toast.error('Enter 6-digit OTP');
    setOtpLoading(true);
    const { error } = await verifyOtp(otpEmail, otpCode);
    setOtpLoading(false);
    
    if (error) {
      toast.error(error.message ?? 'Invalid verification code');
    } else {
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    }
  };

  const handleCancelOtp = () => {
    cancelOtp();
    setView('LOGIN');
    setOtpCode('');
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) return toast.error('Enter your email first');
    setResetLoading(true);
    const { error } = await sendPasswordReset(resetEmail);
    setResetLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password reset email sent — check your inbox');
      setView('LOGIN');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Env var missing warning */}
        {!isSupabaseConfigured && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-800">
                <p className="font-semibold">Supabase not configured</p>
                <p className="mt-1">
                  Edit <code className="bg-amber-100 px-1 rounded">.env.local</code> and set your real{' '}
                  <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code> and{' '}
                  <code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>, then
                  restart <code className="bg-amber-100 px-1 rounded">npm run dev</code>.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Logo + brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg">
            <Droplets className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Zynkly Admin</h1>
          <p className="text-sm text-muted-foreground">
            Cleaning services operations dashboard
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-xl border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {view === 'RESET' ? 'Reset Password' : view === 'OTP' ? 'Enter Verification Code' : 'Sign in to your account'}
            </CardTitle>
            <CardDescription>
              {view === 'RESET'
                ? 'Enter your admin email to receive a reset link.'
                : view === 'OTP' 
                ? 'A 6-digit code has been sent to your email.'
                : 'Admin access only — unauthorized users will be rejected.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view === 'RESET' ? (
              // Password Reset Form
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Admin Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="admin@zynkly.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                >
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Send Reset Link
                </Button>
                <button
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setView('LOGIN')}
                >
                  ← Back to sign in
                </button>
              </div>
            ) : view === 'OTP' ? (
              // OTP Verification Form
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp-code">Authentication Code</Label>
                  <Input
                    id="otp-code"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-lg tracking-widest font-mono font-bold"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Check your spam/junk folder if you don't see it.
                  </p>
                </div>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={otpLoading || otpCode.length < 6}
                >
                  {otpLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Verify & Continue
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleCancelOtp}
                >
                  ← Cancel
                </button>
              </form>
            ) : (
              // Login Form
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@zynkly.com"
                    autoComplete="email"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  id="login-submit"
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Sign In
                </Button>

                <button
                  type="button"
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                  onClick={() => setView('RESET')}
                >
                  Forgot password?
                </button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Zynkly Admin Panel · Phagwara, Punjab
        </p>
      </div>
    </div>
  );
}
