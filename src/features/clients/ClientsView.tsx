import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClinic } from '../../app/contexts';
import { useClients } from './hooks/useClients';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/common/ErrorState';
import { formatCurrency, toPersianDigits, getInitials, formatPhoneNumber } from '../../lib/format';
import { Search, UserCheck, AlertTriangle } from 'lucide-react';

import { useDebounce } from '../../lib/useDebounce';

export const ClientsView: React.FC = () => {
  const { clinicId } = useClinic();
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get('status');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data: clients = [], isLoading, isError, refetch } = useClients(clinicId, debouncedSearch);

  const displayedClients = statusParam
    ? clients.filter((c) => c.status === statusParam)
    : clients;

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          مدیریت مراجعان و پرونده‌ها
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          پرونده‌های فعال، مراجعان وفادار و پایش مشتریان در خطر ریزش
        </p>
      </div>

      <Card className="p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute inset-y-0 right-3 my-auto text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام یا تلفن مراجع..."
            className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#0f766e]"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/60 text-neutral-500 text-xs font-medium">
                  <th scope="col" className="h-11 px-4 text-right">مراجع</th>
                  <th scope="col" className="h-11 px-4 text-right">شماره تماس</th>
                  <th scope="col" className="h-11 px-4 text-right">تعداد مراجعه</th>
                  <th scope="col" className="h-11 px-4 text-right">مجموع پرداختی</th>
                  <th scope="col" className="h-11 px-4 text-right">وضعیت</th>
                  <th scope="col" className="h-11 px-4 text-right">ارزش بازیابی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-sm text-neutral-900">
                {displayedClients.map((client) => {
                  const isAtRisk = client.status === 'at_risk';
                  return (
                    <tr key={client.id} className="h-14 hover:bg-neutral-50/60 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                            isAtRisk ? 'bg-amber-100 text-amber-800' : 'bg-teal-50 text-[#0f766e]'
                          }`}>
                            {getInitials(client.name)}
                          </div>
                          <span className="font-semibold text-xs sm:text-sm text-neutral-900">
                            {client.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                        {formatPhoneNumber(client.phone)}
                      </td>
                      <td className="px-4 text-xs sm:text-sm text-neutral-700 whitespace-nowrap">
                        {toPersianDigits(client.totalVisits)} بار
                      </td>
                      <td className="px-4 text-xs sm:text-sm font-semibold text-neutral-900 whitespace-nowrap">
                        {formatCurrency(client.totalSpent)}
                      </td>
                      <td className="px-4 whitespace-nowrap">
                        {isAtRisk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            در خطر ریزش
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            فعال
                          </span>
                        )}
                      </td>
                      <td className="px-4 text-xs font-bold text-[#0f766e] whitespace-nowrap">
                        {client.recoveryValue ? formatCurrency(client.recoveryValue) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
