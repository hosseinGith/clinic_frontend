import type React from 'react';
import { env } from '../../config/env';

export interface CaptchaProps {
  verified: boolean;
  onVerify: (token: string) => void;
  error?: string;
  className?: string;
}

export interface ICaptchaProvider {
  id: string;
  name: string;
  Component: React.FC<CaptchaProps>;
}

export type CaptchaRegistry = Record<string, ICaptchaProvider>;

const providers: CaptchaRegistry = {};

export const registerCaptchaProvider = (provider: ICaptchaProvider): void => {
  providers[provider.id] = provider;
};

export const getCaptchaProvider = (providerName: string = env.captchaProvider): ICaptchaProvider | undefined => {
  return providers[providerName] || providers['mock'];
};
