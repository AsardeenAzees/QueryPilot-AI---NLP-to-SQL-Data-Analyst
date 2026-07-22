export function LoadingSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="skeleton h-4 w-2/5 rounded-full" />
      <div className="skeleton h-4 w-4/5 rounded-full" />
      <div className="skeleton h-24 w-full rounded-xl" />
    </div>
  );
}
