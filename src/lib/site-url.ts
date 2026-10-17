export function getStudioUrl() {
  return (
    process.env.NEXT_PUBLIC_STUDIO_URL?.replace(/\/$/, "") ??
    "http://localhost:3001"
  );
}
