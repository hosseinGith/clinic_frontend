import type { IDashboardRepository } from '../../repositories/IDashboardRepository';
import type { DashboardSummary, DashboardNextAction } from '../../../domain/dashboard';
import { mockStorage, simulateDelay } from './mockStorage';
import { getTodayDateString } from '../../../lib/jalali';
import { toPersianDigits } from '../../../lib/format';

export class MockDashboardRepository implements IDashboardRepository {
  async getSummary(clinicId: string): Promise<DashboardSummary> {
    await simulateDelay();
    const today = getTodayDateString();

    const appointments = mockStorage
      .getAppointments()
      .filter((a) => a.clinicId === clinicId && a.date === today);

    const leads = mockStorage
      .getLeads()
      .filter((l) => l.clinicId === clinicId && l.status === 'hot');

    const decisionReady = leads.filter((l) => l.isDecisionReady);

    const atRiskClients = mockStorage
      .getClients()
      .filter((c) => c.clinicId === clinicId && c.status === 'at_risk');

    const totalRecoveryValue = atRiskClients.reduce(
      (sum, c) => sum + (c.recoveryValue || 0),
      0
    );

    const recoveryValueInMillion = (totalRecoveryValue / 1000000).toFixed(1);

    const todayCount = appointments.length; // 24 from seed
    const hotCount = leads.length; // 7 from seed
    const decisionCount = decisionReady.length; // 3 from seed
    const atRiskCount = atRiskClients.length; // 3 from seed

    return {
      todayAppointmentsCount: todayCount,
      todayDelta: '↑ 4 نسبت به دیروز',
      hotLeadsCount: hotCount,
      decisionReadyCount: decisionCount,
      atRiskClientsCount: atRiskCount,
      recoveryValueText: `${toPersianDigits(recoveryValueInMillion)} میلیون ارزش بازیابی`,
      responseRateText: '92٪',
      responseRateDelta: '↑ 8٪ این هفته',
      metrics: [
        {
          id: 'today',
          label: 'نوبت امروز',
          value: toPersianDigits(todayCount),
          delta: '↑ 4 نسبت به دیروز',
          iconName: 'calendar',
        },
        {
          id: 'hot',
          label: 'سرنخ داغ',
          value: toPersianDigits(hotCount),
          hint: `${toPersianDigits(decisionCount)} نفر آماده تصمیمگیری`,
          iconName: 'flame',
        },
        {
          id: 'at_risk',
          label: 'مشتری در خطر',
          value: toPersianDigits(atRiskCount),
          hint: `${toPersianDigits(recoveryValueInMillion)} میلیون ارزش بازیابی`,
          iconName: 'alert-triangle',
        },
        {
          id: 'response',
          label: 'نرخ پاسخگویی',
          value: '92٪',
          delta: '↑ 8٪ این هفته',
          iconName: 'message-circle',
        },
      ],
    };
  }

  async getNextActions(_clinicId: string): Promise<DashboardNextAction[]> {
    await simulateDelay();
    return mockStorage.getNextActions();
  }
}
