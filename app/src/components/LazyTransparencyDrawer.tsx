/**
 * LazyTransparencyDrawer - Presentation component for transparency drawer
 *
 * This component handles only rendering. Business logic is in useTransparencyDrawer hook.
 *
 * Data tab: Shows artifacts where category is NOT "RAG", "e2b", or "iq"
 * Calls tab: Shows artifacts where category IS "RAG", fetched via bulk API when drawer opens
 * Deep Research tab: Shows artifacts where category IS "iq" (automatically shown when IQ artifacts exist)
 */

import React, { useMemo } from "react";
import {
  Database as DatabaseIcon,
  Phone as PhoneIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import {
  TransparencyDrawer,
  DataTabContent,
  DataTabShimmer,
  CallsTabContent,
  CallsTabShimmer,
  CallsTabError,
  type TransparencyTabConfig,
} from "@vonlabs/design-components";
import { useTransparencyDrawer } from "../hooks/useTransparencyDrawer";
import type { ArtifactSummary } from "../utils/transformArtifactsToTransparency";

const DATA_TAB_ICON = <DatabaseIcon size={14} weight="regular" />;
const CALLS_TAB_ICON = <PhoneIcon size={14} weight="regular" />;
const DEEP_RESEARCH_TAB_ICON = (
  <MagnifyingGlassIcon size={14} weight="regular" />
);

interface LazyTransparencyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  conversationId: string | null;
  runId: string | null;
  artifactSummaries: ArtifactSummary[];
  isListLoading: boolean;
}

export const LazyTransparencyDrawer: React.FC<LazyTransparencyDrawerProps> = ({
  isOpen,
  onClose,
  title = "Sources",
  conversationId,
  runId,
  artifactSummaries,
  isListLoading,
}) => {
  const {
    queries,
    handleQuerySelect,
    calls,
    isCallsLoading,
    callsError,
    vonIqQueries,
    handleVonIqSelect,
    hasVonIqArtifacts,
  } = useTransparencyDrawer({
    isOpen,
    conversationId,
    runId,
    artifactSummaries,
  });

  const dataTabConfig: TransparencyTabConfig = useMemo(
    () => ({
      id: "data",
      label: "Data",
      icon: DATA_TAB_ICON,
      count: queries.length,
    }),
    [queries.length],
  );

  const callsTabConfig: TransparencyTabConfig = useMemo(
    () => ({
      id: "calls",
      label: "Calls",
      icon: CALLS_TAB_ICON,
      count: calls.length,
    }),
    [calls.length],
  );

  const deepResearchTabConfig: TransparencyTabConfig = useMemo(
    () => ({
      id: "deep-research",
      label: "Deep Research",
      icon: DEEP_RESEARCH_TAB_ICON,
      count: vonIqQueries.length,
    }),
    [vonIqQueries.length],
  );

  return (
    <TransparencyDrawer isOpen={isOpen} onClose={onClose} title={title}>
      <TransparencyDrawer.Tab config={dataTabConfig}>
        {isListLoading ? (
          <DataTabShimmer />
        ) : (
          <DataTabContent queries={queries} onQuerySelect={handleQuerySelect} />
        )}
      </TransparencyDrawer.Tab>

      <TransparencyDrawer.Tab config={callsTabConfig}>
        {isCallsLoading ? (
          <CallsTabShimmer />
        ) : callsError ? (
          <CallsTabError message={callsError.message} />
        ) : (
          <CallsTabContent calls={calls} />
        )}
      </TransparencyDrawer.Tab>

      {hasVonIqArtifacts && (
        <TransparencyDrawer.Tab config={deepResearchTabConfig}>
          {isListLoading ? (
            <DataTabShimmer />
          ) : (
            <DataTabContent
              queries={vonIqQueries}
              onQuerySelect={handleVonIqSelect}
            />
          )}
        </TransparencyDrawer.Tab>
      )}
    </TransparencyDrawer>
  );
};

export default LazyTransparencyDrawer;
