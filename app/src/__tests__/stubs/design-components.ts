/**
 * Test-only shim for @vonlabs/design-components.
 *
 * Re-exports only the types and functions used by transformAguiToTimelineSteps
 * to avoid pulling in the full barrel export (which imports React components,
 * CSS, pdfjs-dist, etc. that fail in a pure Node.js test environment).
 */

// Types
export type {
  AguiEventWrapper,
  ResearchResultsMetadata,
} from "../../../../design-components/src/components/Chat/types";

export type {
  TimelineStep,
  StepStatus,
  StepType,
  SourceType,
  EventCategory,
  BulkOperation,
} from "../../../../design-components/src/components/TimelineThinkingProcess/types";

// Constants
export { DEFAULT_EXPIRED_APPROVAL_MESSAGE } from "../../../../design-components/src/utils/constants";

// Functions
export {
  isApprovalTool,
  isGoogleCalendarApprovalTool,
} from "../../../../design-components/src/components/Chat/types";

// ReportTable types & utils
export type { ReportColumn } from "../../../../design-components/src/components/ReportTable/ReportTable";
export {
  buildGridOptions,
  autoSizeGridColumns,
  getDataTableColumns,
  formatValue,
} from "../../../../design-components/src/components/ReportTable/reportTableUtils";
