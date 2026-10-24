import { useSyncExternalStore } from 'react';
import type { IntegrationStatus, SidebarServiceStatus } from '../domain/integration';
import {
  createSmsProvider,
  createPaymentProvider,
  createWhatsAppProvider,
} from './providerFactory';

export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  public smsProvider = createSmsProvider();
  public whatsappProvider = createWhatsAppProvider();
  public paymentProvider = createPaymentProvider();

  private listeners = new Set<() => void>();

  // Observable connection status
  private statuses: IntegrationStatus[] = [
    {
      id: 'online_booking',
      title: 'سامانه رزرو آنلاین نوبت',
      providerName: 'MedFlow Booking Engine',
      status: 'connected',
      statusLabel: 'فعال و برخط',
      hint: 'لینک عمومی رزرو در دسترس مراجعان است.',
      lastCheckedAt: 'هم‌اکنون',
    },
    {
      id: 'sms',
      title: 'ارسال پیامک اطلاع‌رسانی',
      providerName: 'کاوهنگار',
      status: 'not_connected',
      statusLabel: 'هنوز متصل نیست',
      hint: 'کلید API پنل پیامک را در تنظیمات وارد فرمایید.',
      lastCheckedAt: 'امروز 09:00',
    },
    {
      id: 'whatsapp',
      title: 'واتساپ تجاری خودکار',
      providerName: 'Cloud WhatsApp API',
      status: 'connected',
      statusLabel: 'متصل',
      hint: 'پیام‌های یادآوری و خوش‌آمدگویی فعال هستند.',
      lastCheckedAt: 'امروز 10:30',
    },
    {
      id: 'payment',
      title: 'درگاه پرداخت بیعانه آنلاین',
      providerName: 'زرین‌پال',
      status: 'connected',
      statusLabel: 'متصل',
      hint: 'تسویه حساب روزانه روی شماره شبا ثبت‌شده انجام می‌شود.',
      lastCheckedAt: 'امروز 08:00',
    },
  ];

  private cachedStatuses: IntegrationStatus[] = [];
  private cachedSidebarStatus: SidebarServiceStatus = {
    bookingActive: true,
    smsConnected: false,
    bookingStatusText: 'رزرو آنلاین فعال است',
    smsStatusText: 'پیامک هنوز متصل نیست',
  };

  private constructor() {
    this.updateCaches();
  }

  public static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }

  private updateCaches(): void {
    this.cachedStatuses = [...this.statuses];
    const booking = this.statuses.find((s) => s.id === 'online_booking');
    const sms = this.statuses.find((s) => s.id === 'sms');

    const bookingActive = booking?.status === 'connected';
    const smsConnected = sms?.status === 'connected';

    this.cachedSidebarStatus = {
      bookingActive,
      smsConnected,
      bookingStatusText: bookingActive ? 'رزرو آنلاین فعال است' : 'رزرو آنلاین غیرفعال است',
      smsStatusText: smsConnected ? 'پیامک متصل است' : 'پیامک هنوز متصل نیست',
    };
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  public getAllStatuses = (): IntegrationStatus[] => {
    return this.cachedStatuses;
  };

  public getSidebarStatus = (): SidebarServiceStatus => {
    return this.cachedSidebarStatus;
  };

  public updateStatus(id: string, status: 'connected' | 'not_connected' | 'disconnected'): void {
    const item = this.statuses.find((s) => s.id === id);
    if (item) {
      const canonicalStatus = status === 'connected' ? 'connected' : 'not_connected';
      item.status = canonicalStatus;
      item.statusLabel = canonicalStatus === 'connected' ? 'متصل' : 'قطع شده';
      this.updateCaches();
      this.notify();
    }
  }

  public isConnected(id: string): boolean {
    const item = this.statuses.find((s) => s.id === id);
    return item?.status === 'connected';
  }
}

export const integrationRegistry = IntegrationRegistry.getInstance();

export const useIntegrationStatuses = (): IntegrationStatus[] => {
  return useSyncExternalStore(
    integrationRegistry.subscribe,
    integrationRegistry.getAllStatuses,
    integrationRegistry.getAllStatuses
  );
};

export const useSidebarServiceStatus = (): SidebarServiceStatus => {
  return useSyncExternalStore(
    integrationRegistry.subscribe,
    integrationRegistry.getSidebarStatus,
    integrationRegistry.getSidebarStatus
  );
};
