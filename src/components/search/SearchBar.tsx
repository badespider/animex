"use client";
export default function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block w-full">
      <span className="sr-only">Search anime</span>
      <input
        aria-label="Search anime"
        placeholder="Search anime..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded outline-none focus:ring"
      />
    </label>
  );
}
