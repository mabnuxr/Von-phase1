import { createContext, useContext } from 'react';
import type { GridConfig } from './types';

export const DashboardGridConfigContext = createContext<GridConfig | null>(null);

export function useDashboardGridConfig(): GridConfig | null {
  return useContext(DashboardGridConfigContext);
}
