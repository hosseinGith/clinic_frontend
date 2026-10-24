import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '../app/contexts';
import { RequireRole } from '../components/auth/RequireRole';
import { RequirePermission } from '../components/auth/RequirePermission';
import { Can } from '../components/auth/Can';
import { SEED_CLINIC } from '../mocks/seed';
import type { Role, UserProfile, UserSession, Actor } from '../domain/session';

function createMockAuthContext(role: Role | null, isLoading = false): AuthContextValue {
  const user: UserProfile | null = role
    ? {
        id: 'usr-test',
        name: 'کاربر تست',
        phone: '09121110000',
        role,
        roleTitle: 'نقش آزمایشی',
        avatarInitials: 'ت',
        isActive: true,
        createdAt: '1403/01/01',
      }
    : null;

  const session: UserSession | null = user
    ? {
        token: 'test-token',
        user,
        activeClinic: SEED_CLINIC,
        availableClinics: [SEED_CLINIC],
        isAuthenticated: true,
      }
    : null;

  const actor: Actor | null = user
    ? {
        userId: user.id,
        userName: user.name,
        role: user.role,
        clinicId: SEED_CLINIC.id,
      }
    : null;

  return {
    user,
    role,
    session,
    isAuthenticated: !!user,
    isLoading,
    actor,
    requestOtp: async () => ({ success: true, message: 'ارسال شد', expiresInSeconds: 120 }),
    verifyOtp: async () => ({ success: true, session: session ?? undefined }),
    logout: async () => {},
    updateProfileName: async () => {},
  };
}

describe('Auth Guards & Access Control Components', () => {
  describe('RequireRole', () => {
    it('renders child content when user has the required role', () => {
      const authValue = createMockAuthContext('patient');

      render(
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={['/me']}>
            <Routes>
              <Route
                path="/me"
                element={
                  <RequireRole roles={['patient']}>
                    <div>پورتال اختصاصی بیمار</div>
                  </RequireRole>
                }
              />
              <Route path="/403" element={<div>عدم دسترسی 403</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('پورتال اختصاصی بیمار')).toBeTruthy();
      expect(screen.queryByText('عدم دسترسی 403')).toBeNull();
    });

    it('redirects to /403 when user does not have the required role', () => {
      const authValue = createMockAuthContext('reception');

      render(
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={['/me']}>
            <Routes>
              <Route
                path="/me"
                element={
                  <RequireRole roles={['patient']}>
                    <div>پورتال اختصاصی بیمار</div>
                  </RequireRole>
                }
              />
              <Route path="/403" element={<div>عدم دسترسی 403</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.queryByText('پورتال اختصاصی بیمار')).toBeNull();
      expect(screen.getByText('عدم دسترسی 403')).toBeTruthy();
    });

    it('doctor portal only allows doctor role', () => {
      const patientAuth = createMockAuthContext('patient');

      render(
        <AuthContext.Provider value={patientAuth}>
          <MemoryRouter initialEntries={['/doctor']}>
            <Routes>
              <Route
                path="/doctor"
                element={
                  <RequireRole roles={['doctor']}>
                    <div>میز کار پزشک</div>
                  </RequireRole>
                }
              />
              <Route path="/403" element={<div>عدم دسترسی 403</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.queryByText('میز کار پزشک')).toBeNull();
      expect(screen.getByText('عدم دسترسی 403')).toBeTruthy();
    });
  });

  describe('RequirePermission', () => {
    it('renders child content when user role has permission', () => {
      const authValue = createMockAuthContext('owner');

      render(
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={['/settings/audit-logs']}>
            <Routes>
              <Route
                path="/settings/audit-logs"
                element={
                  <RequirePermission permission="audit:read">
                    <div>لاگ‌های امنیتی سیستم</div>
                  </RequirePermission>
                }
              />
              <Route path="/403" element={<div>عدم دسترسی 403</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('لاگ‌های امنیتی سیستم')).toBeTruthy();
    });

    it('redirects to /403 when user lacks permission', () => {
      const authValue = createMockAuthContext('reception');

      render(
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={['/settings/audit-logs']}>
            <Routes>
              <Route
                path="/settings/audit-logs"
                element={
                  <RequirePermission permission="audit:read">
                    <div>لاگ‌های امنیتی سیستم</div>
                  </RequirePermission>
                }
              />
              <Route path="/403" element={<div>عدم دسترسی 403</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.queryByText('لاگ‌های امنیتی سیستم')).toBeNull();
      expect(screen.getByText('عدم دسترسی 403')).toBeTruthy();
    });
  });

  describe('Can component', () => {
    it('renders children if user has permission', () => {
      const authValue = createMockAuthContext('doctor');

      render(
        <AuthContext.Provider value={authValue}>
          <Can permission="medical_notes:write">
            <button>ویرایش پرونده پزشکی</button>
          </Can>
        </AuthContext.Provider>
      );

      expect(screen.getByText('ویرایش پرونده پزشکی')).toBeTruthy();
    });

    it('does not render children if user lacks permission', () => {
      const authValue = createMockAuthContext('reception');

      render(
        <AuthContext.Provider value={authValue}>
          <Can permission="medical_notes:write" fallback={<span>دسترسی محدود</span>}>
            <button>ویرایش پرونده پزشکی</button>
          </Can>
        </AuthContext.Provider>
      );

      expect(screen.queryByText('ویرایش پرونده پزشکی')).toBeNull();
      expect(screen.getByText('دسترسی محدود')).toBeTruthy();
    });
  });
});
