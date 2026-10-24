import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Ban,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from 'lucide-react';
import { services } from '../../services';
import { platformQueryKeys } from '../../services/queryKeys';
import type { Invoice, InvoiceStatus } from '../../types/platform/billing';
import type { RecordManualPaymentDto, VoidInvoiceDto } from '../../services/repositories/IPlatformBillingRepository';
import { formatRialToToman } from '../../utils/currency';
import { toPersianDigits } from '../../utils/toPersianDigits';

export const PlatformInvoicesView: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | ''>('');
  const [clinicIdFilter, setClinicIdFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [voidModalInvoice, setVoidModalInvoice] = useState<Invoice | null>(null);

  const { data: invoicesData, isLoading, error } = useQuery({
    queryKey: platformQueryKeys.invoices({
      status: selectedStatus || undefined,
      clinicId: clinicIdFilter || undefined,
      page,
      limit,
    }),
    queryFn: () =>
      services.platformBillingRepo.getInvoices({
        status: selectedStatus || undefined,
        clinicId: clinicIdFilter || undefined,
        page,
        limit,
      }),
  });

  const invoices = invoicesData?.items || [];
  const total = invoicesData?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const exportUrl = services.platformBillingRepo.getInvoicesExportUrl({
    status: selectedStatus || undefined,
    clinicId: clinicIdFilter || undefined,
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <FileText className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-bold text-slate-100">فاکتورها و پرداخت‌ها</h1>
          </div>
          <p className="text-xs text-slate-400">
            مشاهده وضعیت فاکتورهای دوره‌ای، ثبت واریز دستی/کارت‌به‌کارت با کلید یکتایی و ابطال فاکتورهای باز
          </p>
        </div>

        <a
          href={exportUrl}
          download="invoices.csv"
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-medium transition-all shadow-sm"
        >
          <Download className="w-4 h-4 text-teal-400" strokeWidth={1.75} />
          <span>خروجی اکسل (CSV)</span>
        </a>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl shadow-xl shadow-black/20">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-teal-500 transition-all">
            <Filter className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as InvoiceStatus | '');
                setPage(1);
              }}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">همه وضعیت‌ها</option>
              <option value="open" className="bg-slate-900">پرداخت‌نشده (Open)</option>
              <option value="paid" className="bg-slate-900">پرداخت‌شده (Paid)</option>
              <option value="void" className="bg-slate-900">باطل‌شده (Void)</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="text"
              value={clinicIdFilter}
              onChange={(e) => {
                setClinicIdFilter(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو با شناسه کلینیک..."
              className="bg-slate-950/70 border border-slate-800 rounded-xl pl-3 pr-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 font-mono transition-all w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" strokeWidth={1.75} />
          </div>
        </div>

        <div className="text-xs text-slate-400">
          مجموع: <span className="font-bold text-slate-100 font-mono">{toPersianDigits(total)}</span> فاکتور
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-xl">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">در حال بارگذاری فاکتورها...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />
            <span>خطا در بارگذاری: {(error as Error).message}</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" strokeWidth={1.5} />
            هیچ فاکتوری با این فیلترها یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">شماره فاکتور</th>
                  <th className="py-3 px-4">کلینیک</th>
                  <th className="py-3 px-4">مبلغ</th>
                  <th className="py-3 px-4">دوره اشتراک</th>
                  <th className="py-3 px-4">سررسید</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-slate-700/60 text-xs">
                        {inv.number}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-100 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
                        <span>{inv.clinicName || inv.clinicId}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">{inv.clinicId}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100 font-mono">
                      {formatRialToToman(inv.amount)} <span className="text-[11px] font-normal text-slate-400">تومان</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                      <span>{inv.periodStart.slice(0, 10)}</span> تا <span>{inv.periodEnd.slice(0, 10)}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {inv.dueDate ? inv.dueDate.slice(0, 10) : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'paid' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          پرداخت‌شده
                        </span>
                      )}
                      {inv.status === 'open' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          پرداخت‌نشده
                        </span>
                      )}
                      {inv.status === 'void' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          باطل‌شده
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {inv.status === 'open' ? (
                          <>
                            <button
                              onClick={() => setPaymentModalInvoice(inv)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all shadow-sm shadow-emerald-600/20"
                            >
                              <CreditCard className="w-3 h-3" strokeWidth={1.75} />
                              ثبت واریز
                            </button>
                            <button
                              onClick={() => setVoidModalInvoice(inv)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors"
                            >
                              <Ban className="w-3 h-3 text-rose-400" strokeWidth={1.75} />
                              ابطال
                            </button>
                          </>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              صفحه قبل
            </button>
            <span className="text-xs text-slate-400">
              صفحه <span className="font-bold text-slate-200 font-mono">{toPersianDigits(page)}</span> از{' '}
              <span className="font-bold text-slate-200 font-mono">{toPersianDigits(totalPages)}</span>
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs disabled:opacity-40 hover:bg-slate-800 transition-colors"
            >
              صفحه بعد
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Manual Payment Modal */}
      {paymentModalInvoice && (
        <ManualPaymentModal
          invoice={paymentModalInvoice}
          onClose={() => setPaymentModalInvoice(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'invoices'] });
            queryClient.invalidateQueries({ queryKey: ['platform', 'revenueSummary'] });
            setPaymentModalInvoice(null);
          }}
        />
      )}

      {/* Void Invoice Modal */}
      {voidModalInvoice && (
        <VoidInvoiceModal
          invoice={voidModalInvoice}
          onClose={() => setVoidModalInvoice(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['platform', 'invoices'] });
            setVoidModalInvoice(null);
          }}
        />
      )}
    </div>
  );
};

