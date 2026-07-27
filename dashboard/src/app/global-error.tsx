"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0f1e", color: "#ffffff", padding: "40px", fontFamily: "sans-serif" }}>
        <h2>Something went wrong!</h2>
        <p>{error.message}</p>
        <button
          onClick={() => reset()}
          style={{
            padding: "8px 16px",
            background: "#8b5cf6",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
