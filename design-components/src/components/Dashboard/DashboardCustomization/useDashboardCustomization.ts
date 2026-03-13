import { useContext } from 'react';
import type { DashboardCustomizationState } from './DashboardCustomizationProvider';
import { DashboardCustomizationContext } from './DashboardCustomizationContext';

export function useDashboardCustomization(): DashboardCustomizationState {
  const ctx = useContext(DashboardCustomizationContext);
  if (!ctx) {
    throw new Error(
      'useDashboardCustomization must be used within a DashboardCustomizationProvider'
    );
  }
  return ctx;
}

/** Returns customization state if inside a provider, or null otherwise. */
export function useOptionalDashboardCustomization(): DashboardCustomizationState | null {
  return useContext(DashboardCustomizationContext);
}
