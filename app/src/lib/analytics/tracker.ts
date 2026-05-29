import { posthog } from "../posthog";
import type { EventName, EventProps } from "./events";

/**
 * Fire a typed PostHog event. Works inside and outside React.
 * Base properties (user_id, user_role, company, etc.) are injected
 * automatically via super properties — no need to pass them here.
 */
export function track<E extends EventName>(
  event: E,
  props: EventProps<E>,
): void {
  if (!posthog.__loaded) return;
  posthog.capture(event, props as Record<string, unknown>);
}

/**
 * Named methods for all tracked events.
 * Prefer these over calling track() directly — they document intent,
 * provide a single place to update property shapes, and are cmd+clickable.
 */
export const report = {
  // ── Settings ──────────────────────────────────────────────────────────────
  settingsPageViewed: () =>
    track("Settings - Page Viewed", {
      entry_point: "Settings option in chat bottom-left menu",
    }),

  settingsTabClicked: (tabName: string) =>
    track("Settings - Tab Clicked", { tab_name: tabName }),

  settingsBackToHomeClicked: (currentTab: string) =>
    track("Settings - Back to Home Clicked", { current_tab: currentTab }),

  settingsHelpDocsClicked: (currentTab: string) =>
    track("Settings - Help Docs Clicked", { current_tab: currentTab }),

  settingsLogoutClicked: (currentTab: string) =>
    track("Settings - Logout Clicked", { current_tab: currentTab }),

  // ── Chat ──────────────────────────────────────────────────────────────────
  chatPageViewed: () => track("Chat - Page Viewed", {}),

  chatTemplateCategoryClicked: (categoryName: string) =>
    track("Chat - Template Category Clicked", { category_name: categoryName }),

  chatSuggestedPromptClicked: (
    promptText: string,
    categoryName: string,
    promptPosition: number,
  ) =>
    track("Chat - Suggested Prompt Clicked", {
      prompt_text: promptText,
      category_name: categoryName,
      prompt_position: promptPosition,
    }),

  chatSuggestedPromptArrowClicked: (categoryName: string) =>
    track("Chat - Suggested Prompt Arrow Clicked", {
      category_name: categoryName,
    }),

  // ── Email ──────────────────────────────────────────────────────────────────
  emailPageViewed: () => track("Email - Page Viewed", {}),

  emailSettingsSaved: (params: {
    success: boolean;
    error: string | null;
    emailObject: string;
    opportunityField: string;
    accountField: string;
    emailBodyField: string;
    isFirstSave: boolean;
  }) =>
    track("Email - Settings Saved", {
      success: params.success,
      error: params.error,
      email_object: params.emailObject,
      opportunity_field: params.opportunityField,
      account_field: params.accountField,
      email_body_field: params.emailBodyField,
      is_first_save: params.isFirstSave,
    }),

  // ── Manage Team ──────────────────────────────────────────────────────────────
  manageTeamPageViewed: () => track("Manage Team - Page Viewed", {}),

  manageTeamMemberSearched: (searchQuery: string, resultsCount: number) =>
    track("Manage Team - Member Searched", {
      search_query: searchQuery,
      results_count: resultsCount,
    }),

  manageTeamAddMemberClicked: () =>
    track("Manage Team - Add Member Clicked", {}),

  manageTeamMemberAdded: (params: {
    success: boolean;
    error: string | null;
    memberEmail: string;
    memberRole: string;
  }) =>
    track("Manage Team - Member Added", {
      success: params.success,
      error: params.error,
      member_email: params.memberEmail,
      member_role: params.memberRole,
    }),

  manageTeamAddMemberCancelled: () =>
    track("Manage Team - Add Member Cancelled", {}),

  manageTeamActionsMenuOpened: (
    targetUserEmail: string,
    targetUserRole: string,
  ) =>
    track("Manage Team - Actions Menu Opened", {
      target_user_email: targetUserEmail,
      target_user_role: targetUserRole,
    }),

  manageTeamEditDetailsClicked: (
    targetUserEmail: string,
    targetUserRole: string,
  ) =>
    track("Manage Team - Edit Details Clicked", {
      target_user_email: targetUserEmail,
      target_user_role: targetUserRole,
    }),

  manageTeamEditDetailsSaved: (params: {
    success: boolean;
    error: string | null;
    oldRole: string;
    newRole: string;
    targetUserEmail: string;
  }) =>
    track("Manage Team - Edit Details Saved", {
      success: params.success,
      error: params.error,
      old_role: params.oldRole,
      new_role: params.newRole,
      target_user_email: params.targetUserEmail,
    }),

  manageTeamEditDetailsCancelled: (targetUserEmail: string) =>
    track("Manage Team - Edit Details Cancelled", {
      target_user_email: targetUserEmail,
    }),

  manageTeamAccessPermissionsClicked: (
    targetUserEmail: string,
    targetUserRole: string,
  ) =>
    track("Manage Team - Access Permissions Clicked", {
      target_user_email: targetUserEmail,
      target_user_role: targetUserRole,
    }),

  manageTeamSalesforceUpdatesToggled: (
    toggledTo: boolean,
    targetUserEmail: string,
    targetUserRole: string,
  ) =>
    track("Manage Team - Salesforce Updates Toggled", {
      toggled_to: toggledTo,
      target_user_email: targetUserEmail,
      target_user_role: targetUserRole,
    }),

  manageTeamDeleteUserClicked: (
    targetUserEmail: string,
    targetUserRole: string,
  ) =>
    track("Manage Team - Delete User Clicked", {
      target_user_email: targetUserEmail,
      target_user_role: targetUserRole,
    }),

  manageTeamMemberRemoved: (params: {
    success: boolean;
    error: string | null;
    targetUserEmail: string;
    targetUserRole: string;
  }) =>
    track("Manage Team - Member Removed", {
      success: params.success,
      error: params.error,
      target_user_email: params.targetUserEmail,
      target_user_role: params.targetUserRole,
    }),

  manageTeamRemoveCancelled: (targetUserEmail: string) =>
    track("Manage Team - Remove Cancelled", {
      target_user_email: targetUserEmail,
    }),

  manageTeamQuestionsTooltipViewed: (params: {
    targetUserEmail: string;
    questionsLast7d: number;
    questionsLast30d: number;
    questionsAllTime: number;
  }) =>
    track("Manage Team - Questions Tooltip Viewed", {
      target_user_email: params.targetUserEmail,
      questions_last_7d: params.questionsLast7d,
      questions_last_30d: params.questionsLast30d,
      questions_all_time: params.questionsAllTime,
    }),

  manageTeamLearnMoreClicked: () =>
    track("Manage Team - Learn More Clicked", {}),

  // ── Dashboards (list) ─────────────────────────────────────────────────────
  dashboardOpened: (dashboardName: string) =>
    track("Dashboards - Dashboard Clicked", { dashboard_name: dashboardName }),

  // ── Dashboard (single view) ────────────────────────────────────────────────
  dashboardPageViewed: (params: {
    dashboardId: string;
    dashboardName: string;
    viewType: "sidebar" | "fullscreen";
    mode: "published" | "draft";
    owner: "me" | "shared";
    dashboardWidgetCount: number;
    chatId: string | null;
    sessionId: string;
  }) =>
    track("Dashboard - Page Viewed", {
      dashboard_id: params.dashboardId,
      dashboard_name: params.dashboardName,
      view_type: params.viewType,
      mode: params.mode,
      owner: params.owner,
      dashboard_widget_count: params.dashboardWidgetCount,
      chat_id: params.chatId,
      session_id: params.sessionId,
    }),

  dashboardShareModalOpened: (
    dashboardId: string,
    existingCollaboratorCount: number,
    sessionId: string,
  ) =>
    track("Dashboard - Share Modal Opened", {
      dashboard_id: dashboardId,
      existing_collaborator_count: existingCollaboratorCount,
      session_id: sessionId,
    }),

  dashboardShareLinkCopied: (dashboardId: string, sessionId: string) =>
    track("Dashboard - Share Link Copied", {
      dashboard_id: dashboardId,
      session_id: sessionId,
    }),

  dashboardVersionHistoryOpened: (
    dashboardId: string,
    trigger: "overflow_menu" | "timestamp_click",
    sessionId: string,
  ) =>
    track("Dashboard - Version History Opened", {
      dashboard_id: dashboardId,
      trigger,
      session_id: sessionId,
    }),

  dashboardVersionHistoryEntryPreviewed: (
    dashboardId: string,
    versionId: string,
    versionDate: string,
    sessionId: string,
  ) =>
    track("Dashboard - Version History Entry Previewed", {
      dashboard_id: dashboardId,
      version_id: versionId,
      version_date: versionDate,
      session_id: sessionId,
    }),

  dashboardClosed: (
    dashboardId: string,
    timeSpentMs: number,
    sessionId: string,
  ) =>
    track("Dashboard - Closed", {
      dashboard_id: dashboardId,
      time_spent_ms: timeSpentMs,
      session_id: sessionId,
    }),

  dashboardViewInDashboardsClicked: (dashboardId: string, sessionId: string) =>
    track("Dashboard - View in Dashboards Clicked", {
      dashboard_id: dashboardId,
      session_id: sessionId,
    }),

  dashboardAskVonClicked: (
    dashboardId: string,
    source: string,
    sessionId: string,
  ) =>
    track("Dashboard - Ask Von Clicked", {
      dashboard_id: dashboardId,
      source,
      session_id: sessionId,
    }),

  dashboardDrilldownRecordClicked: (params: {
    dashboardId: string;
    widgetName: string;
    recordId: string;
    objectType: string;
    sessionId: string;
  }) =>
    track("Dashboard - Drilldown Record Clicked", {
      dashboard_id: params.dashboardId,
      widget_name: params.widgetName,
      record_id: params.recordId,
      object_type: params.objectType,
      session_id: params.sessionId,
    }),

  dashboardWidgetQueryViewed: (
    dashboardId: string,
    widgetId: string,
    widgetName: string,
    widgetType: string,
    sessionId: string,
  ) =>
    track("Dashboard - Widget Query Viewed", {
      dashboard_id: dashboardId,
      widget_id: widgetId,
      widget_name: widgetName,
      widget_type: widgetType,
      session_id: sessionId,
    }),

  dashboardWidgetSQLCopied: (
    dashboardId: string,
    widgetName: string,
    sessionId: string,
  ) =>
    track("Dashboard - Widget SQL Copied", {
      dashboard_id: dashboardId,
      widget_name: widgetName,
      session_id: sessionId,
    }),

  dashboardWidgetAddedToChat: (
    dashboardId: string,
    widgetName: string,
    widgetType: string,
    sessionId: string,
  ) =>
    track("Dashboard - Widget Added to Chat", {
      dashboard_id: dashboardId,
      widget_name: widgetName,
      widget_type: widgetType,
      session_id: sessionId,
    }),

  dashboardEditEntered: (params: {
    dashboardId: string;
    trigger: "edit_button" | "new_dashboard";
    dashboardStatus: "published" | "draft";
    sessionId: string;
  }) =>
    track("Dashboard - Edit Entered", {
      dashboard_id: params.dashboardId,
      trigger: params.trigger,
      dashboard_status: params.dashboardStatus,
      session_id: params.sessionId,
    }),

  dashboardDiscardClicked: (params: {
    dashboardId: string;
    hadUnsavedChanges: boolean;
    timeInEditMs: number;
    sessionId: string;
  }) =>
    track("Dashboard - Discard Clicked", {
      dashboard_id: params.dashboardId,
      had_unsaved_changes: params.hadUnsavedChanges,
      time_in_edit_ms: params.timeInEditMs,
      session_id: params.sessionId,
    }),

  dashboardChatMessageSent: (params: {
    dashboardId: string;
    chatId: string | null;
    contextPills: string[];
    pillCount: number;
    messageLength: number;
    mode: "edit" | "published";
    dashboardWidgetCount: number;
    sessionId: string;
  }) =>
    track("Dashboard - Chat Message Sent", {
      dashboard_id: params.dashboardId,
      chat_id: params.chatId,
      source: "dashboard",
      context_pills: params.contextPills,
      pill_count: params.pillCount,
      message_length: params.messageLength,
      mode: params.mode,
      dashboard_widget_count: params.dashboardWidgetCount,
      session_id: params.sessionId,
    }),

  dashboardChatResponseFeedback: (params: {
    dashboardId: string;
    chatId: string | null;
    feedback: "thumbs_up" | "thumbs_down";
    sessionId: string;
  }) =>
    track("Dashboard - Chat Response Feedback", {
      dashboard_id: params.dashboardId,
      chat_id: params.chatId,
      source: "dashboard",
      feedback: params.feedback,
      session_id: params.sessionId,
    }),

  dashboardChatSourcesViewed: (
    dashboardId: string,
    chatId: string | null,
    sessionId: string,
  ) =>
    track("Dashboard - Chat Sources Viewed", {
      dashboard_id: dashboardId,
      chat_id: chatId,
      source: "dashboard",
      session_id: sessionId,
    }),

  // ── Chat (sidebar & input) ─────────────────────────────────────────────────
  chatNewChatClicked: () => track("Chat - New Chat Clicked", {}),

  chatNewFolderClicked: () => track("Chat - New Folder Clicked", {}),

  chatFolderClicked: (folderName: string) =>
    track("Chat - Folder Clicked", { folder_name: folderName }),

  chatChatOpened: (location: "folder" | "root") =>
    track("Chat - Chat Opened", { location }),

  chatSettingsClicked: () => track("Chat - Settings Clicked", {}),

  chatHelpDocsClicked: () => track("Chat - Help Docs Clicked", {}),

  chatLogoutClicked: () => track("Chat - Logout Clicked", {}),

  chatPlusButtonClicked: () => track("Chat - Plus Button Clicked", {}),

  chatFileUploadClicked: () => track("Chat - File Upload Clicked", {}),

  chatSlashCommandOpened: () => track("Chat - Slash Command Opened", {}),

  chatSlashCommandSelected: (
    commandName: string,
    commandType: string,
    sharingMode: string,
  ) =>
    track("Chat - Slash Command Selected", {
      command_name: commandName,
      command_type: commandType,
      sharing_mode: sharingMode,
    }),

  chatSlashCommandManageClicked: () =>
    track("Chat - Slash Command Manage Clicked", {}),

  chatSlashCommandCreateNewClicked: () =>
    track("Chat - Slash Command Create New Clicked", {}),

  chatMessageSubmitted: (params: {
    chatId: string | null;
    chatType: "new" | "existing";
    messageLength: number;
    inputMethod: "typed" | "suggested_prompt" | "slash_command";
    queryCategory: string | null;
  }) =>
    track("Chat - Message Submitted", {
      chat_id: params.chatId,
      chat_type: params.chatType,
      message_length: params.messageLength,
      input_method: params.inputMethod,
      query_category: params.queryCategory,
    }),

  chatStopGenerating: (timeElapsedSeconds: number) =>
    track("Chat - Stop Generating Clicked", {
      time_elapsed_seconds: timeElapsedSeconds,
    }),

  chatThinkingStepExpanded: (
    stepName: string,
    toolName: string | null,
    messageId: string,
  ) =>
    track("Chat - Thinking Step Expanded", {
      step_name: stepName,
      tool_name: toolName,
      message_id: messageId,
    }),

  chatResponseCopied: (messageId: string) =>
    track("Chat - Response Copied", { message_id: messageId }),

  chatResponseDownloaded: (messageId: string) =>
    track("Chat - Response Downloaded", { message_id: messageId }),

  chatThumbsUp: (messageId: string) =>
    track("Chat - Response Thumbs Up", { message_id: messageId }),

  chatThumbsDown: (messageId: string) =>
    track("Chat - Response Thumbs Down", { message_id: messageId }),

  chatResponseSourcesOpened: (messageIndex: number) =>
    track("Chat - Response Sources Opened", { message_index: messageIndex }),

  chatSourceCSVDownloaded: (
    sourceName: string,
    rowCount: number,
    messageIndex: number,
  ) =>
    track("Chat - Source CSV Downloaded", {
      source_name: sourceName,
      row_count: rowCount,
      message_index: messageIndex,
    }),

  chatQueryResultCSVDownloaded: (
    chatId: string,
    toolName: string,
    rowCount: number,
  ) =>
    track("Chat - Query Result CSV Downloaded", {
      chat_id: chatId,
      tool_name: toolName,
      row_count: rowCount,
    }),

  chatResponseSectionCopied: (sectionType: string, messageId: string) =>
    track("Chat - Response Section Copied", {
      section_type: sectionType,
      message_id: messageId,
    }),

  chatResponseLinkClicked: (
    linkType: string,
    linkText: string,
    messageId: string,
  ) =>
    track("Chat - Response Link Clicked", {
      link_type: linkType,
      link_text: linkText,
      message_id: messageId,
    }),

  chatSourceTabClicked: (
    sourceName: string,
    rowCount: number,
    messageIndex: number,
  ) =>
    track("Chat - Source Tab Clicked", {
      source_name: sourceName,
      row_count: rowCount,
      message_index: messageIndex,
    }),

  chatExistingChatLoaded: (chatId: string) =>
    track("Chat - Existing Chat Loaded", { chat_id: chatId }),

  // ── Integrations ──────────────────────────────────────────────────────────────
  integrationsPageViewed: () => track("Integrations - Page Viewed", {}),

  integrationsConnectClicked: (params: {
    integrationName: string;
    integrationCategory: string;
    connectionType: string;
    authMethod: string;
  }) =>
    track("Integrations - Connect Clicked", {
      integration_name: params.integrationName,
      integration_category: params.integrationCategory,
      connection_type: params.connectionType,
      auth_method: params.authMethod,
    }),

  integrationsIntegrationCreated: (params: {
    integrationName: string;
    integrationCategory: string;
    connectionType: string;
    authMethod: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Integrations - Integration Created", {
      integration_name: params.integrationName,
      integration_category: params.integrationCategory,
      connection_type: params.connectionType,
      auth_method: params.authMethod,
      success: params.success,
      error: params.error,
    }),

  integrationsIntegrationCreateCancelled: (params: {
    integrationName: string;
    integrationCategory: string;
    connectionType: string;
    authMethod: string;
  }) =>
    track("Integrations - Integration Create Cancelled", {
      integration_name: params.integrationName,
      integration_category: params.integrationCategory,
      connection_type: params.connectionType,
      auth_method: params.authMethod,
    }),

  integrationsDisconnectClicked: (
    integrationName: string,
    integrationCategory: string,
    connectionType: string,
  ) =>
    track("Integrations - Disconnect Clicked", {
      integration_name: integrationName,
      integration_category: integrationCategory,
      connection_type: connectionType,
    }),

  integrationsIntegrationDeleted: (params: {
    integrationName: string;
    integrationCategory: string;
    connectionType: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Integrations - Integration Deleted", {
      integration_name: params.integrationName,
      integration_category: params.integrationCategory,
      connection_type: params.connectionType,
      success: params.success,
      error: params.error,
    }),

  integrationsDisconnectCancelled: (
    integrationName: string,
    integrationCategory: string,
    connectionType: string,
  ) =>
    track("Integrations - Disconnect Cancelled", {
      integration_name: integrationName,
      integration_category: integrationCategory,
      connection_type: connectionType,
    }),

  integrationsLearnMoreClicked: () =>
    track("Integrations - Learn More Clicked", {}),

  integrationsAPICredentialsLinkClicked: (
    integrationName: string,
    integrationCategory: string,
    connectionType: string,
  ) =>
    track("Integrations - API Credentials Link Clicked", {
      integration_name: integrationName,
      integration_category: integrationCategory,
      connection_type: connectionType,
    }),

  // ── Chat List ─────────────────────────────────────────────────────────────────
  chatListChatActionsMenuOpened: (chatId: string, chatName: string) =>
    track("Chat List - Chat Actions Menu Opened", {
      chat_id: chatId,
      chat_name: chatName,
    }),

  chatListChatRenamed: (params: {
    chatId: string;
    oldName: string;
    newName: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Chat List - Chat Renamed", {
      chat_id: params.chatId,
      old_name: params.oldName,
      new_name: params.newName,
      success: params.success,
      error: params.error,
    }),

  chatListChatAddedToFolder: (params: {
    chatId: string;
    chatName: string;
    folderName: string;
    folderType: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Chat List - Chat Added to Folder", {
      chat_id: params.chatId,
      chat_name: params.chatName,
      folder_name: params.folderName,
      folder_type: params.folderType,
      success: params.success,
      error: params.error,
    }),

  chatListChatDeleted: (params: {
    chatId: string;
    chatName: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Chat List - Chat Deleted", {
      chat_id: params.chatId,
      chat_name: params.chatName,
      success: params.success,
      error: params.error,
    }),

  // ── Artifacts ─────────────────────────────────────────────────────────────────
  artifactsPreviewOpened: (
    fileName: string,
    fileType: string,
    chatId: string | null,
  ) =>
    track("Artifacts - Preview Opened", {
      file_name: fileName,
      file_type: fileType,
      chat_id: chatId,
    }),

  artifactsPreviewClosed: (
    fileName: string,
    fileType: string,
    chatId: string | null,
  ) =>
    track("Artifacts - Preview Closed", {
      file_name: fileName,
      file_type: fileType,
      chat_id: chatId,
    }),

  artifactsOpenedInExternalTool: (params: {
    fileName: string;
    fileType: string;
    chatId: string | null;
    toolName: string;
  }) =>
    track("Artifacts - Opened in External Tool", {
      file_name: params.fileName,
      file_type: params.fileType,
      chat_id: params.chatId,
      tool_name: params.toolName,
    }),

  artifactsDownloaded: (
    fileName: string,
    fileType: string,
    chatId: string | null,
  ) =>
    track("Artifacts - Downloaded", {
      file_name: fileName,
      file_type: fileType,
      chat_id: chatId,
    }),

  artifactsOpened: (
    toolName: string,
    artifactType: string,
    chatId: string | null,
  ) =>
    track("Artifacts - Opened", {
      tool_name: toolName,
      artifact_type: artifactType,
      chat_id: chatId,
    }),

  // ── Email Drafts ───────────────────────────────────────────────────────────────
  emailDraftsTabClicked: (chatId: string, emailIndex: number) =>
    track("Email Drafts - Tab Clicked", {
      chat_id: chatId,
      email_index: emailIndex,
    }),

  emailDraftsBodyCopied: (chatId: string, emailIndex: number) =>
    track("Email Drafts - Body Copied", {
      chat_id: chatId,
      email_index: emailIndex,
    }),

  emailDraftsOpenedInGmail: (chatId: string, emailIndex: number) =>
    track("Email Drafts - Opened in Gmail", {
      chat_id: chatId,
      email_index: emailIndex,
    }),

  // ── Write Operations ──────────────────────────────────────────────────────────
  writeOperationsApproved: (chatId: string, toolCallId: string) =>
    track("Write Operations - Approved", {
      chat_id: chatId,
      tool_call_id: toolCallId,
    }),

  writeOperationsRejected: (chatId: string, toolCallId: string) =>
    track("Write Operations - Rejected", {
      chat_id: chatId,
      tool_call_id: toolCallId,
    }),

  // ── App Errors ────────────────────────────────────────────────────────────────
  appErrorsClientError: (params: {
    errorType: string;
    errorMessage: string;
    errorCode: string | null;
    page: string;
    component: string | null;
    chatId: string | null;
    chatType: "new" | "existing" | null;
  }) =>
    track("App Errors - Client Error", {
      error_type: params.errorType,
      error_message: params.errorMessage,
      error_code: params.errorCode,
      page: params.page,
      component: params.component,
      chat_id: params.chatId,
      chat_type: params.chatType,
    }),

  // ── Folders ───────────────────────────────────────────────────────────────
  foldersNewFolderCreated: (
    folderName: string,
    success: boolean,
    error: string | null,
  ) =>
    track("Folders - New Folder Created", {
      folder_name: folderName,
      success,
      error,
    }),

  foldersFolderRenamed: (params: {
    oldFolderName: string;
    newFolderName: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Folders - Folder Renamed", {
      old_folder_name: params.oldFolderName,
      new_folder_name: params.newFolderName,
      success: params.success,
      error: params.error,
    }),

  foldersFolderPinned: (folderName: string) =>
    track("Folders - Folder Pinned", { folder_name: folderName }),

  foldersFolderDeleteClicked: (folderName: string, chatCount: number) =>
    track("Folders - Folder Delete Clicked", {
      folder_name: folderName,
      chat_count: chatCount,
    }),

  foldersFolderDeleted: (params: {
    folderName: string;
    chatCount: number;
    success: boolean;
    error: string | null;
  }) =>
    track("Folders - Folder Deleted", {
      folder_name: params.folderName,
      chat_count: params.chatCount,
      success: params.success,
      error: params.error,
    }),

  foldersFolderDeleteCancelled: (folderName: string) =>
    track("Folders - Folder Delete Cancelled", { folder_name: folderName }),

  foldersFolderExpanded: (folderName: string, chatCount: number) =>
    track("Folders - Folder Expanded", {
      folder_name: folderName,
      chat_count: chatCount,
    }),

  foldersChatActionsMenuOpened: (
    chatId: string,
    chatName: string,
    location: string,
  ) =>
    track("Folders - Chat Actions Menu Opened", {
      chat_id: chatId,
      chat_name: chatName,
      location,
    }),

  foldersChatRenamed: (params: {
    chatId: string;
    oldName: string;
    newName: string;
    location: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Folders - Chat Renamed", {
      chat_id: params.chatId,
      old_name: params.oldName,
      new_name: params.newName,
      location: params.location,
      success: params.success,
      error: params.error,
    }),

  foldersChatAddedToFolder: (params: {
    chatId: string;
    chatName: string;
    folderName: string;
    folderType: string;
    fromLocation: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Folders - Chat Added to Folder", {
      chat_id: params.chatId,
      chat_name: params.chatName,
      folder_name: params.folderName,
      folder_type: params.folderType,
      from_location: params.fromLocation,
      success: params.success,
      error: params.error,
    }),

  foldersChatRemovedFromFolder: (params: {
    chatId: string;
    chatName: string;
    folderName: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Folders - Chat Removed from Folder", {
      chat_id: params.chatId,
      chat_name: params.chatName,
      folder_name: params.folderName,
      success: params.success,
      error: params.error,
    }),

  foldersChatDeleted: (params: {
    chatId: string;
    chatName: string;
    location: string;
    success: boolean;
    error: string | null;
  }) =>
    track("Folders - Chat Deleted", {
      chat_id: params.chatId,
      chat_name: params.chatName,
      location: params.location,
      success: params.success,
      error: params.error,
    }),

  // ── Search ────────────────────────────────────────────────────────────────
  searchModalOpened: (trigger: "shortcut" | "sidebar_button") =>
    track("Search - Modal Opened", { trigger }),

  searchQuerySubmitted: (props: {
    query_length: number;
    deep_used: boolean;
    result_count: number;
    top_score: number | null;
  }) => track("Search - Query Submitted", props),

  searchResultOpened: (props: {
    query: string;
    result_type: "chat" | "dashboard" | "widget" | "artifact";
    result_position: number;
    deep_used: boolean;
  }) => track("Search - Result Opened", props),
};
