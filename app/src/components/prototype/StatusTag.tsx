export function StatusTag({ status }: { status: string }) {
  if (status === "Draft") {
    return (
      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
        Draft
      </span>
    );
  }
  if (status === "Active") {
    return (
      <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-md">
        Active
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-md">
      {status}
    </span>
  );
}
