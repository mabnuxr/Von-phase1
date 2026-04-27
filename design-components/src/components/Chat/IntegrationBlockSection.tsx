import { IntegrationCard } from '../IntegrationCard';

interface IntegrationBlockSectionProps {
  integrationBlock: {
    blockCode?: string;
    message: string;
    integrationType: string;
  };
  isIntegrationConnected?: (integrationType: string) => boolean;
  onIntegrate?: (integrationType: string) => void;
  getIntegrationMetadata?: (integrationType: string) => {
    name: string;
    logoPath: string;
    description?: string;
  } | null;
}

export const IntegrationBlockSection: React.FC<IntegrationBlockSectionProps> = ({
  integrationBlock,
  isIntegrationConnected,
  onIntegrate,
  getIntegrationMetadata,
}) => {
  // Don't render for org_read_only or admin_disabled block codes
  if (
    integrationBlock.blockCode === 'org_read_only' ||
    integrationBlock.blockCode === 'admin_disabled'
  ) {
    return null;
  }

  const metadata = getIntegrationMetadata?.(integrationBlock.integrationType);
  if (!metadata) return null;

  const isConnected = isIntegrationConnected?.(integrationBlock.integrationType) ?? false;

  return (
    <div className="mt-3 w-full rounded-xl border border-gray-100 shadow-xs overflow-hidden">
      <IntegrationCard
        name={metadata.name}
        integrationLogoPath={metadata.logoPath}
        description={integrationBlock.message}
        isAvailable={!isConnected}
        onToggle={onIntegrate ? () => onIntegrate(integrationBlock.integrationType) : undefined}
        chips={isConnected ? ['connected'] : undefined}
        showConnectArrow
      />
    </div>
  );
};
