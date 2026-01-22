"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
};

export function Modal({ title, isOpen, onClose, children, maxWidth = "max-w-3xl" }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className={`relative w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-sm border border-gray-200 bg-white shadow-xl`}>
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-black hover:text-black"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-80px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
