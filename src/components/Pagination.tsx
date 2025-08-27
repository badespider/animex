"use client";
import React from "react";

export default function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total?: number; // total items (optional)
  limit: number;
  onChange: (nextPage: number) => void;
}) {
  const lastPage = total && limit ? Math.max(1, Math.ceil(total / limit)) : undefined;
  const hasPrev = page > 1;
  const hasNext = lastPage ? page < lastPage : true; // if unknown, allow next

  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      <button
        className="px-3 py-1 border rounded disabled:opacity-50"
        onClick={() => onChange(page - 1)}
        disabled={!hasPrev}
        aria-label="Previous page"
      >
        Prev
      </button>
      <span className="text-sm opacity-80">
        Page {page}
        {lastPage ? ` / ${lastPage}` : ""}
      </span>
      <button
        className="px-3 py-1 border rounded disabled:opacity-50"
        onClick={() => onChange(page + 1)}
        disabled={!hasNext}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}

