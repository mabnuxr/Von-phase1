/**
 * DataSourcesDrawer — pill trigger + slide-in drawer showing dashboard source systems.
 *
 * Minimal shape: source type + the list of objects it exposes. No per-dataset
 * metadata (no row counts, descriptions, field chips).
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, TableIcon, DatabaseIcon } from '@phosphor-icons/react';

// ============================================================================
// Types
// ============================================================================

export type DataSourceIcon = 'salesforce' | 'snowflake' | 'database';

export interface DataSource {
  /** Stable key for React (typically the source type). */
  id: string;
  /** Human-readable source name, e.g. "Salesforce". */
  name: string;
  /** Icon key; falls back to a generic database icon. */
  icon?: DataSourceIcon;
  /** Source object names — SFDC objects, Snowflake tables, etc. */
  objects: string[];
}

// ============================================================================
// Inline SVG logos
// ============================================================================

const SalesforceLogo: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 273 191" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      d="m113 21.3c8.78-9.14 21-14.8 34.5-14.8 18 0 33.6 10 42 24.9a58 58 0 0 1 23.7-5.05c32.4 0 58.7 26.5 58.7 59.2s-26.3 59.2-58.7 59.2c-3.96 0-7.82-0.398-11.6-1.15-7.35 13.1-21.4 22-37.4 22a42.7 42.7 0 0 1-18.8-4.32c-7.45 17.5-24.8 29.8-45 29.8-21.1 0-39-13.3-45.9-32a45.1 45.1 0 0 1-9.34 0.972c-25.1 0-45.4-20.6-45.4-45.9 0-17 9.14-31.8 22.7-39.8a52.6 52.6 0 0 1-4.35-21c0-29.2 23.7-52.8 52.9-52.8 17.1 0 32.4 8.15 42 20.8"
      fill="#00A1E0"
    />
  </svg>
);

const SnowflakeLogo: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      clipRule="evenodd"
      d="M23.252 10.365l-2.843 1.636 2.843 1.631a1.47 1.47 0 01.697.903 1.492 1.492 0 01-.15 1.135c-.202.342-.53.591-.912.693a1.498 1.498 0 01-1.132-.15l-5.09-2.924a1.473 1.473 0 01-.68-.851 1.446 1.446 0 01-.068-.485 1.5 1.5 0 01.745-1.248l5.09-2.921a1.496 1.496 0 012.044.547 1.479 1.479 0 01-.544 2.034zm-2.692 7.927l-5.087-2.92a1.477 1.477 0 00-.867-.195 1.478 1.478 0 00-.982.468c-.257.276-.4.639-.403 1.017v5.847A1.49 1.49 0 0014.718 24c.828 0 1.497-.668 1.497-1.491v-3.27l2.849 1.636a1.493 1.493 0 002.044-.544 1.49 1.49 0 00-.548-2.04zm-5.87-5.719l-2.116 2.102a.42.42 0 01-.265.112h-.621a.427.427 0 01-.265-.112l-2.115-2.102a.42.42 0 01-.11-.262v-.62a.43.43 0 01.11-.265l2.114-2.102a.426.426 0 01.264-.11h.623a.422.422 0 01.265.11l2.116 2.102a.43.43 0 01.109.265v.62a.428.428 0 01-.11.262zM13 11.99a.442.442 0 00-.113-.266l-.612-.607a.431.431 0 00-.266-.11h-.024a.426.426 0 00-.264.11l-.612.607a.436.436 0 00-.107.266v.024c0 .085.047.202.107.262l.612.61c.061.06.179.11.264.11h.024a.434.434 0 00.266-.11l.612-.61a.429.429 0 00.112-.262v-.024zM3.436 5.704l5.089 2.924c.274.157.578.219.868.195.375-.026.726-.194.983-.47.256-.275.4-.64.403-1.017V1.489C10.78.667 10.11 0 9.284 0c-.829 0-1.498.667-1.498 1.49v3.27l-2.85-1.639a1.496 1.496 0 00-2.045.546 1.489 1.489 0 00.546 2.037zm11.17 3.119c.29.024.594-.038.866-.195l5.087-2.923a1.474 1.474 0 00.697-.903 1.496 1.496 0 00-.149-1.135 1.496 1.496 0 00-2.044-.545L16.215 4.76V1.489C16.215.667 15.546 0 14.718 0c-.83 0-1.497.667-1.497 1.49v5.845a1.491 1.491 0 001.385 1.487zm-5.213 6.354a1.479 1.479 0 00-.868.194l-5.089 2.92a1.476 1.476 0 00-.696.905 1.498 1.498 0 00.148 1.135 1.496 1.496 0 002.044.543l2.851-1.636v3.27c0 .825.67 1.491 1.498 1.491.826 0 1.496-.667 1.496-1.49v-5.847a1.5 1.5 0 00-.401-1.017 1.477 1.477 0 00-.982-.468zm-1.38-2.74c.05-.156.072-.32.068-.484a1.497 1.497 0 00-.751-1.248l-5.084-2.92a1.499 1.499 0 00-2.045.547 1.481 1.481 0 00.549 2.034l2.841 1.636L.75 13.633a1.47 1.47 0 00-.698.903 1.492 1.492 0 00.15 1.135c.202.343.53.592.912.693.382.102.789.048 1.132-.15l5.086-2.924c.345-.195.577-.505.684-.852z"
      fill="#249EDC"
      fillRule="evenodd"
    />
  </svg>
);

