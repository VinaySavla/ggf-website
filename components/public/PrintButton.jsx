"use client";
export default function PrintButton() {
  return <button onClick={() => window.print()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Print / save receipt</button>;
}