// Modal for recording manual payment with double-click protection and idempotency
interface ManualPaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({ invoice, onClose, onSuccess }) => {
  const [idempotencyKey] = useState<string>(
    () => `manual-${invoice.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  );
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const paymentMutation = useMutation({
    mutationFn: (dto: RecordManualPaymentDto) => services.platformBillingRepo.recordManualPayment(dto),
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'خطا در ثبت پرداخت');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMutation.isPending) return;

    setErrorMsg(null);
    paymentMutation.mutate({
      invoiceId: invoice.id,
      amount: invoice.amount,
      idempotencyKey,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed  !m-0 inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <CreditCard className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-100">ثبت واریز دستی فاکتور</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-4 bg-slate-950/70 rounded-xl space-y-2.5 border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">شماره فاکتور:</span>
              <span className="font-mono text-teal-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {invoice.number}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">کلینیک:</span>
              <span className="text-slate-200 font-medium">{invoice.clinicName || invoice.clinicId}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400">مبلغ قابل واریز:</span>
              <span className="font-bold text-emerald-400 text-sm font-mono">
                {formatRialToToman(invoice.amount)} <span className="text-xs font-normal text-slate-400">تومان</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">یادداشت و اطلاعات تراکنش (اختیاری)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: شماره پیگیری کارت‌به‌کارت بانک سامان..."
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={paymentMutation.isPending}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              id="confirm-manual-payment-btn"
              disabled={paymentMutation.isPending}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
            >
              {paymentMutation.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال ثبت و اعمال اشتراک...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                  <span>تایید پرداخت و تمدید اشتراک</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal for voiding an open invoice
interface VoidInvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}

const VoidInvoiceModal: React.FC<VoidInvoiceModalProps> = ({ invoice, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const voidMutation = useMutation({
    mutationFn: (dto: VoidInvoiceDto) => services.platformBillingRepo.voidInvoice(invoice.id, dto),
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'خطا در ابطال فاکتور');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('ذکر دلیل ابطال فاکتور الزامی است');
      return;
    }
    setErrorMsg(null);
    voidMutation.mutate({ reason: reason.trim() });
  };

  return (
    <div className="fixed  !m-0 inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Ban className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <h3 className="text-sm font-bold text-slate-100">ابطال فاکتور {invoice.number}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          فاکتور باطل‌شده دیگر قابل پرداخت نخواهد بود و اشتراک مربوطه تمدید نمی‌شود.
        </p>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" strokeWidth={1.75} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">دلیل ابطال *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: تغییر پلن در اواسط دوره یا صدور اشتباه"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={voidMutation.isPending}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={voidMutation.isPending}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold disabled:opacity-50 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
            >
              {voidMutation.isPending ? 'در حال ابطال...' : 'ابطال فاکتور'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

