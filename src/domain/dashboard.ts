export interface DashboardMetric {
  id: 'today' | 'hot' | 'at_risk' | 'response';
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  iconName?: 'calendar' | 'flame' | 'alert-triangle' | 'message-circle';
}

export interface DashboardNextAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  value: string; // e.g. "12٬800٬000 تومان"
  valueLabel: string; // e.g. "فرصت فروش" یا "کاهش کنسلی"
  actionType: 'call_clients' | 'reply_leads' | 'confirm_tomorrow';
}

export interface DashboardSummary {
  todayAppointmentsCount: number;
  todayDelta: string;
  hotLeadsCount: number;
  decisionReadyCount: number;
  atRiskClientsCount: number;
  recoveryValueText: string;
  responseRateText: string;
  responseRateDelta: string;
  metrics: DashboardMetric[];
}
