import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { TextInput } from '../components/TextInput';
import { PasswordInput } from '../components/PasswordInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { Checkbox } from '../components/Checkbox';
import { AlertBanner } from '../components/AlertBanner';
import { Link } from '../components/Link';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (value: string): boolean => {
    if (!value) return true; // Don't show error on empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setAuthError('');
    
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setAuthError('');
  };

  const isFormValid = (): boolean => {
    return email.length > 0 && 
           password.length > 0 && 
           validateEmail(email) &&
           !emailError;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;

    setLoading(true);
    setAuthError('');

    // Hardcoded credentials for development
    const DEFAULT_EMAIL = 'nurse@hospital.org';
    const DEFAULT_PASSWORD = 'password123';

    // Simulate authentication
    setTimeout(() => {
      if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
        setLoading(false);
        localStorage.setItem('isAuthenticated', 'true');
        // Redirect to Handoff Forms (home)
        navigate('/');
      } else {
        setLoading(false);
        setAuthError('Invalid email or password. Hint: nurse@hospital.org / password123');
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isFormValid()) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-8">
      <div className="w-full max-w-[520px]">
        {/* Login Card */}
        <div className="bg-card rounded-xl border border-border p-12 shadow-sm">
          {/* Authentication Error Banner */}
          {authError && (
            <div className="mb-6">
              <AlertBanner message={authError} />
            </div>
          )}

          {/* Brand Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-semibold tracking-tight">Nurse Intake Copilot</h1>
            <p className="text-muted-foreground">
              Secure access for clinical staff
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
            {/* Email Input */}
            <TextInput
              id="email"
              label="Email"
              type="email"
              placeholder="nurse@hospital.org"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              autoComplete="email"
            />

            {/* Password Input */}
            <PasswordInput
              id="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              autoComplete="current-password"
            />

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between">
              <Checkbox
                id="remember"
                label="Remember me on this device"
                helperText="Use only on personal devices"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
              />
            </div>

            <div className="flex justify-end">
              <Link href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Primary Action */}
            <div className="space-y-4">
              <PrimaryButton
                type="submit"
                disabled={!isFormValid()}
                loading={loading}
                className="w-full"
              >
                Sign in
              </PrimaryButton>
              <div className="p-3 bg-muted/50 rounded-md border border-border">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Development Access:</span><br />
                  Email: nurse@hospital.org<br />
                  Password: password123
                </p>
              </div>
            </div>
          </form>

          {/* Secondary/Help Section */}
          <div className="mt-8 text-center">
            <span className="text-sm text-muted-foreground">Need access? </span>
            <Link href="#" className="text-sm text-primary hover:underline">
              Request access
            </Link>
          </div>

          {/* Compliance Microcopy */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Reported access is logged for security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
