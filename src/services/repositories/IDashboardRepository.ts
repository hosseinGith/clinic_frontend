import type { DashboardSummary, DashboardNextAction } from '../../domain/dashboard';

export interface IDashboardRepository {
  getSummary(clinicId: string): Promise<DashboardSummary>;
  getNextActions(clinicId: string): Promise<DashboardNextAction[]>;
}
