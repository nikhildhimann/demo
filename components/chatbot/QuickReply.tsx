import { Button } from "@/components/ui/button";

export type QuickReplyOption = {
  label: string;
  value: string;
};

type QuickReplyProps = {
  options: QuickReplyOption[];
  onSelect: (value: string, label: string) => void;
  disabled?: boolean;
};

export function QuickReply({ options, onSelect, disabled = false }: QuickReplyProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          className="rounded-full border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-emerald-500"
          onClick={() => onSelect(option.value, option.label)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
