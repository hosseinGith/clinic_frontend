import React from 'react';
import { useClinic } from '../../app/contexts';
import { useOutboxMessages } from './hooks/useMessages';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { formatPhoneNumber } from '../../lib/format';
import { formatIsoToJalali } from '../../lib/jalali';

export const MessagesView: React.FC = () => {
  const { clinicId } = useClinic();
  const { data: messages = [], isLoading, isError, refetch } = useOutboxMessages(clinicId);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          صندوق پیام‌های ارسالی (Outbox)
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          گزارش و رهگیری پیامک‌ها و اعلان‌های واتساپ ارسال‌شده توسط موتور اتوماسیون
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            هنوز پیامی ارسال نشده است.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/50 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        msg.channel === 'whatsapp'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {msg.channel === 'whatsapp' ? 'واتساپ' : 'پیامک'}
                    </span>
                    <span className="text-xs font-bold text-neutral-900">
                      گیرنده: {msg.recipientName} ({formatPhoneNumber(msg.recipientPhone)})
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed bg-neutral-50/80 p-2.5 rounded-lg border border-neutral-100">
                    {msg.content}
                  </p>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between text-xs gap-1 shrink-0">
                  {msg.status === 'sent' && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium text-[11px]">
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ارسال موفق
                    </span>
                  )}
                  {msg.status === 'pending' && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        در انتظار ارسال
                      </span>
                      {msg.scheduledFor && (
                        <span className="text-[10px] text-amber-800">
                          زمان‌بندی‌شده برای: {formatIsoToJalali(msg.scheduledFor)}
                        </span>
                      )}
                    </div>
                  )}
                  {msg.status === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      خطا در ارسال
                    </span>
                  )}
                  <span className="text-[11px] text-neutral-400">{msg.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
