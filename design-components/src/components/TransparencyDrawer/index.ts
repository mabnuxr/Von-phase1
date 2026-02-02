export { TransparencyDrawer, default } from './TransparencyDrawer';
export { DataTablesDrawer } from './DataTablesDrawer';
export type { DataTablesDrawerProps, DataTableArtifact } from './DataTablesDrawer';
export type {
  TransparencyDrawerProps,
  TransparencyDrawerTabProps,
  TabConfig,
  QueryResult,
  QueryColumn,
  CallTranscript,
  EmailTranscript,
  SentimentType,
  TopLevelTab,
  QueryTabProps,
  QueryContentProps,
  CallsTabContentProps,
  DataTabContentProps,
  TabNavigationProps,
  DrawerBackdropProps,
  ArtifactSummary,
  ArtifactResponse,
} from './types';

// Re-export constants
export { ROWS_PER_PAGE } from './constants';

// Re-export components for composition pattern
export {
  DrawerBackdrop,
  QueryTab,
  QueryContent,
  CallsTabContent,
  EmailsTabContent,
  TabNavigation,
  DataTabContent,
  DataTabShimmer,
  CallsTabShimmer,
  CallsTabError,
  IQDataTabContent,
} from './components';
export type { IQQueryResult, IQDataTabContentProps, EmailsTabContentProps } from './components';

// Re-export hooks
export { useQueryPagination, useCallsExpansion } from './hooks';
export type { UseQueryPaginationReturn, UseCallsExpansionReturn } from './hooks';

// Re-export utils
export { formatValue, getSentimentIcon, getSentimentLabel, groupCallsByMonth } from './utils';
