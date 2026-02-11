/**
 * LazyTransparencyDrawer - Presentation component for transparency drawer
 *
 * This component handles only rendering. Business logic is in useTransparencyDrawer hook.
 *
 * Data tab: Shows artifacts where category is NOT "RAG", "e2b", or "iq"
 * Calls tab: Shows call transcripts from RAG artifacts (type=call), fetched via bulk API when drawer opens
 * Emails tab: Shows email transcripts from RAG artifacts (type=email), fetched via bulk API when drawer opens
 * Deep Research tab: Shows artifacts where category IS "iq" (automatically shown when IQ artifacts exist)
 */

import React, { useMemo } from "react";
import {
  TransparencyDrawer,
  DataTabContent,
  CallsTabContent,
  CallsTabError,
  EmailsTabContent,
  IQDataTabContent,
  type TransparencyTabConfig,
} from "@vonlabs/design-components";
import { useTransparencyDrawer } from "../hooks/useTransparencyDrawer";
import type { ArtifactSummary } from "../utils/transformArtifactsToTransparency";

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
    emails,
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
      count: queries.length,
    }),
    [queries.length],
  );

  const callsTabConfig: TransparencyTabConfig = useMemo(
    () => ({
      id: "calls",
      label: "Calls",
      count: calls.length || (callsError ? 1 : 0),
    }),
    [calls.length, callsError],
  );

  const emailsTabConfig: TransparencyTabConfig = useMemo(
    () => ({
      id: "emails",
      label: "Emails",
      count: emails.length || (callsError ? 1 : 0),
    }),
    [emails.length, callsError],
  );

  const deepResearchTabConfig: TransparencyTabConfig = useMemo(
    () => ({
      id: "deep-research",
      label: "Deep Research",
      count: vonIqQueries.length,
    }),
    [vonIqQueries.length],
  );

  return (
    <TransparencyDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      isLoading={isListLoading}
    >
      {!isListLoading && queries.length > 0 && (
        <TransparencyDrawer.Tab config={dataTabConfig}>
          <DataTabContent queries={queries} onQuerySelect={handleQuerySelect} />
        </TransparencyDrawer.Tab>
      )}

      {!isCallsLoading && (calls.length > 0 || callsError) && (
        <TransparencyDrawer.Tab config={callsTabConfig}>
          {callsError ? (
            <CallsTabError message={callsError.message} />
          ) : (
            <CallsTabContent calls={calls} />
          )}
        </TransparencyDrawer.Tab>
      )}

      {!isCallsLoading && (emails.length > 0 || callsError) && (
        <TransparencyDrawer.Tab config={emailsTabConfig}>
          {callsError ? (
            <CallsTabError message={callsError.message} />
          ) : (
            <EmailsTabContent emails={emails} />
          )}
        </TransparencyDrawer.Tab>
      )}

      {!isListLoading && hasVonIqArtifacts && (
        <TransparencyDrawer.Tab config={deepResearchTabConfig}>
          <IQDataTabContent
            queries={vonIqQueries}
            onQuerySelect={handleVonIqSelect}
          />
        </TransparencyDrawer.Tab>
      )}
    </TransparencyDrawer>
  );
};

export default LazyTransparencyDrawer;
