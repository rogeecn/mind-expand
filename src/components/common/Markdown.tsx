import { type ReactNode } from "react";
import clsx from "clsx";
import ReactMarkdown, { type Components } from "react-markdown";

const PROSE_CLASSES: Record<string, string> = {
  p: "font-sans text-[15px] leading-7 text-gray-800 mb-4 last:mb-0",
  h1: "font-serif text-2xl font-bold text-ink mt-6 mb-3 leading-tight",
  h2: "font-serif text-xl font-bold text-ink mt-5 mb-2.5 leading-tight",
  h3: "font-serif text-lg font-bold text-ink mt-4 mb-2 leading-tight uppercase tracking-wide",
  strong: "font-bold text-black",
  em: "italic font-serif text-gray-700",
  blockquote: "border-l-2 border-black pl-4 py-1 my-4 font-serif italic text-lg text-gray-700 bg-gray-50/50",
  ul: "ml-0 list-none space-y-2 mb-4",
  ol: "ml-0 list-decimal list-inside space-y-2 mb-4 text-gray-800 font-medium",
  li: "relative pl-4 leading-7 text-gray-800 before:content-['•'] before:absolute before:left-0 before:text-gray-400 before:font-serif",
  li_ordered: "leading-7 text-gray-800 pl-1",
  a: "text-black underline decoration-1 underline-offset-4 decoration-gray-400 hover:decoration-black transition-colors"
};

const components: Components = {
  p: ({ children }) => <p className={PROSE_CLASSES.p}>{children}</p>,
  h1: ({ children }) => <h1 className={PROSE_CLASSES.h1}>{children}</h1>,
  h2: ({ children }) => <h2 className={PROSE_CLASSES.h2}>{children}</h2>,
  h3: ({ children }) => <h3 className={PROSE_CLASSES.h3}>{children}</h3>,
  strong: ({ children }) => <strong className={PROSE_CLASSES.strong}>{children}</strong>,
  em: ({ children }) => <em className={PROSE_CLASSES.em}>{children}</em>,
  blockquote: ({ children }) => <blockquote className={PROSE_CLASSES.blockquote}>{children}</blockquote>,
  ul: ({ children }) => <ul className={PROSE_CLASSES.ul}>{children}</ul>,
  ol: ({ children }) => <ol className={PROSE_CLASSES.ol}>{children}</ol>,
  li: ({ children, ...props }) => {
     // react-markdown passes 'ordered' prop to li if it's inside an ol
     // We cast props to any to avoid strict type checking on this internal prop
     const ordered = (props as any).ordered;
     return (
       <li className={ordered ? PROSE_CLASSES.li_ordered : PROSE_CLASSES.li}>{children}</li>
     );
  },
  a: ({ children, href }) => (
    <a className={PROSE_CLASSES.a} href={href ?? "#"} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  // Handle raw text newlines if they appear outside blocks
  // text: ({ children }) => <span className="whitespace-pre-wrap">{children}</span> 
};

type MarkdownProps = {
  content: string;
  className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={clsx("w-full max-w-none", className)}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
