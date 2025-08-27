"use client";
import Chip from "@/components/ui/Chip";

type FilterPillProps = {
  label: string;
  selected: boolean;
  onToggle: (next: boolean) => void;
  className?: string;
};

export default function FilterPill({ label, selected, onToggle, className }: FilterPillProps) {
  return (
    <button
      type="button"
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
      onClick={() => onToggle(!selected)}
      aria-pressed={selected}
      aria-label={`${label} ${selected ? "selected" : "not selected"}`}
    >
      <Chip as="span" className={className} ariaPressed={selected} variant={selected ? "default" : "outline"}>
        {label}
      </Chip>
    </button>
  );
}
