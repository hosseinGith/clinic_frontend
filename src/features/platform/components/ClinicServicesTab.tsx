import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Tag,
  Coins,
} from 'lucide-react';
import {
  useClinicServices,
  useCreateClinicService,
  useUpdateClinicService,
  useDeleteClinicService,
} from '../hooks/usePlatformClinics';
import type { Service } from '../../../domain/service';
import { toPersianDigits } from '../../../lib/format';
import { formatRialToToman } from '../../../utils/currency';

interface ClinicServicesTabProps {
  clinicId: string;
  clinicName: string;
}

const CATEGORIES = [
  'پوست، مو و زیبایی',
  'عمومی و بالینی',
  'دندانپزشکی',
  'تزریقات و پانسمان',
  'لیزر و جوانسازی',
  'مشاوره و روانشناسی',
  'تغذیه و رژیم‌درمانی',
  'سایر خدمات',
];

export const ClinicServicesTab: React.FC<ClinicServicesTabProps> = ({ clinicId }) => {
  const { data: servicesList = [], isLoading, isError, refetch } = useClinicServices(clinicId);
  const createMutation = useCreateClinicService();
  const updateMutation = useUpdateClinicService();
  const deleteMutation = useDeleteClinicService();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [duration, setDuration] = useState(30);
  const [priceToman, setPriceToman] = useState<number | string>(0);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openCreateModal = () => {
    setEditingService(null);
    setName('');
    setCategory(CATEGORIES[0]);
    setDuration(30);
    setPriceToman(150000);
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (srv: Service) => {
    setEditingService(srv);
    setName(srv.name);
    setCategory(srv.category || CATEGORIES[0]);
    setDuration(srv.duration || 30);
    setPriceToman(srv.price || 0);
    setDescription(srv.description || '');
    setIsActive(srv.isActive);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('نام خدمت را وارد نمایید.');
      return;
    }
    setFormError(null);

    try {
      const payload: Partial<Service> = {
        name: name.trim(),
        category: category.trim() || 'عمومی',
        duration: Number(duration) || 30,
        price: Number(priceToman) || 0,
        description: description.trim() || undefined,
        isActive,
      };

      if (editingService) {
        await updateMutation.mutateAsync({
          clinicId,
          serviceId: editingService.id,
          payload,
        });
        showToast('خدمت با موفقیت ویرایش شد.');
      } else {
        await createMutation.mutateAsync({
          clinicId,
          payload,
        });
        showToast('خدمت جدید با موفقیت ایجاد گردید.');
      }

      setModalOpen(false);
      refetch();
    } catch (err: any) {
      setFormError(err?.message || 'خطا در ثبت خدمت');
    }
  };

  const handleDelete = async (srv: Service) => {
    if (!window.confirm(`آیا از حذف خدمت «${srv.name}» اطمینان دارید؟`)) return;
    try {
      await deleteMutation.mutateAsync({ clinicId, serviceId: srv.id });
      showToast(`خدمت «${srv.name}» با موفقیت حذف گردید.`);
      refetch();
    } catch (err: any) {
      alert(err?.message || 'خطا در حذف خدمت');
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            کاتالوگ خدمات، نرخ‌نامه و مدت زمان ارائه
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مدیریت خدمات قابل ارائه، تعرفه‌ها به تومان و تخصیص مدت زمان هر خدمت در نوبت‌دهی
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          تعریف خدمت جدید
        </button>
      </div>

      {/* Services List Table / Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">در حال دریافت کاتالوگ خدمات...</div>
      ) : isError ? (
        <div className="p-6 text-center text-xs text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20">
          خطا در دریافت لیست خدمات.
        </div>
      ) : servicesList.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">هنوز خدمتی برای این کلینیک تعریف نشده است.</p>
          <button
            onClick={openCreateModal}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg text-xs"
          >
            <Plus className="w-3 h-3" />
            تعریف اولین خدمت
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">عنوان خدمت</th>
                <th className="py-3 px-4 font-semibold">دسته‌بندی</th>
                <th className="py-3 px-4 font-semibold">مدت زمان</th>
                <th className="py-3 px-4 font-semibold">تعرفه (تومان)</th>
                <th className="py-3 px-4 font-semibold text-center">وضعیت</th>
                <th className="py-3 px-4 font-semibold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {servicesList.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-100">
                    <div className="flex flex-col">
                      <span>{srv.name}</span>
                      {srv.description && (
                        <span className="text-[11px] text-slate-400 font-normal mt-0.5">
                          {srv.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-teal-300 border border-slate-700/60">
                      <Tag className="w-3 h-3 text-teal-400" />
                      {srv.category || 'عمومی'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {toPersianDigits(srv.duration)} دقیقه
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-300">
                    {/* price is stored in Tomans in frontend Service domain */}
                    {formatRialToToman(srv.price * 10, { withUnit: true })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${srv.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                    >
                      {srv.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditModal(srv)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                        title="ویرایش"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-teal-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(srv)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Service Modal */}
      {modalOpen && (
        <div className="fixed !mt-0 inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                {editingService ? `ویرایش خدمت: ${editingService.name}` : 'تعریف خدمت جدید'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">عنوان خدمت</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: بوتاکس خط اخم و پیشانی"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">دسته‌بندی</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    مدت زمان خدمت
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value={15}>15 دقیقه</option>
                    <option value={20}>20 دقیقه</option>
                    <option value={30}>30 دقیقه</option>
                    <option value={45}>45 دقیقه</option>
                    <option value={60}>60 دقیقه (1 ساعت)</option>
                    <option value={90}>90 دقیقه</option>
                    <option value={120}>120 دقیقه (2 ساعت)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  قیمت خدمت به تومان
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    required
                    value={priceToman}
                    onChange={(e) => setPriceToman(e.target.value)}
                    placeholder="مثال: 450000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-teal-500 pl-16"
                  />
                  <span className="absolute left-3 top-2 text-xs text-slate-500 font-medium">
                    تومان
                  </span>
                </div>
                {Number(priceToman) > 0 && (
                  <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1 font-mono">
                    <Coins className="w-3 h-3" />
                    معادل:{' '}
                    {formatRialToToman(Number(priceToman) * 10, { withUnit: true })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  توضیحات تکمیلی خدمت (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات در فرم نوبت‌دهی برای بیمار نمایش داده می‌شود..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
                <span className="text-xs text-slate-300">خدمت فعال و قابل رزرو در فرم آنلاین</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {createMutation.isPending || updateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره خدمت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
