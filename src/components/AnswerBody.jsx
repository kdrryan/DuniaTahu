import ReactMarkdown from 'react-markdown';

const components = {
  p: ({ children }) => (
    <p className="mb-2.5 text-[13.5px] leading-[1.7] text-foreground/75 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
  ul: ({ children }) => <ul className="mb-2.5 space-y-1.5 pl-0.5 last:mb-0">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mb-2.5 list-decimal space-y-1.5 pl-4 text-[13.5px] text-foreground/75 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-[13.5px] leading-[1.65] text-foreground/75">
      <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
      <span>{children}</span>
    </li>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-[15px] font-bold text-foreground first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1.5 mt-3 text-[13.5px] font-semibold text-foreground first:mt-0">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2.5 rounded-xl border-l-2 border-foreground/20 bg-foreground/4 px-3 py-2 text-[13px] italic text-foreground/70">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-foreground/6 px-1 py-0.5 font-mono text-[12px] text-foreground/85">
      {children}
    </code>
  ),
};

export default function AnswerBody({ text }) {
  if (!text) return null;
  return (
    <div>
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  );
}