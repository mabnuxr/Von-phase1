import { defaultRemarkPlugins } from 'streamdown';
import type { Pluggable } from 'unified';
import { remarkStrikethroughGuard } from './remarkStrikethroughGuard';

/**
 * Shared remark plugins for all chat markdown rendering.
 *
 * Includes Streamdown's defaults (remark-gfm, remark-math) plus our
 * strikethrough guard that prevents single tildes used as "approximately"
 * from being mis-parsed as strikethrough.
 */
export const chatRemarkPlugins: Pluggable[] = [
  ...Object.values(defaultRemarkPlugins),
  remarkStrikethroughGuard,
];
