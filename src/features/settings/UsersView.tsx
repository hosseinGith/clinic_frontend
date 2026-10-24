import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { useAuth, useClinic } from '../../app/contexts';
import { services } from '../../services';
import { queryKeys } from '../../services/queryKeys';
import { useDoctors } from '../catalog/hooks/useCatalog';
import type { Role, UserProfile } from '../../domain/session';
import { ROLE_LABELS } from '../../domain/session';
import { isValidIranianMobile } from '../../lib/phone';
import { toPersianDigits } from '../../lib/format';

export const UsersView: React.FC = () => {
  const { role: currentUserRole, user: currentUser, actor } = useAuth();
  const { clinicId } = useClinic();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('reception');
  const [roleTitle, setRoleTitle] = useState('کارشناس پذیرش');
  const [email, setEmail] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  // Modal for assigning doctor when changing role to doctor
  const [roleChangeModal, setRoleChangeModal] = useState<{
    user: UserProfile;
    newRole: Role;
  } | null>(null);
  const [roleChangeDoctorId, setRoleChangeDoctorId] = useState('');

  // Fetch doctors for clinic
  const { data: doctors = [] } = useDoctors(clinicId);

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: queryKeys.auth.users(clinicId),
    queryFn: () => services.authRepo.getUsers(clinicId),
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (userId: string) =>
      services.authRepo.toggleUserStatus(clinicId, userId, actor || undefined),
    onSuccess: () => {
      setTableError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.users(clinicId) });
    },
    onError: (err: unknown) => {
      setTableError(err instanceof Error ? err.message : 'خطا در تغییر وضعیت کاربر.');
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: ({
      userId,
      newRole,
      doctorId,
    }: {
      userId: string;
      newRole: Role;
      doctorId?: string;
    }) =>
      services.authRepo.updateUserRole(
        clinicId,
        userId,
        newRole,
        actor || undefined,
        doctorId
      ),
    onSuccess: () => {
      setTableError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.users(clinicId) });
      setRoleChangeModal(null);
      setRoleChangeDoctorId('');
    },
    onError: (err: unknown) => {
      setTableError(err instanceof Error ? err.message : 'خطا در تغییر نقش کاربر.');
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: () =>
      services.authRepo.createUser(
        clinicId,
        {
          name: name.trim(),
          phone: phone.trim(),
          role,
          roleTitle: roleTitle.trim() || ROLE_LABELS[role],
          email: email.trim() || undefined,
          doctorId: role === 'doctor' ? selectedDoctorId : undefined,
        },
        actor || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.users(clinicId) });
      setIsAddModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setSelectedDoctorId('');
      setFormError(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'خطا در ایجاد کاربر جدید.';
      setFormError(msg);
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isValidIranianMobile(phone)) {
      setFormError('شماره تلفن همراه معتبر نمی‌باشد (فرمت 0912...).');
      return;
    }

    // Doctor role must have doctorId
    if (role === 'doctor' && !selectedDoctorId) {
      setFormError('انتخاب پزشک معالج برای نقش پزشک متخصص الزامی است.');
      return;
    }

    // Role creation constraints: admin cannot create owner or admin
    if (currentUserRole === 'admin' && (role === 'owner' || role === 'admin')) {
      setFormError('مدیر عملیات تنها مجاز به ایجاد کاربران با نقش پذیرش، پزشک یا بیمار می‌باشد.');
      return;
    }

    createUserMutation.mutate();
  };

  const handleRoleSelectChange = (user: UserProfile, newRole: Role) => {
    setTableError(null);
    if (newRole === 'doctor' && !user.doctorId) {
      setRoleChangeModal({ user, newRole });
      setRoleChangeDoctorId('');
      return;
    }
    changeRoleMutation.mutate({ userId: user.id, newRole, doctorId: user.doctorId });
  };

  // Available roles for selection depending on current user role
  const availableRoles: Role[] =
    currentUserRole === 'owner'
      ? ['admin', 'reception', 'doctor', 'patient']
      : ['reception', 'doctor', 'patient'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0f766e]" />
            <h1 className="text-xl font-bold text-neutral-900">مدیریت کاربران و دسترسی‌ها</h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            مشاهده، افزودن، تغییر سطح دسترسی و فعال/غیرفعال‌سازی حساب‌های پرسنل و مراجعان
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>افزودن کاربر جدید</span>
        </Button>
      </div>

      {tableError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{tableError}</span>
          </div>
          <button
            onClick={() => setTableError(null)}
            className="text-xs text-neutral-400 hover:text-neutral-600"
          >
            بستن
          </button>
        </div>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
              <tr>
                <th className="py-3 px-4">کاربر</th>
                <th className="py-3 px-4">شماره همراه</th>
                <th className="py-3 px-4">نقش سیستمی</th>
                <th className="py-3 px-4">عنوان سازمانی</th>
                <th className="py-3 px-4">وضعیت حساب</th>
                <th className="py-3 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    در حال دریافت فهرست کاربران...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    هیچ کاربری یافت نشد.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isOwnerUser = u.role === 'owner';
                  const canManageThisUser =
                    !isSelf &&
                    (currentUserRole === 'owner' ||
                      (currentUserRole === 'admin' && !isOwnerUser && u.role !== 'admin'));

                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0f766e] flex items-center justify-center font-bold text-xs shrink-0">
                            {u.avatarInitials || u.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 block">{u.name}</span>
                            {u.email && (
                              <span className="text-[10px] text-neutral-400 block">{u.email}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-neutral-600" dir="ltr">
                        {toPersianDigits(u.phone)}
                      </td>

                      <td className="py-3 px-4">
                        {canManageThisUser ? (
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleSelectChange(u, e.target.value as Role)
                            }
                            className="px-2 py-1 border border-neutral-300 rounded text-xs bg-white focus:outline-none focus:border-[#0f766e]"
                          >
                            {availableRoles.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge className="text-neutral-700 bg-neutral-50 border border-neutral-200">
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-4 text-neutral-600">{u.roleTitle}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                          {u.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {canManageThisUser ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatusMutation.mutate(u.id)}
                            disabled={toggleStatusMutation.isPending}
                            className={`text-xs ${
                              u.isActive
                                ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-neutral-400">
                            {isSelf ? 'حساب جاری' : 'غیرقابل ویرایش'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="افزودن کاربر و تخصیص نقش"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              نام و نام خانوادگی <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: دکتر مهدی کاظمی"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              شماره تلفن همراه <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09123456789"
              className="w-full px-3 py-2 text-xs text-right border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e]"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              ورود کاربر با رمز یکبارمصرف پیامکی به این شماره انجام خواهد شد.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              نقش دسترسی در سامانه <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => {
                const newR = e.target.value as Role;
                setRole(newR);
                setRoleTitle(ROLE_LABELS[newR] || '');
              }}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e] bg-white"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {role === 'doctor' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                انتخاب پزشک معالج <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e] bg-white"
              >
                <option value="">انتخاب پزشک از سیستم...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-400 mt-1">
                دسترسی پزشک فقط به نوبت‌ها و مراجعان پرونده خودش محدود خواهد شد.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              عنوان شغلی / سازمانی <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="مثال: پزشک متخصص پوست / کارشناس پذیرش"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-800 mb-1">
              پست الکترونیکی (اختیاری)
            </label>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@ariana.clinic"
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e]"
            />
          </div>

          <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddModalOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'در حال ثبت...' : 'ثبت و فعال‌سازی کاربر'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Doctor Modal for Role Update */}
      <Modal
        isOpen={Boolean(roleChangeModal)}
        onClose={() => setRoleChangeModal(null)}
        title="تخصیص شناسه پزشک معالج به کاربر"
        maxWidth="max-w-md"
      >
        {roleChangeModal && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-600 leading-relaxed">
              برای تغییر نقش کاربر <strong>{roleChangeModal.user.name}</strong> به پزشک متخصص، انتخاب پرونده پزشک متناظر در کلینیک الزامی است:
            </p>

            <div>
              <label className="block text-xs font-semibold text-neutral-800 mb-1">
                پزشک متناظر <span className="text-rose-500">*</span>
              </label>
              <select
                value={roleChangeDoctorId}
                onChange={(e) => setRoleChangeDoctorId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-[#0f766e] bg-white"
              >
                <option value="">انتخاب پزشک معالج...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setRoleChangeModal(null)}
              >
                انصراف
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!roleChangeDoctorId || changeRoleMutation.isPending}
                onClick={() =>
                  changeRoleMutation.mutate({
                    userId: roleChangeModal.user.id,
                    newRole: 'doctor',
                    doctorId: roleChangeDoctorId,
                  })
                }
              >
                {changeRoleMutation.isPending ? 'در حال ثبت...' : 'تأیید و ذخیره'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
