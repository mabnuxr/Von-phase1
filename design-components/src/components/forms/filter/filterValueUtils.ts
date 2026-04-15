/**
 * Utilities for inspecting filter values.
 */

/**
 * True when a filter value is unset or carries no usable content:
 * `undefined` / `null` / `''` / `[]` / an array of all empty entries.
 *
 * Used by chip renderers so an operator picked without a concrete value
 * still shows the operator label rather than the placeholder.
 */
export function isEmptyFilterValue(v: unknown): boolean {
  return (
    v === undefined ||
    v === null ||
    v === '' ||
    (Array.isArray(v) && (v.length === 0 || v.every((x) => x === '' || x == null)))
  );
}
