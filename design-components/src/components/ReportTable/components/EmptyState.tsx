interface EmptyStateProps {
  message: string;
  className?: string;
}

/** Centered placeholder shown when the data table has no rows. */
export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-center py-12 text-sm text-gray-700">
        {message}
      </div>
    </div>
  );
}
