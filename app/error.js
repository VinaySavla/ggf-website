"use client";
export default function GlobalError({ reset }) {
  return <main className="min-h-[60vh] flex items-center justify-center p-6"><div className="max-w-lg text-center"><h1 className="text-3xl font-bold">Something went wrong</h1><p className="text-gray-600 mt-3">Your information is safe. Please try this page again; if the problem continues, contact GGF support.</p><button onClick={reset} className="bg-primary text-white rounded-lg px-5 py-3 mt-6">Try again</button></div></main>;
}
