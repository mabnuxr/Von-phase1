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

  emailSettingsSaved: (
    success: boolean,
    error: string | null,
    emailObject: string,
    opportunityField: string,
    accountField: string,
    emailBodyField: string,
    isFirstSave: boolean,
  ) =>
    track("Email - Settings Saved", {
      success,
      error,
      email_object: emailObject,
      opportunity_field: opportunityField,
      account_field: accountField,
      email_body_field: emailBodyField,
      is_first_save: isFirstSave,
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

  manageTeamMemberAdded: (
    success: boolean,
    error: string | null,
    memberEmail: string,
    memberRole: string,
  ) =>
    track("Manage Team - Member Added", {
      success,
      error,
      member_email: memberEmail,
      member_role: memberRole,
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

  manageTeamEditDetailsSaved: (
    success: boolean,
    error: string | null,
    oldRole: string,
    newRole: string,
    targetUserEmail: string,
  ) =>
    track("Manage Team - Edit Details Saved", {
      success,
      error,
      old_role: oldRole,
      new_role: newRole,
      target_user_email: targetUserEmail,
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

  manageTeamMemberRemoved: (
    success: boolean,
    error: string | null,
    targetUserEmail: string,
    targetUserRole: string,
  ) =>
    track("Manage Team - Member Removed", {
      success,
      error,
      target_user_email: targetUserEmail,
      target_user_role: targetUserRole,
    }),

  manageTeamRemoveCancelled: (targetUserEmail: string) =>
    track("Manage Team - Remove Cancelled", {
      target_user_email: targetUserEmail,
    }),

  manageTeamQuestionsTooltipViewed: (
    targetUserEmail: string,
    questionsLast7d: number,
    questionsLast30d: number,
    questionsAllTime: number,
  ) =>
    track("Manage Team - Questions Tooltip Viewed", {
      target_user_email: targetUserEmail,
      questions_last_7d: questionsLast7d,
      questions_last_30d: questionsLast30d,
      questions_all_time: questionsAllTime,
    }),

  manageTeamLearnMoreClicked: () =>
    track("Manage Team - Learn More Clicked", {}),

  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboardOpened: (dashboardName: string) =>
    track("Dashboards - Dashboard Clicked", { dashboard_name: dashboardName }),

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

  chatMessageSubmitted: (
    chatId: string | null,
    chatType: "new" | "existing",
    messageLength: number,
    inputMethod: "typed" | "suggested_prompt" | "slash_command",
    queryCategory: string | null,
  ) =>
    track("Chat - Message Submitted", {
      chat_id: chatId,
      chat_type: chatType,
      message_length: messageLength,
      input_method: inputMethod,
      query_category: queryCategory,
    }),

  chatStopGenerating: (timeElapsedSeconds: number) =>
    track("Chat - Stop Generating Clicked", {
      time_elapsed_seconds: timeElapsedSeconds,
    }),

  chatThinkingStepExpanded: (
    stepName: string,
    toolName: string | null,
    messageIndex: number,
  ) =>
    track("Chat - Thinking Step Expanded", {
      step_name: stepName,
      tool_name: toolName,
      message_index: messageIndex,
    }),

  chatResponseCopied: (messageIndex: number) =>
    track("Chat - Response Copied", { message_index: messageIndex }),

  chatResponseDownloaded: (messageIndex: number) =>
    track("Chat - Response Downloaded", { message_index: messageIndex }),

  chatThumbsUp: (messageIndex: number) =>
    track("Chat - Response Thumbs Up", { message_index: messageIndex }),

  chatThumbsDown: (messageIndex: number) =>
    track("Chat - Response Thumbs Down", { message_index: messageIndex }),

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

  chatResponseSectionCopied: (sectionType: string, messageIndex: number) =>
    track("Chat - Response Section Copied", {
      section_type: sectionType,
      message_index: messageIndex,
    }),

  chatResponseLinkClicked: (
    linkType: string,
    linkText: string,
    messageIndex: number,
  ) =>
    track("Chat - Response Link Clicked", {
      link_type: linkType,
      link_text: linkText,
      message_index: messageIndex,
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
};
