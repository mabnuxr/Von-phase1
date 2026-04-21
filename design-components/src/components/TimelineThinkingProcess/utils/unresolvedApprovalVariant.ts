export interface UnresolvedApprovalVariant {
  border: string;
  icon: string;
  label: string;
  text: string;
}

const ERROR_VARIANT: UnresolvedApprovalVariant = {
  border: 'border-red-200',
  icon: 'text-red-400',
  label: 'text-red-500',
  text: 'Failed',
};

const SKIPPED_VARIANT: UnresolvedApprovalVariant = {
  border: 'border-gray-200',
  icon: 'text-gray-400',
  label: 'text-gray-500',
  text: 'Skipped',
};

const EXPIRED_VARIANT: UnresolvedApprovalVariant = {
  border: 'border-amber-200',
  icon: 'text-amber-500',
  label: 'text-amber-600',
  text: 'Invalid',
};

export function getUnresolvedApprovalVariant(flags: {
  isError?: boolean;
  isSkipped?: boolean;
}): UnresolvedApprovalVariant {
  if (flags.isError) return ERROR_VARIANT;
  if (flags.isSkipped) return SKIPPED_VARIANT;
  return EXPIRED_VARIANT;
}
