/**
 * Reference type discriminator for message references.
 * Only "dashboard" is supported today; extend as new types are added.
 */
export const ReferenceType = {
  Dashboard: "dashboard",
} as const;

export type ReferenceType = (typeof ReferenceType)[keyof typeof ReferenceType];
