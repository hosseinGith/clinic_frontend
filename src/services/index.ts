import { env } from '../config/env';
import type { IAppointmentRepository } from './repositories/IAppointmentRepository';
import type { IClientRepository } from './repositories/IClientRepository';
import type { ILeadRepository } from './repositories/ILeadRepository';
import type { ICatalogRepository } from './repositories/ICatalogRepository';
import type { IAutomationRepository } from './repositories/IAutomationRepository';
import type { IDashboardRepository } from './repositories/IDashboardRepository';
import type { IBookingRepository } from './repositories/IBookingRepository';
import type { IMessageRepository } from './repositories/IMessageRepository';
import type { IAuthRepository } from './repositories/IAuthRepository';
import type { IAuditRepository } from './repositories/IAuditRepository';

import type { IPlatformAuthRepository } from './repositories/IPlatformAuthRepository';
import type { IPlatformClinicRepository } from './repositories/IPlatformClinicRepository';
import type { IPlatformBillingRepository } from './repositories/IPlatformBillingRepository';
import type { ISubscriptionRepository } from './repositories/ISubscriptionRepository';

import { MockAppointmentRepository } from './adapters/mock/MockAppointmentRepository';
import { MockClientRepository } from './adapters/mock/MockClientRepository';
import { MockLeadRepository } from './adapters/mock/MockLeadRepository';
import { MockCatalogRepository } from './adapters/mock/MockCatalogRepository';
import { MockAutomationRepository } from './adapters/mock/MockAutomationRepository';
import { MockDashboardRepository } from './adapters/mock/MockDashboardRepository';
import { MockBookingRepository } from './adapters/mock/MockBookingRepository';
import { MockMessageRepository } from './adapters/mock/MockMessageRepository';
import { MockAuthRepository } from './adapters/mock/MockAuthRepository';
import { MockAuditRepository } from './adapters/mock/MockAuditRepository';
import { MockPlatformAuthRepository } from './adapters/mock/MockPlatformAuthRepository';
import { MockPlatformClinicRepository } from './adapters/mock/MockPlatformClinicRepository';
import { MockPlatformBillingRepository } from './adapters/mock/MockPlatformBillingRepository';
import { MockSubscriptionRepository } from './adapters/mock/MockSubscriptionRepository';

import {
  HttpAppointmentRepository,
  HttpClientRepository,
  HttpLeadRepository,
  HttpCatalogRepository,
  HttpAutomationRepository,
  HttpDashboardRepository,
  HttpBookingRepository,
  HttpMessageRepository,
  HttpAuthRepository,
  HttpAuditRepository,
  HttpPlatformAuthRepository,
  HttpPlatformClinicRepository,
  HttpPlatformBillingRepository,
  HttpSubscriptionRepository,
} from './adapters/http';

export interface ServiceContainer {
  appointmentRepo: IAppointmentRepository;
  clientRepo: IClientRepository;
  leadRepo: ILeadRepository;
  catalogRepo: ICatalogRepository;
  automationRepo: IAutomationRepository;
  dashboardRepo: IDashboardRepository;
  bookingRepo: IBookingRepository;
  messageRepo: IMessageRepository;
  authRepo: IAuthRepository;
  auditRepo: IAuditRepository;
  platformAuthRepo: IPlatformAuthRepository;
  platformClinicRepo: IPlatformClinicRepository;
  platformBillingRepo: IPlatformBillingRepository;
  subscriptionRepo: ISubscriptionRepository;
}

const createServiceContainer = (): ServiceContainer => {
  const isProduction = import.meta.env.PROD;
  const isHttp = isProduction || env.dataSource === 'http';

  // In production, platform adapters MUST strictly be Http-based to guarantee zero mock OTP / bypass leakage
  const platformAuthRepo = isHttp
    ? new HttpPlatformAuthRepository()
    : new MockPlatformAuthRepository();

  const platformClinicRepo = isHttp
    ? new HttpPlatformClinicRepository()
    : new MockPlatformClinicRepository();

  const platformBillingRepo = isHttp
    ? new HttpPlatformBillingRepository()
    : new MockPlatformBillingRepository();

  const subscriptionRepo = isHttp
    ? new HttpSubscriptionRepository()
    : new MockSubscriptionRepository();

  if (isHttp) {
    return {
      appointmentRepo: new HttpAppointmentRepository(),
      clientRepo: new HttpClientRepository(),
      leadRepo: new HttpLeadRepository(),
      catalogRepo: new HttpCatalogRepository(),
      automationRepo: new HttpAutomationRepository(),
      dashboardRepo: new HttpDashboardRepository(),
      bookingRepo: new HttpBookingRepository(),
      messageRepo: new HttpMessageRepository(),
      authRepo: new HttpAuthRepository(),
      auditRepo: new HttpAuditRepository(),
      platformAuthRepo,
      platformClinicRepo,
      platformBillingRepo,
      subscriptionRepo,
    };
  }

  return {
    appointmentRepo: new MockAppointmentRepository(),
    clientRepo: new MockClientRepository(),
    leadRepo: new MockLeadRepository(),
    catalogRepo: new MockCatalogRepository(),
    automationRepo: new MockAutomationRepository(),
    dashboardRepo: new MockDashboardRepository(),
    bookingRepo: new MockBookingRepository(),
    messageRepo: new MockMessageRepository(),
    authRepo: new MockAuthRepository(),
    auditRepo: new MockAuditRepository(),
    platformAuthRepo,
    platformClinicRepo,
    platformBillingRepo,
    subscriptionRepo,
  };
};

export const services = createServiceContainer();
