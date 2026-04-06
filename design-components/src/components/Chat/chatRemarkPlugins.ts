import remarkGfm from 'remark-gfm';
import { defaultRemarkPlugins } from 'streamdown';
import type { Pluggable } from 'unified';

/**
 * Shared remark plugins for all chat markdown rendering.
 *
 * Overrides Streamdown's default remark-gfm config to disable single-tilde
 * strikethrough (`singleTilde: false`). This prevents tildes used as
 * "approximately" (e.g. ~$29K, ~$480K) from being mis-parsed as
 * strikethrough. Only ~~double tilde~~ produces strikethrough.
 */

// Pull everything except gfm from streamdown defaults (currently just math).
const { gfm: _gfm, ...otherDefaults } = defaultRemarkPlugins;

export const chatRemarkPlugins: Pluggable[] = [
  [remarkGfm, { singleTilde: false }],
  ...Object.values(otherDefaults),
];
