"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#191C1B",
          color: "#F2F4F0",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            This page couldn’t load
          </h1>
          <p style={{ color: "#B9C0B9", fontSize: "0.875rem" }}>
            A server error occurred. Reload to try again.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "1rem",
                color: "#9AA39A",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
              }}
            >
              ERROR {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.25rem",
              border: 0,
              borderRadius: "0.5rem",
              background: "#F2F4F0",
              color: "#191C1B",
              padding: "0.625rem 1rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