const SourceIcon: React.FC<{ icon?: DataSourceIcon; size?: number }> = ({ icon, size = 16 }) => {
  if (icon === 'salesforce') return <SalesforceLogo size={size} />;
  if (icon === 'snowflake') return <SnowflakeLogo size={size} />;
  return (
    <div className="w-4 h-4 rounded bg-gray-200 flex items-center justify-center">
      <DatabaseIcon size={10} className="text-gray-500" />
    </div>
  );
};

// ============================================================================
// Trigger chip
// ============================================================================

interface SourcesChipProps {
  sources: DataSource[];
  onClick: () => void;
}

const SourcesChip: React.FC<SourcesChipProps> = ({ sources, onClick }) => (
  <button
    onClick={onClick}
    title="View data sources"
    className="inline-flex items-center gap-1.5 h-[34px] px-2.5 bg-white text-gray-700 text-xs font-medium rounded-xl border border-gray-200/70 hover:bg-gray-50 transition-colors cursor-pointer"
  >
    <div className="flex items-center -space-x-1">
      {sources.slice(0, 3).map((source, i) => (
        <div
          key={source.id}
          className="w-5 h-5 rounded-full border-2 border-white bg-white flex items-center justify-center shrink-0"
          style={{ zIndex: 3 - i }}
        >
          <SourceIcon icon={source.icon} size={13} />
        </div>
      ))}
    </div>
    <span>
      {sources.length} {sources.length === 1 ? 'source' : 'sources'}
    </span>
  </button>
);

// ============================================================================
// Combined: chip + drawer
// ============================================================================

export interface DataSourcesProps {
  /** Source systems grouped by type — required. */
  sources: DataSource[];
}

export const DataSources: React.FC<DataSourcesProps> = ({ sources }) => {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <>
      <SourcesChip sources={sources} onClick={() => setOpen(!open)} />

      <AnimatePresence>
        {open && (
          <>
            <div className="absolute inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', duration: 0.25, bounce: 0.05 }}
              className="absolute right-0 top-0 bottom-0 z-30 w-[240px] bg-white border-l border-gray-100 shadow-lg flex flex-col"
            >
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-900">Data Sources</span>
                <button
                  onClick={() => setOpen(false)}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  aria-label="Close data sources"
                >
                  <XIcon size={11} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                {sources.map((source) => (
                  <div key={source.id} className="mb-2.5 last:mb-0">
                    <div className="flex items-center gap-2 px-3 py-1">
                      <SourceIcon icon={source.icon} size={14} />
                      <span className="text-sm font-medium text-gray-900">{source.name}</span>
                    </div>
                    {source.objects.map((name) => (
                      <div
                        key={`${source.id}-${name}`}
                        className="flex items-center gap-2 px-3 py-1 ml-3.5"
                      >
                        <TableIcon size={11} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700">{name}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
