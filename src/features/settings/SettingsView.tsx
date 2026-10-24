import React from 'react';
import { integrationRegistry, useIntegrationStatuses } from '../../integrations/registry';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Radio } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const statuses = useIntegrationStatuses();

  const handleToggle = (id: string, current: string) => {
    const next = current === 'connected' ? 'not_connected' : 'connected';
    integrationRegistry.updateStatus(id, next);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          تنظیمات و اتصال سرویس‌ها
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          مدیریت اتصال به ارائه‌دهندگان بیرونی (پیامک، واتساپ، درگاه پرداخت و رزرو آنلاین)
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#0f766e]" />
            <h2 className="text-sm font-bold text-neutral-900">
              رجیستری ارتباط با ارائه‌دهندگان سرویس (Integration Registry)
            </h2>
          </div>
          <span className="text-xs text-neutral-400">وضعیت زنده پورت‌ها</span>
        </div>

        <div className="divide-y divide-neutral-200">
          {statuses.map((item) => {
            const isConnected = item.status === 'connected';

            return (
              <div
                key={item.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isConnected ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-400 ring-2 ring-amber-100'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-neutral-900">
                      {item.title}
                    </h3>
                    <span className="text-xs text-neutral-400">
                      ({item.providerName})
                    </span>
                  </div>

                  <p className="text-xs text-neutral-500">
                    {item.hint}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {item.statusLabel}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(item.id, item.status)}
                    className="text-xs"
                  >
                    {isConnected ? 'قطع اتصال' : 'اتصال سرویس'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
