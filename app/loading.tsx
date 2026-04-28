export default function Loading() {
  return (
    <div className="bg-black min-h-screen text-white">

      {/* Hero skeleton */}
      <div className="relative w-full h-[56vh] min-h-100 bg-gray-900 animate-pulse">
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-12 left-6 sm:left-12 space-y-4 w-full max-w-lg px-4">
          <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-80 bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-800 rounded animate-pulse" />
          <div className="h-4 w-56 bg-gray-800 rounded animate-pulse" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 w-28 bg-gray-700 rounded-lg animate-pulse" />
            <div className="h-10 w-28 bg-gray-800 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Rows skeleton */}
      <div className="px-6 space-y-12 pb-16 pt-8">
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div key={rowIndex} className="space-y-3">
            {/* Row title */}
            <div className="h-6 w-48 bg-gray-800 rounded animate-pulse" />
            {/* Row cards */}
            <div className="flex gap-4 overflow-hidden pb-2">
              {Array.from({ length: 8 }).map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="shrink-0 w-40 md:w-48 rounded-xl bg-gray-800 animate-pulse"
                  style={{ height: 240 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}