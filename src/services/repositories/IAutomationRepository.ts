import type { Automation, AutomationEvent, AutomationStats } from '../../domain/automation';

export interface IAutomationRepository {
  getAutomations(clinicId: string): Promise<Automation[]>;
  getStats(clinicId: string): Promise<AutomationStats>;
  triggerEvent(clinicId: string, event: AutomationEvent, payload: Record<string, unknown>): Promise<void>;
  setEnabled(clinicId: string, id: string, enabled: boolean): Promise<void>;
}
