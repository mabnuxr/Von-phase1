export type MustacheVariables = Record<string, string | number | null | undefined>;

const MUSTACHE_RE = /\{\{([\w.]+)\}\}/g;

/**
 * Replace `{{key}}` tokens in `content` with the matching value from
 * `variables`. Dotted keys like `widget_id.value` are supported. Missing
 * keys are left as their raw `{{key}}` form so authoring mistakes stay
 * visible; null/undefined values collapse to empty string.
 */
export function resolveMustache(content: string, variables: MustacheVariables | undefined): string {
  if (!content || !variables) return content;
  return content.replace(MUSTACHE_RE, (match, key) => {
    if (!(key in variables)) return match;
    const val = variables[key];
    return val == null ? '' : String(val);
  });
}
