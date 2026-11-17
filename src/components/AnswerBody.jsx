import ReactMarkdown from 'react-markdown';

const components = {
  p: ({ children }) => (
    <p className="mb-4 text-[14px] leading-[1.8] text-foreground/80 last:mb-0 sm:text-[14px]">{children}</p>
  ),
  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/85">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-2 pl-6 text-[14px] leading-[1.75] text-foreground/80 last:mb-0 sm:text-[14px]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-4 list-decimal space-y-2 pl-6 text-[14px] leading-[1.75] text-foreground/80 last:mb-0 sm:text-[14px]">{children}</ol>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2.5 mt-6 font-display text-[16px] font-bold leading-snug text-foreground first:mt-0 sm:text-[17px]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-[14px] font-bold leading-snug text-foreground first:mt-0 sm:text-[15px]">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-4 rounded-r-xl border-l-[3px] border-blue-500 bg-blue-500/[0.06] px-4 py-3 text-[13px] leading-[1.75] text-foreground/75">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-md bg-foreground/6 px-1.5 py-0.5 font-mono text-[12px] text-foreground/90">{children}</code>
  ),
};

function normalizeMarkdown(value) {
  return String(value)
    .replace(/\r\n?/g, '\n')
    .replace(/([^\n])\s+(#{1,3}\s+)/g, '$1\n\n$2')
    .replace(/[ \t]+•[ \t]*/g, '\n- ')
    .replace(/^\s*-\s+(\d+)\.\s*/gm, '$1. ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function AnswerBody({ text }) {
  if (!text) return null;

  return (
    <div className="break-words">
      <ReactMarkdown components={components}>{normalizeMarkdown(text)}</ReactMarkdown>
    </div>
  );
}
