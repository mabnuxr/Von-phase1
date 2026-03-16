import { createContext } from 'react';
import type { DashboardCustomizationState } from './DashboardCustomizationProvider';

export const DashboardCustomizationContext = createContext<DashboardCustomizationState | null>(
  null
);
