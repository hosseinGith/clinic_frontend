import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';

import { RequireAuth } from '../components/auth/RequireAuth';
import { RequirePermission } from '../components/auth/RequirePermission';
import { RequireRole } from '../components/auth/RequireRole';
import { RequirePlatformAuth } from '../features/platform/guards/RequirePlatformAuth';

const LoginView = lazy(() => import('../features/auth/LoginView').then((m) => ({ default: m.LoginView })));
const DashboardView = lazy(() => import('../features/dashboard/DashboardView').then((m) => ({ default: m.DashboardView })));
const AppointmentsView = lazy(() => import('../features/appointments/AppointmentsView').then((m) => ({ default: m.AppointmentsView })));
const ClientsView = lazy(() => import('../features/clients/ClientsView').then((m) => ({ default: m.ClientsView })));
const LeadsView = lazy(() => import('../features/leads/LeadsView').then((m) => ({ default: m.LeadsView })));
const MessagesView = lazy(() => import('../features/messages/MessagesView').then((m) => ({ default: m.MessagesView })));
const SettingsView = lazy(() => import('../features/settings/SettingsView').then((m) => ({ default: m.SettingsView })));
const MySubscriptionView = lazy(() => import('../features/settings/MySubscriptionView').then((m) => ({ default: m.MySubscriptionView })));
const UsersView = lazy(() => import('../features/settings/UsersView').then((m) => ({ default: m.UsersView })));
const AuditLogsView = lazy(() => import('../features/settings/AuditLogsView').then((m) => ({ default: m.AuditLogsView })));
const MarketingView = lazy(() => import('../features/marketing/MarketingView').then((m) => ({ default: m.MarketingView })));
const ReportsView = lazy(() => import('../features/reports/ReportsView').then((m) => ({ default: m.ReportsView })));
const DoctorView = lazy(() => import('../features/doctor/DoctorView').then((m) => ({ default: m.DoctorView })));
const PatientView = lazy(() => import('../features/patient/PatientView').then((m) => ({ default: m.PatientView })));
const BookingView = lazy(() => import('../features/booking/BookingView').then((m) => ({ default: m.BookingView })));

const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const PlatformLayout = lazy(() => import('../components/layout/PlatformLayout').then((m) => ({ default: m.PlatformLayout })));
const PlatformLoginView = lazy(() => import('../features/platform/PlatformLoginView').then((m) => ({ default: m.PlatformLoginView })));
const PlatformDashboardView = lazy(() => import('../features/platform/PlatformDashboardView').then((m) => ({ default: m.PlatformDashboardView })));
const PlatformClinicsView = lazy(() => import('../features/platform/PlatformClinicsView').then((m) => ({ default: m.PlatformClinicsView })));
const PlatformClinicDetailsView = lazy(() => import('../features/platform/PlatformClinicDetailsView').then((m) => ({ default: m.PlatformClinicDetailsView })));
const PlatformPlansView = lazy(() => import('../features/platform/PlatformPlansView').then((m) => ({ default: m.PlatformPlansView })));
const PlatformInvoicesView = lazy(() => import('../features/platform/PlatformInvoicesView').then((m) => ({ default: m.PlatformInvoicesView })));
const PlatformRevenueView = lazy(() => import('../features/platform/PlatformRevenueView').then((m) => ({ default: m.PlatformRevenueView })));

const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-[3px] border-[#0f766e] border-t-transparent rounded-full animate-spin" />
    <span className="text-xs text-neutral-400">در حال بارگذاری صفحه...</span>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
      {/* 1. Public Authentication Route */}
      <Route path="/login" element={<LoginView />} />

      {/* 2. Public Client-Facing Booking Wizard */}
      <Route path="/book/:clinicSlug" element={<BookingView />} />

      {/* 3. Forbidden Error Page */}
      <Route path="/403" element={<ForbiddenPage />} />

      {/* 4. Patient Portal Route */}
      <Route
        path="/me"
        element={
          <RequireAuth>
            <RequireRole roles={['patient']}>
              <PatientView />
            </RequireRole>
          </RequireAuth>
        }
      />

      {/* 5. Doctor Specialized Portal Route */}
      <Route
        path="/doctor"
        element={
          <RequireAuth>
            <RequireRole roles={['doctor']}>
              <AppLayout>
                <DoctorView />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />

      {/* 6. Clinic Operations & Management Routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <RequirePermission permission="appointments:read">
              <AppLayout>
                <DashboardView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/appointments"
        element={
          <RequireAuth>
            <RequirePermission permission="appointments:read">
              <AppLayout>
                <AppointmentsView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/clients"
        element={
          <RequireAuth>
            <RequirePermission permission="clients:read">
              <AppLayout>
                <ClientsView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/leads"
        element={
          <RequireAuth>
            <RequirePermission permission="leads:read">
              <AppLayout>
                <LeadsView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/messages"
        element={
          <RequireAuth>
            <RequirePermission permission="messages:read">
              <AppLayout>
                <MessagesView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/marketing"
        element={
          <RequireAuth>
            <RequirePermission permission="marketing:manage">
              <AppLayout>
                <MarketingView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/reports"
        element={
          <RequireAuth>
            <RequirePermission permission="reports:read">
              <AppLayout>
                <ReportsView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/settings"
        element={
          <RequireAuth>
            <RequirePermission permission="settings:manage">
              <AppLayout>
                <SettingsView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/settings/subscription"
        element={
          <RequireAuth>
            <RequireRole roles={['owner', 'admin']}>
              <AppLayout>
                <MySubscriptionView />
              </AppLayout>
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route
        path="/settings/users"
        element={
          <RequireAuth>
            <RequirePermission permission="users:manage">
              <AppLayout>
                <UsersView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      <Route
        path="/settings/audit-logs"
        element={
          <RequireAuth>
            <RequirePermission permission="audit:read">
              <AppLayout>
                <AuditLogsView />
              </AppLayout>
            </RequirePermission>
          </RequireAuth>
        }
      />

      {/* 7. Platform SuperAdmin Routes */}
      <Route path="/platform/login" element={<PlatformLoginView />} />
      <Route
        path="/platform"
        element={
          <RequirePlatformAuth>
            <PlatformLayout>
              <PlatformDashboardView />
            </PlatformLayout>
          </RequirePlatformAuth>
        }
      />
      <Route
        path="/platform/clinics"
        element={
          <RequirePlatformAuth>
            <PlatformLayout>
              <PlatformClinicsView />
            </PlatformLayout>
          </RequirePlatformAuth>
        }
      />
      <Route
        path="/platform/clinics/:id"
        element={
          <RequirePlatformAuth>
            <PlatformLayout>
              <PlatformClinicDetailsView />
            </PlatformLayout>
          </RequirePlatformAuth>
        }
      />
      <Route
        path="/platform/plans"
        element={
          <RequirePlatformAuth>
            <PlatformLayout>
              <PlatformPlansView />
            </PlatformLayout>
          </RequirePlatformAuth>
        }
      />
      <Route
        path="/platform/invoices"
        element={
          <RequirePlatformAuth>
            <PlatformLayout>
              <PlatformInvoicesView />
            </PlatformLayout>
          </RequirePlatformAuth>
        }
      />
      <Route
        path="/platform/revenue"
        element={
          <RequirePlatformAuth>
            <PlatformLayout>
              <PlatformRevenueView />
            </PlatformLayout>
          </RequirePlatformAuth>
        }
      />

      {/* 8. Fallback Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
};
