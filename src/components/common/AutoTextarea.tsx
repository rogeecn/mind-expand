import clsx from "clsx";
import { type ChangeEvent, type TextareaHTMLAttributes } from "react";

type AutoTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function AutoTextarea({
  value,
  onValueChange,
  className,
  placeholder,
  ...props
}: AutoTextareaProps) {
  // Shared styles ensuring the mirror and textarea are identical geometrically
  // Note: We append a space to the mirror value to ensure trailing newlines render height correctly
  return (
    <div className="grid w-full relative group">
      {/* The Mirror: Invisible div that drives the height */}
      <div
        aria-hidden="true"
        className={clsx(
          className,
          "invisible col-start-1 row-start-1 whitespace-pre-wrap break-words border-transparent bg-transparent text-transparent select-none pointer-events-none"
        )}
      >
        {value ? value + " " : placeholder + " "}
      </div>

      {/* The Input: Absolute positioned textarea filling the grid cell */}
      <textarea
        {...props}
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onValueChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        className={clsx(
          className,
          "col-start-1 row-start-1 w-full resize-none overflow-hidden bg-transparent text-ink placeholder-gray-300 focus:outline-none"
        )}
      />
    </div>
  );
}
