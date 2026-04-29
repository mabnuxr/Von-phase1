interface LoadingSkeletonProps {
  className?: string;
}

/** Five animated rows shown while initial data is loading. Fixed at 5 rows
 *  because the real row count isn't known until data arrives, and 5 is a
 *  comfortable visual placeholder for typical screen heights. */
export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="animate-pulse">
        <div className="h-10 bg-gray-50 rounded-t-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-gray-100 flex items-center px-4">
            <div className="h-4 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
