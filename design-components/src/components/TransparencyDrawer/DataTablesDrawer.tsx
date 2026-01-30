import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X as XIcon,
  Database as DatabaseIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
} from '@phosphor-icons/react';
import { QueryContent } from './components';
import type { QueryResult } from './types';
import { useHorizontalResize } from '../ArtifactViewer/hooks';

// ============================================================================
// Types
// ============================================================================

export interface DataTableArtifact {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isLoading?: boolean;
  /** Full query result data (loaded lazily) */
  data?: QueryResult;
}

export interface DataTablesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** List of artifact summaries to display as tabs */
  artifacts: DataTableArtifact[];
  /** Callback when an artifact tab is selected (for lazy loading) */
  onArtifactSelect?: (artifactId: string) => void;
  /** Currently selected artifact ID */
  selectedArtifactId?: string;
  /** Total records count for display */
  totalRecords?: number;
}

// ============================================================================
// Table Tab Component
// ============================================================================

interface TableTabProps {
  artifact: DataTableArtifact;
  isActive: boolean;
  onClick: () => void;
}

const TableTab: React.FC<TableTabProps> = ({ artifact, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-1.5 text-[13px] font-medium rounded-full
        transition-colors duration-150 cursor-pointer whitespace-nowrap border
        ${
          isActive
            ? 'bg-green-50 text-gray-900 border-green-300'
            : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      {artifact.name}
      {artifact.isLoading && (
        <span className="ml-2 inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      )}
    </button>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const DataTablesDrawer: React.FC<DataTablesDrawerProps> = ({
  isOpen,
  onClose,
  title = 'Data Tables',
  artifacts,
  onArtifactSelect,
  selectedArtifactId: controlledSelectedId,
  totalRecords,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(artifacts[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedId = controlledSelectedId ?? internalSelectedId;

  // Handle tab selection
  const handleSelectArtifact = useCallback(
    (artifactId: string) => {
      if (controlledSelectedId === undefined) {
        setInternalSelectedId(artifactId);
      }
      onArtifactSelect?.(artifactId);
    },
    [controlledSelectedId, onArtifactSelect]
  );

  // Find selected artifact
  const selectedArtifact = useMemo(
    () => artifacts.find((a) => a.id === selectedId),
    [artifacts, selectedId]
  );

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!selectedArtifact?.data?.rows) return [];

    if (!searchQuery.trim()) {
      return selectedArtifact.data.rows;
    }

    const query = searchQuery.toLowerCase();
    return selectedArtifact.data.rows.filter((row) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [selectedArtifact?.data?.rows, searchQuery]);

  // Create QueryResult for QueryContent with filtered data
  const queryResultForDisplay = useMemo((): QueryResult | null => {
    if (!selectedArtifact?.data) return null;

    return {
      ...selectedArtifact.data,
      rows: filteredData,
    };
  }, [selectedArtifact?.data, filteredData]);

  // Reset search when switching tabs
  React.useEffect(() => {
    setSearchQuery('');
  }, [selectedId]);

  // Auto-select first artifact when list changes
  React.useEffect(() => {
    if (artifacts.length > 0 && !artifacts.find((a) => a.id === selectedId)) {
      const newId = artifacts[0].id;
      setInternalSelectedId(newId);
      onArtifactSelect?.(newId);
    }
  }, [artifacts, selectedId, onArtifactSelect]);

  const displayedRows = filteredData.length;
  const totalRows = selectedArtifact?.data?.rows?.length ?? 0;

  // Horizontal resize functionality
  const { width, handleProps } = useHorizontalResize({
    initialWidth: 900,
    minWidth: 500,
    storageKey: 'data-tables-drawer-width',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-[9998]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: `${width}px` }}
            className="fixed right-0 top-0 h-full max-w-[95vw] pr-2 py-2 z-[9999]"
          >
            {/* Resize Handle */}
            <div
              {...handleProps}
              className="absolute left-0 top-0 bottom-0 w-3 z-10 cursor-ew-resize"
            />

            <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-100">
                    <DatabaseIcon size={16} weight="duotone" className="text-gray-600" />
                  </div>
                  <h2 className="text-sm font-medium text-gray-900">{title}</h2>
                  <span className="text-[13px] text-gray-500">·</span>
                  <span className="text-[13px] text-gray-500">
                    {displayedRows !== totalRows
                      ? `Showing ${displayedRows} of ${totalRows} records`
                      : totalRecords
                        ? `${totalRecords.toLocaleString()} total records`
                        : `${artifacts.length} ${artifacts.length === 1 ? 'table' : 'tables'}`}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <XIcon size={18} weight="bold" />
                </button>
              </div>

              {/* Table Tabs */}
              {artifacts.length > 1 && (
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                  <div
                    className="flex items-center gap-2 overflow-x-auto"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {artifacts.map((artifact) => (
                      <TableTab
                        key={artifact.id}
                        artifact={artifact}
                        isActive={artifact.id === selectedId}
                        onClick={() => handleSelectArtifact(artifact.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Search Bar */}
              {selectedArtifact?.data && (
                <div className="px-5 py-3 border-b border-gray-100 shrink-0">
                  <div className="relative max-w-sm">
                    <MagnifyingGlassIcon
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-9 pr-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-100 rounded-xl placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-shadow"
                    />
                  </div>
                </div>
              )}

              {/* Table Content */}
              <div className="flex-1 overflow-hidden">
                {selectedArtifact?.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      <p className="text-sm text-gray-500">Loading data...</p>
                    </div>
                  </div>
                ) : queryResultForDisplay ? (
                  <motion.div
                    key={selectedId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    <QueryContent query={queryResultForDisplay} />
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <DatabaseIcon size={48} weight="duotone" className="text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">
                      {artifacts.length === 0
                        ? 'No data tables available'
                        : 'Click to load table data'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DataTablesDrawer;
