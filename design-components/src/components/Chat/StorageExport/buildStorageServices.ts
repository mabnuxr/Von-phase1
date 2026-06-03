import type { StorageService, StorageExportLegacyProps } from './storageExportTypes';

const driveLogo =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/GDrive.svg';
const boxLogo = 'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Box.svg';

/**
 * Translate the legacy per-service prop bag into the unified `StorageService[]`
 * the dropdown consumes. Kept in its own file so the component module only
 * exports the React component (HMR / fast-refresh requirement).
 */
export function buildStorageServices(props: StorageExportLegacyProps): StorageService[] {
  const services: StorageService[] = [];

  if (props.onGoogleDriveClick) {
    services.push({
      id: 'drive',
      name: 'Google Drive',
      logo: driveLogo,
      tooltip: props.isDriveConnected ? 'Open in Google Drive' : 'Connect Google Drive',
      connected: props.isDriveConnected ?? false,
      loading: props.isDriveLoading ?? false,
      onClick: props.onGoogleDriveClick,
    });
  }

  if (props.onBoxClick) {
    services.push({
      id: 'box',
      name: 'Box',
      logo: boxLogo,
      tooltip: props.isBoxConnected ? 'Open in Box' : 'Connect Box',
      connected: props.isBoxConnected ?? false,
      loading: props.isBoxLoading ?? false,
      onClick: props.onBoxClick,
    });
  }

  return services;
}
