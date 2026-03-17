/**
 * Finds the last element in an array satisfying the predicate without copying
 * or mutating the array. O(n) time, O(1) space — avoids the allocation cost of
 * [...arr].reverse().find().
 */
export function findLast<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean,
): T | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return arr[i];
  }
  return undefined;
}
