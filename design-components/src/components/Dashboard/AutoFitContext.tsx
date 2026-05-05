import { createContext, useContext } from 'react';

export interface AutoFitReport {
  panelId: string;
  desiredH: number;
  fingerprint: string;
}

export interface AutoFitController {
  report: (r: AutoFitReport) => void;
}

export const AutoFitContext = createContext<AutoFitController | null>(null);

export function useAutoFit(): AutoFitController | null {
  return useContext(AutoFitContext);
}
