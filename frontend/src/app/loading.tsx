export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-gray-50 transition-colors dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Loading page...
        </p>
      </div>
    </div>
  );
}
