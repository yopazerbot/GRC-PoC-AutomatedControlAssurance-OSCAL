import type { Mode } from "../types";

interface Props {
  onSelect: (mode: Mode) => void;
  disabled: boolean;
}

export default function ScenarioSelector({ onSelect, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {(["mock-pass", "mock-fail", "live"] as Mode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          disabled={disabled}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-sm rounded transition-colors capitalize"
        >
          {mode.replace("-", " ")}
        </button>
      ))}
    </div>
  );
}
