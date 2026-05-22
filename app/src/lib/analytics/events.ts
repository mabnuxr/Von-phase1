/**
 * Central event schema for PostHog analytics.
 *
 * Every tracked event lives here. To add a new event:
 *   1. Add a key to EventMap with its required extra properties
 *   2. Optionally add a named method to `report` in tracker.ts
 *
 * Base properties (user_id, user_email, user_role, company, company_id) are
 * registered as PostHog super properties at login and attached automatically —
 * do not include them here.
 */
export type EventMap = {
  // ── Settings ──────────────────────────────────────────────────────────────
  "Settings - Page Viewed": { entry_point: string };
  "Settings - Tab Clicked": { tab_name: string };
  "Settings - Back to Home Clicked": { current_tab: string };
  "Settings - Help Docs Clicked": { current_tab: string };
  "Settings - Logout Clicked": { current_tab: string };

  // ── Chat ──────────────────────────────────────────────────────────────────
  "Chat - Page Viewed": Record<never, never>;
  "Chat - Template Category Clicked": { category_name: string };
  "Chat - Suggested Prompt Clicked": {
    prompt_text: string;
    category_name: string;
    prompt_position: number;
  };
  "Chat - Suggested Prompt Arrow Clicked": { category_name: string };

  // ── Email ──────────────────────────────────────────────────────────────────
  "Email - Page Viewed": Record<never, never>;
  "Email - Settings Saved": {
    success: boolean;
    error: string | null;
    email_object: string;
    opportunity_field: string;
    account_field: string;
    email_body_field: string;
    is_first_save: boolean;
  };

  // ── Manage Team ──────────────────────────────────────────────────────────────
  "Manage Team - Page Viewed": Record<never, never>;
  "Manage Team - Member Searched": {
    search_query: string;
    results_count: number;
  };
  "Manage Team - Add Member Clicked": Record<never, never>;
  "Manage Team - Member Added": {
    success: boolean;
    error: string | null;
    member_email: string;
    member_role: string;
  };
  "Manage Team - Add Member Cancelled": Record<never, never>;
  "Manage Team - Actions Menu Opened": {
    target_user_email: string;
    target_user_role: string;
  };
  "Manage Team - Edit Details Clicked": {
    target_user_email: string;
    target_user_role: string;
  };
  "Manage Team - Edit Details Saved": {
    success: boolean;
    error: string | null;
    old_role: string;
    new_role: string;
    target_user_email: string;
  };
  "Manage Team - Edit Details Cancelled": { target_user_email: string };
  "Manage Team - Access Permissions Clicked": {
    target_user_email: string;
    target_user_role: string;
  };
  "Manage Team - Salesforce Updates Toggled": {
    toggled_to: boolean;
    target_user_email: string;
    target_user_role: string;
  };
  "Manage Team - Delete User Clicked": {
    target_user_email: string;
    target_user_role: string;
  };
  "Manage Team - Member Removed": {
    success: boolean;
    error: string | null;
    target_user_email: string;
    target_user_role: string;
  };
  "Manage Team - Remove Cancelled": { target_user_email: string };
  "Manage Team - Questions Tooltip Viewed": {
    target_user_email: string;
    questions_last_7d: number;
    questions_last_30d: number;
    questions_all_time: number;
  };
  "Manage Team - Learn More Clicked": Record<never, never>;

  // ── Dashboards ────────────────────────────────────────────────────────────
  "Dashboards - Dashboard Clicked": { dashboard_name: string };

  // ── Chat (sidebar & input) ─────────────────────────────────────────────────
  "Chat - New Chat Clicked": Record<never, never>;
  "Chat - New Folder Clicked": Record<never, never>;
  "Chat - Folder Clicked": { folder_name: string };
  "Chat - Chat Opened": { location: "folder" | "root" };
  "Chat - Settings Clicked": Record<never, never>;
  "Chat - Help Docs Clicked": Record<never, never>;
  "Chat - Logout Clicked": Record<never, never>;
  "Chat - Plus Button Clicked": Record<never, never>;
  "Chat - File Upload Clicked": Record<never, never>;
  "Chat - Slash Command Opened": Record<never, never>;
  "Chat - Slash Command Selected": {
    command_name: string;
    command_type: string;
    sharing_mode: string;
  };
  "Chat - Slash Command Manage Clicked": Record<never, never>;
  "Chat - Slash Command Create New Clicked": Record<never, never>;
  "Chat - Message Submitted": {
    chat_id: string | null;
    chat_type: "new" | "existing";
    message_length: number;
    input_method: "typed" | "suggested_prompt" | "slash_command";
    query_category: string | null;
  };
  "Chat - Stop Generating Clicked": { time_elapsed_seconds: number };
  "Chat - Thinking Step Expanded": {
    step_name: string;
    tool_name: string | null;
    message_id: string;
  };
  "Chat - Response Copied": { message_id: string };
  "Chat - Response Downloaded": { message_id: string };
  "Chat - Response Thumbs Up": { message_id: string };
  "Chat - Response Thumbs Down": { message_id: string };
  "Chat - Response Sources Opened": { message_index: number };
  "Chat - Source CSV Downloaded": {
    source_name: string;
    row_count: number;
    message_index: number;
  };
  "Chat - Query Result CSV Downloaded": {
    chat_id: string;
    tool_name: string;
    row_count: number;
  };
  "Chat - Response Section Copied": {
    section_type: string;
    message_id: string;
  };
  "Chat - Response Link Clicked": {
    link_type: string;
    link_text: string;
    message_id: string;
  };
  "Chat - Source Tab Clicked": {
    source_name: string;
    row_count: number;
    message_index: number;
  };
  "Chat - Existing Chat Loaded": { chat_id: string };

  // ── Integrations ──────────────────────────────────────────────────────────────
  "Integrations - Page Viewed": Record<never, never>;
  "Integrations - Connect Clicked": {
    integration_name: string;
    integration_category: string;
    connection_type: string;
    auth_method: string;
  };
  "Integrations - Integration Created": {
    integration_name: string;
    integration_category: string;
    connection_type: string;
    auth_method: string;
    success: boolean;
    error: string | null;
  };
  "Integrations - Integration Create Cancelled": {
    integration_name: string;
    integration_category: string;
    connection_type: string;
    auth_method: string;
  };
  "Integrations - Disconnect Clicked": {
    integration_name: string;
    integration_category: string;
    connection_type: string;
  };
  "Integrations - Integration Deleted": {
    integration_name: string;
    integration_category: string;
    connection_type: string;
    success: boolean;
    error: string | null;
  };
  "Integrations - Disconnect Cancelled": {
    integration_name: string;
    integration_category: string;
    connection_type: string;
  };
  "Integrations - API Credentials Link Clicked": {
    integration_name: string;
    integration_category: string;
    connection_type: string;
  };

  // ── Chat List ─────────────────────────────────────────────────────────────────
  "Chat List - Chat Actions Menu Opened": {
    chat_id: string;
    chat_name: string;
  };
  "Chat List - Chat Renamed": {
    chat_id: string;
    old_name: string;
    new_name: string;
    success: boolean;
    error: string | null;
  };
  "Chat List - Chat Added to Folder": {
    chat_id: string;
    chat_name: string;
    folder_name: string;
    folder_type: string;
    success: boolean;
    error: string | null;
  };
  "Chat List - Chat Deleted": {
    chat_id: string;
    chat_name: string;
    success: boolean;
    error: string | null;
  };

  // ── Artifacts ─────────────────────────────────────────────────────────────────
  "Artifacts - Preview Opened": {
    file_name: string;
    file_type: string;
    chat_id: string | null;
  };
  "Artifacts - Preview Closed": {
    file_name: string;
    file_type: string;
    chat_id: string | null;
  };
  "Artifacts - Opened in External Tool": {
    file_name: string;
    file_type: string;
    chat_id: string | null;
    tool_name: string;
  };
  "Artifacts - Downloaded": {
    file_name: string;
    file_type: string;
    chat_id: string | null;
  };
  "Artifacts - Opened": {
    tool_name: string;
    artifact_type: string;
    chat_id: string | null;
  };

  // ── Email Drafts ───────────────────────────────────────────────────────────────
  "Email Drafts - Tab Clicked": {
    chat_id: string;
    email_index: number;
  };
  "Email Drafts - Body Copied": {
    chat_id: string;
    email_index: number;
  };
  "Email Drafts - Opened in Gmail": {
    chat_id: string;
    email_index: number;
  };

  // ── Write Operations ──────────────────────────────────────────────────────────
  "Write Operations - Approved": {
    chat_id: string;
    tool_call_id: string;
  };
  "Write Operations - Rejected": {
    chat_id: string;
    tool_call_id: string;
  };

  // ── App Errors ────────────────────────────────────────────────────────────────
  "App Errors - Client Error": {
    error_type: string;
    error_message: string;
    error_code: string | null;
    page: string;
    component: string | null;
    chat_id: string | null;
    chat_type: "new" | "existing" | null;
  };

  // ── Folders ───────────────────────────────────────────────────────────────
  "Folders - New Folder Created": {
    folder_name: string;
    success: boolean;
    error: string | null;
  };
  "Folders - Folder Renamed": {
    old_folder_name: string;
    new_folder_name: string;
    success: boolean;
    error: string | null;
  };
  "Folders - Folder Pinned": { folder_name: string };
  "Folders - Folder Delete Clicked": {
    folder_name: string;
    chat_count: number;
  };
  "Folders - Folder Deleted": {
    folder_name: string;
    chat_count: number;
    success: boolean;
    error: string | null;
  };
  "Folders - Folder Delete Cancelled": { folder_name: string };
  "Folders - Folder Expanded": { folder_name: string; chat_count: number };
  "Folders - Chat Actions Menu Opened": {
    chat_id: string;
    chat_name: string;
    location: string;
  };
  "Folders - Chat Renamed": {
    chat_id: string;
    old_name: string;
    new_name: string;
    location: string;
    success: boolean;
    error: string | null;
  };
  "Folders - Chat Added to Folder": {
    chat_id: string;
    chat_name: string;
    folder_name: string;
    folder_type: string;
    from_location: string;
    success: boolean;
    error: string | null;
  };
  "Folders - Chat Removed from Folder": {
    chat_id: string;
    chat_name: string;
    folder_name: string;
    success: boolean;
    error: string | null;
  };
  "Folders - Chat Deleted": {
    chat_id: string;
    chat_name: string;
    location: string;
    success: boolean;
    error: string | null;
  };
};

export type EventName = keyof EventMap;
export type EventProps<E extends EventName> = EventMap[E];
