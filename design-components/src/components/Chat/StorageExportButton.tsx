/**
 * StorageExportButton — Unified dropdown for exporting artifacts to storage services.
 *
 * Shows a primary button (first connected service's logo) + a chevron dropdown.
 * The dropdown lists ALL enabled services — connected ones have a green checkmark,
 * non-connected ones trigger a "connect" flow when clicked.
 * Hidden entirely when no services are enabled.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CaretDownIcon, SpinnerGapIcon, CheckIcon } from '@phosphor-icons/react';
import { Tooltip } from '../Tooltip';
const driveLogo =
  'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/GDrive.svg';
const boxLogo = 'https://vonlabs-public-assets.s3.us-west-2.amazonaws.com/integrations/Box.svg';

// ============================================================================
// Types
// ============================================================================

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
}

// ============================================================================
// Helpers — build services from the legacy per-service props
// ============================================================================

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

export function buildStorageServices(props: StorageExportLegacyProps): StorageService[] {
  const services: StorageService[] = [];

  if (props.isDriveEnabled && props.onGoogleDriveClick) {
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

  if (props.isBoxEnabled && props.onBoxClick) {
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

// ============================================================================
// Component
// ============================================================================

export const StorageExportButton: React.FC<StorageExportButtonProps> = ({
  services,
  stopPropagation = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const connectedServices = useMemo(() => services.filter((s) => s.connected), [services]);

  // The "active" service is the one the primary button targets.
  // Prefer the user's last pick, then the first connected service, then the first enabled service.
  const resolvedActiveId = activeId ?? connectedServices[0]?.id ?? services[0]?.id ?? null;
  const activeService = services.find((s) => s.id === resolvedActiveId) ?? services[0];

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Nothing to show if no services enabled
  if (services.length === 0) return null;

  const anyLoading = services.some((s) => s.loading);

  const handlePrimaryClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (activeService && !activeService.loading) {
      activeService.onClick();
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleServiceClick = (service: StorageService, e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    e.preventDefault();
    setActiveId(service.id);
    setIsOpen(false);
  };

  // Single service — no chevron needed, just a standalone button
  if (services.length === 1) {
    return (
      <Tooltip content={activeService?.tooltip ?? activeService?.name ?? ''} placement="top">
        <button
          disabled={activeService?.loading}
          onClick={(e) => {
            if (stopPropagation) e.stopPropagation();
            activeService?.onClick();
          }}
          className={`w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center transition-colors ${
            activeService?.loading
              ? 'cursor-wait'
              : !activeService?.connected
                ? 'opacity-60 hover:bg-gray-50 cursor-pointer'
                : 'hover:bg-gray-50 cursor-pointer'
          }`}
        >
          {activeService?.loading ? (
            <SpinnerGapIcon size={16} weight="bold" className="text-gray-600 animate-spin" />
          ) : (
            <img src={activeService?.logo} alt={activeService?.name} width={20} height={20} />
          )}
        </button>
      </Tooltip>
    );
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* Primary button — exports to active service */}
      <Tooltip content={activeService?.tooltip ?? activeService?.name ?? ''} placement="top">
        <button
          disabled={activeService?.loading}
          onClick={handlePrimaryClick}
          className={`w-8 h-8 rounded-l-lg border border-gray-100 flex items-center justify-center transition-colors ${
            activeService?.loading
              ? 'cursor-wait'
              : !activeService?.connected
                ? 'opacity-60 hover:bg-gray-50 cursor-pointer'
                : 'hover:bg-gray-50 cursor-pointer'
          }`}
        >
          {activeService?.loading ? (
            <SpinnerGapIcon size={16} weight="bold" className="text-gray-600 animate-spin" />
          ) : (
            <img src={activeService?.logo} alt={activeService?.name} width={20} height={20} />
          )}
        </button>
      </Tooltip>

      {/* Chevron dropdown trigger */}
      <button
        disabled={anyLoading}
        onClick={handleChevronClick}
        className={`w-6 h-8 -ml-px rounded-r-lg border border-gray-100 flex items-center justify-center transition-colors ${
          anyLoading ? 'cursor-wait' : 'hover:bg-gray-50 cursor-pointer'
        }`}
      >
        <CaretDownIcon
          size={10}
          weight="bold"
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu — opens to the right */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-20 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {services.map((service) => (
            <button
              key={service.id}
              disabled={service.loading}
              onClick={(e) => handleServiceClick(service, e)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-wait ${
                service.connected ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {service.loading ? (
                <SpinnerGapIcon
                  size={16}
                  weight="bold"
                  className="text-gray-500 animate-spin shrink-0"
                />
              ) : (
                <img
                  src={service.logo}
                  alt=""
                  width={20}
                  height={20}
                  className={`shrink-0 ${service.connected ? '' : 'opacity-60'}`}
                />
              )}
              <span className="flex-1 text-left">{service.name}</span>
              {service.id === resolvedActiveId && (
                <CheckIcon size={14} weight="bold" className="text-emerald-500 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
