/**
 * `_key` is a client-side stable React key, generated on creation. Stored
 * alongside the persisted fields so React can reconcile rows by identity
 * rather than array index (avoids cursor jumps / focus loss on reorder).
 * Backend ignores extra fields, so it round-trips harmlessly.
 */
export interface ChannelCondition {
  _key?: string;
  field: "channel_name" | "channel_id" | "channel_topic";
  operator: "starts_with" | "contains" | "ends_with" | "sfdc_field_link";
  value: string;
}

export interface ChannelGroup {
  _key?: string;
  name: string;
  conditions: ChannelCondition[];
  condition_logic: "and" | "or";
}

export interface ChannelCategory {
  type: "external";
  groups: ChannelGroup[];
}

export interface SlackChannelConfigData {
  channel_categories: ChannelCategory[];
}

export const DEFAULT_SLACK_CHANNEL_CONFIG: SlackChannelConfigData = {
  channel_categories: [
    {
      type: "external",
      groups: [
        {
          name: "Customer channels",
          conditions: [
            { field: "channel_name", operator: "starts_with", value: "" },
          ],
          condition_logic: "or",
        },
      ],
    },
  ],
};
