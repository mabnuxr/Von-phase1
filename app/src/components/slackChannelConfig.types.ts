export interface ChannelCondition {
  field: "channel_name" | "channel_id" | "channel_topic";
  operator: "starts_with" | "contains" | "ends_with" | "sfdc_field_link";
  value: string;
}

export interface ChannelGroup {
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
