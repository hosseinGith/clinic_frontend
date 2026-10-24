import { describe, it, expect } from 'vitest';
import {
  canTransition,
  canTransitionByRole,
  getAvailableTransitions,
  getAvailableTransitionsByRole,
} from '../domain/appointmentStatus';

describe('Appointment Status State Machine', () => {
  it('allows valid transition from pending_confirmation to confirmed or cancelled', () => {
    expect(canTransition('pending_confirmation', 'confirmed')).toBe(true);
    expect(canTransition('pending_confirmation', 'cancelled')).toBe(true);
    expect(canTransition('pending_confirmation', 'completed')).toBe(false);
  });

  it('allows valid transition from confirmed to in_clinic or pending_payment or cancelled', () => {
    expect(canTransition('confirmed', 'in_clinic')).toBe(true);
    expect(canTransition('confirmed', 'pending_payment')).toBe(true);
    expect(canTransition('confirmed', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'completed')).toBe(false);
  });

  it('allows valid transition from in_clinic to completed', () => {
    expect(canTransition('in_clinic', 'completed')).toBe(true);
    expect(canTransition('in_clinic', 'pending_confirmation')).toBe(false);
  });

  it('terminal states have no outgoing transitions', () => {
    expect(getAvailableTransitions('completed')).toEqual([]);
    expect(getAvailableTransitions('cancelled')).toEqual([]);
    expect(canTransition('completed', 'confirmed')).toBe(false);
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
  });

  it('does not allow transitioning to the identical state', () => {
    expect(canTransition('confirmed', 'confirmed')).toBe(false);
  });

  describe('Role-Aware State Transitions', () => {
    it('patient can only cancel pending_confirmation or confirmed appointments', () => {
      expect(canTransitionByRole('pending_confirmation', 'cancelled', 'patient')).toBe(true);
      expect(canTransitionByRole('confirmed', 'cancelled', 'patient')).toBe(true);
      expect(canTransitionByRole('pending_confirmation', 'confirmed', 'patient')).toBe(false);
      expect(canTransitionByRole('in_clinic', 'completed', 'patient')).toBe(false);
      expect(getAvailableTransitionsByRole('confirmed', 'patient')).toEqual(['cancelled']);
    });

    it('doctor can transition in_clinic to completed, but cannot cancel', () => {
      expect(canTransitionByRole('in_clinic', 'completed', 'doctor')).toBe(true);
      expect(canTransitionByRole('confirmed', 'in_clinic', 'doctor')).toBe(true);
      expect(canTransitionByRole('confirmed', 'cancelled', 'doctor')).toBe(false);
      expect(canTransitionByRole('pending_confirmation', 'cancelled', 'doctor')).toBe(false);
    });

    it('reception can confirm, cancel, and settle or complete in_clinic visits', () => {
      expect(canTransitionByRole('pending_confirmation', 'confirmed', 'reception')).toBe(true);
      expect(canTransitionByRole('pending_confirmation', 'cancelled', 'reception')).toBe(true);
      expect(canTransitionByRole('confirmed', 'in_clinic', 'reception')).toBe(true);
      expect(canTransitionByRole('in_clinic', 'completed', 'reception')).toBe(true);
      expect(canTransitionByRole('in_clinic', 'pending_payment', 'reception')).toBe(true);
      expect(canTransitionByRole('pending_payment', 'completed', 'reception')).toBe(true);
    });

    it('owner and admin have unrestricted transitions', () => {
      expect(canTransitionByRole('pending_confirmation', 'confirmed', 'owner')).toBe(true);
      expect(canTransitionByRole('in_clinic', 'completed', 'owner')).toBe(true);
      expect(canTransitionByRole('in_clinic', 'completed', 'admin')).toBe(true);
    });

    it('super_admin has zero allowed appointment transitions (complete clinical isolation)', () => {
      const allStatuses = [
        'pending_confirmation',
        'confirmed',
        'in_clinic',
        'pending_payment',
        'completed',
        'cancelled',
      ] as const;

      for (const from of allStatuses) {
        for (const to of allStatuses) {
          expect(canTransitionByRole(from, to, 'super_admin')).toBe(false);
        }
      }
    });
  });
});
