import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useClinic } from '../../app/contexts';
import { services } from '../../services';
import { queryKeys } from '../../services/queryKeys';
import { ROLE_LABELS } from '../../domain/session';
import type { AuditAction } from '../../domain/audit';

export const AuditLogsView: React.FC = () => {
  const { clinicId } = useClinic();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: queryKeys.audit.logs(clinicId),
    queryFn: () => services.auditRepo.getLogs(clinicId),
  });

  const getActionBadgeColor = (action: AuditAction) => {
    switch (action) {
      case 'auth.login_success':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'auth.login_failed':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'auth.logout':
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
      case 'medical_notes.view':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'user.role_change':
      case 'user.deactivated':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-teal-50 text-teal-800 border-teal-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#0f766e]" />
          <h1 className="text-xl font-bold text-neutral-900">گزارش‌های امنیتی و رویدادها (Audit Log)</h1>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          ثبت تغییرات حیاتی سیستم، ورود و خروج کاربران، مشاهده پرونده‌های حساس پزشکی و تغییرات وضعیت نوبت‌ها
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">زمان ثبت</th>
                <th className="py-3 px-4">کاربر / اقدام‌کننده</th>
                <th className="py-3 px-4">نقش</th>
                <th className="py-3 px-4">نوع رویداد</th>
                <th className="py-3 px-4">توضیحات و جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    در حال دریافت گزارش‌های امنیتی...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-400">
                    هیچ رویدادی ثبت نشده است.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]" dir="ltr">
                      {new Date(log.createdAt).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-neutral-900">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-neutral-500">
                        {ROLE_LABELS[log.role] || log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] border font-medium ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.actionLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-neutral-600 max-w-md truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
