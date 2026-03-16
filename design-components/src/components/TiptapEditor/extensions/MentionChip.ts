import Mention from '@tiptap/extension-mention';

/**
 * MentionChip — Generic Tiptap extension for inline @ mention chips.
 *
 * Renders atomic mention nodes in the editor text. The node stores:
 *   - id:    unique identifier of the mentioned item
 *   - label: display name shown in the chip
 *   - mentionType: item type (e.g. "dashboard", "report", etc.)
 *   - version: version number at time of mention
 *
 * The `suggestion` config must be injected via `.configure({ suggestion })`
 * by the consumer hook (useMentions).
 */
export const MentionChip = Mention.extend({
  name: 'mention',

  addAttributes() {
    return {
      ...this.parent?.(),
      mentionType: { default: null },
      version: { default: null },
    };
  },
});
