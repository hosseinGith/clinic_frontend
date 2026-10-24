import React, { useState } from 'react';
import { Shield, Check, Loader2 } from 'lucide-react';
import type { CaptchaProps } from './captchaProvider';
import { registerCaptchaProvider, getCaptchaProvider } from './captchaProvider';

export type { CaptchaProps } from './captchaProvider';

const MockCaptchaComponent: React.FC<CaptchaProps> = ({
  verified,
  onVerify,
  error,
  className = '',
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleClick = () => {
    if (verified || isVerifying) return;
    setIsVerifying(true);
    // Simulate brief turnstile challenge verification
    setTimeout(() => {
      setIsVerifying(false);
      const mockToken = `mock-turnstile-${Date.now()}`;
      onVerify(mockToken);
    }, 350);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className={`p-3 bg-neutral-50 border rounded-xl flex items-center justify-between text-xs cursor-pointer select-none transition-all ${
          verified
            ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200'
            : error
            ? 'border-rose-300 bg-rose-50/30'
            : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100/50'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              verified
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white border-neutral-300'
            }`}
          >
            {isVerifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0f766e]" />
            ) : verified ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : null}
          </div>
          <span className="text-neutral-800 font-medium">
            {verified ? 'تأیید هویت امنیتی با موفقیت انجام شد' : 'من ربات نیستم (تأیید امنیتی مراجع)'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <Shield className={`w-3.5 h-3.5 ${verified ? 'text-emerald-600' : 'text-[#0f766e]'}`} />
          <span>Cloudflare Turnstile</span>
        </div>
      </div>
      {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
    </div>
  );
};

// Register default mock provider
registerCaptchaProvider({
  id: 'mock',
  name: 'Mock Turnstile Captcha',
  Component: MockCaptchaComponent,
});

export const Captcha: React.FC<CaptchaProps> = (props) => {
  const provider = getCaptchaProvider();
  const Component = provider?.Component || MockCaptchaComponent;
  return <Component {...props} />;
};
