"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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

      {/* Error icon */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)" }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#dc2626"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black mb-3 text-center">
        Something Went Wrong
      </h1>
      <p className="text-gray-400 text-sm sm:text-base text-center max-w-md mb-3 leading-relaxed">
        An unexpected error occurred. This might be a temporary issue — try
        refreshing or go back home.
      </p>

      {/* Error message if available */}
      {error?.message && (
        <div
          className="mb-8 px-4 py-2 rounded-lg text-xs font-mono text-red-400 max-w-md text-center"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          {error.message}
        </div>
      )}

      {!error?.message && <div className="mb-8" />}

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={reset}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-105 cursor-pointer"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}