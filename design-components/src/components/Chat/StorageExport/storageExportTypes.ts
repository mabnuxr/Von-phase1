/**
 * Shared types for the storage-export dropdown (StorageExportButton).
 * Lives in its own file so the component file only exports the React
 * component — required for HMR / fast-refresh.
 */

export interface StorageService {
  id: string;
  name: string;
  logo: string;
  tooltip: string;
  connected: boolean;
  loading: boolean;
  onClick: () => void;
}

export interface StorageExportButtonProps {
  services: StorageService[];
  /** Whether to stop event propagation on clicks (needed inside clickable cards) */
  stopPropagation?: boolean;
  /** Which side the dropdown opens towards. Defaults to 'left' (dropdown left-aligned). */
  dropdownAlign?: 'left' | 'right';
  /** Externally controlled active service ID (syncs selection across instances) */
  activeServiceId?: string | null;
}

export interface StorageExportLegacyProps {
  onGoogleDriveClick?: () => void;
  isDriveEnabled?: boolean;
  isDriveConnected?: boolean;
  isDriveLoading?: boolean;
  onBoxClick?: () => void;
  isBoxEnabled?: boolean;
  isBoxConnected?: boolean;
  isBoxLoading?: boolean;
}
