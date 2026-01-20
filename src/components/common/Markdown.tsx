import { type ReactNode } from "react";
import clsx from "clsx";
import ReactMarkdown, { type Components } from "react-markdown";

const DEFAULT_CLASSES: Record<string, string> = {
  p: "text-sm leading-relaxed text-gray-700",
  strong: "font-semibold text-ink",
  em: "italic text-gray-700",
  blockquote: "border-l border-gray-300 pl-3 text-sm text-gray-600",
  ul: "ml-5 list-disc space-y-1 text-sm text-gray-700",
  ol: "ml-5 list-decimal space-y-1 text-sm text-gray-700",
  li: "leading-relaxed",
  a: "text-ink underline underline-offset-4"
};

const components: Components = {
  p: ({ children }: { children?: ReactNode }) => <p className={DEFAULT_CLASSES.p}>{children}</p>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className={DEFAULT_CLASSES.strong}>{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => <em className={DEFAULT_CLASSES.em}>{children}</em>,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className={DEFAULT_CLASSES.blockquote}>{children}</blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => <ul className={DEFAULT_CLASSES.ul}>{children}</ul>,
  ol: ({ children }: { children?: ReactNode }) => <ol className={DEFAULT_CLASSES.ol}>{children}</ol>,
  li: ({ children }: { children?: ReactNode }) => <li className={DEFAULT_CLASSES.li}>{children}</li>,
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a className={DEFAULT_CLASSES.a} href={href ?? "#"} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
};

type MarkdownProps = {
  content: string;
  className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={clsx("space-y-2", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
