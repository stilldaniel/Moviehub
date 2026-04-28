import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background red glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 700,
          height: 700,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(220,38,38,0.07) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Giant 404 */}
      <h1
        className="font-black select-none leading-none mb-2"
        style={{
          fontSize: "clamp(120px, 20vw, 220px)",
          background: "linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        404
      </h1>

      {/* Film strip decoration */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-sm"
            style={{ width: i === 3 ? 32 : 16, height: 10 }}
          />
        ))}
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-center">
        Page Not Found
      </h2>
      <p className="text-gray-400 text-sm sm:text-base text-center max-w-md mb-10 leading-relaxed">
        Looks like this scene got cut from the film. The page you&apos;re looking for
        doesn&apos;t exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105"
        >
          Back to Home
        </Link>
        <Link
          href="/movie"
          className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
        >
          Browse Movies
        </Link>
      </div>
    </div>
  );
}