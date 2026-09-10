export default function Loading() {
  return <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-live="polite"><div className="text-center"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary rounded-full animate-spin mx-auto"/><p className="text-gray-600 mt-3">Loading…</p></div></div>;
}
